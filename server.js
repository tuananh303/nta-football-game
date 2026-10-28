// Máy chủ game Luân Lưu 11m: phục vụ giao diện và phòng đấu online (không cần cài thư viện).
// Phòng đấu giữ trong bộ nhớ; hai người chơi nhận diễn biến qua Server-Sent Events.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const PK = require('./public/js/core.js');
const { CLUBS } = require('./public/js/data.js');

const PORT = Number(process.env.PORT || 3100);
const PUBLIC_DIR = path.join(__dirname, 'public');
const KICK_SECONDS = 20;      // thời gian chọn cho mỗi lượt sút
const ANIM_MS = 3200;         // thời gian trình duyệt diễn hoạt quả sút trước lượt kế tiếp
const ROOM_IDLE_MS = 30 * 60 * 1000;
const MAX_ROOMS = 500;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8'
};
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
};

// ================== Phòng đấu ==================
const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm: I, O, 0, 1

function newCode() {
  for (let i = 0; i < 50; i++) {
    let c = '';
    for (let j = 0; j < 4; j++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
  return null;
}
const token = () => crypto.randomBytes(16).toString('hex');
const cleanName = (n) => String(n || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20) || 'Người chơi';
const rand = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;

function seatOf(room, tok) {
  if (typeof tok !== 'string') return -1;
  return room.players.findIndex((p) => p && p.token === tok);
}

// Trạng thái gửi cho từng người: không lộ lựa chọn đang chờ của đối thủ
function view(room, seat) {
  const so = room.so;
  return {
    code: room.code,
    you: seat,
    phase: room.phase,
    players: room.players.map((p) => p && { name: p.name, connected: p.clients.size > 0, club: p.club, order: p.order, rematch: p.rematch }),
    so: so && { kicks: so.kicks, turn: so.turn, first: so.first, done: so.done, winner: so.winner },
    kick: room.kick && {
      n: room.kick.n, shooter: room.kick.shooter, left: Math.max(0, room.kick.deadline - Date.now()),
      shotIn: !!room.kick.shot, diveIn: !!room.kick.dive,
      mine: seat === room.kick.shooter ? (room.kick.shot ? 'shot' : null) : (room.kick.dive ? 'dive' : null)
    },
    last: room.last
  };
}

function broadcast(room) {
  room.players.forEach((p, seat) => {
    if (!p) return;
    const data = `data: ${JSON.stringify(view(room, seat))}\n\n`;
    p.clients.forEach((res) => res.write(data));
  });
}

function touch(room) { room.lastActive = Date.now(); }

function startMatch(room) {
  room.phase = 'play';
  room.so = PK.newShootout(rand() < 0.5 ? 0 : 1);
  room.last = null;
  room.players.forEach((p) => { p.rematch = false; });
  nextKick(room, 1500);
}

function nextKick(room, delay) {
  clearTimeout(room.timer);
  const n = room.kick ? room.kick.n + 1 : 1;
  room.kick = { n, shooter: room.so.turn, shot: null, dive: null, deadline: Date.now() + delay + KICK_SECONDS * 1000 };
  room.timer = setTimeout(() => autoFill(room, n), delay + KICK_SECONDS * 1000);
}

// Hết giờ: người chưa chọn sẽ được máy chọn hộ
function autoFill(room, n) {
  const k = room.kick;
  if (!k || k.n !== n || room.phase !== 'play') return;
  const shooterClub = CLUBS[room.players[k.shooter].club];
  const taker = currentTaker(room, k.shooter, shooterClub);
  if (!k.shot) k.shot = PK.aiShot(taker.pen, rand);
  if (!k.dive) k.dive = PK.aiDive(rand);
  resolveKick(room);
}

function currentTaker(room, seat, club) {
  const order = room.players[seat].order;
  const i = PK.takerIndex(room.so, seat, order.length);
  return club.takers[order[i]];
}

function resolveKick(room) {
  const k = room.kick;
  clearTimeout(room.timer);
  const s = k.shooter;
  const shooterClub = CLUBS[room.players[s].club];
  const keeperClub = CLUBS[room.players[1 - s].club];
  const taker = currentTaker(room, s, shooterClub);
  const res = PK.resolve(k.shot, taker.pen, k.dive, keeperClub.gk.rating, rand);
  PK.record(room.so, res.scored);
  room.last = { n: k.n, shooter: s, taker: taker.name, keeper: keeperClub.gk.name, shot: PK.cleanShot(k.shot), ...res };
  if (room.so.done) {
    room.phase = 'over';
    room.kick = { n: k.n, shooter: s, shot: k.shot, dive: k.dive, deadline: 0 };
  } else {
    nextKick(room, ANIM_MS);
  }
  broadcast(room);
}

function validOrder(club, order) {
  if (!Array.isArray(order) || order.length !== club.takers.length) return false;
  const seen = new Set(order);
  return seen.size === order.length && order.every((i) => Number.isInteger(i) && i >= 0 && i < club.takers.length);
}

function act(room, seat, body) {
  const me = room.players[seat];
  switch (body.type) {
    case 'pick': {
      if (room.phase !== 'pick') return 'Chưa tới lúc chọn đội.';
      const club = CLUBS[body.club];
      if (!club) return 'Câu lạc bộ không hợp lệ.';
      const order = body.order && body.order.map(Number);
      if (!validOrder(club, order)) return 'Thứ tự sút không hợp lệ.';
      me.club = club.id;
      me.order = order;
      if (room.players.every((p) => p && p.club)) startMatch(room);
      return null;
    }
    case 'unpick':
      if (room.phase !== 'pick') return 'Trận đấu đã bắt đầu.';
      me.club = null;
      me.order = null;
      return null;
    case 'shot':
    case 'dive': {
      const k = room.kick;
      if (room.phase !== 'play' || !k) return 'Trận đấu chưa diễn ra.';
      if (Number(body.n) !== k.n) return 'Lượt sút đã qua.';
      if (body.type === 'shot') {
        if (seat !== k.shooter) return 'Không phải lượt sút của bạn.';
        if (!k.shot) k.shot = PK.cleanShot(body);
      } else {
        if (seat === k.shooter) return 'Bạn đang là người sút.';
        if (!k.dive) k.dive = PK.cleanDive(body);
      }
      if (k.shot && k.dive) resolveKick(room);
      return null;
    }
    case 'rematch':
      if (room.phase !== 'over') return 'Trận đấu chưa kết thúc.';
      me.rematch = true;
      if (room.players.every((p) => p && p.rematch)) {
        room.phase = 'pick';
        room.so = null;
        room.kick = null;
        room.last = null;
        room.players.forEach((p) => { p.club = null; p.order = null; p.rematch = false; });
      }
      return null;
    default:
      return 'Thao tác không hợp lệ.';
  }
}

// Dọn phòng bỏ không
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, code) => {
    const online = room.players.some((p) => p && p.clients.size > 0);
    if (now - room.lastActive > ROOM_IDLE_MS || (!online && now - room.lastActive > 10 * 60 * 1000)) {
      clearTimeout(room.timer);
      room.players.forEach((p) => p && p.clients.forEach((res) => res.end()));
      rooms.delete(code);
    }
  });
}, 60 * 1000).unref();

// ================== HTTP ==================
function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 4096) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

function newPlayer(name) {
  return { name: cleanName(name), token: token(), clients: new Set(), club: null, order: null, rematch: false };
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api','rooms',CODE,'join']
  if (parts[1] !== 'rooms') return send(res, 404, { error: 'Không tìm thấy.' });

  // Tạo phòng
  if (req.method === 'POST' && parts.length === 2) {
    const body = await readBody(req);
    if (rooms.size >= MAX_ROOMS) return send(res, 503, { error: 'Máy chủ đang quá tải, thử lại sau.' });
    const code = newCode();
    if (!code) return send(res, 503, { error: 'Không tạo được phòng, thử lại.' });
    const host = newPlayer(body.name);
    const room = { code, players: [host, null], phase: 'lobby', so: null, kick: null, last: null, timer: null, lastActive: Date.now() };
    rooms.set(code, room);
    return send(res, 200, { code, token: host.token, seat: 0 });
  }

  const room = rooms.get(String(parts[2] || '').toUpperCase());
  if (!room) return send(res, 404, { error: 'Không tìm thấy phòng. Kiểm tra lại mã phòng.' });
  touch(room);

  // Vào phòng
  if (req.method === 'POST' && parts[3] === 'join') {
    const body = await readBody(req);
    const seat = seatOf(room, body.token);
    if (seat >= 0) return send(res, 200, { code: room.code, token: body.token, seat }); // vào lại
    if (room.players[1]) return send(res, 409, { error: 'Phòng đã đủ 2 người.' });
    const guest = newPlayer(body.name);
    room.players[1] = guest;
    room.phase = 'pick';
    broadcast(room);
    return send(res, 200, { code: room.code, token: guest.token, seat: 1 });
  }

  // Nhận diễn biến trận đấu
  if (req.method === 'GET' && parts[3] === 'events') {
    const seat = seatOf(room, url.searchParams.get('token'));
    if (seat < 0) return send(res, 403, { error: 'Bạn không ở trong phòng này.' });
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx: không gom dữ liệu lại
      ...SECURITY_HEADERS
    });
    res.write('retry: 2000\n\n');
    const p = room.players[seat];
    p.clients.add(res);
    broadcast(room);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => {
      clearInterval(ping);
      p.clients.delete(res);
      if (rooms.has(room.code)) broadcast(room);
    });
    return;
  }

  // Thao tác trong trận
  if (req.method === 'POST' && parts[3] === 'action') {
    const body = await readBody(req);
    const seat = seatOf(room, body.token);
    if (seat < 0) return send(res, 403, { error: 'Bạn không ở trong phòng này.' });
    const err = act(room, seat, body);
    if (err) return send(res, 400, { error: err });
    broadcast(room);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'Không tìm thấy.' });
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      return res.end('Không tìm thấy trang.');
    }
    const etag = `"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ETag: etag,
      ...SECURITY_HEADERS
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); return res.end(); }
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    serveStatic(req, res, url);
  } catch (err) {
    if (!res.headersSent) send(res, 400, { error: 'Yêu cầu không hợp lệ.' });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Luân Lưu 11m chạy tại http://localhost:${PORT}`);
  // In địa chỉ trong mạng nội bộ để người chơi ở máy khác vào được
  Object.values(os.networkInterfaces()).flat().forEach((n) => {
    if (n && n.family === 'IPv4' && !n.internal) console.log(`  Máy khác trong cùng mạng: http://${n.address}:${PORT}`);
  });
});

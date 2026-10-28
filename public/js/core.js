// Luật chơi dùng chung cho trình duyệt (window.PK) và máy chủ online (require).
// Toạ độ khung thành nhìn từ chấm 11m: x từ -1 (cột trái) đến 1 (cột phải), y từ 0 (mặt sân) đến 1 (xà ngang).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PK = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const HALF_W = 3.66; // nửa chiều rộng khung thành (m)
  const HEIGHT = 2.44; // chiều cao khung thành (m)
  const TAKERS = 5;    // số lượt sút chính thức mỗi đội

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Bộ sinh số ngẫu nhiên có hạt giống (mulberry32)
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    const u = Math.max(1e-9, rand());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  }

  // Làm sạch dữ liệu người chơi gửi lên
  function cleanShot(s) {
    return {
      x: clamp(Number(s && s.x) || 0, -1.2, 1.2),
      y: clamp(Number(s && s.y) || 0, 0, 1.2),
      power: clamp(Number(s && s.power) || 0, 0, 1)
    };
  }
  function cleanDive(d) {
    return { x: clamp(Number(d && d.x) || 0, -1.1, 1.1), y: clamp(Number(d && d.y) || 0, 0, 1.05) };
  }

  // Phân xử một quả sút.
  // shot: { x, y, power } điểm ngắm và lực (0-1); pen: chỉ số sút; dive: { x, y } hướng đổ người; gk: chỉ số thủ môn
  // opts.keeperBoost / opts.shooterBoost: điều chỉnh độ khó khi đấu với máy
  function resolve(shot, pen, dive, gk, rand, opts) {
    opts = opts || {};
    shot = cleanShot(shot);
    dive = cleanDive(dive);
    const skill = clamp((pen - 60) / 35 + (opts.shooterBoost || 0), 0, 1);
    const p = shot.power;

    // Độ lệch: kỹ năng thấp, sút quá mạnh hoặc quá nhẹ đều làm bóng đi lệch
    let spread = 0.045 + (1 - skill) * 0.1;
    if (p > 0.85) spread += (p - 0.85) * 0.9;
    if (p < 0.3) spread += 0.03;
    let bx = shot.x + gauss(rand) * spread;
    let by = shot.y + gauss(rand) * spread * 0.8;
    if (p > 0.8) by += (p - 0.8) * 1.5; // sút căng quá thì bóng bốc cao
    if (by < 0.03) by = 0.03;

    const ball = { x: bx, y: by };
    const out = { ball, power: p, dive, result: 'goal', scored: false, keeper: null };

    // Ra ngoài, dội cột, dội xà
    const ax = Math.abs(bx);
    if (ax > 1.05 || by > 1.07) { out.result = 'miss'; out.keeper = reachPoint(dive, gk, p); return out; }
    if (ax > 0.965 && by <= 1.07) { out.result = 'post'; out.keeper = reachPoint(dive, gk, p); return out; }
    if (by > 0.955) { out.result = 'bar'; out.keeper = reachPoint(dive, gk, p); return out; }

    // Thủ môn: tầm với giảm khi bóng đi căng, bóng nhẹ dễ bắt hơn
    const g = clamp((gk - 65) / 25 + (opts.keeperBoost || 0), 0, 1.2);
    let reach = (0.78 + g * 0.45) * (1.18 - 0.5 * p);
    if (p < 0.3) reach *= 1.35;
    const dx = (bx - dive.x) * HALF_W;
    const dy = (by - dive.y) * HEIGHT;
    const dist = Math.hypot(dx, dy);
    let saveP;
    if (dist < reach * 0.55) saveP = 0.94;
    else if (dist < reach) saveP = 0.94 - ((dist - reach * 0.55) / (reach * 0.45)) * 0.78;
    else if (dist < reach * 1.25) saveP = 0.06;
    else saveP = 0;
    // Góc chết sát cột, sát xà: khó cứu hơn
    if (ax > 0.82 && by > 0.7) saveP *= 0.55;
    // Sút thấp vào giữa: chân thủ môn đang đổ người vẫn có thể chặn được
    if (ax < 0.22 && by < 0.3) saveP = Math.max(saveP, 0.25);

    out.keeper = reachPoint(dive, gk, p);
    if (rand() < saveP) {
      out.result = 'save';
      out.keeper = { x: bx, y: by };
    } else {
      out.result = 'goal';
      out.scored = true;
    }
    return out;
  }
  // Điểm tay thủ môn chạm tới (để vẽ khi đổ người)
  function reachPoint(dive) { return { x: dive.x, y: dive.y }; }

  // ---------- Loạt sút luân lưu ----------
  function newShootout(first) {
    return { kicks: [[], []], turn: first || 0, first: first || 0, done: false, winner: null };
  }
  function goals(so, t) { return so.kicks[t].filter(Boolean).length; }
  function record(so, scored) {
    if (so.done) return so;
    so.kicks[so.turn].push(!!scored);
    const a = so.kicks[0].length, b = so.kicks[1].length;
    const ga = goals(so, 0), gb = goals(so, 1);
    if (a <= TAKERS && b <= TAKERS && !(a === TAKERS && b === TAKERS && ga === gb)) {
      // 5 lượt chính: dừng sớm khi một đội không thể bắt kịp
      const ra = TAKERS - a, rb = TAKERS - b;
      if (ga > gb + rb) finish(so, 0);
      else if (gb > ga + ra) finish(so, 1);
      else if (a === TAKERS && b === TAKERS) finish(so, ga > gb ? 0 : 1);
    } else if (a === b && a > TAKERS && ga !== gb) {
      finish(so, ga > gb ? 0 : 1); // loạt sút đột tử
    }
    if (!so.done) so.turn = 1 - so.turn;
    return so;
  }
  function finish(so, w) { so.done = true; so.winner = w; }
  // Lượt sút thứ mấy của đội t (để chọn người sút, quay vòng khi hết danh sách)
  function takerIndex(so, t, n) { return so.kicks[t].length % n; }

  // ---------- Máy chơi ----------
  const LEVELS = {
    easy: { aiShooter: -0.25, aiKeeper: -0.3, userKeeper: 0.15, read: 0 },
    normal: { aiShooter: 0, aiKeeper: 0, userKeeper: 0, read: 0.12 },
    hard: { aiShooter: 0.15, aiKeeper: 0.2, userKeeper: -0.1, read: 0.28 }
  };

  // Máy chọn điểm sút và lực
  function aiShot(pen, rand) {
    const skill = clamp((pen - 60) / 35, 0, 1);
    const r = rand();
    if (r < 0.07) return { x: (rand() - 0.5) * 0.3, y: 0.3 + rand() * 0.5, power: 0.55 + rand() * 0.25 }; // sút giữa
    const side = rand() < 0.5 ? -1 : 1;
    const x = side * (0.5 + rand() * (0.3 + skill * 0.12));
    const y = rand() < 0.55 ? 0.1 + rand() * 0.3 : 0.45 + rand() * 0.4;
    const power = clamp(0.55 + rand() * 0.28 + (rand() < 0.08 ? 0.15 : 0), 0, 1);
    return { x, y, power };
  }
  // Máy chọn hướng đổ người; read > 0 thì đôi khi đọc đúng hướng sút
  function aiDive(rand, shot, read) {
    if (shot && rand() < (read || 0)) {
      return { x: clamp(shot.x + (rand() - 0.5) * 0.3, -1, 1), y: clamp(shot.y + (rand() - 0.5) * 0.3, 0, 1) };
    }
    const r = rand();
    const x = r < 0.15 ? (rand() - 0.5) * 0.2 : (r < 0.575 ? -1 : 1) * (0.45 + rand() * 0.4);
    return { x, y: 0.15 + rand() * 0.6 };
  }

  // Mô phỏng nhanh cả loạt sút giữa hai CLB (dùng cho các trận máy-máy trong giải)
  function simulate(clubA, clubB, rand) {
    const so = newShootout(rand() < 0.5 ? 0 : 1);
    const clubs = [clubA, clubB];
    let guard = 0;
    while (!so.done && guard++ < 1000) {
      const t = so.turn;
      const taker = clubs[t].takers[takerIndex(so, t, clubs[t].takers.length)];
      const shot = aiShot(taker.pen, rand);
      const res = resolve(shot, taker.pen, aiDive(rand), clubs[1 - t].gk.rating, rand);
      record(so, res.scored);
    }
    return so;
  }

  return { HALF_W, HEIGHT, TAKERS, LEVELS, clamp, rng, resolve, cleanShot, cleanDive, newShootout, record, goals, takerIndex, aiShot, aiDive, simulate };
});

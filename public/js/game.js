// Các màn hình: trang chủ, chọn CLB, đấu với máy, giải đấu mini, phòng online.
import { Match } from './match.js';
import { sound } from './sound.js';
import { esc, badge, toast, api, defaultOrder } from './ui.js';

const PK = window.PK;
const { LEAGUES, CLUBS, SEASON } = window.PK_DATA;
const app = document.getElementById('app');
const ALL_CLUBS = LEAGUES.flatMap((l) => l.clubs);
const LEVEL_NAMES = { easy: 'Dễ', normal: 'Thường', hard: 'Khó' };

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }
};
const settings = {
  level: store.get('pk.level', 'normal'),
  league: store.get('pk.league', 'epl'),
  name: store.get('pk.name', '')
};
if (!LEVEL_NAMES[settings.level]) settings.level = 'normal';

let cleanup = null; // dọn màn hình trước (dừng trận, đóng kết nối)
function screen(html) {
  if (cleanup) { cleanup(); cleanup = null; }
  app.innerHTML = html;
  window.scrollTo(0, 0);
}
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ================== Trang chủ ==================
function home(prefillCode) {
  screen(`
    <section class="page home">
      <div class="hero">
        <p class="eyebrow">Mùa ${SEASON} · ${ALL_CLUBS.length} CLB · 4 giải</p>
        <h1>Loạt sút luân lưu 11m</h1>
        <p class="lead">Chọn CLB ở Ngoại hạng Anh, La Liga, Bundesliga hoặc Serie A, xếp thứ tự 5 người sút rồi đấu tới quả cuối cùng. Khi sút: ngắm góc rồi canh thanh lực. Khi bắt: đoán hướng đổ người.</p>
        <div class="level" role="radiogroup" aria-label="Độ khó của máy">
          <span class="level-label">Độ khó máy</span>
          ${Object.entries(LEVEL_NAMES).map(([k, v]) => `<button type="button" role="radio" class="seg ${settings.level === k ? 'on' : ''}" aria-checked="${settings.level === k}" data-level="${k}">${v}</button>`).join('')}
        </div>
      </div>
      <div class="modes">
        <article class="mode">
          <h2>Đấu với máy</h2>
          <p>Bạn chọn CLB, rồi chọn đối thủ hoặc để máy chọn ngẫu nhiên.</p>
          <button class="btn primary" type="button" data-go="ai">Chọn đội</button>
        </article>
        <article class="mode">
          <h2>Giải đấu mini</h2>
          <p>8 đội loại trực tiếp: tứ kết, bán kết, chung kết. Các trận khác máy tự đá.</p>
          <button class="btn primary" type="button" data-go="cup">Bắt đầu giải</button>
        </article>
        <article class="mode online">
          <h2>Đấu online</h2>
          <p>Tạo phòng, gửi mã 4 ký tự hoặc link cho bạn ở máy khác.</p>
          <label class="field-label" for="pname">Tên của bạn</label>
          <input class="field" id="pname" maxlength="20" autocomplete="nickname" placeholder="VD: Tuấn Anh" value="${esc(settings.name)}">
          <button class="btn primary" type="button" data-go="create">Tạo phòng</button>
          <div class="join">
            <label class="sr-only" for="pcode">Mã phòng</label>
            <input class="field code" id="pcode" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Mã phòng" value="${esc(prefillCode || '')}">
            <button class="btn" type="button" data-go="join">Vào phòng</button>
          </div>
        </article>
      </div>
      <details class="howto">
        <summary>Cách chơi</summary>
        <ul>
          <li><b>Sút:</b> chạm vào khung thành để chọn điểm sút, sau đó bấm lần nữa khi vạch lực nằm ở vùng xanh. Sút quá mạnh (vùng đỏ) dễ bay khỏi xà, quá nhẹ dễ bị bắt. Người có chỉ số sút cao ít bị lệch hơn.</li>
          <li><b>Bắt:</b> chạm vào chỗ bạn đoán bóng sẽ tới. Thủ môn chỉ số cao vươn được xa hơn; bóng càng căng càng khó cứu. Góc chết sát xà là khó cứu nhất.</li>
          <li><b>Luật:</b> mỗi đội 5 lượt, dừng sớm khi một đội không thể gỡ kịp. Hoà thì đá đột tử, người sút thứ 6, 7 rồi quay lại từ đầu.</li>
          <li>Bàn phím: phím mũi tên để ngắm, Space hoặc Enter để chốt.</li>
        </ul>
      </details>
    </section>`);

  app.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => {
    settings.level = b.dataset.level;
    store.set('pk.level', settings.level);
    app.querySelectorAll('[data-level]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
  }));
  const nameInput = app.querySelector('#pname');
  const codeInput = app.querySelector('#pcode');
  const getName = () => {
    settings.name = nameInput.value.trim();
    store.set('pk.name', settings.name);
    return settings.name || 'Người chơi';
  };
  codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') app.querySelector('[data-go="join"]').click(); });
  app.querySelector('[data-go="ai"]').addEventListener('click', aiFlow);
  app.querySelector('[data-go="cup"]').addEventListener('click', cupFlow);
  app.querySelector('[data-go="create"]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      const r = await api('/api/rooms', { name: getName() });
      online.open(r.code, r.token);
    } catch (err) { toast(err.message, 'error'); e.target.disabled = false; }
  });
  app.querySelector('[data-go="join"]').addEventListener('click', async (e) => {
    const code = codeInput.value.trim();
    if (code.length !== 4) { toast('Nhập mã phòng 4 ký tự.', 'error'); codeInput.focus(); return; }
    e.target.disabled = true;
    try {
      const saved = online.saved(code);
      const r = await api(`/api/rooms/${code}/join`, { name: getName(), token: saved && saved.token });
      online.open(r.code, r.token);
    } catch (err) { toast(err.message, 'error'); e.target.disabled = false; }
  });
  if (prefillCode) { (settings.name ? codeInput : nameInput).focus(); }
}

// ================== Chọn CLB và thứ tự sút ==================
// opts: { title, step, exclude, confirmLabel, allowRandom, onPick({ club, order }), onBack }
function pickClub(opts) {
  let league = LEAGUES.find((l) => l.id === settings.league) || LEAGUES[0];
  let club = null;
  let order = null;
  let query = '';

  screen(`
    <section class="page picker">
      <div class="page-head">
        <button class="btn ghost back" type="button" data-back>← Quay lại</button>
        <div>
          ${opts.step ? `<p class="eyebrow">${esc(opts.step)}</p>` : ''}
          <h1>${esc(opts.title)}</h1>
        </div>
        ${opts.allowRandom ? '<button class="btn" type="button" data-random>Ngẫu nhiên</button>' : ''}
      </div>
      <div class="picker-layout">
        <div class="picker-main">
          <div class="league-tabs" role="tablist" aria-label="Giải đấu">
            ${LEAGUES.map((l) => `<button type="button" role="tab" class="league-tab" data-league="${l.id}">${esc(l.name)}<span>${l.clubs.length}</span></button>`).join('')}
          </div>
          <input class="field search" type="search" placeholder="Tìm CLB hoặc cầu thủ…" aria-label="Tìm CLB hoặc cầu thủ">
          <div class="club-grid" data-grid></div>
        </div>
        <aside class="squad" data-squad aria-live="polite">
          <div class="squad-empty">Chọn một CLB để xem đội hình và xếp thứ tự sút.</div>
        </aside>
      </div>
    </section>`);

  const grid = app.querySelector('[data-grid]');
  const squad = app.querySelector('[data-squad]');

  function renderTabs() {
    app.querySelectorAll('[data-league]').forEach((t) => {
      const on = !query && t.dataset.league === league.id;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on);
    });
  }
  function renderGrid() {
    const q = query.toLowerCase();
    const list = q
      ? ALL_CLUBS.filter((c) => c.name.toLowerCase().includes(q) || c.takers.some((p) => p.name.toLowerCase().includes(q)) || c.gk.name.toLowerCase().includes(q))
      : league.clubs;
    grid.innerHTML = list.length
      ? list.map((c) => {
        const off = opts.exclude && opts.exclude.includes(c.id);
        return `<button type="button" class="club ${club && club.id === c.id ? 'on' : ''}" data-club="${c.id}" ${off ? 'disabled title="Đã được chọn"' : ''}>
          ${badge(c, 'md')}<span class="club-name">${esc(c.name)}</span>
          <span class="club-meta">${q ? esc(LEAGUES.find((l) => l.id === c.league).name) : `Sút ${avg(c)} · TM ${c.gk.rating}`}</span>
        </button>`;
      }).join('')
      : '<p class="muted">Không tìm thấy CLB hoặc cầu thủ nào.</p>';
  }
  function renderSquad() {
    if (!club) return;
    squad.innerHTML = `
      <div class="squad-head">${badge(club, 'lg')}<div><h2>${esc(club.name)}</h2><p class="muted">${esc(LEAGUES.find((l) => l.id === club.league).name)} · ${SEASON}</p></div></div>
      <div class="gk-row"><span class="pos">TM</span><span class="pname">${esc(club.gk.name)}</span><span class="rating">${club.gk.rating}</span></div>
      <p class="squad-tip">Thứ tự sút. Bấm ↑ để đưa cầu thủ lên trước. Người 6, 7 sút khi đá đột tử.</p>
      <ol class="takers">
        ${order.map((idx, i) => {
          const p = club.takers[idx];
          return `<li class="${i >= PK.TAKERS ? 'reserve' : ''}">
            <span class="num">${i + 1}</span>
            <span class="pname">${esc(p.name)}</span>
            <span class="bar" aria-hidden="true"><i style="width:${Math.round(((p.pen - 60) / 35) * 100)}%"></i></span>
            <span class="rating" title="Chỉ số sút 11m">${p.pen}</span>
            <button type="button" class="btn sm icon-only ghost" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Đưa ${esc(p.name)} lên trước">↑</button>
          </li>`;
        }).join('')}
      </ol>
      <div class="squad-actions">
        <button type="button" class="btn ghost sm" data-reset>Xếp theo chỉ số</button>
        <button type="button" class="btn primary" data-confirm>${esc(opts.confirmLabel || 'Chọn đội này')}</button>
      </div>`;
    squad.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.up);
      [order[i - 1], order[i]] = [order[i], order[i - 1]];
      renderSquad();
      squad.querySelector(`[data-up="${i - 1}"]`)?.focus() || squad.querySelector('[data-up="1"]')?.focus();
    }));
    squad.querySelector('[data-reset]').addEventListener('click', () => { order = defaultOrder(club); renderSquad(); });
    squad.querySelector('[data-confirm]').addEventListener('click', () => opts.onPick({ club, order: order.slice() }));
  }
  function selectClub(c) {
    club = c;
    order = defaultOrder(c);
    renderGrid();
    renderSquad();
    if (window.matchMedia('(max-width: 860px)').matches) squad.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  app.querySelectorAll('[data-league]').forEach((t) => t.addEventListener('click', () => {
    league = LEAGUES.find((l) => l.id === t.dataset.league);
    settings.league = league.id;
    store.set('pk.league', league.id);
    query = '';
    app.querySelector('.search').value = '';
    renderTabs();
    renderGrid();
  }));
  app.querySelector('.search').addEventListener('input', (e) => { query = e.target.value.trim(); renderTabs(); renderGrid(); });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-club]');
    if (b && !b.disabled) selectClub(CLUBS[b.dataset.club]);
  });
  app.querySelector('[data-back]').addEventListener('click', opts.onBack || (() => home()));
  app.querySelector('[data-random]')?.addEventListener('click', () => {
    const c = pickRandom(ALL_CLUBS.filter((x) => !(opts.exclude || []).includes(x.id)));
    opts.onPick({ club: c, order: defaultOrder(c) });
  });
  renderTabs();
  renderGrid();
}
const avg = (c) => Math.round(c.takers.slice().sort((a, b) => b.pen - a.pen).slice(0, 5).reduce((s, p) => s + p.pen, 0) / 5);

// ================== Màn hình trận đấu ==================
function matchScreen(teams, opts) {
  screen(`<section class="page match-page">
    <div class="page-head slim">
      <button class="btn ghost back" type="button" data-quit>← ${esc(opts.quitLabel || 'Rời trận')}</button>
      <p class="eyebrow">${esc(opts.label || '')}</p>
      <button class="btn ghost icon-only sound" type="button" data-sound aria-label="Bật / tắt âm thanh"></button>
    </div>
    <div data-match></div>
  </section>`);
  const soundBtn = app.querySelector('[data-sound]');
  const paintSound = () => { soundBtn.textContent = sound.on ? '🔊' : '🔇'; soundBtn.setAttribute('aria-pressed', sound.on); };
  paintSound();
  soundBtn.addEventListener('click', () => { sound.toggle(); paintSound(); });
  const m = new Match(app.querySelector('[data-match]'), { teams, ...opts });
  app.querySelector('[data-quit]').addEventListener('click', () => {
    if (m.phase === 'over' || confirm('Rời trận đấu đang diễn ra?')) (opts.onQuit || home)();
  });
  cleanup = () => m.destroy();
  return m;
}

// ================== Đấu với máy ==================
function aiFlow() {
  pickClub({
    title: 'Chọn CLB của bạn', step: 'Bước 1/2 · Đấu với máy',
    onPick: (me) => pickClub({
      title: 'Chọn đối thủ', step: 'Bước 2/2 · Đấu với máy', exclude: [me.club.id], allowRandom: true, confirmLabel: 'Vào sân',
      onBack: aiFlow,
      onPick: (opp) => playAi(me, { club: opp.club, order: defaultOrder(opp.club) })
    })
  });
}

function playAi(me, opp) {
  const teams = [{ ...me, human: true, name: settings.name || 'Bạn' }, { ...opp, human: false, name: `Máy · ${LEVEL_NAMES[settings.level]}` }];
  const m = matchScreen(teams, {
    mode: 'ai', level: settings.level, label: `Đấu với máy · ${LEVEL_NAMES[settings.level]}`,
    onEnd: (so) => {
      const won = so.winner === 0;
      m.showOverlay(won ? 'Bạn thắng!' : 'Bạn thua', `${teams[0].club.name} ${m.scoreLine()} ${teams[1].club.name}`, [
        { label: 'Đá lại', primary: true, onClick: () => playAi(me, opp) },
        { label: 'Đổi đội', onClick: aiFlow },
        { label: 'Về trang chủ', onClick: () => home() }
      ]);
    }
  });
}

// ================== Giải đấu mini ==================
const ROUND_NAMES = ['Tứ kết', 'Bán kết', 'Chung kết'];
let cup = null;

function cupFlow() {
  pickClub({
    title: 'Chọn CLB dự giải', step: 'Giải đấu mini · 8 đội',
    onPick: (me) => {
      const others = shuffle(ALL_CLUBS.filter((c) => c.id !== me.club.id)).slice(0, 7);
      const teams = [{ club: me.club, order: me.order, human: true }, ...others.map((c) => ({ club: c, order: defaultOrder(c), human: false }))];
      const seeds = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7])];
      cup = { teams, level: settings.level, rounds: [[0, 1, 2, 3].map((i) => ({ a: seeds[i * 2], b: seeds[i * 2 + 1], so: null }))], round: 0 };
      bracket();
    }
  });
}

const alive = () => cup.rounds[cup.round].some((m) => m.a === 0 || m.b === 0);

function simulateMatch(m) {
  m.so = PK.simulate(cup.teams[m.a].club, cup.teams[m.b].club, Math.random);
  m.winner = m.so.winner === 0 ? m.a : m.b;
}
// Đá xong vòng hiện tại: máy đá các trận còn lại, tạo vòng sau
function closeRound() {
  const r = cup.rounds[cup.round];
  r.forEach((m) => { if (!m.so) simulateMatch(m); });
  if (r.length === 1) { cup.champion = r[0].winner; return; }
  const next = [];
  for (let i = 0; i < r.length; i += 2) next.push({ a: r[i].winner, b: r[i + 1].winner, so: null });
  cup.rounds.push(next);
  cup.round++;
}

function bracket() {
  const userMatch = !cup.champion && cup.rounds[cup.round].find((m) => m.a === 0 || m.b === 0);
  const out = !cup.champion && !userMatch;
  const champ = cup.champion != null ? cup.teams[cup.champion] : null;
  const score = (m) => m.so ? `${PK.goals(m.so, 0)}–${PK.goals(m.so, 1)}` : '';
  const row = (m, side) => {
    const idx = side === 'a' ? m.a : m.b;
    const t = cup.teams[idx];
    const g = m.so ? PK.goals(m.so, side === 'a' ? 0 : 1) : '';
    return `<div class="b-team ${m.winner === idx ? 'win' : m.so ? 'lose' : ''} ${idx === 0 ? 'me' : ''}">${badge(t.club, 'sm')}<span>${esc(t.club.name)}</span><b>${g}</b></div>`;
  };
  screen(`
    <section class="page cup">
      <div class="page-head">
        <button class="btn ghost back" type="button" data-back>← Trang chủ</button>
        <div><p class="eyebrow">Giải đấu mini · Độ khó ${LEVEL_NAMES[cup.level]}</p><h1>${champ ? `${esc(champ.club.name)} vô địch!` : out ? 'Bạn đã bị loại' : ROUND_NAMES[cup.round]}</h1></div>
      </div>
      <div class="bracket">
        ${ROUND_NAMES.map((name, ri) => `
          <div class="b-round">
            <h2>${name}</h2>
            ${(cup.rounds[ri] || Array.from({ length: 4 >> ri }, () => null)).map((m) => m
              ? `<div class="b-match" ${m.so ? `title="Luân lưu ${score(m)}"` : ''}>${row(m, 'a')}${row(m, 'b')}</div>`
              : '<div class="b-match tbd"><div class="b-team"><span>Chờ xác định</span></div><div class="b-team"><span>Chờ xác định</span></div></div>').join('')}
          </div>`).join('')}
        <div class="b-round champ"><h2>Vô địch</h2><div class="b-champ">${champ ? `${badge(champ.club, 'lg')}<b>${esc(champ.club.name)}</b>` : '<span class="muted">?</span>'}</div></div>
      </div>
      <div class="cup-actions">
        ${userMatch ? `<button class="btn primary" type="button" data-play>Đá trận ${ROUND_NAMES[cup.round].toLowerCase()} gặp ${esc(cup.teams[userMatch.a === 0 ? userMatch.b : userMatch.a].club.name)}</button>` : ''}
        ${out ? '<button class="btn primary" type="button" data-sim>Xem kết quả các vòng còn lại</button>' : ''}
        ${champ || out ? '<button class="btn" type="button" data-new>Giải mới</button>' : ''}
      </div>
    </section>`);
  app.querySelector('[data-back]').addEventListener('click', () => home());
  app.querySelector('[data-new]')?.addEventListener('click', cupFlow);
  app.querySelector('[data-sim]')?.addEventListener('click', () => { while (cup.champion == null) closeRound(); bracket(); });
  app.querySelector('[data-play]')?.addEventListener('click', () => playCup(userMatch));
}

function playCup(cm) {
  // Người chơi luôn là đội bên trái màn hình
  const meFirst = cm.a === 0;
  const oppIdx = meFirst ? cm.b : cm.a;
  const teams = [{ ...cup.teams[0], name: settings.name || 'Bạn' }, { ...cup.teams[oppIdx], name: 'Máy' }];
  const m = matchScreen(teams, {
    mode: 'ai', level: cup.level, label: `Giải đấu mini · ${ROUND_NAMES[cup.round]}`, quitLabel: 'Về bảng đấu', onQuit: bracket,
    onEnd: (so) => {
      // Lưu kết quả theo thứ tự a / b của bảng đấu
      cm.so = meFirst ? so : { kicks: [so.kicks[1], so.kicks[0]], winner: 1 - so.winner, done: true };
      cm.winner = so.winner === 0 ? 0 : oppIdx;
      const won = so.winner === 0;
      const final = cup.round === ROUND_NAMES.length - 1;
      closeRound();
      m.showOverlay(won ? (final ? 'Vô địch!' : 'Đi tiếp!') : 'Dừng bước', `${teams[0].club.name} ${m.scoreLine()} ${teams[1].club.name}`, [
        { label: 'Xem bảng đấu', primary: true, onClick: bracket }
      ]);
    }
  });
}

// ================== Đấu online ==================
const online = {
  es: null, code: null, token: null, view: null, match: null, screenKind: null,

  saved(code) {
    try { const s = JSON.parse(sessionStorage.getItem('pk.online') || 'null'); return s && s.code === code ? s : null; } catch (e) { return null; }
  },
  open(code, token) {
    this.code = code;
    this.token = token;
    try { sessionStorage.setItem('pk.online', JSON.stringify({ code, token })); } catch (e) { /* bỏ qua */ }
    history.replaceState(null, '', `?room=${code}`);
    this.connect();
  },
  connect() {
    this.close();
    this.screenKind = null;
    screen('<section class="page"><div class="loading"><div class="spinner" role="img" aria-label="Đang kết nối"></div></div></section>');
    cleanup = () => this.close();
    const es = new EventSource(`/api/rooms/${this.code}/events?token=${encodeURIComponent(this.token)}`);
    this.es = es;
    es.onmessage = (e) => {
      const v = JSON.parse(e.data);
      v.receivedAt = Date.now();
      this.handle(v);
    };
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) this.lost();
    };
  },
  close() {
    if (this.es) { this.es.close(); this.es = null; }
    if (this.match) { this.match.destroy(); this.match = null; }
  },
  leave() {
    this.close();
    try { sessionStorage.removeItem('pk.online'); } catch (e) { /* bỏ qua */ }
    history.replaceState(null, '', location.pathname);
    cleanup = null;
    home();
  },
  lost() {
    this.close();
    cleanup = null;
    screen(`<section class="page"><section class="empty"><h2>Mất kết nối phòng ${esc(this.code)}</h2><p>Phòng có thể đã hết hạn (30 phút không hoạt động) hoặc máy chủ vừa khởi động lại.</p>
      <div class="row"><button class="btn primary" type="button" data-retry>Thử kết nối lại</button><button class="btn" type="button" data-home>Về trang chủ</button></div></section></section>`);
    app.querySelector('[data-retry]').addEventListener('click', () => this.connect());
    app.querySelector('[data-home]').addEventListener('click', () => this.leave());
  },
  send(type, data) {
    return api(`/api/rooms/${this.code}/action`, { token: this.token, type, ...data });
  },

  handle(v) {
    this.view = v;
    const me = v.players[v.you];
    const opp = v.players[1 - v.you];
    if (v.phase === 'lobby') return this.lobby(v);
    if (v.phase === 'pick') {
      if (this.match) { this.match.destroy(); this.match = null; }
      if (!me.club) {
        if (this.screenKind !== 'pick') this.pick(v);
        else this.paintOpp(opp);
      } else this.waitPick(v);
      return;
    }
    // Đang đá hoặc đã đá xong
    if (!this.match) this.startMatch(v);
    this.match.update(v);
    this.paintOpp(opp);
  },

  // Đổi màn hình trong phòng mà không đóng kết nối
  detach() { cleanup = null; },

  lobby(v) {
    this.screenKind = 'lobby';
    this.detach();
    const link = `${location.origin}/?room=${v.code}`;
    screen(`
      <section class="page room">
        <div class="room-card">
          <p class="eyebrow">Phòng đấu online</p>
          <h1>Mã phòng</h1>
          <div class="room-code" aria-label="Mã phòng ${esc(v.code)}">${[...v.code].map((c) => `<span>${esc(c)}</span>`).join('')}</div>
          <p>Gửi mã này hoặc link bên dưới cho bạn ở máy khác. Trận đấu bắt đầu khi bạn ấy vào phòng.</p>
          <div class="invite"><input class="field" readonly value="${esc(link)}" aria-label="Link mời"><button class="btn" type="button" data-copy>Sao chép</button></div>
          <p class="muted waiting"><span class="pulse" aria-hidden="true"></span> Đang chờ đối thủ…</p>
          <button class="btn ghost" type="button" data-leave>Rời phòng</button>
        </div>
      </section>`);
    cleanup = () => this.close();
    app.querySelector('[data-copy]').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(link); toast('Đã sao chép link mời.'); }
      catch (e) { app.querySelector('.invite input').select(); toast('Hãy sao chép link đang được chọn.', 'error'); }
    });
    app.querySelector('[data-leave]').addEventListener('click', () => this.leave());
  },

  pick(v) {
    this.screenKind = 'pick';
    this.detach();
    const oppPick = v.players[1 - v.you].club;
    pickClub({
      title: 'Chọn CLB của bạn', step: `Phòng ${v.code} · Đấu online`, confirmLabel: 'Chốt đội',
      exclude: oppPick ? [oppPick] : [],
      onBack: () => { if (confirm('Rời phòng đấu?')) this.leave(); },
      onPick: async ({ club, order }) => {
        try { await this.send('pick', { club: club.id, order }); } catch (err) { toast(err.message, 'error'); }
      }
    });
    cleanup = () => this.close();
    const head = app.querySelector('.page-head');
    head.insertAdjacentHTML('beforeend', '<p class="opp-status" data-opp></p>');
    this.paintOpp(v.players[1 - v.you]);
  },

  waitPick(v) {
    this.screenKind = 'wait';
    this.detach();
    const me = v.players[v.you];
    const club = CLUBS[me.club];
    screen(`
      <section class="page room">
        <div class="room-card">
          <p class="eyebrow">Phòng ${esc(v.code)}</p>
          <div class="picked">${badge(club, 'lg')}<h1>${esc(club.name)}</h1></div>
          <p class="muted waiting"><span class="pulse" aria-hidden="true"></span> Đang chờ đối thủ chọn đội…</p>
          <p class="opp-status" data-opp></p>
          <div class="row"><button class="btn" type="button" data-change>Đổi đội</button><button class="btn ghost" type="button" data-leave>Rời phòng</button></div>
        </div>
      </section>`);
    cleanup = () => this.close();
    this.paintOpp(v.players[1 - v.you]);
    app.querySelector('[data-change]').addEventListener('click', () => this.send('unpick').catch((err) => toast(err.message, 'error')));
    app.querySelector('[data-leave]').addEventListener('click', () => this.leave());
  },

  startMatch(v) {
    this.screenKind = 'match';
    this.detach();
    const teams = v.players.map((p, i) => ({ club: CLUBS[p.club], order: p.order, human: i === v.you, name: p.name + (i === v.you ? ' (bạn)' : '') }));
    // Online thì mỗi người tự đặt cảm giác "đội mình" theo seat; bảng tỉ số giữ đúng thứ tự phòng
    this.match = matchScreen(teams, {
      mode: 'online', seat: v.you, label: `Phòng ${v.code} · Đấu online`, quitLabel: 'Rời phòng',
      onQuit: () => this.leave(),
      submit: (type, n, data) => this.send(type, { n, ...data }),
      onEnd: (so, view) => this.ended(so, view)
    });
    // matchScreen đặt cleanup để huỷ trận; online cần đóng cả kết nối
    cleanup = () => this.close();
    app.querySelector('.page-head').insertAdjacentHTML('beforeend', '<span class="opp-status" data-opp></span>');
  },

  ended(so, v) {
    const me = v.players[v.you], opp = v.players[1 - v.you];
    const won = so.winner === v.you;
    const sub = `${CLUBS[v.players[0].club].name} ${this.match.scoreLine()} ${CLUBS[v.players[1].club].name}`;
    const status = me.rematch ? 'Đang chờ đối thủ đồng ý đá lại…' : opp.rematch ? `${opp.name} muốn đá lại!` : '';
    this.match.showOverlay(won ? 'Bạn thắng!' : `${opp.name} thắng`, status ? `${sub} · ${status}` : sub, [
      ...(me.rematch ? [] : [{ label: 'Đá lại', primary: true, onClick: () => this.send('rematch').catch((err) => toast(err.message, 'error')) }]),
      { label: 'Rời phòng', onClick: () => this.leave() }
    ]);
  },

  paintOpp(opp) {
    const el = app.querySelector('[data-opp]');
    if (!el || !opp) return;
    el.textContent = !opp.connected ? `${opp.name} đang mất kết nối…` : opp.club ? `${opp.name} đã chọn ${CLUBS[opp.club].name}` : `${opp.name} đang chọn đội`;
    el.classList.toggle('warn', !opp.connected);
  }
};

// ================== Khởi động ==================
const params = new URLSearchParams(location.search);
const roomCode = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
const saved = roomCode && online.saved(roomCode);
if (saved) online.open(saved.code, saved.token); // tải lại trang giữa trận: vào lại phòng
else home(roomCode);
document.querySelector('[data-home-link]')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (online.es) { if (!confirm('Rời phòng đấu online?')) return; online.leave(); return; }
  history.replaceState(null, '', location.pathname);
  home();
});

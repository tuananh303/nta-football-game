// Một trận luân lưu: bảng tỉ số, canvas, nhận thao tác ngắm / lực / đổ người.
// mode 'ai': máy tính phân xử ngay trong trình duyệt. mode 'online': máy chủ phân xử, trận này chỉ hiển thị.
import { Renderer, pxToGoal, TIMING } from './render.js';
import { sound } from './sound.js';
import { esc, badge, keeperKit } from './ui.js';

const PK = window.PK;
const NUMBERS = [9, 10, 7, 11, 8, 14, 17];
const DIVE_SECONDS = 6;
const POWER_PERIOD = 1.1; // giây cho một lượt lên xuống của thanh lực
const RESULT_TEXT = {
  goal: ['VÀO!', 'goal'],
  save: ['CẢN PHÁ!', 'save'],
  miss: ['RA NGOÀI!', 'miss'],
  post: ['DỘI CỘT!', 'miss'],
  bar: ['DỘI XÀ!', 'miss']
};

export class Match {
  // opts: { teams: [{ club, order, human, name }], mode, level, seat, onEnd(so), submit(type, n, data) }
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.teams = opts.teams;
    this.level = PK.LEVELS[opts.level || 'normal'];
    this.so = PK.newShootout(opts.first ?? (Math.random() < 0.5 ? 0 : 1));
    this.phase = 'intro';
    this.aim = { x: 0, y: 0.45 };
    this.dive = null;
    this.anim = null;
    this.kickN = 0;      // online: lượt đang nhận thao tác
    this.shownN = 0;     // online: lượt đã diễn hoạt
    this.pending = null; // online: trạng thái mới nhận trong lúc đang diễn hoạt
    this.alive = true;
    this.build();
    this.renderer = new Renderer(this.canvas);
    this.bind();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    this.updateHUD();
    if (opts.mode !== 'online') this.startLocal();
  }

  destroy() {
    this.alive = false;
    this.renderer.destroy();
    window.removeEventListener('keydown', this.onKey);
    clearTimeout(this.timer);
  }

  build() {
    const [a, b] = this.teams;
    this.root.innerHTML = `
      <div class="match">
        <div class="scoreboard">
          ${[a, b].map((t, i) => `
            <div class="sb-team sb-${i}" data-team="${i}">
              ${badge(t.club, 'md')}
              <div class="sb-info">
                <span class="sb-name">${esc(t.club.name)}</span>
                <span class="sb-player">${esc(t.name || (t.human ? 'Bạn' : 'Máy'))}</span>
                <span class="dots" data-dots="${i}"></span>
              </div>
              <span class="sb-goals" data-goals="${i}">0</span>
            </div>`).join('<div class="sb-mid"><span class="sb-label">Luân lưu</span><span class="sb-dash">–</span><span class="sb-round" data-round></span></div>')}
        </div>
        <div class="stage">
          <canvas class="pitch" width="960" height="540" aria-label="Sân bóng: khung thành, thủ môn và quả bóng"></canvas>
          <div class="banner" data-banner hidden></div>
          <div class="overlay" data-overlay hidden></div>
        </div>
        <div class="duel">
          <div class="duel-who" data-who></div>
          <div class="duel-hint" data-hint aria-live="polite"></div>
          <div class="duel-timer" data-timer hidden><span></span></div>
        </div>
      </div>`;
    this.canvas = this.root.querySelector('canvas');
    this.$ = (sel) => this.root.querySelector(sel);
  }

  bind() {
    const pos = (e) => pxToGoal(this.renderer.toLogical(e.clientX, e.clientY));
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.phase === 'aim') this.aim = clampAim(pos(e));
      if (this.phase === 'dive' && !this.dive) this.hover = clampAim(pos(e));
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.phase === 'aim') { this.aim = clampAim(pos(e)); this.lockAim(); }
      else if (this.phase === 'power') this.lockPower();
      else if (this.phase === 'dive') this.chooseDive(clampAim(pos(e)));
    });
    this.onKey = (e) => {
      if (!this.alive || (e.target.closest && e.target.closest('input, textarea, select, button, a'))) return;
      const step = 0.08;
      const target = this.phase === 'aim' ? this.aim : this.phase === 'dive' ? (this.hover ||= { x: 0, y: 0.4 }) : null;
      if (target && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') target.x -= step;
        if (e.key === 'ArrowRight') target.x += step;
        if (e.key === 'ArrowUp') target.y += step;
        if (e.key === 'ArrowDown') target.y -= step;
        Object.assign(target, clampAim(target));
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.phase === 'aim') { e.preventDefault(); this.lockAim(); }
        else if (this.phase === 'power') { e.preventDefault(); this.lockPower(); }
        else if (this.phase === 'dive') { e.preventDefault(); this.chooseDive(this.hover || { x: 0, y: 0.4 }); }
      }
    };
    window.addEventListener('keydown', this.onKey);
  }

  // ---------- Khung hình ----------
  loop(now) {
    if (!this.alive) return;
    const s = {
      shooterKit: this.kit,
      keeperKit: this.gkKit
    };
    if (this.phase === 'aim') s.aim = this.aim;
    if (this.phase === 'power') {
      s.aim = this.aim; s.aimLocked = true;
      s.power = this.powerAt(now);
    }
    if (this.phase === 'dive') s.diveMark = this.dive || this.hover;
    if (this.anim) {
      s.shot = this.anim.res;
      s.animT = (now - this.anim.start) / 1000;
      if (this.anim.myDive) s.diveMark = this.anim.myDive;
      if (!this.anim.kicked && s.animT > TIMING.RUN) { this.anim.kicked = true; sound.kick(); }
      if (!this.anim.ended && s.animT > TIMING.TOTAL - 0.9) { this.anim.ended = true; this.showResult(this.anim.res); }
      if (s.animT > TIMING.TOTAL) { const done = this.anim.done; this.anim = null; done(); }
    }
    if (this.timerEnd) {
      const left = Math.max(0, this.timerEnd - Date.now());
      const bar = this.$('[data-timer] span');
      bar.style.width = `${(left / this.timerTotal) * 100}%`;
      if (left <= 0) { const cb = this.onTimeout; this.stopTimer(); cb && cb(); }
    }
    this.renderer.draw(s);
    requestAnimationFrame(this.loop);
  }

  powerAt(now) {
    const t = ((now - this.powerStart) / 1000) / POWER_PERIOD;
    const f = t % 1;
    return f < 0.5 ? f * 2 : 2 - f * 2;
  }

  // ---------- Bảng tỉ số ----------
  updateHUD() {
    const so = this.so;
    [0, 1].forEach((t) => {
      this.$(`[data-goals="${t}"]`).textContent = PK.goals(so, t);
      const kicks = so.kicks[t];
      const total = Math.max(PK.TAKERS, kicks.length, so.kicks[1 - t].length);
      let html = '';
      for (let i = 0; i < total; i++) {
        const k = kicks[i];
        const cls = k === undefined ? '' : k ? 'in' : 'out';
        const label = k === undefined ? 'chưa sút' : k ? 'vào' : 'hỏng';
        html += `<i class="dot ${cls} ${i >= PK.TAKERS ? 'sd' : ''}" title="Lượt ${i + 1}: ${label}"></i>`;
      }
      this.$(`[data-dots="${t}"]`).innerHTML = html;
      this.$(`.sb-${t}`).classList.toggle('active', !so.done && so.turn === t && this.phase !== 'intro');
      this.$(`.sb-${t}`).classList.toggle('won', so.done && so.winner === t);
    });
    const round = Math.max(so.kicks[0].length, so.kicks[1].length);
    const sd = so.kicks[0].length >= PK.TAKERS && so.kicks[1].length >= PK.TAKERS && !so.done;
    this.$('[data-round]').textContent = so.done ? 'Kết thúc' : sd ? 'Đột tử' : `Lượt ${Math.min(PK.TAKERS, round + (so.kicks[so.turn].length === round ? 1 : 0))}/5`;
  }

  setHint(text) { this.$('[data-hint]').textContent = text; }

  // Ai sút, ai bắt ở lượt này
  setDuel(t) {
    const shooter = this.teams[t], keeper = this.teams[1 - t];
    const idx = PK.takerIndex(this.so, t, shooter.order.length);
    const taker = shooter.club.takers[shooter.order[idx]];
    const gk = keeper.club.gk;
    this.taker = taker;
    this.gk = gk;
    this.kit = { c1: shooter.club.c1, c2: shooter.club.c2, number: NUMBERS[shooter.order[idx]] };
    this.gkKit = keeperKit(keeper.club);
    this.$('[data-who]').innerHTML = `
      <span class="who"><span class="who-role">Sút</span><b>${esc(taker.name)}</b><span class="rating">${taker.pen}</span></span>
      <span class="who-vs">vs</span>
      <span class="who"><span class="who-role">Bắt</span><b>${esc(gk.name)}</b><span class="rating">${gk.rating}</span></span>`;
  }

  startTimer(ms, onTimeout) {
    this.timerTotal = ms;
    this.timerEnd = Date.now() + ms;
    this.onTimeout = onTimeout;
    this.$('[data-timer]').hidden = false;
  }
  stopTimer() {
    this.timerEnd = 0;
    this.onTimeout = null;
    this.$('[data-timer]').hidden = true;
  }

  banner(text, cls, ms = 1300) {
    const b = this.$('[data-banner]');
    b.className = `banner ${cls || ''}`;
    b.textContent = text;
    b.hidden = false;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { b.hidden = true; }, ms);
  }

  showResult(res) {
    const [text, cls] = RESULT_TEXT[res.result];
    this.banner(text, cls, 1500);
    sound.crowd(res.result === 'goal' ? this.cheerFor(res) : !this.cheerFor(res));
  }
  // Khán giả "của mình": reo khi đội người chơi ghi bàn hoặc thủ môn người chơi cản được
  cheerFor(res) {
    const human = this.opts.mode === 'online' ? this.opts.seat : this.teams.findIndex((t) => t.human);
    if (human < 0) return res.result === 'goal';
    const shooterIsHuman = this.shooterTeam === human;
    return res.result === 'goal' ? shooterIsHuman : !shooterIsHuman;
  }

  // Khung kết thúc trận: tiêu đề, dòng phụ, các nút
  showOverlay(title, sub, actions) {
    const o = this.$('[data-overlay]');
    o.innerHTML = `
      <div class="overlay-card">
        <h2>${esc(title)}</h2>
        ${sub ? `<p>${esc(sub)}</p>` : ''}
        <div class="overlay-actions">${actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''}" type="button" data-act="${i}">${esc(a.label)}</button>`).join('')}</div>
      </div>`;
    o.hidden = false;
    o.querySelectorAll('[data-act]').forEach((btn) => btn.addEventListener('click', () => actions[Number(btn.dataset.act)].onClick()));
    o.querySelector('.btn.primary')?.focus();
  }
  hideOverlay() { this.$('[data-overlay]').hidden = true; }

  scoreLine() {
    return `${PK.goals(this.so, 0)} – ${PK.goals(this.so, 1)}`;
  }

  // ================== Đấu với máy ==================
  startLocal() {
    const first = this.so.first;
    this.banner(`${this.teams[first].club.name} sút trước`, 'info', 1600);
    sound.whistle();
    this.timer = setTimeout(() => this.nextLocal(), 1700);
  }

  nextLocal() {
    if (!this.alive) return;
    const t = this.so.turn;
    this.shooterTeam = t;
    this.setDuel(t);
    this.dive = null;
    this.hover = null;
    if (this.teams[t].human) {
      this.phase = 'aim';
      this.aim = { x: 0, y: 0.45 };
      this.setHint('Ngắm: di chuột hoặc chạm vào khung thành để chọn điểm sút (phím mũi tên + Space cũng được).');
    } else {
      this.phase = 'dive';
      this.setHint(`Bạn là thủ môn: chạm vào khung thành để chọn hướng đổ người trong ${DIVE_SECONDS} giây.`);
      this.startTimer(DIVE_SECONDS * 1000, () => this.chooseDive({ x: 0, y: 0.35 }));
    }
    this.updateHUD();
  }

  lockAim() {
    if (this.phase !== 'aim') return;
    this.phase = 'power';
    this.powerStart = performance.now();
    this.setHint('Lực: bấm lần nữa khi vạch trắng ở vùng xanh. Vùng đỏ dễ bốc cao, vùng xám quá nhẹ.');
  }

  lockPower() {
    if (this.phase !== 'power') return;
    const shot = { ...this.aim, power: this.powerAt(performance.now()) };
    if (this.opts.mode === 'online') return this.submit('shot', shot);
    const dive = PK.aiDive(Math.random, shot, this.level.read);
    const res = PK.resolve(shot, this.taker.pen, dive, this.gk.rating, Math.random, { keeperBoost: this.level.aiKeeper });
    this.play(res, null, () => this.afterLocal(res));
  }

  chooseDive(d) {
    if (this.phase !== 'dive' || this.dive) return;
    this.dive = d;
    this.stopTimer();
    if (this.opts.mode === 'online') return this.submit('dive', d);
    const shot = PK.aiShot(this.taker.pen, Math.random);
    const res = PK.resolve(shot, this.taker.pen, d, this.gk.rating, Math.random, { shooterBoost: this.level.aiShooter, keeperBoost: this.level.userKeeper });
    this.play(res, d, () => this.afterLocal(res));
  }

  play(res, myDive, done) {
    this.phase = 'anim';
    this.setHint('');
    this.anim = { res, myDive, start: performance.now(), done };
  }

  afterLocal(res) {
    PK.record(this.so, res.scored);
    this.phase = 'between';
    this.updateHUD();
    if (this.so.done) return this.endLocal();
    this.timer = setTimeout(() => this.nextLocal(), 500);
  }

  endLocal() {
    this.phase = 'over';
    this.updateHUD();
    sound.whistle();
    this.setHint('');
    this.$('[data-who]').innerHTML = '';
    this.opts.onEnd && this.opts.onEnd(this.so);
  }

  // ================== Online ==================
  submit(type, data) {
    this.phase = 'wait';
    this.setHint(type === 'shot' ? 'Đã sút. Đang chờ thủ môn đối phương chọn hướng…' : 'Đã chọn hướng. Đang chờ đối phương sút…');
    this.opts.submit(type, this.kickN, data).catch((err) => this.setHint(err.message));
  }

  // Nhận trạng thái mới từ máy chủ
  update(view) {
    if (this.anim) { this.pending = view; return; } // chờ diễn hoạt xong
    this.view = view;
    // Lượt vừa phân xử: diễn hoạt rồi mới cập nhật bảng tỉ số
    if (view.last && view.last.n > this.shownN) {
      this.shownN = view.last.n;
      const res = view.last;
      this.shooterTeam = res.shooter;
      this.setDuelOnline(res.shooter, res.taker);
      this.stopTimer();
      const myDive = view.you !== res.shooter ? res.dive : null;
      this.play(res, myDive, () => {
        this.so = cloneSo(view.so);
        this.updateHUD();
        const next = this.pending || view;
        this.pending = null;
        this.update({ ...next, last: next.last && next.last.n <= this.shownN ? null : next.last });
      });
      return;
    }
    if (view.so) this.so = cloneSo(view.so);
    this.updateHUD();
    if (view.phase === 'over') {
      if (this.phase !== 'over') { this.phase = 'over'; sound.whistle(); this.setHint(''); this.$('[data-who]').innerHTML = ''; }
      this.opts.onEnd && this.opts.onEnd(this.so, view);
      return;
    }
    if (view.phase !== 'play' || !view.kick) return;
    const k = view.kick;
    const t = k.shooter;
    this.shooterTeam = t;
    if (k.n !== this.kickN) {
      // Lượt mới
      if (this.kickN === 0) { this.banner(`${this.teams[this.so.first].club.name} sút trước`, 'info', 1500); sound.whistle(); }
      this.kickN = k.n;
      this.dive = null;
      this.hover = null;
      this.setDuel(t);
      const mine = view.you === t;
      // Thời gian còn lại tính từ lúc nhận tin (máy chủ và trình duyệt có thể lệch đồng hồ)
      const ms = Math.max(1000, k.left - (Date.now() - (view.receivedAt || Date.now())));
      if (mine) {
        this.phase = 'aim';
        this.aim = { x: 0, y: 0.45 };
        this.setHint('Lượt bạn sút: chạm vào khung thành để ngắm, rồi bấm lần nữa để chọn lực.');
      } else {
        this.phase = 'dive';
        this.setHint('Bạn là thủ môn: chạm vào khung thành để chọn hướng đổ người.');
      }
      this.startTimer(ms, () => {
        if (this.phase === 'power') this.lockPower();
        else if (this.phase === 'dive' && !this.dive) this.chooseDive(this.hover || { x: 0, y: 0.35 });
        else if (this.phase === 'aim') { this.phase = 'wait'; this.setHint('Hết giờ: máy sẽ sút hộ bạn.'); }
      });
    }
    if (this.phase === 'wait') {
      const other = view.you === t ? k.diveIn : k.shotIn;
      if (!other) this.setHint(view.you === t ? 'Đã sút. Đang chờ thủ môn đối phương chọn hướng…' : 'Đã chọn hướng. Đang chờ đối phương sút…');
    }
  }

  setDuelOnline(shooterSeat, takerName) {
    this.setDuel(shooterSeat);
    // Lượt đã được ghi ở máy chủ nên tên người sút lấy theo kết quả
    const who = this.$('[data-who] .who b');
    if (who && takerName) who.textContent = takerName;
  }
}

function clampAim(p) {
  return { x: Math.max(-1.15, Math.min(1.15, p.x)), y: Math.max(0.02, Math.min(1.12, p.y)) };
}
function cloneSo(so) {
  return { kicks: [so.kicks[0].slice(), so.kicks[1].slice()], turn: so.turn, first: so.first, done: so.done, winner: so.winner };
}

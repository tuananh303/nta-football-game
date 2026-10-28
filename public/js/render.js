// Vẽ sân, khung thành, thủ môn, cầu thủ và quả bóng trên canvas.
// Toạ độ logic 960x540; khung thành dùng toạ độ chuẩn x [-1, 1], y [0, 1] như core.js.
export const W = 960;
export const H = 540;
const GX = 480;      // tâm khung thành
const GY = 318;      // vạch vôi (chân cột)
const GW = 230;      // nửa chiều rộng khung thành (px)
const GH = 153;      // chiều cao khung thành (px), đúng tỉ lệ 7,32m x 2,44m
const SPOT = { x: 480, y: 486 };

export function goalToPx(g) { return { x: GX + g.x * GW, y: GY - g.y * GH }; }
export function pxToGoal(p) { return { x: (p.x - GX) / GW, y: (GY - p.y) / GH }; }

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.bg = null;
    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }
  destroy() { window.removeEventListener('resize', this._onResize); }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const scale = (rect.width || W) / W;
    this.canvas.width = Math.round(W * scale * dpr);
    this.canvas.height = Math.round(H * scale * dpr);
    this.k = scale * dpr;
    this.bg = null; // vẽ lại nền theo kích thước mới
  }

  // Đổi toạ độ con trỏ sang toạ độ logic
  toLogical(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
  }

  // Nền tĩnh (khán đài, sân, vạch vôi) vẽ một lần vào canvas phụ
  buildBackground() {
    const c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext('2d');
    g.scale(this.k, this.k);

    // Khán đài và đèn sân đêm
    const sky = g.createLinearGradient(0, 0, 0, 230);
    sky.addColorStop(0, '#05090a');
    sky.addColorStop(1, '#0d1714');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 240);
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const crowdColors = ['#2b3a44', '#3a2f35', '#3d4436', '#4a3d2a', '#29323d', '#56463a', '#1f2a33'];
    for (let row = 0; row < 15; row++) {
      const y = 60 + row * 11.5;
      for (let x = -6; x < W + 6; x += 9 + r() * 4) {
        g.fillStyle = crowdColors[Math.floor(r() * crowdColors.length)];
        g.beginPath();
        g.arc(x, y + r() * 4, 3.4 + r() * 1.4, 0, Math.PI * 2);
        g.fill();
        if (r() < 0.035) { g.fillStyle = 'rgba(242,193,78,0.55)'; g.fillRect(x - 1, y - 2, 2, 2); } // đèn flash
      }
    }
    // Quầng đèn
    [[90, 8], [870, 8]].forEach(([x, y]) => {
      const halo = g.createRadialGradient(x, y, 2, x, y, 260);
      halo.addColorStop(0, 'rgba(255,248,220,0.55)');
      halo.addColorStop(0.15, 'rgba(255,248,220,0.14)');
      halo.addColorStop(1, 'rgba(255,248,220,0)');
      g.fillStyle = halo;
      g.fillRect(0, 0, W, 300);
    });
    // Bảng quảng cáo
    g.fillStyle = '#0f1a15';
    g.fillRect(0, 232, W, 30);
    g.fillStyle = '#f2c14e';
    g.font = '700 17px "Barlow Condensed", sans-serif';
    g.textBaseline = 'middle';
    for (let x = 30; x < W; x += 240) g.fillText('LUÂN LƯU 11M · 2026/27', x, 248);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(0, 232, W, 1);

    // Mặt sân có vệt cỏ theo phối cảnh
    const grass = g.createLinearGradient(0, 262, 0, H);
    grass.addColorStop(0, '#1f5a35');
    grass.addColorStop(1, '#2f7d47');
    g.fillStyle = grass;
    g.fillRect(0, 262, W, H - 262);
    const bands = 9;
    for (let i = 0; i < bands; i++) {
      if (i % 2) continue;
      const y0 = 262 + Math.pow(i / bands, 1.6) * (H - 262);
      const y1 = 262 + Math.pow((i + 1) / bands, 1.6) * (H - 262);
      g.fillStyle = 'rgba(255,255,255,0.045)';
      g.fillRect(0, y0, W, y1 - y0);
    }
    // Vạch vôi: đường biên ngang, khu 5m50, khu 16m50, chấm phạt đền, vòng cung
    g.strokeStyle = 'rgba(255,255,255,0.82)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(0, GY); g.lineTo(W, GY);
    g.moveTo(GX - 330, GY); g.lineTo(GX - 370, GY + 44); g.lineTo(GX + 370, GY + 44); g.lineTo(GX + 330, GY);
    g.moveTo(-60, GY); g.lineTo(-180, GY + 150); g.lineTo(W + 180, GY + 150); g.lineTo(W + 60, GY);
    g.stroke();
    g.beginPath();
    g.ellipse(GX, GY + 150, 180, 48, 0, 0.18 * Math.PI, 0.82 * Math.PI);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath();
    g.ellipse(SPOT.x, SPOT.y + 8, 7, 3, 0, 0, Math.PI * 2);
    g.fill();

    // Lưới phía sau khung thành
    const back = 34;
    g.fillStyle = 'rgba(8,14,12,0.55)';
    g.beginPath();
    g.moveTo(GX - GW, GY); g.lineTo(GX - GW + 26, GY - back); g.lineTo(GX + GW - 26, GY - back); g.lineTo(GX + GW, GY);
    g.lineTo(GX + GW, GY - GH); g.lineTo(GX - GW, GY - GH); g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(235,240,236,0.22)';
    g.lineWidth = 1;
    for (let x = -GW; x <= GW; x += 15) {
      g.beginPath(); g.moveTo(GX + x, GY - GH); g.lineTo(GX + x * 0.89, GY - back * 0.4); g.stroke();
    }
    for (let y = 0; y <= GH; y += 13) {
      g.beginPath(); g.moveTo(GX - GW, GY - y); g.lineTo(GX + GW, GY - y); g.stroke();
    }
    // Bóng đổ của khung thành
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(GX - GW, GY, GW * 2, 5);
    this.bg = c;
  }

  // Vẽ một khung hình; s là trạng thái do match.js chuẩn bị
  draw(s) {
    const ctx = this.ctx;
    if (!this.bg) this.buildBackground();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0);

    const shot = s.shot;            // { ball, result, power, keeper } khi đang diễn hoạt
    const t = s.animT || 0;         // giây kể từ lúc bắt đầu chạy đà
    const RUN = 0.55;
    const flight = shot ? 0.78 - shot.power * 0.38 : 0.6;

    // Bóng và thủ môn trong lúc diễn hoạt
    let ball = { x: SPOT.x, y: SPOT.y, r: 11 };
    let keeper = { cx: GX, cy: GY - 58, angle: 0, reach: 0, hand: null };
    let netBulge = null;

    if (shot) {
      const target = goalToPx(shot.ball);
      const ft = clamp01((t - RUN) / flight);
      // Thủ môn phản xạ ngay khi bóng rời chân
      const kt = ease(clamp01((t - RUN + 0.05) / 0.5));
      const hand = goalToPx(shot.keeper || { x: 0, y: 0.4 });
      const dx = hand.x - GX;
      keeper.cx = lerp(GX, GX + dx * 0.6, kt);
      keeper.cy = lerp(GY - 58, Math.min(GY - 34, lerp(GY - 58, hand.y + 18, 0.7)), kt);
      keeper.angle = lerp(0, Math.max(-1.35, Math.min(1.35, (dx / GW) * 1.45 * (hand.y > GY - 110 ? 1 : 0.7))), kt);
      keeper.hand = { x: lerp(GX, hand.x, kt), y: lerp(GY - 118, hand.y, kt) };
      keeper.reach = kt;

      if (t < RUN) {
        ball = { x: SPOT.x, y: SPOT.y, r: 11 };
      } else if (ft < 1) {
        const lift = Math.sin(Math.PI * ft) * (22 + (1 - shot.power) * 26);
        ball = { x: lerp(SPOT.x, target.x, ft), y: lerp(SPOT.y, target.y, ft) - lift * (1 - ft * 0.4), r: lerp(11, 5.5, ft) };
      } else {
        // Sau khi tới khung thành
        const at = t - RUN - flight;
        const a = clamp01(at / 0.6);
        if (shot.result === 'goal') {
          ball = { x: target.x + (target.x - GX) * 0.05 * a, y: Math.min(GY - 4, target.y + a * a * 60), r: 5.2 };
          netBulge = { x: target.x, y: target.y, a: Math.sin(Math.PI * clamp01(at / 0.5)) };
        } else if (shot.result === 'save') {
          const dir = target.x >= GX ? 1 : -1;
          ball = { x: target.x + dir * 90 * a, y: target.y + 110 * a - Math.sin(Math.PI * a) * 50, r: lerp(5.5, 8, a) };
        } else if (shot.result === 'post' || shot.result === 'bar') {
          const dir = target.x >= GX ? -1 : 1;
          ball = { x: target.x + dir * 70 * a, y: target.y + 150 * a - Math.sin(Math.PI * a) * 40, r: lerp(5.5, 8.5, a) };
        } else {
          // Ra ngoài: bóng bay tiếp lên khán đài
          ball = { x: target.x + (target.x - SPOT.x) * 0.35 * a, y: target.y - 70 * a, r: lerp(5.5, 3.5, a) };
        }
      }
    }

    this.drawNetBulge(netBulge);
    this.drawGoalFrame(shot && t > RUN + flight && (shot.result === 'post' || shot.result === 'bar') ? clamp01(1 - (t - RUN - flight) / 0.4) : 0);
    this.drawKeeper(keeper, s.keeperKit || '#28d07a');

    // Điểm đổ người đã chọn (khi người chơi làm thủ môn)
    if (s.diveMark) this.drawMark(goalToPx(s.diveMark), 'rgba(111,211,154,0.95)', true);

    this.drawShooter(s.shooterKit, shot ? clamp01(t / RUN) : 0, shot && t > RUN);
    this.drawBall(ball);

    // Tâm ngắm
    if (s.aim) this.drawMark(goalToPx(s.aim), s.aimLocked ? '#f2c14e' : 'rgba(255,255,255,0.95)', false);
    if (s.power != null) this.drawPower(s.power);
  }

  drawGoalFrame(shake) {
    const ctx = this.ctx;
    const off = shake ? Math.sin(performance.now() / 18) * 2 * shake : 0;
    ctx.save();
    ctx.translate(off, 0);
    ctx.strokeStyle = '#f4f6f3';
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(GX - GW, GY + 2); ctx.lineTo(GX - GW, GY - GH); ctx.lineTo(GX + GW, GY - GH); ctx.lineTo(GX + GW, GY + 2);
    ctx.stroke();
    ctx.restore();
  }

  drawNetBulge(b) {
    if (!b || b.a <= 0) return;
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 46);
    g.addColorStop(0, `rgba(240,245,240,${0.35 * b.a})`);
    g.addColorStop(1, 'rgba(240,245,240,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 46, 36, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thủ môn: thân xoay quanh tâm khi đổ người, hai tay vươn về điểm cứu bóng
  drawKeeper(k, kit) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(k.cx, k.cy);
    ctx.rotate(k.angle);
    // bóng đổ
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0, 58, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
    // chân
    ctx.strokeStyle = '#171d1a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-7, 14); ctx.lineTo(-13, 54); ctx.moveTo(7, 14); ctx.lineTo(13, 54); ctx.stroke();
    // thân áo
    ctx.fillStyle = kit;
    roundRect(ctx, -17, -26, 34, 44, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(-17, 6, 34, 4);
    // đầu
    ctx.fillStyle = '#c99a76';
    ctx.beginPath(); ctx.arc(0, -37, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1d15';
    ctx.beginPath(); ctx.arc(0, -40, 10, Math.PI, 0); ctx.fill();
    ctx.restore();

    // tay (vẽ trong toạ độ màn hình để bàn tay chạm đúng điểm)
    const shoulder = (sx) => {
      const c = Math.cos(k.angle), s = Math.sin(k.angle);
      return { x: k.cx + sx * c - -20 * s, y: k.cy + sx * s + -20 * c };
    };
    const L = shoulder(-15), R = shoulder(15);
    let hl, hr;
    if (k.hand && k.reach > 0.02) {
      hl = { x: k.hand.x - 9, y: k.hand.y };
      hr = { x: k.hand.x + 9, y: k.hand.y };
    } else {
      hl = { x: L.x - 22, y: L.y - 10 };
      hr = { x: R.x + 22, y: R.y - 10 };
    }
    ctx.strokeStyle = kit;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(hl.x, hl.y); ctx.moveTo(R.x, R.y); ctx.lineTo(hr.x, hr.y); ctx.stroke();
    ctx.fillStyle = '#f4f6f3';
    [hl, hr].forEach((h) => { ctx.beginPath(); ctx.arc(h.x, h.y, 6.5, 0, Math.PI * 2); ctx.fill(); });
  }

  // Cầu thủ sút nhìn từ phía sau, chạy đà từ trái vào bóng
  drawShooter(kit, run, kicked) {
    if (!kit) return;
    const ctx = this.ctx;
    const x = lerp(372, 446, ease(run)) + (kicked ? 8 : 0);
    const y = lerp(530, 504, ease(run));
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(4, 52, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    const stride = Math.sin(run * Math.PI * 4) * (kicked ? 0 : 10);
    ctx.strokeStyle = '#efe7dc';
    ctx.lineCap = 'round';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(-9, 18); ctx.lineTo(-12 - stride, 52);
    ctx.moveTo(9, 18); ctx.lineTo(kicked ? 30 : 12 + stride, kicked ? 36 : 52);
    ctx.stroke();
    ctx.fillStyle = kit.c2;
    roundRect(ctx, -20, 4, 40, 20, 6); ctx.fill(); // quần
    ctx.fillStyle = kit.c1;
    roundRect(ctx, -24, -44, 48, 52, 12); ctx.fill(); // áo
    ctx.strokeStyle = kit.c1;
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(-22, -36); ctx.lineTo(-34, -8); ctx.moveTo(22, -36); ctx.lineTo(34, -8); ctx.stroke();
    ctx.fillStyle = kit.c2;
    ctx.font = '700 26px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(kit.number || ''), 0, -18);
    ctx.fillStyle = '#3a271b';
    ctx.beginPath(); ctx.arc(0, -56, 13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawBall(b) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(b.x + 2, Math.max(b.y + b.r, Math.min(GY + 4, b.y + b.r + 4)), b.r * 1.1, b.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(b.x - b.r * 0.4, b.y - b.r * 0.4, b.r * 0.2, b.x, b.y, b.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c9cfd0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b2220';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.32, 0, Math.PI * 2); ctx.fill();
  }

  drawMark(p, color, dashed) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(p.x - 24, p.y); ctx.lineTo(p.x - 8, p.y); ctx.moveTo(p.x + 8, p.y); ctx.lineTo(p.x + 24, p.y);
    ctx.moveTo(p.x, p.y - 24); ctx.lineTo(p.x, p.y - 8); ctx.moveTo(p.x, p.y + 8); ctx.lineTo(p.x, p.y + 24);
    ctx.stroke();
    ctx.restore();
  }

  // Thanh lực: vùng xanh là lực đẹp, vùng đỏ là dễ bốc cao
  drawPower(v) {
    const ctx = this.ctx;
    const x = 880, y = 300, w = 26, h = 200;
    ctx.fillStyle = 'rgba(8,14,12,0.75)';
    roundRect(ctx, x - 8, y - 8, w + 16, h + 16, 12); ctx.fill();
    const zones = [[0, 0.3, '#5f6f68'], [0.3, 0.55, '#c9b45a'], [0.55, 0.85, '#3fbf6f'], [0.85, 1, '#e0574f']];
    zones.forEach(([a, b, c]) => { ctx.fillStyle = c; ctx.fillRect(x, y + h * (1 - b), w, h * (b - a)); });
    ctx.fillStyle = '#fff';
    const py = y + h * (1 - v);
    ctx.fillRect(x - 6, py - 2, w + 12, 4);
    ctx.font = '600 14px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LỰC', x + w / 2, y - 18);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const TIMING = { RUN: 0.55, TOTAL: 2.9 };

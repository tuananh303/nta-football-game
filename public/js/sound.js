// Âm thanh tổng hợp bằng Web Audio (không cần file âm thanh): tiếng sút, còi, khán giả.
const KEY = 'pk.sound';
let ctx = null;
let on = true;
try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* không đọc được thì để bật */ }

function ac() {
  if (!on) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(a, seconds) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  return src;
}

export const sound = {
  get on() { return on; },
  toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* bỏ qua */ }
    return on;
  },
  kick() {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(150, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(45, a.currentTime + 0.12);
    g.gain.setValueAtTime(0.7, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.15);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.16);
  },
  whistle() {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
    o.frequency.value = 2300;
    lfo.frequency.value = 28; lg.gain.value = 120;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(0.12, a.currentTime + 0.03);
    g.gain.setValueAtTime(0.12, a.currentTime + 0.32);
    g.gain.linearRampToValueAtTime(0, a.currentTime + 0.4);
    o.connect(g).connect(a.destination);
    o.start(); lfo.start(); o.stop(a.currentTime + 0.42); lfo.stop(a.currentTime + 0.42);
  },
  // Khán giả: reo hò khi vào, ồ lên khi hỏng
  crowd(cheer) {
    const a = ac(); if (!a) return;
    const n = noise(a, 2.2), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass';
    f.frequency.value = cheer ? 900 : 380;
    f.Q.value = 0.7;
    const peak = cheer ? 0.45 : 0.28;
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(peak, a.currentTime + 0.18);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 2.1);
    n.connect(f).connect(g).connect(a.destination);
    n.start();
  }
};

// Tiện ích giao diện dùng chung
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Màu chữ đọc được trên nền màu CLB
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#111111' : '#ffffff';
}

// Huy hiệu CLB tự vẽ từ màu áo và tên viết tắt (không dùng logo thật)
export function badge(club, size = 'md') {
  return `<span class="crest ${size}" style="--c1:${club.c1};--c2:${club.c2};--ink:${inkOn(club.c1)}" aria-hidden="true">${esc(club.short)}</span>`;
}

const toasts = () => document.getElementById('toasts');
export function toast(msg, type = 'ok') {
  const box = toasts();
  if (!box) return;
  if (box.showPopover && !box.matches(':popover-open')) { try { box.showPopover(); } catch (e) { /* trình duyệt cũ */ } }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 3200);
}

export async function api(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Không kết nối được máy chủ.');
  return data;
}

// Thứ tự sút mặc định: chỉ số sút cao nhất lên trước
export function defaultOrder(club) {
  return club.takers.map((p, i) => i).sort((a, b) => club.takers[b].pen - club.takers[a].pen);
}

const GK_KITS = ['#28d07a', '#f28c28', '#9b5de5', '#ffd60a', '#00b4d8', '#ff5d8f'];
// Màu áo thủ môn: chọn màu khác hẳn màu áo CLB
export function keeperKit(club) {
  let h = 0;
  for (const ch of club.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GK_KITS[h % GK_KITS.length];
}

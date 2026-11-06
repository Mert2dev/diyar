// Kapak görselleri: her tema için kodla çizilen bir manzara (SVG). Dışarıdan resim gerekmez.

export const THEMES = {
  'kuzey': {
    label: 'Karlı kuzey kalesi',
    sky: ['#24324a', '#55698a', '#aebccc'],
    sun: { x: .74, y: .36, r: 14, c: '#f4f0e6', glow: .45 },
    layers: [
      { t: 'mountains', y: .50, a: .30, c: '#4a5a74' },
      { t: 'castle', x: .34, y: .64, s: 1.05, c: '#1c2536' },
      { t: 'mountains', y: .70, a: .12, c: '#29334a' },
      { t: 'pines', y: .84, h: .24, c: '#121925' },
    ],
    fog: '#c9d3df', fx: 'snow',
  },
  'baskent': {
    label: 'Deniz kıyısında başkent',
    sky: ['#3a1424', '#a33b2e', '#f0a75a'],
    sun: { x: .22, y: .64, r: 30, c: '#ffd890', glow: .7 },
    layers: [
      { t: 'sea', y: .68, c: '#3a1a26', glint: '#f2b066' },
      { t: 'castle', x: .70, y: .56, s: 1.35, c: '#24101a', roofs: true },
      { t: 'city', y: .70, h: .12, c: '#24101a', x0: .42, x1: 1, win: '#ffb35c' },
      { t: 'birds', n: 7, c: '#2a1018' },
    ],
    fx: 'none',
  },
  'meyhane': {
    label: 'Gece, şehir ve mum ışığı',
    sky: ['#120e1e', '#2d2140', '#5a3a4a'],
    sun: { x: .80, y: .22, r: 18, c: '#f3e3c3', glow: .35 },
    layers: [
      { t: 'castle', x: .26, y: .52, s: .95, c: '#1c1526', roofs: true },
      { t: 'city', y: .64, h: .22, c: '#18121f', win: '#f2a54a', dense: true },
      { t: 'city', y: .80, h: .12, c: '#0f0b15', win: '#ffbe62', dense: true },
    ],
    fx: 'stars',
  },
  'sisli-orman': {
    label: 'Sisli yağmur ormanı',
    sky: ['#3d4a4f', '#6f7f80', '#a7b2ad'],
    layers: [
      { t: 'mountains', y: .45, a: .18, c: '#5e6d6e' },
      { t: 'pines', y: .62, h: .30, c: '#435352' },
      { t: 'pines', y: .74, h: .34, c: '#2a3837' },
      { t: 'pines', y: .90, h: .42, c: '#141d1d' },
    ],
    fog: '#c4ccc6', fogStrong: true, fx: 'rain',
  },
  'buyulu-sato': {
    label: 'Gölün kıyısında büyülü şato',
    sky: ['#0b1030', '#1e2b63', '#4a3f7a'],
    sun: { x: .76, y: .24, r: 26, c: '#f5f0dc', glow: .5 },
    layers: [
      { t: 'mountains', y: .55, a: .22, c: '#1c2450' },
      { t: 'castle', x: .44, y: .60, s: 1.3, c: '#0c1130', roofs: true, many: true, win: '#ffd27a' },
      { t: 'sea', y: .70, c: '#0d1436', glint: '#f5f0dc' },
      { t: 'pines', y: .92, h: .18, c: '#070a1e' },
    ],
    fx: 'sparkles',
  },
  'volkan': {
    label: 'Ateş dağı ve kara topraklar',
    sky: ['#120a0c', '#3a1512', '#b2421c'],
    layers: [
      { t: 'volcano', x: .66, y: .58, c: '#1d0f0f', glow: '#ff6a2a' },
      { t: 'mountains', y: .66, a: .18, c: '#160c0d' },
      { t: 'ruins', y: .82, h: .14, c: '#0c0707' },
    ],
    fx: 'embers',
  },
  'savas-gogu': {
    label: 'Savaş uçaklarıyla dolu gökyüzü',
    sky: ['#4e5a63', '#9a958a', '#d6c4a2'],
    sun: { x: .30, y: .50, r: 34, c: '#f3e2bd', glow: .5 },
    layers: [
      { t: 'planes', n: 6, c: '#2b2f33' },
      { t: 'hills', y: .70, a: .08, c: '#6f6a5e' },
      { t: 'ruins', y: .80, h: .16, c: '#3b3832' },
      { t: 'hills', y: .90, a: .05, c: '#24221e' },
    ],
    fog: '#d9ccb0', fx: 'smoke',
  },
  'siper': {
    label: 'Siperler ve dikenli tel',
    sky: ['#3f4236', '#7a7a62', '#b3ab8a'],
    sun: { x: .66, y: .46, r: 22, c: '#e9e0c4', glow: .3 },
    layers: [
      { t: 'hills', y: .64, a: .06, c: '#5a5946' },
      { t: 'ruins', y: .72, h: .10, c: '#45443a', x0: .5, x1: 1 },
      { t: 'hills', y: .80, a: .04, c: '#33332a' },
      { t: 'fence', y: .86, c: '#1c1c16' },
      { t: 'birds', n: 5, c: '#2b2b22' },
    ],
    fog: '#bdb593', fx: 'rain',
  },
  'salgin': {
    label: 'Kıyamet sonrası şehir',
    sky: ['#1b1f12', '#4f5a1e', '#c9902e'],
    sun: { x: .62, y: .58, r: 40, c: '#f3c25a', glow: .55 },
    layers: [
      { t: 'skyline', y: .66, h: .34, c: '#191a10' },
      { t: 'sea', y: .74, c: '#14150d', glint: '#e8a83a' },
      { t: 'city', y: .86, h: .14, c: '#0b0c07', x0: 0, x1: .5 },
    ],
    fx: 'smoke',
  },
  'neon': {
    label: 'Neon ışıklı gelecek şehri',
    sky: ['#0d0620', '#3b0f55', '#c43a8a'],
    layers: [
      { t: 'skyline', y: .60, h: .30, c: '#240a3a' },
      { t: 'city', y: .64, h: .50, c: '#160828', win: '#41e0e6', dense: true, tall: true },
      { t: 'city', y: .84, h: .30, c: '#0a0414', win: '#ff4fb0', dense: true },
    ],
    fx: 'rain',
  },
  'safak': {
    label: 'Yeni dünyada şafak',
    sky: ['#4a5c9e', '#d98aa8', '#ffd59a'],
    sun: { x: .5, y: .64, r: 34, c: '#fff1c8', glow: .7 },
    layers: [
      { t: 'mountains', y: .54, a: .24, c: '#8d79a8' },
      { t: 'castle', x: .76, y: .62, s: .7, c: '#5e5182', roofs: true },
      { t: 'dragon', x: .26, y: .26, s: 1, c: '#463a66' },
      { t: 'hills', y: .74, a: .07, c: '#557a62' },
      { t: 'hills', y: .88, a: .05, c: '#2f4d3d' },
    ],
    fx: 'none',
  },
};

const W = 400, H = 250;
let counter = 0;

function hashStr(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let s = hashStr(seed) || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const f = n => Math.round(n * 10) / 10;

function mountains(L, r) {
  const base = L.y * H; let x = 0; let d = `M0 ${H} L0 ${f(base - r() * L.a * H * .5)}`;
  while (x < W) {
    x += 18 + r() * 34;
    const peak = base - (0.25 + r() * 0.75) * L.a * H;
    d += ` L${f(x)} ${f(peak)}`;
    x += 10 + r() * 20;
    d += ` L${f(x)} ${f(base - r() * L.a * H * .35)}`;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${L.c}"/>`;
}
function hills(L, r) {
  const base = L.y * H; let d = `M0 ${H} L0 ${f(base)}`; let x = 0;
  while (x < W) {
    const w = 70 + r() * 90, peak = base - (0.4 + r() * 0.6) * L.a * H;
    d += ` Q${f(x + w / 2)} ${f(peak - L.a * H * .6)} ${f(x + w)} ${f(base - r() * L.a * H * .3)}`;
    x += w;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${L.c}"/>`;
}
function pines(L, r) {
  const base = L.y * H; let out = `<rect x="0" y="${f(base)}" width="${W}" height="${f(H - base)}" fill="${L.c}"/>`;
  let pts = '';
  for (let x = -8; x < W + 8; x += 5 + r() * 9) {
    const th = L.h * H * (0.45 + r() * 0.6), w = th * (0.2 + r() * 0.08), by = base + r() * 6;
    pts += `<polygon points="${f(x)},${f(by - th)} ${f(x - w)},${f(by)} ${f(x + w)},${f(by)}"/>`;
  }
  return out + `<g fill="${L.c}">${pts}</g>`;
}
function windowsFor(x, y, w, h, color, r, dense) {
  if (!color) return '';
  let s = '';
  for (let yy = y + 4; yy < y + h - 4; yy += 6) {
    for (let xx = x + 3; xx < x + w - 3; xx += 5) {
      if (r() < (dense ? .28 : .14)) s += `<rect x="${f(xx)}" y="${f(yy)}" width="2" height="2.6"/>`;
    }
  }
  return s;
}
function city(L, r) {
  const base = L.y * H, x0 = (L.x0 ?? 0) * W, x1 = (L.x1 ?? 1) * W;
  let b = '', w = '';
  for (let x = x0 - 4; x < x1; ) {
    const bw = 12 + r() * (L.tall ? 22 : 28);
    const bh = L.h * H * (L.tall ? 0.3 + r() * 0.7 : 0.35 + r() * 0.65);
    const top = base - bh;
    b += `<rect x="${f(x)}" y="${f(top)}" width="${f(bw)}" height="${f(H - top)}"/>`;
    if (L.tall && r() < .3) b += `<rect x="${f(x + bw / 2 - .6)}" y="${f(top - 10)}" width="1.2" height="10"/>`;
    w += windowsFor(x, top, bw, Math.min(bh + 20, H - top), L.win, r, L.dense);
    x += bw + (r() < .3 ? r() * 6 : 0);
  }
  return `<g fill="${L.c}">${b}</g>` + (L.win ? `<g fill="${L.win}" opacity=".85">${w}</g>` : '');
}
function ruins(L, r) {
  const base = L.y * H, x0 = (L.x0 ?? 0) * W, x1 = (L.x1 ?? 1) * W;
  let d = '';
  for (let x = x0 - 4; x < x1; ) {
    const bw = 14 + r() * 30, bh = L.h * H * (0.2 + r() * 0.8), top = base - bh;
    const j1 = top + r() * bh * .4, j2 = top + r() * bh * .5;
    d += `M${f(x)} ${H} L${f(x)} ${f(j1)} L${f(x + bw * .3)} ${f(top)} L${f(x + bw * .55)} ${f(j2)} L${f(x + bw * .75)} ${f(top + r() * 8)} L${f(x + bw)} ${f(j1 + 6)} L${f(x + bw)} ${H} Z `;
    x += bw + r() * 10;
  }
  return `<path d="${d}" fill="${L.c}"/><rect x="0" y="${f(base)}" width="${W}" height="${f(H - base)}" fill="${L.c}"/>`;
}
function skyline(L, r) {
  // Kubbeler ve minareler: bir Boğaz siluetini anımsatan genel bir şehir
  const base = L.y * H; let s = `<rect x="0" y="${f(base)}" width="${W}" height="${f(H - base)}"/>`;
  for (let x = -6; x < W; ) {
    if (r() < .32) {
      const rad = 14 + r() * 18, cx = x + rad + 10;
      s += `<rect x="${f(cx - rad - 8)}" y="${f(base - rad * .7)}" width="${f(rad * 2 + 16)}" height="${f(rad * .7 + 1)}"/>`;
      s += `<path d="M${f(cx - rad)} ${f(base - rad * .7)} A${f(rad)} ${f(rad * .95)} 0 0 1 ${f(cx + rad)} ${f(base - rad * .7)} Z"/>`;
      s += `<path d="M${f(cx - rad - 8)} ${f(base - rad * .55)} A${f(rad * .5)} ${f(rad * .45)} 0 0 1 ${f(cx - rad + 4)} ${f(base - rad * .55)} Z"/>`;
      s += `<path d="M${f(cx + rad - 4)} ${f(base - rad * .55)} A${f(rad * .5)} ${f(rad * .45)} 0 0 1 ${f(cx + rad + 8)} ${f(base - rad * .55)} Z"/>`;
      s += `<rect x="${f(cx - .6)}" y="${f(base - rad * 1.75 - 6)}" width="1.2" height="7"/>`;
      const mins = 2 + Math.floor(r() * 3);
      for (let i = 0; i < mins; i++) {
        const mx = cx + (i % 2 ? 1 : -1) * (rad + 12 + Math.floor(i / 2) * 9), mh = L.h * H * (0.9 + r() * 0.5);
        s += `<rect x="${f(mx - 1.8)}" y="${f(base - mh)}" width="3.6" height="${f(mh)}"/>`;
        s += `<polygon points="${f(mx - 2.2)},${f(base - mh)} ${f(mx + 2.2)},${f(base - mh)} ${f(mx)},${f(base - mh - 12)}"/>`;
        s += `<rect x="${f(mx - 3)}" y="${f(base - mh * .72)}" width="6" height="1.6"/>`;
      }
      x = cx + rad + 30;
    } else if (r() < .1) {
      const tw = 10, th = L.h * H * 1.1;
      s += `<rect x="${f(x)}" y="${f(base - th)}" width="${tw}" height="${f(th)}"/><polygon points="${f(x - 1)},${f(base - th)} ${f(x + tw + 1)},${f(base - th)} ${f(x + tw / 2)},${f(base - th - 16)}"/>`;
      x += tw + 6;
    } else {
      const bw = 8 + r() * 16, bh = 6 + r() * L.h * H * .35;
      s += `<rect x="${f(x)}" y="${f(base - bh)}" width="${f(bw)}" height="${f(bh)}"/>`;
      x += bw;
    }
  }
  return `<g fill="${L.c}">${s}</g>`;
}
function castle(L, r) {
  const s = L.s || 1, cx = L.x * W, base = L.y * H;
  const tower = (x, w, h, roof) => {
    let t = `<rect x="${f(x - w / 2)}" y="${f(base - h)}" width="${f(w)}" height="${f(h + 40)}"/>`;
    if (roof) t += `<polygon points="${f(x - w / 2 - 2)},${f(base - h)} ${f(x + w / 2 + 2)},${f(base - h)} ${f(x)},${f(base - h - w * 1.5)}"/>`;
    else for (let i = 0; i < 3; i++) t += `<rect x="${f(x - w / 2 + i * (w / 2.5))}" y="${f(base - h - 4 * s)}" width="${f(w / 5)}" height="${f(4 * s)}"/>`;
    return t;
  };
  let g = `<path d="M${f(cx - 90 * s)} ${H} Q${f(cx)} ${f(base - 6 * s)} ${f(cx + 90 * s)} ${H} Z"/>`;
  g += `<rect x="${f(cx - 46 * s)}" y="${f(base - 34 * s)}" width="${f(92 * s)}" height="${f(60 * s)}"/>`;
  for (let i = 0; i < 9; i++) g += `<rect x="${f(cx - 46 * s + i * 11 * s)}" y="${f(base - 38 * s)}" width="${f(5 * s)}" height="${f(4 * s)}"/>`;
  g += tower(cx - 46 * s, 16 * s, 58 * s, L.roofs);
  g += tower(cx + 46 * s, 16 * s, 52 * s, L.roofs);
  g += tower(cx + 6 * s, 22 * s, 86 * s, L.roofs);
  if (L.many) {
    g += tower(cx - 24 * s, 11 * s, 70 * s, true);
    g += tower(cx + 30 * s, 10 * s, 64 * s, true);
    g += tower(cx - 66 * s, 12 * s, 40 * s, true);
    g += tower(cx + 64 * s, 9 * s, 46 * s, true);
  }
  let win = '';
  if (L.win) {
    for (let i = 0; i < 14; i++) {
      const wx = cx + (r() - .5) * 110 * s, wy = base - r() * 70 * s;
      win += `<rect x="${f(wx)}" y="${f(wy)}" width="${f(2 * s)}" height="${f(3 * s)}"/>`;
    }
  }
  return `<g fill="${L.c}">${g}</g>` + (win ? `<g fill="${L.win}">${win}</g>` : '');
}
function sea(L, r) {
  const base = L.y * H; let lines = '';
  for (let i = 0; i < 16; i++) {
    const y = base + 3 + r() * (H - base - 6), x = r() * W, w = 10 + r() * 50;
    lines += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="1" opacity="${f(.15 + r() * .35)}"/>`;
  }
  return `<rect x="0" y="${f(base)}" width="${W}" height="${f(H - base)}" fill="${L.c}"/><g fill="${L.glint || '#fff'}">${lines}</g>`;
}
function volcano(L, r, id) {
  const cx = L.x * W, base = L.y * H;
  return `<radialGradient id="vg${id}" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="${L.glow}" stop-opacity=".8"/><stop offset="1" stop-color="${L.glow}" stop-opacity="0"/></radialGradient>
  <ellipse cx="${f(cx)}" cy="${f(base - 96)}" rx="70" ry="48" fill="url(#vg${id})"/>
  <path d="M${f(cx - 170)} ${H} L${f(cx - 20)} ${f(base - 94)} L${f(cx - 10)} ${f(base - 90)} L${f(cx + 2)} ${f(base - 98)} L${f(cx + 14)} ${f(base - 92)} L${f(cx + 170)} ${H} Z" fill="${L.c}"/>
  <path d="M${f(cx - 8)} ${f(base - 92)} L${f(cx - 14)} ${f(base - 60)} L${f(cx - 4)} ${f(base - 40)}" stroke="${L.glow}" stroke-width="2" fill="none" opacity=".75"/>`;
}
function planes(L, r) {
  let g = '';
  for (let i = 0; i < L.n; i++) {
    const x = 40 + r() * 320, y = 20 + r() * 90, sc = .5 + r() * .7;
    g += `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})"><path d="M-22 0 L18 -1.6 L24 0 L18 1.6 Z M-4 -1 L-10 -18 L-4 -18 L6 -1 Z M-4 1 L-10 18 L-4 18 L6 1 Z M-20 -1 L-24 -7 L-21 -7 L-15 -1 Z M-20 1 L-24 7 L-21 7 L-15 1 Z"/></g>`;
  }
  return `<g fill="${L.c}">${g}</g>`;
}
function birds(L, r) {
  let g = '';
  for (let i = 0; i < L.n; i++) {
    const x = 60 + r() * 280, y = 30 + r() * 70, s = 3 + r() * 4;
    g += `<path d="M${f(x - s)} ${f(y)} Q${f(x - s / 2)} ${f(y - s * .7)} ${f(x)} ${f(y)} Q${f(x + s / 2)} ${f(y - s * .7)} ${f(x + s)} ${f(y)}"/>`;
  }
  return `<g fill="none" stroke="${L.c}" stroke-width="1.2" stroke-linecap="round">${g}</g>`;
}
function dragon(L) {
  const x = L.x * W, y = L.y * H, s = L.s || 1;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" fill="${L.c}">
  <path d="M-34 4 Q-14 -2 0 2 Q14 -2 30 -6 L36 -10 L34 -4 Q22 2 6 6 Q-10 10 -34 4 Z"/>
  <path d="M-6 2 Q-18 -26 -44 -30 Q-30 -20 -32 -12 Q-22 -14 -20 -6 Q-12 -6 -6 2 Z"/>
  <path d="M6 2 Q8 -30 30 -38 Q22 -26 26 -20 Q16 -18 18 -10 Q10 -8 6 2 Z"/>
  <path d="M-34 4 Q-46 8 -58 2 Q-48 10 -40 10 Z"/></g>`;
}
function fence(L, r) {
  const base = L.y * H; let g = `<rect x="0" y="${f(base + 6)}" width="${W}" height="${f(H - base)}" fill="${L.c}"/>`, w = '';
  let px = -10, py = base;
  for (let x = 10; x < W + 20; x += 34 + r() * 16) {
    const top = base - 14 - r() * 10;
    g += `<path d="M${f(x)} ${f(base + 8)} L${f(x + (r() - .5) * 6)} ${f(top)}" stroke="${L.c}" stroke-width="2.4"/>`;
    w += `<path d="M${f(px)} ${f(py)} Q${f((px + x) / 2)} ${f(top + 10)} ${f(x)} ${f(top + 2)}" />`;
    w += `<path d="M${f(px)} ${f(py + 7)} Q${f((px + x) / 2)} ${f(top + 16)} ${f(x)} ${f(top + 9)}" />`;
    px = x; py = top + 2;
  }
  return g + `<g fill="none" stroke="${L.c}" stroke-width=".8" stroke-dasharray="3 1.5">${w}</g>`;
}

function fxLayer(kind, r, id) {
  let g = '';
  if (kind === 'snow') {
    for (let i = 0; i < 90; i++) g += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(.5 + r() * 1.5)}" opacity="${f(.4 + r() * .6)}"/>`;
    return `<g fill="#fff">${g}</g>`;
  }
  if (kind === 'rain') {
    for (let i = 0; i < 110; i++) { const x = r() * W, y = r() * H, l = 6 + r() * 10; g += `<path d="M${f(x)} ${f(y)} l${f(-l * .25)} ${f(l)}"/>`; }
    return `<g stroke="#e6eef5" stroke-width=".6" opacity=".35">${g}</g>`;
  }
  if (kind === 'embers') {
    for (let i = 0; i < 60; i++) g += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(.5 + r() * 1.3)}" opacity="${f(.4 + r() * .6)}"/>`;
    return `<g fill="#ff9a4a">${g}</g>`;
  }
  if (kind === 'stars') {
    for (let i = 0; i < 70; i++) g += `<circle cx="${f(r() * W)}" cy="${f(r() * H * .5)}" r="${f(.3 + r() * .9)}" opacity="${f(.3 + r() * .7)}"/>`;
    return `<g fill="#fff">${g}</g>`;
  }
  if (kind === 'sparkles') {
    let st = '';
    for (let i = 0; i < 60; i++) st += `<circle cx="${f(r() * W)}" cy="${f(r() * H * .55)}" r="${f(.3 + r() * .8)}" opacity="${f(.3 + r() * .7)}"/>`;
    for (let i = 0; i < 18; i++) { const x = r() * W, y = H * .5 + r() * H * .45, s = 1 + r() * 2; g += `<path d="M${f(x)} ${f(y - s * 2)} L${f(x + s * .5)} ${f(y)} L${f(x)} ${f(y + s * 2)} L${f(x - s * .5)} ${f(y)} Z M${f(x - s * 2)} ${f(y)} L${f(x)} ${f(y + s * .5)} L${f(x + s * 2)} ${f(y)} L${f(x)} ${f(y - s * .5)} Z" opacity="${f(.5 + r() * .5)}"/>`; }
    return `<g fill="#fff">${st}</g><g fill="#ffd98a">${g}</g>`;
  }
  if (kind === 'smoke') {
    for (let i = 0; i < 9; i++) g += `<ellipse cx="${f(r() * W)}" cy="${f(H * .35 + r() * H * .4)}" rx="${f(40 + r() * 60)}" ry="${f(14 + r() * 20)}" opacity="${f(.12 + r() * .18)}"/>`;
    return `<filter id="bl${id}"><feGaussianBlur stdDeviation="9"/></filter><g fill="#2a2a24" filter="url(#bl${id})">${g}</g>`;
  }
  return '';
}

export function coverSVG(themeKey, seed = 'x') {
  const T = THEMES[themeKey] || THEMES['kuzey'];
  const r = rng(themeKey + '|' + seed);
  const id = 'c' + (counter++);
  const [s0, s1, s2] = T.sky;
  let out = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset=".6" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
<radialGradient id="vig${id}" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
${T.sun ? `<radialGradient id="sun${id}"><stop offset="0" stop-color="${T.sun.c}" stop-opacity="${T.sun.glow}"/><stop offset="1" stop-color="${T.sun.c}" stop-opacity="0"/></radialGradient>` : ''}
${T.fog ? `<linearGradient id="fog${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.fog}" stop-opacity="0"/><stop offset="1" stop-color="${T.fog}" stop-opacity="${T.fogStrong ? .55 : .35}"/></linearGradient>` : ''}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky${id})"/>`;
  if (T.fx === 'stars' || T.fx === 'sparkles') out += fxLayer(T.fx === 'stars' ? 'stars' : 'none', r, id);
  if (T.sun) {
    const sx = T.sun.x * W, sy = T.sun.y * H;
    out += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(T.sun.r * 4)}" fill="url(#sun${id})"/><circle cx="${f(sx)}" cy="${f(sy)}" r="${T.sun.r}" fill="${T.sun.c}"/>`;
  }
  const fns = { mountains, hills, pines, city, ruins, skyline, castle, sea, volcano, planes, birds, dragon, fence };
  T.layers.forEach((L, i) => {
    out += (fns[L.t] ? fns[L.t](L, r, id + 'l' + i) : '');
    if (T.fog && i < T.layers.length - 1 && L.y) {
      out += `<rect x="0" y="${f(L.y * H - 40)}" width="${W}" height="60" fill="url(#fog${id})"/>`;
    }
  });
  if (T.fx && T.fx !== 'stars') out += fxLayer(T.fx, r, id);
  out += `<rect width="${W}" height="${H}" fill="url(#vig${id})"/></svg>`;
  return out;
}

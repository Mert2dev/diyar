// Dünya afişleri: her tema, sınırlı mürekkep rengiyle elle kurulmuş bir baskı afişidir (SVG).
// Dışarıdan resim gerekmez. Başlık afişin üstüne HTML olarak yazılır (bkz. app.js > posterHTML),
// böylece kendi senaryosunu yazan kişinin başlığı da aynı baskı diliyle görünür.
//
// bg / ink / accent / on: dünya sayfasının ve oyun ekranının renkleri
// title: afiş başlığının rengi, pos: başlığın yeri (top | bottom)
// font / wf: başlık yazı tipi ve ortalama harf genişliği (uzun kelimeyi afişe sığdırmak için)

const W = 600, H = 800;
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
const rect = (x, y, w, h, c, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${extra}/>`;
const disc = (x, y, r, c, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;

function dots(r, n, c, { x0 = 0, x1 = W, y0 = 0, y1 = H, min = 1, max = 4 } = {}) {
  let g = '';
  for (let i = 0; i < n; i++) g += `<circle cx="${f(x0 + r() * (x1 - x0))}" cy="${f(y0 + r() * (y1 - y0))}" r="${f(min + r() * (max - min))}"/>`;
  return `<g fill="${c}">${g}</g>`;
}
function rain(r, n, c, op = .4, { len = 46, slant = .28, width = 1.3 } = {}) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = r() * (W + 80) - 40, y = r() * H, l = len * (.5 + r());
    g += `<path d="M${f(x)} ${f(y)}l${f(-l * slant)} ${f(l)}"/>`;
  }
  return `<g stroke="${c}" stroke-width="${width}" opacity="${op}" fill="none">${g}</g>`;
}
function pines(r, base, h, c, step = 26) {
  let g = rect(0, base, W, H - base, c);
  for (let x = -20; x < W + 20; x += step * (.6 + r() * .8)) {
    const th = h * (.55 + r() * .55), w = th * (.17 + r() * .05), by = base + 6;
    g += `<path d="M${f(x)} ${f(by - th)}L${f(x + w * .55)} ${f(by - th * .62)}L${f(x + w * .28)} ${f(by - th * .62)}L${f(x + w * .8)} ${f(by - th * .32)}L${f(x + w * .4)} ${f(by - th * .32)}L${f(x + w)} ${f(by)}L${f(x - w)} ${f(by)}L${f(x - w * .4)} ${f(by - th * .32)}L${f(x - w * .8)} ${f(by - th * .32)}L${f(x - w * .28)} ${f(by - th * .62)}L${f(x - w * .55)} ${f(by - th * .62)}Z" fill="${c}"/>`;
  }
  return g;
}
function mosque(cx, base, rad, minH, c) {
  let s = `<path d="M${cx - rad} ${base}A${rad} ${rad * 1.02} 0 0 1 ${cx + rad} ${base}Z"/>`;
  s += `<rect x="${cx - 1.6}" y="${f(base - rad * 1.02 - 20)}" width="3.2" height="22"/>`;
  s += `<path d="M${cx - rad * 1.7} ${base}A${rad * .62} ${rad * .62} 0 0 1 ${f(cx - rad * .46)} ${base}Z"/><path d="M${f(cx + rad * .46)} ${base}A${rad * .62} ${rad * .62} 0 0 1 ${cx + rad * 1.7} ${base}Z"/>`;
  [-1.95, 1.95].forEach(k => {
    const mx = cx + rad * k;
    s += `<path d="M${f(mx - 6)} ${base}V${base - minH}L${f(mx)} ${base - minH - 44}L${f(mx + 6)} ${base - minH}V${base}Z"/><rect x="${f(mx - 10)}" y="${f(base - minH * .72)}" width="20" height="5"/><rect x="${f(mx - 9)}" y="${f(base - minH * .38)}" width="18" height="4"/>`;
  });
  return `<g fill="${c}">${s}</g>`;
}
const BOMBER = 'M0-44C4-38 5-22 5-10L58 6V13L5 9 4 30 18 38V43L0 40-18 43V38L-4 30-5 9-58 13V6L-5-10C-5-22-4-38 0-44Z';

export const THEMES = {
  /* Boş bir arma: haneyi oyuncu kuracak */
  'kuzey': {
    label: 'Kuzey ve arma',
    bg: '#1c252c', ink: '#e7ebe8', accent: '#dfe5e3', on: '#1c252c', title: '#1c252c', pos: 'top',
    font: "'Grenze Gotisch'", weight: 800, wf: .55,
    art(r, id) {
      const shield = 'M138 312H462V540C462 648 372 712 300 752 228 712 138 648 138 540Z';
      return rect(0, 0, W, H, '#d9dedd')
        + `<path d="M0 640L70 540 128 596 214 470 300 590 392 480 470 590 530 520 600 610V800H0Z" fill="#94a2a9"/>`
        + `<clipPath id="s${id}"><path d="${shield}"/></clipPath>`
        + `<g clip-path="url(#s${id})">${rect(100, 280, 200, 500, '#1c252c')}${rect(300, 280, 200, 500, '#a8231d')}
           <path d="M100 590L300 420 500 590" fill="none" stroke="#d9dedd" stroke-width="50"/>${dots(r, 28, '#d9dedd', { y0: 300, y1: 760, min: 1.5, max: 4 })}</g>`
        + `<path d="${shield}" fill="none" stroke="#1c252c" stroke-width="9" transform="translate(5 5)"/>`
        + rect(0, 760, W, 40, '#1c252c')
        + dots(r, 70, '#fff', { min: 1.5, max: 5.5 });
    },
  },
  /* Her duvarın kulağı var: anahtar deliğinden görülen saray */
  'baskent': {
    label: 'Anahtar deliğinden saray',
    bg: '#4c0b14', ink: '#f6e8d0', accent: '#eab347', on: '#2a0a08', title: '#eab347', pos: 'bottom',
    font: "'Grenze Gotisch'", weight: 800, wf: .55,
    art(r, id) {
      let lat = '';
      for (let i = -800; i < 800; i += 34) lat += `<path d="M${i} 0L${i + 800} 800M${i + 800} 0L${i} 800"/>`;
      const hole = 'M300 118A132 132 0 0 1 366 364L424 590H176L234 364A132 132 0 0 1 300 118Z';
      return rect(0, 0, W, H, '#7c1420')
        + `<g stroke="#651019" stroke-width="2" fill="none">${lat}</g>`
        + `<clipPath id="k${id}"><path d="${hole}"/></clipPath>`
        + `<path d="${hole}" fill="#1c0a0e" transform="translate(10 10)"/>`
        + `<g clip-path="url(#k${id})">${rect(120, 100, 360, 520, '#eab347')}${disc(300, 300, 74, '#f8dd97')}
           <g fill="#1c0a0e"><path d="M170 600V440H196V410H214V440H246V360L268 310 290 360V400H312V300L340 232 368 300V420H396V380L416 340 436 380V600Z"/></g>
           <g fill="#eab347">${[[262, 400], [335, 330], [335, 380], [410, 440], [205, 480], [300, 470], [350, 520]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="14"/>`).join('')}</g></g>`
        + rect(0, 600, W, 200, '#4c0b14');
    },
  },
  /* Şarap, mum ışığı, kadeh */
  'meyhane': {
    label: 'Mum ışığı ve kadeh',
    bg: '#190f1e', ink: '#f2e6d2', accent: '#f0c25c', on: '#190f1e', title: '#f0c25c', pos: 'top',
    font: "'Grenze Gotisch'", weight: 700, wf: .52,
    art(r) {
      return rect(0, 0, W, H, '#190f1e')
        + disc(300, 480, 340, '#26172b') + disc(300, 480, 262, '#3a1f33') + disc(300, 480, 186, '#5c2a38')
        + rect(0, 742, W, 58, '#0f0912')
        + `<path d="M178 330H422C424 468 372 552 322 562V678C322 700 388 706 410 744H190C212 706 278 700 278 678V562C228 552 176 468 178 330Z" fill="#f0c25c"/>`
        + `<path d="M196 402H404C392 480 348 538 300 540 252 538 208 480 196 402Z" fill="#8e1b3a"/>`
        + `<path d="M196 402H404C360 420 240 420 196 402Z" fill="#b02a4e"/>`
        + `<path d="M214 346C212 372 216 388 220 396" fill="none" stroke="#fff3cf" stroke-width="7" stroke-linecap="round"/>`
        + dots(r, 26, '#f0c25c', { y0: 230, y1: 740, min: .8, max: 2.2 });
    },
  },
  /* Yağmur, üç sıra çam, en karanlık sırada iki küçük ışık */
  'sisli-orman': {
    label: 'Sisli orman',
    bg: '#17221e', ink: '#dfe6e0', accent: '#bdd0c5', on: '#17221e', title: '#17221e', pos: 'top',
    font: "'Bodoni Moda'", weight: 600, wf: .5, style: 'italic',
    art(r) {
      return rect(0, 0, W, H, '#bcc7c0')
        + pines(r, 470, 210, '#8fa19a', 22) + rect(0, 430, W, 90, '#bcc7c0', 'opacity=".38"')
        + pines(r, 590, 280, '#566a64', 26) + rect(0, 550, W, 80, '#bcc7c0', 'opacity=".24"')
        + pines(r, 720, 370, '#17221e', 34)
        + `<g fill="#f2d675"><ellipse cx="398" cy="664" rx="4.4" ry="2.6"/><ellipse cx="414" cy="664" rx="4.4" ry="2.6"/></g>`
        + rain(r, 170, '#22312c', .5, { len: 60, slant: .2, width: 1.2 });
    },
  },
  /* Mektup getiren baykuş */
  'buyulu-sato': {
    label: 'Mektuplu baykuş',
    bg: '#11153f', ink: '#f1ead6', accent: '#f0bf45', on: '#11153f', title: '#f0bf45', pos: 'bottom',
    font: 'Almendra', weight: 700, wf: .6,
    art(r) {
      let feathers = '';
      for (let row = 0; row < 4; row++) for (let c = -2 + (row % 2) * .5; c <= 2; c++) {
        const x = 300 + c * 40, y = 388 + row * 34;
        if (Math.abs(c) > 2 - row * .25) continue;
        feathers += `<path d="M${x - 15} ${y}Q${x} ${y + 24} ${x + 15} ${y}"/>`;
      }
      return rect(0, 0, W, H, '#11153f')
        + dots(r, 90, '#f6efd8', { min: .7, max: 2.4 })
        + `<path d="M178 186L150 92 252 150Z M422 186L450 92 348 150Z" fill="#eab63a"/>`
        + `<path d="M150 214C186 132 414 132 450 214 492 340 448 528 300 566 152 528 108 340 150 214Z" fill="#eab63a"/>`
        + `<path d="M138 300C94 372 112 490 192 536 158 456 148 380 138 300Z M462 300C506 372 488 490 408 536 442 456 452 380 462 300Z" fill="#b5801c"/>`
        + `<g fill="none" stroke="#11153f" stroke-width="5" stroke-linecap="round">${feathers}</g>`
        + disc(232, 262, 74, '#f6efd8') + disc(368, 262, 74, '#f6efd8') + disc(232, 262, 42, '#11153f') + disc(368, 262, 42, '#11153f') + disc(246, 248, 11, '#f6efd8') + disc(382, 248, 11, '#f6efd8')
        + `<path d="M300 292L322 322 300 362 278 322Z" fill="#c8452f"/>`
        + `<g transform="rotate(-4 300 590)">${rect(222, 548, 156, 92, '#f6efd8')}<path d="M222 548L300 602 378 548" fill="none" stroke="#11153f" stroke-width="3.5"/>${disc(300, 606, 15, '#c8452f')}</g>`
        + `<g fill="#b5801c">${rect(254, 534, 12, 26)}${rect(334, 534, 12, 26)}</g>`;
    },
  },
  /* Halkanın içinde ateş dağı */
  'volkan': {
    label: 'Halka ve ateş dağı',
    bg: '#130b09', ink: '#f4e4d1', accent: '#f4602a', on: '#130b09', title: '#f7b32b', pos: 'bottom',
    font: 'Almendra', weight: 700, wf: .6,
    art(r) {
      return rect(0, 0, W, H, '#130b09')
        + disc(300, 318, 216, '#f0501e')
        + `<circle cx="300" cy="318" r="252" fill="none" stroke="#f7b32b" stroke-width="30"/><circle cx="300" cy="318" r="228" fill="none" stroke="#130b09" stroke-width="5"/>`
        + `<path d="M20 640L248 262 272 288 298 246 326 292 352 262 580 640Z" fill="#130b09"/>`
        + `<path d="M298 262L280 340 316 396 286 470 322 540 296 618" fill="none" stroke="#f7b32b" stroke-width="9" stroke-linejoin="bevel"/><path d="M280 340L240 410M316 396L368 462M286 470L252 540" fill="none" stroke="#f0501e" stroke-width="6"/>`
        + rect(0, 620, W, 180, '#130b09')
        + dots(r, 46, '#f7b32b', { y0: 30, y1: 300, x0: 120, x1: 480, min: 1, max: 3.4 });
    },
  },
  /* Işıldaklar ve bombardıman filosu */
  'savas-gogu': {
    label: 'Işıldaklar ve filo',
    bg: '#141b24', ink: '#e8dec3', accent: '#e4d6b1', on: '#141b24', title: '#e4d6b1', pos: 'bottom',
    font: "'Big Shoulders Stencil'", weight: 900, wf: .41,
    art(r) {
      const beam = (x, tx, w) => `<path d="M${x} 640L${tx - w} 0H${tx + w}Z" fill="#e4d6b1" opacity=".2"/>`;
      const planes = [[182, 176, 1.25], [330, 94, .9], [440, 214, 1.1], [270, 310, 1.45], [486, 72, .62], [84, 70, .66], [108, 330, .72]];
      return rect(0, 0, W, H, '#141b24')
        + beam(90, 300, 44) + beam(300, 150, 34) + beam(330, 500, 50) + beam(540, 300, 40)
        + planes.map(([x, y, s]) => `<path d="${BOMBER}" fill="#0a0e13" transform="translate(${x} ${y}) rotate(14) scale(${s})"/>`).join('')
        + `<path d="M0 640V560H34V600H70V520L96 500V590H150V545H186V606H232V470L262 450 270 492V596H330V540L360 524V600H420V500H448L470 460V586H530V530H566V600H600V800H0Z" fill="#050709"/>`
        + rect(0, 620, W, 180, '#050709');
    },
  },
  /* Tel örgü ve gelincik */
  'siper': {
    label: 'Gelincik ve dikenli tel',
    bg: '#221e17', ink: '#e9e0c9', accent: '#ea5140', on: '#160f0c', title: '#e9e0c9', pos: 'bottom',
    font: "'Alfa Slab One'", weight: 400, wf: .66,
    art(r) {
      const wire = (y, sag) => {
        let barbs = '';
        for (let x = 30; x < W; x += 74) {
          const t = x / W, yy = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag) + t * t * (y - 8);
          barbs += `<path d="M${x - 9} ${f(yy - 10)}L${x + 9} ${f(yy + 10)}M${x + 9} ${f(yy - 10)}L${x - 9} ${f(yy + 10)}"/>`;
        }
        return `<path d="M0 ${y}Q300 ${y + sag} 600 ${y - 8}"/>${barbs}`;
      };
      return rect(0, 0, W, H, '#cdc1a1')
        + `<path d="M300 318C306 410 292 500 300 640" fill="none" stroke="#221e17" stroke-width="7"/>`
        + `<g fill="#c8281e"><ellipse cx="208" cy="242" rx="118" ry="104" transform="rotate(-18 208 242)"/><ellipse cx="392" cy="242" rx="118" ry="104" transform="rotate(18 392 242)"/><ellipse cx="300" cy="152" rx="124" ry="94"/><ellipse cx="300" cy="330" rx="112" ry="82"/></g>`
        + `<g fill="none" stroke="#9a1c14" stroke-width="4"><path d="M300 240C256 196 214 176 150 170M300 240C344 196 386 176 450 170M300 240C248 262 214 300 190 332M300 240C352 262 386 300 410 332"/></g>`
        + disc(300, 240, 40, '#221e17')
        + `<g stroke="#cdc1a1" stroke-width="3">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${f(300 + Math.cos(a) * 14)} ${f(240 + Math.sin(a) * 14)}L${f(300 + Math.cos(a) * 32)} ${f(240 + Math.sin(a) * 32)}"/>`; }).join('')}</g>`
        + `<path d="M0 600C90 578 150 612 240 592 340 570 430 614 600 584V800H0Z" fill="#221e17"/>`
        + `<g fill="none" stroke="#221e17" stroke-width="4.5">${wire(474, 50)}${wire(530, 34)}</g>`
        + `<path d="M84 600L92 440M516 590L506 430" stroke="#221e17" stroke-width="13" fill="none"/>`;
    },
  },
  /* Hastalıklı sarı gök, kırmızı güneş, ölü Boğaz */
  'salgin': {
    label: 'Sarı gök ve siluet',
    bg: '#14130a', ink: '#eeeacb', accent: '#dcc920', on: '#14130a', title: '#14130a', pos: 'top',
    font: "'Big Shoulders Stencil'", weight: 900, wf: .41,
    art(r) {
      let slits = '';
      for (let i = 0; i < 26; i++) {
        const y = 628 + i * 6.4, w = 30 + r() * 150 + (i < 12 ? 40 : 0);
        slits += rect(f(340 + (r() - .5) * 220 - w / 2), f(y), f(w), 2.2, i % 3 ? '#dcc920' : '#c8321c');
      }
      return rect(0, 0, W, H, '#dcc920')
        + disc(372, 430, 136, '#c8321c')
        + mosque(218, 616, 92, 228, '#14130a') + mosque(486, 616, 58, 138, '#14130a')
        + `<path d="M0 616V560H30V586H62V616ZM340 616V590H378V616Z" fill="#14130a"/>`
        + rect(0, 612, W, 188, '#14130a') + slits
        + rain(r, 18, '#14130a', .75, { len: 8, slant: -.3, width: 3 });
    },
  },
  /* Boğaz köprüsü, neon tüpler */
  'neon': {
    label: 'Neon Boğaz',
    bg: '#0c0717', ink: '#efe7ff', accent: '#ff46aa', on: '#12051c', title: '#ff74c0', pos: 'top',
    font: "'Tilt Neon'", weight: 400, wf: .55, glow: true,
    art(r) {
      const glow = (d, c, w = 3.5) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w * 4}" opacity=".16"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
      let towers = '';
      [[34, 150, 44], [92, 86, 30], [130, 226, 26], [186, 118, 52], [262, 204, 22], [300, 96, 40], [362, 190, 34], [412, 70, 46], [478, 238, 28], [520, 130, 58]].forEach(([x, top, w]) => {
        const y = top + 210;
        towers += `<path d="M${x} 590V${y}H${x + w}V590"/>`;
      });
      let hang = '';
      for (let x = 170; x < 450; x += 24) {
        const t = (x - 130) / 340, y = 300 + 4 * 190 * (t - .5) * (t - .5);
        hang += `M${x} ${f(y)}V556`;
      }
      let refl = '';
      for (let i = 0; i < 34; i++) {
        const y = 596 + r() * 200, x = r() * W, w = 14 + r() * 90;
        refl += rect(f(x), f(y), f(w), 2.4, i % 2 ? '#ff46aa' : '#3ce6ea', `opacity="${f(.25 + r() * .6)}"`);
      }
      return rect(0, 0, W, H, '#0c0717')
        + `<g fill="none" stroke="#3ce6ea" stroke-width="2.4" opacity=".75">${towers}</g>`
        + `<path d="M366 590V286L378 232 390 286V590" fill="none" stroke="#3ce6ea" stroke-width="2.4"/>`
        + glow(`M0 412Q70 372 130 300 300 560 470 300 530 372 600 412`, '#ff46aa')
        + glow('M112 590V270H148V590M112 360H148M112 450H148', '#ff46aa', 4)
        + glow('M452 590V270H488V590M452 360H488M452 450H488', '#ff46aa', 4)
        + `<path d="${hang}" stroke="#ff46aa" stroke-width="1.4" opacity=".8"/>`
        + glow('M0 556H600', '#3ce6ea', 4)
        + refl
        + rain(r, 70, '#b6a5ff', .22, { len: 40, slant: .1, width: 1 });
    },
  },
  /* Başka bir dünyada, havada asılı mavi pencere */
  'safak': {
    label: 'Mavi pencere ve yeni dünya',
    bg: '#272050', ink: '#f9ebde', accent: '#f8ab91', on: '#272050', title: '#fff1c8', pos: 'bottom',
    font: "'Pixelify Sans'", weight: 600, wf: .56,
    art() {
      const bar = (y, w, c) => rect(146, y, 308, 14, '#10238f') + rect(146, y, w, 14, c);
      return rect(0, 0, W, H, '#f9d6a8') + rect(0, 0, W, 150, '#f4b79c') + rect(0, 150, W, 90, '#f7c7a1')
        + disc(300, 470, 118, '#fff1c8')
        + `<path d="M0 520L90 420 170 492 262 386 350 490 452 400 540 480 600 440V800H0Z" fill="#b58bb8"/>`
        + `<path d="M0 560L120 490 240 560 370 480 490 556 600 510V800H0Z" fill="#8d6bb0"/>`
        + `<path d="M0 610C110 560 210 590 320 584 420 578 510 560 600 590V800H0Z" fill="#4f8a6a"/>`
        + `<path d="M0 660C150 620 300 650 600 636V800H0Z" fill="#272050"/>`
        + `<path d="M296 626l2-22-4-16 7-8 7 8-3 16 3 22Z" fill="#272050"/>`
        + rect(120, 136, 372, 262, '#10238f', 'opacity=".35"')
        + rect(108, 124, 372, 262, '#2340e6') + `<rect x="108" y="124" width="372" height="262" fill="none" stroke="#a9d6ff" stroke-width="5"/>`
        + rect(108, 124, 372, 34, '#a9d6ff')
        + bar(190, 216, '#ff5f6d') + bar(218, 132, '#5fe3a1') + bar(246, 60, '#ffd65f')
        + [[146, 284, 210], [146, 306, 262], [146, 328, 150], [146, 350, 230]].map(([x, y, w]) => rect(x, y, w, 8, '#a9d6ff')).join('')
        + rect(124, 136, 180, 10, '#2340e6');
    },
  },
};

export const themeOf = key => THEMES[key] || THEMES.kuzey;

export function coverSVG(themeKey, seed = 'x') {
  const T = themeOf(themeKey);
  const r = rng(themeKey + '|' + seed);
  const id = 'p' + (counter++);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${T.art(r, id)}</svg>`;
}

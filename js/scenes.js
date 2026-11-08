// Sahne görselleri. Yapay zeka metni yazarken verdiği <sahne> tarifinden, karakter kartlarından ve
// senaryonun görsel kimliğinden tutarlı bir istem kurar, görseli üretir ve arka planda gösterir.

export const SCENE_STYLES = {
  sinematik: { label: 'Sinematik fotoğraf', text: 'cinematic film still, photorealistic, 35mm photography, natural moody lighting, shallow depth of field, rich detail', short: 'cinematic film still, photorealistic, moody lighting' },
  resim: { label: 'Dijital resim', text: 'digital painting, atmospheric concept art, painterly brushwork, dramatic lighting, rich detail', short: 'digital painting, concept art, dramatic lighting' },
  anime: { label: 'Anime', text: 'anime key visual, hand-painted background, clean line art, soft volumetric light, detailed scenery', short: 'anime key visual, soft light, detailed' },
};

// Her dünyanın görsel kimliği. Görseller konudan sapmasın diye her isteme eklenir.
const SCENARIO_VISUALS = {
  'got-hane': 'medieval low-fantasy kingdom, weathered stone keeps, wool fur and leather clothing, muted earthy colors',
  'got-saray': 'medieval royal capital, red stone castle halls, silk and velvet court clothing, torchlight',
  'got-tyrion': 'medieval tavern at night, rough wooden tables, tallow candles, wool and leather clothing',
  'twilight-forks': 'rainy small town in the modern Pacific Northwest, dense evergreen forest, overcast light, contemporary clothing',
  hogwarts: 'ancient magical boarding school castle, candlelit stone halls, long dark robes, misty highlands',
  'orta-dunya': 'epic high-fantasy wilderness, ancient ruins, handcrafted armor and cloaks, vast dramatic landscapes',
  'ikinci-dunya-savasi': 'World War II era 1939-1945, period-accurate uniforms and vehicles, war rooms with paper maps, muted colors',
  'birinci-dunya-savasi': 'World War I era 1914-1918, period-accurate uniforms, trenches and mud, early telephones, sepia tones',
  'salgin-istanbul': 'contemporary Istanbul during an epidemic, empty streets, Bosphorus, face masks, tense grey daylight',
  'neo-istanbul': 'cyberpunk Istanbul in 2099, neon-lit domes and minarets among holographic towers, rain-soaked streets',
  'baska-dunya': 'colorful fantasy world, medieval villages, magical creatures, adventurer clothing and armor',
};

const TAG_VISUALS = [
  ['Bilim Kurgu', 'science fiction setting, futuristic technology'],
  ['Kıyamet', 'post-apocalyptic world, ruined cities, scavenged gear'],
  ['Korku', 'dark horror atmosphere, deep shadows'],
  ['Fantastik', 'fantasy world, medieval clothing and architecture'],
  ['Isekai', 'colorful fantasy world, adventurer clothing'],
  ['Tarih', 'period-accurate historical setting and clothing'],
  ['Savaş', 'period-accurate war setting, uniforms'],
  ['Romantik', 'warm intimate atmosphere, soft light'],
];

/** Senaryonun görsel kimliği: hazır senaryolarda sabit, kendi yazılanlarda yapay zekanın verdiği */
export function visualAnchor(scen, messages = []) {
  if (scen.visual) return scen.visual;
  if (SCENARIO_VISUALS[scen.id]) return SCENARIO_VISUALS[scen.id];
  for (const m of messages) {
    if (m.role !== 'model') continue;
    const x = String(m.alts?.[m.ai] || '').match(/<(?:dunya|dünya)>([\s\S]*?)<\/(?:dunya|dünya)>/i);
    if (x && !sceneProblem(x[1])) return x[1].trim().slice(0, 160);
  }
  const hit = TAG_VISUALS.find(([t]) => (scen.tags || []).includes(t));
  return hit ? hit[1] : '';
}

/** Okul senaryolarında karakterler uzaktan gösterilir */
export const keepsDistance = scen => (scen.tags || []).includes('Okul');

/* ---------- etiketler ---------- */
const SCENE_RE = /<sahne(?:\s+kim\s*=\s*["“'‘]([^"”'’>]*)["”'’])?\s*>([\s\S]*?)<\/sahne>/gi;
const CARD_RE = /<karakter>([\s\S]*?)<\/karakter>/gi;

export function parseSceneTag(attr, body) {
  return {
    kim: attr === undefined ? null : attr.split(/[,;]/).map(x => x.trim()).filter(Boolean),
    text: body.replace(/\s+/g, ' ').trim(),
  };
}
export function parseScenes(raw) {
  return [...String(raw || '').matchAll(SCENE_RE)].map(x => parseSceneTag(x[1], x[2]));
}
export const sceneTagRe = () => new RegExp(SCENE_RE.source, SCENE_RE.flags);

export function parseCards(raw) {
  const out = [];
  for (const x of String(raw || '').matchAll(CARD_RE)) {
    x[1].split('\n').forEach(l => {
      const i = l.indexOf('|');
      if (i < 1) return;
      const name = l.slice(0, i).replace(/^[-*•\s]+/, '').trim();
      const look = l.slice(i + 1).replace(/\s+/g, ' ').trim();
      if (name && name.length <= 60 && look.split(' ').length >= 3 && !isUnsafe(look) && !isTurkish(look)) out.push({ name, look: look.slice(0, 220) });
    });
  }
  return out;
}

/** Karakter kartı listesi; mesajlardan hesaplanır, geri alma ve yeniden yazmayla tutarlı kalır */
export function applyCards(cast, raw, turn = 0) {
  const next = new Map(cast);
  parseCards(raw).forEach(c => next.set(c.name.toLocaleLowerCase('tr'), { ...c, turn }));
  return next;
}
export function castOf(messages, upto, edits = {}) {
  let cast = new Map();
  messages.slice(0, upto ?? messages.length).forEach((m, i) => {
    if (m.role === 'model') cast = applyCards(cast, m.alts?.[m.ai] || '', i);
  });
  return withEdits(cast, edits);
}
export function withEdits(cast, edits = {}) {
  const next = new Map(cast);
  Object.entries(edits).forEach(([k, look]) => {
    const it = next.get(k);
    if (it && look?.trim()) next.set(k, { ...it, look: look.trim() });
  });
  return next;
}
export function findCard(cast, name) {
  const k = String(name || '').trim().toLocaleLowerCase('tr');
  if (!k) return null;
  if (cast.has(k)) return cast.get(k);
  for (const [key, c] of cast) {
    const parts = key.split(/\s+/);
    if (parts.includes(k) || k.split(/\s+/).some(w => w.length > 2 && parts.includes(w))) return c;
  }
  return null;
}

/* ---------- denetim ---------- */
const TR_HINT = new Set('bir ve ile için gibi bu altında üzerinde içinde önünde arkasında yanında gece gündüz adam kadın eski yeni büyük küçük ışığı yağmur oda kapı masa'.split(' '));
function isTurkish(text) {
  if (/[ğışİĞŞ]/.test(text)) return true;
  const words = text.toLocaleLowerCase('tr').match(/[\p{L}]+/gu) || [];
  return words.filter(w => TR_HINT.has(w)).length >= 2;
}
const UNSAFE = /\b(nude|naked|nudity|nsfw|topless|lingerie|erotic|sexy|seductive|sensual|bikini|underwear|undress\w*|blood\w*|gore|gory|decapitat\w*|dismember\w*|corpses?|mutilat\w*|tortur\w*|rape\w*|swastikas?|nazis?)\b/i;
const isUnsafe = text => UNSAFE.test(text);

/** Tarif görsele çevrilemezse nedenini söyler */
export function sceneProblem(text) {
  const t = String(text || '').trim();
  if (t.split(/\s+/).length < 4) return 'kisa';
  if (isTurkish(t)) return 'turkce';
  if (isUnsafe(t)) return 'guvenlik';
  return null;
}

/** Tarifte kaçan özel isimleri temizler: görsel modeli isimleri bilmez, saçma sonuç üretir */
export function scrubNames(text, names = []) {
  let t = String(text || '');
  const parts = new Set();
  names.filter(Boolean).forEach(n => {
    parts.add(n);
    n.split(/\s+/).filter(w => w.length > 2).forEach(w => parts.add(w));
  });
  [...parts].sort((a, b) => b.length - a.length).forEach(n => {
    const safe = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`(?<![\\p{L}])${safe}(?![\\p{L}])`, 'giu'), 'a figure');
  });
  return t.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
}

const SEP = ' || ';
const PEOPLE = ' ++ ';
const clipWords = (s, n) => String(s || '').split(/\s+/).filter(Boolean).slice(0, n).join(' ').replace(/[,;]$/, '');

/** Tarif + kartlar + dünya kimliği = sahnenin anahtarı. Geçersizse null döner. */
export function composeScene({ text, kim, cast = new Map(), anchor = '', names = [], distant = false }) {
  if (sceneProblem(text)) return null;
  const allNames = [...names, ...[...cast.values()].map(c => c.name)];
  // kim verilmediyse tarifin içinde adı geçen karakterleri bul
  const who = kim ?? allNames.filter(n => n && new RegExp(`(?<![\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(text));
  const people = [...new Set(who.map(n => findCard(cast, n)).filter(Boolean))].slice(0, 3);
  let scene = scrubNames(text, allNames);
  if (distant) scene = `wide shot, figures seen from a distance, ${scene.replace(/^(extreme\s+)?(close-?up|medium(\s+close-?up)?(\s+shot)?|portrait)\b[^,]*,?\s*/i, '')}`;
  const chars = people.map(p => scrubNames(p.look, allNames)).join(PEOPLE);
  return [scene, chars, anchor].join(SEP);
}

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Tam istem: anahtarlı modeller uzun tarifleri okur */
export function fullPrompt(prompt, style) {
  const [scene, chars, anchor] = prompt.split(SEP);
  const st = SCENE_STYLES[style] || SCENE_STYLES.sinematik;
  return [scene, chars && `featuring ${chars.split(PEOPLE).join(' and ')}`, anchor, st.text].filter(Boolean).join(', ').slice(0, 1200);
}

/** Kısa istem: anahtarsız model yalnızca ilk ~75 jetonu okur, önemli olan başta olmalı.
 *  Bu model iki kişinin özelliklerini birbirine karıştırıyor, o yüzden yalnızca ilk kişiyi tarif ederiz. */
export function shortPrompt(prompt, style) {
  const [scene, chars, anchor] = prompt.split(SEP);
  const st = SCENE_STYLES[style] || SCENE_STYLES.sinematik;
  const first = chars ? chars.split(PEOPLE)[0] : '';
  return [clipWords(scene, 26), first && `featuring ${clipWords(first, 16)}`, clipWords(anchor, 8), st.short].filter(Boolean).join(', ');
}

export function sceneURLs(prompt, { key, style, seedBase, portrait }) {
  // Aynı oyunda aynı tohum: karakterler ve renkler kareler arasında daha tutarlı kalır
  const seed = hash(seedBase) % 1000000;
  // Görsel, gösterileceği alanın şeklinde üretilir; yoksa kırpılınca sahnenin çoğu kaybolur
  const small = portrait ? 'width=576&height=1024' : 'width=1024&height=576';
  const big = portrait ? 'width=720&height=1280' : 'width=1280&height=720';
  const classic = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt(prompt, style))}?${small}&seed=${seed}&safe=true`;
  if (!key) return [classic];
  return [`https://gen.pollinations.ai/image/${encodeURIComponent(fullPrompt(prompt, style))}?model=flux&${big}&seed=${seed}&nologo=true&safe=true&key=${encodeURIComponent(key)}`, classic];
}

const RETRY_MS = [6000, 15000];
const TIMEOUT_MS = 120000;
const FREE_GAP_MS = 47000;     // anahtarsız sınır: IP başına 45 saniyede bir görsel
// Servis hız sınırında hata yerine "Free limit reached" yazan GERÇEK BİR RESİM döndürür ve <img> bunu başarılı sayar.
// Durum kodu okunamadığı için hızından anlarız: sahte kart ~0,4 sn, gerçek üretim 6 sn ve üstü sürer.
const QUICK_MS = 3000;         // anahtarsız adres: bundan hızlı gelen ve daha önce üretilmemiş görsele güvenilmez
const KEY_QUICK_MS = 1200;     // anahtarlı adres daha hızlı üretir
const MAX_REFUSALS = 3;
const KNOWN_CAP = 400;
const LAST_KEY = 'diyar.imgLast';
const KNOWN_KEY = 'diyar.imgKnown';

const readLast = () => { try { return +localStorage.getItem(LAST_KEY) || 0; } catch { return 0; } };
const writeLast = v => { try { localStorage.setItem(LAST_KEY, String(v)); } catch {} };

// Üretildiği doğrulanan görseller: bunlar önbellekten gelir, sınıra takılmaz, hızlı gelmesi normaldir
let knownSet = null;
function known() {
  if (knownSet) return knownSet;
  try { knownSet = new Set(JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]')); } catch { knownSet = new Set(); }
  return knownSet;
}
const urlId = url => hash(url).toString(36) + url.length.toString(36);
const isKnown = url => known().has(urlId(url));
function remember(url) {
  const set = known();
  set.add(urlId(url));
  const list = [...set].slice(-KNOWN_CAP);
  knownSet = new Set(list);
  try { localStorage.setItem(KNOWN_KEY, JSON.stringify(list)); } catch {}
}

export class SceneStage {
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.layers = [...root.querySelectorAll('.layer')];
    this.front = 0;
    this.cache = new Map();   // sahne -> {status, src, tries, refusals}
    this.queue = [];
    this.busy = 0;
    this.active = null;
    this.shown = null;
    this.dead = false;
    this.max = opts.key ? 2 : 1;
    // Sayfa yenilense de sınır sürer; sayaç bu yüzden tarayıcıda saklanır
    this.coolUntil = opts.key ? 0 : readLast() + FREE_GAP_MS;
    this.loads = new Set();
  }
  setBase(html) {
    const l = this.layers[this.front];
    l.innerHTML = html; l.style.backgroundImage = ''; l.classList.add('on');
  }
  /** Ekranda görünmesi gereken sahne */
  want(prompt) {
    if (this.dead || !prompt) return;
    this.active = prompt;
    const c = this.cache.get(prompt);
    if (c?.status === 'ok') { this._show(c.src); return this._pump(); }
    if (!c) return this._enqueue(prompt);
    if (c.status === 'queued' && !this.queue.includes(prompt)) this.queue.unshift(prompt);
    this._pump();
  }
  /** Metin yazılırken gelen sonraki sahneleri önceden üret (yalnızca anahtarla, sınır yok) */
  prefetch(prompt) {
    if (this.dead || !prompt || !this.opts.key || this.cache.has(prompt)) return;
    this._enqueue(prompt, true);
  }
  /** Oyuncu "tekrar dene" dediğinde */
  retry() {
    if (!this.active) return;
    this.cache.delete(this.active);
    this.coolUntil = 0;
    this._enqueue(this.active);
  }
  _enqueue(prompt, later) {
    this.cache.set(prompt, { status: 'queued' });
    this.queue = this.queue.filter(p => p !== prompt);
    if (later) this.queue.push(prompt); else this.queue.unshift(prompt);
    // Hız sınırlıyken yalnızca ekrandaki sahne önemli; sırada eskiler birikmesin
    const cap = this.opts.key ? 4 : 1;
    while (this.queue.length > cap) this.cache.delete(this.queue.pop());
    this._pump();
  }
  _pump() {
    if (this.dead) return;
    clearTimeout(this.timer);
    if (this.busy >= this.max || !this.queue.length) return this._status();
    const i = this.queue.indexOf(this.active);
    const at = i >= 0 ? i : 0;
    const prompt = this.queue[at];
    // Beklerken yeni görsel istenmez; daha önce üretilmiş olan önbellekten hemen gelir
    const left = this.coolUntil - Date.now();
    if (left > 0 && !isKnown(sceneURLs(prompt, this.opts).at(-1))) {
      this.timer = setTimeout(() => this._pump(), Math.min(left, 1000));
      return this._status();
    }
    this.queue.splice(at, 1);
    this._run(prompt);
    this._pump();
  }
  async _run(prompt) {
    this.busy++;
    const prev = this.cache.get(prompt) || {};
    this.cache.set(prompt, { ...prev, status: 'loading' });
    this._status();
    const urls = sceneURLs(prompt, this.opts);
    let found = null, refused = false;
    for (let k = 0; k < urls.length && !this.dead; k++) {
      const url = urls[k], free = k === urls.length - 1;
      const started = Date.now();
      const r = await this._load(url);
      const quick = Date.now() - started < (free ? QUICK_MS : KEY_QUICK_MS);
      if (r.src) {
        // Hızlı gelen ve üretildiğini bilmediğimiz görsel sahte kart olabilir. Tam bekleme süresinden
        // sonra yine hızlı geliyorsa gerçektir (sınır çoktan bitti, görsel serviste hazırmış).
        if (!quick || isKnown(url) || (free && prev.waited)) {
          found = url;
          remember(url);
          if (k > 0) this.opts.onKeyProblem?.();
          if (free && !quick) { writeLast(started); this.coolUntil = started + FREE_GAP_MS; }
          break;
        }
        if (free) refused = true;
      } else if (free) refused = !!r.refused;
    }
    this.busy--;
    if (this.dead) return;
    if (found) {
      this.cache.set(prompt, { status: 'ok', src: found });
      if (this.active === prompt) this._show(found);
    } else if (refused) {
      const refusals = (prev.refusals || 0) + 1;
      if (refusals >= MAX_REFUSALS) this.cache.set(prompt, { status: 'fail' });
      else if (this.active === prompt) {
        // Sınırı başka bir sekme ya da aynı ağdaki biri doldurmuş olabilir; süresi bilinmediği için tam bekle
        writeLast(Date.now());
        this.coolUntil = Date.now() + FREE_GAP_MS;
        this.cache.set(prompt, { status: 'queued', refusals, waited: true });
        this.queue = this.queue.filter(p => p !== prompt);
        this.queue.unshift(prompt);
      } else this.cache.delete(prompt);
    } else {
      const tries = prev.tries || 0;
      if (tries < RETRY_MS.length) {
        this.cache.set(prompt, { status: 'retry', tries: tries + 1 });
        setTimeout(() => {
          if (this.dead) return;
          if (this.active === prompt) { this.cache.set(prompt, { status: 'queued', tries: tries + 1 }); this.queue.unshift(prompt); this._pump(); }
          else this.cache.delete(prompt);
        }, RETRY_MS[tries]);
      } else this.cache.set(prompt, { status: 'fail' });
    }
    this._pump();
  }
  /** Görseli <img> gibi yükler; servisin normal kullanım yolu budur.
   *  Durum kodu okunamadığı için reddi, hatanın ne kadar çabuk geldiğinden anlarız. */
  _load(url) {
    return new Promise(resolve => {
      const im = new Image();
      const started = Date.now();
      const done = r => { clearTimeout(to); this.loads.delete(stop); im.onload = im.onerror = null; resolve(r); };
      const stop = () => { im.src = ''; done({}); };
      const to = setTimeout(stop, TIMEOUT_MS);
      this.loads.add(stop);
      im.onload = () => done(im.naturalWidth ? { src: url } : {});
      im.onerror = () => done({ refused: Date.now() - started < QUICK_MS });
      im.src = url;
    });
  }
  _show(src) {
    if (this.dead || this.shown === src) return;
    this.shown = src;
    const back = this.layers[1 - this.front];
    const old = this.layers[this.front];
    clearTimeout(this.fadeTimer);
    back.innerHTML = '';
    back.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`;
    // Yeni görsel eskisinin üstünde belirir; eski, yenisi tamamen gelene dek yerinde kalır (siyaha düşmez)
    back.style.zIndex = 2; old.style.zIndex = 1;
    back.classList.remove('on'); void back.offsetWidth; back.classList.add('on');
    this.fadeTimer = setTimeout(() => old.classList.remove('on'), 2100);
    this.front = 1 - this.front;
    this._status();
  }
  _status() {
    const c = this.cache.get(this.active);
    let state = 'idle', seconds = 0;
    if (c?.status === 'fail') state = 'fail';
    else if (c?.status === 'loading' || c?.status === 'retry') state = 'loading';
    else if (c?.status === 'queued') {
      const left = Math.ceil((this.coolUntil - Date.now()) / 1000);
      if (left > 0) { state = 'wait'; seconds = left; } else state = 'loading';
    }
    this.opts.onStatus?.({ state, seconds });
  }
  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
    this.queue = [];
    [...this.loads].forEach(stop => stop());
  }
}

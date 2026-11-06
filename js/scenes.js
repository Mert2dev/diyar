// Sahne görselleri: hikayedeki <sahne> tariflerinden ücretsiz görsel üretir (Pollinations)
// ve oyun ekranının arka planında yumuşak geçişle gösterir.

export const SCENE_STYLES = {
  sinematik: { label: 'Sinematik fotoğraf', text: 'cinematic film still, photorealistic, 35mm photography, natural moody lighting, shallow depth of field, rich detail' },
  resim: { label: 'Dijital resim', text: 'digital painting, atmospheric concept art, painterly brushwork, dramatic lighting, rich detail' },
  anime: { label: 'Anime arka planı', text: 'anime background art, hand-painted look, soft volumetric light, detailed scenery' },
};
const SAFE = 'no text, no letters, no watermark, no recognizable real person, safe for work';

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function sceneURLs(prompt, { key, style, seedBase }) {
  const full = `${prompt}, ${(SCENE_STYLES[style] || SCENE_STYLES.sinematik).text}, ${SAFE}`.slice(0, 900);
  const enc = encodeURIComponent(full);
  const seed = hash(seedBase + '|' + prompt) % 1000000;
  // Anahtarsız klasik adres: en fazla 768x768 piksel alanı, 45 saniyede bir görsel, köşede logo
  const classic = `https://image.pollinations.ai/prompt/${enc}?width=1024&height=576&seed=${seed}&safe=true`;
  if (key) return [`https://gen.pollinations.ai/image/${enc}?model=flux&width=1280&height=720&seed=${seed}&nologo=true&safe=true&key=${encodeURIComponent(key)}`, classic];
  return [classic];
}

export class SceneStage {
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.layers = [...root.querySelectorAll('.layer')];
    this.front = 0;
    this.cache = new Map();   // tarif -> {status, src}
    this.queue = [];
    this.busy = 0;
    this.lastStart = 0;
    this.active = null;
    this.shown = null;
    this.dead = false;
    this.max = opts.key ? 2 : 1;
    this.gap = opts.key ? 0 : 46000;
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
    if (c?.status === 'ok') return this._show(c.src);
    if (!c) this._enqueue(prompt, true);
    else this._pump();
  }
  /** Hikaye yazılırken gelen yeni sahneyi önceden üret */
  prefetch(prompt) {
    if (this.dead || !prompt || this.cache.has(prompt)) return;
    this._enqueue(prompt, false);
  }
  _enqueue(prompt, urgent) {
    this.cache.set(prompt, { status: 'queued' });
    this.queue = this.queue.filter(p => p !== prompt);
    if (urgent) this.queue.unshift(prompt); else this.queue.push(prompt);
    // Kuyrukta en fazla 3 sahne beklesin; eskiler atılır (sonra yeniden istenebilir)
    while (this.queue.length > 3) {
      const i = this.queue.findIndex(p => p !== this.active);
      const [drop] = this.queue.splice(i < 0 ? 0 : i, 1);
      this.cache.delete(drop);
    }
    this._pump();
  }
  _pump() {
    if (this.dead) return;
    if (this.busy >= this.max || !this.queue.length) return this._status();
    const wait = this.gap - (Date.now() - this.lastStart);
    if (wait > 0) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this._pump(), wait);
      return this._status();
    }
    let i = this.queue.indexOf(this.active);
    if (i < 0) i = this.queue.length - 1; // en yeni sahne önce
    const [prompt] = this.queue.splice(i, 1);
    this.busy++; this.lastStart = Date.now();
    this.cache.set(prompt, { status: 'loading' });
    this._status();
    const urls = sceneURLs(prompt, this.opts);
    const tryAt = k => this._load(urls[k]).catch(() => (k + 1 < urls.length ? tryAt(k + 1) : Promise.reject()));
    tryAt(0)
      .then(src => { this.cache.set(prompt, { status: 'ok', src }); if (this.active === prompt) this._show(src); })
      .catch(() => { this.cache.set(prompt, { status: 'fail' }); setTimeout(() => this.cache.delete(prompt), 60000); })
      .finally(() => { this.busy--; this._pump(); });
  }
  _load(url) {
    return new Promise((res, rej) => {
      const im = new Image();
      const to = setTimeout(() => { im.src = ''; rej(); }, 90000);
      im.onload = () => { clearTimeout(to); im.naturalWidth ? res(url) : rej(); };
      im.onerror = () => { clearTimeout(to); rej(); };
      im.src = url;
    });
  }
  _show(src) {
    if (this.dead || this.shown === src) return;
    this.shown = src;
    const back = this.layers[1 - this.front];
    back.innerHTML = '';
    back.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`;
    back.classList.remove('on'); void back.offsetWidth; back.classList.add('on');
    this.layers[this.front].classList.remove('on');
    this.front = 1 - this.front;
  }
  _status() { this.opts.onStatus?.(this.busy > 0 || this.queue.length > 0); }
  destroy() { this.dead = true; clearTimeout(this.timer); this.queue = []; }
}

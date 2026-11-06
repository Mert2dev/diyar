import { SCENARIOS, CATEGORIES, SHELVES } from './scenarios.js';
import { coverSVG, THEMES } from './covers.js';
import { PROVIDERS, streamChat, complete, listModels, pickDefaultModel } from './ai.js';

/* ---------- yardımcılar ---------- */
const app = document.getElementById('app');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const store = {
  get(k, d) { try { const v = localStorage.getItem('diyar.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) {
    try { localStorage.setItem('diyar.' + k, JSON.stringify(v)); return true; }
    catch { toast('Kaydedilemedi: tarayıcı deposu dolmuş olabilir. Ayarlar\'dan yedek indirip eski oyunları sil.'); return false; }
  },
  del(k) { try { localStorage.removeItem('diyar.' + k); } catch {} },
};

const I = {
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/><circle cx="12" cy="12" r="7"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  panel: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>',
  forward: '<svg viewBox="0 0 24 24"><path d="M5 6l6 6-6 6M13 6l6 6-6 6"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M14 17l-5-5 5-5"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'az önce';
  if (d < 3600) return Math.floor(d / 60) + ' dk önce';
  if (d < 86400) return Math.floor(d / 3600) + ' saat önce';
  if (d < 86400 * 30) return Math.floor(d / 86400) + ' gün önce';
  return new Date(ts).toLocaleDateString('tr-TR');
}

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4200);
}

function download(name, text, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- ayarlar ---------- */
const DEFAULT_SETTINGS = { provider: 'gemini', keys: {}, models: {}, modelLists: {}, customBase: 'http://localhost:1234/v1', temperature: 0.9, length: 'orta' };
let settings = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) };
['keys', 'models', 'modelLists'].forEach(k => settings[k] = settings[k] || {});
const saveSettings = () => store.set('settings', settings);
const hasKey = () => settings.provider === 'custom' ? !!settings.customBase : !!(settings.keys[settings.provider] || '').trim();

async function ensureModel() {
  const p = settings.provider;
  if (settings.models[p]) return true;
  try {
    const list = await listModels(settings);
    settings.modelLists[p] = list;
    settings.models[p] = pickDefaultModel(p, list) || PROVIDERS[p].fallbackModel || '';
    saveSettings();
    return !!settings.models[p];
  } catch (e) {
    if (PROVIDERS[p].fallbackModel) { settings.models[p] = PROVIDERS[p].fallbackModel; saveSettings(); return true; }
    toast(e.message); return false;
  }
}

/* ---------- senaryolar ve kayıtlar ---------- */
const customs = () => store.get('custom', []);
const allScenarios = () => [...customs(), ...SCENARIOS];
const getScenario = (id, save) => allScenarios().find(s => s.id === id) || save?.snapshot || null;
const modeLabel = m => ({ anlatici: 'Anlatıcı', karakter: 'Karakter', ulke: 'Ülke yönetimi' }[m] || 'Anlatıcı');

const savesIndex = () => store.get('saves', []);
const loadSave = id => store.get('save.' + id, null);
function writeSave(save) {
  save.updatedAt = Date.now();
  store.set('save.' + save.id, save);
  const idx = savesIndex().filter(x => x.id !== save.id);
  idx.unshift({ id: save.id, scenarioId: save.scenarioId, title: save.title, label: save.label, turns: save.turns, updatedAt: save.updatedAt });
  store.set('saves', idx);
}
function deleteSave(id) { store.del('save.' + id); store.set('saves', savesIndex().filter(x => x.id !== id)); }

function coverHTML(s) {
  if (s.image) return `<img src="${esc(s.image)}" alt="">`;
  return coverSVG(s.cover || 'kuzey', s.id);
}

/* ---------- metin işleme ---------- */
const TAG_CUT = /<\s*\/?\s*(durum|se[cç]enek)/i;
function splitOutput(raw) {
  raw = raw || '';
  let stats = null, options = [];
  const dm = raw.match(/<durum>([\s\S]*?)<\/durum>/i);
  if (dm) stats = parseStats(dm[1]);
  const om = raw.match(/<se[cç]enekler>([\s\S]*?)(<\/se[cç]enekler>|$)/i);
  if (om) options = om[1].split('\n').map(l => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim()).filter(l => l && !l.startsWith('<')).slice(0, 4);
  let visible = raw;
  const cut = raw.search(TAG_CUT);
  if (cut >= 0) visible = raw.slice(0, cut);
  visible = visible.replace(/<[^>\n]{0,14}$/, '');
  return { visible: visible.trim(), stats, options };
}
function parseStats(txt) {
  const t = txt.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try { const j = JSON.parse(t); if (j && typeof j === 'object') return j; } catch {}
  const o = {};
  t.split('\n').forEach(l => { const m = l.match(/^\s*[-*"]?\s*([^:"]+)"?\s*:\s*(.+?),?\s*$/); if (m) o[m[1].trim()] = m[2].replace(/^"|"$/g, ''); });
  return Object.keys(o).length ? o : null;
}
function md(text) {
  let t = esc(text);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/(&quot;|“)([^\n]+?)(&quot;|”)/g, '<span class="q">$1$2$3</span>');
  t = t.replace(/\[([^\]\n]{2,140})\]/g, '<span class="sys">[$1]</span>');
  return t.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}
const cur = m => m.alts[m.ai] || '';

/* ---------- yapay zeka talimatı ---------- */
const BASE_RULES = `Sen "Diyar" adlı interaktif bir hikaye oyununun anlatıcısı ve oyun yöneticisisin. Oyuncuyla birlikte, onun kararlarıyla şekillenen bir hikaye yazıyorsun.

Temel kurallar:
- Her zaman akıcı, doğal ve edebi bir Türkçe kullan. Özel isimleri (Winterfell, Forks, Hogwarts vb.) orijinal halleriyle yaz.
- Oyuncunun karakterinin ne düşündüğünü, ne söylediğini ya da ne yaptığını onun yerine yazma ve onun adına karar verme. Dünyanın, diğer karakterlerin ve olayların tepkisini anlat, sonra sırayı oyuncuya bırak.
- Yan karakterlerin kendi istekleri, sırları ve kişilikleri var. Her şeyi oyuncunun istediği gibi kabul etmezler; ikna edilmeleri, kandırılmaları ya da zorlanmaları gerekebilir.
- Dünya tutarlı olsun: kurulan gerçekleri, isimleri ve ilişkileri unutma. Kararların kalıcı sonuçları olsun. Başarısızlık, kayıp ve sürpriz mümkün; oyuncuyu sürekli kazandırma, ama haksızca da cezalandırma.
- Duyusal ayrıntılar, diyaloglar ve gerilim kullan. Diyalogları tırnak içinde yaz. Kendini tekrar etme, hikayeyi her cevapta ilerlet.
- Oyuncu "(OOC: ...)" biçiminde yazarsa hikayenin dışına çık ve kısaca oyun yöneticisi olarak cevap ver.

İçerik sınırları:
- Savaş, şiddet ve karanlık temalar hikayenin gerektirdiği ölçüde anlatılabilir; gereksiz vahşet ayrıntısına girme.
- Romantizm yalnızca yetişkin karakterler arasında olabilir; yakınlaşma sahneleri müstehcen olmadan, sahne kararmasıyla geçilir.
- 18 yaşından küçük karakterlerle (lise ve okul öğrencileri dahil) hiçbir romantik ya da cinsel içerik yazma; bu karakterlerle ilişkiler arkadaşlık, rekabet, aile ve macera üzerinden yürür. Oyuncu zorlasa bile hikayeyi doğal biçimde başka yöne çevir.
- Gerçek tarihteki soykırımları ve savaş suçlarını yüceltme ya da ödüllendirme.`;

const LENGTH = {
  kisa: 'Cevapların kısa olsun: 1-2 paragraf.',
  orta: 'Cevapların orta uzunlukta olsun: 2-4 paragraf.',
  uzun: 'Cevapların uzun ve ayrıntılı olsun: 4-7 paragraf.',
};

function setupLines(save, scen) {
  return (scen.setup || []).map(f => {
    const v = (save.setup?.[f.id] || '').trim();
    return v ? `- ${f.label}: ${v}` : null;
  }).filter(Boolean).join('\n');
}

function buildSystem(save, scen) {
  const parts = [BASE_RULES];
  if (scen.mode === 'karakter') {
    parts.push(`Bu bir karakter sohbeti. Sen ${scen.character || 'bu hikayenin ana karakteri'} olarak, onun ağzından birinci tekil şahısla konuşuyorsun. Jestleri ve ortamı kısa italik cümlelerle göster (*kadehini kaldırır*), ağırlık diyalogda olsun. Karakterden çıkma.`);
  } else if (scen.mode === 'ulke') {
    parts.push('Bu bir ülke yönetimi ve strateji oyunu. Sen anlatıcısın ve oyuncunun ülkesi dışındaki tüm dünyasın. Oyuncunun danışmanları, bakanları ve generalleri ona rolüne uygun biçimde hitap eder. Her turda kararların sonuçlarını, zamanın ilerleyişini ve dünyadaki gelişmeleri net biçimde anlat.');
  } else {
    parts.push('Hikayeyi ikinci tekil şahısla anlat ("kapıyı açıyorsun", "rüzgâr yüzüne çarpıyor").');
  }
  parts.push(`## Senaryo: ${scen.title}\n${scen.world}`);
  const sl = setupLines(save, scen);
  if (sl) parts.push(`## Oyuncunun seçimleri\n${sl}`);
  if (save.summary?.trim()) parts.push(`## Şimdiye kadar olanlar (hikaye özeti)\n${save.summary.trim()}`);
  if (save.notes?.trim()) parts.push(`## Oyuncunun sabitlediği notlar (bunlara her zaman uy)\n${save.notes.trim()}`);
  let fmt = `## Cevap biçimi\n- ${LENGTH[settings.length] || LENGTH.orta}\n- Hikaye metnini düz yaz; vurgu için **kalın** ve *italik* kullanabilirsin. Başlık ve madde listesi kullanma.`;
  if (scen.stats?.length) {
    const keys = scen.stats.map(s => `"${s.k}": ${s.num ? '0-100 arası sayı' : (s.hint || 'kısa metin')}${s.num && s.hint ? ` (${s.hint})` : ''}`).join(', ');
    fmt += `\n- Hikaye metninden sonra güncel durumu tek satır JSON olarak ver: <durum>{...}</durum>. Anahtarlar: ${keys}. Değerleri hikayedeki olaylara göre gerçekçi biçimde güncelle; listeleri virgülle ayrılmış kısa metin olarak yaz.`;
  }
  fmt += `\n- En sonda oyuncunun yapabileceği 3 kısa ve birbirinden farklı eylem öner (her biri en fazla 12 kelime):\n<secenekler>\n- ...\n- ...\n- ...\n</secenekler>`;
  parts.push(fmt);
  return parts.join('\n\n');
}

function kickoffText(save, scen) {
  const sl = setupLines(save, scen);
  return `[Oyun başlıyor]${sl ? '\n' + sl : ''}\n\n${scen.openingPrompt || 'Açılış sahnesini yaz ve oyuncuyu hikayenin içine al.'}`;
}

function buildHistory(save, scen, uptoIdx) {
  const msgs = save.messages.slice(save.sumUpTo || 0, uptoIdx);
  const kick = (save.sumUpTo || 0) > 0
    ? '[Hikaye, sistem talimatındaki özetin bittiği yerden devam ediyor. Kaldığın yerden sürdür.]'
    : kickoffText(save, scen);
  const h = [{ role: 'user', text: kick }];
  let lastModel = -1;
  msgs.forEach((m, i) => { if (m.role === 'model') lastModel = i; });
  msgs.forEach((m, i) => {
    let text;
    if (m.role === 'model') {
      text = cur(m).replace(/<se[cç]enekler>[\s\S]*?(<\/se[cç]enekler>|$)/gi, '');
      if (i !== lastModel) text = text.replace(/<durum>[\s\S]*?<\/durum>/gi, '');
      text = text.trim();
    } else {
      text = m.cont ? '(Oyuncu şimdilik bir şey yapmıyor. Hikayeyi biraz ilerlet ama oyuncu adına karar verme.)' : m.text;
    }
    if (!text) return;
    const role = m.role === 'model' ? 'model' : 'user';
    const last = h[h.length - 1];
    if (last.role === role) last.text += '\n\n' + text; else h.push({ role, text });
  });
  return h;
}

/* ---------- modal ---------- */
let modalClose = null;
function openModal(html, cls = '', onClose) {
  closeModal(true);
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(back);
  document.body.classList.add('noscroll');
  back.addEventListener('mousedown', e => { if (e.target === back) closeModal(); });
  modalClose = onClose || null;
  requestAnimationFrame(() => back.classList.add('in'));
  const focusable = $('input:not([type=hidden]), select, textarea, button', back);
  setTimeout(() => focusable?.focus({ preventScroll: true }), 30);
  return back;
}
function closeModal(silent) {
  const m = $('.modal-back');
  if (!m) return;
  m.remove();
  document.body.classList.remove('noscroll');
  const cb = modalClose; modalClose = null;
  if (!silent && cb) cb();
}

/* ---------- yönlendirme ---------- */
let view = '';
let P = null; // aktif oyun

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'oyna' && parts[1]) { closeModal(true); return renderPlay(parts[1]); }
  if (parts[0] === 'olustur') { closeModal(true); return renderCreator(parts[1]); }
  if (view !== 'home') renderHome();
  if (parts[0] === 'senaryo' && parts[1]) openScenario(parts[1]);
  else closeModal(true);
}
function leavePlay() {
  if (P?.ctrl) P.ctrl.abort();
  P = null;
}

/* ---------- ana sayfa ---------- */
const homeState = { cat: 'Tümü', q: '' };

function topbar(extra = '') {
  return `<header class="topbar">
    <a class="brand" href="#/" aria-label="Diyar ana sayfa"><span class="brand-mark" aria-hidden="true"></span>Diyar</a>
    ${extra}
    <div class="topbar-actions">
      <a class="btn ghost" href="#/olustur">${I.plus}<span>Senaryo oluştur</span></a>
      <button class="icon-btn" data-act="settings" aria-label="Ayarlar" title="Ayarlar">${I.gear}</button>
    </div>
  </header>`;
}

function renderHome() {
  leavePlay();
  view = 'home';
  document.title = 'Diyar — hikaye oyunları';
  const saves = savesIndex();
  const last = saves[0];
  const lastScen = last && getScenario(last.scenarioId, loadSave(last.id));
  const featured = lastScen || SCENARIOS[0];
  const heroAction = lastScen
    ? `<a class="btn primary big" href="#/oyna/${esc(last.id)}">Kaldığın yerden devam et</a><span class="hero-meta">${esc(last.label || '')}${last.turns ? `, ${last.turns} tur` : ''}, ${timeAgo(last.updatedAt)}</span>`
    : `<a class="btn primary big" href="#/senaryo/${esc(featured.id)}">Bu dünyaya gir</a><span class="hero-meta">${modeLabel(featured.mode)} modu</span>`;
  const cats = ['Tümü', ...CATEGORIES.filter(c => allScenarios().some(s => (s.tags || []).includes(c)))];
  if (customs().length) cats.push('Benim senaryolarım');

  app.innerHTML = `
  <div class="home">
    ${topbar(`<label class="search">${I.search}<input type="search" id="q" placeholder="Dünya, karakter ya da konu ara" value="${esc(homeState.q)}" aria-label="Senaryo ara"></label>`)}
    ${!hasKey() ? `<div class="key-banner"><div><strong>Başlamadan önce:</strong> Diyar, ücretsiz bir Google Gemini anahtarıyla çalışır. Almak bir dakika sürer.</div><button class="btn primary" data-act="settings">Anahtarı ekle</button></div>` : ''}
    <section class="hero">
      <div class="hero-art">${coverHTML(featured)}</div>
      <div class="hero-text">
        <p class="hero-kicker">${lastScen ? 'Son oynadığın' : 'Bu haftanın dünyası'}</p>
        <h1>${esc(featured.title)}</h1>
        <p class="hero-sub">${esc(featured.subtitle)}</p>
        <div class="hero-cta">${heroAction}</div>
      </div>
    </section>
    <nav class="chips" aria-label="Kategoriler">
      ${cats.map(c => `<button class="chip ${c === homeState.cat ? 'on' : ''}" data-act="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </nav>
    <div id="shelves"></div>
    <footer class="foot">
      <p>Oyunların ve senaryoların bu tarayıcıda saklanır. Başka bir cihaza geçerken <button class="linklike" data-act="settings">Ayarlar</button> bölümünden yedeğini al.</p>
    </footer>
  </div>`;
  $('#q').addEventListener('input', debounce(e => { homeState.q = e.target.value.trim(); renderShelves(); }, 150));
  renderShelves();
}

function scenCard(s) {
  return `<a class="card" href="#/senaryo/${esc(s.id)}">
    <div class="cover">${coverHTML(s)}<span class="badge">${modeLabel(s.mode)}</span></div>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.subtitle)}</p>
  </a>`;
}
function saveCard(x) {
  const save = loadSave(x.id);
  const s = getScenario(x.scenarioId, save);
  if (!s) return '';
  return `<a class="card save" href="#/oyna/${esc(x.id)}">
    <div class="cover">${coverHTML(s)}<span class="badge">${x.turns || 0} tur</span></div>
    <h3>${esc(s.title)}</h3>
    <p>${esc(x.label || '')}${x.label ? ', ' : ''}${timeAgo(x.updatedAt)}</p>
  </a>`;
}
const createCard = () => `<a class="card create" href="#/olustur"><div class="cover create-cover">${I.plus}<span>Kendi dünyanı yaz</span></div><h3>Yeni senaryo</h3><p>Dünyanı, karakterlerini ve açılış sahneni sen belirle.</p></a>`;

function renderShelves() {
  const el = $('#shelves'); if (!el) return;
  const q = homeState.q.toLocaleLowerCase('tr');
  const cat = homeState.cat;
  if (cat === 'Tümü' && !q) {
    const saves = savesIndex().slice(0, 8);
    const mine = customs();
    let html = '';
    if (saves.length) html += shelf('Kaldığın yerden devam et', '', saves.map(saveCard).join(''), 'row');
    SHELVES.forEach(sh => {
      const list = SCENARIOS.filter(s => s.shelf === sh.id);
      if (list.length) html += shelf(sh.title, sh.hint, list.map(scenCard).join(''));
    });
    html += shelf('Senin senaryoların', mine.length ? '' : 'Henüz yok. İlkini yazmak birkaç dakika sürer.', mine.map(scenCard).join('') + createCard());
    el.innerHTML = html;
    return;
  }
  let list = allScenarios();
  if (cat === 'Benim senaryolarım') list = customs();
  else if (cat !== 'Tümü') list = list.filter(s => (s.tags || []).includes(cat));
  if (q) list = list.filter(s => [s.title, s.subtitle, s.description, ...(s.tags || [])].join(' ').toLocaleLowerCase('tr').includes(q));
  el.innerHTML = list.length
    ? shelf(`${list.length} senaryo`, '', list.map(scenCard).join(''))
    : `<div class="empty"><p>Bu aramaya uyan bir senaryo yok.</p><a class="btn" href="#/olustur">Bu dünyayı kendin yaz</a></div>`;
}
function shelf(title, hint, cards, kind = 'grid') {
  return `<section class="shelf"><div class="shelf-head"><h2>${esc(title)}</h2>${hint ? `<p>${esc(hint)}</p>` : ''}</div><div class="${kind === 'row' ? 'row-scroll' : 'grid'}">${cards}</div></section>`;
}

/* ---------- senaryo detayı ---------- */
function openScenario(id) {
  const s = getScenario(id);
  if (!s) { toast('Senaryo bulunamadı.'); location.hash = '#/'; return; }
  const saves = savesIndex().filter(x => x.scenarioId === id);
  const isCustom = customs().some(c => c.id === id);
  const fields = (s.setup || []).map(f => {
    const req = f.required ? 'required' : '';
    if (f.type === 'select') {
      return `<label class="field"><span>${esc(f.label)}</span><select name="${esc(f.id)}" data-custom="${f.allowCustom ? 1 : 0}">${f.options.map(o => `<option>${esc(o)}</option>`).join('')}${f.allowCustom ? '<option value="__diger">Diğer (kendim yazacağım)</option>' : ''}</select>
      ${f.allowCustom ? `<input class="custom-in" name="${esc(f.id)}__c" placeholder="Kendi seçimini yaz" hidden>` : ''}</label>`;
    }
    return `<label class="field"><span>${esc(f.label)}</span><input name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" ${req} maxlength="160"></label>`;
  }).join('');
  const back = openModal(`
    <div class="scen-cover">${coverHTML(s)}<button class="icon-btn modal-x" data-act="close-modal" aria-label="Kapat">${I.close}</button></div>
    <div class="scen-body">
      <p class="scen-tags">${modeLabel(s.mode)} modu${(s.tags || []).length ? ', ' + esc(s.tags.slice(0, 4).join(', ')) : ''}</p>
      <h2>${esc(s.title)}</h2>
      <p class="scen-desc">${esc(s.description || s.subtitle)}</p>
      ${saves.length ? `<div class="scen-saves"><h3>Bu dünyadaki oyunların</h3>${saves.map(x => `<div class="save-row"><a href="#/oyna/${esc(x.id)}"><strong>${esc(x.label || 'Oyun')}</strong><span>${x.turns || 0} tur, ${timeAgo(x.updatedAt)}</span></a><button class="icon-btn sm" data-act="del-save" data-id="${esc(x.id)}" aria-label="Oyunu sil" title="Oyunu sil">${I.trash}</button></div>`).join('')}</div>` : ''}
      <form class="setup" id="setup-form">
        <h3>${saves.length ? 'Yeni bir oyun başlat' : 'Oyuna hazırlan'}</h3>
        ${fields}
        <button class="btn primary big" type="submit">Oyuna başla</button>
      </form>
      ${isCustom ? `<div class="scen-own"><a class="btn ghost" href="#/olustur/${esc(s.id)}">${I.edit}<span>Senaryoyu düzenle</span></a><button class="btn ghost danger" data-act="del-scen" data-id="${esc(s.id)}">${I.trash}<span>Senaryoyu sil</span></button></div>` : ''}
    </div>`, 'scen-modal', () => { if (location.hash.startsWith('#/senaryo')) location.hash = '#/'; });
  $$('select[data-custom="1"]', back).forEach(sel => sel.addEventListener('change', () => {
    const inp = sel.parentElement.querySelector('.custom-in');
    inp.hidden = sel.value !== '__diger'; if (!inp.hidden) inp.focus();
  }));
  $('#setup-form', back).addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const setup = {};
    (s.setup || []).forEach(f => {
      let v = (fd.get(f.id) || '').toString().trim();
      if (v === '__diger') v = (fd.get(f.id + '__c') || '').toString().trim();
      setup[f.id] = v;
    });
    startGame(s, setup);
  });
}

function startGame(s, setup) {
  const isCustom = customs().some(c => c.id === s.id);
  const labelParts = (s.setup || []).filter(f => f.type !== 'select' || f.id === 'ulke').map(f => setup[f.id]).filter(Boolean).slice(0, 2);
  const save = {
    id: uid(), scenarioId: s.id, title: s.title,
    label: labelParts.join(', ') || 'Yeni oyun',
    setup, messages: [], summary: '', sumUpTo: 0, notes: '', turns: 0,
    createdAt: Date.now(), updatedAt: Date.now(),
    snapshot: isCustom ? s : null,
  };
  writeSave(save);
  location.hash = '#/oyna/' + save.id;
}

/* ---------- oyun ekranı ---------- */
function renderPlay(id) {
  leavePlay();
  const save = loadSave(id);
  const scen = save && getScenario(save.scenarioId, save);
  if (!save || !scen) { toast('Bu oyun bulunamadı.'); location.hash = '#/'; return; }
  view = 'play';
  P = { save, scen, busy: false, ctrl: null, error: null, summarizing: false };
  document.title = `${scen.title} — Diyar`;
  const wide = window.matchMedia('(min-width: 1100px)').matches;
  app.innerHTML = `
  <div class="play ${wide ? 'panel-open' : ''}">
    <header class="play-top">
      <a class="icon-btn" href="#/" aria-label="Ana sayfa" title="Ana sayfa">${I.back}</a>
      <div class="play-title"><strong>${esc(scen.title)}</strong><span id="save-label">${esc(save.label)}</span></div>
      <button class="icon-btn" data-act="settings" aria-label="Ayarlar" title="Ayarlar">${I.gear}</button>
      <button class="icon-btn" data-act="toggle-panel" aria-label="Durum ve hafıza paneli" title="Durum ve hafıza">${I.panel}</button>
    </header>
    <div class="play-body">
      <main class="story-wrap" id="story-wrap"><div class="story" id="story"></div></main>
      <aside class="panel" id="panel" aria-label="Durum ve hafıza"></aside>
    </div>
    <footer class="composer">
      <div class="options" id="options"></div>
      <form class="compose" id="compose">
        <textarea id="input" rows="1" placeholder="Ne yapıyorsun?" aria-label="Eylemin"></textarea>
        <button type="button" class="icon-btn" data-act="continue" title="Bir şey yapmadan hikayeyi ilerlet" aria-label="Hikayeyi ilerlet">${I.forward}</button>
        <button type="submit" class="send" id="send" aria-label="Gönder">${I.send}</button>
      </form>
    </footer>
  </div>`;
  const input = $('#input');
  const resize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 180) + 'px'; };
  input.addEventListener('input', resize);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#compose').requestSubmit(); }
  });
  $('#compose').addEventListener('submit', e => {
    e.preventDefault();
    if (P.busy) { P.ctrl?.abort(); return; }
    const t = input.value.trim();
    if (!t) { if (lastMsg()?.role === 'user') generate('new'); return; }
    input.value = ''; resize();
    sendUser(t);
  });
  renderStory(true);
  renderPanel();
  updateComposer();
  if (!save.messages.length) generate('new');
}

const lastMsg = () => P.save.messages[P.save.messages.length - 1];

function msgHTML(m, i, isLast) {
  if (m.role === 'user') {
    if (m.cont) return `<div class="msg cont" data-i="${i}"><span>hikaye ilerliyor</span><div class="msg-tools"><button class="icon-btn sm" data-act="cut" data-i="${i}" title="Buradan sonrasını sil" aria-label="Buradan sonrasını sil">${I.trash}</button></div></div>`;
    return `<div class="msg user" data-i="${i}"><div class="msg-body">${md(m.text)}</div>
      <div class="msg-tools"><button class="icon-btn sm" data-act="edit" data-i="${i}" title="Düzenle" aria-label="Düzenle">${I.edit}</button><button class="icon-btn sm" data-act="cut" data-i="${i}" title="Buradan sonrasını sil" aria-label="Buradan sonrasını sil">${I.trash}</button></div></div>`;
  }
  const { visible } = splitOutput(cur(m));
  const n = m.alts.length;
  return `<div class="msg model" data-i="${i}"><div class="msg-body">${md(visible)}</div>
    <div class="msg-tools">
      ${n > 1 ? `<button class="icon-btn sm" data-act="alt" data-d="-1" data-i="${i}" aria-label="Önceki sürüm" ${m.ai === 0 ? 'disabled' : ''}>${I.left}</button><span class="alt-n">${m.ai + 1}/${n}</span><button class="icon-btn sm" data-act="alt" data-d="1" data-i="${i}" aria-label="Sonraki sürüm" ${m.ai === n - 1 ? 'disabled' : ''}>${I.right}</button>` : ''}
      ${isLast ? `<button class="icon-btn sm" data-act="regen" title="Yeniden yaz" aria-label="Yeniden yaz">${I.redo}</button>` : ''}
      <button class="icon-btn sm" data-act="edit" data-i="${i}" title="Düzenle" aria-label="Düzenle">${I.edit}</button>
      <button class="icon-btn sm" data-act="cut" data-i="${i}" title="Buradan sonrasını sil" aria-label="Buradan sonrasını sil">${I.trash}</button>
    </div></div>`;
}

function renderStory(jump) {
  const el = $('#story'); if (!el) return;
  const { save, scen } = P;
  const msgs = save.messages;
  const head = `<div class="story-head"><h1>${esc(scen.title)}</h1><p>${esc(save.label)}</p></div>`;
  let html = head;
  const lastIdx = msgs.length - 1;
  msgs.forEach((m, i) => {
    if (i === save.sumUpTo && save.sumUpTo > 0) html += `<div class="memory-line"><span>Bu noktadan öncesi hikaye özetine aktarıldı</span></div>`;
    html += msgHTML(m, i, i === lastIdx && !P.busy);
  });
  if (P.error) {
    html += `<div class="err" role="alert"><p>${esc(P.error.message)}</p><div class="row"><button class="btn primary" data-act="retry">Tekrar dene</button>${/anahtar|model/.test(P.error.kind) ? '<button class="btn" data-act="settings">Ayarları aç</button>' : ''}</div></div>`;
  }
  if (!msgs.length && P.busy) html += `<div class="msg model"><div class="msg-body"><p class="loading">Dünya kuruluyor</p></div></div>`;
  el.innerHTML = html;
  if (jump) scrollStory(true);
  renderOptions();
}

function renderOptions() {
  const el = $('#options'); if (!el) return;
  const m = lastMsg();
  if (P.busy || !m || m.role !== 'model' || P.error) { el.innerHTML = ''; return; }
  const { options } = splitOutput(cur(m));
  el.innerHTML = options.map(o => `<button class="opt" data-act="opt">${esc(o)}</button>`).join('');
}

function scrollStory(force) {
  const w = $('#story-wrap'); if (!w) return;
  const near = w.scrollHeight - w.scrollTop - w.clientHeight < 220;
  if (force || near) w.scrollTop = w.scrollHeight;
}

function updateComposer() {
  const b = $('#send'); if (!b) return;
  b.innerHTML = P.busy ? I.stop : I.send;
  b.setAttribute('aria-label', P.busy ? 'Durdur' : 'Gönder');
  b.classList.toggle('stop', P.busy);
  $('.play')?.classList.toggle('busy', P.busy);
}

function currentStats() {
  const msgs = P.save.messages;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role !== 'model') continue;
    const { stats } = splitOutput(cur(msgs[i]));
    if (stats) return stats;
  }
  return null;
}

function statsHTML() {
  const st = currentStats();
  const defs = P.scen.stats || [];
  if (!defs.length && !st) return '';
  if (!st) return `<section class="pbox"><h3>Durum</h3><p class="hint">Hikaye başladığında burada görünecek.</p></section>`;
  const keys = [...defs.map(d => d.k), ...Object.keys(st).filter(k => !defs.some(d => d.k === k))];
  const rows = keys.filter(k => st[k] !== undefined && st[k] !== '').map(k => {
    const d = defs.find(x => x.k === k);
    let v = st[k];
    if (Array.isArray(v)) v = v.join(', ');
    else if (v && typeof v === 'object') v = Object.entries(v).map(([a, b]) => `${a}: ${b}`).join(', ');
    const num = parseFloat(v);
    if (d?.num && !isNaN(num)) {
      const pct = Math.max(0, Math.min(100, num));
      return `<div class="stat"><div class="stat-top"><span>${esc(k)}</span><b>${Math.round(num)}</b></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
    }
    return `<div class="stat text"><span>${esc(k)}</span><p>${esc(String(v))}</p></div>`;
  }).join('');
  return `<section class="pbox"><h3>Durum</h3>${rows}</section>`;
}

function renderPanel() {
  const el = $('#panel'); if (!el) return;
  const { save, scen } = P;
  const sl = (scen.setup || []).map(f => save.setup?.[f.id] ? `<li><span>${esc(f.label)}</span>${esc(save.setup[f.id])}</li>` : '').join('');
  el.innerHTML = `
    <button class="icon-btn panel-x" data-act="toggle-panel" aria-label="Paneli kapat">${I.close}</button>
    ${statsHTML()}
    <section class="pbox">
      <h3>Hafıza notları</h3>
      <p class="hint">Yapay zekanın asla unutmamasını istediğin şeyler. Örneğin: "Kardeşimin adı Aras. Sol kolum yaralı."</p>
      <textarea data-field="notes" rows="4" placeholder="Not ekle">${esc(save.notes)}</textarea>
    </section>
    <section class="pbox">
      <details ${save.summary ? '' : ''}>
        <summary>Hikaye özeti${P.summarizing ? ' <em>(güncelleniyor)</em>' : ''}</summary>
        <p class="hint">Uzun oyunlarda eski olaylar buraya otomatik özetlenir, böylece yapay zeka yüzlerce mesaj sonra bile hikayeyi hatırlar. İstersen düzeltebilirsin.</p>
        <textarea data-field="summary" rows="8" placeholder="Henüz özet yok. Hikaye uzadıkça kendiliğinden dolacak.">${esc(save.summary)}</textarea>
      </details>
    </section>
    <section class="pbox">
      <h3>Bu oyun</h3>
      <ul class="facts">${sl}<li><span>Tur sayısı</span>${save.turns || 0}</li></ul>
      <p class="hint">İpucu: Hikayenin dışına çıkıp yapay zekayla konuşmak için mesajını (OOC: ...) diye yaz. Örneğin: (OOC: Bella'yla daha çok sahne olsun.)</p>
      <div class="pbtns">
        <button class="btn sm" data-act="rename">Adını değiştir</button>
        <button class="btn sm" data-act="export-story">Hikayeyi indir</button>
        <button class="btn sm danger" data-act="del-current">Oyunu sil</button>
      </div>
    </section>`;
  $$('textarea[data-field]', el).forEach(t => t.addEventListener('input', debounce(() => { P.save[t.dataset.field] = t.value; writeSave(P.save); }, 400)));
}

function sendUser(text, cont = false) {
  const { save } = P;
  P.error = null;
  save.messages.push(cont ? { role: 'user', cont: true, text: '' } : { role: 'user', text });
  save.turns = (save.turns || 0) + 1;
  writeSave(save);
  generate('new');
}

async function generate(kind = 'new') {
  if (!P || P.busy) return;
  const { save, scen } = P;
  P.error = null;
  if (!hasKey()) {
    P.error = { message: 'Oynamak için önce Ayarlar\'dan ücretsiz bir API anahtarı eklemelisin.', kind: 'anahtar-yok' };
    renderStory(true); openSettings('Oyunu başlatmak için bir API anahtarı ekle. Ekledikten sonra "Tekrar dene"ye bas.');
    return;
  }
  const me = P;
  P.busy = true; updateComposer(); renderOptions();
  if (!(await ensureModel())) { me.busy = false; if (P !== me) return; P.error = { message: 'Model seçilemedi. Ayarlar\'dan anahtarını ve modelini kontrol et.', kind: 'model' }; updateComposer(); renderStory(true); return; }
  if (P !== me) return;

  let m;
  if (kind === 'regen') { m = lastMsg(); if (!m || m.role !== 'model') { P.busy = false; updateComposer(); return; } m.alts.push(''); m.ai = m.alts.length - 1; }
  else { m = { role: 'model', alts: [''], ai: 0, t: Date.now() }; save.messages.push(m); }
  const idx = save.messages.indexOf(m);
  renderStory();
  const node = $(`.msg[data-i="${idx}"] .msg-body`);
  node.innerHTML = '<p class="loading">Yazıyor</p>';
  scrollStory(true);

  const system = buildSystem(save, scen);
  const history = buildHistory(save, scen, idx);
  P.ctrl = new AbortController();
  let raw = '', pending = false, error = null;
  try {
    for await (const chunk of streamChat({ settings, system, history, signal: P.ctrl.signal })) {
      raw += chunk; m.alts[m.ai] = raw;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => { pending = false; if (P !== me) return; node.innerHTML = md(splitOutput(raw).visible) + '<span class="caret" aria-hidden="true"></span>'; scrollStory(); });
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') error = e;
  }
  me.busy = false; me.ctrl = null;
  if (!raw.trim()) {
    if (kind === 'regen') { m.alts.pop(); m.ai = Math.max(0, m.alts.length - 1); }
    else save.messages.splice(idx, 1);
  }
  writeSave(save);
  if (P !== me) return;
  P.error = error ? { message: error.message, kind: error.kind || 'genel', retry: raw.trim() ? 'regen' : kind } : null;
  if (error && raw.trim()) toast('Cevap yarıda kesildi: ' + error.message);
  renderStory(); renderPanel(); updateComposer(); scrollStory();
  if (!error) maybeSummarize();
}

const KEEP = 24, TRIGGER = 56;
async function maybeSummarize() {
  const me = P; if (!me || me.summarizing) return;
  const { save, scen } = me;
  const start = save.sumUpTo || 0;
  if (save.messages.length - start < TRIGGER) return;
  const upto = save.messages.length - KEEP;
  const chunk = save.messages.slice(start, upto).map(m => m.role === 'user'
    ? (m.cont ? '' : 'OYUNCU: ' + m.text)
    : 'ANLATICI: ' + splitOutput(cur(m)).visible).filter(Boolean).join('\n\n');
  me.summarizing = true; renderPanel();
  try {
    const text = await complete({
      settings, temperature: 0.3,
      system: 'Sen uzun soluklu bir rol yapma oyununun arşivcisisin. Görevin hikayenin hafızasını eksiksiz ve kısa tutmak. Sadece Türkçe özet yaz.',
      history: [{ role: 'user', text: `Senaryo: ${scen.title}\nOyuncunun seçimleri:\n${setupLines(save, scen)}\n\nŞimdiye kadarki özet:\n${save.summary || '(henüz yok)'}\n\nYeni olaylar:\n${chunk}\n\nBu ikisini birleştirerek güncel ve eksiksiz bir hikaye özeti yaz. Mutlaka koru: oyuncunun karakteri ve şu anki durumu, önemli yan karakterler ve oyuncuyla ilişkileri, verilen sözler, borçlar ve açık görevler, envanter ve kaynaklar, sırayla yaşanan kritik olaylar, bulunulan yer ve zaman. Kısa maddeler halinde, en fazla 450 kelime. Sadece özeti yaz.` }],
    });
    if (text.trim()) { save.summary = text.trim(); save.sumUpTo = upto; writeSave(save); }
  } catch (e) { console.warn('Özet alınamadı', e); }
  me.summarizing = false;
  if (P === me) { renderPanel(); renderStory(); }
}

function startEdit(i) {
  const m = P.save.messages[i];
  const box = $(`.msg[data-i="${i}"]`); if (!box || P.busy) return;
  const raw = m.role === 'model' ? cur(m) : m.text;
  const visible = m.role === 'model' ? splitOutput(raw).visible : raw;
  box.classList.add('editing');
  box.innerHTML = `<textarea class="edit-area" rows="6">${esc(visible)}</textarea><div class="row"><button class="btn primary sm" data-act="edit-save" data-i="${i}">Kaydet</button><button class="btn sm" data-act="edit-cancel">Vazgeç</button></div>`;
  const ta = $('textarea', box); ta.style.height = Math.min(ta.scrollHeight + 4, 480) + 'px'; ta.focus();
}
function saveEdit(i) {
  const m = P.save.messages[i];
  const box = $(`.msg[data-i="${i}"]`);
  const val = $('textarea', box).value.trim();
  if (!val) return;
  if (m.role === 'model') {
    const raw = cur(m); const cut = raw.search(TAG_CUT);
    m.alts[m.ai] = val + (cut >= 0 ? '\n\n' + raw.slice(cut) : '');
  } else m.text = val;
  writeSave(P.save); renderStory(); renderPanel();
}
function cutFrom(i) {
  if (P.busy) return;
  if (!confirm('Bu mesaj ve sonrasındaki her şey silinecek. Hikaye bu noktadan yeniden ilerleyecek. Emin misin?')) return;
  const { save } = P;
  save.messages.splice(i);
  if ((save.sumUpTo || 0) > i) save.sumUpTo = i;
  P.error = null;
  writeSave(save); renderStory(); renderPanel();
}

/* ---------- ayarlar ---------- */
function openSettings(msg = '') {
  const p = settings.provider, prov = PROVIDERS[p];
  const list = settings.modelLists[p] || [];
  const model = settings.models[p] || '';
  const opts = list.length ? list : (model ? [{ id: model, label: model }] : []);
  const keyVal = settings.keys[p] || '';
  openModal(`
    <header class="m-head"><h2>Ayarlar</h2><button class="icon-btn" data-act="close-modal" aria-label="Kapat">${I.close}</button></header>
    ${msg ? `<p class="notice">${esc(msg)}</p>` : ''}
    <section class="m-sec">
      <h3>Yapay zeka</h3>
      <div class="seg" role="group" aria-label="Servis">${Object.entries(PROVIDERS).map(([k, v]) => `<button class="${k === p ? 'on' : ''}" data-act="prov" data-p="${k}">${esc(v.label)}</button>`).join('')}</div>
      <p class="hint">${esc(prov.note)}</p>
      <ol class="steps">${prov.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      ${prov.keyUrl ? `<a class="btn sm" href="${prov.keyUrl}" target="_blank" rel="noopener">Anahtar sayfasını aç</a>` : ''}
      ${p === 'custom' ? `<label class="field"><span>Servis adresi</span><input data-s="customBase" value="${esc(settings.customBase)}" placeholder="http://localhost:1234/v1"></label>` : ''}
      <label class="field"><span>API anahtarı${p === 'custom' ? ' (gerekmiyorsa boş bırak)' : ''}</span>
        <div class="row"><input type="password" data-s="key" value="${esc(keyVal)}" autocomplete="off" spellcheck="false" placeholder="Anahtarı buraya yapıştır"><button class="btn sm" data-act="toggle-key" type="button">Göster</button></div>
      </label>
      <label class="field"><span>Model</span>
        <div class="row"><select data-s="model">${opts.length ? opts.map(o => `<option value="${esc(o.id)}" ${o.id === model ? 'selected' : ''}>${esc(o.id)}</option>`).join('') : '<option value="">Önce listeyi getir</option>'}</select><button class="btn sm" data-act="fetch-models" type="button">Listeyi getir</button></div>
      </label>
      <div class="row test-row"><button class="btn" data-act="test-ai" type="button">Bağlantıyı dene</button><span class="test-out" id="test-out" role="status"></span></div>
      <p class="hint">Anahtarın sadece bu tarayıcıda saklanır, hiçbir sunucuya kaydedilmez.</p>
    </section>
    <section class="m-sec">
      <h3>Anlatım</h3>
      <span class="label">Cevap uzunluğu</span>
      <div class="seg" role="group" aria-label="Cevap uzunluğu">${[['kisa', 'Kısa'], ['orta', 'Orta'], ['uzun', 'Uzun']].map(([k, l]) => `<button class="${settings.length === k ? 'on' : ''}" data-act="len" data-l="${k}">${l}</button>`).join('')}</div>
      <label class="field"><span>Yaratıcılık: <b id="temp-v">${settings.temperature}</b></span><input type="range" min="0.3" max="1.4" step="0.1" data-s="temperature" value="${settings.temperature}"></label>
      <p class="hint">Düşük değer tutarlı ve ciddi, yüksek değer sürprizli ve renkli anlatım verir.</p>
    </section>
    <section class="m-sec">
      <h3>Kayıtların</h3>
      <p class="hint">Oyunların ve senaryoların yalnızca bu tarayıcıda saklanır. Telefona ya da başka bir bilgisayara geçerken yedeği indir, orada yükle. Yedekte API anahtarın yer almaz.</p>
      <div class="row wrap"><button class="btn" data-act="export">Yedeği indir</button><label class="btn">Yedeği yükle<input type="file" accept=".json,application/json" id="import-file" hidden></label><button class="btn danger" data-act="wipe">Her şeyi sil</button></div>
    </section>`, 'settings-modal');
  const m = $('.settings-modal');
  $('[data-s="key"]', m).addEventListener('input', debounce(e => {
    settings.keys[settings.provider] = e.target.value.trim();
    settings.models[settings.provider] = settings.models[settings.provider] || '';
    saveSettings();
    if (e.target.value.trim().length > 15 && !(settings.modelLists[settings.provider] || []).length) fetchModels(true);
    if (view === 'home') renderHome();
  }, 500));
  $('[data-s="model"]', m).addEventListener('change', e => { settings.models[settings.provider] = e.target.value; saveSettings(); });
  $('[data-s="temperature"]', m).addEventListener('input', e => { settings.temperature = +e.target.value; $('#temp-v').textContent = settings.temperature; saveSettings(); });
  const cb = $('[data-s="customBase"]', m);
  if (cb) cb.addEventListener('input', debounce(e => { settings.customBase = e.target.value.trim(); saveSettings(); }, 400));
  $('#import-file', m).addEventListener('change', e => importBackup(e.target.files[0]));
}

async function fetchModels(quiet) {
  const out = $('#test-out');
  if (out) out.textContent = 'Modeller getiriliyor…';
  try {
    const list = await listModels(settings);
    const p = settings.provider;
    settings.modelLists[p] = list;
    if (!settings.models[p] || !list.some(x => x.id === settings.models[p])) settings.models[p] = pickDefaultModel(p, list);
    saveSettings();
    const sel = $('[data-s="model"]');
    if (sel) sel.innerHTML = list.map(o => `<option value="${esc(o.id)}" ${o.id === settings.models[p] ? 'selected' : ''}>${esc(o.id)}</option>`).join('');
    if (out) { out.textContent = `${list.length} model bulundu. Seçili: ${settings.models[p] || 'yok'}.`; out.className = 'test-out ok'; }
  } catch (e) {
    if (out) out.textContent = e.message;
    if (!quiet) toast(e.message);
  }
}

async function testAI() {
  const out = $('#test-out');
  out.textContent = 'Deneniyor…'; out.className = 'test-out';
  try {
    if (!(await ensureModel())) throw new Error('Model seçilemedi.');
    const t = await complete({ settings, system: 'Çok kısa cevap ver.', history: [{ role: 'user', text: 'Sadece "Bağlantı tamam" yaz.' }] });
    out.textContent = `Çalışıyor (${settings.models[settings.provider]}): ${t.trim().slice(0, 60)}`;
    out.className = 'test-out ok';
  } catch (e) { out.textContent = e.message; out.className = 'test-out bad'; }
}

function exportBackup() {
  const saves = savesIndex().map(x => loadSave(x.id)).filter(Boolean);
  const data = { app: 'diyar', version: 1, exportedAt: new Date().toISOString(), custom: customs(), saves };
  download(`diyar-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data));
}
async function importBackup(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'diyar') throw new Error();
    const cur = customs();
    (data.custom || []).forEach(c => { const i = cur.findIndex(x => x.id === c.id); if (i >= 0) cur[i] = c; else cur.push(c); });
    store.set('custom', cur);
    const idx = savesIndex().filter(x => !(data.saves || []).some(s => s.id === x.id));
    (data.saves || []).forEach(s => {
      store.set('save.' + s.id, s);
      idx.push({ id: s.id, scenarioId: s.scenarioId, title: s.title, label: s.label, turns: s.turns, updatedAt: s.updatedAt || 0 });
    });
    store.set('saves', idx.sort((a, b) => b.updatedAt - a.updatedAt));
    closeModal(true);
    toast(`Yedek yüklendi: ${(data.saves || []).length} oyun, ${(data.custom || []).length} senaryo.`);
    if (view === 'home') renderHome(); else route();
  } catch { toast('Bu dosya bir Diyar yedeği değil ya da bozuk.'); }
}

/* ---------- senaryo oluşturucu ---------- */
function renderCreator(editId) {
  leavePlay();
  view = 'create';
  const ex = editId ? customs().find(c => c.id === editId) : null;
  const s = ex || { title: '', subtitle: '', description: '', tags: [], mode: 'anlatici', world: '', openingPrompt: '', character: '', cover: 'kuzey', stats: [], setup: [] };
  const qs = (s.setup || []).filter(f => f.id !== 'ad').map(f => f.label);
  const askName = !ex || (s.setup || []).some(f => f.id === 'ad');
  const statsTxt = (s.stats || []).map(x => x.num ? `${x.k} (0-100)` : x.k).join(', ');
  document.title = (ex ? 'Senaryoyu düzenle' : 'Senaryo oluştur') + ' — Diyar';
  let image = s.image || '';
  let cover = s.cover || 'kuzey';
  app.innerHTML = `
  <div class="creator">
    ${topbar()}
    <form class="cform" id="cform">
      <h1>${ex ? 'Senaryoyu düzenle' : 'Kendi dünyanı yaz'}</h1>
      <p class="lead">Ne kadar ayrıntı verirsen yapay zeka dünyana o kadar sadık kalır. Kanondaki bir evreni (bir dizi, kitap, oyun) adıyla yazman da yeterli; yapay zeka onu tanıyorsa gerisini tamamlar.</p>

      <label class="field"><span>Başlık</span><input name="title" required maxlength="70" value="${esc(s.title)}" placeholder="Örneğin: Vikingler: Kuzeyin Kurtları"></label>
      <label class="field"><span>Kısa tanıtım (kartın altında görünür)</span><input name="subtitle" required maxlength="120" value="${esc(s.subtitle)}" placeholder="Bir cümleyle merak uyandır"></label>
      <label class="field"><span>Uzun tanıtım (isteğe bağlı)</span><textarea name="description" rows="3" placeholder="Oyuncu başlamadan önce okuyacağı tanıtım">${esc(s.description)}</textarea></label>

      <fieldset class="field"><legend>Oyun türü</legend>
        <div class="seg">${[['anlatici', 'Anlatıcılı hikaye'], ['karakter', 'Bir karakterle sohbet'], ['ulke', 'Ülke yönetimi']].map(([k, l]) => `<label class="seg-opt"><input type="radio" name="mode" value="${k}" ${s.mode === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      </fieldset>
      <label class="field char-field" ${s.mode === 'karakter' ? '' : 'hidden'}><span>Yapay zekanın canlandıracağı karakter</span><input name="character" value="${esc(s.character || '')}" placeholder="Örneğin: Geralt of Rivia"></label>

      <label class="field"><span>Dünya, karakterler ve kurallar</span><textarea name="world" rows="10" required placeholder="Evren ve zaman: ...&#10;Oyuncu kim: ...&#10;Önemli karakterler ve kişilikleri: ...&#10;Ton: karanlık mı, komik mi, romantik mi?&#10;Kurallar: ne mümkün, ne değil?">${esc(s.world)}</textarea></label>
      <label class="field"><span>Hikaye nasıl başlasın? (isteğe bağlı)</span><textarea name="openingPrompt" rows="3" placeholder="Örneğin: Oyuncu bir gemi enkazından kıyıya vurur ve bir köylü onu bulur.">${esc(s.openingPrompt)}</textarea></label>

      <fieldset class="field"><legend>Oyuncuya başlamadan sorulacaklar</legend>
        <label class="check"><input type="checkbox" name="askName" ${askName ? 'checked' : ''}><span>Karakterinin adını sor</span></label>
        ${[0, 1, 2].map(i => `<input name="q${i}" value="${esc(qs[i] || '')}" placeholder="${['Örneğin: Sınıfın ne?', 'Örneğin: Nereden geliyorsun?', 'Başka bir soru (isteğe bağlı)'][i]}" maxlength="80">`).join('')}
      </fieldset>

      <label class="field"><span>Durum paneli göstergeleri (isteğe bağlı, virgülle ayır)</span><input name="stats" value="${esc(statsTxt)}" placeholder="Can (0-100), Altın, Envanter, Müttefikler"></label>
      <p class="hint">Sonuna "(0-100)" yazdığın göstergeler çubuk olarak görünür.</p>

      <fieldset class="field"><legend>Etiketler</legend>
        <div class="tag-pick">${CATEGORIES.map(c => `<label class="chip-check"><input type="checkbox" name="tags" value="${esc(c)}" ${(s.tags || []).includes(c) ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
      </fieldset>

      <fieldset class="field"><legend>Kapak</legend>
        <div class="cover-pick" id="cover-pick">${Object.entries(THEMES).map(([k, t]) => `<button type="button" class="cp ${k === cover && !image ? 'on' : ''}" data-cover="${k}" title="${esc(t.label)}" aria-label="${esc(t.label)}">${coverSVG(k, 'pick')}</button>`).join('')}</div>
        <div class="row wrap"><label class="btn sm">Kendi resmini yükle<input type="file" accept="image/*" id="cimg" hidden></label><span class="hint" id="cimg-state">${image ? 'Kendi resmin kullanılıyor.' : ''}</span>${image ? '<button type="button" class="btn sm" id="cimg-clear">Resmi kaldır</button>' : ''}</div>
      </fieldset>

      <div class="row form-end"><a class="btn ghost" href="${ex ? '#/senaryo/' + esc(ex.id) : '#/'}">Vazgeç</a><button class="btn primary big" type="submit">${ex ? 'Değişiklikleri kaydet' : 'Senaryoyu kaydet'}</button></div>
    </form>
  </div>`;
  const form = $('#cform');
  form.addEventListener('change', e => { if (e.target.name === 'mode') $('.char-field').hidden = e.target.value !== 'karakter'; });
  $('#cover-pick').addEventListener('click', e => {
    const b = e.target.closest('.cp'); if (!b) return;
    cover = b.dataset.cover; image = '';
    $$('.cp').forEach(x => x.classList.toggle('on', x === b));
    $('#cimg-state').textContent = '';
  });
  $('#cimg').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try { image = await readImage(file); $$('.cp').forEach(x => x.classList.remove('on')); $('#cimg-state').textContent = 'Kendi resmin kullanılacak.'; }
    catch { toast('Bu resim okunamadı.'); }
  });
  $('#cimg-clear')?.addEventListener('click', () => { image = ''; $('#cimg-state').textContent = ''; $(`.cp[data-cover="${cover}"]`)?.classList.add('on'); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const setup = [];
    if (fd.get('askName')) setup.push({ id: 'ad', label: 'Karakterinin adı', type: 'text', required: true });
    [0, 1, 2].forEach(i => { const q = (fd.get('q' + i) || '').toString().trim(); if (q) setup.push({ id: 'q' + i, label: q, type: 'text' }); });
    const stats = (fd.get('stats') || '').toString().split(',').map(x => x.trim()).filter(Boolean).slice(0, 8).map(x => {
      const num = /\(\s*0\s*-\s*100\s*\)/.test(x);
      return { k: x.replace(/\(\s*0\s*-\s*100\s*\)/, '').trim(), num };
    });
    const sc = {
      id: ex?.id || 'c_' + uid(), custom: true,
      title: fd.get('title').toString().trim(), subtitle: fd.get('subtitle').toString().trim(),
      description: fd.get('description').toString().trim(),
      mode: fd.get('mode') || 'anlatici', character: (fd.get('character') || '').toString().trim(),
      world: fd.get('world').toString().trim(), openingPrompt: fd.get('openingPrompt').toString().trim(),
      tags: fd.getAll('tags').map(String), setup, stats, cover, image,
    };
    const list = customs(); const i = list.findIndex(x => x.id === sc.id);
    if (i >= 0) list[i] = sc; else list.unshift(sc);
    if (store.set('custom', list)) { toast(ex ? 'Senaryo güncellendi.' : 'Senaryo kaydedildi.'); location.hash = '#/senaryo/' + sc.id; }
  });
}

function readImage(file) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas'), W = 800, H = 500; c.width = W; c.height = H;
      const s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
      c.getContext('2d').drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .82));
    };
    img.onerror = rej; img.src = url;
  });
}

/* ---------- olaylar ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  const i = b.dataset.i !== undefined ? +b.dataset.i : null;
  switch (act) {
    case 'settings': e.preventDefault(); openSettings(); break;
    case 'close-modal': closeModal(); break;
    case 'cat': homeState.cat = b.dataset.cat; $$('.chip').forEach(c => c.classList.toggle('on', c === b)); renderShelves(); break;
    case 'prov': settings.provider = b.dataset.p; saveSettings(); openSettings(); if (view === 'home') renderHome(); break;
    case 'len': settings.length = b.dataset.l; saveSettings(); $$('[data-act="len"]').forEach(x => x.classList.toggle('on', x === b)); break;
    case 'toggle-key': { const inp = $('[data-s="key"]'); inp.type = inp.type === 'password' ? 'text' : 'password'; b.textContent = inp.type === 'password' ? 'Göster' : 'Gizle'; break; }
    case 'fetch-models': fetchModels(); break;
    case 'test-ai': testAI(); break;
    case 'export': exportBackup(); break;
    case 'wipe':
      if (confirm('Bütün oyunların, senaryoların ve ayarların silinecek. Bu geri alınamaz. Emin misin?')) {
        Object.keys(localStorage).filter(k => k.startsWith('diyar.')).forEach(k => localStorage.removeItem(k));
        location.hash = '#/'; location.reload();
      }
      break;
    case 'del-save':
      if (confirm('Bu oyun kalıcı olarak silinecek. Emin misin?')) { const id = b.dataset.id; deleteSave(id); b.closest('.save-row')?.remove(); renderShelves(); }
      break;
    case 'del-scen':
      if (confirm('Bu senaryo silinecek. Bu senaryodaki kayıtlı oyunların yine de oynanabilir kalır. Emin misin?')) {
        store.set('custom', customs().filter(c => c.id !== b.dataset.id)); closeModal(true); location.hash = '#/'; renderHome();
      }
      break;
    // oyun ekranı
    case 'toggle-panel': $('.play')?.classList.toggle('panel-open'); break;
    case 'opt': if (P && !P.busy) sendUser(b.textContent.trim()); break;
    case 'continue':
      if (!P || P.busy) break;
      if (lastMsg()?.role === 'user' && !lastMsg().cont) generate('new'); else sendUser('', true);
      break;
    case 'regen': if (P && !P.busy) generate('regen'); break;
    case 'retry': if (P && !P.busy) { P.error = null; generate(lastMsg()?.role === 'model' ? 'regen' : 'new'); } break;
    case 'alt': {
      const m = P.save.messages[i]; m.ai = Math.max(0, Math.min(m.alts.length - 1, m.ai + +b.dataset.d));
      writeSave(P.save); renderStory(); renderPanel(); break;
    }
    case 'edit': startEdit(i); break;
    case 'edit-save': saveEdit(i); break;
    case 'edit-cancel': renderStory(); break;
    case 'cut': cutFrom(i); break;
    case 'rename': {
      const v = prompt('Bu oyunun yeni adı:', P.save.label);
      if (v && v.trim()) { P.save.label = v.trim().slice(0, 60); writeSave(P.save); $('#save-label').textContent = P.save.label; renderStory(); }
      break;
    }
    case 'export-story': {
      const { save, scen } = P;
      const txt = `${scen.title}\n${save.label}\n\n` + save.messages.map(m => m.role === 'user' ? (m.cont ? '' : `> ${m.text}`) : splitOutput(cur(m)).visible).filter(Boolean).join('\n\n');
      download(`${scen.title.replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'hikaye'}.txt`, txt, 'text/plain;charset=utf-8');
      break;
    }
    case 'del-current':
      if (confirm('Bu oyun kalıcı olarak silinecek. Emin misin?')) { const id = P.save.id; leavePlay(); deleteSave(id); location.hash = '#/'; }
      break;
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.modal-back')) closeModal(); });
window.addEventListener('hashchange', route);
route();

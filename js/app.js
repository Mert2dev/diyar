import { SCENARIOS, CATEGORIES, SHELVES } from './scenarios.js';
import { coverSVG, THEMES, themeOf } from './covers.js';
import { SceneStage, SCENE_STYLES, parseScenes, parseCards, parseSceneTag, sceneTagRe, sceneProblem, composeScene, applyCards, castOf, withEdits, visualAnchor, keepsDistance } from './scenes.js';
import { PROVIDERS, KEYLESS, providerLabel, AIError, streamChat, complete, listModels, pickDefaultModel, rankModels } from './ai.js';
import {
  approxTokens, cur, stripThink, TAG_CUT, stripScenes, stripCards, splitOutput, ledgerOf, ledgerText, contextBudget, fitHistory, compactOverflow,
  summaryPlan, recall, properNames, acceptableSummary, rewindSummary, qualityIssue, isLooping, removeRepeats, trimToSentence,
} from './memory.js';

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
  advisor: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H10l-4 4v-4H4z"/><path d="M10 9.4a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.4"/><path d="M12 14.6h.01"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>',
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
const DEFAULT_SETTINGS = { provider: 'gemini', keys: {}, models: {}, modelLists: {}, customBase: 'http://localhost:1234/v1', temperature: 0.8, length: 'orta', images: true, imgStyle: 'sinematik', theme: 'gece', readSize: 'orta' };
let settings = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) };
['keys', 'models', 'modelLists'].forEach(k => settings[k] = settings[k] || {});
const saveSettings = () => store.set('settings', settings);
function applyPrefs() {
  const r = document.documentElement;
  r.dataset.theme = settings.theme === 'kagit' ? 'kagit' : 'gece';
  r.dataset.size = settings.readSize || 'orta';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', settings.theme === 'kagit' ? '#efe8da' : '#12100e');
}
applyPrefs();
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
/** Dünyanın renklerini ve yazı tipini CSS değişkeni olarak verir */
function worldVars(s) {
  const t = themeOf(s.cover);
  return `--w-bg:${t.bg};--w-ink:${t.ink};--w-accent:${t.accent};--w-on:${t.on};--w-font:${t.font};--w-weight:${t.weight};--w-style:${t.style || 'normal'}`;
}
/** Başlığı afişin baskı diliyle üstüne yazar; en uzun kelime afişe sığacak şekilde ölçeklenir */
function posterHTML(s) {
  const t = themeOf(s.cover);
  const title = (s.title || '').trim() || 'Başlığın';
  const i = title.indexOf(':');
  const big = i > 0 ? title.slice(0, i).trim() : title;
  const small = i > 0 ? title.slice(i + 1).trim() : '';
  const longest = Math.max(...big.split(/\s+/).map(w => [...w].length));
  const fit = Math.min(big.length > 12 ? 17 : 27, 86 / (longest * t.wf)).toFixed(1);
  const fitS = Math.min(8, 3.4 / t.wf).toFixed(1);
  const style = `--p-bg:${t.bg};--p-title:${t.title};--p-font:${t.font};--p-weight:${t.weight};--p-style:${t.style || 'normal'};--fit:${fit};--fit-s:${fitS}`;
  return `<div class="poster ${t.pos}${t.glow ? ' glow' : ''}${s.image ? ' has-img' : ''}" style="${style}">${coverHTML(s)}<div class="poster-title"><span class="poster-big">${esc(big)}</span>${small ? `<span class="poster-small">${esc(small)}</span>` : ''}</div></div>`;
}

/* ---------- metin işleme ---------- */
function md(text) {
  let t = esc(text);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/(&quot;|“)([^\n]+?)(&quot;|”)/g, '<span class="q">$1$2$3</span>');
  t = t.replace(/\[([^\]\n]{2,140})\]/g, '<span class="sys">[$1]</span>');
  return t.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}
/** Sahne etiketini kullanılabilir görsel anahtarına çeviren işlev (bu oyuna ve bu andaki kartlara göre) */
function sceneComposer(save, scen, cast) {
  const anchor = visualAnchor(scen, save.messages);
  const distant = keepsDistance(scen);
  const names = [save.setup?.ad, scen.character].filter(Boolean);
  return ({ text, kim }) => composeScene({ text, kim, cast, anchor, names, distant });
}
/** Hikaye metnini paragraflara böler; geçerli <sahne> tarifi olan paragrafa data-scene ekler */
function storyHTML(text, compose) {
  let carry = null, out = '';
  (text || '').split(/\n{2,}/).forEach(par => {
    let scene = null;
    par = par.replace(sceneTagRe(), (_, attr, body) => {
      const key = compose ? compose(parseSceneTag(attr, body)) : null;
      scene = scene || key;
      return '';
    });
    par = stripScenes(par).trim();
    scene = scene || carry;
    if (!par) { carry = scene; return; }
    carry = null;
    const html = md(par);
    out += scene ? html.replace('<p>', `<p data-scene="${esc(scene)}">`) : html;
  });
  return out;
}

/* ---------- yapay zeka talimatı ---------- */
const BASE_RULES = `Sen "Diyar" adlı interaktif bir hikaye oyununun anlatıcısı ve oyun yöneticisisin. Oyuncuyla birlikte, onun kararlarıyla şekillenen tutarlı, uzun soluklu bir hikaye yazıyorsun. İyi bir oyun yöneticisi gibi davran: dünyayı gerçek kıl, oyuncuyu kayırma, söylediğini unutma.

## Süreklilik (en önemli kural)
- "Hikaye defteri", "hikaye özeti" ve "oyuncunun notları" kesin gerçektir. Onlarla ASLA çelişme. Bir karakterin adı, yaşı, kişiliği, yarası, sahip olduğu eşya, bulunduğu yer, kime ne söz verdiği ve kimin neyi bildiği tutarlı kalmalı.
- Karakterler yalnızca kendi gördüklerini ve kendilerine söylenenleri bilir. Oyuncu bir sırrı bir kişiye söylediyse sadece o kişi bilir. Duyumlar ancak makul bir yoldan yayılır.
- Zaman akar. Gün, mevsim, yara iyileşmesi, yolculuk süresi, erzak tüketimi gerçekçi olsun. Önceki sahnede olan hiçbir şey sebepsizce yok sayılmasın.
- Hikayenin ana çizgisinden ve tonundan sapma. Senaryonun türüne, dünyasına ve kurallarına sadık kal; oyuncu saçma bir şey denerse dünya buna kendi kurallarıyla tepki versin (komikleşip dağılmasın).

## Neden-sonuç
- Önemli her oyuncu eylemi iki sonuç doğurur: hemen görünen bir sonuç ve zamanla ortaya çıkan bir sonuç (bir düşmanın intikamı, bir borcun gelip dayanması, bir yalanın ortaya çıkması, bir dostluğun karşılık bulması, bir yaranın enfeksiyonu).
- Gecikmeli sonuçları hikaye defterine "!" ile yaz (ne olacak ve ne zaman). Zamanı geldiğinde, kimse hatırlatmadan hikayede gerçekleştir. Defterdeki bekleyen sonuçları her cevapta gözden geçir.
- Başarı emek ister; ücretsiz öğle yemeği yok. Güçlü bir hamle bedel getirir, kötü bir hamle bir yol da açabilir. Oyuncuyu ne sürekli kazandır ne de haksızca cezalandır.
- Dünya oyuncudan bağımsız işler. Her cevapta arka planda bir şey ilerlesin (bir söylenti, bir ordunun hareketi, bir karakterin kendi planı). Oyuncu hiçbir şey yapmasa bile hikaye durmaz.

## Karakterler
- Yan karakterlerin kendi istekleri, korkuları, sırları ve ayırt edici bir konuşma biçimi var. Oyuncunun her dediğini kabul etmezler; ikna, pazarlık, baskı ya da kanıt gerekir. Yalan söyleyebilir, saklayabilir, yanılabilirler.
- Kanondan gelen karakterler kendi kişiliklerinden çıkmaz. Kanonda bilmeyecekleri şeyi bilmezler.
- Oyuncunun karakterinin ne düşündüğünü, ne söylediğini ya da ne yaptığını onun yerine yazma ve onun adına karar verme. Dünyanın tepkisini anlat, sonra sırayı oyuncuya bırak.

## Yazım
- Akıcı, doğal, edebi bir Türkçe kullan. Özel isimleri (Winterfell, Forks, Hogwarts vb.) orijinal halleriyle yaz. Diyalogları tırnak içinde yaz.
- Somut ve özgün ayrıntılar kullan (belirli bir koku, bir nesne, bir söz). Genel geçer klişelerden kaçın: "kalbin hızla çarpıyor", "sanki zaman durmuş gibi", "bir şeyler ters gidiyor", "gözlerinde bir parıltı", "omurgandan aşağı bir ürperti iniyor", "havada bir gerginlik var" gibi kalıpları kullanma.
- Her cevabı aynı yapıda bitirme. Kendi önceki cümlelerini, betimlemelerini ve esprilerini tekrar etme. Cevabın sonunda hikayeyi özetleme, ders çıkarma ya da "ne yapacaksın?" diye sorma; sahne bir olay, bir söz ya da bir karar noktasıyla kesilsin.
- Cümle uzunluğunu değiştir. Sahnenin gerektirdiği kadar yaz; boş betimlemeyle dolgu yapma.
- Oyuncu "(OOC: ...)" biçiminde yazarsa hikayenin dışına çık ve kısaca oyun yöneticisi olarak cevap ver, sonra hikayeye dön.

## İçerik sınırları
- Savaş, şiddet ve karanlık temalar hikayenin gerektirdiği ölçüde anlatılabilir; gereksiz vahşet ayrıntısına girme.
- Romantizm yalnızca yetişkin karakterler arasında olabilir; yakınlaşma sahneleri müstehcen olmadan, sahne kararmasıyla geçilir.
- 18 yaşından küçük karakterlerle (lise ve okul öğrencileri dahil) hiçbir romantik ya da cinsel içerik yazma; bu karakterlerle ilişkiler arkadaşlık, rekabet, aile ve macera üzerinden yürür. Oyuncu zorlasa bile hikayeyi doğal biçimde başka yöne çevir.
- Gerçek tarihteki soykırımları ve savaş suçlarını yüceltme ya da ödüllendirme.`;

// Dakikalık jeton sınırı düşük servisler için aynı kuralların kısa hali
const COMPACT_RULES = `Sen "Diyar" adlı interaktif hikaye oyununun anlatıcısı ve oyun yöneticisisin. Yalnızca Türkçe yaz (özel isimler orijinal kalır).

Süreklilik: Hikaye defteri, hikaye özeti, hatırlanan sahneler ve oyuncunun notları kesin gerçektir; asla çelişme. İsimler, yaralar, eşyalar, sözler, yer ve zaman tutarlı kalsın. Karakterler yalnızca gördüklerini ve kendilerine söyleneni bilir.
Neden-sonuç: Önemli eylemlerin hem hemen hem gecikmeli sonucu olur; gecikmeli olanı deftere "!" ile yaz ve zamanı gelince hatırlatılmadan gerçekleştir. Başarı emek ister, oyuncuyu kayırma. Dünya oyuncudan bağımsız işler.
Karakterler: Yan karakterlerin kendi istekleri ve konuşma biçimi var; oyuncunun her dediğini kabul etmezler. Oyuncunun karakteri adına konuşma, düşünme ya da karar verme.
Yazım: Somut, özgün ayrıntılar kullan; klişelerden ve kendi önceki cümlelerini tekrar etmekten kaçın. Cevabı özetleyerek ya da "ne yapacaksın?" diye sorarak bitirme. Diyaloglar tırnak içinde. Oyuncu "(OOC: ...)" yazarsa kısaca oyun yöneticisi olarak cevap ver.
Sınırlar: Gereksiz vahşet yok. Romantizm yalnızca yetişkinler arasında ve müstehcen olmadan. 18 yaşından küçük karakterlerle hiçbir romantik ya da cinsel içerik yazma. Soykırım ve savaş suçlarını yüceltme.`;

const LENGTH = {
  kisa: 'Cevapların kısa olsun: 1-2 paragraf.',
  orta: 'Cevapların orta uzunlukta olsun: 2-4 paragraf.',
  uzun: 'Cevapların uzun ve ayrıntılı olsun: 4-7 paragraf.',
};
const OUTPUT_TOKENS = { kisa: 1000, orta: 1600, uzun: 2800 };

// Görsellerde kullanılmak üzere her senaryoda sorulan isteğe bağlı alan
const LOOK_FIELD = { id: 'gorunum', label: 'Karakterinin görünüşü (isteğe bağlı, görsellerde kullanılır)', type: 'text', placeholder: 'Örneğin: uzun boylu, kızıl saçlı, sol yanağında yara izi, siyah pelerin' };
const setupFields = scen => (scen.mode === 'ulke' ? (scen.setup || []) : [...(scen.setup || []), LOOK_FIELD]);

function setupLines(save, scen) {
  return setupFields(scen).map(f => {
    const v = (save.setup?.[f.id] || '').trim();
    return v ? `- ${f.label}: ${v}` : null;
  }).filter(Boolean).join('\n');
}

function budgetNow(scale = 1, route = null) {
  const provider = route?.p || settings.provider, model = route?.model || settings.models[provider] || '';
  const ctx = (settings.modelLists[provider] || []).find(m => m.id === model)?.ctx || 0;
  return contextBudget({ provider, model, ctx, scale });
}

/** Görsel yönetmenlik talimatı */
function imageRules(scen) {
  const max = (settings.keys.pollinations || '').trim() ? 3 : 2;
  const anchor = visualAnchor(scen, []);
  return `\n- Görsel yönetmenlik: Sen metni yazarken ekranın arka planında gerçek zamanlı görsel üretiliyor ve görsel senin ilk etiketinle başlıyor. Bu yüzden cevabın HER ZAMAN şu etiketlerle başlasın, hikaye metni sonra gelsin:
  1. Kart: Bu karede görünecek ve aşağıdaki listede kartı olmayan her karakter için (oyuncunun karakteri dahil) bir kez <karakter>Ad | English look</karakter>. Görünüş 10-18 İngilizce kelime: cinsiyet, yaş, ten, saç, ayırt edici iz, kıyafet. Oyuncu görünüşünü söylediyse ona sadık kal. Kartı sonradan değiştirme; yalnızca kalıcı bir değişimde (yeni yara, yeni kıyafet) aynı adla yeniden yaz. Tanınan kurgusal karakterleri gerçek bir oyuncuya benzetmeden tarif et.
  2. Sahne: <sahne kim="Ad">English description</sahne>. kim içine o karede gerçekten görünen karakterlerin adını yaz (en fazla 2, tercihen 1); kimse yoksa kim="" yaz.
  Tarif 15-28 İngilizce kelime olsun ve kamera açısıyla başlasın (wide shot, medium shot, over-the-shoulder, low angle). O paragrafta GERÇEKTEN olan şeyi göster: nerede, kim ne yapıyor, ışık, hava. Metinde olmayan hiçbir şey ekleme. Karakterin görünüşünü tarifte tekrar etme, kart otomatik eklenir.
  Yeni bir mekâna geçince ya da görsel olarak önemli bir an gelince o paragrafın başına yeni bir <sahne> koy; cevap başına en fazla ${max} sahne.
  Tarifte Türkçe kelime, özel isim, film, kitap, dizi, marka ya da gerçek kişi adı ASLA olmasın. Çıplaklık, cinsel ima, kan ve vahşet yok; herkes tam giyimli. 18 yaşından küçük karakterler romantik ya da sugestif gösterilmez.${anchor ? '' : '\n  Bu dünyanın görsel kimliğini ilk cevabının başında bir kez, 10-15 İngilizce kelimeyle ver: <dunya>era, setting, clothing, color mood</dunya>.'}
  Örnek başlangıç:
  <karakter>Mira | woman in her 30s, olive skin, short black hair, scar across left brow, worn brown leather coat</karakter>
  <sahne kim="Mira">medium shot, a woman leaning over a lantern-lit map table in a cramped stone cellar, rain streaking the small window behind her</sahne>`;
}

function castLines(cast, query) {
  const list = [...cast.values()];
  if (!list.length) return '';
  const q = query.toLocaleLowerCase('tr');
  const chosen = list.length <= 14 ? list : [...list.filter(c => q.includes(c.name.toLocaleLowerCase('tr'))), ...list.slice(-14)];
  return [...new Set(chosen)].map(c => `- ${c.name}: ${c.look}`).join('\n');
}

/** Oyuncunun yazdıkları ve son cevaptaki adlar: alakalı anıları bulmak için */
function memoryQuery(save, upto) {
  const before = save.messages.slice(0, upto);
  const lastUser = [...before].reverse().find(m => m.role === 'user' && m.text);
  const lastModel = [...before].reverse().find(m => m.role === 'model');
  const names = lastModel ? properNames(stripScenes(splitOutput(cur(lastModel)).visible)) : [];
  return [lastUser?.text || '', ...names].join(' ');
}

function buildSystem(save, scen, upto, budget, query = '', recallBefore = save.sumUpTo || 0) {
  const parts = [budget.compact ? COMPACT_RULES : BASE_RULES];
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
  const cast = castOf(save.messages, upto, save.castEdits);
  const cl = castLines(cast, query);
  if (cl) parts.push(`## Tanınan karakterler ve görünüşleri (kartı olanlara yeni kart yazma)\n${cl}`);
  const lt = ledgerText(ledgerOf(save.messages, upto), { maxTokens: Math.floor(budget.total * 0.16), query });
  parts.push(`## Hikaye defteri (kalıcı hafıza)\n${lt || '(Henüz boş. İlk cevabından itibaren doldur.)'}`);
  if (save.summary?.trim()) parts.push(`## Şimdiye kadar olanlar (hikaye özeti)\n${save.summary.trim()}`);
  const memories = recall({ messages: save.messages, before: Math.min(recallBefore, upto), query, maxTokens: Math.min(700, Math.floor(budget.total * 0.08)) });
  if (memories.length) parts.push(`## Oyuncunun değindiği eski sahneler (birebir, gerçekten yaşandı; ayrıntıları bunlara uysun)\n${memories.map(x => `${x.who}: ${x.text}`).join('\n\n')}`);
  if (save.notes?.trim()) parts.push(`## Oyuncunun sabitlediği notlar (bunlara her zaman uy)\n${save.notes.trim()}`);
  let fmt = `## Cevap biçimi\n- ${LENGTH[settings.length] || LENGTH.orta}\n- Yalnızca Türkçe yaz. Hikaye metnini düz yaz; vurgu için **kalın** ve *italik* kullanabilirsin. Başlık ve madde listesi kullanma.`;
  if (scen.stats?.length) {
    const keys = scen.stats.map(s => `"${s.k}": ${s.num ? '0-100 arası sayı' : (s.hint || 'kısa metin')}${s.num && s.hint ? ` (${s.hint})` : ''}`).join(', ');
    fmt += `\n- Hikaye metninden sonra güncel durumu tek satır JSON olarak ver: <durum>{...}</durum>. Anahtarlar: ${keys}. Değerleri hikayedeki olaylara göre gerçekçi biçimde güncelle; listeleri virgülle ayrılmış kısa metin olarak yaz.`;
  }
  fmt += `\n- En sonda oyuncunun yapabileceği 3 kısa ve birbirinden farklı eylem öner (her biri en fazla 12 kelime):\n<secenekler>\n- ...\n- ...\n- ...\n</secenekler>`;
  fmt += `\n- Her cevabın en sonuna hikaye defterini güncelleyen kısa bir blok ekle. Her satır tek bir şeydir ve şunlardan biriyle başlar:\n  + metin : ileride önem taşıyacak yeni bir gerçek (tanışılan karakter ve ilişkisi, verilen söz, borç, yara, bulunan eşya, alınan karar, öğrenilen sır, ölüm, yer ve zaman)\n  ! metin : oyuncunun eyleminin ya da dünyadaki bir gelişmenin gecikmeli sonucu, ne olacağı ve yaklaşık ne zaman olacağıyla (ör. "! Yenilen komutan 2 hafta içinde intikam için baskın düzenleyecek")\n  ? metin : çözülmemiş bir gizem, görev ya da soru\n  x numara : defterdeki bir maddenin artık geçersiz ya da gerçekleşmiş olması (ör. "x 7")\n  ~ numara | yeni metin : bir maddeyi güncelle\n  Sadece değişenleri yaz (en fazla 5 satır), kısa tut, tekrar etme. Zamanı gelip hikayede gerçekleşen "!" maddelerini "x" ile kapat. Blok oyuncuya gösterilmez.\n<defter>\n+ ...\n</defter>`;
  if (settings.images) fmt += imageRules(scen);
  parts.push(fmt);
  return parts.join('\n\n');
}

function kickoffText(save, scen) {
  const sl = setupLines(save, scen);
  return `[Oyun başlıyor]${sl ? '\n' + sl : ''}\n\n${scen.openingPrompt || 'Açılış sahnesini yaz ve oyuncuyu hikayenin içine al.'}`;
}

/** Bir mesajın modele gönderilecek hali */
function historyText(m, keepStats) {
  if (m.role !== 'model') return m.cont ? '(Oyuncu şimdilik bir şey yapmıyor. Hikayeyi biraz ilerlet ama oyuncu adına karar verme.)' : (m.text || '');
  let text = cur(m).replace(/<se[cç]enekler>[\s\S]*?(<\/se[cç]enekler>|$)/gi, '').replace(/<defter>[\s\S]*?(<\/defter>|$)/gi, '');
  text = stripScenes(text);
  if (!keepStats) text = text.replace(/<durum>[\s\S]*?<\/durum>/gi, '');
  return text.trim();
}

/** Bağlam: özet + (gerekirse kısaltılmış eski olaylar) + bütçeye sığan son mesajlar.
 *  overflowFrom: birebir gönderilmeyen ilk mesajın konumu; eski sahne hatırlama buna göre çalışır. */
function buildHistory(save, scen, uptoIdx, budget, systemTokens) {
  const start = Math.min(save.sumUpTo || 0, uptoIdx);
  const msgs = save.messages.slice(start, uptoIdx);
  let lastModel = -1;
  msgs.forEach((m, i) => { if (m.role === 'model') lastModel = i; });
  const entries = msgs.map((m, i) => ({ i: start + i, role: m.role === 'model' ? 'model' : 'user', text: historyText(m, i === lastModel) })).filter(e => e.text);

  const room = Math.max(1200, budget.total - systemTokens - 250);
  let { kept, overflow } = fitHistory(entries, room);
  let recap = '';
  if (overflow.length) {
    // Sığmayanlar özete geçene kadar kısaltılmış olarak gönderilir, sessizce kaybolmaz
    ({ kept, overflow } = fitHistory(entries, room * 0.8));
    recap = compactOverflow(overflow, Math.floor(room * 0.18));
  }
  let kick = start > 0
    ? '[Hikaye, sistem talimatındaki özetin bittiği yerden devam ediyor. Kaldığın yerden sürdür.]'
    : kickoffText(save, scen);
  if (recap) kick += `\n\n[Özetle son mesajlar arasında kalan olaylar, kısaltılmış. Bunlar da yaşandı:]\n${recap}`;
  const h = [{ role: 'user', text: kick }];
  kept.forEach(e => {
    const last = h[h.length - 1];
    if (last.role === e.role) last.text += '\n\n' + e.text; else h.push({ role: e.role, text: e.text });
  });
  const lastH = h[h.length - 1];
  if (lastH.role === 'user') lastH.text += '\n\n[Anlatıcı notu, oyuncuya gösterilmez: Yalnızca Türkçe yaz. Cevap yazmadan önce defterdeki gerçekleri, özeti ve bekleyen sonuçları kontrol et; zamanı gelmiş olanı tetikle. Daha önce olan hiçbir şeyle çelişme. Oyuncu adına konuşma ya da karar verme. Önceki cevaplarındaki kalıpları tekrar etme. ' + (settings.images ? 'Cevaba gerekirse <karakter> kartlarıyla, ardından İngilizce <sahne kim="..."> etiketiyle başla. ' : '') + 'Cevabın sonunda sırasıyla <durum>, <secenekler> ve <defter> bloklarını ver.]';
  return { history: h, firstKept: kept.length ? kept[0].i : uptoIdx };
}

/** Sistem talimatı ile geçmişi birlikte hazırlar: eski sahne hatırlama, bağlama girmeyen mesajlara bakar */
function buildContext(save, scen, idx, scale, route) {
  const budget = budgetNow(scale, route);
  const query = memoryQuery(save, idx);
  let system = buildSystem(save, scen, idx, budget, query);
  const { history, firstKept } = buildHistory(save, scen, idx, budget, approxTokens(system));
  if (firstKept > (save.sumUpTo || 0)) system = buildSystem(save, scen, idx, budget, query, firstKept);
  return { system, history, budget };
}

/* ---------- onay penceresi ---------- */
function ask(msg, { ok = 'Evet', cancel = 'Vazgeç', danger = false, input = null } = {}) {
  return new Promise(res => {
    const d = document.createElement('dialog');
    d.className = 'ask';
    // Enter ilk düğmeyi çalıştırır: onay düğmesi önce gelir, görselde sağa dizilir
    d.innerHTML = `<form method="dialog"><p>${esc(msg)}</p>${input !== null ? `<input value="${esc(input)}" maxlength="60" aria-label="${esc(msg)}">` : ''}<div class="row"><button class="btn ${danger ? 'danger-fill' : 'primary'}" value="yes">${esc(ok)}</button><button class="btn" value="no" ${danger ? 'autofocus' : ''}>${esc(cancel)}</button></div></form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => {
      const yes = d.returnValue === 'yes';
      const v = d.querySelector('input')?.value;
      d.remove();
      res(input !== null ? (yes ? v : null) : yes);
    });
    d.showModal();
    d.querySelector('input')?.select();
  });
}

/* ---------- modal ---------- */
let modalClose = null;
function openModal(html, cls = '', onClose) {
  closeModal(true);
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
  document.body.appendChild(back);
  document.body.classList.add('noscroll');
  back.addEventListener('mousedown', e => { if (e.target === back) closeModal(); });
  modalClose = onClose || null;
  requestAnimationFrame(() => back.classList.add('in'));
  setTimeout(() => $('.modal', back)?.focus({ preventScroll: true }), 30);
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
let vtSource = null; // tıklanan afiş
document.addEventListener('click', e => { const c = e.target.closest?.('a.card[href^="#/senaryo"]'); vtSource = c ? c.querySelector('.poster') : null; }, true);
function openWithTransition(fn) {
  const src = vtSource; vtSource = null;
  if (!src || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return fn();
  src.style.viewTransitionName = 'poster';
  document.startViewTransition(() => { src.style.viewTransitionName = ''; fn(); });
}

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'oyna' && parts[1]) { closeModal(true); return renderPlay(parts[1]); }
  if (parts[0] === 'olustur') { closeModal(true); return renderCreator(parts[1]); }
  if (view !== 'home') renderHome();
  if (parts[0] === 'senaryo' && parts[1]) openWithTransition(() => openScenario(parts[1]));
  else closeModal(true);
}
function leavePlay() {
  if (P?.ctrl) P.ctrl.abort();
  P?.scene?.destroy();
  P = null;
}

/* ---------- ana sayfa ---------- */
const homeState = { cat: 'Tümü', q: '' };

function topbar(extra = '') {
  return `<header class="topbar">
    <a class="brand" href="#/" aria-label="Diyar ana sayfa">Diyar</a>
    ${extra}
    <div class="topbar-actions">
      <a class="top-link" href="#/olustur" aria-label="Kendi dünyanı yaz">${I.plus}<span>Kendi dünyanı yaz</span></a>
      <button class="top-link" data-act="settings" aria-label="Ayarlar">${I.gear}<span>Ayarlar</span></button>
    </div>
  </header>`;
}

/** Oyuncunun kaldığı yeri hatırlatan son satırlar */
function lastLines(save) {
  for (let i = (save?.messages || []).length - 1; i >= 0; i--) {
    const m = save.messages[i];
    if (m.role !== 'model') continue;
    const text = stripScenes(splitOutput(cur(m)).visible).replace(/\*+/g, '').trim();
    if (!text) continue;
    const par = text.split(/\n{2,}/).pop().trim();
    if (par.length <= 240) return par;
    const tail = par.slice(-240);
    const cut = tail.search(/[.!?…]["”]?\s/);
    return '…' + (cut >= 0 ? tail.slice(cut + 1) : tail).trim();
  }
  return '';
}

function renderHome() {
  leavePlay();
  view = 'home';
  document.title = 'Diyar — Türkçe rol yapma ve hikaye oyunları';
  const saves = savesIndex();
  const last = saves[0];
  const lastSave = last && loadSave(last.id);
  const lastScen = last && getScenario(last.scenarioId, lastSave);
  const cats = ['Tümü', ...CATEGORIES.filter(c => allScenarios().some(s => (s.tags || []).includes(c)))];
  if (customs().length) cats.push('Benim senaryolarım');

  app.innerHTML = `
  <div class="home">
    ${topbar(`<label class="search">${I.search}<input type="search" id="q" placeholder="Dünya, karakter ya da konu ara" value="${esc(homeState.q)}" aria-label="Senaryo ara"></label>`)}
    ${!hasKey() ? `<div class="key-strip"><span>Anahtarsız da oynayabilirsin, ama ücretsiz bir Google Gemini anahtarıyla hikaye çok daha iyi yazılır. Almak bir dakika sürer.</span><button data-act="settings">Anahtarı ekle</button></div>` : ''}
    <header class="mast" id="mast">
      <h1 class="mast-word">Diyar</h1>
      <div class="mast-say">
        <p class="mast-line">Bir cümle yaz, dünya cevap versin.</p>
        <p class="mast-sub">Diyar, yapay zekayla Türkçe oynanan bir rol yapma sitesi. Hazır bir dünya seç ya da kendininkini yaz. Verdiğin sözü de kazandığın düşmanı da hikaye unutmaz.</p>
        <div class="mast-cta"><button class="btn primary big" data-act="to-wall">Bir dünya seç</button><a class="btn ghost" href="#/olustur">Kendi dünyanı yaz</a></div>
      </div>
    </header>
    ${lastScen ? `<a class="bookmark" href="#/oyna/${esc(last.id)}" style="${worldVars(lastScen)}">
      <div><p class="bookmark-where">Kaldığın yer: ${esc(lastScen.title)}${last.label ? ', ' + esc(last.label) : ''}, ${timeAgo(last.updatedAt)}</p>
      <p class="bookmark-text">${esc(lastLines(lastSave) || lastScen.subtitle)}</p></div>
      <span class="btn">Devam et</span></a>` : ''}
    <nav class="index" id="wall-top" aria-label="Türler">
      ${cats.map(c => `<button class="chip ${c === homeState.cat ? 'on' : ''}" data-act="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </nav>
    <div id="shelves"></div>
    <footer class="foot">
      <p>Oyunların ve senaryoların yalnızca bu tarayıcıda saklanır. Başka bir cihaza geçerken <button class="linklike" data-act="settings">Ayarlar</button> bölümünden yedeğini al.</p>
      <p>Fandom dünyaları hayranların oynaması için yazıldı. Diyar'ın bu eserlerin sahipleriyle bir bağı yok.</p>
    </footer>
  </div>`;
  $('#q').addEventListener('input', debounce(e => { homeState.q = e.target.value.trim(); renderShelves(); }, 150));
  const bar = $('.topbar'), mast = $('#mast');
  if (bar && mast && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => bar.classList.toggle('past', !en.isIntersecting), { rootMargin: '-120px 0px 0px' }).observe(mast);
  }
  renderShelves();
}

function scenCard(s, big = false) {
  return `<a class="card ${big ? 'big' : ''}" href="#/senaryo/${esc(s.id)}">
    ${posterHTML(s)}
    <div class="card-meta"><span class="card-mode">${modeLabel(s.mode)}</span><span class="card-sub">${esc(s.subtitle)}</span></div>
  </a>`;
}
function saveCard(x) {
  const save = loadSave(x.id);
  const s = getScenario(x.scenarioId, save);
  if (!s) return '';
  return `<a class="card save" href="#/oyna/${esc(x.id)}">
    ${posterHTML(s)}
    <div class="card-meta"><span class="card-mode">${x.turns || 0} tur</span><span class="card-sub">${esc(x.label || '')}${x.label ? ', ' : ''}${timeAgo(x.updatedAt)}</span></div>
  </a>`;
}
const createCard = () => `<a class="card create" href="#/olustur">
    <div class="poster create-poster"><span class="create-mark">${I.plus}</span><b>Kendi dünyanı yaz</b></div>
    <div class="card-meta"><span class="card-mode">Senaryo oluştur</span><span class="card-sub">Dünyanı, karakterlerini ve açılış sahneni sen belirle.</span></div>
  </a>`;

// Oyunun nasıl aktığını anlatmak yerine göster
const SPECIMEN = `<aside class="specimen" aria-label="Örnek oyun metni">
    <p class="specimen-label">Oyun böyle akar. Örnek metin, Salgın: İstanbul</p>
    <p>Karaköy'de tramvay raylarının üstünde bir otobüs yan yatmış, kapısı gökyüzüne bakıyor. Eczanenin kepengi yarıya kadar inik. İçeride biri öksürüyor, sonra öksürük kesiliyor, sonra bir raf devriliyor.</p>
    <p class="you">Kepengin altından feneri uzatıyorum ama girmiyorum. "Kim var orada?"</p>
    <p>Işık, yere saçılmış antibiyotik kutularının üstünde duruyor. <q>"Feneri indir,"</q> diyor bir kadın, sesi beklediğinden yakın. <q>"Seni ısırdılar mı, önce onu söyle. Sonra konuşuruz."</q></p>
  </aside>`;

function renderShelves() {
  const el = $('#shelves'); if (!el) return;
  const q = homeState.q.toLocaleLowerCase('tr');
  const cat = homeState.cat;
  if (cat === 'Tümü' && !q) {
    const others = savesIndex().slice(1, 9);
    const mine = customs();
    let html = '';
    if (others.length) html += shelf('Diğer oyunların', '', others.map(saveCard).join(''));
    SHELVES.forEach(sh => {
      const list = SCENARIOS.filter(s => s.shelf === sh.id);
      if (!list.length) return;
      const lead = list.length >= 5;
      const cards = list.map((s, i) => scenCard(s, lead && i === 0)).join('');
      const extra = sh.id === 'tarih' ? SPECIMEN : sh.id === 'ozgun' ? createCard() : '';
      html += shelf(sh.title, sh.hint, cards + extra, `${lead ? 'lead' : ''} ${sh.id}`);
    });
    if (mine.length) html += shelf('Senin senaryoların', '', mine.map(s => scenCard(s)).join(''));
    el.innerHTML = html;
    return;
  }
  let list = allScenarios();
  if (cat === 'Benim senaryolarım') list = customs();
  else if (cat !== 'Tümü') list = list.filter(s => (s.tags || []).includes(cat));
  if (q) list = list.filter(s => [s.title, s.subtitle, s.description, ...(s.tags || [])].join(' ').toLocaleLowerCase('tr').includes(q));
  el.innerHTML = list.length
    ? shelf(q ? `“${esc(homeState.q)}”` : esc(cat), `${list.length} dünya`, list.map(s => scenCard(s)).join(''))
    : `<div class="empty"><p>Bu aramaya uyan bir dünya yok. Belki de yazılmayı bekliyordur.</p><a class="btn" href="#/olustur">Bu dünyayı kendin yaz</a></div>`;
}
function shelf(title, hint, cards, cls = '') {
  return `<section class="wall-sec ${cls}"><div class="wall"><header class="wall-head"><h2>${title}</h2>${hint ? `<p>${esc(hint)}</p>` : ''}</header>${cards}</div></section>`;
}

/* ---------- senaryo detayı ---------- */
function openScenario(id) {
  const s = getScenario(id);
  if (!s) { toast('Senaryo bulunamadı.'); location.hash = '#/'; return; }
  const saves = savesIndex().filter(x => x.scenarioId === id);
  const isCustom = customs().some(c => c.id === id);
  const fields = setupFields(s).map(f => {
    const req = f.required ? 'required' : '';
    if (f.type === 'select') {
      return `<label class="field"><span>${esc(f.label)}</span><select name="${esc(f.id)}" data-custom="${f.allowCustom ? 1 : 0}">${f.options.map(o => `<option>${esc(o)}</option>`).join('')}${f.allowCustom ? '<option value="__diger">Diğer (kendim yazacağım)</option>' : ''}</select>
      ${f.allowCustom ? `<input class="custom-in" name="${esc(f.id)}__c" placeholder="Kendi seçimini yaz" hidden>` : ''}</label>`;
    }
    return `<label class="field"><span>${esc(f.label)}</span><input name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" ${req} maxlength="160"></label>`;
  }).join('');
  const back = openModal(`
    <div class="sheet-art">${posterHTML(s)}</div>
    <button class="icon-btn sheet-x" data-act="close-modal" aria-label="Kapat" title="Kapat">${I.close}</button>
    <div class="scen-body">
      <p class="scen-tags">${modeLabel(s.mode)}${(s.tags || []).length ? ' · ' + esc(s.tags.slice(0, 4).join(', ')) : ''}</p>
      <h2>${esc(s.subtitle)}</h2>
      ${s.description ? `<p class="scen-desc">${esc(s.description)}</p>` : ''}
      ${saves.length ? `<div class="scen-saves"><h3>Bu dünyadaki oyunların</h3>${saves.map(x => `<div class="save-row"><a href="#/oyna/${esc(x.id)}"><strong>${esc(x.label || 'Oyun')}</strong><span>${x.turns || 0} tur, ${timeAgo(x.updatedAt)}</span></a><button class="icon-btn sm" data-act="del-save" data-id="${esc(x.id)}" aria-label="Oyunu sil" title="Oyunu sil">${I.trash}</button></div>`).join('')}</div>` : ''}
      <form class="setup" id="setup-form">
        <h3>${saves.length ? 'Yeni bir oyun başlat' : 'Oyuna hazırlan'}</h3>
        ${fields}
        <button class="btn primary big" type="submit">Oyuna başla</button>
      </form>
      ${isCustom ? `<div class="scen-own"><a class="btn ghost" href="#/olustur/${esc(s.id)}">Senaryoyu düzenle</a><button class="btn ghost danger" data-act="del-scen" data-id="${esc(s.id)}">Senaryoyu sil</button></div>` : ''}
    </div>`, 'scen-modal', () => { if (location.hash.startsWith('#/senaryo')) location.hash = '#/'; });
  const sheet = $('.scen-modal', back);
  sheet.style.cssText = worldVars(s);
  sheet.setAttribute('aria-label', s.title);
  $$('select[data-custom="1"]', back).forEach(sel => sel.addEventListener('change', () => {
    const inp = sel.parentElement.querySelector('.custom-in');
    inp.hidden = sel.value !== '__diger'; if (!inp.hidden) inp.focus();
  }));
  $('#setup-form', back).addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const setup = {};
    setupFields(s).forEach(f => {
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
  const wide = window.matchMedia('(min-width: 1360px)').matches;
  app.innerHTML = `
  <div class="play ${wide ? 'panel-open' : ''}" style="${worldVars(scen)}">
    <aside class="plate" id="plate" data-act="toggle-plate">
      <div class="scene-bg" id="scene-bg" aria-hidden="true"><div class="layer"></div><div class="layer"></div></div>
      <button type="button" class="scene-status" id="scene-status" data-act="scene-retry" hidden></button>
      <div class="plate-cap"><strong>${esc(scen.title)}</strong><span id="save-label-2">${esc(save.label)}</span></div>
    </aside>
    <div class="read">
      <header class="play-top">
        <a class="top-text" href="#/" aria-label="Dünyalara dön" title="Dünyalara dön">${I.back}<span>Dünyalar</span></a>
        <div class="play-title"><strong>${esc(scen.title)}</strong><span id="save-label">${esc(save.label)}</span></div>
        <div class="play-spacer"></div>
        <button class="top-text" data-act="advisor" aria-label="Danışmana sor" title="Danışmana sor">${I.advisor}<span>Danışman</span></button>
        <button class="top-text" data-act="toggle-panel" aria-label="Defter: durum ve hafıza" title="Durum ve hafıza">${I.panel}<span>Defter</span></button>
        <button class="top-text" data-act="settings" aria-label="Ayarlar" title="Ayarlar">${I.gear}<span>Ayarlar</span></button>
      </header>
      <main class="story-wrap" id="story-wrap"><div class="story" id="story"></div></main>
      <footer class="composer">
        <div class="options" id="options"></div>
        <form class="compose" id="compose">
          <textarea id="input" rows="1" placeholder="Ne yapıyorsun?" aria-label="Eylemin"></textarea>
          <button type="button" class="icon-btn" data-act="continue" title="Bir şey yapmadan hikayeyi ilerlet" aria-label="Hikayeyi ilerlet" style="width:46px;height:46px">${I.forward}</button>
          <button type="submit" class="send" id="send" aria-label="Gönder">${I.send}</button>
        </form>
      </footer>
    </div>
    <aside class="panel" id="panel" aria-label="Durum ve hafıza"></aside>
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
  if (settings.images) {
    P.scene = new SceneStage($('#scene-bg'), {
      key: (settings.keys.pollinations || '').trim(), style: settings.imgStyle, seedBase: save.id,
      portrait: $('#scene-bg').clientHeight > $('#scene-bg').clientWidth,
      onStatus: showSceneStatus,
      onKeyProblem: () => { if (!P?.keyWarned && P) { P.keyWarned = true; toast('Pollinations anahtarın çalışmadı, anahtarsız görsele geçildi. Ayarlar\'dan kontrol et.'); } },
    });
    P.scene.setBase(coverHTML(scen));
    let ticking = false;
    $('#story-wrap').addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { ticking = false; updateActiveScene(); });
    }, { passive: true });
  } else {
    const l = $('#scene-bg .layer');
    l.innerHTML = coverHTML(scen); l.classList.add('on');
  }
  renderStory(true);
  renderPanel();
  updateComposer();
  if (!save.messages.length) generate('new');
}

const lastMsg = () => P.save.messages[P.save.messages.length - 1];

function showSceneStatus({ state, seconds }) {
  const st = $('#scene-status'); if (!st) return;
  st.hidden = state === 'idle';
  st.classList.toggle('failed', state === 'fail');
  st.disabled = state !== 'fail';
  st.textContent = state === 'wait' ? `Sıradaki görsel ${seconds} sn sonra`
    : state === 'fail' ? 'Görsel üretilemedi, tekrar dene'
    : 'Sahne görseli hazırlanıyor';
  clearTimeout(st._t);
  // Geri sayımı canlı tut
  if (state === 'wait' && seconds > 1) st._t = setTimeout(() => showSceneStatus({ state, seconds: seconds - 1 }), 1000);
}

function msgHTML(m, i, isLast, cast) {
  if (m.role === 'user') {
    if (m.cont) return `<div class="msg cont" data-i="${i}"><span>hikaye ilerliyor</span><div class="msg-tools"><button class="icon-btn sm" data-act="cut" data-i="${i}" title="Buradan sonrasını sil" aria-label="Buradan sonrasını sil">${I.trash}</button></div></div>`;
    return `<div class="msg user" data-i="${i}"><div class="msg-body">${md(m.text)}</div>
      <div class="msg-tools"><button class="icon-btn sm" data-act="edit" data-i="${i}" title="Düzenle" aria-label="Düzenle">${I.edit}</button><button class="icon-btn sm" data-act="cut" data-i="${i}" title="Buradan sonrasını sil" aria-label="Buradan sonrasını sil">${I.trash}</button></div></div>`;
  }
  const { visible } = splitOutput(cur(m));
  const n = m.alts.length;
  const compose = settings.images && cast ? sceneComposer(P.save, P.scen, cast) : null;
  return `<div class="msg model" data-i="${i}"><div class="msg-body">${storyHTML(visible, compose)}</div>
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
  const head = `<div class="story-head"><h1 class="sr-only">${esc(scen.title)}</h1><p class="epigraph">${esc(scen.subtitle || save.label)}</p></div>`;
  let html = head;
  const lastIdx = msgs.length - 1;
  let cast = new Map();
  msgs.forEach((m, i) => {
    if (i === save.sumUpTo && save.sumUpTo > 0) html += `<div class="memory-line"><span>Bu noktadan öncesi hikaye özetine aktarıldı</span></div>`;
    if (m.role === 'model') cast = applyCards(cast, m.alts?.[m.ai] || '', i);
    html += msgHTML(m, i, i === lastIdx && !P.busy, withEdits(cast, save.castEdits));
  });
  if (P.error) {
    html += `<div class="err" role="alert"><p>${esc(P.error.message)}</p><div class="row"><button class="btn primary" data-act="retry">Tekrar dene</button>${P.error.kind === 'model' ? '<button class="btn" data-act="fix-model">Çalışan modeli bul</button>' : ''}${/anahtar|model/.test(P.error.kind) ? '<button class="btn" data-act="settings">Ayarları aç</button>' : ''}</div></div>`;
  }
  if (!msgs.length && P.busy) html += `<div class="msg model"><div class="msg-body"><p class="loading">Dünya kuruluyor</p></div></div>`;
  el.innerHTML = html;
  // Seçenekler okuma alanını küçültür: önce onlar çizilir, sonra sona kaydırılır.
  renderOptions();
  if (jump) {
    scrollStory(true);
    // Yazı tipi geç yüklenirse metin uzar; ilk açılışta yine sona in.
    const me = P;
    document.fonts?.ready.then(() => { if (P === me) scrollStory(true); });
  }
  updateActiveScene();
}

/** Ekranın ortasına en yakın sahne paragrafının görselini arka plana getirir */
function updateActiveScene() {
  if (!P?.scene) return;
  const w = $('#story-wrap'); if (!w) return;
  const ps = $$('#story p[data-scene]');
  if (!ps.length) return;
  const limit = w.getBoundingClientRect().top + w.clientHeight * (P.busy ? 0.8 : 0.4);
  let pick = ps[0];
  for (const p of ps) { if (p.getBoundingClientRect().top < limit) pick = p; else break; }
  P.scene.want(pick.dataset.scene);
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

function castHTML() {
  if (!settings.images) return '';
  const cast = [...castOf(P.save.messages, undefined, P.save.castEdits).entries()];
  return `<section class="pbox"><details><summary>Karakterler (${cast.length})</summary>
    <p class="hint">Görsellerde ve hikayede karakterlerin bu tarife göre görünür. Beğenmediğini değiştirebilirsin; görsel modeli için İngilizce yaz.</p>
    ${cast.length ? cast.map(([k, c]) => `<label class="cast-card"><span>${esc(c.name)}</span><textarea rows="2" data-cast="${esc(k)}">${esc(c.look)}</textarea></label>`).join('') : '<p class="hint">Karakterler sahneye çıktıkça burada görünecek.</p>'}
    </details></section>`;
}

function ledgerHTML() {
  const items = ledgerOf(P.save.messages);
  const grp = (type, title) => {
    const l = items.filter(x => x.type === type);
    return l.length ? `<h4>${title}</h4><ul class="ledger">${l.map(x => `<li>${esc(x.text)}</li>`).join('')}</ul>` : '';
  };
  const body = grp('sonuc', 'Bekleyen sonuçlar') + grp('soru', 'Açık meseleler') + grp('fact', 'Hatırlananlar');
  return `<section class="pbox"><details><summary>Hikaye defteri (${items.length})</summary>
    <p class="hint">Yapay zekanın hikayeden aklında tuttuğu önemli şeyler. Yanlış hatırladığı bir şey varsa aşağıdaki Hafıza notlarına doğrusunu yaz, notlar defterden önceliklidir.</p>
    ${body || '<p class="hint">Hikaye ilerledikçe dolacak.</p>'}</details></section>`;
}

function renderPanel() {
  const el = $('#panel'); if (!el) return;
  const { save, scen } = P;
  const sl = setupFields(scen).map(f => save.setup?.[f.id] ? `<li><span>${esc(f.label.replace(/\s*\(.*\)$/, ''))}</span>${esc(save.setup[f.id])}</li>` : '').join('');
  el.innerHTML = `
    <div class="panel-top">
      <button class="btn sm adv-open" data-act="advisor" aria-label="Danışmana sor" title="Danışmana sor">${I.advisor}<span>Danışman</span></button>
      <button class="icon-btn panel-x" data-act="toggle-panel" aria-label="Paneli kapat">${I.close}</button>
    </div>
    ${statsHTML()}
    <section class="pbox">
      <h3>Hafıza notları</h3>
      <p class="hint">Yapay zekanın asla unutmamasını istediğin şeyler. Örneğin: "Kardeşimin adı Aras. Sol kolum yaralı."</p>
      <textarea data-field="notes" rows="4" placeholder="Not ekle">${esc(save.notes)}</textarea>
    </section>
    ${castHTML()}
    ${ledgerHTML()}
    <section class="pbox">
      <details>
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
  $$('textarea[data-cast]', el).forEach(t => t.addEventListener('input', debounce(() => {
    P.save.castEdits = { ...(P.save.castEdits || {}), [t.dataset.cast]: t.value };
    writeSave(P.save);
  }, 400)));
}

/* ---------- danışman ---------- */
const ADVISOR_RULES = `Sen bu hikayedeki oyuncunun güvendiği danışmansın: bilgili, sadık ve açık sözlü biri. Oyuncu hikayenin dışından sana soru soruyor; sen sahne yazmıyorsun, soruyu cevaplıyorsun.
- Aşağıdaki dünya bilgisine, hikaye özetine, defterdeki gerçeklere, durum değerlerine ve son sahneye dayanarak cevapla. Oyuncunun karakterinin bilebileceği şeyleri söyle; karakterin henüz öğrenmediği sırları ve başkalarının gizli niyetlerini açma.
- Cevap kayıtlarda yoksa (örneğin bir köyün nüfusu) dünyaya ve çağa uygun makul bir tahmin ver ve bunun tahmin olduğunu belirt ("tahminen", "yaklaşık"). Kayıtlardaki hiçbir bilgiyle çelişme.
- Tavsiye istenirse kısa ve somut öner; kararı oyuncuya bırak.
- Hikayeyi ilerletme, oyuncu adına eylem yazma, yeni olay uydurma.
- Yalnızca Türkçe, 2-5 cümle, düz metin yaz. Başlık, madde listesi ve <durum>, <defter>, <sahne>, <secenekler> gibi etiketler kullanma.`;

function advisorSystem(save, scen, question) {
  const parts = [ADVISOR_RULES, `## Senaryo: ${scen.title}\n${scen.world}`];
  const sl = setupLines(save, scen);
  if (sl) parts.push(`## Oyuncunun seçimleri\n${sl}`);
  const st = currentStats();
  if (st) parts.push('## Güncel durum\n' + Object.entries(st).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : (v && typeof v === 'object' ? JSON.stringify(v) : v)}`).join('\n'));
  const lt = ledgerText(ledgerOf(save.messages), { maxTokens: 2500, query: question });
  if (lt) parts.push(`## Hikaye defteri (kesin gerçekler)\n${lt}`);
  if (save.summary?.trim()) parts.push(`## Şimdiye kadar olanlar\n${save.summary.trim()}`);
  if (save.notes?.trim()) parts.push(`## Oyuncunun notları (kesin gerçek)\n${save.notes.trim()}`);
  const recent = save.messages.filter(m => m.role === 'model').slice(-2).map(m => stripScenes(splitOutput(cur(m)).visible).trim()).filter(Boolean);
  if (recent.length) parts.push(`## Son sahneler\n${recent.join('\n\n---\n\n')}`);
  return parts.join('\n\n');
}

const advClean = t => splitOutput(stripThink(t)).visible.trim();

function advLogHTML() {
  const me = P, list = me.save.advisor || [], pend = me.adv;
  let h = list.map((m, i) => m.role === 'user'
    ? `<div class="adv-msg me"><p>${esc(m.text)}</p></div>`
    : `<div class="adv-msg"><div class="adv-body">${md(m.text)}</div><button type="button" class="adv-pin" data-adv-pin="${i}">Hafıza notlarına ekle</button></div>`).join('');
  if (pend) {
    h += `<div class="adv-msg me"><p>${esc(pend.q)}</p></div>`;
    if (pend.error) h += `<div class="adv-msg"><p class="adv-err">${esc(pend.error)}</p></div>`;
    else h += `<div class="adv-msg"><div class="adv-body">${pend.out ? md(pend.out) : '<p class="loading">Düşünüyor</p>'}</div></div>`;
  }
  if (!h) h = `<p class="adv-empty">Danışmanın hikayeyi ve dünyayı biliyor. Bir şey sor.</p>
    <div class="adv-chips">${['Burası hakkında ne biliyoruz?', 'Elimizde neler var?', 'Şimdi ne yapmalıyım?', 'Kimlere güvenebilirim?'].map(q => `<button type="button" class="adv-chip" data-adv-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
  return h;
}

function renderAdvisor(stick = true) {
  const log = $('#adv-log'); if (!log) return;
  log.innerHTML = advLogHTML();
  if (stick) log.scrollTop = log.scrollHeight;
}

function openAdvisor() {
  if (!P) return;
  const me = P;
  me.save.advisor = me.save.advisor || [];
  const back = openModal(`<div class="adv">
    <div class="m-head adv-head"><h2>Danışman</h2><button class="icon-btn" data-act="close-modal" aria-label="Kapat">${I.close}</button></div>
    <p class="hint adv-hint">Hikayeyi ilerletmeden sorabilirsin. Cevaplar hikayedeki kayıtlara dayanır; kayıtta olmayan bir şey sorarsan danışman tahmin ettiğini söyler.</p>
    <div class="adv-log" id="adv-log" aria-live="polite"></div>
    <form class="adv-form" id="adv-form">
      <textarea id="adv-input" rows="1" placeholder="Danışmana sor…" aria-label="Danışmana sorun"></textarea>
      <button type="submit" class="send" id="adv-send" aria-label="Gönder">${I.send}</button>
    </form>
  </div>`, 'advisor-modal');
  renderAdvisor();
  const input = $('#adv-input', back);
  const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#adv-form', back).requestSubmit(); }
  });
  $('#adv-form', back).addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t || me.adv && !me.adv.error) return;
    input.value = ''; grow();
    askAdvisor(t);
  });
  $('#adv-log', back).addEventListener('click', e => {
    const q = e.target.closest('[data-adv-q]');
    if (q) { askAdvisor(q.dataset.advQ); return; }
    const pin = e.target.closest('[data-adv-pin]');
    if (pin) {
      const m = me.save.advisor[+pin.dataset.advPin]; if (!m) return;
      me.save.notes = (me.save.notes?.trim() ? me.save.notes.trim() + '\n' : '') + m.text;
      writeSave(me.save); if (P === me) renderPanel();
      pin.textContent = 'Eklendi'; pin.disabled = true;
      toast('Hafıza notlarına eklendi. Dilersen panelden düzenleyebilirsin.');
    }
  });
  setTimeout(() => input.focus({ preventScroll: true }), 60);
}

async function askAdvisor(text) {
  const me = P; if (!me || (me.adv && !me.adv.error)) return;
  const { save, scen } = me;
  if (!hasKey() && settings.backup === false) { closeModal(true); openSettings('Danışmanı kullanmak için bir API anahtarı ekle.'); return; }
  me.adv = { q: text, out: '' };
  renderAdvisor();
  const live = () => P === me && $('#adv-log');
  const fail = msg => { me.adv.error = msg; if (live()) { renderAdvisor(); const inp = $('#adv-input'); if (inp && !inp.value) inp.value = text; } };
  try {
    if (hasKey()) await ensureModel();
    // Yalnızca user/model sırası bozulmasın: ardışık aynı rolleri birleştir, user ile başla
    const history = [];
    for (const m of [...save.advisor, { role: 'user', text }].slice(-24)) {
      const last = history[history.length - 1];
      if (last && last.role === m.role) last.text += '\n\n' + m.text; else history.push({ role: m.role, text: m.text });
    }
    while (history.length && history[0].role !== 'user') history.shift();
    let out = '';
    for await (const t of streamAny({ system: advisorSystem(save, scen, text), history, temperature: 0.6, maxTokens: 700, signal: AbortSignal.timeout(90000) }, { maxTries: 6 })) {
      out += t; me.adv.out = advClean(out);
      if (live()) renderAdvisor();
    }
    const answer = advClean(out);
    if (!answer) return fail('Danışman boş bir cevap verdi. Tekrar sor.');
    save.advisor.push({ role: 'user', text }, { role: 'model', text: answer });
    save.advisor = save.advisor.slice(-40);
    writeSave(save);
    me.adv = null;
    if (live()) renderAdvisor();
  } catch (e) {
    fail(e instanceof AIError ? e.message : e.name === 'TimeoutError' ? 'Danışman zamanında cevap veremedi. Tekrar dene.' : 'Danışman cevap veremedi: ' + (e.message || 'bilinmeyen hata'));
  }
}

function sendUser(text, cont = false) {
  const { save } = P;
  P.error = null;
  save.messages.push(cont ? { role: 'user', cont: true, text: '' } : { role: 'user', text });
  save.turns = (save.turns || 0) + 1;
  writeSave(save);
  generate('new');
}

/* ---------- kesintisiz yedek: servisler ve modeller arasında otomatik geçiş ---------- */
const cool = store.get('cool', {});
const routeKey = (p, m) => p + '|' + m;
const isCool = (p, m) => (cool[routeKey(p, m)]?.until || 0) > Date.now();
/** Hata veren modeli bir süre atla: limit dolunca 2 dk'dan başlayıp 1 saate kadar, bulunamayan model 1 gün */
function markBad(p, m, kind) {
  const k = routeKey(p, m), c = cool[k] || { n: 0 };
  c.n++;
  const min = kind === 'model' ? 24 * 60 : (kind === 'anahtar' || kind === 'anahtar-yok') ? 30 : Math.min(60, 2 * 2 ** (c.n - 1));
  c.until = Date.now() + min * 60000; cool[k] = c; store.set('cool', cool);
}
function markGood(p, m) { if (cool[routeKey(p, m)]) { delete cool[routeKey(p, m)]; store.set('cool', cool); } }
const hasKeyFor = p => KEYLESS[p] ? true : p === 'custom' ? !!settings.customBase : !!(settings.keys[p] || '').trim();
const routeSettings = r => ({ ...settings, provider: r.p, models: { ...settings.models, [r.p]: r.model } });
const routeLabel = r => r.p === settings.provider ? r.model : `${r.model} (${providerLabel(r.p)})`;

async function modelsFor(p) {
  if (KEYLESS[p]) return KEYLESS[p].models;
  let list = settings.modelLists[p];
  if (!list?.length) {
    try { list = await listModels({ ...settings, provider: p }); settings.modelLists[p] = list; saveSettings(); }
    catch { return [settings.models[p] || PROVIDERS[p].fallbackModel].filter(Boolean); }
  }
  const ranked = rankModels(p, list);
  const saved = settings.models[p];
  return saved && ranked.includes(saved) ? [saved, ...ranked.filter(x => x !== saved)] : ranked;
}

/** Denenecek sıra: seçili servis, anahtarı olan diğer servisler, en son anahtarsız yedekler. Yakın zamanda hata verenler atlanır. */
async function routePlan({ keyless = true } = {}) {
  const main = settings.provider;
  const order = [main, ...Object.keys(PROVIDERS).filter(p => p !== main && p !== 'custom')].filter(hasKeyFor);
  if (keyless && settings.backup !== false) order.push(...Object.keys(KEYLESS));
  const plan = [], all = [];
  for (const p of order) {
    const ms = (await modelsFor(p)).slice(0, 8);
    const per = p === main ? 4 : KEYLESS[p] ? 2 : 3;
    all.push(...ms.slice(0, 1).map(model => ({ p, model })));
    plan.push(...ms.filter(m => !isCool(p, m)).slice(0, per).map(model => ({ p, model })));
  }
  return plan.length ? plan : all;   // hepsi beklemedeyse yine de birer kez dene
}

/** Arka plan işleri (özet, defter, danışman) için: biri hata verirse sıradakine geçen akış */
async function* streamAny(opts, { keyless = true, maxTries = 4, onSwitch } = {}) {
  const plan = (await routePlan({ keyless })).slice(0, maxTries);
  if (!plan.length) throw new AIError('Önce Ayarlar\'dan ücretsiz bir API anahtarı ekle.', 'anahtar-yok');
  const skip = new Set();
  let last = null, first = true;
  for (const r of plan) {
    if (skip.has(r.p)) continue;
    if (!first) onSwitch?.(r);
    first = false;
    let got = false;
    try {
      for await (const t of streamChat({ ...opts, settings: routeSettings(r) })) { got = true; yield t; }
      markGood(r.p, r.model);
      return;
    } catch (e) {
      if (got || e.name === 'AbortError' || e.name === 'TimeoutError') throw e;
      last = e; markBad(r.p, r.model, e.kind);
      if (['anahtar', 'anahtar-yok', 'ag'].includes(e.kind)) skip.add(r.p);
    }
  }
  throw last || new AIError('Hiçbir servis cevap vermedi.', 'model');
}
async function completeAny(opts, o) { let out = ''; for await (const t of streamAny(opts, o)) out += t; return out; }

async function nextModel(tried) {
  const p = settings.provider;
  let list = settings.modelLists[p];
  if (!list?.length) {
    try { list = await listModels(settings); settings.modelLists[p] = list; } catch { return null; }
  }
  return rankModels(p, list).find(id => !tried.has(id)) || null;
}

async function generate(kind = 'new') {
  if (!P || P.busy) return;
  const { save, scen } = P;
  P.error = null;
  if (!hasKey() && settings.backup === false) {
    P.error = { message: 'Oynamak için önce Ayarlar\'dan ücretsiz bir API anahtarı eklemelisin.', kind: 'anahtar-yok' };
    renderStory(true); openSettings('Oyunu başlatmak için bir API anahtarı ekle. Ekledikten sonra "Tekrar dene"ye bas.');
    return;
  }
  const me = P;
  P.busy = true; updateComposer(); renderOptions();
  if (hasKey()) await ensureModel();
  const plan = P === me ? await routePlan() : [];
  if (P !== me) return;
  if (!plan.length) { me.busy = false; P.error = { message: 'Kullanılabilir bir yapay zeka yok. Ayarlar\'dan ücretsiz bir API anahtarı ekle.', kind: 'anahtar-yok' }; updateComposer(); renderStory(true); return; }

  let m;
  if (kind === 'regen') { m = lastMsg(); if (!m || m.role !== 'model') { P.busy = false; updateComposer(); return; } m.alts.push(''); m.ai = m.alts.length - 1; }
  else { m = { role: 'model', alts: [''], ai: 0, t: Date.now() }; save.messages.push(m); }
  const idx = save.messages.indexOf(m);
  renderStory();
  const node = $(`.msg[data-i="${idx}"] .msg-body`);
  node.innerHTML = '<p class="loading">Yazıyor</p>';
  scrollStory(true);

  const lastUser = [...save.messages.slice(0, idx)].reverse().find(x => x.role === 'user');
  const ooc = /^\s*\(?\s*ooc\b/i.test(lastUser?.text || '');
  const prevReply = [...save.messages.slice(0, idx)].reverse().find(x => x.role === 'model');
  const prevText = prevReply ? splitOutput(cur(prevReply)).visible : '';
  const baseCast = withEdits(castOf(save.messages, idx), save.castEdits);
  let ri = 0, route = plan[0], tries = 0;
  const skipProv = new Set();
  const FIRST_LIMIT = 35, STALL_LIMIT = 40, MAX_TRIES = 10;
  let raw = '', pending = false, error = null, timedOut = false, stopped = false, looped = false, truncated = false;
  let scale = 1, qualityRetried = false, qualityNote = '';

  const paint = () => {
    pending = false;
    if (P !== me || (!raw && node.querySelector('.loading'))) return;
    const castNow = withEdits(applyCards(baseCast, raw), save.castEdits);
    const compose = settings.images ? sceneComposer(save, scen, castNow) : null;
    // Takip kararı içerik eklenmeden önce verilmeli; büyük bir parça gelince oyuncu altta kalmasın
    const w = $('#story-wrap');
    const follow = w && w.scrollHeight - w.scrollTop - w.clientHeight < 220;
    node.innerHTML = storyHTML(splitOutput(raw).visible, compose) + '<span class="caret" aria-hidden="true"></span>';
    if (follow) scrollStory(true);
    if (!P.scene) return;
    const keys = parseScenes(stripThink(raw)).map(compose).filter(Boolean);
    keys.forEach(k => P.scene.prefetch(k));
    // Görsel, ilk paragraf daha yazılmadan sahne etiketi gelir gelmez başlar
    if (keys.length && !$('p[data-scene]', node)) P.scene.want(keys[0]);
    else updateActiveScene();
  };

  while (true) {
    tries++;
    const ctrl = new AbortController();
    P.ctrl = ctrl;
    timedOut = false; error = null; looped = false; truncated = false;
    const { system, history } = buildContext(save, scen, idx, scale, route);
    if (qualityNote) history[history.length - 1].text += '\n\n' + qualityNote;
    const started = Date.now();
    let lastChunk = started;
    const label = routeLabel(route);
    const watch = setInterval(() => {
      const now = Date.now();
      if (!raw) {
        const sec = Math.round((now - started) / 1000);
        if (P === me && sec >= 6) node.innerHTML = `<p class="loading">Yazıyor (${sec} sn)</p>`;
        if (sec >= FIRST_LIMIT) { timedOut = true; ctrl.abort(); }
      } else if (now - lastChunk > STALL_LIMIT * 1000) { timedOut = true; ctrl.abort(); }
    }, 1000);
    try {
      const opts = { settings: routeSettings(route), system, history, signal: ctrl.signal, maxTokens: OUTPUT_TOKENS[settings.length] || OUTPUT_TOKENS.orta, onFinish: r => { if (r === 'length') truncated = true; } };
      for await (const chunk of streamChat(opts)) {
        lastChunk = Date.now();
        raw += chunk; m.alts[m.ai] = raw;
        if (isLooping(raw)) { looped = true; ctrl.abort(); break; }
        if (!pending) { pending = true; requestAnimationFrame(paint); }
      }
    } catch (e) {
      if (e.name !== 'AbortError') error = e;
    }
    clearInterval(watch);
    if (ctrl.signal.aborted && !timedOut && !looped) { stopped = true; break; }   // oyuncu durdurdu
    // İstek bu model için fazla uzunsa bağlamı daraltıp aynı modelle yeniden dene (özet ve defter yine gider)
    if (error?.kind === 'cok-buyuk' && !raw.trim() && scale > 0.3) {
      scale *= 0.6;
      continue;
    }
    // Bozuk cevabı (yanlış dil, döngü, boş) oyuncu görmesin: bir kez düzeltme notuyla yeniden yaz
    if (!error && !timedOut && raw.trim() && !qualityRetried && P === me) {
      const issue = looped ? 'tekrar' : qualityIssue(splitOutput(raw).visible, { prevReply: prevText, ooc });
      if (issue) {
        qualityRetried = true;
        qualityNote = {
          dil: '[Önceki denemen geçersizdi: Türkçe dışında bir dil kullandın. Hikaye metnini yalnızca Türkçe yaz.]',
          tekrar: '[Önceki denemen geçersizdi: aynı cümleleri tekrar ettin. Hikayeyi yeni olaylarla ilerlet, önceki cevabındaki cümleleri kullanma.]',
          kisa: '[Önceki denemen geçersizdi: cevap neredeyse boştu. Sahneyi gerçekten yaz.]',
        }[issue];
        raw = ''; m.alts[m.ai] = '';
        node.innerHTML = '<p class="loading">Daha iyi bir cevap yazılıyor</p>';
        continue;
      }
    }
    if (looped) { raw = removeRepeats(raw); m.alts[m.ai] = raw; looped = false; break; }
    if (!error && !timedOut) break;                                       // başarılı
    if (raw.trim()) break;                                                // yarım cevap var, model değiştirme
    // Bu model şimdilik dolu ya da bozuk: bir süre atla, sıradaki modele ya da servise geç
    markBad(route.p, route.model, timedOut ? 'zaman' : error?.kind);
    if (error && ['anahtar', 'anahtar-yok', 'ag'].includes(error.kind)) skipProv.add(route.p);
    if (error?.kind === 'ag' && navigator.onLine === false) break;
    if (tries >= MAX_TRIES || P !== me) break;
    let next;
    while ((next = plan[++ri]) && skipProv.has(next.p));
    if (!next) break;
    route = next;
    node.innerHTML = `<p class="loading">${esc(label)} yanıt vermedi, ${esc(routeLabel(route))} deneniyor</p>`;
  }
  if (!error && !timedOut && !stopped && raw.trim()) {
    markGood(route.p, route.model);
    // Seçili servisin çalışan modelini hatırla; başka servise geçildiyse oyuncuya bir kez söyle
    if (route.p === settings.provider && settings.models[route.p] !== route.model) { settings.models[route.p] = route.model; saveSettings(); }
    if (route.p !== settings.provider && me.lastProv !== route.p) toast(hasKey()
      ? `${providerLabel(settings.provider)} şu an cevap vermiyor, ${providerLabel(route.p)} ile devam edildi.`
      : 'Anahtarsız yedek servisle oynuyorsun. Daha iyi Türkçe için Ayarlar\'dan ücretsiz Gemini anahtarı ekle.');
    me.lastProv = route.p;
  }
  if (timedOut || (error && tries > 1)) {
    const lastMsg_ = error?.message;
    error = { kind: tries > 1 ? 'model' : (error?.kind || 'model'), message: raw
      ? 'Cevap yarıda takıldı. "Tekrar dene"ye bas.'
      : (tries > 1
        ? `Denenen ${tries} modelin hiçbiri cevap vermedi. Ücretsiz limitler dolmuş olabilir; dolan modeller bir süre atlanıp kendiliğinden geri gelir. Takılmadan oynamak için Ayarlar → Kesintisiz oyun bölümünden Groq ve Mistral gibi ücretsiz anahtarlar ekle.${lastMsg_ ? ' Son hata: ' + lastMsg_ : ''}`
        : `Yapay zeka ${FIRST_LIMIT} saniyedir cevap vermedi. "Çalışan modeli bul"a bas.`) };
  }
  // Çıktı sınırına takıldıysa yarım cümleyle bitmesin
  if (truncated && raw.trim() && !stopped) {
    const c = raw.search(TAG_CUT);
    if (c < 0) { raw = trimToSentence(raw); m.alts[m.ai] = raw; }
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
  if (error || stopped || !raw.trim()) return;
  await repairReply(me, m, ooc);
  maybeSummarize();
}

/** Model defteri ya da geçerli bir sahneyi atladıysa (zayıf modellerde sık olur) kısa bir istekle tamamlar.
 *  Böylece hafıza ve görsel, modelin biçim kurallarına uymasına bağlı kalmaz. */
async function repairReply(me, m, ooc) {
  if (ooc) return;
  const raw = m.alts[m.ai];
  const clean = cur(m);
  const visible = stripScenes(splitOutput(clean).visible);
  const needLedger = !/<defter>/i.test(clean);
  const hasScene = parseScenes(clean).some(s => !sceneProblem(s.text));
  const needScene = settings.images && !hasScene;
  if ((!needLedger && !needScene) || !visible) return;
  const idx = me.save.messages.indexOf(m);
  const cast = castOf(me.save.messages, idx, me.save.castEdits);
  const ask = [];
  if (needScene) ask.push(`Bu metnin ilk anı için görsel etiketleri. Metinde görünen ve aşağıdaki listede olmayan önemli karakterler için bir kez <karakter>Ad | English look, 10-18 words</karakter>, sonra <sahne kim="Ad">English, 15-28 words, starts with a camera angle, only what the text literally shows, no proper names, fully clothed, no blood</sahne>. Bilinen karakterler:\n${castLines(cast, visible) || '(yok)'}`);
  if (needLedger) ask.push('Hikaye hafızası bloğu: <defter> ... </defter>. İçinde en fazla 5 satır. "+ metin" ileride önemli olacak yeni gerçek (kişi, söz, borç, yara, eşya, karar, sır, yer, zaman), "! metin" gecikmeli sonuç ve yaklaşık zamanı, "? metin" çözülmemiş mesele. Türkçe, kısa.');
  try {
    const out = await completeAny({
      temperature: 0.2, signal: AbortSignal.timeout(30000),
      system: 'Bir hikaye oyununun kayıt memurusun. Yalnızca istenen etiketli blokları yaz; açıklama, giriş cümlesi ya da hikaye metni yazma.',
      history: [{ role: 'user', text: `Oyuncunun son hamlesi: ${[...me.save.messages.slice(0, idx)].reverse().find(x => x.role === 'user')?.text || '(açılış)'}\n\nAnlatıcının cevabı:\n${visible}\n\nİstenenler:\n- ${ask.join('\n- ')}` }],
    }, { keyless: false });
    if (m.alts[m.ai] !== raw) return;   // bu arada oyuncu yeniden yazdırdıysa dokunma
    let head = '', tail = '';
    if (needScene) {
      const scene = parseScenes(out).find(s => !sceneProblem(s.text));
      if (scene) {
        const cards = parseCards(out).map(c => `<karakter>${c.name} | ${c.look}</karakter>`).join('\n');
        head = `${cards}${cards ? '\n' : ''}<sahne kim="${(scene.kim || []).join(', ')}">${scene.text}</sahne>\n\n`;
      }
    }
    if (needLedger) {
      const d = out.match(/<defter>[\s\S]*?(<\/defter>|$)/i);
      if (d) tail = '\n\n' + d[0];
    }
    if (!head && !tail) return;
    m.alts[m.ai] = head + raw + tail;
    writeSave(me.save);
    if (P === me && !P.busy) { renderStory(); renderPanel(); } else if (P === me) renderPanel();
  } catch (e) { console.warn('Hafıza tamamlanamadı', e); }
}

async function maybeSummarize() {
  const me = P; if (!me || me.summarizing) return;
  const { save, scen } = me;
  const start = save.sumUpTo || 0;
  const budget = budgetNow();
  const systemTokens = approxTokens(buildSystem(save, scen, save.messages.length, budget));
  const budgetTokens = Math.max(1200, budget.total - systemTokens - 250);
  const plan = summaryPlan({
    messages: save.messages, start, budgetTokens,
    maxChunk: Math.min(Math.floor(budget.total * 0.55), 24000),
    textOf: m => historyText(m, false),
  });
  if (!plan) return;
  const { upto } = plan;
  const chunk = save.messages.slice(start, upto).map(m => m.role === 'user'
    ? (m.cont ? '' : 'OYUNCU: ' + m.text)
    : 'ANLATICI: ' + stripScenes(splitOutput(cur(m)).visible)).filter(Boolean).join('\n\n');
  me.summarizing = true; renderPanel();
  try {
    const text = await completeAny({
      temperature: 0.2, signal: AbortSignal.timeout(90000),
      system: 'Sen uzun soluklu bir rol yapma oyununun arşivcisisin. Görevin hikayenin hafızasını eksiksiz ve kısa tutmak. Sadece Türkçe özet yaz.',
      history: [{ role: 'user', text: `Senaryo: ${scen.title}\nOyuncunun seçimleri:\n${setupLines(save, scen)}\n\nŞimdiye kadarki özet:\n${save.summary || '(henüz yok)'}\n\nYeni olaylar:\n${chunk}\n\nBu ikisini birleştirerek güncel ve eksiksiz bir hikaye özeti yaz. Eski özetteki hiçbir önemli bilgiyi atma. Özel isimleri, sayıları ve eşya adlarını birebir koru. Mutlaka koru: oyuncunun karakteri ve şu anki durumu, önemli yan karakterler ve oyuncuyla ilişkileri, kimin neyi bildiği, verilen sözler, borçlar ve açık görevler, envanter ve kaynaklar, sırayla yaşanan kritik olaylar, bulunulan yer ve zaman. Kısa maddeler halinde, en fazla ${budget.sumWords} kelime. Sadece özeti yaz.` }],
    }, { keyless: false });
    // Model bozuk ya da kısacık özet döndürdüyse eskisini koru; sonraki turda yeniden denenir
    if (acceptableSummary(text, save.summary)) {
      // Geri alma için önceki özeti sakla: silinen olaylar özette kalmasın
      save.sumLog = [...(save.sumLog || []), { upto: start, summary: save.summary || '' }].slice(-8);
      save.summary = text.trim(); save.sumUpTo = upto;
      writeSave(save);
    }
  } catch (e) { console.warn('Özet alınamadı', e); }
  me.summarizing = false;
  if (P === me) { renderPanel(); if (!P.busy) renderStory(); }
}

/** Düzenlemede gizli etiketler görünmesin; kaydederken yerlerine dönsünler */
function hiddenTags(text) {
  const cards = (text.match(/<(karakter|dunya|dünya)>[\s\S]*?<\/(karakter|dunya|dünya)>/gi) || []).join('\n');
  const scenes = [];
  let at = 0;
  stripCards(text).split(/\n{2,}/).forEach(par => {
    const tags = par.match(sceneTagRe()) || [];
    if (tags.length) scenes.push({ at, tags: tags.join('') });
    if (stripScenes(par).trim()) at++;
  });
  return { cards, scenes };
}
function withHiddenTags(edited, { cards, scenes }) {
  const pars = edited.split(/\n{2,}/);
  scenes.forEach(s => { const i = Math.min(s.at, pars.length - 1); pars[i] = s.tags + '\n' + pars[i]; });
  return (cards ? cards + '\n\n' : '') + pars.join('\n\n');
}

function startEdit(i) {
  const m = P.save.messages[i];
  const box = $(`.msg[data-i="${i}"]`); if (!box || P.busy) return;
  const raw = m.role === 'model' ? cur(m) : m.text;
  const visible = m.role === 'model' ? stripScenes(splitOutput(raw).visible) : raw;
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
    const hidden = hiddenTags(cut >= 0 ? raw.slice(0, cut) : raw);
    m.alts[m.ai] = withHiddenTags(val, hidden) + (cut >= 0 ? '\n\n' + raw.slice(cut) : '');
  } else m.text = val;
  writeSave(P.save); renderStory(); renderPanel();
}
async function cutFrom(i) {
  if (P.busy) return;
  const me = P;
  if (!(await ask('Bu mesaj ve sonrasındaki her şey silinecek. Hikaye bu noktadan yeniden ilerleyecek.', { ok: 'Sil', danger: true })) || P !== me || P.busy) return;
  const { save } = P;
  rewindSummary(save, i);
  save.messages.splice(i);
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
      <div class="row test-row"><button class="btn primary" data-act="test-ai" type="button">Bağlantıyı dene</button><button class="btn" data-act="auto-model" type="button">Çalışan modeli otomatik bul</button></div>
      <p class="test-out" id="test-out" role="status"></p>
      <p class="hint">Anahtarın sadece bu tarayıcıda saklanır, hiçbir sunucuya kaydedilmez.</p>
    </section>
    <section class="m-sec">
      <h3>Kesintisiz oyun</h3>
      <p class="hint">Bir servis dolunca ya da hata verince oyun kendiliğinden sıradakine geçer; dolan model bir süre atlanır, sonra geri gelir. Ne kadar çok ücretsiz anahtar eklersen o kadar az takılırsın. Hepsi ücretsiz, hiçbiri kredi kartı istemez.</p>
      <ul class="backup-list">${Object.entries(PROVIDERS).filter(([k]) => k !== 'custom' && k !== p).map(([k, v]) => `<li>
        <div class="bk-top"><span>${esc(v.label)}</span>${(settings.keys[k] || '').trim() ? '<b class="bk-ok">Hazır</b>' : `<a href="${v.keyUrl}" target="_blank" rel="noopener">Ücretsiz anahtar al</a>`}</div>
        <input type="password" data-bkey="${k}" value="${esc(settings.keys[k] || '')}" autocomplete="off" spellcheck="false" placeholder="${esc(v.label)} anahtarı (yedek)">
      </li>`).join('')}</ul>
      <span class="label" style="margin-top:14px">Anahtarsız yedek</span>
      <div class="seg" role="group" aria-label="Anahtarsız yedek">${[[true, 'Açık'], [false, 'Kapalı']].map(([k, l]) => `<button class="${(settings.backup !== false) === k ? 'on' : ''}" data-act="backup" data-v="${k ? 1 : 0}">${l}</button>`).join('')}</div>
      <p class="hint">Hiç anahtar yoksa ya da hepsi doluysa anahtar istemeyen servisler devreye girer. Yavaştırlar ve Türkçeleri zayıftır, ama oyun durmaz.</p>
    </section>
    <section class="m-sec">
      <h3>Okuma</h3>
      <span class="label">Zemin</span>
      <div class="seg" role="group" aria-label="Zemin">${[['gece', 'Gece'], ['kagit', 'Kâğıt']].map(([k, l]) => `<button class="${(settings.theme || 'gece') === k ? 'on' : ''}" data-act="theme" data-v="${k}">${l}</button>`).join('')}</div>
      <span class="label" style="margin-top:14px">Yazı boyu</span>
      <div class="seg" role="group" aria-label="Yazı boyu">${[['kucuk', 'Küçük'], ['orta', 'Orta'], ['buyuk', 'Büyük']].map(([k, l]) => `<button class="${(settings.readSize || 'orta') === k ? 'on' : ''}" data-act="rsize" data-v="${k}">${l}</button>`).join('')}</div>
    </section>
    <section class="m-sec">
      <h3>Anlatım</h3>
      <span class="label">Cevap uzunluğu</span>
      <div class="seg" role="group" aria-label="Cevap uzunluğu">${[['kisa', 'Kısa'], ['orta', 'Orta'], ['uzun', 'Uzun']].map(([k, l]) => `<button class="${settings.length === k ? 'on' : ''}" data-act="len" data-l="${k}">${l}</button>`).join('')}</div>
      <label class="field"><span>Yaratıcılık: <b id="temp-v">${settings.temperature}</b></span><input type="range" min="0.3" max="1.4" step="0.1" data-s="temperature" value="${settings.temperature}"></label>
      <p class="hint">Düşük değer tutarlı ve ciddi, yüksek değer sürprizli ve renkli anlatım verir.</p>
    </section>
    <section class="m-sec">
      <h3>Sahne görselleri</h3>
      <p class="hint">Hikaye yazılırken anlatılan sahnenin görseli üretilir ve arka planda yumuşakça değişir. Karakterler, oyunun "Karakterler" bölümündeki tarife göre çizilir; gerçek kişilere benzetilmez.</p>
      <div class="seg" role="group" aria-label="Sahne görselleri">${[[true, 'Açık'], [false, 'Kapalı']].map(([k, l]) => `<button class="${!!settings.images === k ? 'on' : ''}" data-act="img-on" data-v="${k ? 1 : 0}">${l}</button>`).join('')}</div>
      <span class="label" style="margin-top:12px">Görsel tarzı</span>
      <div class="seg" role="group" aria-label="Görsel tarzı">${Object.entries(SCENE_STYLES).map(([k, v]) => `<button class="${settings.imgStyle === k ? 'on' : ''}" data-act="img-style" data-v="${k}">${v.label}</button>`).join('')}</div>
      <label class="field" style="margin-top:12px"><span>Pollinations anahtarı (isteğe bağlı)</span><input type="password" data-s="pollkey" value="${esc(settings.keys.pollinations || '')}" autocomplete="off" spellcheck="false" placeholder="pk_ ile başlayan uygulama anahtarı"></label>
      <p class="hint">Anahtarsız da çalışır, ama ücretsiz sınır yüzünden görsel en fazla 45 saniyede bir değişir, köşede küçük bir logo olur ve daha basit bir model kullanılır: yakın planda yüzler ve aynı karedeki iki kişi bozuk çıkabilir. enter.pollinations.ai adresinden hesap açıp "pk_" ile başlayan bir anahtar girersen görseller çok daha gerçekçi, hızlı ve logosuz gelir.</p>
      <a class="btn sm" href="https://enter.pollinations.ai" target="_blank" rel="noopener">Pollinations anahtar sayfası</a>
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
  $$('[data-bkey]', m).forEach(inp => inp.addEventListener('input', debounce(e => {
    const k = e.target.dataset.bkey;
    settings.keys[k] = e.target.value.trim(); saveSettings();
    const ok = e.target.parentElement.querySelector('.bk-top b, .bk-top a');
    if (ok && settings.keys[k]) ok.outerHTML = '<b class="bk-ok">Hazır</b>';
  }, 500)));
  $('[data-s="pollkey"]', m).addEventListener('input', debounce(e => { settings.keys.pollinations = e.target.value.trim(); saveSettings(); }, 400));
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

const PING = [{ role: 'user', text: 'Sadece "Bağlantı tamam" yaz.' }];

/** Listedeki modelleri sırayla dener, cevap veren ilkini seçer */
async function autoPickModel(onTry) {
  const p = settings.provider;
  const list = await listModels(settings);
  settings.modelLists[p] = list;
  const ranked = rankModels(p, list).slice(0, 8);
  if (!ranked.length) throw new AIError('Hesabında kullanılabilir bir model bulunamadı. Anahtarın doğru mu?', 'model');
  const prev = settings.models[p];
  let limited = null, lastErr = null;
  for (const id of ranked) {
    onTry?.(id);
    settings.models[p] = id;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const t = await complete({ settings, system: 'Çok kısa cevap ver.', history: PING, signal: ctrl.signal });
      clearTimeout(timer);
      if (t.trim()) { saveSettings(); return { id, text: t.trim() }; }
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (e.kind === 'anahtar' || e.kind === 'anahtar-yok' || e.kind === 'ag') { settings.models[p] = prev; throw e; }
      if (e.kind === 'limit' && !limited) limited = id;
    }
  }
  if (limited) { settings.models[p] = limited; saveSettings(); return { id: limited, text: '(kullanım limiti dolu, biraz bekleyince çalışır)', limited: true }; }
  settings.models[p] = prev;
  throw lastErr || new AIError('Hiçbir model cevap vermedi.', 'model');
}

async function testAI(forceAuto) {
  const out = $('#test-out');
  out.textContent = 'Deneniyor…'; out.className = 'test-out';
  const show = (msg, cls) => { out.textContent = msg; out.className = 'test-out ' + cls; };
  const refreshSelect = () => {
    const sel = $('[data-s="model"]'), p = settings.provider;
    if (sel) sel.innerHTML = (settings.modelLists[p] || []).map(o => `<option value="${esc(o.id)}" ${o.id === settings.models[p] ? 'selected' : ''}>${esc(o.id)}</option>`).join('');
  };
  try {
    if (!forceAuto && settings.models[settings.provider]) {
      try {
        const t = await complete({ settings, system: 'Çok kısa cevap ver.', history: PING, signal: AbortSignal.timeout(25000) });
        return show(`Çalışıyor (${settings.models[settings.provider]}): ${t.trim().slice(0, 60)}`, 'ok');
      } catch (e) {
        if (!['model', 'bos', 'genel', 'sunucu'].includes(e.kind) && e.name !== 'TimeoutError' && e.name !== 'AbortError') throw e;
        show('Bu model cevap vermedi, çalışan bir model aranıyor…', '');
      }
    }
    const r = await autoPickModel(id => show(`Deneniyor: ${id}`, ''));
    refreshSelect();
    show(r.limited ? `Model seçildi: ${r.id}. Ücretsiz limit şu an dolu, biraz bekle.` : `Çalışıyor. Model otomatik seçildi: ${r.id}`, r.limited ? 'bad' : 'ok');
  } catch (e) { show(e.message, 'bad'); }
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
    <div class="creator-wrap">
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
    <aside class="c-preview" aria-hidden="true"><div id="c-poster"></div><p class="hint">Afişin duvarda böyle görünecek. İki nokta koyarsan sonrası alt başlık olur.</p></aside>
    </div>
  </div>`;
  const form = $('#cform');
  const preview = () => { const el = $('#c-poster'); if (el) el.innerHTML = posterHTML({ id: 'onizleme', title: form.elements.title.value, cover, image }); };
  form.addEventListener('input', debounce(e => { if (e.target.name === 'title') preview(); }, 60));
  form.addEventListener('change', e => { if (e.target.name === 'mode') $('.char-field').hidden = e.target.value !== 'karakter'; });
  $('#cover-pick').addEventListener('click', e => {
    const b = e.target.closest('.cp'); if (!b) return;
    cover = b.dataset.cover; image = '';
    $$('.cp').forEach(x => x.classList.toggle('on', x === b));
    $('#cimg-state').textContent = '';
    preview();
  });
  $('#cimg').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try { image = await readImage(file); $$('.cp').forEach(x => x.classList.remove('on')); $('#cimg-state').textContent = 'Kendi resmin kullanılacak.'; preview(); }
    catch { toast('Bu resim okunamadı.'); }
  });
  $('#cimg-clear')?.addEventListener('click', () => { image = ''; $('#cimg-state').textContent = ''; $(`.cp[data-cover="${cover}"]`)?.classList.add('on'); preview(); });
  preview();
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
    case 'to-wall': $('#wall-top')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); break;
    case 'toggle-plate': b.classList.toggle('open'); break;
    case 'theme': settings.theme = b.dataset.v; saveSettings(); applyPrefs(); $$('[data-act="theme"]').forEach(x => x.classList.toggle('on', x === b)); break;
    case 'rsize': settings.readSize = b.dataset.v; saveSettings(); applyPrefs(); $$('[data-act="rsize"]').forEach(x => x.classList.toggle('on', x === b)); break;
    case 'cat': homeState.cat = b.dataset.cat; $$('.chip').forEach(c => c.classList.toggle('on', c === b)); renderShelves(); break;
    case 'prov': settings.provider = b.dataset.p; saveSettings(); openSettings(); if (view === 'home') renderHome(); break;
    case 'backup': settings.backup = b.dataset.v === '1'; saveSettings(); $$('[data-act="backup"]').forEach(x => x.classList.toggle('on', x === b)); break;
    case 'len': settings.length = b.dataset.l; saveSettings(); $$('[data-act="len"]').forEach(x => x.classList.toggle('on', x === b)); break;
    case 'toggle-key': { const inp = $('[data-s="key"]'); inp.type = inp.type === 'password' ? 'text' : 'password'; b.textContent = inp.type === 'password' ? 'Göster' : 'Gizle'; break; }
    case 'fetch-models': fetchModels(); break;
    case 'img-on': settings.images = b.dataset.v === '1'; saveSettings(); $$('[data-act="img-on"]').forEach(x => x.classList.toggle('on', x === b)); if (view === 'play') toast('Değişiklik oyunu yeniden açınca geçerli olur.'); break;
    case 'img-style': settings.imgStyle = b.dataset.v; saveSettings(); $$('[data-act="img-style"]').forEach(x => x.classList.toggle('on', x === b)); break;
    case 'test-ai': testAI(); break;
    case 'auto-model': testAI(true); break;
    case 'fix-model':
      if (!P || P.busy) break;
      b.disabled = true; b.textContent = 'Model aranıyor…';
      autoPickModel().then(r => { toast(`Model seçildi: ${r.id}`); P.error = null; generate(lastMsg()?.role === 'model' ? 'regen' : 'new'); })
        .catch(err => { b.disabled = false; b.textContent = 'Çalışan modeli bul'; toast(err.message); });
      break;
    case 'export': exportBackup(); break;
    case 'wipe':
      ask('Bütün oyunların, senaryoların ve ayarların silinecek. Bu geri alınamaz.', { ok: 'Her şeyi sil', danger: true }).then(yes => {
        if (!yes) return;
        Object.keys(localStorage).filter(k => k.startsWith('diyar.')).forEach(k => localStorage.removeItem(k));
        location.hash = '#/'; location.reload();
      });
      break;
    case 'del-save':
      ask('Bu oyun kalıcı olarak silinecek.', { ok: 'Sil', danger: true }).then(yes => {
        if (!yes) return;
        deleteSave(b.dataset.id); b.closest('.save-row')?.remove(); renderShelves();
      });
      break;
    case 'del-scen':
      ask('Bu senaryo silinecek. Bu senaryodaki kayıtlı oyunların yine de oynanabilir kalır.', { ok: 'Sil', danger: true }).then(yes => {
        if (!yes) return;
        store.set('custom', customs().filter(c => c.id !== b.dataset.id)); closeModal(true); location.hash = '#/'; renderHome();
      });
      break;
    // oyun ekranı
    case 'scene-retry': P?.scene?.retry(); break;
    case 'toggle-panel': $('.play')?.classList.toggle('panel-open'); break;
    case 'advisor': openAdvisor(); break;
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
      const me = P;
      ask('Bu oyunun yeni adı', { ok: 'Kaydet', input: P.save.label }).then(v => {
        if (!v || !v.trim() || P !== me) return;
        P.save.label = v.trim().slice(0, 60); writeSave(P.save);
        $('#save-label').textContent = P.save.label; $('#save-label-2').textContent = P.save.label;
        renderPanel();
      });
      break;
    }
    case 'export-story': {
      const { save, scen } = P;
      const txt = `${scen.title}\n${save.label}\n\n` + save.messages.map(m => m.role === 'user' ? (m.cont ? '' : `> ${m.text}`) : stripScenes(splitOutput(cur(m)).visible)).filter(Boolean).join('\n\n');
      download(`${scen.title.replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'hikaye'}.txt`, txt, 'text/plain;charset=utf-8');
      break;
    }
    case 'del-current':
      ask('Bu oyun kalıcı olarak silinecek.', { ok: 'Sil', danger: true }).then(yes => {
        if (!yes || !P) return;
        const id = P.save.id; leavePlay(); deleteSave(id); location.hash = '#/';
      });
      break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('.modal-back') && !$('dialog[open]')) closeModal();
  // Yazı alanı dışındayken 1-4 tuşları seçenekleri seçer
  if (P && !P.busy && /^[1-4]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest?.('input, textarea, select') && !$('.modal-back') && !$('dialog[open]')) {
    $$('#options .opt')[+e.key - 1]?.click();
  }
});
window.addEventListener('hashchange', route);
route();

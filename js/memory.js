// Hikaye hafızası ve cevap denetimi. DOM kullanmaz; bağlam planlama burada yapılır.
// Amaç: hikaye ne kadar uzarsa uzasın hiçbir olay sessizce kaybolmasın.
//   1. Son mesajlar birebir gönderilir (servisin kapasitesine göre bütçeli).
//   2. Bütçeyi aşanlar özete aktarılır; özet gecikirse kısaltılmış halleri gönderilir.
//   3. Hikaye defteri kalıcı gerçekleri tutar; en alakalı olanlar öncelikli gönderilir.
//   4. Özete girmiş eski sahnelerden, oyuncunun konusu açılanlar birebir geri getirilir.

export const approxTokens = s => Math.ceil(String(s || '').length / 3.2);

/* ---------- ham çıktıyı ayıklama ---------- */
export const stripThink = t => String(t || '')
  .replace(/<think(ing)?>[\s\S]*?<\/think(ing)?>\s*/gi, '')
  .replace(/<think(ing)?>[\s\S]*$/i, '');

export const cur = m => stripThink(m.alts[m.ai] || '');

export const TAG_CUT = /<\s*\/?\s*(durum|se[cç]enek|defter)|^[ \t]*[*#_ ]*(se[cç]enekler|hikaye defteri|defter)[*_ ]*:?[*_ ]*$/im;

/** Görselle ilgili gizli blokları (kart, dünya) kaldırır; <sahne> etiketlerine dokunmaz */
export const stripCards = t => String(t || '')
  .replace(/<(karakter|dunya|dünya)>[\s\S]*?<\/(karakter|dunya|dünya)>\s*/gi, '')
  .replace(/<(karakter|dunya|dünya)>[\s\S]*$/i, '');

export const stripScenes = t => stripCards(t)
  .replace(/<sahne\b[^>]*>[\s\S]*?<\/sahne>\s*/gi, '')
  .replace(/<sahne\b[\s\S]*$/i, '')
  .replace(/<\/?sahne\b[^>]*>/gi, '');

export function parseStats(txt) {
  const t = txt.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try { const j = JSON.parse(t); if (j && typeof j === 'object') return j; } catch {}
  const o = {};
  t.split('\n').forEach(l => {
    const m = l.match(/^\s*[-*"]?\s*([^:"]+)"?\s*:\s*(.+?),?\s*$/);
    if (m) o[m[1].trim()] = m[2].replace(/^"|"$/g, '');
  });
  return Object.keys(o).length ? o : null;
}

export function splitOutput(raw) {
  raw = stripThink(raw);
  let stats = null, options = [];
  const dm = raw.match(/<durum>([\s\S]*?)<\/durum>/i);
  if (dm) stats = parseStats(dm[1]);
  const om = raw.match(/<se[cç]enekler>([\s\S]*?)(<\/se[cç]enekler>|$)/i);
  if (om) options = om[1].split('\n').map(l => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim()).filter(l => l && !l.startsWith('<')).slice(0, 4);
  let visible = stripCards(raw);
  const cut = visible.search(TAG_CUT);
  if (cut >= 0) visible = visible.slice(0, cut);
  // Akış sırasında yarım kalmış etiketi gösterme: "<sah", "<sahne kim=\"Mi"
  visible = visible.replace(/<\/?[a-zçğıöşü]*(\s[^<>\n]*)?$/i, '');
  return { visible: visible.trim(), stats, options };
}

/* ---------- hikaye defteri ---------- */
const PLACEHOLDER = /^(\.{2,}|…+|metin|numara|yeni metin)$/i;

export function parseDefter(raw) {
  const m = String(raw || '').match(/<defter>([\s\S]*?)(<\/defter>|$)/i);
  if (!m) return [];
  const ops = [];
  m[1].split('\n').forEach(line => {
    const l = line.trim().replace(/^[-*•]\s+(?=[+!?~x])/i, '');
    let r;
    if ((r = l.match(/^([+!?])\s*(.{3,})$/))) {
      const text = r[2].replace(/^\[?\d+\]\s*/, '').trim().slice(0, 240);
      if (!PLACEHOLDER.test(text)) ops.push({ op: r[1], text });
    } else if ((r = l.match(/^x\s*\[?(\d+)\]?/i))) ops.push({ op: 'x', id: +r[1] });
    else if ((r = l.match(/^~\s*\[?(\d+)\]?\s*[|:]\s*(.{3,})$/))) ops.push({ op: '~', id: +r[1], text: r[2].trim().slice(0, 240) });
  });
  return ops;
}

export function ledgerOf(messages, upto) {
  const items = new Map();
  let next = 1;
  messages.slice(0, upto ?? messages.length).forEach((m, i) => {
    if (m.role !== 'model') return;
    parseDefter(cur(m)).forEach(o => {
      if (o.op === 'x') items.delete(o.id);
      else if (o.op === '~') { const it = items.get(o.id); if (it) it.text = o.text; }
      else items.set(next, { id: next++, type: o.op === '+' ? 'fact' : o.op === '!' ? 'sonuc' : 'soru', text: o.text, turn: i });
    });
  });
  return [...items.values()];
}

/** Defteri bütçeye sığdırır. Bekleyen sonuçlar ve açık meseleler önce gelir;
 *  gerçekler, oyuncunun konusunu açtıklarından ve en yenilerinden başlayarak seçilir. */
export function ledgerText(items, { maxTokens = 8000, query = '' } = {}) {
  if (!items.length) return '';
  const line = x => `[${x.id}] ${x.text}`;
  const pick = (list, room) => {
    const out = [];
    let used = 0;
    for (const x of list) {
      const c = approxTokens(line(x)) + 1;
      if (used + c > room) continue;
      out.push(x); used += c;
    }
    return { out, used };
  };
  const pending = pick(items.filter(x => x.type === 'sonuc').slice(-40), maxTokens * 0.35);
  const open = pick(items.filter(x => x.type === 'soru').slice(-30), maxTokens * 0.2);
  const wanted = new Set(terms(query));
  const facts = items.filter(x => x.type === 'fact')
    .map((x, i) => ({ x, hits: terms(x.text).filter(w => wanted.has(w)).length, i }))
    .sort((a, b) => (b.hits > 0) - (a.hits > 0) || b.hits - a.hits || b.i - a.i)
    .map(o => o.x);
  const chosen = pick(facts, maxTokens - pending.used - open.used);
  const asc = list => [...list].sort((a, b) => a.id - b.id).map(line).join('\n');
  const f = asc(chosen.out), s = asc(pending.out), q = asc(open.out);
  return [
    f && `Gerçekler:\n${f}`,
    s && `Bekleyen sonuçlar (zamanı gelince hikayede tetikle):\n${s}`,
    q && `Açık meseleler:\n${q}`,
  ].filter(Boolean).join('\n\n');
}

/* ---------- bütçe ---------- */
/** Servise göre tek istekte gönderilecek yaklaşık jeton sayısı.
 *  Ücretsiz katmanlar dakikalık jeton sınırı koyar; aşan istek reddedilir. */
export function contextBudget({ provider, model = '', ctx = 0, scale = 1 }) {
  let total, sumWords;
  if (provider === 'gemini') {
    if (/gemma/i.test(model)) { total = 10000; sumWords = 500; }
    else { total = 80000; sumWords = 1200; }
  } else if (provider === 'groq') { total = 6500; sumWords = 350; }
  else if (provider === 'openrouter') { total = 14000; sumWords = 600; }
  else if (provider === 'mistral') { total = 30000; sumWords = 900; }
  else if (provider === 'pollinations') { total = 8000; sumWords = 450; }
  else { total = 12000; sumWords = 600; }
  if (ctx > 0) total = Math.min(total, Math.floor(ctx * 0.7));
  total = Math.max(2500, Math.floor(total * scale));
  return { total, sumWords, compact: total < 16000 };
}

/* ---------- geçmişi sığdırma ---------- */
/** En yeni mesajlardan geriye doğru bütçeye sığanları tutar. Son iki mesaj her zaman kalır. */
export function fitHistory(entries, budgetTokens) {
  let used = 0, cut = entries.length;
  for (let i = entries.length - 1; i >= 0; i--) {
    const c = approxTokens(entries[i].text);
    if (entries.length - i > 2 && used + c > budgetTokens) break;
    used += c; cut = i;
  }
  return { kept: entries.slice(cut), overflow: entries.slice(0, cut) };
}

const firstBit = (text, chars) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= chars) return t;
  const cutAt = t.lastIndexOf(' ', chars);
  return t.slice(0, cutAt > 0 ? cutAt : chars) + '…';
};

/** Bütçeye sığmayan ve henüz özetlenmemiş mesajların kısaltılmış dökümü.
 *  Oyuncunun yazdıkları anlatıcıdan önce korunur: kararları hatırlanmalı. */
export function compactOverflow(entries, maxTokens) {
  if (!entries.length) return '';
  const lines = [];
  let used = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    const line = e.role === 'user' ? `Oyuncu: ${firstBit(e.text, 160)}` : `Anlatıcı: ${firstBit(e.text, 200)}`;
    const c = approxTokens(line) + 1;
    if (used + c > maxTokens) break;
    lines.unshift(line); used += c;
  }
  return lines.join('\n');
}

/** Özet gerekiyor mu? Gerekiyorsa hangi mesaja kadar özetleneceğini döndürür. */
export function summaryPlan({ messages, start, budgetTokens, maxChunk, textOf }) {
  const size = messages.map((m, i) => (i < start ? 0 : approxTokens(textOf(m))));
  const total = size.reduce((a, b) => a + b, 0);
  if (total <= budgetTokens * 0.7) return null;
  // Son mesajların %40'lık kısmı birebir kalsın
  let keep = 0, boundary = messages.length;
  for (let i = messages.length - 1; i > start; i--) {
    if (messages.length - i > 4 && keep + size[i] > budgetTokens * 0.4) break;
    keep += size[i]; boundary = i;
  }
  // Tek seferde özetlenecek miktar sınırlı; kalanı sonraki turlarda
  let chunk = 0, upto = start;
  for (let i = start; i < boundary; i++) {
    if (chunk + size[i] > maxChunk && upto > start) break;
    chunk += size[i]; upto = i + 1;
  }
  // Özet bir oyuncu mesajının başında bitsin ki hikaye tam bir tur olarak devam etsin
  while (upto > start && upto < messages.length && messages[upto].role === 'model') upto--;
  return upto > start ? { upto } : null;
}

/* ---------- geçmişten hatırlama ---------- */
const STOP = new Set('ve veya ama fakat ancak ile için gibi kadar daha çok bir iki bu şu o ne nasıl neden niye ben sen biz siz onlar onu ona ondan onun bana sana beni seni benim senin kendi kendini hem de da ki mi mı mu mü değil var yok olarak sonra önce şimdi burada orada artık bile yine her hiç tüm bütün diye ise eğer sanki evet hayır the and for with you'.split(' '));

export function terms(text) {
  const words = String(text || '').toLocaleLowerCase('tr').match(/[\p{L}\p{N}]{3,}/gu) || [];
  // Türkçe ekleri kabaca kırpar: kardeşimin / kardeşine -> kardeş
  return [...new Set(words.filter(w => !STOP.has(w)).map(w => w.slice(0, 6)))];
}

/** Metindeki büyük harfle başlayan sözcükler: kişi ve yer adları */
export function properNames(text) {
  const out = new Set();
  for (const m of String(text || '').matchAll(/(?<![.!?…"“]\s)(?<!^)(?<=\s)(\p{Lu}[\p{L}]{2,})/gu)) out.add(m[1]);
  return [...out];
}

/** Bağlama girmeyen eski mesajlardan, oyuncunun konusunu açtığı bölümleri birebir getirir */
export function recall({ messages, before, query, maxTokens = 450, maxItems = 4 }) {
  if (before <= 0) return [];
  const wanted = terms(query);
  if (!wanted.length) return [];
  const docs = [];
  for (let i = 0; i < before && i < messages.length; i++) {
    const m = messages[i];
    if (m.role === 'user') { if (m.text && !m.cont) docs.push({ i, who: 'Oyuncu', text: m.text }); continue; }
    stripScenes(splitOutput(cur(m)).visible).split(/\n{2,}/).forEach(p => {
      if (p.trim().length > 25) docs.push({ i, who: 'Anlatıcı', text: p.trim() });
    });
  }
  if (!docs.length) return [];
  const df = new Map();
  docs.forEach(d => { d.t = new Set(terms(d.text)); d.t.forEach(w => df.set(w, (df.get(w) || 0) + 1)); });
  const N = docs.length;
  docs.forEach(d => {
    d.score = 0;
    wanted.forEach(w => {
      const n = df.get(w) || 0;
      if (n && d.t.has(w) && (n <= Math.max(2, N * 0.34))) d.score += Math.log(1 + N / n);
    });
  });
  const hits = docs.filter(d => d.score >= 1.2).sort((a, b) => b.score - a.score || a.i - b.i);
  const out = [];
  let used = 0;
  for (const d of hits) {
    if (out.length >= maxItems) break;
    const text = firstBit(d.text, 700);
    const c = approxTokens(text);
    if (used + c > maxTokens) continue;
    out.push({ i: d.i, who: d.who, text }); used += c;
  }
  return out.sort((a, b) => a.i - b.i);
}

/* ---------- özet güvenliği ---------- */
/** Model bozuk ya da çok kısa bir özet döndürdüyse eskisini koru */
export function acceptableSummary(next, prev) {
  const words = s => (String(s || '').trim().match(/\S+/g) || []).length;
  const n = words(next);
  if (n < 15) return false;
  return !(words(prev) > 120 && n < words(prev) * 0.4);
}

/** Geri alınan olaylar özette kalmasın: kesilen noktadan önceki son özete döner */
export function rewindSummary(save, i) {
  if ((save.sumUpTo || 0) <= i) return;
  const snap = [...(save.sumLog || [])].reverse().find(s => s.upto <= i);
  save.summary = snap ? snap.summary : '';
  save.sumUpTo = snap ? snap.upto : 0;
  save.sumLog = (save.sumLog || []).filter(s => s.upto <= i);
}

/* ---------- cevap denetimi ---------- */
const TR_WORDS = new Set('ve bir bu için ile ama gibi sen ben diye kadar daha çok değil var yok o de da senin sana seni onun ona artık sonra önce içinde üzerinde olarak'.split(' '));
const EN_WORDS = new Set('the and you your of to in is it that with for on as at his her was are this from they have not'.split(' '));
const FOREIGN = /[Ѐ-ӿ぀-ヿ㐀-鿿가-힯]/g;

const sentencesOf = text => String(text || '').replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/)
  .map(s => s.trim().toLocaleLowerCase('tr')).filter(s => s.length >= 25);

/** Cevapta açık bir bozukluk varsa kısa bir kod döndürür */
export function qualityIssue(visible, { prevReply = '', ooc = false } = {}) {
  const text = stripScenes(visible).trim();
  const words = text.toLocaleLowerCase('tr').match(/[\p{L}']+/gu) || [];
  if (ooc) return null;
  if (words.length < 8) return 'kisa';
  if ((text.match(FOREIGN) || []).length >= 3) return 'dil';
  const tr = words.filter(w => TR_WORDS.has(w)).length;
  const en = words.filter(w => EN_WORDS.has(w)).length;
  if (words.length >= 25 && en > tr * 1.5 && en / words.length > 0.12) return 'dil';
  const seen = new Map();
  const list = sentencesOf(text);
  for (const s of list) {
    seen.set(s, (seen.get(s) || 0) + 1);
    if (seen.get(s) >= 3) return 'tekrar';
  }
  if (list.length >= 3 && prevReply) {
    const old = new Set(sentencesOf(stripScenes(prevReply)));
    if (list.filter(s => old.has(s)).length / list.length >= 0.5) return 'tekrar';
  }
  return null;
}

/** Model aynı şeyi döngü halinde yazıyor mu? (akış sırasında kontrol edilir) */
export function isLooping(raw) {
  if (raw.length < 900) return false;
  const tail = raw.slice(-80);
  if (tail.trim().length < 40) return false;
  let n = 0, at = -1;
  while ((at = raw.indexOf(tail, at + 1)) >= 0) { if (++n >= 4) return true; }
  return false;
}

/** Tekrarlanan cümleleri ilk geçtikleri yer dışında siler */
export function removeRepeats(text) {
  const seen = new Set();
  return String(text || '').split(/(?<=[.!?…])(\s+)/).filter(part => {
    const k = part.trim().toLocaleLowerCase('tr');
    if (k.length < 25) return true;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).join('').replace(/[ \t]+\n/g, '\n').trim();
}

/** Çıktı sınırına takılmış metni son tam cümlede bitirir */
export function trimToSentence(text) {
  const t = String(text || '').trimEnd();
  if (/[.!?…"”)*]$/.test(t)) return t;
  const m = [...t.matchAll(/[.!?…]["”)*]*(?=\s)/g)].pop();
  return m ? t.slice(0, m.index + m[0].length) : t;
}

// Yapay zeka servisleriyle konuşan katman. Anahtarlar yalnızca oyuncunun tarayıcısında saklanır.

export const PROVIDERS = {
  gemini: {
    label: 'Google Gemini',
    note: 'Önerilen. Ücretsiz, Türkçesi çok iyi, uzun hikayeleri iyi hatırlar.',
    keyUrl: 'https://aistudio.google.com/apikey',
    steps: ['Google hesabınla aistudio.google.com/apikey adresine gir.', '"Create API key" (API anahtarı oluştur) düğmesine bas.', 'Çıkan anahtarı kopyalayıp aşağıya yapıştır.'],
    base: 'https://generativelanguage.googleapis.com/v1beta',
  },
  groq: {
    label: 'Groq',
    note: 'Ücretsiz ve çok hızlı, cevap hemen gelir. Gemini yoğunsa en kolay çıkış yolu bu.',
    keyUrl: 'https://console.groq.com/keys',
    steps: ['console.groq.com adresinde ücretsiz hesap aç.', '"API Keys" bölümünden yeni anahtar oluştur.', 'Anahtarı aşağıya yapıştır.'],
    base: 'https://api.groq.com/openai/v1',
    fallbackModel: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    label: 'OpenRouter',
    note: 'Birçok ücretsiz modele tek anahtarla erişim. Sadece adı ":free" ile biten modeller bedavadır.',
    keyUrl: 'https://openrouter.ai/keys',
    steps: ['openrouter.ai adresinde hesap aç.', 'Keys sayfasından yeni anahtar oluştur.', 'Anahtarı yapıştır ve listeden ":free" ile biten bir model seç.'],
    base: 'https://openrouter.ai/api/v1',
  },
  custom: {
    label: 'Özel adres',
    note: 'OpenAI uyumlu herhangi bir servis (ör. bilgisayarında çalışan LM Studio).',
    steps: ['Servisin adresini gir (sonu /v1 ile biten).', 'Gerekiyorsa anahtarını yapıştır.', 'Model listesini getir.'],
    base: '',
  },
};

export class AIError extends Error {
  constructor(msg, kind = 'genel') { super(msg); this.kind = kind; }
}

function baseUrl(s) {
  if (s.provider === 'custom') return (s.customBase || '').replace(/\/+$/, '');
  return PROVIDERS[s.provider].base;
}
function thinkingFor(model) {
  const m = model.toLowerCase();
  if (/gemma/.test(m)) return null;
  if (/gemini-2\.5-flash-lite/.test(m)) return { thinkingBudget: 0 };
  if (/gemini-2\.5-flash/.test(m)) return { thinkingBudget: 300 };
  if (/gemini-2\.5-pro/.test(m)) return { thinkingBudget: 128 };
  if (/gemini-(3|4|5|flash-latest|flash-lite-latest|pro-latest)/.test(m)) return { thinkingLevel: 'low' };
  return null;
}
function key(s) { return (s.keys && s.keys[s.provider] || '').trim(); }

async function friendlyError(res, model) {
  let body = '';
  try { body = await res.text(); } catch {}
  let msg = body;
  try { const j = JSON.parse(body); msg = j.error?.message || j.message || body; } catch {}
  const low = String(msg).toLowerCase();
  if (res.status === 429) return new AIError('Ücretsiz kullanım limitine takıldın. Bir dakika bekleyip tekrar dene; günlük limit dolduysa ayarlardan başka bir model ya da servis seç.', 'limit');
  if (low.includes('api key not valid') || low.includes('api_key_invalid') || res.status === 401) return new AIError('API anahtarı geçersiz görünüyor. Ayarlar\'dan anahtarı kontrol et.', 'anahtar');
  if (res.status === 403) return new AIError('Servis bu anahtarla erişime izin vermedi. Anahtarın doğru servise ait olduğundan emin ol.', 'anahtar');
  if (res.status === 404) return new AIError(`"${model}" modeli bulunamadı. Ayarlar\'dan model listesini yenileyip başka bir model seç.`, 'model');
  if (res.status >= 500) return new AIError('Yapay zeka sunucusu şu an yoğun. Biraz sonra "Tekrar dene"ye bas.', 'sunucu');
  return new AIError(`Servis bir hata döndürdü (${res.status}): ${String(msg).slice(0, 220)}`, 'genel');
}

async function* readSSE(res, signal) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, '');
        buf = buf.slice(i + 1);
        if (line.startsWith('data:')) yield line.slice(5).trim();
      }
    }
    if (buf.startsWith('data:')) yield buf.slice(5).trim();
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

async function doFetch(url, opts) {
  try { return await fetch(url, opts); }
  catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new AIError('Yapay zeka servisine bağlanılamadı. İnternet bağlantını kontrol et. Özel adres kullanıyorsan servisin tarayıcıdan gelen isteklere (CORS) izin verdiğinden emin ol.', 'ag');
  }
}

/** Mesajları akış halinde üretir. history: [{role:'user'|'model', text}] */
export async function* streamChat({ settings, system, history, signal, temperature }) {
  const s = settings;
  const k = key(s);
  const model = s.models?.[s.provider];
  if (s.provider !== 'custom' && !k) throw new AIError('Oynamak için önce Ayarlar\'dan ücretsiz bir API anahtarı eklemelisin.', 'anahtar-yok');
  if (!model) throw new AIError('Ayarlar\'dan bir model seç.', 'model');
  const temp = temperature ?? s.temperature ?? 0.9;

  if (s.provider === 'gemini') {
    const isGemma = /gemma/i.test(model);
    let contents = history.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
    const body = {
      contents,
      generationConfig: { temperature: temp },
      safetySettings: ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
        .map(category => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
    };
    if (isGemma) {
      // Gemma modelleri sistem talimatını desteklemiyor; ilk mesaja ekliyoruz.
      contents[0].parts[0].text = `[TALİMATLAR]\n${system}\n[/TALİMATLAR]\n\n${contents[0].parts[0].text}`;
    } else {
      body.systemInstruction = { parts: [{ text: system }] };
    }
    // Düşünen modellerde düşünmeyi kısıyoruz; yoksa ilk kelime çok geç gelebiliyor.
    const thinking = thinkingFor(model);
    if (thinking) body.generationConfig.thinkingConfig = thinking;
    const url = `${baseUrl(s)}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(k)}`;
    let res = await doFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    if (!res.ok && res.status === 400 && thinking) {
      // Model bu ayarı desteklemiyorsa ayarsız tekrar dene
      delete body.generationConfig.thinkingConfig;
      res = await doFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    }
    if (!res.ok) throw await friendlyError(res, model);
    let got = false, finish = '';
    for await (const data of readSSE(res, signal)) {
      if (!data) continue;
      let j; try { j = JSON.parse(data); } catch { continue; }
      if (j.promptFeedback?.blockReason) throw new AIError('Google\'ın güvenlik filtresi bu isteği engelledi. Son mesajını farklı bir şekilde yazmayı dene.', 'filtre');
      const c = j.candidates?.[0];
      if (c?.finishReason) finish = c.finishReason;
      for (const p of c?.content?.parts || []) {
        if (p.thought) continue;
        if (p.text) { got = true; yield p.text; }
      }
    }
    if (!got && (finish === 'SAFETY' || finish === 'PROHIBITED_CONTENT' || finish === 'BLOCKLIST'))
      throw new AIError('Google\'ın güvenlik filtresi bu cevabı kesti. "Tekrar dene"ye bas ya da son mesajını değiştir.', 'filtre');
    if (!got && !signal?.aborted) throw new AIError('Yapay zeka boş bir cevap döndürdü. Tekrar dene.', 'bos');
    return;
  }

  // OpenAI uyumlu servisler (Groq, OpenRouter, özel)
  // Groq'un ücretsiz katmanı dakikada az jeton kabul ediyor: ilk mesaj + son mesajları gönder, gerisi özette.
  if (s.provider === 'groq' && history.length > 16) history = [history[0], ...history.slice(-14).filter((m, i) => !(i === 0 && m.role === 'user' && history[0].role === 'user'))];
  const messages = [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))];
  const headers = { 'Content-Type': 'application/json' };
  if (k) headers['Authorization'] = 'Bearer ' + k;
  if (s.provider === 'openrouter') { headers['X-Title'] = 'Diyar'; }
  const res = await doFetch(`${baseUrl(s)}/chat/completions`, {
    method: 'POST', headers, signal,
    body: JSON.stringify({ model, messages, temperature: temp, stream: true }),
  });
  if (!res.ok) throw await friendlyError(res, model);
  let got = false;
  for await (const data of readSSE(res, signal)) {
    if (!data || data === '[DONE]') continue;
    let j; try { j = JSON.parse(data); } catch { continue; }
    if (j.error) throw new AIError('Servis hatası: ' + (j.error.message || 'bilinmeyen hata'), 'genel');
    const t = j.choices?.[0]?.delta?.content;
    if (t) { got = true; yield t; }
  }
  if (!got && !signal?.aborted) throw new AIError('Yapay zeka boş bir cevap döndürdü. Tekrar dene.', 'bos');
}

export async function complete(opts) {
  let out = '';
  for await (const t of streamChat(opts)) out += t;
  return out;
}

/** Kullanılabilir modelleri listeler: [{id, label}] */
export async function listModels(s) {
  const k = key(s);
  if (s.provider === 'gemini') {
    if (!k) throw new AIError('Önce API anahtarını gir.', 'anahtar-yok');
    const res = await doFetch(`${baseUrl(s)}/models?pageSize=1000&key=${encodeURIComponent(k)}`, {});
    if (!res.ok) throw await friendlyError(res, '');
    const j = await res.json();
    const bad = /(embedding|embed|aqa|imagen|image|tts|audio|live|veo|robotics|computer-use|vision|learnlm|native)/i;
    return (j.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }))
      .filter(m => !bad.test(m.id))
      .sort((a, b) => b.id.localeCompare(a.id, 'en', { numeric: true }));
  }
  const headers = {};
  if (k) headers['Authorization'] = 'Bearer ' + k;
  const res = await doFetch(`${baseUrl(s)}/models`, { headers });
  if (!res.ok) throw await friendlyError(res, '');
  const j = await res.json();
  let list = (j.data || []).map(m => ({ id: m.id, label: m.name || m.id, free: m.pricing ? (+m.pricing.prompt === 0 && +m.pricing.completion === 0) : undefined }));
  if (s.provider === 'openrouter') list = list.filter(m => m.id.endsWith(':free') || m.free);
  if (s.provider === 'groq') list = list.filter(m => !/(whisper|tts|guard|embed|playai)/i.test(m.id));
  return list.sort((a, b) => a.id.localeCompare(b.id));
}

/** Denenecek modelleri en uygundan en az uygun olana sıralar */
export function rankModels(provider, list) {
  const ids = list.map(m => m.id);
  const num = (a, b) => b.localeCompare(a, 'en', { numeric: true });
  if (provider === 'gemini') {
    const tier = id => {
      if (/^gemini-[\d.]+-flash$/.test(id)) return 0;
      if (/gemini.*flash/.test(id) && !/lite|preview|exp|thinking/.test(id)) return 1;
      if (/flash-lite/.test(id)) return 2;
      if (/flash/.test(id)) return 3;
      if (/gemini/.test(id) && !/pro/.test(id)) return 4;
      if (/gemma/.test(id)) return 5;
      return 6;
    };
    return [...ids].sort((a, b) => tier(a) - tier(b) || num(a, b));
  }
  const first = pickDefaultModel(provider, list);
  return [first, ...ids.filter(id => id !== first)].filter(Boolean);
}

/** Listeden makul bir varsayılan model seçer */
export function pickDefaultModel(provider, list) {
  const ids = list.map(m => m.id);
  if (provider === 'gemini') {
    const flash = ids.filter(id => /^gemini-[\d.]+-flash$/.test(id));
    if (flash.length) return flash.sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))[0];
    if (ids.includes('gemini-flash-latest')) return 'gemini-flash-latest';
    const anyFlash = ids.filter(id => /flash/.test(id) && !/lite|preview|exp/.test(id));
    if (anyFlash.length) return anyFlash.sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))[0];
    return ids.find(id => /gemini/.test(id)) || ids[0] || '';
  }
  if (provider === 'groq') {
    return ids.find(id => id === PROVIDERS.groq.fallbackModel) || ids.find(id => /llama.*70b/i.test(id)) || ids.find(id => /llama/i.test(id)) || ids[0] || '';
  }
  if (provider === 'openrouter') {
    const pref = [/deepseek.*(chat|v3)/i, /llama.*70b/i, /gemini/i, /qwen/i, /mistral/i];
    for (const p of pref) { const hit = ids.find(id => p.test(id)); if (hit) return hit; }
    return ids[0] || '';
  }
  return ids[0] || '';
}

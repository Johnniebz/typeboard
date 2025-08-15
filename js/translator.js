import { TRANSLATE_PROVIDERS } from './config.js';

/**
 * Translator with automatic fallback:
 * 1) Tries each LibreTranslate provider (POST /translate)
 * 2) Falls back to MyMemory (GET /get?q=...&langpair=auto|<target>)
 * No keys needed for defaults.
 */
export function initTranslator({ board, langTo, button }) {
  if (!board || !langTo || !button) return;

  function chunkParagraphs(text, maxChars = 2000) {
    const paras = text.split(/\n{2,}/);
    const chunks = [];
    let buf = '';
    for (const p of paras) {
      const plus = (buf ? buf + '\n\n' : '') + p;
      if (plus.length > maxChars) {
        if (buf) chunks.push(buf);
        if (p.length > maxChars) {
          for (let i = 0; i < p.length; i += maxChars) chunks.push(p.slice(i, i + maxChars));
          buf = '';
        } else {
          buf = p;
        }
      } else {
        buf = plus;
      }
    }
    if (buf) chunks.push(buf);
    return chunks.length ? chunks : [''];
  }

  async function libretranslateChunk(q, target, endpoint, apiKey) {
    const body = { q, source: 'auto', target, format: 'text' };
    if (apiKey) body.api_key = apiKey;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`LT ${res.status} ${await safeText(res)}`);
    const data = await res.json();
    return data?.translatedText ?? '';
  }

  async function mymemoryChunk(q, target) {
    // MyMemory supports auto-detect with langpair=auto|xx
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', q);
    // We'll guess source language as the opposite of target if text contains ASCII
// (very basic detection — good enough for fallback)
function guessSourceLang(text, target) {
  const asciiRatio = text.replace(/[^\x00-\x7F]/g, '').length / text.length;
  if (asciiRatio > 0.8) return target === 'en' ? 'es' : 'en'; // default to English/Spanish guess
  return target === 'en' ? 'es' : 'en';
}

const src = guessSourceLang(q, target);
url.searchParams.set('langpair', `${src}|${target}`);

    // Optional: add &de=email for higher limits if you want.
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`MM ${res.status} ${await safeText(res)}`);
    const data = await res.json();
    // Usually in data.responseData.translatedText
    return data?.responseData?.translatedText ?? '';
  }

  async function safeText(res) { try { return await res.text(); } catch { return ''; } }

  async function translateWithProvider(provider, text, target) {
    const parts = chunkParagraphs(text);
    const out = [];

    if (provider.name === 'libretranslate') {
      for (const part of parts) {
        if (!part.trim()) { out.push(part); continue; }
        out.push(await libretranslateChunk(part, target, provider.url, provider.apiKey || ''));
      }
      return out.join('\n\n');
    }

    if (provider.name === 'mymemory') {
      for (const part of parts) {
        if (!part.trim()) { out.push(part); continue; }
        out.push(await mymemoryChunk(part, target));
      }
      return out.join('\n\n');
    }

    throw new Error(`Unknown provider: ${provider.name}`);
  }

  async function handleTranslate() {
    const original = board.value || '';
    const target = (langTo.value || 'en').trim();
    if (!original.trim()) return;

    const prev = button.textContent;
    button.disabled = true;
    button.textContent = 'Translating…';

    let lastErr = null;

    try {
      for (const p of TRANSLATE_PROVIDERS) {
        try {
          const translated = await translateWithProvider(p, original, target);
          board.value = translated;
          board.selectionStart = board.selectionEnd = board.value.length;
          board.focus();
          lastErr = null;
          break; // success
        } catch (e) {
          lastErr = e;
          // try next provider
        }
      }

      if (lastErr) throw lastErr;
    } catch (err) {
      console.error(err);
      alert(
        'Translation failed.\n\n' +
        (err?.message || 'Unknown error') +
        '\n\nTips:\n• The app now tries multiple free providers automatically.\n' +
        '• If it keeps failing, try again in a minute (free services rate-limit), or tell me to wire up a free proxy.'
      );
    } finally {
      button.disabled = false;
      button.textContent = prev;
    }
  }

  button.addEventListener('click', handleTranslate);

  // Optional keyboard shortcut: Cmd/Ctrl + Shift + T
  document.addEventListener('keydown', (e) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.shiftKey && (e.key === 'T' || e.key === 't')) {
      e.preventDefault();
      handleTranslate();
    }
  });
}

// Lightweight translator using the public LibreTranslate demo.
// If it fails (rate limit/CORS), we show a friendly message and keep the text.
const ENDPOINTS = [
  'https://libretranslate.de/translate',
  'https://translate.astian.org/translate'
];

export function initTranslator({ button, select, getText, setText }){
  button.addEventListener('click', async () => {
    const q = (getText() || '').trim();
    if (!q){ alert('Nothing to translate.'); return; }
    const target = select.value || 'en';
    button.disabled = true; const oldLabel = button.textContent; button.textContent = '…';

    try{
      const translated = await translate(q, target);
      if (translated) setText(translated);
      else alert('Translation unavailable right now. Try again later.');
    }catch(e){
      console.warn(e);
      alert('Translation failed. Your internet or the translation service might be blocking requests.');
    }finally{
      button.disabled = false; button.textContent = oldLabel;
    }
  });
}

async function translate(q, target){
  const req = {
    q, source: 'auto', target, format: 'text'
  };
  for (const url of ENDPOINTS){
    try{
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (data?.translatedText) return data.translatedText;
    }catch(e){
      // try next endpoint
    }
  }
  return null;
}

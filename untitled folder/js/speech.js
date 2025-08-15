/**
/**
 * Text-to-speech that follows the selected translation language.
 * Fixes common issues where the browser uses an English voice even when "es" is selected:
 * - Waits for voices to actually load (voiceschanged) before speaking.
 * - Prefers voices whose lang starts with the code (e.g. "es-") OR whose name contains "Spanish".
 * - Prefers local voices when possible.
 * - Forces a sensible BCP-47 tag fallback (es-ES / es-MX) if no voice was found.

export function initSpeech({ board, langTo, button }) {
  if (!board || !langTo || !button) return;

  const synth = window.speechSynthesis;
  if (!synth) {
    button.disabled = true;
    button.title = 'Speech not supported in this browser';
    return;
  }

  // ---- Helpers --------------------------------------------------------------

  // Map 2-letter codes to preferred tags (order matters)
  const PREFERRED_TAGS = {
    en: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN'],
    es: ['es-ES', 'es-MX', 'es-419'],
    fr: ['fr-FR', 'fr-CA'],
    de: ['de-DE'],
    it: ['it-IT'],
    pt: ['pt-BR', 'pt-PT'],
    nl: ['nl-NL'],
    pl: ['pl-PL'],
    sv: ['sv-SE'],
    da: ['da-DK'],
    fi: ['fi-FI'],
    cs: ['cs-CZ'],
    ro: ['ro-RO'],
    ru: ['ru-RU'],
    uk: ['uk-UA'],
    tr: ['tr-TR'],
    ar: ['ar-SA', 'ar-EG', 'ar-AE'],
    he: ['he-IL'],
    hi: ['hi-IN'],
    vi: ['vi-VN'],
    zh: ['zh-CN', 'zh-HK', 'zh-TW'],
    ja: ['ja-JP'],
    ko: ['ko-KR'],
  };

  // Wait for voices list to be populated (some browsers are async)
  function waitForVoices(timeoutMs = 2000) {
    return new Promise(resolve => {
      const have = synth.getVoices();
      if (have && have.length) return resolve(have);
      let done = false;
      const onChange = () => {
        if (done) return;
        const v = synth.getVoices();
        if (v && v.length) {
          done = true;
          synth.onvoiceschanged = null;
          resolve(v);
        }
      };
      synth.onvoiceschanged = onChange;
      // Fallback timeout just in case voiceschanged never fires
      setTimeout(() => {
        if (done) return;
        done = true;
        synth.onvoiceschanged = null;
        resolve(synth.getVoices() || []);
      }, timeoutMs);
    });
  }

  function normalize(str) {
    return (str || '').toLowerCase();
  }

  function pickVoiceFor(langCode, voices) {
    const lc = (langCode || 'en').toLowerCase();
    const preferred = PREFERRED_TAGS[lc] || [];
    const isSpanishWanted = lc === 'es';

    // 1) Exact preferred tag match (in order), prefer localService if available
    for (const tag of preferred) {
      const exactLocal = voices.find(v => normalize(v.lang) === normalize(tag) && v.localService);
      if (exactLocal) return exactLocal;
      const exactAny = voices.find(v => normalize(v.lang) === normalize(tag));
      if (exactAny) return exactAny;
    }

    // 2) Lang starts with base (e.g., "es-" or "en-"), prefer local
    const baseLocal = voices.find(v => normalize(v.lang).startsWith(lc + '-') && v.localService);
    if (baseLocal) return baseLocal;
    const baseAny = voices.find(v => normalize(v.lang).startsWith(lc + '-'));
    if (baseAny) return baseAny;

    // 3) Name contains the language (helps when lang tags are weird)
    const nameLocal = voices.find(v => /spanish/i.test(v.name) && v.localService);
    const nameAny   = voices.find(v => /spanish/i.test(v.name));
    if (isSpanishWanted && (nameLocal || nameAny)) return (nameLocal || nameAny);

    // 4) Bare "es" or "en" (rare)
    const bare = voices.find(v => normalize(v.lang) === lc);
    if (bare) return bare;

    // 5) Last resort: any voice (will sound wrong if only English is installed)
    return voices[0] || null;
  }

  function tagFallback(langCode) {
    const list = PREFERRED_TAGS[langCode];
    return (list && list[0]) || 'en-US';
  }

  // ---- Speak flow -----------------------------------------------------------

  let speaking = false;

  async function speakNow() {
    const text = (board.value || '').trim();
    if (!text) return;

    const langCode = (langTo.value || 'en').trim();

    // Ensure we have the voices list populated
    const voices = await waitForVoices();

    // Cancel anything pending/playing
    synth.cancel();

    const voice = pickVoiceFor(langCode, voices);
    const utt = new SpeechSynthesisUtterance(text);

    if (voice) {
      utt.voice = voice;
      utt.lang  = voice.lang; // trust the selected voice's tag
    } else {
      // If no voice found, still hint the language so the default engine tries
      utt.lang = tagFallback(langCode);
    }

    // Reasonable defaults
    utt.rate = 1.0;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    utt.onstart = () => {
      speaking = true;
      button.textContent = '⏹';
      button.setAttribute('aria-pressed', 'true');
    };
    utt.onend = utt.onerror = () => {
      speaking = false;
      button.textContent = '🔊';
      button.setAttribute('aria-pressed', 'false');
    };

    synth.speak(utt);
  }

  function stopSpeaking() {
    if (!speaking) return;
    synth.cancel();
    speaking = false;
    button.textContent = '🔊';
    button.setAttribute('aria-pressed', 'false');
  }

  // ---- Wire up --------------------------------------------------------------

  button.addEventListener('click', () => {
    if (speaking) stopSpeaking();
    else speakNow();
  });

  // If the user changes the selected language, stop current speech
  langTo.addEventListener('change', stopSpeaking);

  // ESC to stop
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') stopSpeaking();
  });
}
 */
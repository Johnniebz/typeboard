// Ordered list of providers to try.
// It will try LibreTranslate first (POST /translate), then MyMemory (GET /get).
export const TRANSLATE_PROVIDERS = [
  { name: 'libretranslate', url: 'https://libretranslate.de/translate', apiKey: '' },
  // You can add more LibreTranslate mirrors here, top to bottom, e.g.:
  // { name: 'libretranslate', url: 'https://translate.argosopentech.com/translate', apiKey: '' },

  // Fallback: MyMemory public API (no key, rate-limited but usually works)
  { name: 'mymemory' } 
];

// If you later deploy your own LibreTranslate with a key, put it here:
// { name: 'libretranslate', url: 'https://your-server/translate', apiKey: 'YOUR_KEY' }

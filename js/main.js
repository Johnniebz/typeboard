import { initPhrases } from './phrases.js';
import { initNotes } from './notes.js';
import { initDrawing } from './drawing.js';
import { initChime } from './chime.js';
import { initTranslator } from './translator.js';

/* ===== Grab elements once ===== */
const els = {
  board:        document.getElementById('board'),
  clearBtn:     document.getElementById('clear'),
  bigger:       document.getElementById('bigger'),
  smaller:      document.getElementById('smaller'),
  sectionsBar:  document.getElementById('sectionsBar'),
  phrasesWrap:  document.getElementById('phrasesWrap'),
  phrasesBar:   document.getElementById('phrasesBar'),
  editBtn:      document.getElementById('editPhrases'),
  phrasesDlg:   document.getElementById('phrasesDlg'),
  sectionsList: document.getElementById('sectionsList'),
  addSection:   document.getElementById('addSection'),
  phrasesCancel:document.getElementById('phrasesCancel'),
  phrasesSave:  document.getElementById('phrasesSave'),

  notesDlg:     document.getElementById('notesDlg'),
  notesList:    document.getElementById('notesList'),
  addNote:      document.getElementById('addNote'),
  notesCancel:  document.getElementById('notesCancel'),
  notesSave:    document.getElementById('notesSave'),
  notesPicker:  document.getElementById('notesPicker'),
  manageNotes:  document.getElementById('manageNotes'),

  drawings:     document.getElementById('drawings'),
  pad:          document.getElementById('pad'),
  toggleDraw:   document.getElementById('toggleDraw'),
  chimeBtn:     document.getElementById('chime'),

  // NEW: translator
  langTo:       document.getElementById('langTo'),
  translateBtn: document.getElementById('translateBtn'),
};

/* ===== Init feature modules ===== */
const phrases = initPhrases({
  sectionsBar: els.sectionsBar,
  phrasesWrap: els.phrasesWrap,
  phrasesBar:  els.phrasesBar,
  editBtn:     els.editBtn,
  dlg:         els.phrasesDlg,
  list:        els.sectionsList,
  addBtn:      els.addSection,
  cancelBtn:   els.phrasesCancel,
  saveBtn:     els.phrasesSave,
  board:       els.board,
});

const notes = initNotes({
  dlg:        els.notesDlg,
  list:       els.notesList,
  addBtn:     els.addNote,
  cancelBtn:  els.notesCancel,
  saveBtn:    els.notesSave,
  picker:     els.notesPicker,
  manageBtn:  els.manageNotes,
  board:      els.board,
});

const drawing = initDrawing({
  pad:        els.pad,
  drawings:   els.drawings,
  toggleBtn:  els.toggleDraw,
  board:      els.board,
});

initChime(els.chimeBtn);

// NEW: Translator init
initTranslator({
  board: els.board,
  langTo: els.langTo,
  button: els.translateBtn,
});

/* ===== App shell: load / clear / fonts / shortcuts ===== */
function getSize() {
  const s = window.getComputedStyle(els.board).fontSize;
  return parseFloat(s || '28');
}

function sizeUp()  { els.board.style.fontSize = Math.min(getSize() + 4, 72) + 'px'; els.board.focus(); }
function sizeDown(){ els.board.style.fontSize = Math.max(getSize() - 4, 14) + 'px'; els.board.focus(); }

function clearAll() {
  els.board.value = '';
  els.drawings.innerHTML = '';
  drawing.clearCanvas();
  els.board.focus();
}

els.bigger.addEventListener('click', sizeUp);
els.smaller.addEventListener('click', sizeDown);
els.clearBtn.addEventListener('click', clearAll);

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && (e.key === 'Backspace' || e.key === 'Delete')) {
    e.preventDefault();
    clearAll();
  }
});

/* ===== Initial render ===== */
window.addEventListener('load', () => {
  phrases.render();
  notes.renderPicker();
  els.board.focus();
  drawing.resize();
});

/** 

function detectLang(text) {
  // Very simple detection — matches what we used for translation fallback
  if (/[ぁ-ゟ゠-ヿ一-龯]/.test(text)) return 'ja';
  if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(text)) return 'ko';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[А-Яа-яЁё]/.test(text)) return 'ru';
  if (/[Α-Ωα-ω]/.test(text)) return 'el';
  if (/[א-ת]/.test(text)) return 'he';
  if (/[ء-ي]/.test(text)) return 'ar';
  // Default guess: English if mostly ASCII, else Spanish
  const asciiRatio = text.replace(/[^\x00-\x7F]/g, '').length / text.length;
  return asciiRatio > 0.8 ? 'en' : 'es';
}

document.getElementById('speakBtn').addEventListener('click', () => {
  const text = document.getElementById('board').value.trim();
  if (!text) return;

  const langCode = detectLang(text);
  const synth = window.speechSynthesis;

  // Cancel any current speech
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode;

  // Try to match a voice for the detected lang
  const voices = synth.getVoices();
  const match = voices.find(v => v.lang.toLowerCase().startsWith(langCode));
  if (match) utter.voice = match;

  synth.speak(utter);
});

// Safari sometimes needs voices loaded first
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {};
}
   */

window.addEventListener('resize', drawing.resize);

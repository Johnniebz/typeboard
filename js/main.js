import { initPhrases } from './phrases.js';
import { initNotes } from './notes.js';
import { initDrawing } from './drawing.js';
import { initChime } from './chime.js';
import { initTranslator } from './translator.js';

const els = {
  board:        document.getElementById('board'),
  clearBtn:     document.getElementById('clear'),
  bigger:       document.getElementById('bigger'),
  smaller:      document.getElementById('smaller'),
  toggleDraw:   document.getElementById('toggleDraw'),
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
  saveNote:     document.getElementById('saveNote'),

  chime:        document.getElementById('chime'),
  translateBtn: document.getElementById('translateBtn'),
  langTo:       document.getElementById('langTo'),

  pad:          document.getElementById('pad'),
  drawings:     document.getElementById('drawings'),
};

const storageKeys = {
  fontSize: 'tb:fontSize',
  text:     'tb:text',
};

// ===== Text area persistence =====
els.board.value = localStorage.getItem(storageKeys.text) || '';
els.board.addEventListener('input', () => {
  localStorage.setItem(storageKeys.text, els.board.value);
});

// ===== Font size controls =====
const defaultFont = 18;
const savedFont = parseInt(localStorage.getItem(storageKeys.fontSize) || defaultFont, 10);
setFontSize(savedFont);

els.bigger.addEventListener('click', () => bumpFont(2));
els.smaller.addEventListener('click', () => bumpFont(-2));

function bumpFont(delta){
  const now = Math.max(12, Math.min(48, (parseInt(getComputedStyle(els.board).fontSize, 10) || defaultFont) + delta));
  setFontSize(now);
}

function setFontSize(px){
  els.board.style.fontSize = px + 'px';
  localStorage.setItem(storageKeys.fontSize, String(px));
}

// ===== Clear button =====
els.clearBtn.addEventListener('click', () => {
  if (els.board.value.trim() && !confirm('Clear all text?')) return;
  els.board.value = '';
  localStorage.removeItem(storageKeys.text);
});

// ===== Init modules =====
const phrasesAPI = initPhrases({ els });
phrasesAPI.render(); // initial render

const notesAPI = initNotes({ els, onLoadToBoard: (text) => {
  els.board.value = text;
  els.board.dispatchEvent(new Event('input'));
}});

const drawingAPI = initDrawing({ els });

initChime({ button: els.chime });

initTranslator({
  button: els.translateBtn,
  select: els.langTo,
  getText: () => els.board.value,
  setText: (txt) => { els.board.value = txt; els.board.dispatchEvent(new Event('input')); }
});

// ===== Draw toggle =====
els.toggleDraw.addEventListener('click', () => {
  const on = drawingAPI.toggle();
  els.toggleDraw.setAttribute('aria-pressed', String(on));
  els.toggleDraw.textContent = on ? 'Draw: On' : 'Draw: Off';
});

// Resize canvas to area on load + resize
function fitCanvas(){
  const rect = els.drawings.getBoundingClientRect();
  els.pad.width = Math.floor(rect.width);
  els.pad.height = Math.floor(rect.height);
  drawingAPI.syncSize();
}
window.addEventListener('resize', fitCanvas, { passive: true });
window.addEventListener('orientationchange', fitCanvas, { passive: true });
fitCanvas();

// Expose tiny helpers for debugging from console
window.Typeboard = { phrasesAPI, notesAPI, drawingAPI };

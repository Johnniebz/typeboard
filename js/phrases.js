const KEY = 'tb:sections:v1';

const defaultData = [
  {
    title: 'Greetings',
    phrases: ['Hi there!', 'How are you?', 'Thanks so much!', 'Talk soon!']
  },
  {
    title: 'Follow-ups',
    phrases: ['Any update?', 'Pinging this thread', 'Circling back on this', 'Let me know what you think']
  }
];

export function initPhrases({ els }){
  let data = load();

  // Open editor
  els.editBtn.addEventListener('click', () => openEditor());
  els.phrasesCancel.addEventListener('click', () => els.phrasesDlg.close());
  els.addSection.addEventListener('click', () => addSectionCard());
  els.phrasesSave.addEventListener('click', saveEditor);

  function render(){
    // Sections (tabs)
    els.sectionsBar.querySelectorAll('.section-btn').forEach(b => b.remove());
    data.forEach((sec, i) => {
      const b = document.createElement('button');
      b.className = 'section-btn';
      b.textContent = sec.title || `Section ${i+1}`;
      b.addEventListener('click', () => showSection(i, b));
      els.sectionsBar.insertBefore(b, els.editBtn);
    });
    // Activate first section by default
    if (data.length) showSection(0, els.sectionsBar.querySelector('.section-btn'));
  }

  function showSection(idx, btn){
    els.sectionsBar.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const sec = data[idx];
    els.phrasesBar.innerHTML = '';
    sec.phrases.forEach(ph => {
      const pb = document.createElement('button');
      pb.className = 'phrase-btn';
      pb.textContent = ph;
      pb.addEventListener('click', () => insertPhrase(ph));
      els.phrasesBar.appendChild(pb);
    });
  }

  function insertPhrase(text){
    const ta = els.board;
    const start = ta.selectionStart ?? ta.value.length;
    const end   = ta.selectionEnd ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after  = ta.value.slice(end);
    const insert = (before && !/\s$/.test(before)) ? ' ' + text : text; // add space if needed
    ta.value = before + insert + after;
    ta.focus();
    const pos = (before + insert).length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.dispatchEvent(new Event('input'));
  }

  // ===== Editor =====
  function openEditor(){
    els.sectionsList.innerHTML = '';
    data.forEach((sec, i) => addSectionCard(sec.title, sec.phrases.join('\n')));
    els.phrasesDlg.showModal();
    makeSortable(els.sectionsList);
  }

  function addSectionCard(title = '', phrases = ''){
    const card = document.createElement('div');
    card.className = 'section-card';
    card.draggable = true;

    const handle = document.createElement('div');
    handle.className = 'handle';
    handle.textContent = '☰';
    handle.title = 'Drag to reorder';

    const titleInput = document.createElement('input');
    titleInput.className = 'section-title';
    titleInput.placeholder = 'Section title';
    titleInput.value = title;

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const del = document.createElement('button');
    del.className = 'btn del';
    del.type = 'button';
    del.textContent = 'Delete';
    del.addEventListener('click', () => card.remove());
    actions.appendChild(del);

    const phrasesInput = document.createElement('textarea');
    phrasesInput.className = 'section-phrases';
    phrasesInput.placeholder = 'Phrases (comma or new line separated)';
    phrasesInput.value = phrases;

    card.append(handle, titleInput, actions, phrasesInput);
    els.sectionsList.appendChild(card);
  }

  function saveEditor(){
    const out = [];
    els.sectionsList.querySelectorAll('.section-card').forEach(card => {
      const title = card.querySelector('.section-title').value.trim() || 'Untitled';
      const raw = card.querySelector('.section-phrases').value;
      const items = splitPhrases(raw);
      if (items.length) out.push({ title, phrases: items });
    });
    if (!out.length){
      alert('Please add at least one section with phrases.');
      return;
    }
    data = out;
    save(data);
    els.phrasesDlg.close();
    render();
  }

  function splitPhrases(str){
    return str
      .split(/\r?\n|,/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Basic sortable by dragging the "handle"
  function makeSortable(container){
    let dragEl = null;
    container.addEventListener('dragstart', e => {
      const t = e.target.closest('.section-card');
      if (!t) return e.preventDefault();
      dragEl = t;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getDragAfterElement(container, e.clientY);
      if (after == null){
        container.appendChild(dragEl);
      } else {
        container.insertBefore(dragEl, after);
      }
    });
    container.addEventListener('dragend', () => { dragEl = null; });
  }
  function getDragAfterElement(container, y){
    const cards = [...container.querySelectorAll('.section-card:not(.dragging)')];
    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultData;
      return parsed;
    }catch(e){
      console.warn('Failed loading sections, using defaults', e);
      return defaultData;
    }
  }

  function save(d){
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  return { render, load: () => data, save: (d) => { data = d; save(d); render(); } };
}

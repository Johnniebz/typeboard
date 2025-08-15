const KEY = 'tb:notes:v1';

export function initNotes({ els, onLoadToBoard }){
  let notes = load();

  renderPicker();

  els.saveNote.addEventListener('click', () => {
    const content = (document.getElementById('board').value || '').trim();
    if (!content){ alert('Nothing to save.'); return; }
    const title = prompt('Note title?', (content.slice(0, 40) || 'Untitled').replace(/\n/g,' '));
    if (!title) return;
    const id = cryptoRandom();
    notes.push({ id, title: title.slice(0, 40), content });
    save(); renderPicker();
  });

  els.notesPicker.addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id) return;
    const n = notes.find(n => n.id === id);
    if (n && onLoadToBoard) onLoadToBoard(n.content);
    els.notesPicker.value = ''; // reset
  });

  els.manageNotes.addEventListener('click', () => openManager());
  els.notesCancel.addEventListener('click', () => els.notesDlg.close());
  els.addNote.addEventListener('click', () => addNoteCard());
  els.notesSave.addEventListener('click', saveManager);

  function renderPicker(){
    els.notesPicker.innerHTML = '<option value="">Saved ▾</option>';
    notes.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = n.title;
      els.notesPicker.appendChild(opt);
    });
  }

  function openManager(){
    els.notesList.innerHTML = '';
    notes.forEach(n => addNoteCard(n.title, n.content, n.id));
    els.notesDlg.showModal();
    makeSortable(els.notesList);
  }

  function addNoteCard(title = '', content = '', id = cryptoRandom()){
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.id = id;
    card.draggable = true;

    const handle = document.createElement('div');
    handle.className = 'handle';
    handle.textContent = '☰';

    const titleInput = document.createElement('input');
    titleInput.className = 'note-title';
    titleInput.placeholder = 'Title';
    titleInput.value = title;

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const del = document.createElement('button');
    del.className = 'btn del';
    del.textContent = 'Delete';
    del.addEventListener('click', () => card.remove());
    actions.appendChild(del);

    const body = document.createElement('textarea');
    body.className = 'section-phrases';
    body.placeholder = 'Note text…';
    body.value = content;

    card.append(handle, titleInput, actions, body);
    els.notesList.appendChild(card);
  }

  function saveManager(){
    const out = [];
    els.notesList.querySelectorAll('.note-card').forEach(card => {
      const id = card.dataset.id || cryptoRandom();
      const title = card.querySelector('.note-title').value.trim().slice(0,40) || 'Untitled';
      const content = card.querySelector('textarea').value || '';
      out.push({ id, title, content });
    });
    notes = out;
    save();
    renderPicker();
    els.notesDlg.close();
  }

  function save(){ localStorage.setItem(KEY, JSON.stringify(notes)); }
  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }catch(e){ return []; }
  }

  // Sortable helpers
  function makeSortable(container){
    let dragEl = null;
    container.addEventListener('dragstart', e => {
      const t = e.target.closest('.note-card');
      if (!t) return e.preventDefault();
      dragEl = t;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getDragAfterElement(container, e.clientY);
      if (after == null) container.appendChild(dragEl);
      else container.insertBefore(dragEl, after);
    });
    container.addEventListener('dragend', () => { dragEl = null; });
  }
  function getDragAfterElement(container, y){
    const cards = [...container.querySelectorAll('.note-card:not(.dragging)')];
    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function cryptoRandom(){
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return 'id-' + Math.random().toString(36).slice(2);
  }

  return { list: () => notes };
}

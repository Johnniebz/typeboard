// Quick Phrases with sections
const PHRASES_V2_KEY = 'typeboard.phrases.v2';
const PHRASES_V1_KEY = 'typeboard.phrases'; // legacy

const DEFAULT_SECTIONS = [
  { title: 'Core',     phrases: ['Sí','No','Gracias','Por favor','Perfecto','No lo sé'] },
  { title: 'Hospital', phrases: ['Gasas','Médico','Dolor','Comida','Enfermera','Lavabo'] },
  { title: 'Tiempo',   phrases: ['Hoy','Mañana','Ahora','Luego'] }
];

export function initPhrases(ctx) {
  const {
    sectionsBar, phrasesWrap, phrasesBar, editBtn,
    dlg, list, addBtn, cancelBtn, saveBtn, board
  } = ctx;

  let SECTIONS = loadSections();
  let activeSection = null;

  function loadSections() {
    try {
      const raw = localStorage.getItem(PHRASES_V2_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (Array.isArray(obj?.sections)) return sanitize(obj.sections);
      }
    } catch {}
    // migrate v1 (flat list)
    try {
      const raw1 = localStorage.getItem(PHRASES_V1_KEY);
      if (raw1) {
        const list = JSON.parse(raw1);
        if (Array.isArray(list) && list.length) {
          const migrated = [{ title: 'Phrases', phrases: list.filter(Boolean) }];
          saveSections(migrated);
          return sanitize(migrated);
        }
      }
    } catch {}
    return DEFAULT_SECTIONS.slice();
  }
  function sanitize(arr) {
    return arr.map(s => ({
      title: (s.title || '').toString().trim() || 'Untitled',
      phrases: Array.isArray(s.phrases) ? s.phrases.map(p => p.toString()).filter(Boolean) : []
    })).filter(sec => sec.phrases.length || sec.title);
  }
  function saveSections(secs) {
    localStorage.setItem(PHRASES_V2_KEY, JSON.stringify({ sections: secs }));
  }

  function renderSectionsBar() {
    sectionsBar.querySelectorAll('.chip.section').forEach(el => el.remove());

    SECTIONS.forEach((sec, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isActive = activeSection === idx;
      chip.className = 'chip section' + (isActive ? ' active' : '');
      chip.textContent = sec.title || 'Untitled';
      chip.addEventListener('click', () => toggleSection(idx));

      // Long-press quick rename/delete
      let timer;
      chip.addEventListener('touchstart', () => {
        timer = setTimeout(() => {
          const action = prompt('Edit section title or type DELETE to remove:', sec.title);
          if (action === null) return;
          if (action.trim().toUpperCase() === 'DELETE') {
            if (confirm(`Delete section "${sec.title}"?`)) {
              SECTIONS.splice(idx, 1);
              if (activeSection === idx) activeSection = null;
              else if (typeof activeSection === 'number' && idx < activeSection) activeSection -= 1;
              saveSections(SECTIONS);
              renderSectionsBar(); renderPhrasesBar();
            }
          } else {
            const newTitle = action.trim();
            if (newTitle) {
              sec.title = newTitle;
              saveSections(SECTIONS);
              renderSectionsBar();
            }
          }
        }, 600);
      }, {passive:true});
      ['touchend','touchmove'].forEach(ev => chip.addEventListener(ev, () => clearTimeout(timer), {passive:true}));

      sectionsBar.insertBefore(chip, editBtn);
    });
  }

  function renderPhrasesBar() {
    phrasesBar.innerHTML = '';
    if (activeSection === null || !SECTIONS.length) {
      collapse(true);
      return;
    }
    const sec = SECTIONS[activeSection] || { phrases: [] };
    sec.phrases.forEach((txt, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = txt;

      chip.addEventListener('click', () => {
        const needsSpace = board.value && !board.value.endsWith(' ');
        board.value = (board.value || '') + (needsSpace ? ' ' : '') + txt;
        board.focus();
        board.selectionStart = board.selectionEnd = board.value.length;
      });

      chip.addEventListener('dblclick', (e) => {
        e.preventDefault();
        board.value = txt;
        board.focus();
      });

      // Long-press edit/delete
      let pressTimer;
      chip.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          const action = prompt('Edit phrase text or type DELETE to remove:', txt);
          if (action === null) return;
          if (action.trim().toUpperCase() === 'DELETE') {
            sec.phrases.splice(idx, 1);
            saveSections(SECTIONS);
            renderPhrasesBar();
          } else {
            const newTxt = action.trim();
            if (newTxt) {
              sec.phrases[idx] = newTxt;
              saveSections(SECTIONS);
              renderPhrasesBar();
            }
          }
        }, 550);
      }, {passive:true});
      ['touchend','touchmove'].forEach(ev => chip.addEventListener(ev, () => clearTimeout(pressTimer), {passive:true}));

      phrasesBar.appendChild(chip);
    });

    collapse(false);
  }

  function toggleSection(idx) {
    activeSection = (activeSection === idx) ? null : idx;
    renderSectionsBar();
    renderPhrasesBar();
  }

  function collapse(should) {
    if (should) {
      phrasesWrap.style.maxHeight = phrasesWrap.scrollHeight + 'px';
      void phrasesWrap.offsetHeight;
      phrasesWrap.classList.add('collapsed');
      phrasesWrap.style.maxHeight = '0px';
    } else {
      phrasesWrap.classList.remove('collapsed');
      phrasesWrap.style.maxHeight = phrasesBar.scrollHeight + 'px';
      const tidy = (e) => {
        if (e.propertyName === 'max-height') {
          phrasesWrap.style.maxHeight = 'none';
          phrasesWrap.removeEventListener('transitionend', tidy);
        }
      };
      phrasesWrap.addEventListener('transitionend', tidy);
    }
  }

  function openManager() {
    list.innerHTML = '';
    SECTIONS.forEach(sec => addSectionRow(sec.title, sec.phrases.join('\n'), false));
    dlg.showModal();
  }

  function addSectionRow(title = '', phrasesText = '', autoExpand = true) {
    const row = document.createElement('div'); row.className = 'sec-row';
    const handle = document.createElement('div'); handle.className = 'handle'; handle.textContent = '☰'; handle.title = 'Drag to reorder';
    const titleSpan = document.createElement('div'); titleSpan.className = 'title'; titleSpan.textContent = title || 'Untitled';
    const delInline = document.createElement('button'); delInline.type = 'button'; delInline.className = 'delete-inline'; delInline.textContent = 'Delete';
    const chev = document.createElement('div'); chev.className = 'chev'; chev.textContent = '›';

    const editor = document.createElement('div'); editor.className = 'sec-editor';
    editor.innerHTML = `
      <div class="row">
        <input type="text" class="title-input" placeholder="Section title" value="">
      </div>
      <div class="row">
        <textarea class="phrases-input" placeholder="Phrases (comma or new line separated)"></textarea>
      </div>
      <div class="row" style="justify-content:flex-end; color:#666; font-size:13px;">
        Changes apply when you press “Save Changes”.
      </div>
    `;

    row.append(handle, titleSpan, delInline, chev, editor);
    list.appendChild(row);

    const titleInput = editor.querySelector('.title-input');
    const phrasesInput = editor.querySelector('.phrases-input');
    titleInput.value = title;
    phrasesInput.value = phrasesText;

    function toggleExpand() {
      const exp = row.classList.toggle('expanded');
      chev.textContent = exp ? '▾' : '›';
      if (exp) { titleInput.focus(); titleInput.select(); }
    }
    titleSpan.addEventListener('click', toggleExpand);
    chev.addEventListener('click', toggleExpand);

    titleInput.addEventListener('input', (e) => {
      const t = e.target.value.trim();
      titleSpan.textContent = t || 'Untitled';
    });

    delInline.addEventListener('click', () => {
      if (confirm('Delete this section?')) row.remove();
    });

    enableDrag(row, handle);

    if (autoExpand) {
      row.classList.add('expanded'); chev.textContent = '▾';
      setTimeout(() => { titleInput.focus(); titleInput.select(); }, 0);
    }
  }

  function enableDrag(row, handle) {
    let dragging=false, startY=0, currentY=0, placeholder=null;

    const onDown = (e) => {
      e.preventDefault();
      dragging = true; startY = getY(e);
      row.classList.add('dragging');
      placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = row.getBoundingClientRect().height + 'px';
      list.insertBefore(placeholder, row.nextSibling);
      row.style.position='relative'; row.style.zIndex='1'; row.style.transform='translateY(0px)';

      window.addEventListener('pointermove', onMove, {passive:false});
      window.addEventListener('pointerup', onUp, {passive:false});
      window.addEventListener('touchmove', onMove, {passive:false});
      window.addEventListener('touchend', onUp, {passive:false});
      window.addEventListener('mousemove', onMove, {passive:false});
      window.addEventListener('mouseup', onUp, {passive:false});
    };

    const onMove = (e) => {
      if(!dragging) return; e.preventDefault();
      currentY = getY(e);
      const dy = currentY - startY;
      row.style.transform = `translateY(${dy}px)`;
      const rowsArr = [...list.querySelectorAll('.sec-row')].filter(el => el !== row);
      let placed = false;
      for (const r of rowsArr) {
        const rect = r.getBoundingClientRect();
        if (currentY < rect.top + rect.height/2) { list.insertBefore(placeholder, r); placed = true; break; }
      }
      if (!placed) list.appendChild(placeholder);
    };

    const onUp = () => {
      if(!dragging) return; dragging=false;
      row.classList.remove('dragging'); row.style.position=''; row.style.zIndex=''; row.style.transform='';
      if (placeholder) { list.insertBefore(row, placeholder); placeholder.remove(); placeholder = null; }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    const getY = (e) => e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? e.clientY ?? 0;

    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('touchstart', onDown, {passive:false});
    handle.addEventListener('mousedown', onDown);
  }

  function collectSectionsFromDialog() {
    const rows = [...list.querySelectorAll('.sec-row')];
    const out = rows.map(r => {
      const t = r.querySelector('.title-input')?.value.trim() || r.querySelector('.title')?.textContent || 'Untitled';
      const raw = r.querySelector('.phrases-input')?.value || '';
      const phrases = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      return { title: t, phrases };
    });
    return sanitize(out);
  }

  editBtn.addEventListener('click', openManager);
  addBtn.addEventListener('click', () => addSectionRow('', '', true));
  cancelBtn.addEventListener('click', () => dlg.close());
  saveBtn.addEventListener('click', () => {
    SECTIONS = collectSectionsFromDialog();
    localStorage.setItem(PHRASES_V2_KEY, JSON.stringify({ sections: SECTIONS }));
    if (typeof activeSection === 'number' && activeSection >= SECTIONS.length) activeSection = null;
    renderSectionsBar(); renderPhrasesBar();
    dlg.close();
  });

  function render() {
    renderSectionsBar();
    renderPhrasesBar();
  }

  return { render };
}

const NOTES_KEY = 'typeboard.notes';
const NOTES_TITLE_MAX = 40;

export function initNotes(ctx) {
  const { dlg, list, addBtn, cancelBtn, saveBtn, picker, manageBtn, board } = ctx;

  function loadNotes(){ try{ const raw=localStorage.getItem(NOTES_KEY); const arr=raw?JSON.parse(raw):[]; return Array.isArray(arr)?arr:[]; }catch{ return []; } }
  function saveNotes(arr){ localStorage.setItem(NOTES_KEY, JSON.stringify(arr)); }

  function renderPicker(){
    const arr=loadNotes();
    picker.innerHTML='<option value="">Notes ▾</option>';
    arr.forEach((n,i)=>{
      const opt=document.createElement('option');
      opt.value=String(i);
      opt.textContent=n.title||`Note ${i+1}`;
      picker.appendChild(opt);
    });
  }

  picker.addEventListener('change', ()=>{
    const idx=parseInt(picker.value,10); const arr=loadNotes();
    if(!isNaN(idx) && arr[idx]){
      const prefix=(board.value && !board.value.endsWith('\n'))?'\n':'';
      const start = board.selectionStart ?? board.value.length;
      const end   = board.selectionEnd ?? board.value.length;
      board.setRangeText(prefix+arr[idx].body, start, end, 'end');
      board.focus();
    }
    picker.value='';
  });

  manageBtn.addEventListener('click', openManager);

  function openManager(){
    list.innerHTML='';
    const arr=loadNotes();
    if(arr.length>0){ arr.forEach(n=>addNoteRow(n.title,n.body,false)); }
    dlg.showModal();
  }

  function addNoteRow(title='', body='', autoExpand=false){
    const row=document.createElement('div'); row.className='note-row'; row.setAttribute('data-title',title);
    const handle=document.createElement('div'); handle.className='handle'; handle.textContent='☰'; handle.title='Drag to reorder';
    const titleSpan=document.createElement('div'); titleSpan.className='title'; titleSpan.textContent=title||'Untitled';
    const delInline=document.createElement('button'); delInline.type='button'; delInline.className='delete-inline'; delInline.textContent='Delete';
    const chev=document.createElement('div'); chev.className='chev'; chev.textContent='›';
    const editor=document.createElement('div'); editor.className='note-editor';
    editor.innerHTML = `
      <div class="row">
        <input type="text" class="title-input" placeholder="Note title (max ${NOTES_TITLE_MAX} chars)" maxlength="${NOTES_TITLE_MAX}">
      </div>
      <textarea class="body-input" placeholder="Write your note text here..."></textarea>
      <div class="actions"><span style="font-size:13px;color:#666;">Changes are saved with “Save Changes”.</span></div>
    `;
    row.append(handle, titleSpan, delInline, chev, editor);
    list.appendChild(row);
    const titleInput=editor.querySelector('.title-input');
    const bodyInput=editor.querySelector('.body-input');
    titleInput.value = title.slice(0,NOTES_TITLE_MAX);
    bodyInput.value = body;

    function toggleExpand(){ const exp=row.classList.toggle('expanded'); chev.textContent = exp ? '▾' : '›'; if(exp){ titleInput.focus(); titleInput.select(); } }
    titleSpan.addEventListener('click', toggleExpand);
    chev.addEventListener('click', toggleExpand);

    titleInput.addEventListener('input', (e)=>{ const t=e.target.value.trim(); titleSpan.textContent=t||'Untitled'; });
    const doDelete = () => { if (confirm('Delete this note?')) row.remove(); };
    delInline.addEventListener('click', doDelete);

    enableRowDrag(row, handle);

    if(autoExpand){
      row.classList.add('expanded'); chev.textContent='▾';
      setTimeout(()=>{ titleInput.focus(); titleInput.select(); }, 0);
    }

    editor.style.gridColumn = '1 / -1';
  }

  function enableRowDrag(row, handle){
    let dragging=false, startY=0, currentY=0, placeholder=null;
    const onDown=(e)=>{
      e.preventDefault();
      dragging=true; startY=getY(e);
      row.classList.add('dragging');
      placeholder=document.createElement('div'); placeholder.className='drag-placeholder'; placeholder.style.height = row.getBoundingClientRect().height+'px';
      list.insertBefore(placeholder, row.nextSibling);
      row.style.position='relative'; row.style.zIndex='1'; row.style.transform='translateY(0px)';

      window.addEventListener('pointermove', onMove, {passive:false});
      window.addEventListener('pointerup', onUp, {passive:false});
      window.addEventListener('touchmove', onMove, {passive:false});
      window.addEventListener('touchend', onUp, {passive:false});
      window.addEventListener('mousemove', onMove, {passive:false});
      window.addEventListener('mouseup', onUp, {passive:false});
    };
    const onMove=(e)=>{
      if(!dragging) return; e.preventDefault();
      currentY=getY(e); const dy=currentY-startY; row.style.transform=`translateY(${dy}px)`;
      const rowsArr=[...list.querySelectorAll('.note-row')].filter(el=>el!==row);
      let placed=false;
      for(const r of rowsArr){
        const rect=r.getBoundingClientRect();
        if(currentY < rect.top + rect.height/2){ list.insertBefore(placeholder, r); placed=true; break; }
      }
      if(!placed) list.appendChild(placeholder);
    };
    const onUp=()=>{
      if(!dragging) return; dragging=false;
      row.classList.remove('dragging'); row.style.position=''; row.style.zIndex=''; row.style.transform='';
      if(placeholder){ list.insertBefore(row, placeholder); placeholder.remove(); placeholder=null; }

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    const getY=(e)=> e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? e.clientY ?? 0;

    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('touchstart', onDown, {passive:false});
    handle.addEventListener('mousedown', onDown);
  }

  function getY(e){ return e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? e.clientY ?? 0; }

  addBtn.addEventListener('click', ()=> addNoteRow('', '', true));
  cancelBtn.addEventListener('click', ()=> dlg.close());
  saveBtn.addEventListener('click', ()=>{
    const rowsDom=[...list.querySelectorAll('.note-row')];
    const arr=rowsDom.map(r=>{
      const t=(r.querySelector('.title-input')?.value.trim() || r.getAttribute('data-title') || '').slice(0,NOTES_TITLE_MAX);
      const b=r.querySelector('.body-input')?.value || '';
      return { title: t || 'Untitled', body: b };
    });
    saveNotes(arr); renderPicker(); dlg.close();
  });

  return { renderPicker };
}

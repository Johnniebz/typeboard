export function initDrawing(ctx) {
  const { pad, drawings, toggleBtn, board } = ctx;
  const dctx = pad.getContext('2d');

  let drawing=false, drawActive=false, dirty=false;
  let lastX=0, lastY=0, dpr=1;

  function resize(){
    const rect=pad.getBoundingClientRect();
    dpr=window.devicePixelRatio||1;
    dctx.setTransform(1,0,0,1,0,0);
    pad.width=Math.max(1, Math.floor(rect.width*dpr));
    pad.height=Math.max(1, Math.floor(rect.height*dpr));
    dctx.scale(dpr,dpr);
    dctx.clearRect(0,0, rect.width, rect.height);
    dirty=false;
  }

  function startDraw(x,y){ drawing=true; lastX=x; lastY=y; }
  function moveDraw(x,y){
    if(!drawing) return;
    dctx.lineCap='round'; dctx.lineJoin='round'; dctx.strokeStyle='#111'; dctx.lineWidth=3;
    dctx.beginPath(); dctx.moveTo(lastX,lastY); dctx.lineTo(x,y); dctx.stroke();
    lastX=x; lastY=y; dirty=true;
  }
  function endDraw(){ drawing=false; }

  function getPoint(e){
    const rect=pad.getBoundingClientRect();
    if(e.touches&&e.touches.length){ const t=e.touches[0]; return {x:t.clientX-rect.left, y:t.clientY-rect.top}; }
    return {x:e.clientX-rect.left, y:e.clientY-rect.top};
  }

  function getVerticalContentBounds(){
    const w=pad.width, h=pad.height;
    if(!dirty||!w||!h) return null;
    try{
      const data=dctx.getImageData(0,0,w,h).data;
      let topFound=false, bottomFound=false, top=0, bottom=h-1;
      for(let y=0;y<h;y++){
        const row=y*w*4;
        for(let x=0;x<w;x++){ if(data[row+x*4+3]!==0){ top=y; topFound=true; break; } }
        if(topFound) break;
      }
      if(!topFound) return null;
      for(let y=h-1;y>=0;y--){
        const row=y*w*4;
        for(let x=0;x<w;x++){ if(data[row+x*4+3]!==0){ bottom=y; bottomFound=true; break; } }
        if(bottomFound) break;
      }
      return {top,bottom};
    }catch{ return null; }
  }

  function saveDrawingIfAny(){
    if(!dirty) return;
    const w=pad.width,h=pad.height;
    const b=getVerticalContentBounds();
    let sy=0,sh=h;
    const cssDpr=window.devicePixelRatio||1;
    const margin=Math.round(cssDpr*2);
    if(b){
      sy=Math.max(0,b.top-margin);
      const bt=Math.min(h-1,b.bottom+margin);
      sh=Math.max(1, bt-sy+1);
    }
    const off=document.createElement('canvas');
    off.width=w; off.height=sh;
    const offCtx=off.getContext('2d');
    offCtx.drawImage(pad,0,sy,w,sh,0,0,w,sh);
    const img=new Image();
    img.src=off.toDataURL('image/png');
    drawings.appendChild(img);
    const rect=pad.getBoundingClientRect();
    dctx.clearRect(0,0, rect.width, rect.height);
    dirty=false;
    board.focus();
  }

  toggleBtn.addEventListener('click', ()=>{
    saveDrawingIfAny();
    drawActive=!drawActive;
    toggleBtn.textContent = drawActive ? 'Draw: On' : 'Draw: Off';
    toggleBtn.setAttribute('aria-pressed', String(drawActive));
    document.body.classList.toggle('drawing-active', drawActive);
    if(drawActive){ board.blur(); resize(); } else { board.focus(); }
  });

  pad.addEventListener('touchstart',(e)=>{ if(!drawActive) return; e.preventDefault(); const p=getPoint(e); startDraw(p.x,p.y); });
  pad.addEventListener('touchmove',(e)=>{ if(!drawActive) return; e.preventDefault(); const p=getPoint(e); moveDraw(p.x,p.y); });
  pad.addEventListener('touchend',(e)=>{ if(!drawActive) return; e.preventDefault(); endDraw(); });
  pad.addEventListener('mousedown',(e)=>{ if(!drawActive) return; const p=getPoint(e); startDraw(p.x,p.y); });
  pad.addEventListener('mousemove',(e)=>{ if(!drawActive) return; const p=getPoint(e); moveDraw(p.x,p.y); });
  pad.addEventListener('mouseup', endDraw);
  pad.addEventListener('mouseleave', endDraw);

  function clearCanvas(){
    const rect=pad.getBoundingClientRect();
    dctx.clearRect(0,0,rect.width,rect.height);
    dirty=false;
  }

  return { resize, clearCanvas };
}

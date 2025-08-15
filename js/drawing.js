export function initDrawing({ els }){
  const canvas = els.pad;
  const ctx = canvas.getContext('2d');

  let drawing = false;
  let enabled = false;
  let last = null;
  let lineWidth = 3;
  let strokeStyle = '#333';

  function pointerDown(e){
    if (!enabled) return;
    drawing = true;
    last = getPos(e);
    e.preventDefault();
  }
  function pointerMove(e){
    if (!enabled || !drawing) return;
    const p = getPos(e);
    drawLine(last, p);
    last = p;
    e.preventDefault();
  }
  function pointerUp(e){
    if (!enabled) return;
    drawing = false;
    last = null;
    e.preventDefault();
  }

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const pt = ('touches' in e && e.touches[0]) ? e.touches[0] : (e.changedTouches?.[0] || e);
    return { x: (pt.clientX - rect.left), y: (pt.clientY - rect.top) };
  }

  function drawLine(a, b){
    if (!a || !b) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Events
  canvas.addEventListener('mousedown', pointerDown);
  canvas.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerUp);

  canvas.addEventListener('touchstart', pointerDown, { passive: false });
  canvas.addEventListener('touchmove', pointerMove, { passive: false });
  window.addEventListener('touchend', pointerUp, { passive: false });
  window.addEventListener('touchcancel', pointerUp, { passive: false });

  function toggle(){
    enabled = !enabled;
    canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    return enabled;
  }

  function syncSize(){
    // nothing special; canvas size handled by main.js fitCanvas()
    // could add DPI scaling:
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    canvas.style.width = Math.floor(w / 1) + 'px';
    canvas.style.height = Math.floor(h / 1) + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  return { toggle, syncSize };
}

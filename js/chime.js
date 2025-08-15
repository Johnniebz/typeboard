export function initChime({ button }){
  let audioCtx = null;

  button.addEventListener('click', () => {
    try{
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // Simple beep (works offline, no assets)
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 880; // A5
      g.gain.value = 0.0001;
      o.connect(g).connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      o.start(now);
      o.stop(now + 0.26);
    }catch(e){
      console.warn('Audio error', e);
    }
  }, { passive: true });
}

export function initChime(button) {
  if (!button) return;

  let chimeCtx;

  function playGentleChimeTwice() {
    if (!chimeCtx) chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = chimeCtx.currentTime;

    const master = chimeCtx.createGain();
    master.gain.value = 0.15;
    master.connect(chimeCtx.destination);

    bell(now, master);
    bell(now + 0.45, master);
  }

  function bell(startTime, outputNode) {
    const o1 = chimeCtx.createOscillator();
    const o2 = chimeCtx.createOscillator();
    const o3 = chimeCtx.createOscillator();

    o1.type = 'sine';     o1.frequency.setValueAtTime(880, startTime);
    o2.type = 'sine';     o2.frequency.setValueAtTime(1760, startTime);
    o2.detune.setValueAtTime(6, startTime);
    o3.type = 'triangle'; o3.frequency.setValueAtTime(440, startTime);

    const g = chimeCtx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.exponentialRampToValueAtTime(0.9, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

    const filter = chimeCtx.createBiquadFilter();
    filter.type = 'highshelf';
    filter.frequency.setValueAtTime(3000, startTime);
    filter.gain.setValueAtTime(-2, startTime);

    o1.connect(g); o2.connect(g); o3.connect(g);
    g.connect(filter); filter.connect(outputNode);

    o1.start(startTime); o2.start(startTime); o3.start(startTime);
    const stopTime = startTime + 1.2;
    o1.stop(stopTime); o2.stop(stopTime); o3.stop(stopTime);
  }

  button.addEventListener('click', () => {
    if (chimeCtx && chimeCtx.state === 'suspended') chimeCtx.resume();
    playGentleChimeTwice();
  });
}

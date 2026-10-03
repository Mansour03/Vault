// sound.js — mechanical unlock / lock sounds synthesised with Web Audio (no audio files needed).

export const T = { wheelA: 0, wheelB: 1.4, boltA: 0.9, boltB: 1.8, doorA: 1.9, doorB: 3.8, camAt: 2.7, total: 4.8 };

function noiseBuf(ctx, dur) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function click(ctx, when, { freq = 2200, gain = 0.2, dur = 0.04 } = {}) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, dur);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 4;
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, when); g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  src.connect(f).connect(g).connect(ctx.destination); src.start(when);
}
function thud(ctx, when, { f0 = 110, f1 = 38, gain = 0.5, dur = 0.22 } = {}) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f1, when + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, when); g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  o.connect(g).connect(ctx.destination); o.start(when); o.stop(when + dur + 0.02);
  click(ctx, when, { freq: 600, gain: gain * 0.5, dur: 0.06 });
}
function sweep(ctx, when, dur) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, dur);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(180, when); f.frequency.linearRampToValueAtTime(700, when + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(0.14, when + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, when + dur);
  src.connect(f).connect(g).connect(ctx.destination); src.start(when);
}

export function playUnlock(ctx) {
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.02;
  for (let i = 0; i < 14; i++) click(ctx, t0 + i * 0.1, { freq: 1800 + (i % 3) * 500 });
  for (let i = 0; i < 8; i++) thud(ctx, t0 + T.boltA + i * 0.1, { f0: 140, f1: 55, gain: 0.28, dur: 0.14 });
  thud(ctx, t0 + 1.85, { f0: 90, f1: 30, gain: 0.7, dur: 0.4 });
  sweep(ctx, t0 + T.doorA, 1.9);
  thud(ctx, t0 + T.doorB - 0.05, { f0: 70, f1: 28, gain: 0.5, dur: 0.35 });
}

export function playLock(ctx) {
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.02;
  sweep(ctx, t0, 1.6);
  thud(ctx, t0 + 1.7, { f0: 90, f1: 30, gain: 0.8, dur: 0.45 });
  for (let i = 0; i < 8; i++) thud(ctx, t0 + 2.0 + i * 0.08, { f0: 140, f1: 55, gain: 0.22, dur: 0.12 });
}

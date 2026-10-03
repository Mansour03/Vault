// textures.js — every texture is drawn procedurally on a canvas, so the scene needs no image files.
// The banknotes are stylised, generic designs (marked SPECIMEN) — not reproductions of real notes.

import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* brushed-metal bump map */
export function brushedTexture() {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, len = 40 + Math.random() * 260;
    const v = (100 + Math.random() * 110) | 0;
    g.strokeStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.12})`;
    g.lineWidth = Math.random() * 1.4 + 0.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (Math.random() - 0.5) * 1.5); g.stroke();
  }
  return tex(c, { srgb: false, repeat: true });
}

/* polished tile floor with gold grout */
export function floorTexture() {
  const [c, g] = canvas(512, 512);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    g.fillStyle = (x + y) % 2 ? '#15171c' : '#1d2026';
    g.fillRect(x * 256, y * 256, 256, 256);
  }
  g.strokeStyle = '#8a6b2c'; g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 509, 509);
  g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
  const t = tex(c, { repeat: true });
  t.repeat.set(3, 4);
  return t;
}

/* rotary dial for the door */
export function dialTexture() {
  const [c, g] = canvas(512, 512);
  const R = 256;
  const grd = g.createRadialGradient(R, R, 10, R, R, R);
  grd.addColorStop(0, '#2b3038'); grd.addColorStop(1, '#14171c');
  g.fillStyle = grd; g.beginPath(); g.arc(R, R, R - 4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d9b25a'; g.lineWidth = 6; g.beginPath(); g.arc(R, R, R - 10, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 100; i++) {
    const a = (i / 100) * Math.PI * 2 - Math.PI / 2;
    const major = i % 10 === 0, mid = i % 5 === 0;
    const r1 = R - 26, r2 = R - (major ? 62 : mid ? 50 : 40);
    g.strokeStyle = major ? '#f3dc9c' : '#a8884a';
    g.lineWidth = major ? 4 : 2;
    g.beginPath(); g.moveTo(R + Math.cos(a) * r1, R + Math.sin(a) * r1); g.lineTo(R + Math.cos(a) * r2, R + Math.sin(a) * r2); g.stroke();
    if (major) {
      g.fillStyle = '#f3dc9c'; g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i), R + Math.cos(a) * (R - 92), R + Math.sin(a) * (R - 92));
    }
  }
  return tex(c);
}

/* keypad screen */
export function screenTexture() {
  const [c, g] = canvas(256, 64);
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#fff'; g.font = 'bold 30px "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SECURE  ●●●●', 128, 34);
  return tex(c);
}

/* stamp engraved on the gold bars */
export function stampTexture() {
  const [c, g] = canvas(256, 112);
  g.clearRect(0, 0, 256, 112);
  g.fillStyle = 'rgba(70,46,6,0.9)'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 20px Georgia'; g.fillText('FINE GOLD', 128, 22);
  g.font = 'bold 54px Arial'; g.fillText('999.9', 128, 62);
  g.lineWidth = 3; g.strokeStyle = 'rgba(70,46,6,0.9)'; g.strokeRect(18, 8, 220, 96);
  g.font = 'bold 15px Georgia'; g.fillText('24 KARAT', 128, 96);
  return tex(c);
}

/* shelf label plaque */
export function plaqueTexture(text) {
  const [c, g] = canvas(512, 96);
  const grd = g.createLinearGradient(0, 0, 0, 96);
  grd.addColorStop(0, '#f1d58a'); grd.addColorStop(0.5, '#c79d45'); grd.addColorStop(1, '#8a6b2c');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 96);
  g.strokeStyle = 'rgba(60,40,8,.8)'; g.lineWidth = 4; g.strokeRect(6, 6, 500, 84);
  g.fillStyle = 'rgba(50,32,4,.95)'; g.font = 'bold 44px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 52);
  return tex(c);
}

/* number plate for safety-deposit boxes */
export function numberTexture(n) {
  const [c, g] = canvas(128, 64);
  g.fillStyle = '#e7c76f'; g.fillRect(0, 0, 128, 64);
  g.strokeStyle = '#6b4f13'; g.lineWidth = 3; g.strokeRect(3, 3, 122, 58);
  g.fillStyle = '#3b2a06'; g.font = 'bold 36px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n).padStart(2, '0'), 64, 34);
  return tex(c);
}

/* paper edge: fine layered lines, tinted per currency */
export function edgeTexture(tint) {
  const [c, g] = canvas(8, 64);
  g.fillStyle = tint; g.fillRect(0, 0, 8, 64);
  for (let y = 0; y < 64; y += 2) {
    g.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.28)';
    g.fillRect(0, y, 8, 1);
  }
  const t = tex(c, { repeat: true });
  t.magFilter = THREE.LinearFilter;
  return t;
}

/* banknote face — guilloche waves, border, central medallion, denomination, SPECIMEN watermark */
export function noteTexture({ code, denom, symbol, symbolFont, c1, c2, ink }) {
  const W = 640, H = 300;
  const [c, g] = canvas(W, H);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, c1); bg.addColorStop(1, c2);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // guilloche
  g.lineWidth = 0.8;
  for (let k = 0; k < 30; k++) {
    g.strokeStyle = rgba(ink, 0.2);
    g.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = H / 2 + Math.sin(x / 36 + k * 0.45) * (30 + k * 3.2);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  for (let k = 0; k < 18; k++) {
    g.strokeStyle = rgba(ink, 0.13);
    g.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = H / 2 + Math.cos(x / 52 - k * 0.6) * (20 + k * 5);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }

  // border
  g.strokeStyle = ink; g.lineWidth = 6; g.strokeRect(14, 14, W - 28, H - 28);
  g.lineWidth = 2; g.strokeRect(26, 26, W - 52, H - 52);

  // medallion with rosette
  g.save();
  g.beginPath(); g.ellipse(W / 2, H / 2, 92, 104, 0, 0, Math.PI * 2);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
  g.lineWidth = 3; g.strokeStyle = ink; g.stroke();
  for (let r = 14; r < 90; r += 8) {
    g.beginPath(); g.ellipse(W / 2, H / 2, r * 0.9, r, 0, 0, Math.PI * 2);
    g.strokeStyle = rgba(ink, 0.18); g.lineWidth = 1; g.stroke();
  }
  g.restore();

  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = symbolFont || 'bold 88px Georgia';
  g.fillText(symbol, W / 2, H / 2 + 4);

  // denominations
  g.font = 'bold 64px Arial';
  g.textAlign = 'left'; g.fillText(denom, 46, 80);
  g.textAlign = 'right'; g.fillText(denom, W - 46, H - 76);
  g.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  g.textAlign = 'right'; g.fillText(code, W - 46, 74);
  g.textAlign = 'left'; g.font = '17px "Courier New", monospace';
  g.fillText('A 0482 7715 B', 46, H - 46);

  // SPECIMEN watermark
  g.save();
  g.translate(W / 2, H / 2); g.rotate(-0.12);
  g.globalAlpha = 0.17; g.font = 'bold 76px Arial'; g.textAlign = 'center';
  g.fillText('SPECIMEN', 0, 0);
  g.restore();

  return tex(c);
}

export const NOTE_STYLES = {
  USD: { code: 'USD', denom: '100', symbol: '$', c1: '#cfdcb8', c2: '#8fae7e', ink: '#1f4a2a' },
  EUR: { code: 'EUR', denom: '50', symbol: '€', c1: '#f3c58f', c2: '#d98b4a', ink: '#6b3510' },
  SAR: { code: 'SAR', denom: '500', symbol: 'ريال', symbolFont: 'bold 62px Tahoma, Arial', c1: '#bcd3ea', c2: '#6f98c4', ink: '#12365c' },
  EGP: { code: 'EGP', denom: '200', symbol: 'ج.م', symbolFont: 'bold 62px Tahoma, Arial', c1: '#d8d3a6', c2: '#a49a63', ink: '#4a4217' },
};

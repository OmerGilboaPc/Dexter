import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

function canvasTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number], srgb = true) {
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, t);
  return t;
}

const noise = (ctx: CanvasRenderingContext2D, w: number, h: number, amt: number) => {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
};

/** Crinkled plastic sheeting normal map. */
export const plasticNormal = () =>
  canvasTex(
    'plasticN',
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = 'rgb(128,128,255)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const len = 40 + Math.random() * 180;
        const a = Math.random() * Math.PI;
        const g = ctx.createLinearGradient(x, y, x + Math.cos(a + Math.PI / 2) * 6, y + Math.sin(a + Math.PI / 2) * 6);
        g.addColorStop(0, 'rgba(90,128,255,0.5)');
        g.addColorStop(1, 'rgba(170,128,255,0.5)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2 + Math.random() * 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (Math.random() - 0.5) * 30, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
        ctx.stroke();
      }
    },
    [2, 2],
    false,
  );

export const woodTex = () =>
  canvasTex(
    'wood',
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#4a2416';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) {
        const v = Math.sin(y * 0.08 + Math.sin(y * 0.013) * 6) * 18 + (Math.random() - 0.5) * 10;
        ctx.fillStyle = `rgba(${40 + v},${18 + v * 0.5},${10},0.35)`;
        ctx.fillRect(0, y, w, 2);
      }
      noise(ctx, w, h, 14);
    },
    [1, 1],
  );

export const deckTex = () =>
  canvasTex(
    'deck',
    512,
    512,
    (ctx, w, h) => {
      for (let i = 0; i < 8; i++) {
        const v = 120 + Math.random() * 40;
        ctx.fillStyle = `rgb(${v},${v * 0.82},${v * 0.6})`;
        ctx.fillRect(0, (i * h) / 8, w, h / 8 - 3);
        ctx.fillStyle = '#2a1d12';
        ctx.fillRect(0, ((i + 1) * h) / 8 - 3, w, 3);
      }
      noise(ctx, w, h, 22);
    },
    [3, 3],
  );

export const metalRibs = () =>
  canvasTex(
    'ribs',
    256,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? '#9aa6b0' : '#c9d3db');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 20);
    },
    [8, 2],
  );

export const concreteTex = () =>
  canvasTex(
    'concrete',
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#3b3b3e';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 40);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 60, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [4, 4],
  );

/** A fake surveillance photo of a "victim" to pin on the plastic walls. */
export const evidencePhoto = (i: number) =>
  canvasTex(`photo${i}`, 256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const hue = (i * 47) % 360;
    g.addColorStop(0, `hsl(${hue},12%,40%)`);
    g.addColorStop(1, `hsl(${hue},10%,14%)`);
    ctx.fillStyle = g;
    ctx.fillRect(14, 14, w - 28, h - 70);
    // silhouette
    ctx.fillStyle = 'rgba(10,10,10,.75)';
    ctx.beginPath();
    ctx.arc(w / 2, 110, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2, 240, 80, 70, 0, Math.PI, 0);
    ctx.fill();
    noise(ctx, w, h, 30);
    ctx.fillStyle = '#222';
    ctx.font = '18px "Special Elite", monospace';
    ctx.fillText(`VICTIM #${i + 1}`, 20, h - 26);
  });

export const slideLabel = (n: number, color = '#ffffff') =>
  canvasTex(`label${n}-${color}`, 128, 64, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 34px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n).padStart(3, '0'), w / 2, h / 2 + 2);
  });

export const velvetTex = () =>
  canvasTex(
    'velvet',
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#3a060b';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 26);
    },
    [4, 4],
  );

export const loadImageTexture = (url: string) => {
  if (cache.has(url)) return cache.get(url)!;
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(url, t);
  return t;
};

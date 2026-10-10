import { useEffect } from 'react';
import { useCms } from '../lib/cms';
import { sfx } from '../lib/sound';

// All cursors are drawn on a 32×32 grid and served at 1x and 2x so they stay razor-sharp on high-DPI screens.
const svg = (body: string, size: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${body}</svg>`;
const url = (body: string, size: number) => `url("data:image/svg+xml,${encodeURIComponent(svg(body, size))}")`;
const cursor = (body: string, hx: number, hy: number, fallback: string) =>
  `${url(body, 32)} ${hx} ${hy}, ${fallback}; cursor: image-set(${url(body, 32)} 1x, ${url(body, 64)} 2x) ${hx} ${hy}, ${fallback}`;

const DEFS = `<defs>
  <linearGradient id="st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#c9ced4"/><stop offset="1" stop-color="#8a9097"/></linearGradient>
  <linearGradient id="hd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2d31"/><stop offset="1" stop-color="#0b0c0e"/></linearGradient>
  <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0.6" dy="1.2" stdDeviation="0.9" flood-color="#000" flood-opacity=".55"/></filter>
</defs>`;

// Scalpel: tip at the top-left hotspot.
const scalpel = (edge: string, drop: boolean) =>
  `${DEFS}<g filter="url(#sh)">
    <path d="M1.5 1.5 L14.2 9.6 Q15.4 10.6 14.6 11.9 L11.9 14.6 Q10.6 15.4 9.6 14.2 Z" fill="url(#st)" stroke="#16171a" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M1.5 1.5 L14.2 9.6" stroke="${edge}" stroke-width="1.1" stroke-linecap="round"/>
    <rect x="12.4" y="12.4" width="4" height="15.5" rx="1.6" transform="rotate(-45 14.4 20.15)" fill="url(#hd)" stroke="#000" stroke-width=".6"/>
    <rect x="13.55" y="15.8" width="1.7" height="5" rx=".8" transform="rotate(-45 14.4 18.3)" fill="${edge}" opacity=".9"/>
    ${drop ? '<circle cx="2.6" cy="5.2" r="1.25" fill="#ff2e3b"/>' : ''}
  </g>`;

// Refined arrow.
const arrow = (fill: string, stroke: string, accent: string) =>
  `${DEFS}<g filter="url(#sh)"><path d="M3 2.5 L3 23.5 L8.6 18.4 L12.3 27 L15.9 25.4 L12.3 17 L19.6 17 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.3" stroke-linejoin="round"/><path d="M3 2.5 L3 7" stroke="${accent}" stroke-width="1.6" stroke-linecap="round"/></g>`;

// Minimal dot.
const dot = (fill: string, ring: boolean) => `<circle cx="16" cy="16" r="${ring ? 6.5 : 3.6}" fill="${ring ? 'none' : fill}" stroke="${ring ? fill : '#000'}" stroke-width="${ring ? 2 : 0.8}"/>${ring ? `<circle cx="16" cy="16" r="2" fill="${fill}"/>` : ''}`;

function css(style: string) {
  let def = '';
  let ptr = '';
  if (style === 'scalpel') {
    def = cursor(scalpel('#9aa3ad', false), 2, 2, 'auto');
    ptr = cursor(scalpel('#ff2e3b', true), 2, 2, 'pointer');
  } else if (style === 'arrow') {
    def = cursor(arrow('#0e0e10', '#f4f1ec', '#ff2e3b'), 3, 2, 'auto');
    ptr = cursor(arrow('#e0141f', '#ffffff', '#ffffff'), 3, 2, 'pointer');
  } else if (style === 'dot') {
    def = cursor(dot('#f4f1ec', false), 16, 16, 'auto');
    ptr = cursor(dot('#ff2e3b', true), 16, 16, 'pointer');
  } else return '';
  return `
    html, body { cursor: ${def}; }
    a, button, [role="button"], .chip, .card.hover, label, select, summary, .slide-hit, input[type="range"], input[type="color"], input[type="checkbox"] { cursor: ${ptr} !important; }
    input:not([type="range"]):not([type="color"]):not([type="checkbox"]), textarea, [contenteditable="true"] { cursor: text !important; }
  `;
}

/** Custom system cursor (native, so there is zero lag). Style is chosen in Admin → Features & Effects. */
export function Cursor() {
  const { settings } = useCms();
  const style = (settings.features as any).cursorStyle || 'scalpel';
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = document.createElement('style');
    el.id = 'dexter-cursor';
    el.textContent = css(style);
    document.head.appendChild(el);
    let last: Element | null = null;
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement)?.closest?.('a, button, [role="button"], .chip');
      if (t && t !== last) sfx.hover();
      last = t;
    };
    window.addEventListener('pointerover', over);
    return () => {
      el.remove();
      window.removeEventListener('pointerover', over);
    };
  }, [style]);
  return null;
}

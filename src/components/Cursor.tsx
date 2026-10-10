import { useEffect } from 'react';
import { sfx } from '../lib/sound';

const enc = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// Classic arrow shape, so it feels familiar and precise (hotspot at the tip).
const arrow = (fill: string, stroke: string, drop: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="30" viewBox="0 0 26 30"><path d="M3 2 L3 22 L8.2 17.4 L11.6 25.6 L15 24.1 L11.7 16.1 L18.6 16.1 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/><path d="M21 19 C21 19 18 23.2 18 25 a3 3 0 0 0 6 0 C24 23.2 21 19 21 19Z" fill="${drop}"/></svg>`;

const DEFAULT = enc(arrow('#f4f1ec', '#0b0b0d', '#e0141f'));
const POINTER = enc(arrow('#e0141f', '#fff3f3', '#ffffff'));

/** Custom system cursor: a sharp arrow with a blood drop. Native, lag-free, and turns red over anything clickable. */
export function Cursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const style = document.createElement('style');
    style.id = 'dexter-cursor';
    style.textContent = `
      html, body { cursor: ${DEFAULT} 3 2, auto; }
      a, button, [role="button"], .chip, .card.hover, label, select, summary, .slide-hit, input[type="range"], input[type="color"], input[type="checkbox"] { cursor: ${POINTER} 3 2, pointer !important; }
      input:not([type="range"]):not([type="color"]):not([type="checkbox"]), textarea, [contenteditable="true"] { cursor: text !important; }
      button:disabled { cursor: ${DEFAULT} 3 2, not-allowed !important; }
    `;
    document.head.appendChild(style);
    let last: Element | null = null;
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('a, button, [role="button"], .chip');
      if (el && el !== last) sfx.hover();
      last = el;
    };
    window.addEventListener('pointerover', over);
    return () => {
      style.remove();
      window.removeEventListener('pointerover', over);
    };
  }, []);
  return null;
}

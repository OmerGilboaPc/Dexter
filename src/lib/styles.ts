import React from 'react';
import { createStore, useStore } from './bus';

/**
 * Styling the admin can apply to any element (stored in settings/styles).
 * Keys: t:/f:/s: = editable texts (applied inline), e: = tagged elements, css: = any element by selector.
 */
export type TextStyle = {
  size?: number; // % zoom (affects layout)
  scale?: number; // % visual scale (does not affect layout)
  fontSize?: number;
  x?: number;
  y?: number;
  rotate?: number;
  skew?: number;
  color?: string;
  font?: '' | 'display' | 'body' | 'serif' | 'mono' | 'type';
  weight?: number;
  italic?: boolean;
  uppercase?: '' | 'upper' | 'lower' | 'none';
  letterSpacing?: number;
  lineHeight?: number;
  align?: '' | 'left' | 'center' | 'right';
  opacity?: number;
  maxWidth?: number;
  width?: number;
  height?: number;
  glow?: number;
  glowColor?: string;
  stroke?: number;
  bg?: string;
  radius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: number;
  padding?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  grayscale?: number;
  blur?: number;
  hue?: number;
  hidden?: boolean;
};

const FONT_VAR: Record<string, string> = { display: 'var(--f-display)', body: 'var(--f-body)', serif: 'var(--f-serif)', mono: 'var(--f-mono)', type: 'var(--f-type)' };

export function styleToCss(s?: TextStyle | null, inlineText = true): React.CSSProperties {
  if (!s) return {};
  const css: any = {};
  const tf: string[] = [];
  if (s.x || s.y) tf.push(`translate(${s.x || 0}px, ${s.y || 0}px)`);
  if (s.rotate) tf.push(`rotate(${s.rotate}deg)`);
  if (s.skew) tf.push(`skewX(${s.skew}deg)`);
  if (s.scale && s.scale !== 100) tf.push(`scale(${s.scale / 100})`);
  if (tf.length) {
    css.transform = tf.join(' ');
    if (inlineText) {
      css.display = 'inline-block';
      css.transformOrigin = 'left center';
    }
  }
  if (s.fontSize) css.fontSize = `${s.fontSize}px`;
  else if (s.size && s.size !== 100) {
    css.zoom = s.size / 100;
    if (inlineText) css.display = css.display || 'inline-block';
  }
  if (s.color) css.color = s.color;
  if (s.font) css.fontFamily = FONT_VAR[s.font];
  if (s.weight) css.fontWeight = s.weight;
  if (s.italic) css.fontStyle = 'italic';
  if (s.uppercase === 'upper') css.textTransform = 'uppercase';
  if (s.uppercase === 'lower') css.textTransform = 'lowercase';
  if (s.uppercase === 'none') css.textTransform = 'none';
  if (s.letterSpacing != null && s.letterSpacing !== 0) css.letterSpacing = `${s.letterSpacing}em`;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.align) css.textAlign = s.align;
  if (s.opacity != null && s.opacity < 1) css.opacity = s.opacity;
  if (s.maxWidth) css.maxWidth = `${s.maxWidth}px`;
  if (s.width) css.width = `${s.width}px`;
  if (s.height) css.height = `${s.height}px`;
  const shadows: string[] = [];
  if (s.glow) css.textShadow = `0 0 ${s.glow}px ${s.glowColor || 'var(--blood-bright)'}`;
  if (s.shadow) shadows.push(`0 ${Math.round(s.shadow / 2)}px ${s.shadow}px rgba(0,0,0,.7)`);
  if (shadows.length) css.boxShadow = shadows.join(', ');
  if (s.stroke) css.WebkitTextStroke = `${s.stroke}px ${s.color || 'currentColor'}`;
  if (s.bg) css.background = s.bg;
  if (s.radius != null && s.radius >= 0 && s.radius !== undefined) css.borderRadius = `${s.radius}px`;
  if (s.borderWidth) css.border = `${s.borderWidth}px solid ${s.borderColor || 'var(--blood)'}`;
  if (s.padding) css.padding = `${s.padding}px`;
  const f: string[] = [];
  if (s.brightness != null && s.brightness !== 100) f.push(`brightness(${s.brightness}%)`);
  if (s.contrast != null && s.contrast !== 100) f.push(`contrast(${s.contrast}%)`);
  if (s.saturate != null && s.saturate !== 100) f.push(`saturate(${s.saturate}%)`);
  if (s.grayscale) f.push(`grayscale(${s.grayscale}%)`);
  if (s.blur) f.push(`blur(${s.blur}px)`);
  if (s.hue) f.push(`hue-rotate(${s.hue}deg)`);
  if (f.length) css.filter = f.join(' ');
  if (s.hidden) css.display = 'none';
  return css;
}

const kebab = (k: string) => (k.startsWith('Webkit') ? '-webkit-' + k.slice(6) : k).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

/** CSS rule body (with !important so it beats inline styles). */
export function styleToCssText(s?: TextStyle | null) {
  const css = styleToCss(s, false) as any;
  return Object.entries(css)
    .map(([k, v]) => `${kebab(k)}: ${v} !important;`)
    .join(' ');
}

export const selectorFor = (key: string) => (key.startsWith('css:') ? key.slice(4) : `[data-sk=${JSON.stringify(key)}]`);
export const isElementKey = (key: string) => key.startsWith('e:') || key.startsWith('css:');

// Live, unsaved preview while the admin drags sliders.
export const stylePreview = createStore<Record<string, TextStyle | null>>({});
// Which element the admin is pointing at / editing.
export type StyleTarget = { key: string; label: string; el: HTMLElement | null; open: boolean; kind: 'text' | 'element' | 'image' };
export const styleTarget = createStore<StyleTarget | null>(null);
export const usePreview = () => useStore(stylePreview);

/** Elements that only exist in Edit Mode (they must not shift positions of the real content). */
export const EDIT_ONLY = '[data-edit-only], .edit-media';
const REAL = `:not(${EDIT_ONLY})`;

/** Build a stable selector for any element, scoped to the current page. Edit-only elements are not counted, so it matches with or without Edit Mode. */
export function autoSelector(el: HTMLElement): string {
  const parts: string[] = [];
  let cur: HTMLElement | null = el;
  while (cur && cur.parentElement) {
    if (cur.matches('main[data-route]')) {
      parts.unshift(`main[data-route=${JSON.stringify(cur.getAttribute('data-route'))}]`);
      return parts.join(' > ');
    }
    if (cur.id === 'root') {
      parts.unshift('#root');
      return parts.join(' > ');
    }
    if (cur.dataset.sk && cur !== el) {
      parts.unshift(selectorFor(cur.dataset.sk));
      return parts.join(' > ');
    }
    const p: HTMLElement = cur.parentElement;
    const real = Array.prototype.filter.call(p.children, (c: Element) => !c.matches(EDIT_ONLY)) as Element[];
    const idx = real.indexOf(cur) + 1;
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${idx} of ${REAL})`);
    cur = p;
  }
  return parts.join(' > ');
}

/** Selectors saved before edit-only elements were ignored (they break outside Edit Mode). */
export const isLegacyKey = (k: string) => k.startsWith('css:') && k.includes(':nth-child(') && !k.includes(' of ');

export const describeEl = (el: HTMLElement) => {
  const tag = el.tagName.toLowerCase();
  const txt = (el.innerText || el.getAttribute('alt') || '').trim().slice(0, 30);
  return `${tag}${txt ? ` “${txt}”` : ''}`;
};

export const kindOfEl = (el: HTMLElement): StyleTarget['kind'] => (el.matches('img, video, canvas, svg, .visual, .media-card, .media') ? 'image' : el.closest('a, button, .btn, .card, section, div') && !el.isContentEditable ? 'element' : 'text');

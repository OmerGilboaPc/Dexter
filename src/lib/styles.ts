import React from 'react';
import { createStore, useStore } from './bus';

/** Per-element text styling the admin can set on any editable text (stored in settings/styles). */
export type TextStyle = {
  size?: number; // % zoom of the original size (100 = unchanged)
  fontSize?: number; // absolute px (overrides size when set)
  x?: number; // px
  y?: number; // px
  rotate?: number; // deg
  skew?: number; // deg
  color?: string;
  font?: '' | 'display' | 'body' | 'serif' | 'mono' | 'type';
  weight?: number;
  italic?: boolean;
  uppercase?: '' | 'upper' | 'lower' | 'none';
  letterSpacing?: number; // em
  lineHeight?: number;
  align?: '' | 'left' | 'center' | 'right';
  opacity?: number; // 0-1
  maxWidth?: number; // px
  glow?: number; // px of text-shadow glow
  glowColor?: string;
  stroke?: number; // px outline
  hidden?: boolean;
};

const FONT_VAR: Record<string, string> = { display: 'var(--f-display)', body: 'var(--f-body)', serif: 'var(--f-serif)', mono: 'var(--f-mono)', type: 'var(--f-type)' };

export function styleToCss(s?: TextStyle | null): React.CSSProperties {
  if (!s) return {};
  const css: any = {};
  const tf: string[] = [];
  if (s.x || s.y) tf.push(`translate(${s.x || 0}px, ${s.y || 0}px)`);
  if (s.rotate) tf.push(`rotate(${s.rotate}deg)`);
  if (s.skew) tf.push(`skewX(${s.skew}deg)`);
  if (tf.length) {
    css.transform = tf.join(' ');
    css.display = 'inline-block';
    css.transformOrigin = 'left center';
  }
  if (s.fontSize) css.fontSize = `${s.fontSize}px`;
  else if (s.size && s.size !== 100) {
    css.zoom = s.size / 100;
    css.display = css.display || 'inline-block';
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
  if (s.glow) css.textShadow = `0 0 ${s.glow}px ${s.glowColor || 'var(--blood-bright)'}`;
  if (s.stroke) css.WebkitTextStroke = `${s.stroke}px ${s.color || 'currentColor'}`;
  if (s.hidden) css.display = 'none';
  return css;
}

// Live, unsaved preview while the admin drags sliders.
export const stylePreview = createStore<Record<string, TextStyle | null>>({});
// Which editable text the admin is pointing at / editing.
export const styleTarget = createStore<{ key: string; label: string; el: HTMLElement | null; open: boolean } | null>(null);

export const usePreview = () => useStore(stylePreview);

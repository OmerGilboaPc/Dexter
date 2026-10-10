import React from 'react';
import { useCms } from '../lib/cms';

/** The DEXTER wordmark: uses the uploaded logo when one is set, otherwise a drawn version with a blood drip. */
export function Logo({ height = 30, src, text, onClick }: { height?: number; src?: string; text?: string; onClick?: () => void }) {
  const { settings } = useCms();
  const url = src ?? settings.brand.logoUrl;
  const word = (text ?? settings.brand.logoText ?? 'DEXTER').toUpperCase();
  if (url) return <img src={url} alt={word} style={{ height, width: 'auto', display: 'block' }} onClick={onClick} />;
  const w = word.length * 0.62 * 100;
  return (
    <svg viewBox={`0 0 ${w} 120`} style={{ height: height * 1.25, width: 'auto', display: 'block', overflow: 'visible' }} onClick={onClick} aria-label={word}>
      <defs>
        <linearGradient id="logo-blood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff3341" />
          <stop offset="1" stopColor="#8f0a12" />
        </linearGradient>
      </defs>
      <text x={w / 2} y="92" textAnchor="middle" fontFamily="var(--f-display)" fontSize="112" letterSpacing="6" fill="#f2eee8">
        {word}
      </text>
      {/* drip from the middle letter */}
      <g fill="url(#logo-blood)">
        <path d={`M${w / 2 - 8} 86 q8 -6 16 0 v6 q-2 3 -3 10 q-2 16 -5 16 q-3 0 -5 -16 q-1 -7 -3 -10z`}>
          <animate attributeName="opacity" values="1;1;1" dur="4s" repeatCount="indefinite" />
        </path>
        <ellipse cx={w / 2} cy="118" rx="3.2" ry="4.2">
          <animate attributeName="cy" values="114;160;160" keyTimes="0;0.6;1" dur="3.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;0" keyTimes="0;0.6;1" dur="3.6s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}

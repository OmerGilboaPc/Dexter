import React, { useMemo, useState } from 'react';
import { seeded, initials, isVideo, cx } from '../lib/util';

/** Generative blood-spatter art used whenever no image has been uploaded yet. */
export function SpatterArt({ seed, accent = '#c1121f', label, mode = 'mono' }: { seed: string; accent?: string; label?: string; mode?: 'mono' | 'name' | 'none' }) {
  const shapes = useMemo(() => {
    const r = seeded(seed || 'dexter');
    const cx0 = 30 + r() * 40;
    const cy0 = 25 + r() * 40;
    const drops: { x: number; y: number; rx: number; ry: number; rot: number; o: number }[] = [];
    const n = 26 + Math.floor(r() * 30);
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2;
      const dist = Math.pow(r(), 1.6) * 60;
      const size = Math.max(0.25, (1 - dist / 60) * (r() * 4.2 + 0.4));
      const elong = 1 + (dist / 60) * (1 + r() * 2.5);
      drops.push({ x: cx0 + Math.cos(ang) * dist, y: cy0 + Math.sin(ang) * dist, rx: size, ry: size * elong, rot: (ang * 180) / Math.PI + 90, o: 0.55 + r() * 0.45 });
    }
    return { drops, cx0, cy0, main: 6 + r() * 7, tilt: r() * 30 - 15 };
  }, [seed]);

  const id = useMemo(() => 'g' + Math.abs(Array.from(seed || 'x').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)), [seed]);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="30%" r="90%">
          <stop offset="0%" stopColor="#1f1a1c" />
          <stop offset="60%" stopColor="#0d0b0d" />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity=".35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-rough`}>
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-bg)`} />
      <circle cx={shapes.cx0} cy={shapes.cy0} r="40" fill={`url(#${id}-glow)`} />
      {mode !== 'none' && label && (
        <text
          x="50"
          y={mode === 'mono' ? 62 : 58}
          textAnchor="middle"
          fontFamily="Bebas Neue, Impact, sans-serif"
          fontSize={mode === 'mono' ? 44 : Math.min(22, 220 / Math.max(6, label.length))}
          fill="#ffffff"
          fillOpacity={mode === 'mono' ? 0.07 : 0.1}
          transform={`rotate(${shapes.tilt / 4} 50 50)`}
        >
          {mode === 'mono' ? initials(label) : label.toUpperCase()}
        </text>
      )}
      <g filter={`url(#${id}-rough)`} fill={accent} opacity={mode === 'none' ? 0.4 : 1}>
        <ellipse cx={shapes.cx0} cy={shapes.cy0} rx={shapes.main} ry={shapes.main * 0.9} opacity=".95" />
        {shapes.drops.map((d, i) => (
          <ellipse key={i} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} opacity={d.o} transform={`rotate(${d.rot} ${d.x} ${d.y})`} />
        ))}
      </g>
    </svg>
  );
}

type VisualProps = {
  src?: string;
  seed?: string;
  label?: string;
  accent?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
  position?: string;
  mode?: 'mono' | 'name' | 'none';
  video?: boolean;
  controls?: boolean;
  dim?: number;
};

export function Visual({ src, seed, label, accent, alt, className, style, fit = 'cover', position = 'center', mode = 'mono', controls, dim }: VisualProps) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const base: React.CSSProperties = { width: '100%', height: '100%', objectFit: fit, objectPosition: position, display: 'block' };
  return (
    <div className={cx('visual', className)} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {(!src || err || !loaded) && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SpatterArt seed={seed || label || 'x'} accent={accent} label={label} mode={mode} />
        </div>
      )}
      {src && !err &&
        (isVideo(src) ? (
          <video
            src={src}
            style={{ ...base, position: 'absolute', inset: 0, opacity: loaded ? 1 : 0, transition: 'opacity .8s' }}
            autoPlay={!controls}
            muted={!controls}
            loop={!controls}
            controls={controls}
            playsInline
            onLoadedData={() => setLoaded(true)}
            onError={() => setErr(true)}
          />
        ) : (
          <img
            src={src}
            alt={alt || label || ''}
            loading="lazy"
            style={{ ...base, position: 'absolute', inset: 0, opacity: loaded ? 1 : 0, transition: 'opacity .8s' }}
            onLoad={() => setLoaded(true)}
            onError={() => setErr(true)}
          />
        ))}
      {dim ? <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})` }} /> : null}
    </div>
  );
}

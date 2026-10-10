import React, { useMemo, useState } from 'react';
import { seeded, initials, isVideo, cx } from '../lib/util';

/** Clean cinematic placeholder used whenever no image has been uploaded yet. */
export function SpatterArt({ seed, accent = '#d90f1e', label, mode = 'mono' }: { seed: string; accent?: string; label?: string; mode?: 'mono' | 'name' | 'none' }) {
  const g = useMemo(() => {
    const r = seeded(seed || 'dexter');
    return { gx: 15 + r() * 70, gy: 10 + r() * 50, ang: Math.round(r() * 40 - 20) };
  }, [seed]);
  const text = mode === 'mono' ? initials(label || '') : (label || '').toUpperCase();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: `radial-gradient(120% 90% at ${g.gx}% ${g.gy}%, ${accent}2e 0%, transparent 55%), linear-gradient(${160 + g.ang}deg, #17161a 0%, #0c0c0f 55%, #060607 100%)` }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 1px, transparent 1px 14px)' }} />
      {mode !== 'none' && text && (
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            bottom: mode === 'mono' ? '18%' : '42%',
            fontFamily: 'var(--f-display)',
            fontSize: mode === 'mono' ? 'min(46cqw, 60cqh)' : 'min(15cqw, 14cqh)',
            overflowWrap: 'anywhere',
            lineHeight: 0.9,
            letterSpacing: '.04em',
            color: 'rgba(255,255,255,.06)',
            textAlign: mode === 'mono' ? 'right' : 'left',
            whiteSpace: mode === 'mono' ? 'nowrap' : 'normal',
          }}
        >
          {text}
        </div>
      )}
      {mode !== 'none' && <div style={{ position: 'absolute', left: '8%', bottom: '10%', width: 34, height: 2, background: accent, boxShadow: `0 0 14px ${accent}` }} />}
    </div>
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

import React, { useState } from 'react';
import { useSpoilers, Marker } from '../lib/spoilers';
import { cx } from '../lib/util';
import { sfx } from '../lib/sound';

/** Blurs its children with a warning when the marker is beyond the user's viewing progress. Click to reveal. */
export function Spoiler({ marker, children, className, style, compact }: { marker: Marker; children: React.ReactNode; className?: string; style?: React.CSSProperties; compact?: boolean }) {
  const { isSpoiler, label } = useSpoilers();
  const [revealed, setRevealed] = useState(false);
  if (!isSpoiler(marker) || revealed) return <>{children}</>;
  return (
    <div className={cx('spoiler', className)} style={style}>
      <div className="spoiler-content" aria-hidden>
        {children}
      </div>
      <div
        className="spoiler-veil"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          sfx.slash();
          setRevealed(true);
        }}
      >
        <span className="badge red">⚠ Spoiler · {label(marker)}</span>
        {!compact && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Click to reveal</span>}
      </div>
    </div>
  );
}

/** Text-level spoiler: replaces the text with a redaction bar until clicked. */
export function SpoilerText({ marker, children }: { marker: Marker; children: React.ReactNode }) {
  const { isSpoiler, label } = useSpoilers();
  const [revealed, setRevealed] = useState(false);
  if (!isSpoiler(marker) || revealed) return <>{children}</>;
  return (
    <span
      title={`Spoiler · ${label(marker)} · click to reveal`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setRevealed(true);
      }}
      style={{ background: '#1d1d24', color: 'transparent', borderRadius: 4, cursor: 'pointer', padding: '0 4px', filter: 'blur(0.5px)', userSelect: 'none' }}
    >
      {children}
    </span>
  );
}

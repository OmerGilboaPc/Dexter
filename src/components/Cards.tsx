import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Visual } from './Visual';
import { Spoiler } from './Spoiler';
import { useCms } from '../lib/cms';
import { useSpoilers } from '../lib/spoilers';
import { sfx } from '../lib/sound';
import { cx } from '../lib/util';

/** Mouse-follow 3D tilt for cards. */
export function Tilt({ children, className, style, max = 8 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={className}
      style={{ transformStyle: 'preserve-3d', transition: 'transform .6s cubic-bezier(.22,1,.36,1)', willChange: 'transform', ...style }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        ref.current!.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(0)`;
        ref.current!.style.transition = 'transform .12s linear';
      }}
      onMouseLeave={() => {
        ref.current!.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
        ref.current!.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)';
      }}
    >
      {children}
    </div>
  );
}

export function CharacterCard({ c, size = 'md' }: { c: any; size?: 'md' | 'lg' }) {
  return (
    <Tilt>
      <Link to={`/characters/${c.id}`} className="media-card portrait-ratio" style={{ display: 'block', boxShadow: '0 30px 60px -30px rgba(0,0,0,.9)' }} onMouseEnter={() => sfx.hover()}>
        <div className="media">
          <Visual src={c.portrait || c.heroImage} seed={c.id} label={c.name} accent={c.color || '#d90f1e'} position="center top" />
        </div>
        <div className="shade" />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 50%, ${c.color || '#d90f1e'}33 100%)`, zIndex: 1, mixBlendMode: 'screen' }} />
        <div className="meta">
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.25em', color: c.color || 'var(--gold)', textTransform: 'uppercase' }}>
            {c.actor}
          </div>
          <div className="display" style={{ fontSize: size === 'lg' ? 46 : 36, marginTop: 6 }}>
            {c.name}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {c.role}
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function VillainCard({ v }: { v: any }) {
  const { col } = useCms();
  const { isSpoiler } = useSpoilers();
  const s = col('series').find((x) => x.id === v.series);
  const hidden = isSpoiler(v.identitySpoiler);
  return (
    <Tilt max={6}>
      <Link to={`/villains/${v.id}`} className="card hover" style={{ display: 'block', background: '#0f0d0b', borderColor: 'rgba(217,164,65,.18)' }}>
        <div style={{ position: 'relative', aspectRatio: '4/5' }}>
          <Visual src={v.image} seed={v.id} label={v.name} accent={s?.theme?.accent} mode="name" style={{ position: 'absolute', inset: 0, filter: 'grayscale(.5) contrast(1.1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(10,8,6,.95))' }} />
          <div style={{ position: 'absolute', top: 14, left: 14 }} className="badge gold">
            CASE {v.caseNumber}
          </div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
            <div className="type" style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '.1em' }}>
              {s?.short} · {v.actor}
            </div>
            <div className="display" style={{ fontSize: 34, marginTop: 4 }}>
              {v.name}
            </div>
            <div className="type" style={{ fontSize: 13, color: '#bdb8b0', marginTop: 4, filter: hidden ? 'blur(6px)' : 'none' }}>
              {v.realName}
            </div>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function SeasonCard({ s }: { s: any }) {
  const { col } = useCms();
  const ser = col('series').find((x) => x.id === s.series);
  return (
    <Tilt max={7}>
      <Link to={`/seasons/${s.id}`} className="media-card poster-ratio" style={{ display: 'block' }}>
        <div className="media">
          <Visual src={s.poster || s.heroImage} seed={s.id} label={s.series === 'dexter' ? `S${s.number}` : ser?.short} accent={ser?.theme?.accent} mode="name" />
        </div>
        <div className="shade" />
        <div className="meta">
          <div className="kicker" style={{ color: ser?.theme?.accent2, fontSize: 10 }}>
            {ser?.short} · {s.year}
          </div>
          <div className="display" style={{ fontSize: 40, marginTop: 6 }}>
            {s.title}
          </div>
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: '#cfcac2' }}>
            {s.tagline}
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function VictimCard({ v, onClick }: { v: any; onClick?: () => void }) {
  return (
    <Spoiler marker={{ series: v.series, season: v.season, episode: v.episode }} compact>
      <button onClick={onClick} className={cx('card hover')} style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
        <div style={{ display: 'flex', gap: 14, padding: 16, alignItems: 'center' }}>
          <div style={{ width: 54, height: 22, borderRadius: 3, background: 'linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.14))', border: '1px solid rgba(255,255,255,.15)', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 21, top: 6, width: 10, height: 9, borderRadius: '50%', background: v.killer === 'brian' ? '#7cc4ff' : 'var(--blood)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{v.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              S{v.season}
              {v.episode ? `E${v.episode}` : ''} · {v.method}
            </div>
          </div>
        </div>
      </button>
    </Spoiler>
  );
}

/** Horizontal scrolling rail with arrow buttons. */
export function Rail({ children, min = 240 }: { children: React.ReactNode; min?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <div className="rail-wrap">
      <div ref={ref} className="rail" style={{ gridAutoColumns: `minmax(${min}px, ${min + 60}px)` }}>
        {children}
      </div>
      <div className="row" style={{ position: 'absolute', top: -70, right: 0 }}>
        <button className="btn btn-icon btn-sm" onClick={() => by(-1)}>
          ←
        </button>
        <button className="btn btn-icon btn-sm" onClick={() => by(1)}>
          →
        </button>
      </div>
    </div>
  );
}

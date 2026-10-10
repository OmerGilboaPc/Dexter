import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useSpoilers } from '../lib/spoilers';
import { sfx } from '../lib/sound';

type Hit = { type: string; title: string; sub?: string; to: string; marker?: any };

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { col } = useCms();
  const { isSpoiler, label } = useSpoilers();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const index: Hit[] = useMemo(() => {
    const out: Hit[] = [];
    col('characters').forEach((c) => out.push({ type: 'Character', title: c.name, sub: c.actor, to: `/characters/${c.id}` }));
    col('villains').forEach((v) => out.push({ type: 'Villain', title: v.name, sub: v.realName, to: `/villains/${v.id}`, marker: v.identitySpoiler }));
    col('series').forEach((s) => out.push({ type: 'Series', title: s.name, sub: s.years, to: `/series/${s.id}` }));
    col('seasons').forEach((s) => {
      const ser = col('series').find((x) => x.id === s.series);
      out.push({ type: 'Season', title: `${ser?.short || ''} · ${s.title}`, sub: s.year, to: `/seasons/${s.id}` });
      (s.episodes || []).forEach((e: any) => out.push({ type: 'Episode', title: e.title, sub: `${ser?.short || ''} S${s.number}E${e.n}`, to: `/seasons/${s.id}#ep-${e.n}`, marker: { series: s.series, season: s.number, episode: e.n } }));
    });
    col('victims').forEach((v) => out.push({ type: 'Victim', title: v.name, sub: v.reason, to: `/kill-count?v=${v.id}`, marker: { series: v.series, season: v.season, episode: v.episode } }));
    col('quotes').forEach((x) => out.push({ type: 'Quote', title: `“${x.text}”`, sub: x.by, to: `/quotes#${x.id}`, marker: { series: x.series, season: x.season, episode: x.episode } }));
    col('locations').forEach((l) => out.push({ type: 'Location', title: l.name, sub: l.text, to: `/map?l=${l.id}`, marker: l.spoiler }));
    col('pages').forEach((p) => out.push({ type: 'Page', title: p.title, to: `/p/${p.slug || p.id}` }));
    [
      ['Kill Room 3D', '/kill-room'],
      ['Trivia', '/games/trivia'],
      ['Which Character Are You?', '/games/quiz'],
      ['Blood Spatter Lab', '/games/blood-spatter'],
      ['Catch the Killer', '/games/catch-the-killer'],
      ['Harry’s Code', '/code'],
      ['Timeline', '/timeline'],
      ['Map', '/map'],
      ['Trailer', '/trailer'],
      ['Gallery', '/gallery'],
      ['Leaderboard', '/leaderboard'],
      ['Behind the Scenes', '/behind-the-scenes'],
    ].forEach(([t, to]) => out.push({ type: 'Page', title: t, to }));
    return out;
  }, [col]);

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return index.filter((h) => h.type === 'Character' || h.type === 'Page').slice(0, 12);
    return index
      .map((h) => {
        const t = h.title.toLowerCase();
        const score = t.startsWith(s) ? 3 : t.includes(s) ? 2 : (h.sub || '').toLowerCase().includes(s) ? 1 : 0;
        return { h, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.h);
  }, [q, index]);

  const go = (h: Hit) => {
    sfx.click();
    onClose();
    nav(h.to);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-back" style={{ alignItems: 'start', paddingTop: '12vh' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div className="glass" style={{ width: 'min(760px, 100%)', borderRadius: 20, overflow: 'hidden' }} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 20, color: 'var(--blood-bright)' }}>⌕</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSel((s) => Math.min(hits.length - 1, s + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  } else if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
                  else if (e.key === 'Escape') onClose();
                }}
                placeholder="Search characters, episodes, victims, quotes…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 19, color: '#fff' }}
              />
              <span className="kbd">ESC</span>
            </div>
            <div style={{ maxHeight: '56vh', overflow: 'auto', padding: 8 }}>
              {hits.length === 0 && <div className="muted" style={{ padding: 30, textAlign: 'center' }}>No evidence found.</div>}
              {hits.map((h, i) => {
                const spoil = h.marker && isSpoiler(h.marker);
                return (
                  <button
                    key={h.type + h.to + i}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(h)}
                    style={{ display: 'flex', width: '100%', gap: 14, alignItems: 'center', textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: i === sel ? 'rgba(193,18,31,.16)' : 'transparent' }}
                  >
                    <span className="badge" style={{ minWidth: 86, justifyContent: 'center' }}>
                      {h.type}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', filter: spoil ? 'blur(6px)' : 'none' }}>{h.title}</span>
                      {h.sub && <span className="muted" style={{ display: 'block', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', filter: spoil ? 'blur(5px)' : 'none' }}>{h.sub}</span>}
                    </span>
                    {spoil && <span className="badge red">Spoiler · {label(h.marker)}</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

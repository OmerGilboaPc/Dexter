import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { Visual } from '../components/Visual';
import { WorldFX } from '../components/WorldFX';
import { F, ItemMediaEdit, T } from '../components/Editable';
import { Reveal, SectionHead } from '../components/Chrome';
import { SeasonCard, VillainCard, CharacterCard, VictimCard } from '../components/Cards';
import { Spoiler } from '../components/Spoiler';
import { Rating } from '../components/Rating';
import { sfx } from '../lib/sound';
import NotFound from './NotFound';

export function SeasonsList() {
  const { col } = useCms();
  const series = col('series');
  const seasons = col('seasons');
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="seasons.kicker" d="11 seasons · 126 episodes" as="div" className="kicker red" />
        <T k="seasons.title" d="Seasons" as="h1" className="display h-lg" style={{ margin: '12px 0 20px' }} />
        <T k="seasons.sub" d="Choose a season to see its episodes, villain, characters, and kills." as="p" className="lead muted" />
        {series.map((s) => {
          const list = seasons.filter((x) => x.series === s.id);
          if (!list.length) return null;
          return (
            <div key={s.id} style={{ marginTop: 70 }}>
              <div className="row" style={{ marginBottom: 24, gap: 18 }}>
                <span style={{ width: 40, height: 2, background: s.theme?.accent }} />
                <h2 className="display" style={{ fontSize: 44, margin: 0 }}>
                  {s.name}
                </h2>
                <span className="mono muted" style={{ fontSize: 12, letterSpacing: '.2em' }}>
                  {s.years}
                </span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 }}>
                {list.map((x, i) => (
                  <Reveal key={x.id} delay={i * 0.04}>
                    <SeasonCard s={x} />
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SeasonDetail() {
  const { id } = useParams();
  const { item, col, saveItem } = useCms();
  const { profile, updateProfile, track } = useAuth();
  const s = item('seasons', id!);
  const [open, setOpen] = useState<number | null>(null);
  if (!s) return <NotFound />;
  const ser = item('series', s.series);
  const theme = ser?.theme || {};
  const villain = s.villain ? item('villains', s.villain) : null;
  const chars = (s.characters || []).map((c: string) => item('characters', c)).filter(Boolean);
  const victims = col('victims').filter((v) => v.series === s.series && v.season === s.number);
  const watched = profile?.watched || {};
  const watchedCount = (s.episodes || []).filter((e: any) => watched[`${s.id}:${e.n}`]).length;
  const seasons = col('seasons').filter((x) => x.series === s.series);
  const idx = seasons.findIndex((x) => x.id === s.id);

  const toggleWatched = (n: number) => {
    const key = `${s.id}:${n}`;
    const v = !watched[key];
    updateProfile({ watched: { [key]: v } });
    if (v) {
      sfx.drip();
      track('watched');
    }
  };
  const markAll = () => {
    const m: Record<string, boolean> = {};
    (s.episodes || []).forEach((e: any) => {
      m[`${s.id}:${e.n}`] = true;
      if (!watched[`${s.id}:${e.n}`]) track('watched');
    });
    updateProfile({ watched: m });
  };

  const updateEpisode = (i: number, field: string, value: string) => {
    const eps = [...(s.episodes || [])];
    eps[i] = { ...eps[i], [field]: value };
    saveItem('seasons', s.id, { ...s, episodes: eps }, { silent: true });
  };

  return (
    <div style={{ ['--accent' as any]: theme.accent }}>
      <section style={{ position: 'relative', minHeight: '86vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Visual src={s.heroImage || s.poster || ser?.heroImage} seed={s.id + '-hero'} accent={theme.accent} mode="none" style={{ width: '100%', height: '100%' }} />
        </div>
        <WorldFX effect={theme.effect} intensity={0.8} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,7,10,.4), transparent 30%, var(--bg) 100%), linear-gradient(90deg, rgba(7,7,10,.9), transparent 70%)' }} />
        <ItemMediaEdit col="seasons" item={s} path="heroImage" label="Hero" style={{ top: 'calc(var(--nav-h) + 16px)', right: 150 }} />
        <ItemMediaEdit col="seasons" item={s} path="poster" label="Poster" style={{ top: 'calc(var(--nav-h) + 16px)' }} />
        <div className="container" style={{ position: 'relative', paddingBottom: 70, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 50, alignItems: 'end' }}>
          <motion.div initial={{ opacity: 0, y: 40, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 1.1 }} className="media-card poster-ratio" style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,.9)' }}>
            <Visual src={s.poster} seed={s.id} label={s.series === 'dexter' ? `S${s.number}` : ser?.short} accent={theme.accent} mode="name" style={{ position: 'absolute', inset: 0 }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            <Link to={`/series/${ser?.id}`} className="kicker" style={{ color: theme.accent2 }}>
              {ser?.name} · {s.year}
            </Link>
            <F col="seasons" item={s} path="title" as="h1" className="display h-lg" style={{ margin: '10px 0 6px' }} />
            <F col="seasons" item={s} path="tagline" as="div" className="serif" style={{ fontSize: 32, fontStyle: 'italic' }} />
            <div className="row" style={{ marginTop: 20 }}>
              <span className="badge">{(s.episodes || []).length} episodes</span>
              {s.premiere && <span className="badge">Premiere: {s.premiere}</span>}
              {s.finale && <span className="badge">Finale: {s.finale}</span>}
              <span className="badge red">
                {watchedCount}/{(s.episodes || []).length} watched
              </span>
            </div>
            <div style={{ marginTop: 22 }}>
              <Rating target={`season:${s.id}`} />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="container grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 60, alignItems: 'start' }}>
          <div>
            <Reveal>
              <div className="kicker">Synopsis</div>
              <Spoiler marker={{ series: s.series, season: s.number, episode: 1 }}>
                <F col="seasons" item={s} path="synopsis" as="p" className="lead" multiline />
              </Spoiler>
            </Reveal>

            <div id="episodes" style={{ marginTop: 60 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 className="display" style={{ fontSize: 52, margin: 0 }}>
                  Episodes
                </h2>
                <button className="btn btn-sm" onClick={markAll}>
                  ✓ Mark whole season as watched
                </button>
              </div>
              {(s.episodes || []).map((e: any, i: number) => {
                const key = `${s.id}:${e.n}`;
                const isW = !!watched[key];
                const isOpen = open === e.n;
                return (
                  <div id={`ep-${e.n}`} key={e.n} style={{ borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 4px', cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : e.n)}>
                      <div className="display" style={{ fontSize: 40, width: 56, color: isW ? 'var(--blood-bright)' : 'rgba(255,255,255,.25)' }}>
                        {String(e.n).padStart(2, '0')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Spoiler marker={{ series: s.series, season: s.number, episode: e.n }} compact>
                          <div style={{ fontSize: 19, fontWeight: 600 }}>{e.title}</div>
                        </Spoiler>
                        <div className="mono muted" style={{ fontSize: 11, letterSpacing: '.15em' }}>
                          S{s.number}E{e.n}
                          {e.airDate ? ` · ${e.airDate}` : ''}
                        </div>
                      </div>
                      <button
                        className="btn btn-xs"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          toggleWatched(e.n);
                        }}
                        style={isW ? { background: 'var(--blood)', borderColor: 'var(--blood)', color: '#fff' } : undefined}
                      >
                        {isW ? '✓ Watched' : 'Mark watched'}
                      </button>
                      <span style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform .3s', fontSize: 22, color: 'var(--muted)' }}>+</span>
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '0 4px 24px 78px' }}>
                            <Spoiler marker={{ series: s.series, season: s.number, episode: e.n }}>
                              <EpisodeText value={e.synopsis} onSave={(v) => updateEpisode(i, 'synopsis', v)} />
                            </Spoiler>
                            <div style={{ marginTop: 14 }}>
                              <Rating target={`episode:${key}`} size={20} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <aside style={{ position: 'sticky', top: 'calc(var(--nav-h) + 20px)' }}>
            {villain && (
              <Reveal>
                <div className="kicker" style={{ marginBottom: 14 }}>
                  The season’s villain
                </div>
                <VillainCard v={villain} />
              </Reveal>
            )}
            {victims.length > 0 && (
              <Reveal delay={0.1}>
                <div className="kicker" style={{ margin: '34px 0 14px' }}>
                  Kills this season · {victims.length}
                </div>
                <div style={{ display: 'grid', gap: 8, maxHeight: 420, overflow: 'auto' }}>
                  {victims.map((v) => (
                    <Link key={v.id} to={`/kill-count?v=${v.id}`}>
                      <VictimCard v={v} />
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
            <div className="row" style={{ marginTop: 30, justifyContent: 'space-between' }}>
              {idx > 0 ? (
                <Link className="btn btn-sm" to={`/seasons/${seasons[idx - 1].id}`}>
                  ← {seasons[idx - 1].title}
                </Link>
              ) : (
                <span />
              )}
              {idx < seasons.length - 1 && (
                <Link className="btn btn-sm" to={`/seasons/${seasons[idx + 1].id}`}>
                  {seasons[idx + 1].title} →
                </Link>
              )}
            </div>
          </aside>
        </div>
      </section>

      {chars.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead tk="season.chars" kicker="Who appears this season" title="Characters" />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
              {chars.map((c: any) => (
                <CharacterCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EpisodeText({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const { editMode } = useCms();
  if (!editMode) return <p style={{ margin: 0, color: '#cfcac2', fontSize: 16, lineHeight: 1.8 }}>{value}</p>;
  return (
    <textarea
      className="textarea"
      defaultValue={value}
      onBlur={(e) => e.target.value !== value && onSave(e.target.value)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

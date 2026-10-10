import React, { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useCms } from '../lib/cms';
import { Visual } from '../components/Visual';
import { WorldFX } from '../components/WorldFX';
import { F, ItemMediaEdit, T, MediaEdit } from '../components/Editable';
import { Reveal, SectionHead } from '../components/Chrome';
import { CharacterCard } from '../components/Cards';
import { Spoiler, SpoilerText } from '../components/Spoiler';
import { sfx } from '../lib/sound';
import { cx } from '../lib/util';
import NotFound from './NotFound';

export function CharactersList() {
  const { col } = useCms();
  const series = col('series');
  const [f, setF] = useState('all');
  const list = col('characters').filter((c) => f === 'all' || (c.series || []).includes(f));
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="characters.kicker" d="The Family · The Department · The Monsters" as="div" className="kicker red" />
        <T k="characters.title" d="Characters" as="h1" className="display h-lg" style={{ margin: '12px 0 26px' }} />
        <div className="row" style={{ marginBottom: 40 }}>
          <button className={cx('chip', f === 'all' && 'on')} onClick={() => setF('all')}>
            All
          </button>
          {series.map((s) => (
            <button key={s.id} className={cx('chip', f === s.id && 'on')} onClick={() => setF(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 22 }}>
          {list.map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 0.06}>
              <CharacterCard c={c} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CharacterDetail() {
  const { id } = useParams();
  const { item } = useCms();
  const c = item('characters', id!);
  if (!c) return <NotFound />;
  if (c.layout === 'brian') return <BrianPage c={c} />;
  return <StandardPage c={c} mind={c.layout === 'dexter'} />;
}

// ----------------------------------------------------------------------------
function CharHero({ c, accent, children, fx }: { c: any; accent: string; children?: React.ReactNode; fx?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const op = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return (
    <section ref={ref} style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
      <motion.div style={{ position: 'absolute', inset: 0, y }}>
        <Visual src={c.heroImage || c.portrait} seed={c.id + '-hero'} label={c.name} accent={accent} mode="none" position="center 20%" style={{ width: '100%', height: '100%' }} />
      </motion.div>
      {fx && <WorldFX effect={fx} intensity={1} />}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,7,10,.35) 0%, transparent 35%, rgba(7,7,10,.75) 80%, var(--bg) 100%), linear-gradient(90deg, rgba(7,7,10,.85), transparent 65%)` }} />
      <ItemMediaEdit col="characters" item={c} path="heroImage" label="Hero" style={{ top: 'calc(var(--nav-h) + 16px)', right: 160 }} />
      <ItemMediaEdit col="characters" item={c} path="portrait" label="Portrait" style={{ top: 'calc(var(--nav-h) + 16px)' }} />
      <motion.div className="container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '13vh', opacity: op }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          <F col="characters" item={c} path="role" as="div" className="kicker" style={{ color: accent }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <F col="characters" item={c} path="name" as="h1" className="display" style={{ fontSize: 'clamp(80px, 13vw, 240px)', margin: '8px 0 0', lineHeight: 0.85 }} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}>
          <F col="characters" item={c} path="tagline" as="div" className="serif" style={{ fontSize: 'clamp(24px, 2.6vw, 40px)', fontStyle: 'italic', marginTop: 12 }} />
          <div className="row" style={{ marginTop: 20 }}>
            <span className="badge">
              Played by <F col="characters" item={c} path="actor" />
            </span>
            {c.alias && <span className="badge gold">{c.alias}</span>}
          </div>
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

function Overview({ c, accent }: { c: any; accent: string }) {
  const { col } = useCms();
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 70, alignItems: 'start' }}>
        <Reveal>
          <div className="kicker" style={{ color: accent }}>
            Biography
          </div>
          <F col="characters" item={c} path="bio" as="div" className="prose" style={{ marginTop: 18 }} multiline />
          {c.altActors && (
            <p className="muted" style={{ fontSize: 14 }}>
              Also played by: <F col="characters" item={c} path="altActors" />
            </p>
          )}
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card card-pad">
            <div className="kicker" style={{ color: accent, marginBottom: 12 }}>
              File
            </div>
            {(c.stats || []).map((st: any, i: number) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="mono muted" style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase' }}>
                  <F col="characters" item={c} path={`stats.${i}.label`} />
                </div>
                <F col="characters" item={c} path={`stats.${i}.value`} as="div" style={{ marginTop: 4 }} />
              </div>
            ))}
            <div style={{ padding: '14px 0 0' }}>
              <div className="mono muted" style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: 8 }}>
                Appearances
              </div>
              {(c.appearances || []).map((a: any, i: number) => {
                const s = col('series').find((x) => x.id === a.series);
                return (
                  <Link key={i} to={`/series/${a.series}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', fontSize: 14 }}>
                    <span style={{ color: s?.theme?.accent2 || '#fff' }}>{s?.name || a.series}</span>
                    <span className="muted" style={{ textAlign: 'right' }}>
                      {a.note}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Relationships({ c, accent }: { c: any; accent: string }) {
  const { item } = useCms();
  const rel = (c.relationships || []).map((r: any) => ({ ...r, c: item('characters', r.id) })).filter((r: any) => r.c);
  if (!rel.length) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <SectionHead tk={`char.${c.id}.rel`} kicker="Relationships" title="The people around them" />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {rel.map((r: any, i: number) => (
            <Reveal key={r.id} delay={i * 0.04}>
              <Link to={`/characters/${r.id}`} className="card hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                  <Visual src={r.c.portrait || r.c.heroImage} seed={r.c.id} label={r.c.name} accent={r.c.color} style={{ width: '100%', height: '100%' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.c.name}</div>
                  <div style={{ fontSize: 13, color: accent }}>{r.label}</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonalTimeline({ c, accent }: { c: any; accent: string }) {
  if (!(c.timeline || []).length) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <SectionHead tk={`char.${c.id}.tl`} kicker="Chronology" title="Personal timeline" />
        <div style={{ position: 'relative', paddingLeft: 40 }}>
          <div style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 1, background: `linear-gradient(${accent}, transparent)` }} />
          {c.timeline.map((t: any, i: number) => (
            <Reveal key={i} delay={i * 0.05}>
              <div style={{ position: 'relative', paddingBottom: 30 }}>
                <span style={{ position: 'absolute', left: -38, top: 6, width: 14, height: 14, borderRadius: '50%', background: accent, boxShadow: `0 0 18px ${accent}` }} />
                <div className="mono" style={{ fontSize: 12, letterSpacing: '.2em', color: accent }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 17, marginTop: 4, color: '#d6d1c9' }}>
                  <SpoilerText marker={t.spoiler}>{t.text}</SpoilerText>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuotesBlock({ c }: { c: any }) {
  const { col } = useCms();
  const extra = col('quotes').filter((q) => q.by === c.id);
  const all = [...new Set([...(c.quotes || []), ...extra.map((q) => q.text)])];
  if (!all.length) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <SectionHead tk={`char.${c.id}.quotes`} kicker="In their own words" title="Quotes" />
        <div className="grid g2">
          {all.slice(0, 6).map((q, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="card card-pad" style={{ height: '100%' }}>
                <div className="serif" style={{ fontSize: 28, fontStyle: 'italic', lineHeight: 1.3 }}>
                  “{q}”
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery({ c }: { c: any }) {
  const { patchItem, editMode } = useCms();
  const [lb, setLb] = useState<string | null>(null);
  const g: string[] = c.gallery || [];
  if (!g.length && !editMode) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <SectionHead tk={`char.${c.id}.gallery`} kicker="Gallery" title="Images">
          {editMode && (
            <div style={{ position: 'relative', width: 140, height: 40 }}>
              <MediaEdit label="Add" onPick={(u) => u && patchItem('characters', c.id, 'gallery', [...g, u])} style={{ top: 0, right: 0 }} />
            </div>
          )}
        </SectionHead>
        <div style={{ columns: '3 280px', gap: 16 }}>
          {g.map((u, i) => (
            <div key={i} style={{ breakInside: 'avoid', marginBottom: 16, position: 'relative' }}>
              <img src={u} alt="" onClick={() => setLb(u)} style={{ width: '100%', borderRadius: 12, cursor: 'zoom-in' }} />
              {editMode && (
                <button className="btn btn-xs btn-danger" style={{ position: 'absolute', top: 10, right: 10, background: '#000' }} onClick={() => patchItem('characters', c.id, 'gallery', g.filter((_, j) => j !== i))}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {lb && (
          <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLb(null)}>
            <img src={lb} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 14 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Fate({ c, accent }: { c: any; accent: string }) {
  if (!c.fate?.text) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <Reveal>
          <div className="card" style={{ padding: 'clamp(30px, 5vw, 70px)', textAlign: 'center', background: 'linear-gradient(160deg, #150709, #0b0b0f)', borderColor: `${accent}44` }}>
            <div className="kicker red">How it ends</div>
            <Spoiler marker={c.fate.spoiler}>
              <F col="characters" item={c} path="fate.text" as="div" className="serif" style={{ fontSize: 'clamp(26px, 3vw, 44px)', fontStyle: 'italic', marginTop: 20, lineHeight: 1.3 }} multiline />
            </Spoiler>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StandardPage({ c, mind }: { c: any; mind?: boolean }) {
  const accent = c.color || '#d90f1e';
  return (
    <div>
      <CharHero c={c} accent={accent} fx={mind ? 'embers' : undefined} />
      <Overview c={c} accent={accent} />
      {mind && <DexterMind c={c} />}
      <Relationships c={c} accent={accent} />
      <PersonalTimeline c={c} accent={accent} />
      <QuotesBlock c={c} />
      <Gallery c={c} />
      <Fate c={c} accent={accent} />
      <MoreCharacters current={c.id} />
    </div>
  );
}

function MoreCharacters({ current }: { current: string }) {
  const { col } = useCms();
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <SectionHead tk="char.more" kicker="Keep going" title="More characters" />
        <div className="grid g4">
          {col('characters')
            .filter((x) => x.id !== current)
            .slice(0, 4)
            .map((x) => (
              <CharacterCard key={x.id} c={x} />
            ))}
        </div>
      </div>
    </section>
  );
}

// ============================ DEXTER: Inside the Mind ============================
function DexterMind({ c }: { c: any }) {
  const { col } = useCms();
  const [passenger, setPassenger] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const lines: string[] = c.monologueLines || [];
  const kills = col('victims').filter((v) => v.killer === 'dexter');
  const byCode = kills.filter((v) => v.code).length;
  const bySeries = col('series').map((s) => ({ s, n: kills.filter((v) => v.series === s.id).length }));
  const max = Math.max(1, ...bySeries.map((x) => x.n));
  return (
    <>
      {/* Sticky scroll monologue */}
      <section ref={ref} style={{ height: `${Math.max(3, lines.length) * 60}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', placeItems: 'center', overflow: 'hidden', background: passenger ? 'radial-gradient(circle at center, #3a0006, #050000 70%)' : 'radial-gradient(circle at center, #14070a, var(--bg) 70%)', transition: 'background 1.2s' }}>
          <WorldFX effect="embers" intensity={passenger ? 1.6 : 0.6} />
          <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
            <div className="kicker red">Inside the mind of Dexter Morgan</div>
            <div style={{ position: 'relative', height: 260, marginTop: 30 }}>
              {lines.map((l, i) => (
                <MonologueLine key={i} text={l} i={i} n={lines.length} progress={scrollYProgress} passenger={passenger} />
              ))}
            </div>
            <button
              className={cx('btn', passenger && 'btn-primary')}
              style={{ marginTop: 40 }}
              onClick={() => {
                sfx.heartbeat();
                setPassenger(!passenger);
              }}
            >
              {passenger ? '☾ Dark Passenger: ON' : '☾ Let the Dark Passenger drive'}
            </button>
          </div>
        </div>
      </section>

      {/* The ritual */}
      <section className="section">
        <div className="container">
          <SectionHead tk="dexter.ritual" kicker="Method" title="The ritual" sub="Eight steps. Never skip one." />
          <div className="grid g4">
            {(c.ritual || []).map((r: any, i: number) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="card card-pad hover" style={{ height: '100%', background: 'linear-gradient(170deg, #160a0c, #0d0d12)' }}>
                  <div className="display" style={{ fontSize: 64, color: 'rgba(255,42,54,.25)', lineHeight: 1 }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <F col="characters" item={c} path={`ritual.${i}.step`} as="div" className="display" style={{ fontSize: 34, marginTop: 6 }} />
                  <F col="characters" item={c} path={`ritual.${i}.text`} as="p" className="muted" style={{ marginTop: 8 }} multiline />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid" style={{ gridTemplateColumns: '1fr 1.4fr', gap: 50, alignItems: 'center' }}>
          <Reveal>
            <div className="kicker red">By the numbers</div>
            <div className="display" style={{ fontSize: 'clamp(90px, 12vw, 200px)', lineHeight: 0.85, marginTop: 10 }}>
              {kills.length}
            </div>
            <div className="display h-sm">kills in the archive</div>
            <p className="muted">
              {Math.round((byCode / Math.max(1, kills.length)) * 100)}% of them by the code. The rest… let’s just say Harry wouldn’t be proud.
            </p>
            <div className="row">
              <Link to="/kill-count" className="btn btn-primary">
                Open the slide box
              </Link>
              <Link to="/code" className="btn">
                Harry’s Code
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card card-pad">
              {bySeries.map(({ s, n }) => (
                <div key={s.id} style={{ marginBottom: 18 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>{s.name}</span>
                    <span className="mono">{n}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${(n / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} style={{ height: '100%', background: s.theme?.accent || 'var(--blood)', borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function MonologueLine({ text, i, n, progress, passenger }: { text: string; i: number; n: number; progress: any; passenger: boolean }) {
  const start = i / n;
  const end = (i + 1) / n;
  const opacity = useTransform(progress, [start - 0.04, start + 0.03, end - 0.03, end + 0.02], [0, 1, 1, i === n - 1 ? 1 : 0]);
  const y = useTransform(progress, [start - 0.04, start + 0.03, end - 0.03, end + 0.02], [40, 0, 0, -40]);
  const blur = useTransform(progress, [start - 0.04, start + 0.03], ['blur(10px)', 'blur(0px)']);
  return (
    <motion.div className="serif" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity, y, filter: blur, fontSize: 'clamp(34px, 4.8vw, 82px)', fontStyle: 'italic', lineHeight: 1.1, color: passenger ? '#ff6b73' : '#f1ede6', textShadow: passenger ? '0 0 40px rgba(255,42,54,.6)' : 'none', transition: 'color 1s, text-shadow 1s' }}>
      {text}
    </motion.div>
  );
}

// ============================ BRIAN: the ice world ============================
function BrianPage({ c }: { c: any }) {
  const ice = '#9ed8ff';
  return (
    <div style={{ background: 'linear-gradient(180deg, #060b10 0%, #0a1118 40%, var(--bg) 100%)', ['--blood' as any]: '#7cc4ff' }}>
      <CharHero c={c} accent={ice} fx="ice">
        <div className="mono" style={{ marginTop: 26, fontSize: 11, letterSpacing: '.35em', color: '#9ed8ff99' }}>
          TEMPERATURE: −18°C · BLOOD: 0 ML
        </div>
      </CharHero>

      {/* The exhibit: the portrait, cut into perfect pieces */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: 70, alignItems: 'center' }}>
          <Reveal>
            <Exhibit c={c} />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="kicker" style={{ color: ice }}>
              The Exhibit
            </div>
            <F col="characters" item={c} path="bio" as="div" className="prose" style={{ marginTop: 18 }} multiline />
            <div className="grid g2" style={{ gap: 12, marginTop: 20 }}>
              {(c.stats || []).map((st: any, i: number) => (
                <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(158,216,255,.18)', background: 'rgba(158,216,255,.04)' }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '.22em', color: '#9ed8ffaa', textTransform: 'uppercase' }}>
                    <F col="characters" item={c} path={`stats.${i}.label`} />
                  </div>
                  <F col="characters" item={c} path={`stats.${i}.value`} as="div" style={{ marginTop: 4 }} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Chapters */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 1150 }}>
          <SectionHead tk="brian.chapters" kicker="His story" title="Seven chapters in ice" />
          {(c.chapters || []).map((ch: any, i: number) => (
            <Reveal key={i}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 30, padding: '38px 0', borderTop: '1px solid rgba(158,216,255,.14)' }}>
                <div className="display" style={{ fontSize: 90, lineHeight: 0.8, color: 'transparent', WebkitTextStroke: '1px rgba(158,216,255,.5)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <F col="characters" item={c} path={`chapters.${i}.title`} as="h3" className="display" style={{ fontSize: 48, margin: 0, color: '#e6f6ff' }} />
                  <Spoiler marker={ch.spoiler}>
                    <F col="characters" item={c} path={`chapters.${i}.text`} as="p" className="lead" style={{ marginTop: 10, color: '#c9e3f2' }} multiline />
                  </Spoiler>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Relationships c={c} accent={ice} />
      <PersonalTimeline c={c} accent={ice} />
      <Gallery c={c} />
      <Fate c={c} accent={ice} />

      {/* Final monologue */}
      {c.monologue && (
        <section className="section" style={{ position: 'relative', overflow: 'hidden', minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
          <WorldFX effect="ice" intensity={1.4} />
          <div className="container" style={{ maxWidth: 1100, textAlign: 'center', position: 'relative' }}>
            <div className="kicker" style={{ color: ice }}>
              Dexter, on his brother
            </div>
            <Spoiler marker={c.fate?.spoiler}>
              <F col="characters" item={c} path="monologue" as="div" className="serif" style={{ fontSize: 'clamp(30px, 3.6vw, 58px)', fontStyle: 'italic', lineHeight: 1.25, marginTop: 26, color: '#eef9ff' }} multiline />
            </Spoiler>
          </div>
        </section>
      )}
      <MoreCharacters current={c.id} />
    </div>
  );
}

/** Portrait sliced into evenly cut pieces that reassemble on hover. */
function Exhibit({ c }: { c: any }) {
  const [whole, setWhole] = useState(false);
  const N = 6;
  return (
    <div
      onMouseEnter={() => {
        setWhole(true);
        sfx.plastic();
      }}
      onMouseLeave={() => setWhole(false)}
      style={{ position: 'relative', aspectRatio: '3/4', cursor: 'pointer' }}
    >
      {Array.from({ length: N }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(i / N) * 100}%`,
            height: `${100 / N}%`,
            overflow: 'hidden',
            transform: whole ? 'none' : `translateX(${(i % 2 ? 1 : -1) * (8 + i * 3)}px) translateY(${i * 10 - 25}px)`,
            transition: `transform 1s cubic-bezier(.22,1,.36,1) ${i * 0.04}s`,
            boxShadow: whole ? 'none' : '0 10px 30px rgba(0,0,0,.6), 0 0 0 1px rgba(158,216,255,.2)',
          }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, top: `${-i * 100}%`, height: `${N * 100}%` }}>
            <Visual src={c.portrait || c.heroImage} seed={c.id} label={c.name} accent="#7cc4ff" position="center top" style={{ width: '100%', height: '100%', filter: 'saturate(.5) brightness(1.05) hue-rotate(-10deg)' }} />
          </div>
        </div>
      ))}
      <div className="mono" style={{ position: 'absolute', bottom: -34, left: 0, fontSize: 10, letterSpacing: '.3em', color: '#9ed8ff88' }}>
        {whole ? 'REASSEMBLED' : 'HOVER TO REASSEMBLE'}
      </div>
    </div>
  );
}

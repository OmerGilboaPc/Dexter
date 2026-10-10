import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { Visual } from '../components/Visual';
import { F, ItemMediaEdit, T, SText, SettingsMediaEdit } from '../components/Editable';
import { Reveal, SectionHead } from '../components/Chrome';
import { Spoiler } from '../components/Spoiler';
import { WorldFX } from '../components/WorldFX';
import { sfx, music } from '../lib/sound';
import { toast } from '../lib/bus';
import { cx, dayIndex, isVideo } from '../lib/util';

// ================================ QUOTES ================================
export function Quotes() {
  const { col } = useCms();
  const { track } = useAuth();
  const quotes = col('quotes');
  const chars = col('characters');
  const [who, setWho] = useState('all');
  const [q, setQ] = useState('');
  const [rand, setRand] = useState<any>(() => quotes[dayIndex() % Math.max(1, quotes.length)]);
  const people = useMemo(() => [...new Set(quotes.map((x) => x.by))], [quotes]);
  const name = (id: string) => chars.find((c) => c.id === id)?.name || (id === 'trinity' ? 'Arthur Mitchell' : id);
  const list = quotes.filter((x) => (who === 'all' || x.by === who) && (!q || x.text.toLowerCase().includes(q.toLowerCase())));
  const copy = (x: any) => {
    navigator.clipboard?.writeText(`“${x.text}” — ${name(x.by)}`);
    sfx.click();
    track('quote:copy');
    toast({ title: 'Copied', text: 'The quote is on your clipboard' }, 1800);
  };
  return (
    <div className="page">
      <section style={{ position: 'relative', padding: '90px 0 70px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(193,18,31,.18), transparent 60%)' }} />
        <div className="container" style={{ position: 'relative', maxWidth: 1100 }}>
          <T k="quotes.kicker" d="In his own words" as="div" className="kicker red" />
          {rand && (
            <motion.div key={rand.id} initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0)' }} transition={{ duration: 0.9 }}>
              <Spoiler marker={{ series: rand.series, season: rand.season, episode: rand.episode }}>
                <div className="quote-big" style={{ marginTop: 20, fontSize: 'clamp(36px, 5vw, 86px)' }}>
                  “{rand.text}”
                </div>
                <div className="mono muted" style={{ marginTop: 20, letterSpacing: '.25em', fontSize: 12 }}>
                  — {name(rand.by).toUpperCase()}
                </div>
              </Spoiler>
            </motion.div>
          )}
          <button
            className="btn"
            style={{ marginTop: 30 }}
            onClick={() => {
              sfx.whoosh();
              setRand(quotes[Math.floor(Math.random() * quotes.length)]);
            }}
          >
            ↻ Random quote
          </button>
        </div>
      </section>
      <div className="container">
        <div className="row" style={{ marginBottom: 30, gap: 10 }}>
          <input className="input" placeholder="Search quotes…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <button className={cx('chip', who === 'all' && 'on')} onClick={() => setWho('all')}>
            Everyone
          </button>
          {people.map((p) => (
            <button key={p} className={cx('chip', who === p && 'on')} onClick={() => setWho(p)}>
              {name(p)}
            </button>
          ))}
        </div>
        <div style={{ columns: '2 420px', gap: 20 }}>
          {list.map((x, i) => (
            <div id={x.id} key={x.id} style={{ breakInside: 'avoid', marginBottom: 20 }}>
              <Reveal delay={(i % 4) * 0.05}>
                <div className="card card-pad hover" style={{ position: 'relative' }}>
                  <Spoiler marker={{ series: x.series, season: x.season, episode: x.episode }}>
                    <F col="quotes" item={x} path="text" as="div" className="serif" style={{ fontSize: 30, fontStyle: 'italic', lineHeight: 1.25 }} multiline />
                    <div className="row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
                      <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--gold)' }}>
                        — {name(x.by).toUpperCase()} · S{x.season}
                        {x.episode ? `E${x.episode}` : ''}
                      </div>
                      <button className="btn btn-xs" onClick={() => copy(x)}>
                        ⧉ Copy
                      </button>
                    </div>
                  </Spoiler>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================ TIMELINE ================================
export function Timeline() {
  const { col } = useCms();
  const items = col('timeline');
  const series = col('series');
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60, maxWidth: 1200 }}>
        <T k="timeline.kicker" d="1973 → 2025" as="div" className="kicker red" />
        <T k="timeline.title" d="Timeline" as="h1" className="display h-lg" style={{ margin: '12px 0 20px' }} />
        <T k="timeline.sub" d="From the shipping container to New York, in order. Spoilers stay blurred according to your viewing progress." as="p" className="lead muted" />
        <div style={{ position: 'relative', marginTop: 80 }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, marginLeft: -1, background: 'linear-gradient(var(--blood), rgba(193,18,31,.1))' }} />
          {items.map((t, i) => {
            const s = series.find((x) => x.id === t.series);
            const left = i % 2 === 0;
            return (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', marginBottom: 50 }}>
                <div style={{ gridColumn: left ? 1 : 3, gridRow: 1 }}>
                  <Reveal y={30}>
                    <div className="card" style={{ overflow: 'hidden', borderColor: `${s?.theme?.accent || '#c1121f'}33` }}>
                      {t.image && (
                        <div style={{ height: 180, position: 'relative' }}>
                          <Visual src={t.image} seed={t.id} style={{ position: 'absolute', inset: 0 }} />
                        </div>
                      )}
                      <ItemMediaEdit col="timeline" item={t} path="image" />
                      <div className="card-pad">
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <span className="display" style={{ fontSize: 44, color: s?.theme?.accent || 'var(--blood-bright)' }}>
                            {t.year}
                          </span>
                          <span className="badge">{s?.short}</span>
                        </div>
                        <F col="timeline" item={t} path="title" as="div" className="display" style={{ fontSize: 30, marginTop: 4 }} />
                        <Spoiler marker={t.spoiler}>
                          <F col="timeline" item={t} path="text" as="p" style={{ color: '#cfcac2', margin: '8px 0 0' }} multiline />
                        </Spoiler>
                      </div>
                    </div>
                  </Reveal>
                </div>
                <div style={{ gridColumn: 2, gridRow: 1, display: 'grid', placeItems: 'center' }}>
                  <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} style={{ width: 18, height: 18, borderRadius: '50%', background: s?.theme?.accent || 'var(--blood)', boxShadow: `0 0 0 6px var(--bg), 0 0 24px ${s?.theme?.accent || 'var(--blood)'}` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================================ HARRY'S CODE ================================
export function Code() {
  const { col } = useCms();
  const rules = col('code');
  return (
    <div className="page" style={{ background: 'linear-gradient(180deg, #0a0f13, var(--bg) 60%)' }}>
      <section style={{ position: 'relative', padding: '100px 0 60px', overflow: 'hidden' }}>
        <div className="container">
          <T k="code.kicker" d="Written by Harry Morgan" as="div" className="kicker" />
          <T k="code.title" d="The Code of Harry" as="h1" className="display h-xl" style={{ margin: '10px 0 0' }} />
          <T k="code.sub" d="The rules that turned a monster into something else. Break one, and everything falls apart." as="p" className="lead muted" />
        </div>
      </section>
      <div className="container" style={{ maxWidth: 1200 }}>
        {rules.map((r, i) => (
          <Reveal key={r.id}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 40, padding: '50px 0', borderTop: '1px solid var(--line)', alignItems: 'start' }}>
              <div className="display" style={{ fontSize: 110, lineHeight: 0.8, color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,.3)' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <F col="code" item={r} path="rule" as="h2" className="display" style={{ fontSize: 'clamp(40px, 4vw, 64px)', margin: 0 }} />
                <F col="code" item={r} path="text" as="p" className="lead" style={{ marginTop: 12 }} multiline />
              </div>
              <div className="card card-pad" style={{ background: 'rgba(158,201,255,.04)', borderColor: 'rgba(158,201,255,.15)' }}>
                <div className="kicker" style={{ color: '#9ec9ff' }}>
                  In practice
                </div>
                <F col="code" item={r} path="example" as="p" style={{ margin: '10px 0 0', color: '#cfd8e0' }} multiline />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ================================ BEHIND THE SCENES ================================
export function BehindScenes() {
  const { col } = useCms();
  const items = col('bts');
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="bts.kicker" d="Production notes" as="div" className="kicker red" />
        <T k="bts.title" d="Behind the Scenes" as="h1" className="display h-lg" style={{ margin: '12px 0 50px' }} />
        <div className="grid g3">
          {items.map((b, i) => (
            <Reveal key={b.id} delay={(i % 3) * 0.06}>
              <div className="card hover" style={{ height: '100%' }}>
                <div style={{ aspectRatio: '16/9', position: 'relative' }}>
                  <Visual src={b.image} seed={b.id} label={b.title} mode="name" style={{ position: 'absolute', inset: 0 }} />
                  <ItemMediaEdit col="bts" item={b} path="image" />
                </div>
                <div className="card-pad">
                  <div className="mono muted" style={{ fontSize: 11, letterSpacing: '.2em' }}>
                    FILE #{String(i + 1).padStart(2, '0')}
                  </div>
                  <F col="bts" item={b} path="title" as="h3" className="display" style={{ fontSize: 32, margin: '6px 0 8px' }} />
                  <F col="bts" item={b} path="text" as="p" style={{ margin: 0, color: '#cfcac2' }} multiline />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================ TRAILER ================================
export function Trailer() {
  const { settings } = useCms();
  const tr = settings.trailer;
  const [playing, setPlaying] = useState(false);
  return (
    <div className="page" style={{ background: '#000' }}>
      <div className="container" style={{ paddingTop: 50, paddingBottom: 60 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 26 }}>
          <div>
            <div className="kicker red">
              <span className="pulse-dot" style={{ marginRight: 10 }} />
              Now showing
            </div>
            <SText path="trailer.title" as="h1" className="display h-lg" style={{ margin: '10px 0 0' }} />
            <SText path="trailer.description" as="p" className="lead muted" />
          </div>
        </div>
        <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 18, overflow: 'hidden', background: '#050505', boxShadow: '0 60px 140px -40px rgba(193,18,31,.45)', border: '1px solid var(--line)' }}>
          <SettingsMediaEdit path="trailer.url" kind="video" label="Trailer" style={{ right: 150 }} />
          <SettingsMediaEdit path="trailer.poster" label="Poster" />
          {tr.url && playing ? (
            isVideo(tr.url) ? (
              <video
                src={tr.url}
                poster={tr.poster}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                onPlay={() => music.duck(true)}
                onPause={() => music.duck(false)}
                onEnded={() => music.duck(false)}
              />
            ) : (
              <iframe src={tr.url} title="Trailer" style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; fullscreen" allowFullScreen />
            )
          ) : (
            <button
              onClick={() => {
                if (!tr.url) return toast({ title: 'No trailer yet', text: 'The admin can add one from the Admin Panel → Site Settings → Trailer' });
                sfx.click();
                setPlaying(true);
              }}
              style={{ position: 'absolute', inset: 0, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
            >
              <Visual src={tr.poster} seed="trailer-poster" label="DEXTER" mode="name" style={{ position: 'absolute', inset: 0 }} />
              <WorldFX effect="heat" intensity={0.5} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(0,0,0,.1), rgba(0,0,0,.7))' }} />
              <motion.div whileHover={{ scale: 1.08 }} style={{ position: 'absolute', left: '50%', top: '50%', width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: '50%', background: 'var(--blood)', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 14px rgba(193,18,31,.25), 0 0 80px rgba(255,42,54,.6)' }}>
                <span style={{ fontSize: 40, marginLeft: 8, color: '#fff' }}>▶</span>
              </motion.div>
            </button>
          )}
        </div>
        <div className="row" style={{ marginTop: 30 }}>
          <Link to="/series" className="btn">
            Explore the series
          </Link>
          <Link to="/kill-room" className="btn btn-primary">
            Enter the Kill Room
          </Link>
        </div>
      </div>
    </div>
  );
}

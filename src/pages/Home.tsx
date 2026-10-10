import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, animate, useInView } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { Visual } from '../components/Visual';
import { SText, T, SettingsMediaEdit } from '../components/Editable';
import { Reveal, SectionHead } from '../components/Chrome';
import { CharacterCard, VillainCard, SeasonCard, Rail } from '../components/Cards';
import { WorldFX } from '../components/WorldFX';
import { Spoiler } from '../components/Spoiler';
import { dayIndex } from '../lib/util';
import { sfx } from '../lib/sound';

export default function Home() {
  const { settings } = useCms();
  const sections = settings.home.sections.filter((s) => s.enabled);
  const map: Record<string, React.ReactNode> = {
    hero: <Hero key="hero" />,
    counter: <Counter key="counter" />,
    worlds: <Worlds key="worlds" />,
    characters: <CharactersRow key="characters" />,
    quote: <QuoteOfDay key="quote" />,
    villains: <VillainsRow key="villains" />,
    features: <Features key="features" />,
    seasons: <SeasonsRow key="seasons" />,
    code: <CodeTeaser key="code" />,
  };
  return <div>{sections.map((s) => map[s.id])}</div>;
}

function Hero() {
  const { settings } = useCms();
  const { profile } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const h = settings.hero;
  return (
    <section ref={ref} style={{ position: 'relative', height: '100vh', minHeight: 680, overflow: 'hidden' }}>
      <motion.div style={{ position: 'absolute', inset: 0, y, scale }}>
        <Visual src={h.video || h.image} seed="hero-dexter" accent="#d90f1e" mode="none" style={{ width: '100%', height: '100%' }} />
      </motion.div>
      <WorldFX effect="heat" intensity={0.6} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,7,10,.5) 0%, rgba(7,7,10,.1) 35%, rgba(7,7,10,.6) 75%, var(--bg) 100%), linear-gradient(90deg, rgba(7,7,10,.8) 0%, rgba(7,7,10,0) 65%)' }} />
      <SettingsMediaEdit path="hero.image" label="Hero" style={{ top: 'calc(var(--nav-h) + 16px)', right: 150 }} />
      <SettingsMediaEdit path="hero.video" kind="video" label="Hero" style={{ top: 'calc(var(--nav-h) + 16px)' }} />
      <motion.div className="container" style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '14vh', opacity: fade }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="kicker red row" style={{ gap: 12 }}>
          <span className="pulse-dot" /> <SText path="hero.kicker" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.4, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} className="display" style={{ fontSize: 'clamp(84px, 13vw, 240px)', lineHeight: 0.84, margin: '18px 0 0', maxWidth: 1500, letterSpacing: '.01em', textShadow: '0 10px 60px rgba(0,0,0,.6)' }}>
          <SText path="hero.title" />
        </motion.h1>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.8 }}>
          <SText path="hero.subtitle" as="p" className="lead" style={{ marginTop: 22 }} />
          <div className="row" style={{ marginTop: 34, gap: 14 }}>
            <Link to={h.ctaLink || '/trailer'} className="btn btn-primary" onClick={() => sfx.click()}>
              ▶ <SText path="hero.ctaText" />
            </Link>
            <Link to={h.cta2Link || '/kill-room'} className="btn">
              <SText path="hero.cta2Text" />
            </Link>
            {profile && (
              <span className="mono muted" style={{ fontSize: 12, letterSpacing: '.18em', marginLeft: 10 }}>
                WELCOME BACK, {String(profile.username || '').toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
      <div className="scroll-hint">
        <i />
        SCROLL
      </div>
    </section>
  );
}

function CountUp({ to, duration = 2.4 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => ref.current && (ref.current.textContent = String(Math.round(v))) });
    return () => c.stop();
  }, [inView, to, duration]);
  return <span ref={ref}>0</span>;
}

function Counter() {
  const { col } = useCms();
  const victims = col('victims');
  const dexterKills = victims.filter((v) => v.killer === 'dexter').length;
  const brianKills = victims.filter((v) => v.killer === 'brian').length;
  const seasons = col('seasons');
  const episodes = seasons.reduce((a, s) => a + (s.episodes?.length || 0), 0);
  const dexterOnly = victims.filter((v) => v.killer === 'dexter');
  const vod = dexterOnly[dayIndex() % Math.max(1, dexterOnly.length)];
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
        <Reveal>
          <T k="home.counter.kicker" d="The Archive" as="div" className="kicker" />
          <div className="display" style={{ fontSize: 'clamp(120px, 18vw, 300px)', lineHeight: 0.8, color: 'var(--blood-bright)', textShadow: '0 0 80px rgba(255,42,54,.35)', marginTop: 10 }}>
            <CountUp to={dexterKills} />
          </div>
          <T k="home.counter.title" d="Slides in the box." as="div" className="display h-sm" />
          <T k="home.counter.sub" d="Every kill, documented. Every drop of blood, on glass. Spoiler-protected according to your viewing progress." as="p" className="muted" style={{ maxWidth: 520 }} />
          <div className="row" style={{ gap: 30, marginTop: 26 }}>
            {[
              [seasons.length, 'Seasons'],
              [episodes, 'Episodes'],
              [col('characters').length, 'Characters'],
              [brianKills, 'Ice Truck Files'],
            ].map(([n, l]) => (
              <div key={l as string}>
                <div className="display" style={{ fontSize: 46 }}>
                  <CountUp to={n as number} duration={1.8} />
                </div>
                <div className="mono muted" style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase' }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
          <Link to="/kill-count" className="btn" style={{ marginTop: 30 }}>
            Open the slide box →
          </Link>
        </Reveal>
        {vod && (
          <Reveal delay={0.15}>
            <div className="card" style={{ padding: 30, background: 'linear-gradient(160deg, #18080a, #0d0d12)' }}>
              <div className="kicker red">Slide of the day</div>
              <Spoiler marker={{ series: vod.series, season: vod.season, episode: vod.episode }}>
                <div style={{ marginTop: 18, aspectRatio: '3 / 1', borderRadius: 8, background: 'linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.12), rgba(255,255,255,.05))', border: '1px solid rgba(255,255,255,.15)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: '50%', top: '50%', width: 70, height: 56, transform: 'translate(-50%,-50%)', borderRadius: '50% 45% 55% 48%', background: 'radial-gradient(circle at 35% 35%, #ff3b47, #7a0710)', boxShadow: '0 0 30px rgba(255,42,54,.4)' }} />
                  <div className="mono" style={{ position: 'absolute', left: 12, bottom: 8, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.2em' }}>
                    #{String(dexterOnly.indexOf(vod) + 1).padStart(3, '0')}
                  </div>
                </div>
                <div className="display" style={{ fontSize: 44, marginTop: 20 }}>
                  {vod.name}
                </div>
                <div className="mono muted" style={{ fontSize: 12, letterSpacing: '.12em' }}>
                  S{vod.season}
                  {vod.episode ? `E${vod.episode}` : ''} · {vod.method}
                </div>
                <p style={{ color: '#cfcac2' }}>{vod.reason}</p>
              </Spoiler>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Worlds() {
  const { col } = useCms();
  const series = col('series');
  const [active, setActive] = useState(0);
  return (
    <section className="section" style={{ paddingTop: 30 }}>
      <div className="container">
        <SectionHead tk="home.worlds" kicker="Four Series · One Code" title="Choose your world" />
        <Reveal>
          <div style={{ display: 'flex', gap: 14, height: '72vh', minHeight: 520 }}>
            {series.map((s, i) => {
              const on = i === active;
              return (
                <Link
                  key={s.id}
                  to={`/series/${s.id}`}
                  onMouseEnter={() => {
                    if (!on) sfx.whoosh();
                    setActive(i);
                  }}
                  style={{ flex: on ? 4 : 1, transition: 'flex 1s cubic-bezier(.22,1,.36,1)', position: 'relative', borderRadius: 18, overflow: 'hidden', background: s.theme?.bg, border: `1px solid ${on ? s.theme?.accent + '66' : 'var(--line)'}` }}
                >
                  <Visual src={s.heroVideo || s.heroImage} seed={`world-${s.id}`} accent={s.theme?.accent} mode="none" style={{ position: 'absolute', inset: 0, transform: on ? 'scale(1.03)' : 'scale(1.12)', transition: 'transform 1.4s cubic-bezier(.22,1,.36,1)', filter: on ? 'none' : 'grayscale(.7) brightness(.6)' }} />
                  <WorldFX effect={s.theme?.effect} intensity={on ? 1 : 0.4} />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 20%, ${s.theme?.bg || '#000'}ee 100%)` }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: on ? 36 : 20, transition: 'padding .8s' }}>
                    <div className="mono" style={{ fontSize: 11, letterSpacing: '.3em', color: s.theme?.accent2, writingMode: on ? 'horizontal-tb' : 'vertical-rl', transform: on ? 'none' : 'rotate(180deg)', whiteSpace: 'nowrap' }}>
                      {s.years} · {s.theme?.label}
                    </div>
                    {on && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
                        {s.logo ? <img src={s.logo} alt={s.name} style={{ maxHeight: 110, marginTop: 14 }} /> : <div className="display" style={{ fontSize: 'clamp(56px, 6vw, 110px)', marginTop: 10 }}>{s.short}</div>}
                        <div className="serif" style={{ fontSize: 26, fontStyle: 'italic', color: '#e8e2d8', marginTop: 6 }}>
                          {s.tagline}
                        </div>
                        <div className="row" style={{ marginTop: 18 }}>
                          <span className="badge">{s.setting}</span>
                          <span className="badge">{s.episodesCount} episodes</span>
                          <span className="btn btn-sm" style={{ borderColor: s.theme?.accent, marginLeft: 6 }}>
                            Enter the world →
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CharactersRow() {
  const { col } = useCms();
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        <SectionHead tk="home.characters" kicker="The Family · The Department" title="Characters" />
        <Rail min={260}>
          {col('characters').map((c) => (
            <CharacterCard key={c.id} c={c} />
          ))}
        </Rail>
      </div>
    </section>
  );
}

function QuoteOfDay() {
  const { col } = useCms();
  const quotes = col('quotes');
  const q = quotes[dayIndex() % Math.max(1, quotes.length)];
  const by = col('characters').find((c) => c.id === q?.by);
  if (!q) return null;
  return (
    <section className="section" style={{ textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(217,15,30,.14), transparent 65%)' }} />
      <div className="container" style={{ position: 'relative', maxWidth: 1200 }}>
        <Reveal>
          <T k="home.quote.kicker" d="Quote of the day" as="div" className="kicker red" />
          <Spoiler marker={{ series: q.series, season: q.season, episode: q.episode }}>
            <div className="quote-big" style={{ marginTop: 26, fontSize: 'clamp(34px, 4.6vw, 80px)' }}>
              “{q.text}”
            </div>
            <div className="mono" style={{ marginTop: 26, letterSpacing: '.25em', fontSize: 12, color: 'var(--muted)' }}>
              — {(by?.name || q.by || '').toUpperCase()} · S{q.season}
              {q.episode ? `E${q.episode}` : ''}
            </div>
          </Spoiler>
          <Link to="/quotes" className="btn" style={{ marginTop: 34 }}>
            All quotes
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function VillainsRow() {
  const { col } = useCms();
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        <SectionHead tk="home.villains" kicker="Case Files" title="The monsters he hunted" />
        <Rail min={280}>
          {col('villains').map((v) => (
            <VillainCard key={v.id} v={v} />
          ))}
        </Rail>
      </div>
    </section>
  );
}

function Features() {
  const tiles = useMemo(
    () => [
      { to: '/kill-room', k: '3D · Photo Mode', t: 'The Kill Room', d: 'Plastic sheeting, a table, a knife, and Brian. Full camera control.', span: 'span 2 / span 2', seed: 'f-killroom' },
      { to: '/kill-count', k: 'Interactive', t: 'The Slide Box', d: 'Every kill on a glass slide, in a 3D box.', span: 'span 1', seed: 'f-slides' },
      { to: '/games/blood-spatter', k: 'Game', t: 'Blood Spatter Lab', d: 'Find the point of origin. Name the weapon.', span: 'span 1', seed: 'f-spatter' },
      { to: '/games/catch-the-killer', k: 'Investigation', t: 'Catch the Killer', d: 'Evidence, red string, and one suspect.', span: 'span 1', seed: 'f-case' },
      { to: '/games/trivia', k: 'Game', t: 'Trivia', d: '3 levels. 10 questions. 2 minutes. 3 lives.', span: 'span 1', seed: 'f-trivia' },
      { to: '/map', k: 'Explore', t: 'The Map', d: 'Miami, Iron Lake, New York. Every location.', span: 'span 1', seed: 'f-map' },
      { to: '/timeline', k: 'Chronology', t: 'Timeline', d: 'From the container to New York.', span: 'span 1', seed: 'f-time' },
    ],
    [],
  );
  return (
    <section className="section">
      <div className="container">
        <SectionHead tk="home.features" kicker="Five hours minimum" title="Don’t leave yet" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(220px, auto)', gap: 16 }}>
          {tiles.map((t, i) => (
            <Reveal key={t.to} delay={i * 0.05} style={{ gridColumn: t.span.includes('2 /') ? 'span 2' : undefined, gridRow: t.span.includes('/ span 2') ? 'span 2' : undefined }}>
              <Link to={t.to} className="media-card" style={{ display: 'block', height: '100%', minHeight: 220 }}>
                <div className="media">
                  <Visual seed={t.seed} label={t.t} mode="name" />
                </div>
                <div className="shade" />
                <div className="meta">
                  <div className="kicker red" style={{ fontSize: 10 }}>
                    {t.k}
                  </div>
                  <div className="display" style={{ fontSize: i === 0 ? 72 : 36, marginTop: 6 }}>
                    {t.t}
                  </div>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {t.d}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeasonsRow() {
  const { col } = useCms();
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        <SectionHead tk="home.seasons" kicker="11 seasons · 126 episodes" title="Seasons" />
        <Rail min={240}>
          {col('seasons').map((s) => (
            <SeasonCard key={s.id} s={s} />
          ))}
        </Rail>
      </div>
    </section>
  );
}

function CodeTeaser() {
  const { col } = useCms();
  const rules = col('code');
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI((x) => (x + 1) % Math.max(1, rules.length)), 3800);
    return () => clearInterval(iv);
  }, [rules.length]);
  const r = rules[i];
  return (
    <section className="section">
      <div className="container">
        <div className="card" style={{ padding: 'clamp(30px, 6vw, 90px)', background: 'linear-gradient(135deg, #0f1418, #0a0a0d)', borderColor: 'rgba(158,201,255,.15)', position: 'relative', overflow: 'hidden' }}>
          <div className="display" style={{ position: 'absolute', right: -20, bottom: -60, fontSize: 380, color: 'rgba(255,255,255,.03)', lineHeight: 1 }}>
            CODE
          </div>
          <T k="home.code.kicker" d="The Code of Harry" as="div" className="kicker" />
          <div style={{ minHeight: 180, marginTop: 20 }}>
            {r && (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0)' }} transition={{ duration: 0.8 }}>
                <div className="mono muted" style={{ fontSize: 12, letterSpacing: '.3em' }}>
                  RULE #{String(i + 1).padStart(2, '0')}
                </div>
                <div className="display" style={{ fontSize: 'clamp(50px, 7vw, 120px)', marginTop: 10 }}>
                  {r.rule}
                </div>
              </motion.div>
            )}
          </div>
          <Link to="/code" className="btn" style={{ marginTop: 20 }}>
            Learn the full code
          </Link>
        </div>
      </div>
    </section>
  );
}

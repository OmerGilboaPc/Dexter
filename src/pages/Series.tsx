import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { Visual } from '../components/Visual';
import { WorldFX } from '../components/WorldFX';
import { F, ItemMediaEdit, T } from '../components/Editable';
import { Reveal, SectionHead } from '../components/Chrome';
import { CharacterCard, SeasonCard, VillainCard, Rail } from '../components/Cards';
import NotFound from './NotFound';

export function SeriesList() {
  const { col } = useCms();
  const series = col('series');
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="series.kicker" d="The Universe" as="div" className="kicker red" />
        <T k="series.title" d="Four series. One killer." as="h1" className="display h-lg" style={{ margin: '12px 0 50px' }} />
        <div style={{ display: 'grid', gap: 22 }}>
          {series.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.05}>
              <Link to={`/series/${s.id}`} className="media-card" style={{ display: 'block', height: 420, border: `1px solid ${s.theme?.accent}33` }}>
                <div className="media">
                  <Visual src={s.heroVideo || s.heroImage} seed={`world-${s.id}`} accent={s.theme?.accent} mode="none" />
                </div>
                <WorldFX effect={s.theme?.effect} intensity={0.7} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${s.theme?.bg}f2 0%, ${s.theme?.bg}99 45%, transparent 100%)`, zIndex: 1 }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', padding: '0 clamp(30px, 5vw, 80px)' }}>
                  <div style={{ maxWidth: 640 }}>
                    <div className="kicker" style={{ color: s.theme?.accent2 }}>
                      {s.years} · {s.network}
                    </div>
                    {s.logo ? <img src={s.logo} alt={s.name} style={{ maxHeight: 120, margin: '16px 0' }} /> : <div className="display" style={{ fontSize: 'clamp(60px, 8vw, 130px)', marginTop: 8 }}>{s.short}</div>}
                    <div className="serif" style={{ fontSize: 28, fontStyle: 'italic' }}>
                      {s.tagline}
                    </div>
                    <div className="row" style={{ marginTop: 18 }}>
                      <span className="badge">{s.setting}</span>
                      <span className="badge">
                        {s.seasonsCount} {s.seasonsCount === 1 ? 'season' : 'seasons'}
                      </span>
                      <span className="badge">{s.episodesCount} episodes</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeriesDetail() {
  const { id } = useParams();
  const { item, col } = useCms();
  const s = item('series', id!);
  if (!s) return <NotFound />;
  const seasons = col('seasons').filter((x) => x.series === s.id);
  const chars = col('characters').filter((c) => (c.series || []).includes(s.id));
  const villains = col('villains').filter((v) => v.series === s.id);
  const kills = col('victims').filter((v) => v.series === s.id && v.killer === 'dexter').length;
  const theme = s.theme || {};
  return (
    <div style={{ ['--accent' as any]: theme.accent, ['--accent2' as any]: theme.accent2, background: `linear-gradient(180deg, ${theme.bg} 0%, var(--bg) 100%)` }}>
      <section style={{ position: 'relative', height: '92vh', minHeight: 600, overflow: 'hidden' }}>
        <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1.02 }} transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'absolute', inset: 0 }}>
          <Visual src={s.heroVideo || s.heroImage} seed={`world-${s.id}`} accent={theme.accent} mode="none" style={{ width: '100%', height: '100%' }} />
        </motion.div>
        <WorldFX effect={theme.effect} intensity={1.2} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${theme.bg}66 0%, transparent 40%, ${theme.bg} 100%), linear-gradient(90deg, ${theme.bg}dd, transparent 70%)` }} />
        <ItemMediaEdit col="series" item={s} path="heroImage" style={{ top: 'calc(var(--nav-h) + 16px)', right: 300 }} />
        <ItemMediaEdit col="series" item={s} path="heroVideo" kind="video" style={{ top: 'calc(var(--nav-h) + 16px)', right: 150 }} />
        <ItemMediaEdit col="series" item={s} path="logo" label="Logo" style={{ top: 'calc(var(--nav-h) + 16px)' }} />
        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '12vh' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.3 }}>
            <div className="kicker" style={{ color: theme.accent2 }}>
              {s.years} · {s.network} · {theme.label}
            </div>
            {s.logo ? <img src={s.logo} alt={s.name} style={{ maxHeight: 200, margin: '20px 0' }} /> : <F col="series" item={s} path="short" as="h1" className="display h-xl" style={{ margin: '10px 0 0' }} />}
            <F col="series" item={s} path="tagline" as="div" className="serif" style={{ fontSize: 'clamp(26px, 3vw, 46px)', fontStyle: 'italic' }} />
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="container grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 60 }}>
          <Reveal>
            <F col="series" item={s} path="description" as="div" className="prose lead" multiline />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid g2" style={{ gap: 14 }}>
              {[
                [s.setting, 'Setting'],
                [`${s.episodesCount}`, 'Episodes'],
                [`${seasons.length}`, seasons.length === 1 ? 'Season' : 'Seasons'],
                [`${kills}`, 'Kills in the archive'],
              ].map(([v, k]) => (
                <div className="stat" key={k} style={{ borderColor: `${theme.accent}33` }}>
                  <div className="v" style={{ fontSize: v.length > 8 ? 28 : 52 }}>
                    {v}
                  </div>
                  <div className="k">{k}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead tk={`series.${s.id}.seasons`} kicker="Seasons" title={seasons.length === 1 ? 'The season' : 'The seasons'} />
          <div className="grid g4">
            {seasons.map((x) => (
              <SeasonCard key={x.id} s={x} />
            ))}
          </div>
        </div>
      </section>

      {chars.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead tk={`series.${s.id}.chars`} kicker="Cast" title="Characters" />
            <Rail>
              {chars.map((c) => (
                <CharacterCard key={c.id} c={c} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {villains.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead tk={`series.${s.id}.villains`} kicker="Case Files" title="Villains" />
            <Rail min={280}>
              {villains.map((v) => (
                <VillainCard key={v.id} v={v} />
              ))}
            </Rail>
          </div>
        </section>
      )}
    </div>
  );
}

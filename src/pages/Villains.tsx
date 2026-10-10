import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useSpoilers } from '../lib/spoilers';
import { Visual } from '../components/Visual';
import { F, ItemMediaEdit, T } from '../components/Editable';
import { Reveal } from '../components/Chrome';
import { VillainCard } from '../components/Cards';
import { Spoiler, SpoilerText } from '../components/Spoiler';
import NotFound from './NotFound';

export function VillainsList() {
  const { col } = useCms();
  const series = col('series');
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="villains.kicker" d="Miami Metro · Homicide Division · Case Archive" as="div" className="kicker" />
        <T k="villains.title" d="The Monsters" as="h1" className="display h-lg" style={{ margin: '12px 0 20px' }} />
        <T k="villains.sub" d="Every season has its predator. Every predator has a file. Identities that would spoil the story stay hidden according to your viewing progress." as="p" className="lead muted" />
        {series.map((s) => {
          const list = col('villains').filter((v) => v.series === s.id);
          if (!list.length) return null;
          return (
            <div key={s.id} style={{ marginTop: 60 }}>
              <div className="row" style={{ marginBottom: 22, gap: 18 }}>
                <span style={{ width: 40, height: 2, background: s.theme?.accent }} />
                <h2 className="display" style={{ fontSize: 40, margin: 0 }}>
                  {s.name}
                </h2>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
                {list.map((v, i) => (
                  <Reveal key={v.id} delay={i * 0.04}>
                    <VillainCard v={v} />
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

const paper = '#d9cfb6';
const ink = '#1b1712';

function Stamp({ text, color = '#a3121b', rotate = -12 }: { text: string; color?: string; rotate?: number }) {
  return (
    <motion.div initial={{ scale: 2.2, opacity: 0 }} whileInView={{ scale: 1, opacity: 0.85 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.5 }} style={{ display: 'inline-block', border: `4px double ${color}`, color, padding: '6px 18px', fontFamily: 'var(--f-type)', fontSize: 30, letterSpacing: '.12em', transform: `rotate(${rotate}deg)`, mixBlendMode: 'multiply' }}>
      {text}
    </motion.div>
  );
}

export function VillainDetail() {
  const { id } = useParams();
  const { item, col } = useCms();
  const { isSpoiler } = useSpoilers();
  const v = item('villains', id!);
  if (!v) return <NotFound />;
  const ser = item('series', v.series);
  const season = item('seasons', v.season);
  const hidden = isSpoiler(v.identitySpoiler);
  const victims = col('victims').filter((x) => x.name && v.realName && (x.name.includes(v.realName.split(' (')[0]) || v.realName.includes(x.name)));
  const all = col('villains');
  const idx = all.findIndex((x) => x.id === v.id);
  return (
    <div className="page" style={{ background: 'radial-gradient(ellipse at top, #1a1410, var(--bg) 60%)' }}>
      <div className="container" style={{ paddingTop: 50, paddingBottom: 80, maxWidth: 1200 }}>
        <Link to="/villains" className="mono muted" style={{ fontSize: 12, letterSpacing: '.2em' }}>
          ← CASE ARCHIVE
        </Link>
        <motion.div initial={{ opacity: 0, y: 50, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} style={{ marginTop: 26, position: 'relative' }}>
          {/* folder tab */}
          <div style={{ position: 'absolute', top: -30, left: 40, width: 240, height: 40, background: '#c4b48f', borderRadius: '10px 10px 0 0', fontFamily: 'var(--f-type)', color: ink, padding: '8px 18px', fontSize: 14 }}>CASE #{v.caseNumber}</div>
          <div
            style={{
              background: `linear-gradient(180deg, ${paper}, #cdbf9f)`,
              color: ink,
              borderRadius: '0 14px 14px 14px',
              padding: 'clamp(28px, 4vw, 60px)',
              boxShadow: '0 50px 100px -30px rgba(0,0,0,.9), inset 0 0 120px rgba(120,90,40,.25)',
              fontFamily: 'var(--f-type)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.6' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E\")" }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 20, borderBottom: `2px solid ${ink}`, paddingBottom: 16, position: 'relative' }}>
              <div>
                <div style={{ fontSize: 13, letterSpacing: '.25em' }}>{ser?.id === 'new-blood' ? 'IRON LAKE POLICE DEPARTMENT' : ser?.id === 'resurrection' ? 'NEW YORK POLICE DEPARTMENT' : 'MIAMI METRO POLICE DEPARTMENT'}</div>
                <div style={{ fontSize: 13, letterSpacing: '.25em', opacity: 0.7 }}>HOMICIDE DIVISION · CONFIDENTIAL</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <div>{ser?.name?.toUpperCase()}</div>
                <div style={{ opacity: 0.7 }}>{season?.title?.toUpperCase()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 44, marginTop: 34, position: 'relative' }}>
              <div>
                <div style={{ position: 'relative', background: '#fff', padding: '12px 12px 44px', boxShadow: '0 12px 30px rgba(0,0,0,.35)', transform: 'rotate(-2.5deg)' }}>
                  <div style={{ position: 'absolute', top: -14, left: '45%', width: 22, height: 50, border: '3px solid #8a8a8a', borderRadius: 12, zIndex: 2 }} />
                  <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
                    <Visual src={v.image} seed={v.id} label={v.name} accent={ser?.theme?.accent} mode="name" style={{ position: 'absolute', inset: 0, filter: hidden ? 'blur(18px) grayscale(1)' : 'grayscale(.35) contrast(1.1)' }} />
                    <ItemMediaEdit col="villains" item={v} path="image" label="Photo" />
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--f-type)', fontSize: 15 }}>{hidden ? 'IDENTITY WITHHELD' : v.name}</div>
                </div>
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <Spoiler marker={v.fate?.spoiler} compact>
                    <Stamp text="CASE CLOSED" />
                  </Spoiler>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, letterSpacing: '.25em', opacity: 0.7 }}>SUBJECT</div>
                <F col="villains" item={v} path="name" as="h1" className="display" style={{ fontSize: 'clamp(54px, 6vw, 96px)', margin: '4px 0 0', color: ink }} />
                <div style={{ fontSize: 20, marginTop: 4 }}>
                  Real name:{' '}
                  {hidden ? (
                    <SpoilerText marker={v.identitySpoiler}>{v.realName}</SpoilerText>
                  ) : (
                    <F col="villains" item={v} path="realName" />
                  )}
                </div>
                <div style={{ fontSize: 15, marginTop: 4, opacity: 0.75 }}>
                  Played by: <F col="villains" item={v} path="actor" />
                </div>
                <F col="villains" item={v} path="tagline" as="div" className="serif" style={{ fontSize: 28, fontStyle: 'italic', marginTop: 18, color: '#5b1014' }} />

                {[
                  ['MODUS OPERANDI', 'mo'],
                  ['SIGNATURE', 'signature'],
                  ['PSYCHOLOGICAL PROFILE', 'profile'],
                ].map(([label, path]) => (
                  <div key={path} style={{ marginTop: 26 }}>
                    <div style={{ fontSize: 12, letterSpacing: '.3em', borderBottom: `1px dashed ${ink}66`, paddingBottom: 6, marginBottom: 10 }}>{label}</div>
                    <Spoiler marker={v.identitySpoiler}>
                      <F col="villains" item={v} path={path} as="p" style={{ fontSize: 17, lineHeight: 1.75, margin: 0 }} multiline />
                    </Spoiler>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 44, position: 'relative' }}>
              <div style={{ fontSize: 12, letterSpacing: '.3em', borderBottom: `1px dashed ${ink}66`, paddingBottom: 6, marginBottom: 16 }}>EVIDENCE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {(v.evidence || []).map((e: any, i: number) => (
                  <Reveal key={i} delay={i * 0.06}>
                    <div style={{ background: '#efe7d2', padding: 18, boxShadow: '0 8px 20px rgba(0,0,0,.25)', transform: `rotate(${(i % 2 ? 1 : -1) * 0.8}deg)`, height: '100%' }}>
                      <div style={{ display: 'inline-block', background: '#f4d03f', padding: '2px 8px', fontSize: 12, marginBottom: 10 }}>
                        <F col="villains" item={v} path={`evidence.${i}.label`} />
                      </div>
                      <Spoiler marker={v.identitySpoiler}>
                        <F col="villains" item={v} path={`evidence.${i}.text`} as="div" style={{ fontSize: 15, lineHeight: 1.6 }} multiline />
                      </Spoiler>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {(v.keyEpisodes || []).length > 0 && (
              <div style={{ marginTop: 40, position: 'relative' }}>
                <div style={{ fontSize: 12, letterSpacing: '.3em', borderBottom: `1px dashed ${ink}66`, paddingBottom: 6, marginBottom: 12 }}>KEY EPISODES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {v.keyEpisodes.map((k: string) => {
                    const [sid, n] = k.split(':');
                    const s = item('seasons', sid);
                    const e = s?.episodes?.find((x: any) => String(x.n) === n);
                    if (!s || !e) return null;
                    return (
                      <Link key={k} to={`/seasons/${sid}#ep-${n}`} style={{ border: `1px solid ${ink}`, padding: '6px 12px', fontSize: 14, color: ink }}>
                        S{s.number}E{n} · <SpoilerText marker={{ series: s.series, season: s.number, episode: Number(n) }}>{e.title}</SpoilerText>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: 40, position: 'relative', background: '#16110d', color: '#e9e2d0', padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '.3em', color: '#d9a441' }}>DISPOSITION</div>
              <Spoiler marker={v.fate?.spoiler}>
                <F col="villains" item={v} path="fate.text" as="div" className="serif" style={{ fontSize: 26, fontStyle: 'italic', marginTop: 8 }} multiline />
              </Spoiler>
            </div>
            {victims.length > 0 && (
              <div style={{ marginTop: 14, fontSize: 14, position: 'relative' }}>
                → Also in the slide box:{' '}
                {victims.map((x) => (
                  <Link key={x.id} to={`/kill-count?v=${x.id}`} style={{ textDecoration: 'underline', marginRight: 10 }}>
                    {x.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 40 }}>
          {idx > 0 ? (
            <Link className="btn" to={`/villains/${all[idx - 1].id}`}>
              ← {all[idx - 1].name}
            </Link>
          ) : (
            <span />
          )}
          {idx < all.length - 1 && (
            <Link className="btn" to={`/villains/${all[idx + 1].id}`}>
              {all[idx + 1].name} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import { Visual } from '../../components/Visual';
import { T } from '../../components/Editable';
import { sfx } from '../../lib/sound';
import { cx } from '../../lib/util';

export default function CatchKiller() {
  const { col } = useCms();
  const { profile } = useAuth();
  const cases = col('cases');
  const [active, setActive] = useState<any>(null);
  if (active) return <CaseBoard c={active} onExit={() => setActive(null)} />;
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="case.kicker" d="Homicide Division · Open cases" as="div" className="kicker red" />
        <T k="case.title" d="Catch the Killer" as="h1" className="display h-xl" style={{ margin: '10px 0' }} />
        <T k="case.sub" d="Open the evidence, follow the red string, and name the suspect, the weapon, and the motive. Three wrong accusations and the case goes cold." as="p" className="lead muted" />
        <div className="grid g3" style={{ marginTop: 50 }}>
          {cases.map((c, i) => {
            const solved = profile?.cases?.[c.id];
            return (
              <motion.button key={c.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={() => setActive(c)} className="card hover" style={{ textAlign: 'left', padding: 0, cursor: 'pointer', background: '#100d0a', borderColor: 'rgba(217,164,65,.2)' }}>
                <div style={{ aspectRatio: '16/10', position: 'relative' }}>
                  <Visual src={c.image} seed={c.id} label={c.title} mode="name" style={{ position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, #100d0a)' }} />
                  {solved && (
                    <div style={{ position: 'absolute', top: 16, right: 16, border: '3px double #3ddc84', color: '#3ddc84', padding: '4px 12px', fontFamily: 'var(--f-type)', transform: 'rotate(8deg)' }}>SOLVED</div>
                  )}
                </div>
                <div style={{ padding: 24 }}>
                  <div className="type" style={{ fontSize: 12, color: 'var(--gold)' }}>
                    {c.location} · {c.difficulty}
                  </div>
                  <div className="display" style={{ fontSize: 40, marginTop: 6 }}>
                    {c.title}
                  </div>
                  <p className="muted" style={{ fontSize: 14, marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.intro}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CaseBoard({ c, onExit }: { c: any; onExit: () => void }) {
  const { profile, updateProfile, track } = useAuth();
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [sus, setSus] = useState('');
  const [weapon, setWeapon] = useState('');
  const [motive, setMotive] = useState('');
  const [wrong, setWrong] = useState(0);
  const [result, setResult] = useState<null | 'win' | 'cold'>(null);
  const [shake, setShake] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const measure = () => {
    const b = board.current?.getBoundingClientRect();
    if (!b) return;
    const out: any[] = [];
    for (const e of c.evidence) {
      if (!opened[e.id]) continue;
      const from = refs.current[e.id]?.getBoundingClientRect();
      if (!from) continue;
      for (const l of e.links || []) {
        if (!l.startsWith('s')) continue;
        const to = refs.current[l]?.getBoundingClientRect();
        if (!to) continue;
        out.push({ x1: from.left + from.width / 2 - b.left, y1: from.top + 14 - b.top, x2: to.left + to.width / 2 - b.left, y2: to.bottom - 10 - b.top });
      }
    }
    setLines(out);
  };
  useLayoutEffect(measure, [opened]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  const accuse = () => {
    if (!sus || !weapon || !motive) return;
    const s = c.solution;
    if (sus === s.suspect && weapon === s.weapon && motive === s.motive) {
      sfx.success();
      setResult('win');
      if (!profile?.cases?.[c.id]) {
        updateProfile({ cases: { ...(profile?.cases || {}), [c.id]: true } });
        track('case:solved');
      }
    } else {
      sfx.fail();
      setShake((x) => x + 1);
      const w = wrong + 1;
      setWrong(w);
      if (w >= 3) setResult('cold');
    }
  };

  const suspectName = (id: string) => c.suspects.find((x: any) => x.id === id)?.name;

  return (
    <div className="page" style={{ background: 'radial-gradient(ellipse at top, #1d150e, #0a0806 70%)' }}>
      <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn btn-sm" onClick={onExit}>
            ← Cases
          </button>
          <div className="row" style={{ gap: 6 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} className="badge" style={{ opacity: k < 3 - wrong ? 1 : 0.25 }}>
                🔎
              </span>
            ))}
          </div>
        </div>
        <div className="type" style={{ color: 'var(--gold)', fontSize: 13 }}>
          {c.location}
        </div>
        <h1 className="display h-md" style={{ margin: '6px 0 12px' }}>
          {c.title}
        </h1>
        <p className="type" style={{ maxWidth: 900, lineHeight: 1.8, color: '#e2d8c4', fontSize: 16 }}>
          {c.intro}
        </p>

        <motion.div
          ref={board}
          key={shake}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ position: 'relative', marginTop: 30, padding: 30, borderRadius: 18, background: 'repeating-linear-gradient(45deg, #2a1e13 0 6px, #2d2116 6px 12px)', boxShadow: 'inset 0 0 120px rgba(0,0,0,.7), 0 30px 80px -30px #000', border: '10px solid #3b2a1a' }}
        >
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}>
            {lines.map((l, k) => (
              <motion.path key={k} d={`M${l.x1} ${l.y1} Q ${(l.x1 + l.x2) / 2} ${Math.max(l.y1, l.y2) + 40} ${l.x2} ${l.y2}`} stroke="#d1121f" strokeWidth="2.2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.6))' }} />
            ))}
          </svg>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.3em', color: '#d9c7a4', marginBottom: 14 }}>
            SUSPECTS
          </div>
          <div className="grid g4" style={{ gap: 18, position: 'relative', zIndex: 2 }}>
            {c.suspects.map((s: any, k: number) => (
              <div
                key={s.id}
                ref={(el) => (refs.current[s.id] = el)}
                onClick={() => setSus(s.id)}
                style={{ background: '#f1ead8', color: '#1b1712', padding: 12, transform: `rotate(${(k % 2 ? 1 : -1) * 1.5}deg)`, boxShadow: sus === s.id ? '0 0 0 3px #d1121f, 0 14px 30px rgba(0,0,0,.6)' : '0 14px 30px rgba(0,0,0,.6)', cursor: 'pointer', position: 'relative' }}
              >
                <span style={{ position: 'absolute', top: -8, left: '50%', width: 16, height: 16, marginLeft: -8, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #ff5a5a, #8a0000)', boxShadow: '0 2px 4px rgba(0,0,0,.5)' }} />
                <div style={{ aspectRatio: '1', position: 'relative', marginBottom: 10, filter: 'grayscale(1) contrast(1.1)' }}>
                  <Visual src={s.image} seed={c.id + s.id} label={s.name} style={{ position: 'absolute', inset: 0 }} />
                </div>
                <div className="type" style={{ fontSize: 17, fontWeight: 700 }}>
                  {s.name}
                </div>
                <div className="type" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.3em', color: '#d9c7a4', margin: '40px 0 14px' }}>
            EVIDENCE · CLICK TO OPEN ({Object.keys(opened).length}/{c.evidence.length})
          </div>
          <div className="grid g4" style={{ gap: 18, position: 'relative', zIndex: 2 }}>
            {c.evidence.map((e: any, k: number) => {
              const on = opened[e.id];
              return (
                <motion.div
                  key={e.id}
                  ref={(el) => (refs.current[e.id] = el)}
                  onClick={() => {
                    if (!on) {
                      sfx.plastic();
                      setOpened((o) => ({ ...o, [e.id]: true }));
                    }
                  }}
                  whileHover={!on ? { y: -4 } : {}}
                  style={{ background: on ? '#fbf6e8' : '#c9a66b', color: '#1b1712', padding: 16, minHeight: 150, cursor: on ? 'default' : 'pointer', transform: `rotate(${(k % 3) - 1}deg)`, boxShadow: '0 12px 26px rgba(0,0,0,.55)', position: 'relative' }}
                >
                  <span style={{ position: 'absolute', top: -8, left: '50%', width: 14, height: 14, marginLeft: -7, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #ffe066, #a07800)' }} />
                  {on ? (
                    <>
                      <div className="type" style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                        {e.title}
                      </div>
                      <div className="type" style={{ fontSize: 13, lineHeight: 1.55 }}>
                        {e.text}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {(e.links || [])
                          .filter((l: string) => !l.startsWith('s'))
                          .map((l: string) => (
                            <span key={l} style={{ fontSize: 10.5, background: '#1b1712', color: '#f4d03f', padding: '2px 6px', fontFamily: 'var(--f-mono)' }}>
                              {l.replace(/^[wm]:/, '')}
                            </span>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: 118, fontFamily: 'var(--f-type)', fontSize: 15, letterSpacing: '.1em' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 26 }}>📁</div>
                        EXHIBIT {String.fromCharCode(65 + k)}
                        <div style={{ fontSize: 11, opacity: 0.6 }}>SEALED</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="card card-pad" style={{ marginTop: 26, background: '#14100c', borderColor: 'rgba(217,164,65,.25)' }}>
          <div className="kicker">Accusation</div>
          <div className="grid g3" style={{ marginTop: 14 }}>
            <select className="select" value={sus} onChange={(e) => setSus(e.target.value)}>
              <option value="">Suspect…</option>
              {c.suspects.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select className="select" value={weapon} onChange={(e) => setWeapon(e.target.value)}>
              <option value="">Weapon…</option>
              {c.weapons.map((w: string) => (
                <option key={w}>{w}</option>
              ))}
            </select>
            <select className="select" value={motive} onChange={(e) => setMotive(e.target.value)}>
              <option value="">Motive…</option>
              {c.motives.map((m: string) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>
              {wrong > 0 ? `${wrong} wrong accusation${wrong > 1 ? 's' : ''}. Debra is losing her patience.` : 'Make sure. Harry always said: be sure.'}
            </span>
            <button className="btn btn-primary" disabled={!sus || !weapon || !motive} onClick={accuse}>
              Accuse
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="glass" style={{ maxWidth: 760, borderRadius: 20, padding: 40, textAlign: 'center' }}>
              <div className="display" style={{ fontSize: 90, color: result === 'win' ? '#3ddc84' : 'var(--blood-bright)' }}>
                {result === 'win' ? 'Case closed' : 'Cold case'}
              </div>
              {result === 'cold' && (
                <p className="muted">
                  The answer: {suspectName(c.solution.suspect)} · {c.solution.weapon} · {c.solution.motive}
                </p>
              )}
              <p className="serif" style={{ fontSize: 24, fontStyle: 'italic', lineHeight: 1.45 }}>
                {c.epilogue}
              </p>
              <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
                <button className="btn btn-primary" onClick={onExit}>
                  Back to cases
                </button>
                <button
                  className={cx('btn')}
                  onClick={() => {
                    setResult(null);
                    setWrong(0);
                    setOpened({});
                    setSus('');
                    setWeapon('');
                    setMotive('');
                  }}
                >
                  Replay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

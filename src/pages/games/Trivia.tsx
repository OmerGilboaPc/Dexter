import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCms } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import { useSpoilers } from '../../lib/spoilers';
import { T } from '../../components/Editable';
import { sfx } from '../../lib/sound';
import { cx, shuffle } from '../../lib/util';

const LEVELS = [
  { id: 'easy', name: 'Easy', desc: 'For anyone who has watched a few episodes.', color: '#d9a441' },
  { id: 'medium', name: 'Medium', desc: 'For fans who know the names, the villains, and the twists.', color: '#ff6b3d' },
  { id: 'dark', name: 'Dark Passenger', desc: 'Episode titles, actors, and behind-the-scenes facts. Respect.', color: '#ff2a36' },
];
const ROUND = 10;
const TIME = 120;
const LIVES = 3;

export default function Trivia() {
  const { col } = useCms();
  const { profile, user, updateProfile, track } = useAuth();
  const { isSpoiler } = useSpoilers();
  const [level, setLevel] = useState<string | null>(null);
  const [qs, setQs] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [time, setTime] = useState(TIME);
  const [picked, setPicked] = useState<number | null>(null);
  const [over, setOver] = useState<null | 'done' | 'time' | 'dead'>(null);
  const [skipped, setSkipped] = useState(0);
  const saved = useRef(false);

  const start = (lv: string) => {
    const pool = col('trivia').filter((q) => q.level === lv);
    const safe = pool.filter((q) => !isSpoiler(q.spoiler));
    setSkipped(pool.length - safe.length);
    const chosen = shuffle(safe.length >= ROUND ? safe : pool).slice(0, ROUND).map((q) => {
      const order: { o: string; idx: number }[] = shuffle(q.options.map((o: string, idx: number) => ({ o, idx })));
      return { ...q, opts: order.map((x) => x.o), correct: order.findIndex((x) => x.idx === q.answer) };
    });
    setLevel(lv);
    setQs(chosen);
    setI(0);
    setScore(0);
    setLives(LIVES);
    setTime(TIME);
    setPicked(null);
    setOver(null);
    saved.current = false;
    sfx.heartbeat();
  };

  useEffect(() => {
    if (!level || over) return;
    const iv = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          setOver('time');
          sfx.fail();
          return 0;
        }
        if (t <= 11) sfx.key();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [level, over]);

  useEffect(() => {
    if (!over || saved.current || !level || !user) return;
    saved.current = true;
    addDoc(collection(db, 'scores'), { uid: user.uid, username: profile?.username || '', avatar: profile?.avatar || '', game: 'trivia', level, score, at: serverTimestamp() }).catch(() => {});
    const best = profile?.triviaBest?.[level] || 0;
    if (score > best) updateProfile({ triviaBest: { ...(profile?.triviaBest || {}), [level]: score } });
    track('trivia:done');
    if (score === ROUND) track('trivia:perfect');
    if (level === 'dark' && score >= 7) track('trivia:dark');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const answer = (idx: number) => {
    if (picked !== null || over) return;
    setPicked(idx);
    const q = qs[i];
    const ok = idx === q.correct;
    if (ok) {
      sfx.success();
      setScore((s) => s + 1);
    } else {
      sfx.fail();
      setLives((l) => l - 1);
    }
    setTimeout(() => {
      if (!ok && lives - 1 <= 0) return setOver('dead');
      if (i + 1 >= qs.length) return setOver('done');
      setI(i + 1);
      setPicked(null);
    }, 1300);
  };

  if (!level) {
    return (
      <div className="page">
        <div className="container" style={{ paddingTop: 60 }}>
          <T k="trivia.kicker" d="Test your forensic knowledge" as="div" className="kicker red" />
          <T k="trivia.title" d="Trivia" as="h1" className="display h-xl" style={{ margin: '10px 0 10px' }} />
          <p className="lead muted">
            {ROUND} questions · {TIME / 60} minutes · {LIVES} lives. Spoiler questions are left out according to your settings.
          </p>
          <div className="grid g3" style={{ marginTop: 50 }}>
            {LEVELS.map((lv, k) => (
              <motion.button key={lv.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.08 }} onClick={() => start(lv.id)} className="card hover" style={{ textAlign: 'left', padding: 34, cursor: 'pointer', borderColor: `${lv.color}55`, background: `linear-gradient(160deg, ${lv.color}18, var(--surface))` }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '.3em', color: lv.color }}>
                  LEVEL {k + 1}
                </div>
                <div className="display" style={{ fontSize: 60, marginTop: 10 }}>
                  {lv.name}
                </div>
                <p className="muted">{lv.desc}</p>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 20 }}>
                  <span className="badge">Best: {profile?.triviaBest?.[lv.id] ?? '—'}/{ROUND}</span>
                  <span className="btn btn-sm" style={{ borderColor: lv.color }}>
                    Start →
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          <div style={{ marginTop: 30 }}>
            <Link to="/leaderboard" className="btn">
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lv = LEVELS.find((l) => l.id === level)!;
  const q = qs[i];

  if (over) {
    const titles = { done: score >= 8 ? 'Lab Expert.' : score >= 5 ? 'Not bad, intern.' : 'Masuka is laughing at you.', time: 'Out of time.', dead: 'Caught.' } as any;
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '90vh', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="kicker" style={{ color: lv.color }}>
            {lv.name} · Result
          </div>
          <div className="display" style={{ fontSize: 'clamp(140px, 22vw, 320px)', lineHeight: 0.8, color: lv.color, textShadow: `0 0 80px ${lv.color}66` }}>
            {score}
            <span style={{ fontSize: '0.35em', color: 'var(--muted)' }}>/{qs.length}</span>
          </div>
          <div className="serif" style={{ fontSize: 44, fontStyle: 'italic' }}>
            {titles[over]}
          </div>
          {skipped > 0 && <p className="muted">{skipped} spoiler questions were left out.</p>}
          <div className="row" style={{ justifyContent: 'center', marginTop: 30 }}>
            <button className="btn btn-primary" onClick={() => start(level)}>
              ↻ Play again
            </button>
            <button className="btn" onClick={() => setLevel(null)}>
              Change level
            </button>
            <Link to="/leaderboard" className="btn">
              🏆 Leaderboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, maxWidth: 1000 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 30 }}>
          <div className="row" style={{ gap: 18 }}>
            <span className="badge" style={{ borderColor: lv.color, color: lv.color }}>
              {lv.name}
            </span>
            <span className="mono muted" style={{ letterSpacing: '.2em', fontSize: 12 }}>
              QUESTION {i + 1}/{qs.length}
            </span>
          </div>
          <div className="row" style={{ gap: 22 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: LIVES }).map((_, k) => (
                <svg key={k} width="18" height="24" viewBox="0 0 24 32">
                  <path d="M12 1C12 1 2 15 2 21.5a10 10 0 0 0 20 0C22 15 12 1 12 1z" fill={k < lives ? 'var(--blood-bright)' : 'transparent'} stroke="var(--blood-bright)" strokeWidth="1.5" />
                </svg>
              ))}
            </div>
            <div className="display" style={{ fontSize: 40, color: time <= 15 ? 'var(--blood-bright)' : '#fff', minWidth: 90, textAlign: 'right' }}>
              {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 50 }}>
          <motion.div animate={{ width: `${(time / TIME) * 100}%` }} transition={{ ease: 'linear', duration: 1 }} style={{ height: '100%', background: lv.color }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45 }}>
            <h2 className="serif" style={{ fontSize: 'clamp(32px, 3.6vw, 56px)', fontWeight: 500, lineHeight: 1.15, margin: '0 0 40px' }}>
              {q.question}
            </h2>
            <div className="grid g2" style={{ gap: 14 }}>
              {q.opts.map((o: string, k: number) => {
                const state = picked === null ? '' : k === q.correct ? 'right' : k === picked ? 'wrong' : 'dim';
                return (
                  <motion.button
                    key={k}
                    whileHover={picked === null ? { scale: 1.015 } : {}}
                    onClick={() => answer(k)}
                    className={cx('card')}
                    style={{
                      textAlign: 'left',
                      padding: '22px 24px',
                      fontSize: 18,
                      cursor: picked === null ? 'pointer' : 'default',
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      borderColor: state === 'right' ? '#3ddc84' : state === 'wrong' ? 'var(--blood-bright)' : undefined,
                      background: state === 'right' ? 'rgba(61,220,132,.12)' : state === 'wrong' ? 'rgba(255,42,54,.14)' : undefined,
                      opacity: state === 'dim' ? 0.4 : 1,
                    }}
                  >
                    <span className="mono" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line2)', display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0 }}>
                      {'ABCD'[k]}
                    </span>
                    {o}
                  </motion.button>
                );
              })}
            </div>
            {picked !== null && q.explain && <p className="muted" style={{ marginTop: 20 }}>{q.explain}</p>}
          </motion.div>
        </AnimatePresence>
        <div className="mono muted" style={{ marginTop: 40, fontSize: 12, letterSpacing: '.2em' }}>
          SCORE: {score}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { useSpoilers } from '../lib/spoilers';
import { Visual } from '../components/Visual';
import { F, ItemMediaEdit, T } from '../components/Editable';
import { Reveal } from '../components/Chrome';
import { Modal } from '../components/Modal';
import { sfx } from '../lib/sound';
import { cx, dayIndex, seeded } from '../lib/util';

// ================================ BOOKS ================================
export function Books() {
  const { col } = useCms();
  const books = col('books');
  const [open, setOpen] = useState<any>(null);
  return (
    <div className="page">
      <section style={{ padding: '80px 0 40px' }}>
        <div className="container">
          <T k="books.kicker" d="The novels by Jeff Lindsay" as="div" className="kicker red" />
          <T k="books.title" d="The Books" as="h1" className="display h-xl" style={{ margin: '10px 0 0' }} />
          <T k="books.sub" d="Before there was a show, there was a voice. Eight novels, 2004–2015. The first one became Season 1, and from there the books and the series went in very different directions." as="p" className="lead muted" />
        </div>
      </section>
      <div className="container">
        {/* the shelf */}
        <div style={{ position: 'relative', padding: '40px 30px 0', borderRadius: 20, background: 'linear-gradient(180deg, #120c0a, #0a0807)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 28, alignItems: 'end' }}>
            {books.map((b, i) => (
              <Reveal key={b.id} delay={i * 0.05}>
                <motion.button whileHover={{ y: -14, rotate: -1.5 }} onClick={() => (sfx.plastic(), setOpen(b))} style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>
                  <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '3px 8px 8px 3px', overflow: 'hidden', boxShadow: '-6px 0 0 rgba(0,0,0,.35) inset, 0 30px 50px -20px rgba(0,0,0,.9)' }}>
                    <Visual src={b.cover} seed={b.id} label={b.title} mode="name" style={{ position: 'absolute', inset: 0 }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: 'linear-gradient(90deg, rgba(0,0,0,.5), transparent)' }} />
                    {!b.cover && (
                      <div style={{ position: 'absolute', left: 16, right: 16, top: 18 }}>
                        <div className="mono" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--blood-bright)' }}>
                          #{i + 1} · {b.year}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 600 }}>{b.title}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>
                    {b.year}
                  </div>
                </motion.button>
              </Reveal>
            ))}
          </div>
          <div style={{ height: 22, margin: '26px -30px 0', background: 'linear-gradient(180deg, #3a2618, #1c120b)', borderRadius: '0 0 20px 20px', boxShadow: '0 10px 30px rgba(0,0,0,.6)' }} />
        </div>

        <div className="grid g3" style={{ marginTop: 60 }}>
          {[
            ['One voice', 'In the books, everything comes through Dexter’s first-person narration: dry, funny, and cold. The show turned that voice into the famous voice-over.'],
            ['A different passenger', 'From Dexter in the Dark onward, the books suggest the Dark Passenger is something outside of Dexter, not only a product of his trauma.'],
            ['Two paths', 'Season 1 follows the first novel closely. From Season 2 on, the series and the books tell very different stories with the same characters.'],
          ].map(([t, d]) => (
            <div key={t} className="card card-pad">
              <div className="display" style={{ fontSize: 30 }}>
                {t}
              </div>
              <p className="muted" style={{ marginBottom: 0 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} wide>
        {open && (
          <div className="grid" style={{ gridTemplateColumns: '260px 1fr', gap: 34 }}>
            <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden' }}>
              <Visual src={open.cover} seed={open.id} label={open.title} mode="name" style={{ position: 'absolute', inset: 0 }} />
              <ItemMediaEdit col="books" item={open} path="cover" label="Cover" />
            </div>
            <div>
              <div className="kicker red">
                Book {open.order} · {open.year}
              </div>
              <F col="books" item={open} path="title" as="h2" className="display" style={{ fontSize: 56, margin: '8px 0 4px' }} />
              <F col="books" item={open} path="tagline" as="div" className="serif" style={{ fontSize: 26, fontStyle: 'italic' }} />
              <F col="books" item={open} path="synopsis" as="p" className="lead" style={{ marginTop: 18 }} multiline />
              {open.note && (
                <div className="card card-pad" style={{ marginTop: 10, borderColor: 'rgba(217,164,65,.3)' }}>
                  <div className="kicker">Book vs. series</div>
                  <F col="books" item={open} path="note" as="p" style={{ margin: '6px 0 0' }} multiline />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ================================ DAILY CHALLENGE ================================
const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Daily() {
  const { col, item } = useCms();
  const { profile, user, updateProfile, track } = useAuth();
  const { isSpoiler } = useSpoilers();
  const today = dateKey();
  const daily = (profile as any)?.daily || {};
  const doneToday = daily.last === today;

  const challenges = useMemo(() => {
    const r = seeded('daily-' + today);
    const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
    const shuffle = <T,>(a: T[]) => [...a].sort(() => r() - 0.5);
    const out: { kind: string; question: string; options: string[]; answer: number; note?: string }[] = [];
    // 1. Trivia of the day
    const pool = col('trivia').filter((q) => !isSpoiler(q.spoiler));
    const tq = pick(pool);
    if (tq) {
      const opts: { o: string; i: number }[] = shuffle(tq.options.map((o: string, i: number) => ({ o, i })));
      out.push({ kind: 'Trivia', question: tq.question, options: opts.map((x) => x.o), answer: opts.findIndex((x) => x.i === tq.answer) });
    }
    // 2. Who said it?
    const quotes = col('quotes').filter((q) => !isSpoiler({ series: q.series, season: q.season, episode: q.episode }));
    const qq = pick(quotes);
    if (qq) {
      const name = (id: string) => item('characters', id)?.name || (id === 'trinity' ? 'Arthur Mitchell' : id);
      const people = [...new Set(['dexter', 'debra', 'harry', 'doakes', 'brian', 'trinity', 'rita', 'batista', qq.by])].map(name);
      const correct = name(qq.by);
      const opts = shuffle([correct, ...shuffle(people.filter((p) => p !== correct)).slice(0, 3)]);
      out.push({ kind: 'Who said it?', question: `“${qq.text}”`, options: opts, answer: opts.indexOf(correct) });
    }
    // 3. Which season?
    const eps: { s: any; e: any }[] = [];
    col('seasons')
      .filter((s) => s.series === 'dexter')
      .forEach((s) => (s.episodes || []).forEach((e: any) => !isSpoiler({ series: s.series, season: s.number, episode: e.n }) && eps.push({ s, e })));
    const ep = eps.length ? pick(eps) : null;
    if (ep) {
      const correct = `Season ${ep.s.number}`;
      const others = shuffle(Array.from({ length: 8 }, (_, i) => `Season ${i + 1}`).filter((x) => x !== correct)).slice(0, 3);
      const opts = shuffle([correct, ...others]);
      out.push({ kind: 'Which season?', question: `In which season is the episode “${ep.e.title}”?`, options: opts, answer: opts.indexOf(correct) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, col]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [left, setLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const s = Math.floor((next.getTime() - now.getTime()) / 1000);
      setLeft(`${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const finish = async (final: number) => {
    setFinished(true);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const streak = daily.last === dateKey(y) ? (daily.streak || 0) + 1 : 1;
    const best = Math.max(daily.best || 0, streak);
    await updateProfile({ daily: { last: today, streak, best, lastScore: final } });
    track('daily:done');
    if (streak >= 7) track('daily:streak7');
    if (user) addDoc(collection(db, 'scores'), { uid: user.uid, username: profile?.username || '', avatar: profile?.avatar || '', game: 'daily', level: today, score: final, at: serverTimestamp() }).catch(() => {});
  };

  const answer = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === challenges[i].answer;
    ok ? sfx.success() : sfx.fail();
    const ns = score + (ok ? 1 : 0);
    setScore(ns);
    setTimeout(() => {
      if (i + 1 >= challenges.length) finish(ns);
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 1200);
  };

  const streak = daily.streak || 0;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60, maxWidth: 1000 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <T k="daily.kicker" d="New every midnight" as="div" className="kicker red" />
            <T k="daily.title" d="Daily Challenge" as="h1" className="display h-lg" style={{ margin: '8px 0 0' }} />
          </div>
          <div className="row" style={{ gap: 26 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="display" style={{ fontSize: 64, color: 'var(--blood-bright)', lineHeight: 1 }}>
                🔥 {doneToday || finished ? (finished ? Math.max(streak, 1) : streak) : streak}
              </div>
              <div className="mono muted" style={{ fontSize: 10, letterSpacing: '.25em' }}>
                DAY STREAK
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="display" style={{ fontSize: 64, lineHeight: 1 }}>{daily.best || 0}</div>
              <div className="mono muted" style={{ fontSize: 10, letterSpacing: '.25em' }}>
                BEST
              </div>
            </div>
          </div>
        </div>

        {doneToday && !finished ? (
          <div className="card" style={{ padding: 50, textAlign: 'center', marginTop: 40 }}>
            <div className="serif" style={{ fontSize: 40, fontStyle: 'italic' }}>
              You’ve done today’s challenge. {daily.lastScore ?? 0}/3.
            </div>
            <p className="muted">The next challenge opens in</p>
            <div className="display" style={{ fontSize: 80 }}>{left}</div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/games/trivia" className="btn">
                Play trivia meanwhile
              </Link>
              <Link to="/leaderboard" className="btn">
                🏆 Leaderboard
              </Link>
            </div>
          </div>
        ) : finished ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: 50, textAlign: 'center', marginTop: 40 }}>
            <div className="display" style={{ fontSize: 140, color: score === 3 ? '#3ddc84' : 'var(--blood-bright)', lineHeight: 0.9 }}>
              {score}/3
            </div>
            <div className="serif" style={{ fontSize: 34, fontStyle: 'italic' }}>
              {score === 3 ? 'Flawless. Harry would be proud.' : score === 2 ? 'Close. Come back tomorrow.' : 'The Dark Passenger is disappointed.'}
            </div>
            <p className="muted">Next challenge in {left}</p>
          </motion.div>
        ) : challenges.length ? (
          <div style={{ marginTop: 40 }}>
            <div className="row" style={{ gap: 6, marginBottom: 30 }}>
              {challenges.map((_, k) => (
                <span key={k} style={{ flex: 1, height: 4, borderRadius: 4, background: k < i ? 'var(--blood-bright)' : k === i ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.08)' }} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="kicker">
                  {i + 1}/3 · {challenges[i].kind}
                </div>
                <h2 className="serif" style={{ fontSize: 'clamp(30px, 3.4vw, 52px)', fontWeight: 500, margin: '14px 0 34px', lineHeight: 1.15 }}>
                  {challenges[i].question}
                </h2>
                <div className="grid g2" style={{ gap: 12 }}>
                  {challenges[i].options.map((o, k) => {
                    const st = picked === null ? '' : k === challenges[i].answer ? 'right' : k === picked ? 'wrong' : 'dim';
                    return (
                      <button
                        key={k}
                        onClick={() => answer(k)}
                        className={cx('card')}
                        style={{ padding: '20px 22px', textAlign: 'left', fontSize: 17, borderColor: st === 'right' ? '#3ddc84' : st === 'wrong' ? 'var(--blood-bright)' : undefined, background: st === 'right' ? 'rgba(61,220,132,.12)' : st === 'wrong' ? 'rgba(255,42,54,.14)' : undefined, opacity: st === 'dim' ? 0.4 : 1 }}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 40 }}>
            No challenge available with your current spoiler settings.
          </div>
        )}
      </div>
    </div>
  );
}

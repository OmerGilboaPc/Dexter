import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import { Visual } from '../../components/Visual';
import { T } from '../../components/Editable';
import { sfx } from '../../lib/sound';

export default function Quiz() {
  const { col, item } = useCms();
  const { profile, updateProfile, track } = useAuth();
  const questions = col('quiz');
  const [i, setI] = useState(-1);
  const [pts, setPts] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);

  const choose = (a: any) => {
    sfx.click();
    const next = { ...pts };
    Object.entries(a.points || {}).forEach(([k, v]) => (next[k] = (next[k] || 0) + Number(v)));
    setPts(next);
    if (i + 1 >= questions.length) {
      const winner = Object.entries(next).sort((x, y) => y[1] - x[1])[0]?.[0] || 'dexter';
      setResult(winner);
      sfx.heartbeat();
      updateProfile({ quizResult: winner });
      track('quiz:done');
    } else setI(i + 1);
  };
  const restart = () => {
    setPts({});
    setResult(null);
    setI(0);
  };

  if (result) {
    const c = item('characters', result);
    const total = Object.values(pts).reduce((a, b) => a + b, 0) || 1;
    const top = Object.entries(pts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return (
      <div className="page">
        <div className="container grid" style={{ paddingTop: 50, gridTemplateColumns: '1fr 1.2fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, rotateY: 30 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: 1.2 }} className="media-card portrait-ratio" style={{ boxShadow: `0 50px 120px -30px ${c?.color || '#d90f1e'}88` }}>
            <Visual src={c?.portrait || c?.heroImage} seed={result} label={c?.name} accent={c?.color} style={{ position: 'absolute', inset: 0 }} position="center top" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}>
            <div className="kicker red">You are…</div>
            <h1 className="display" style={{ fontSize: 'clamp(70px, 10vw, 170px)', margin: '8px 0 0', lineHeight: 0.85 }}>
              {c?.name}
            </h1>
            <div className="serif" style={{ fontSize: 32, fontStyle: 'italic', marginTop: 10 }}>
              {c?.tagline}
            </div>
            <div style={{ marginTop: 30 }}>
              {top.map(([k, v]) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                    <span>{item('characters', k)?.name || k}</span>
                    <span className="mono">{Math.round((v / total) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 6, marginTop: 4 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(v / total) * 100}%` }} transition={{ duration: 1.2, delay: 0.5 }} style={{ height: '100%', borderRadius: 6, background: item('characters', k)?.color || 'var(--blood)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 30 }}>
              <Link to={`/characters/${result}`} className="btn btn-primary">
                Character page
              </Link>
              <button className="btn" onClick={restart}>
                ↻ Retake
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
              Saved to your profile{profile ? `, ${profile.username}` : ''}.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (i < 0) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '86vh', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <T k="quiz.kicker" d="Psychological evaluation" as="div" className="kicker red" />
          <T k="quiz.title" d="Which character are you?" as="h1" className="display h-lg" style={{ margin: '12px 0' }} />
          <T k="quiz.sub" d="Eight questions. No right answers. Only the truth about what’s hiding inside you." as="p" className="lead muted" style={{ margin: '0 auto' }} />
          <button className="btn btn-primary" style={{ marginTop: 34 }} onClick={() => setI(0)}>
            Start the evaluation
          </button>
        </div>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60, maxWidth: 1000 }}>
        <div className="row" style={{ gap: 6, marginBottom: 40 }}>
          {questions.map((_, k) => (
            <span key={k} style={{ flex: 1, height: 3, borderRadius: 3, background: k <= i ? 'var(--blood-bright)' : 'rgba(255,255,255,.08)', transition: 'background .4s' }} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
            <div className="mono muted" style={{ letterSpacing: '.25em', fontSize: 12 }}>
              QUESTION {i + 1} OF {questions.length}
            </div>
            <h2 className="serif" style={{ fontSize: 'clamp(36px, 4vw, 62px)', fontWeight: 500, fontStyle: 'italic', margin: '14px 0 40px', lineHeight: 1.1 }}>
              {q.question}
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {q.answers.map((a: any, k: number) => (
                <motion.button key={k} whileHover={{ x: 8 }} onClick={() => choose(a)} className="card" style={{ textAlign: 'left', padding: '22px 26px', fontSize: 19, cursor: 'pointer' }}>
                  {a.text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

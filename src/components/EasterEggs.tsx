import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { eggStore, useStore } from '../lib/bus';
import { sfx } from '../lib/sound';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Listens for secret words, the Konami code, logo clicks and hidden slides, then plays the matching egg. */
export function EasterEggs() {
  const { col, settings } = useCms();
  const { profile, updateProfile, track } = useAuth();
  const trigger = useStore(eggStore);
  const [active, setActive] = useState<any>(null);
  const buf = useRef('');
  const keys = useRef<string[]>([]);
  const eggs = col('eggs').filter((e) => e.enabled !== false);

  const fire = (egg: any) => {
    if (!egg || !settings.features.eggs) return;
    setActive(egg);
    if (egg.audio) {
      const a = new Audio(egg.audio);
      a.volume = 0.8;
      a.play().catch(() => {});
    } else {
      egg.style === 'doakes' ? sfx.fail() : egg.style === 'ice' ? sfx.plastic() : sfx.heartbeat();
    }
    const found = (profile as any)?.eggs || {};
    if (!found[egg.id]) {
      updateProfile({ eggs: { ...found, [egg.id]: Date.now() } });
      track('egg');
    }
  };

  useEffect(() => {
    if (!trigger) return;
    const egg = eggs.find((e) => e.trigger === trigger.trigger);
    fire(egg);
    eggStore.set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      keys.current = [...keys.current, e.key].slice(-KONAMI.length);
      if (keys.current.join(',').toLowerCase() === KONAMI.join(',').toLowerCase()) {
        keys.current = [];
        fire(eggs.find((x) => x.trigger === 'konami'));
        return;
      }
      if (e.key.length === 1) {
        buf.current = (buf.current + e.key.toLowerCase()).slice(-24);
        const hit = eggs.find((x) => x.trigger === 'word' && x.word && buf.current.endsWith(String(x.word).toLowerCase()));
        if (hit) {
          buf.current = '';
          fire(hit);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(null), active.style === 'newspaper' ? 6000 : 4800);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          onClick={() => setActive(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'grid', placeItems: 'center', cursor: 'pointer', overflow: 'hidden', background: eggBg(active.style) }}
        >
          {active.style === 'donuts' &&
            Array.from({ length: 40 }).map((_, i) => (
              <motion.div key={i} initial={{ y: -100, x: `${Math.random() * 100}vw`, rotate: 0 }} animate={{ y: '110vh', rotate: 360 }} transition={{ duration: 2 + Math.random() * 2.5, delay: Math.random() * 1.5, ease: 'easeIn' }} style={{ position: 'absolute', top: 0, left: 0, fontSize: 40 + Math.random() * 30 }}>
                🍩
              </motion.div>
            ))}
          {active.style === 'blood' &&
            Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${40 + Math.random() * 70}vh` }}
                transition={{ duration: 1.6 + Math.random(), delay: Math.random() * 0.6, ease: [0.5, 0, 0.2, 1] }}
                style={{ position: 'absolute', top: 0, left: `${(i / 18) * 100 + Math.random() * 4}%`, width: 8 + Math.random() * 26, background: 'linear-gradient(#5a0007, #b3101c)', borderRadius: '0 0 40px 40px' }}
              />
            ))}
          {active.style === 'ice' && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 200px 60px rgba(180,225,255,.45)', backdropFilter: 'blur(3px) saturate(.4)' }} />}
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', textAlign: 'center', padding: 30, maxWidth: 1000 }}>
            {active.image && <img src={active.image} alt="" style={{ maxHeight: '50vh', margin: '0 auto 24px', borderRadius: 12 }} />}
            {active.style === 'newspaper' ? (
              <div style={{ background: '#e9e2d0', color: '#111', padding: '34px 44px', transform: 'rotate(-2deg)', boxShadow: '0 40px 100px rgba(0,0,0,.8)', fontFamily: 'Georgia, serif' }}>
                <div style={{ fontSize: 14, letterSpacing: '.3em', borderBottom: '3px double #111', paddingBottom: 8, marginBottom: 14 }}>THE MIAMI TRIBUNE · SPECIAL EDITION</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(40px, 7vw, 92px)', lineHeight: 0.95 }}>{active.title}</div>
                <div style={{ fontSize: 18, marginTop: 14, fontStyle: 'italic' }}>{active.text}</div>
              </div>
            ) : (
              <>
                <div className={active.style === 'doakes' ? 'display' : 'serif'} style={{ fontSize: active.style === 'doakes' ? 'clamp(60px, 10vw, 170px)' : 'clamp(42px, 6vw, 96px)', fontStyle: active.style === 'doakes' ? 'normal' : 'italic', lineHeight: 1, color: active.style === 'ice' ? '#dff3ff' : '#fff', textShadow: active.style === 'doakes' ? '0 0 60px rgba(255,42,54,.6)' : 'none' }}>
                  {active.title}
                </div>
                <div className="mono" style={{ marginTop: 22, letterSpacing: '.2em', fontSize: 13, color: active.style === 'ice' ? '#bfe6ff' : 'var(--muted)' }}>
                  {active.text}
                </div>
              </>
            )}
            <div className="kicker" style={{ marginTop: 34 }}>
              🥚 Easter egg found
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function eggBg(style: string) {
  switch (style) {
    case 'doakes':
      return 'radial-gradient(circle at center, rgba(120,0,10,.9), rgba(0,0,0,.97))';
    case 'ice':
      return 'radial-gradient(circle at center, rgba(20,40,60,.85), rgba(2,6,12,.96))';
    case 'newspaper':
      return 'rgba(0,0,0,.85)';
    case 'donuts':
      return 'rgba(10,6,4,.8)';
    default:
      return 'rgba(0,0,0,.9)';
  }
}

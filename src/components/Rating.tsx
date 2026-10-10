import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/auth';
import { sfx } from '../lib/sound';

/** Community rating for any target id (season, episode…). Each user gets one vote. */
export function Rating({ target, size = 26 }: { target: string; size?: number }) {
  const { user, track } = useAuth();
  const [all, setAll] = useState<{ uid: string; value: number }[]>([]);
  const [hover, setHover] = useState(0);
  useEffect(() => onSnapshot(query(collection(db, 'ratings'), where('target', '==', target)), (s) => setAll(s.docs.map((d) => d.data() as any)), () => {}), [target]);
  const mine = all.find((r) => r.uid === user?.uid)?.value || 0;
  const avg = all.length ? all.reduce((a, b) => a + b.value, 0) / all.length : 0;
  const rate = async (v: number) => {
    if (!user) return;
    sfx.drip();
    const first = !mine;
    await setDoc(doc(db, 'ratings', `${target}__${user.uid}`), { uid: user.uid, target, value: v, at: serverTimestamp() });
    if (first) track('rating');
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4 }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => {
          const on = (hover || mine) >= i;
          return (
            <button key={i} onMouseEnter={() => setHover(i)} onClick={() => rate(i)} aria-label={`${i} drops`} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', transform: on ? 'scale(1.08)' : 'none', transition: 'transform .2s' }}>
              <svg width={size * 0.75} height={size} viewBox="0 0 24 32">
                <path d="M12 1C12 1 2 15 2 21.5a10 10 0 0 0 20 0C22 15 12 1 12 1z" fill={on ? 'var(--blood-bright)' : 'transparent'} stroke={on ? 'var(--blood-bright)' : 'rgba(255,255,255,.35)'} strokeWidth="1.5" style={{ filter: on ? 'drop-shadow(0 0 6px rgba(255,42,54,.6))' : 'none', transition: 'all .25s' }} />
              </svg>
            </button>
          );
        })}
      </div>
      <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '.1em' }}>
        {all.length ? (
          <>
            <span style={{ color: '#fff', fontSize: 16 }}>{avg.toFixed(1)}</span> / 5 · {all.length} {all.length === 1 ? 'vote' : 'votes'}
          </>
        ) : (
          'Be the first to rate'
        )}
        {mine ? ` · yours: ${mine}` : ''}
      </div>
    </div>
  );
}

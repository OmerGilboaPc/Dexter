import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { T } from '../../components/Editable';
import { sfx } from '../../lib/sound';
import { cx } from '../../lib/util';

const W = 960;
const H = 600;
type Pattern = 'impact' | 'castoff' | 'gunshot';
const PATTERNS: { id: Pattern; name: string; weapon: string; desc: string }[] = [
  { id: 'impact', name: 'Medium-velocity impact', weapon: 'Blunt object (bat, hammer, fist)', desc: 'Drops 1–4 mm across, radiating out from a single point of impact.' },
  { id: 'castoff', name: 'Cast-off', weapon: 'Swung blade or bloodied weapon', desc: 'A line of drops thrown off the weapon as it swings, with the tails pointing in the direction of the swing.' },
  { id: 'gunshot', name: 'High-velocity', weapon: 'Firearm', desc: 'A fine mist of tiny drops (under 1 mm) in a dense spray.' },
];

type Drop = { x: number; y: number; r: number; e: number; a: number };

function makeScene(seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pattern: Pattern = (['impact', 'castoff', 'gunshot'] as Pattern[])[Math.floor(rnd() * 3)];
  const ox = 180 + rnd() * (W - 360);
  const oy = 140 + rnd() * (H - 280);
  const drops: Drop[] = [];
  if (pattern === 'castoff') {
    const ang = rnd() * Math.PI * 2;
    const curve = (rnd() - 0.5) * 0.004;
    let x = ox,
      y = oy,
      a = ang;
    const n = 22 + Math.floor(rnd() * 10);
    for (let k = 0; k < n; k++) {
      a += curve * 30;
      x += Math.cos(a) * (14 + rnd() * 10);
      y += Math.sin(a) * (14 + rnd() * 10);
      if (x < 20 || x > W - 20 || y < 20 || y > H - 20) break;
      drops.push({ x: x + (rnd() - 0.5) * 8, y: y + (rnd() - 0.5) * 8, r: Math.max(1.4, 5.5 - k * 0.14 + rnd() * 1.5), e: 1.8 + rnd() * 1.6, a });
    }
  } else {
    const n = pattern === 'gunshot' ? 340 : 70;
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2;
      const d = (pattern === 'gunshot' ? 20 : 30) + Math.pow(rnd(), 0.9) * (pattern === 'gunshot' ? 190 : 260);
      const x = ox + Math.cos(a) * d;
      const y = oy + Math.sin(a) * d;
      if (x < 8 || x > W - 8 || y < 8 || y > H - 8) continue;
      const base = pattern === 'gunshot' ? 0.6 + rnd() * 1.1 : 1.8 + rnd() * 4.2;
      drops.push({ x, y, r: base * (1 - d / 400), e: 1 + (d / 260) * (1.2 + rnd() * 1.8), a });
    }
  }
  return { pattern, ox, oy, drops };
}

function drawScene(ctx: CanvasRenderingContext2D, scene: ReturnType<typeof makeScene>, luminol: boolean) {
  // surface: off-white tiles / concrete
  ctx.fillStyle = luminol ? '#05070c' : '#d9d4c9';
  ctx.fillRect(0, 0, W, H);
  if (!luminol) {
    const img = ctx.getImageData(0, 0, W, H);
    for (let p = 0; p < img.data.length; p += 4) {
      const n = (Math.random() - 0.5) * 18;
      img.data[p] += n;
      img.data[p + 1] += n;
      img.data[p + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(0,0,0,.08)';
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  for (const d of scene.drops) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.a);
    const len = d.r * d.e;
    if (luminol) {
      ctx.shadowColor = 'rgba(80,170,255,.9)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(120,200,255,.95)';
    } else {
      const g = ctx.createRadialGradient(-len * 0.2, 0, 0, 0, 0, len);
      g.addColorStop(0, '#5a050b');
      g.addColorStop(0.7, '#7d0a12');
      g.addColorStop(1, '#8f1018');
      ctx.fillStyle = g;
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, len, d.r, 0, 0, Math.PI * 2);
    ctx.fill();
    // tail pointing away from the origin (direction of travel)
    if (d.e > 1.4) {
      ctx.beginPath();
      ctx.moveTo(len * 0.7, -d.r * 0.35);
      ctx.quadraticCurveTo(len * 1.6, 0, len * (1.7 + d.e * 0.2), 0);
      ctx.quadraticCurveTo(len * 1.6, 0, len * 0.7, d.r * 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(len * (2 + d.e * 0.25), 0, Math.max(0.5, d.r * 0.28), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export default function BloodSpatter() {
  const { user, profile, updateProfile, track } = useAuth();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9) + 1);
  const scene = useMemo(() => makeScene(seed), [seed]);
  const [luminol, setLuminol] = useState(false);
  const [guess, setGuess] = useState<{ x: number; y: number } | null>(null);
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!;
    drawScene(ctx, scene, luminol);
    if (revealed) {
      ctx.strokeStyle = luminol ? 'rgba(255,255,255,.35)' : 'rgba(193,18,31,.45)';
      ctx.lineWidth = 1;
      const sample = scene.pattern === 'castoff' ? scene.drops : scene.drops.filter((_, k) => k % Math.ceil(scene.drops.length / 26) === 0);
      for (const d of sample) {
        ctx.beginPath();
        if (scene.pattern === 'castoff') {
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + Math.cos(d.a) * 30, d.y + Math.sin(d.a) * 30);
        } else {
          ctx.moveTo(d.x + Math.cos(d.a) * 40, d.y + Math.sin(d.a) * 40);
          ctx.lineTo(scene.ox, scene.oy);
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#ff2a36';
      ctx.beginPath();
      ctx.arc(scene.ox, scene.oy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (guess) {
      ctx.strokeStyle = luminol ? '#fff' : '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(guess.x, guess.y, 14, 0, Math.PI * 2);
      ctx.moveTo(guess.x - 22, guess.y);
      ctx.lineTo(guess.x + 22, guess.y);
      ctx.moveTo(guess.x, guess.y - 22);
      ctx.lineTo(guess.x, guess.y + 22);
      ctx.stroke();
      if (revealed) {
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(guess.x, guess.y);
        ctx.lineTo(scene.ox, scene.oy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [scene, luminol, guess, revealed]);

  const dist = guess ? Math.hypot(guess.x - scene.ox, guess.y - scene.oy) : 999;
  const locScore = Math.round(60 * Math.max(0, 1 - dist / 220));
  const patScore = pattern === scene.pattern ? 40 : 0;
  const score = locScore + patScore;

  const reveal = () => {
    if (!guess || !pattern) return;
    setRevealed(true);
    setTotal((t) => t + score);
    score >= 70 ? sfx.success() : sfx.fail();
    track('spatter:round');
    if (score >= 90) track('spatter:expert');
    if (score > (profile?.spatterBest || 0)) updateProfile({ spatterBest: score });
    if (user) addDoc(collection(db, 'scores'), { uid: user.uid, username: profile?.username || '', avatar: profile?.avatar || '', game: 'spatter', level: '', score, at: serverTimestamp() }).catch(() => {});
  };
  const next = () => {
    setSeed(Math.floor(Math.random() * 1e9) + 1);
    setGuess(null);
    setPattern(null);
    setRevealed(false);
    setRound((r) => r + 1);
    sfx.whoosh();
  };

  const sample = scene.drops[Math.floor(scene.drops.length / 2)];
  const width = sample ? sample.r * 2 : 2;
  const length = sample ? sample.r * sample.e * 2 : 2;
  const angle = Math.round((Math.asin(Math.min(1, width / length)) * 180) / Math.PI);
  const pat = PATTERNS.find((p) => p.id === scene.pattern)!;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
          <div>
            <T k="spatter.kicker" d="Miami Metro Forensics Lab" as="div" className="kicker red" />
            <T k="spatter.title" d="Blood Spatter Lab" as="h1" className="display h-md" style={{ margin: '8px 0 0' }} />
          </div>
          <div className="row" style={{ gap: 24 }}>
            <div className="mono muted" style={{ fontSize: 12, letterSpacing: '.2em' }}>
              SCENE #{round} · TOTAL {total} · BEST {profile?.spatterBest ?? '—'}
            </div>
            <button className={cx('btn btn-sm', luminol && 'btn-primary')} onClick={() => setLuminol(!luminol)} style={luminol ? { background: '#1f6fff', borderColor: '#1f6fff' } : undefined}>
              🔦 Luminol {luminol ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 380px', gap: 26, alignItems: 'start' }}>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line2)', boxShadow: '0 40px 100px -30px rgba(0,0,0,.9)' }}>
            <canvas
              ref={canvas}
              width={W}
              height={H}
              style={{ width: '100%', display: 'block', cursor: revealed ? 'default' : 'crosshair' }}
              onClick={(e) => {
                if (revealed) return;
                const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
                setGuess({ x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H });
                sfx.drip();
              }}
            />
            <div className="mono" style={{ position: 'absolute', left: 14, top: 12, fontSize: 10, letterSpacing: '.25em', color: luminol ? '#9cc8ff' : '#333' }}>
              EVIDENCE PHOTO · SCALE 1:1 · {new Date().toLocaleDateString('en-US')}
            </div>
          </div>
          <div>
            <div className="card card-pad">
              <div className="kicker">Step 1</div>
              <p style={{ margin: '6px 0 0' }}>{scene.pattern === 'castoff' && revealed ? 'For cast-off, the origin is where the swing started.' : 'Click the area of convergence, the point where the blood came from.'}</p>
              <div className="mono" style={{ fontSize: 12, marginTop: 8, color: guess ? 'var(--gold)' : 'var(--muted)' }}>
                {guess ? `✓ Marked (${Math.round(guess.x)}, ${Math.round(guess.y)})` : 'Waiting for a click on the evidence'}
              </div>
            </div>
            <div className="card card-pad" style={{ marginTop: 14 }}>
              <div className="kicker">Step 2 · Pattern</div>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {PATTERNS.map((p) => {
                  const right = revealed && p.id === scene.pattern;
                  const wrong = revealed && p.id === pattern && p.id !== scene.pattern;
                  return (
                    <button key={p.id} disabled={revealed} onClick={() => setPattern(p.id)} className="card" style={{ textAlign: 'left', padding: 14, cursor: 'pointer', borderColor: right ? '#3ddc84' : wrong ? 'var(--blood-bright)' : pattern === p.id ? 'var(--gold)' : undefined, background: pattern === p.id && !revealed ? 'rgba(217,164,65,.08)' : undefined }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {p.weapon}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {!revealed ? (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} disabled={!guess || !pattern} onClick={reveal}>
                Submit analysis
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card card-pad" style={{ marginTop: 14, borderColor: score >= 70 ? '#3ddc8466' : 'rgba(255,42,54,.4)' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="kicker">Lab report</div>
                  <div className="display" style={{ fontSize: 54, color: score >= 70 ? '#3ddc84' : 'var(--blood-bright)' }}>
                    {score}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Location: {locScore}/60 ({Math.round(dist)} px off) · Pattern: {patScore}/40
                </div>
                <p style={{ fontSize: 14.5, color: '#d6d1c9', marginBottom: 0 }}>
                  <b>{pat.name}.</b> {pat.desc} A sample drop measures about {width.toFixed(1)}×{length.toFixed(1)} units, so the angle of impact is arcsin(w/l) ≈ <b>{angle}°</b>.
                </p>
                <p className="serif" style={{ fontStyle: 'italic', fontSize: 19, marginBottom: 0 }}>
                  {score >= 90 ? '“Blood never lies. And neither do you, apparently.”' : score >= 60 ? '“Close. Close enough for Masuka, anyway.”' : '“Blood doesn’t lie. But it can be misread.”'}
                </p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={next}>
                  Next scene →
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { useSpoilers } from '../lib/spoilers';
import { Visual } from '../components/Visual';
import { F, ItemMediaEdit, T } from '../components/Editable';
import { Spoiler } from '../components/Spoiler';
import { VictimCard } from '../components/Cards';
import { woodTex, velvetTex, slideLabel } from './killroom/textures';
import { sfx } from '../lib/sound';
import { cx } from '../lib/util';

const COLS = 6;
const SX = 0.86;
const SZ = 0.34;

function Slide({ v, i, index, active, selected, hidden, onHover, onClick }: { v: any; i: number; index: number; active: boolean; selected: boolean; hidden: boolean; onHover: (b: boolean) => void; onClick: () => void }) {
  const g = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const base = useMemo(() => new THREE.Vector3((col - (COLS - 1) / 2) * SX, 0.06, row * SZ), [col, row]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#dff1f6', transparent: true, opacity: 0.38, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }), []);
  const label = useMemo(() => slideLabel(index, hidden ? '#9aa0a6' : '#f4f1ea'), [index, hidden]);
  const dropColor = v.killer === 'brian' ? '#2a6fb0' : '#7a0710';
  useFrame((_, dt) => {
    if (!g.current) return;
    const target = tmp.copy(base);
    let rx = 0;
    if (!active) target.y = -0.02;
    if (hover && active) target.y += 0.06;
    if (selected) {
      target.y += 0.55;
      target.z -= 0.15;
      rx = -0.9;
    }
    g.current.position.lerp(target, Math.min(1, dt * 8));
    g.current.rotation.x += (rx - g.current.rotation.x) * Math.min(1, dt * 8);
    const s = active ? 1 : 0.92;
    g.current.scale.lerp(sc.set(s, s, s), Math.min(1, dt * 6));
  });
  return (
    <group
      ref={g}
      position={base}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!active) return;
        setHover(true);
        onHover(true);
        sfx.hover();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        onHover(false);
        document.body.style.cursor = '';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (active) onClick();
      }}
    >
      <mesh material={glass} castShadow receiveShadow>
        <boxGeometry args={[0.75, 0.012, 0.25]} />
      </mesh>
      <mesh position={[-0.27, 0.0075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 0.23]} />
        <meshStandardMaterial map={label} roughness={0.9} transparent opacity={active ? 1 : 0.35} />
      </mesh>
      {!hidden ? (
        <mesh position={[0.08, 0.009, 0]} scale={[1, 0.18, 0.85]}>
          <sphereGeometry args={[0.055, 24, 16]} />
          <meshPhysicalMaterial color={dropColor} roughness={0.12} clearcoat={1} emissive={selected || hover ? dropColor : '#000'} emissiveIntensity={selected || hover ? 0.8 : 0} transparent opacity={active ? 1 : 0.3} />
        </mesh>
      ) : (
        <mesh position={[0.08, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.055, 24]} />
          <meshStandardMaterial color="#5a5f66" roughness={0.9} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

function SlideBox({ list, activeIds, selectedId, onSelect, hiddenIds }: { list: any[]; activeIds: Set<string>; selectedId: string | null; onSelect: (v: any) => void; hiddenIds: Set<string> }) {
  const rows = Math.max(1, Math.ceil(list.length / COLS));
  const width = COLS * SX + 0.3;
  const depth = rows * SZ + 0.3;
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.45, metalness: 0.05 }), []);
  const zc = ((rows - 1) * SZ) / 2;
  return (
    <group position={[0, 0, -zc]}>
      {/* floor velvet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, zc]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={velvetTex()} roughness={1} />
      </mesh>
      <mesh position={[0, 0.0, zc]} material={wood} receiveShadow castShadow>
        <boxGeometry args={[width + 0.12, 0.06, depth + 0.12]} />
      </mesh>
      {[
        [0, -depth / 2 - 0.03, width + 0.12, 0.06],
        [0, depth / 2 + 0.03, width + 0.12, 0.06],
      ].map(([x, z, w, d], k) => (
        <mesh key={k} position={[x, 0.13, (z as number) + zc]} material={wood} castShadow>
          <boxGeometry args={[w as number, 0.22, d as number]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2 + 0.03), 0.13, zc]} material={wood} castShadow>
          <boxGeometry args={[0.06, 0.22, depth + 0.12]} />
        </mesh>
      ))}
      {/* row dividers */}
      {Array.from({ length: rows + 1 }).map((_, r) => (
        <mesh key={r} position={[0, 0.05, r * SZ - SZ / 2]} material={wood}>
          <boxGeometry args={[width, 0.02, 0.012]} />
        </mesh>
      ))}
      {/* open lid */}
      <group position={[0, 0.24, -depth / 2 - 0.03]} rotation={[-1.95, 0, 0]}>
        <mesh position={[0, 0, depth / 2]} material={wood} castShadow>
          <boxGeometry args={[width + 0.12, 0.05, depth + 0.12]} />
        </mesh>
        <mesh position={[0, -0.03, depth / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial map={velvetTex()} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {list.map((v, i) => (
        <Slide key={v.id} v={v} i={i} index={i + 1} active={activeIds.has(v.id)} hidden={hiddenIds.has(v.id)} selected={selectedId === v.id} onHover={() => {}} onClick={() => onSelect(v)} />
      ))}
    </group>
  );
}

export default function KillCount() {
  const { col, item, editMode } = useCms();
  const { track } = useAuth();
  const { isSpoiler, label } = useSpoilers();
  const [params, setParams] = useSearchParams();
  const all = col('victims');
  const series = col('series');
  const [killer, setKiller] = useState<'dexter' | 'both' | 'brian'>('dexter');
  const [ser, setSer] = useState('all');
  const [season, setSeason] = useState(0);
  const [code, setCode] = useState<'all' | 'yes' | 'no'>('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'box' | 'list'>('box');
  const [sel, setSel] = useState<any>(() => all.find((v) => v.id === params.get('v')) || null);

  useEffect(() => {
    const id = params.get('v');
    if (id) {
      const v = all.find((x) => x.id === id);
      if (v) {
        setSel(v);
        if (v.killer === 'brian') setKiller('both');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pool = useMemo(() => all.filter((v) => (killer === 'both' ? true : v.killer === killer)), [all, killer]);
  const active = useMemo(
    () =>
      new Set(
        pool
          .filter((v) => (ser === 'all' || v.series === ser) && (!season || v.season === season) && (code === 'all' || (code === 'yes' ? v.code : !v.code)) && (!q || (v.name + ' ' + v.method + ' ' + v.reason).toLowerCase().includes(q.toLowerCase())))
          .map((v) => v.id),
      ),
    [pool, ser, season, code, q],
  );
  const hidden = useMemo(() => new Set(pool.filter((v) => isSpoiler({ series: v.series, season: v.season, episode: v.episode })).map((v) => v.id)), [pool, isSpoiler]);
  const seasonsOf = col('seasons').filter((s) => s.series === ser);

  const select = (v: any) => {
    sfx.slash();
    setSel(v);
    setParams({ v: v.id }, { replace: true });
    track('slide:open');
  };
  const selIndex = sel ? pool.findIndex((v) => v.id === sel.id) : -1;
  const selSeason = sel ? col('seasons').find((s) => s.series === sel.series && s.number === sel.season) : null;
  const selSeries = sel ? item('series', sel.series) : null;

  return (
    <div style={{ height: '100vh', paddingTop: 'var(--nav-h)', display: 'grid', gridTemplateColumns: '320px 1fr', background: 'radial-gradient(ellipse at center, #1a0b0c, #050505 70%)' }}>
      <aside style={{ overflow: 'auto', padding: '26px 22px', borderRight: '1px solid var(--line)', background: 'rgba(8,8,10,.8)' }}>
        <T k="kc.kicker" d="Evidence" as="div" className="kicker red" />
        <T k="kc.title" d="Kill Count" as="h1" className="display" style={{ fontSize: 64, margin: '6px 0 0' }} />
        <div className="display" style={{ fontSize: 96, color: 'var(--blood-bright)', lineHeight: 0.9, textShadow: '0 0 50px rgba(255,42,54,.4)' }}>
          {active.size}
        </div>
        <div className="mono muted" style={{ fontSize: 11, letterSpacing: '.2em' }}>
          SLIDES SHOWING · {pool.length} TOTAL
        </div>

        <label className="label" style={{ marginTop: 24 }}>
          Killer
        </label>
        <div className="tabs" style={{ width: '100%' }}>
          {(
            [
              ['dexter', 'Dexter'],
              ['both', 'Both'],
              ['brian', 'Brian'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={cx('tab', killer === k && 'on')} style={{ flex: 1 }} onClick={() => setKiller(k)}>
              {l}
            </button>
          ))}
        </div>

        <label className="label" style={{ marginTop: 20 }}>
          Series
        </label>
        <div className="row" style={{ gap: 6 }}>
          <button
            className={cx('chip', ser === 'all' && 'on')}
            onClick={() => {
              setSer('all');
              setSeason(0);
            }}
          >
            All
          </button>
          {series.map((s) => (
            <button
              key={s.id}
              className={cx('chip', ser === s.id && 'on')}
              onClick={() => {
                setSer(s.id);
                setSeason(0);
              }}
            >
              {s.short}
            </button>
          ))}
        </div>
        {ser !== 'all' && seasonsOf.length > 1 && (
          <select className="select" style={{ marginTop: 12 }} value={season} onChange={(e) => setSeason(Number(e.target.value))}>
            <option value={0}>All seasons</option>
            {seasonsOf.map((s) => (
              <option key={s.id} value={s.number}>
                {s.title}
              </option>
            ))}
          </select>
        )}

        <label className="label" style={{ marginTop: 20 }}>
          The Code
        </label>
        <div className="tabs" style={{ width: '100%' }}>
          {(
            [
              ['all', 'All'],
              ['yes', 'By the code'],
              ['no', 'Broke it'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={cx('tab', code === k && 'on')} style={{ flex: 1, padding: '9px 8px' }} onClick={() => setCode(k)}>
              {l}
            </button>
          ))}
        </div>
        <input className="input" style={{ marginTop: 18 }} placeholder="Search name, method…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="tabs" style={{ marginTop: 18, width: '100%' }}>
          <button className={cx('tab', view === 'box' && 'on')} style={{ flex: 1 }} onClick={() => setView('box')}>
            3D box
          </button>
          <button className={cx('tab', view === 'list' && 'on')} style={{ flex: 1 }} onClick={() => setView('list')}>
            List
          </button>
        </div>
        {editMode && (
          <Link to="/admin/c/victims" data-edit-only className="btn btn-sm" style={{ marginTop: 18, width: '100%' }}>
            ✎ Manage victims
          </Link>
        )}
      </aside>

      <div style={{ position: 'relative', overflow: view === 'list' ? 'auto' : 'hidden' }}>
        {view === 'box' ? (
          <Canvas shadows dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance', stencil: false }} camera={{ position: [0, 4.2, 4.6], fov: 40 }} onPointerMissed={() => setSel(null)}>
            <color attach="background" args={['#070606']} />
            <fog attach="fog" args={['#070606', 8, 18]} />
            <ambientLight intensity={0.25} />
            <spotLight position={[0, 6, 2]} angle={0.7} penumbra={0.6} intensity={60} castShadow shadow-mapSize={[1024, 1024]} color="#fff1dc" />
            <pointLight position={[-4, 2, 3]} intensity={6} color="#d90f1e" distance={12} />
            <pointLight position={[4, 2, -2]} intensity={3} color="#7cc4ff" distance={12} />
            <Suspense fallback={null}>
              <SlideBox list={pool} activeIds={active} selectedId={sel?.id || null} onSelect={select} hiddenIds={hidden} />
              <ContactShadows position={[0, -0.04, 0]} opacity={0.6} scale={14} blur={2.5} far={3} frames={1} resolution={256} />
            </Suspense>
            <OrbitControls makeDefault target={[0, 0, 0]} minDistance={1.2} maxDistance={10} maxPolarAngle={Math.PI * 0.46} enableDamping />
            <EffectComposer multisampling={2}>
              <Bloom intensity={0.6} luminanceThreshold={0.7} mipmapBlur />
              <Noise opacity={0.05} premultiply />
              <Vignette offset={0.25} darkness={0.75} />
            </EffectComposer>
          </Canvas>
        ) : (
          <div style={{ padding: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, alignContent: 'start' }}>
            {pool
              .filter((v) => active.has(v.id))
              .map((v) => (
                <VictimCard key={v.id} v={v} onClick={() => select(v)} />
              ))}
          </div>
        )}
        {view === 'box' && !sel && (
          <div className="mono muted" style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 11, letterSpacing: '.2em', pointerEvents: 'none' }}>
            CLICK A SLIDE · DRAG TO ROTATE · SCROLL TO ZOOM
          </div>
        )}
        <AnimatePresence>
          {sel && (
            <motion.div key={sel.id} className="glass" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'absolute', top: 20, right: 20, bottom: 20, width: 400, borderRadius: 20, overflow: 'auto', zIndex: 5 }}>
              <button className="btn btn-icon btn-sm" style={{ position: 'absolute', top: 12, right: 12, zIndex: 3 }} onClick={() => setSel(null)}>
                ✕
              </button>
              <Spoiler marker={{ series: sel.series, season: sel.season, episode: sel.episode }}>
                <div style={{ height: 220, position: 'relative' }}>
                  <Visual src={sel.image} seed={sel.id} label={sel.name} accent={sel.killer === 'brian' ? '#2a6fb0' : '#d90f1e'} mode="name" style={{ position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(12,12,16,.95))' }} />
                  <ItemMediaEdit col="victims" item={sel} path="image" style={{ top: 12, left: 12, right: 'auto' }} />
                  <div className="mono" style={{ position: 'absolute', left: 22, bottom: 16, fontSize: 12, letterSpacing: '.25em', color: sel.killer === 'brian' ? '#7cc4ff' : 'var(--blood-bright)' }}>
                    SLIDE #{String(selIndex + 1).padStart(3, '0')} · {sel.killer === 'brian' ? 'ICE TRUCK KILLER' : 'DEXTER MORGAN'}
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <F col="victims" item={sel} path="name" as="h2" className="display" style={{ fontSize: 46, margin: 0 }} />
                  <div className="row" style={{ marginTop: 8 }}>
                    <span className="badge">{selSeries?.short}</span>
                    <span className="badge">
                      S{sel.season}
                      {sel.episode ? `E${sel.episode}` : ''}
                    </span>
                    <span className={cx('badge', sel.code ? 'gold' : 'red')}>{sel.code ? '✓ By the code' : '✗ Broke the code'}</span>
                  </div>
                  {selSeason && sel.episode && (
                    <Link to={`/seasons/${selSeason.id}#ep-${sel.episode}`} className="muted" style={{ display: 'block', fontSize: 13, marginTop: 10 }}>
                      → {selSeason.episodes?.find((e: any) => e.n === sel.episode)?.title}
                    </Link>
                  )}
                  <div className="kicker" style={{ marginTop: 22 }}>
                    Why
                  </div>
                  <F col="victims" item={sel} path="reason" as="p" style={{ margin: '6px 0 0', color: '#d6d1c9' }} multiline />
                  <div className="kicker" style={{ marginTop: 18 }}>
                    Method
                  </div>
                  <F col="victims" item={sel} path="method" as="p" style={{ margin: '6px 0 0', color: '#d6d1c9' }} />
                  {(sel.notes || editMode) && (
                    <>
                      <div className="kicker" style={{ marginTop: 18 }}>
                        Notes
                      </div>
                      <F col="victims" item={sel} path="notes" as="p" className="serif" style={{ margin: '6px 0 0', fontSize: 20, fontStyle: 'italic' }} multiline />
                    </>
                  )}
                </div>
              </Spoiler>
              {isSpoiler({ series: sel.series, season: sel.season, episode: sel.episode }) && (
                <div className="muted" style={{ padding: '0 24px 24px', fontSize: 12 }}>
                  This slide is beyond your viewing progress ({label({ series: sel.series, season: sel.season, episode: sel.episode })}).
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

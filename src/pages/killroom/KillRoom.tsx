import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerformanceMonitor } from '@react-three/drei';
import { QUALITY, QualityCtx, Quality } from './quality';
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette, ChromaticAberration, HueSaturation, BrightnessContrast, Sepia, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCms } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import { Character, POSES, JOINTS, JOINT_LABELS, Pose, Outfit } from './Mannequin';
import { KillRoomScene, BoatScene, TruckScene } from './Scenes';
import { ApartmentScene, ContainerScene, CabinScene, VaultScene, SceneProps, defaultProps, PropsState } from './Scenes2';
import { sfx } from '../../lib/sound';
import { toast } from '../../lib/bus';
import { cx } from '../../lib/util';

type SceneId = 'killroom' | 'boat' | 'truck' | 'apartment' | 'container' | 'cabin' | 'vault';
const SCENES: { id: SceneId; name: string; sub: string }[] = [
  { id: 'killroom', name: 'The Kill Room', sub: 'Plastic sheeting · an abandoned warehouse' },
  { id: 'boat', name: 'Slice of Life', sub: 'The Gulf Stream · 2:00 AM' },
  { id: 'truck', name: 'The Ice Truck', sub: 'Refrigerated · −18°C' },
  { id: 'apartment', name: 'The Apartment', sub: 'Miami · behind the A/C unit' },
  { id: 'container', name: 'The Container', sub: 'Port of Miami · where it began' },
  { id: 'cabin', name: 'Iron Lake Cabin', sub: 'New Blood · −12°C outside' },
  { id: 'vault', name: 'Prater’s Vault', sub: 'New York · the collection' },
];

const FILTERS: Record<string, { label: string; hue: number; sat: number; bri: number; con: number; sepia: number; chroma: number; grain: number }> = {
  none: { label: 'Natural', hue: 0, sat: 0, bri: 0, con: 0, sepia: 0, chroma: 0, grain: 0 },
  cinema: { label: 'Showtime Cinema', hue: 0, sat: -0.1, bri: -0.02, con: 0.18, sepia: 0.12, chroma: 0.0006, grain: 0.06 },
  noir: { label: 'Noir', hue: 0, sat: -1, bri: -0.02, con: 0.32, sepia: 0, chroma: 0, grain: 0.12 },
  miami: { label: 'Miami Heat', hue: -0.08, sat: 0.25, bri: 0.03, con: 0.12, sepia: 0.35, chroma: 0.0008, grain: 0.05 },
  ironlake: { label: 'Iron Lake Cold', hue: 0.35, sat: -0.35, bri: 0.02, con: 0.1, sepia: 0, chroma: 0, grain: 0.06 },
  vhs: { label: 'VHS 1991', hue: 0.05, sat: 0.2, bri: 0.02, con: -0.05, sepia: 0.1, chroma: 0.0045, grain: 0.22 },
  blood: { label: 'Blood Moon', hue: -0.12, sat: 0.5, bri: -0.06, con: 0.25, sepia: 0.25, chroma: 0.001, grain: 0.08 },
};

const OUTFITS: Record<string, Outfit> = {
  dexter: { shirt: '#4a4f2c', pants: '#6b5a44', skin: '#d7ad91', gloves: '#16181a', shoes: '#2a1f17', hair: '#2b1c12' },
  brian: { shirt: '#8a9096', pants: '#2c3036', skin: '#e2c2ad', gloves: '#e2c2ad', shoes: '#141414', hair: '#3b2a1e' },
};

const SKINS = {
  dexter: { body: '#7a8656', joints: '#1a1a1a' },
  brian: { body: '#cfd9df', joints: '#5d6a74' },
};

type CharState = { visible: boolean; position: [number, number, number]; rotY: number; pose: Pose; preset: string; knife?: boolean; apron?: boolean; slide?: boolean; wrapped?: boolean };

const initialChars = (): Record<string, CharState> => ({
  dexter: { visible: true, position: [-0.78, 0, -0.2], rotY: Math.PI / 2, pose: POSES.dexter.knife.pose, preset: 'knife', knife: true, apron: true, slide: false },
  brian: { visible: true, position: [0, 1.015, 0.95], rotY: 0, pose: POSES.brian.bound.pose, preset: 'bound', wrapped: true },
});

const initialFx = () => ({ filter: 'cinema', dof: false, focus: 2.6, range: 1.2, bokeh: 4, exposure: 0, grain: 0.06, vignette: 0.6, chroma: 0, bloom: 0.5, letterbox: 'none', frame: 'none', fov: 42 });
const initialLight = () => ({ lampOn: true, lampColor: '#ffe9c4', lampIntensity: 22, ambient: 0.18, keyOn: true, keyColor: '#9fb4ff', keyIntensity: 1.2, keyAz: 220, keyEl: 35 });

// --------------------------------------------------------------------------
function GLBridge({ onGL }: { onGL: (gl: THREE.WebGLRenderer) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    onGL(gl);
  }, [gl, onGL]);
  return null;
}

function CameraRig({ fov, resetKey }: { fov: number; resetKey: number }) {
  const { camera, controls } = useThree() as any;
  useEffect(() => {
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }, [fov, camera]);
  useEffect(() => {
    camera.position.set(2.6, 2.1, 2.9);
    controls?.target.set(0, 0.95, 0);
    controls?.update();
  }, [resetKey, camera, controls]);
  // WASD / QE free movement (moves camera and orbit target together)
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, []);
  useFrame((_, dt) => {
    const k = keys.current;
    if (!controls) return;
    const speed = (k['shift'] ? 3 : 1.2) * dt;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    const move = new THREE.Vector3();
    if (k['w']) move.add(fwd);
    if (k['s']) move.sub(fwd);
    if (k['d']) move.add(right);
    if (k['a']) move.sub(right);
    if (k['e']) move.y += 1;
    if (k['q']) move.y -= 1;
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      camera.position.add(move);
      controls.target.add(move);
      controls.update();
    }
  });
  return null;
}

function KeyLight({ l, mapSize, shadows }: { l: ReturnType<typeof initialLight>; mapSize: number; shadows: boolean }) {
  const az = (l.keyAz * Math.PI) / 180;
  const el = (l.keyEl * Math.PI) / 180;
  const pos: [number, number, number] = [Math.cos(az) * Math.cos(el) * 5, Math.sin(el) * 5 + 0.5, Math.sin(az) * Math.cos(el) * 5];
  if (!l.keyOn) return null;
  return <directionalLight position={pos} intensity={l.keyIntensity} color={l.keyColor} castShadow={shadows} shadow-mapSize={[mapSize, mapSize]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />;
}

function Effects({ fx, msaa, bloom }: { fx: ReturnType<typeof initialFx>; msaa: number; bloom: boolean }) {
  const f = FILTERS[fx.filter] || FILTERS.none;
  const dof = useRef<any>(null);
  useEffect(() => {
    if (!dof.current) return;
    dof.current.cocMaterial.worldFocusDistance = fx.focus;
    dof.current.cocMaterial.worldFocusRange = fx.range;
    dof.current.bokehScale = fx.bokeh;
  }, [fx.focus, fx.range, fx.bokeh, fx.dof]);
  const chroma = useMemo(() => new THREE.Vector2(fx.chroma + f.chroma, fx.chroma + f.chroma), [fx.chroma, f.chroma]);
  return (
    <EffectComposer multisampling={msaa}>
      {fx.dof ? <DepthOfField ref={dof} worldFocusDistance={fx.focus} worldFocusRange={fx.range} bokehScale={fx.bokeh} /> : <></>}
      {bloom && fx.bloom > 0 ? <Bloom intensity={fx.bloom} luminanceThreshold={0.75} luminanceSmoothing={0.2} mipmapBlur /> : <></>}
      <HueSaturation hue={f.hue} saturation={f.sat} />
      <BrightnessContrast brightness={f.bri + fx.exposure} contrast={f.con} />
      <Sepia intensity={f.sepia} />
      <ChromaticAberration offset={chroma} radialModulation={false} modulationOffset={0} />
      <Noise opacity={fx.grain + f.grain} premultiply />
      <Vignette offset={0.28} darkness={fx.vignette} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

// --------------------------------------------------------------------------
export default function KillRoom() {
  const { settings } = useCms();
  const { user, profile, track } = useAuth();
  const [scene, setScene] = useState<SceneId>((settings.killRoom?.defaultScene as SceneId) || 'killroom');
  const [panel, setPanel] = useState(true);
  const [tab, setTab] = useState<'camera' | 'effects' | 'light' | 'characters' | 'pose' | 'props'>('camera');
  const [hideUI, setHideUI] = useState(false);
  const [fx, setFx] = useState(initialFx);
  const [light, setLight] = useState(initialLight);
  const [chars, setChars] = useState(initialChars);
  const [selected, setSelected] = useState<'dexter' | 'brian'>('dexter');
  const [joint, setJoint] = useState<string>('rShoulder');
  const [jointNames, setJointNames] = useState<Record<string, string[]>>({ dexter: [...JOINTS], brian: [...JOINTS] });
  const [resetKey, setResetKey] = useState(0);
  const [breathing, setBreathing] = useState(true);
  const [quality, setQuality] = useState<Quality>(() => {
    try {
      return (localStorage.getItem('dexter-quality') as Quality) || 'medium';
    } catch {
      return 'medium';
    }
  });
  const [autoQ, setAutoQ] = useState(true);
  const q = QUALITY[quality];
  const changeQuality = (v: Quality, manual = true) => {
    setQuality(v);
    if (manual) setAutoQ(false);
    try {
      localStorage.setItem('dexter-quality', v);
    } catch {
      /* ignore */
    }
  };
  const [props, setProps] = useState<PropsState>(defaultProps);
  const [shot, setShot] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const setFxK = (k: string, v: any) => setFx((f) => ({ ...f, [k]: v }));
  const setLightK = (k: string, v: any) => setLight((f) => ({ ...f, [k]: v }));
  const setChar = (id: string, patch: Partial<CharState>) => setChars((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
  const setJointRot = (axis: number, deg: number) => {
    const cur = chars[selected].pose[joint] || [0, 0, 0];
    const next = [...cur] as [number, number, number];
    next[axis] = deg;
    setChar(selected, { pose: { ...chars[selected].pose, [joint]: next }, preset: 'custom' });
  };

  const capture = () => {
    const gl = glRef.current;
    if (!gl) return;
    sfx.click();
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    requestAnimationFrame(() => {
      const src = gl.domElement;
      const W = src.width;
      const H = src.height;
      const c = document.createElement('canvas');
      const pad = fx.frame === 'polaroid' ? Math.round(W * 0.04) : 0;
      const bottom = fx.frame === 'polaroid' ? Math.round(W * 0.12) : 0;
      c.width = W + pad * 2;
      c.height = H + pad + (bottom || pad);
      const ctx = c.getContext('2d')!;
      if (fx.frame === 'polaroid') {
        ctx.fillStyle = '#f4f1ea';
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(src, pad, pad, W, H);
      const ratios: Record<string, number> = { '2.39': 2.39, '1.85': 1.85, '4:3': 4 / 3, '1:1': 1 };
      const a = ratios[fx.letterbox];
      if (a) {
        ctx.fillStyle = '#000';
        if (W / H < a) {
          const bh = (H - W / a) / 2;
          ctx.fillRect(pad, pad, W, bh);
          ctx.fillRect(pad, pad + H - bh, W, bh);
        } else {
          const bw = (W - H * a) / 2;
          ctx.fillRect(pad, pad, bw, H);
          ctx.fillRect(pad + W - bw, pad, bw, H);
        }
      }
      if (fx.frame === 'polaroid') {
        ctx.fillStyle = '#222';
        ctx.font = `${Math.round(W * 0.03)}px "Special Elite", monospace`;
        ctx.fillText(SCENES.find((s) => s.id === scene)?.name || '', pad, H + pad + bottom * 0.55);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.font = `${Math.max(12, Math.round(W * 0.011))}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('DEXTER · PHOTO MODE', c.width - 20, c.height - 18);
      }
      setShot(c.toDataURL('image/png'));
      track('photo:capture');
    });
  };

  const shareToGallery = async () => {
    if (!shot || !user) return;
    setBusy(true);
    try {
      const img = new Image();
      img.src = shot;
      await img.decode();
      let w = Math.min(1600, img.width);
      let q = 0.86;
      let data = '';
      for (let i = 0; i < 6; i++) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = Math.round((img.height / img.width) * w);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        data = c.toDataURL('image/jpeg', q);
        if (data.length < 900_000) break;
        w = Math.round(w * 0.82);
        q -= 0.06;
      }
      await addDoc(collection(db, 'photos'), { uid: user.uid, username: profile?.username || '', avatar: profile?.avatar || '', image: data, scene: SCENES.find((s) => s.id === scene)?.name, at: serverTimestamp() });
      track('photo:share');
      toast({ title: 'Shared to the gallery', kind: 'success', action: { label: 'View', run: () => (window.location.hash = '#/gallery') } });
      setShot(null);
    } catch (e: any) {
      toast({ title: 'Sharing failed', text: e?.message, kind: 'error' });
    }
    setBusy(false);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === 'INPUT' || t?.tagName === 'SELECT' || t?.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === 'p') setPanel((p) => !p);
      if (key === 'h') setHideUI((h) => !h);
      if (key === 'c' || key === ' ') {
        e.preventDefault();
        capture();
      }
      if (key === 'r') setResetKey((x) => x + 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const models = settings.models || ({} as any);
  const photos = settings.killRoom?.victimPhotos || [];
  const ratio: Record<string, number> = { '2.39': 2.39, '1.85': 1.85, '4:3': 4 / 3, '1:1': 1 };

  const characters = (
    <>
      {chars.dexter.visible && (
        <Character
          outfit={OUTFITS.dexter}
          skin={SKINS.dexter}
          breathing={breathing}
          pose={chars.dexter.pose}
          position={chars.dexter.position}
          rotation={[0, chars.dexter.rotY, 0]}
          knife={chars.dexter.knife}
          apron={chars.dexter.apron}
          slide={chars.dexter.slide}
          selected={panel && tab !== 'camera' && tab !== 'effects' && tab !== 'light' && selected === 'dexter'}
          onSelect={() => {
            setSelected('dexter');
            setTab('pose');
          }}
          modelUrl={models.dexter || undefined}
          onJoints={(n) => setJointNames((j) => ({ ...j, dexter: n }))}
        />
      )}
      {chars.brian.visible && (
        <Character
          outfit={OUTFITS.brian}
          skin={SKINS.brian}
          breathing={breathing}
          breathRate={1.8}
          pose={chars.brian.pose}
          position={chars.brian.position}
          rotation={[-Math.PI / 2, 0, chars.brian.rotY]}
          wrapped={chars.brian.wrapped}
          selected={panel && tab !== 'camera' && tab !== 'effects' && tab !== 'light' && selected === 'brian'}
          onSelect={() => {
            setSelected('brian');
            setTab('pose');
          }}
          modelUrl={models.brian || undefined}
          onJoints={(n) => setJointNames((j) => ({ ...j, brian: n }))}
        />
      )}
    </>
  );

  const sceneProps = { lampOn: light.lampOn, lampColor: light.lampColor, lampIntensity: light.lampIntensity };
  const cur = chars[selected];
  const jr = cur.pose[joint] || [0, 0, 0];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas shadows={q.shadows} dpr={q.dpr} flat gl={{ preserveDrawingBuffer: true, antialias: false, powerPreference: 'high-performance', stencil: false }} camera={{ position: [2.6, 2.1, 2.9], fov: fx.fov, near: 0.05, far: 200 }}>
        <PerformanceMonitor
          onDecline={() => {
            if (!autoQ) return;
            if (quality === 'high') changeQuality('medium', false);
            else if (quality === 'medium') {
              changeQuality('low', false);
              toast({ title: 'Graphics lowered', text: 'Switched to Low for smoother performance. Change it under Camera → Quality.' }, 5000);
            }
          }}
        />
        <QualityCtx.Provider value={q}>
        <GLBridge onGL={(gl) => (glRef.current = gl)} />
        <ambientLight intensity={light.ambient} />
        <KeyLight l={light} mapSize={q.mapSize} shadows={q.shadows} />
        <Suspense fallback={null}>
          {scene === 'killroom' && (
            <>
              <color attach="background" args={['#050506']} />
              <KillRoomScene {...sceneProps} photos={photos}>
                {characters}
              </KillRoomScene>
            </>
          )}
          {scene === 'boat' && (
            <>
              <BoatScene {...sceneProps}>{characters}</BoatScene>
            </>
          )}
          {scene === 'truck' && (
            <>
              <TruckScene {...sceneProps}>{characters}</TruckScene>
            </>
          )}
          {scene === 'apartment' && <ApartmentScene {...sceneProps}>{characters}</ApartmentScene>}
          {scene === 'container' && <ContainerScene {...sceneProps}>{characters}</ContainerScene>}
          {scene === 'cabin' && <CabinScene {...sceneProps}>{characters}</CabinScene>}
          {scene === 'vault' && <VaultScene {...sceneProps}>{characters}</VaultScene>}
          {scene !== 'boat' && <SceneProps p={props} />}
          {quality !== 'low' && <ContactShadows position={[0, 0.003, 0]} opacity={0.55} scale={8} blur={2.2} far={2} frames={Infinity} resolution={quality === 'high' ? 512 : 256} />}
        </Suspense>
        <OrbitControls makeDefault target={[0, 0.95, 0]} minDistance={0.3} maxDistance={scene === 'boat' ? 20 : 6} maxPolarAngle={Math.PI * 0.95} enableDamping dampingFactor={0.08} />
        <CameraRig fov={fx.fov} resetKey={resetKey} />
        <Effects fx={fx} msaa={q.msaa} bloom={q.bloom} />
        </QualityCtx.Provider>
      </Canvas>

      {/* letterbox preview */}
      {ratio[fx.letterbox] && <Letterbox ratio={ratio[fx.letterbox]} />}
      <AnimatePresence>{flash && <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none' }} />}</AnimatePresence>

      {!hideUI && (
        <>
          {/* top bar */}
          <div style={{ position: 'absolute', top: 'calc(var(--nav-h) + 14px)', left: 22, right: 22, display: 'flex', gap: 12, alignItems: 'start', pointerEvents: 'none' }}>
            <div className="glass" style={{ borderRadius: 16, padding: '14px 18px', pointerEvents: 'auto' }}>
              <div className="kicker red" style={{ fontSize: 10 }}>
                <span className="pulse-dot" style={{ marginRight: 8 }} /> Photo Mode
              </div>
              <div className="display" style={{ fontSize: 34, marginTop: 2 }}>
                {SCENES.find((s) => s.id === scene)?.name}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {SCENES.find((s) => s.id === scene)?.sub}
              </div>
              <div className="row" style={{ gap: 6, marginTop: 12, maxWidth: 360 }}>
                {SCENES.map((s) => (
                  <button
                    key={s.id}
                    className={cx('chip', scene === s.id && 'on')}
                    onClick={() => {
                      sfx.whoosh();
                      setScene(s.id);
                      setResetKey((x) => x + 1);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="spacer" />
            <div className="row" style={{ pointerEvents: 'auto' }}>
              <button className="btn btn-sm glass" onClick={() => setPanel(!panel)}>
                ⚙ {panel ? 'Hide' : 'Show'} panel <span className="kbd">P</span>
              </button>
              <button className="btn btn-sm btn-primary" onClick={capture}>
                📸 Capture <span className="kbd" style={{ color: '#fff' }}>C</span>
              </button>
            </div>
          </div>

          {/* bottom hints */}
          <div className="glass mono" style={{ position: 'absolute', left: panel ? 'calc(50% - 200px)' : '50%', transform: 'translateX(-50%)', bottom: 22, borderRadius: 12, padding: '10px 14px', fontSize: 11, color: 'var(--muted)', letterSpacing: '.06em', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 'min(760px, calc(100% - 520px))' }}>
            <span>🖱 Drag: rotate</span>
            <span>Right-drag: pan</span>
            <span>Scroll: zoom</span>
            <span>WASD/QE: move</span>
            <span>Shift: fast</span>
            <span>Click a character: pose</span>
            <span>H: hide UI</span>
            <span>R: reset</span>
          </div>

          {/* photo mode panel */}
          <AnimatePresence>
            {panel && (
              <motion.aside className="glass" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} style={{ position: 'absolute', top: 'calc(var(--nav-h) + 14px)', right: 22, bottom: 22, width: 380, borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: 56 }}>
                <div style={{ display: 'flex', gap: 2, padding: 8, borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
                  {(
                    [
                      ['camera', '🎥 Camera'],
                      ['effects', '✨ Effects'],
                      ['light', '💡 Light'],
                      ['characters', '🧍 Characters'],
                      ['pose', '🦴 Pose'],
                      ['props', '🧰 Props'],
                    ] as const
                  ).map(([k, l]) => (
                    <button key={k} className={cx('tab', tab === k && 'on')} style={{ padding: '7px 10px', fontSize: 12 }} onClick={() => setTab(k)}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ padding: 18, overflow: 'auto', flex: 1 }}>
                  {tab === 'camera' && (
                    <>
                      <Select label="Graphics quality" value={quality} options={[['low', 'Low (fastest)'], ['medium', 'Medium'], ['high', 'High (best looking)']]} onChange={(v) => changeQuality(v as Quality)} />
                      <Toggle label="Auto-adjust for smooth performance" value={autoQ} onChange={setAutoQ} />
                      <Slider label="Field of view" value={fx.fov} min={15} max={100} step={1} unit="°" onChange={(v) => setFxK('fov', v)} />
                      <Toggle label="Depth of field" value={fx.dof} onChange={(v) => setFxK('dof', v)} />
                      {fx.dof && (
                        <>
                          <Slider label="Focus distance" value={fx.focus} min={0.3} max={10} step={0.05} unit="m" onChange={(v) => setFxK('focus', v)} />
                          <Slider label="Focus range" value={fx.range} min={0.1} max={5} step={0.05} unit="m" onChange={(v) => setFxK('range', v)} />
                          <Slider label="Bokeh" value={fx.bokeh} min={0} max={12} step={0.1} onChange={(v) => setFxK('bokeh', v)} />
                        </>
                      )}
                      <Select label="Aspect / letterbox" value={fx.letterbox} options={[['none', 'Full screen'], ['2.39', 'Cinema 2.39:1'], ['1.85', 'Widescreen 1.85:1'], ['4:3', 'Classic 4:3'], ['1:1', 'Square 1:1']]} onChange={(v) => setFxK('letterbox', v)} />
                      <Select label="Frame" value={fx.frame} options={[['none', 'None'], ['polaroid', 'Polaroid']]} onChange={(v) => setFxK('frame', v)} />
                      <div className="row" style={{ marginTop: 16 }}>
                        <button className="btn btn-sm" onClick={() => setResetKey((x) => x + 1)}>
                          ↺ Reset camera
                        </button>
                        <button className="btn btn-sm" onClick={() => setHideUI(true)}>
                          Hide UI (H)
                        </button>
                      </div>
                    </>
                  )}
                  {tab === 'effects' && (
                    <>
                      <label className="label">Filter</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                        {Object.entries(FILTERS).map(([k, f]) => (
                          <button key={k} className={cx('chip', fx.filter === k && 'on')} style={{ justifyContent: 'center' }} onClick={() => setFxK('filter', k)}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <Slider label="Exposure" value={fx.exposure} min={-0.4} max={0.4} step={0.01} onChange={(v) => setFxK('exposure', v)} />
                      <Slider label="Film grain" value={fx.grain} min={0} max={0.5} step={0.01} onChange={(v) => setFxK('grain', v)} />
                      <Slider label="Vignette" value={fx.vignette} min={0} max={1.2} step={0.01} onChange={(v) => setFxK('vignette', v)} />
                      <Slider label="Chromatic aberration" value={fx.chroma} min={0} max={0.01} step={0.0002} onChange={(v) => setFxK('chroma', v)} />
                      <Slider label="Bloom" value={fx.bloom} min={0} max={3} step={0.05} onChange={(v) => setFxK('bloom', v)} />
                      <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setFx(initialFx())}>
                        ↺ Reset effects
                      </button>
                    </>
                  )}
                  {tab === 'light' && (
                    <>
                      <Toggle label="Work lamp" value={light.lampOn} onChange={(v) => setLightK('lampOn', v)} />
                      <ColorRow label="Lamp color" value={light.lampColor} onChange={(v) => setLightK('lampColor', v)} />
                      <Slider label="Lamp intensity" value={light.lampIntensity} min={0} max={120} step={1} onChange={(v) => setLightK('lampIntensity', v)} />
                      <div className="divider" />
                      <Toggle label="Key light" value={light.keyOn} onChange={(v) => setLightK('keyOn', v)} />
                      <ColorRow label="Key color" value={light.keyColor} onChange={(v) => setLightK('keyColor', v)} />
                      <Slider label="Key intensity" value={light.keyIntensity} min={0} max={6} step={0.05} onChange={(v) => setLightK('keyIntensity', v)} />
                      <Slider label="Key direction" value={light.keyAz} min={0} max={360} step={1} unit="°" onChange={(v) => setLightK('keyAz', v)} />
                      <Slider label="Key height" value={light.keyEl} min={5} max={85} step={1} unit="°" onChange={(v) => setLightK('keyEl', v)} />
                      <Slider label="Ambient" value={light.ambient} min={0} max={1.5} step={0.01} onChange={(v) => setLightK('ambient', v)} />
                      <div className="row" style={{ marginTop: 10, gap: 6 }}>
                        {[
                          ['Interrogation', { lampOn: true, lampColor: '#ffe9c4', lampIntensity: 45, keyOn: false, ambient: 0.05 }],
                          ['Blood red', { lampColor: '#ff3341', lampIntensity: 45, keyColor: '#ff6060', ambient: 0.08 }],
                          ['Cold steel', { lampColor: '#cfe8ff', lampIntensity: 35, keyColor: '#7fb2ff', keyIntensity: 2, ambient: 0.2 }],
                          ['Daylight', { lampOn: false, keyOn: true, keyColor: '#fff6e5', keyIntensity: 3.5, ambient: 0.5 }],
                        ].map(([n, p]: any) => (
                          <button key={n} className="chip" onClick={() => setLight((l) => ({ ...l, ...p }))}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {tab === 'characters' && (
                    <>
                      {(['dexter', 'brian'] as const).map((id) => (
                        <div key={id} className="card" style={{ padding: 14, marginBottom: 12, borderColor: selected === id ? 'var(--blood)' : undefined }}>
                          <div className="row" style={{ justifyContent: 'space-between' }}>
                            <b>{id === 'dexter' ? 'Dexter Morgan' : 'Brian Moser'}</b>
                            <button className={cx('toggle', chars[id].visible && 'on')} onClick={() => setChar(id, { visible: !chars[id].visible })} />
                          </div>
                          <div className="row" style={{ gap: 6, marginTop: 10 }}>
                            <button className={cx('chip', selected === id && 'on')} onClick={() => setSelected(id)}>
                              Select
                            </button>
                            {id === 'dexter' ? (
                              <>
                                <button className={cx('chip', chars.dexter.knife && 'on')} onClick={() => setChar('dexter', { knife: !chars.dexter.knife })}>
                                  🔪 Knife
                                </button>
                                <button className={cx('chip', chars.dexter.apron && 'on')} onClick={() => setChar('dexter', { apron: !chars.dexter.apron })}>
                                  Apron
                                </button>
                                <button className={cx('chip', chars.dexter.slide && 'on')} onClick={() => setChar('dexter', { slide: !chars.dexter.slide })}>
                                  🩸 Slide
                                </button>
                              </>
                            ) : (
                              <button className={cx('chip', chars.brian.wrapped && 'on')} onClick={() => setChar('brian', { wrapped: !chars.brian.wrapped })}>
                                Plastic wrap
                              </button>
                            )}
                          </div>
                          <Slider label="Position X" value={chars[id].position[0]} min={-2.5} max={2.5} step={0.01} unit="m" onChange={(v) => setChar(id, { position: [v, chars[id].position[1], chars[id].position[2]] })} />
                          <Slider label="Position Z" value={chars[id].position[2]} min={-2.5} max={2.5} step={0.01} unit="m" onChange={(v) => setChar(id, { position: [chars[id].position[0], chars[id].position[1], v] })} />
                          <Slider label="Height" value={chars[id].position[1]} min={-0.2} max={1.5} step={0.005} unit="m" onChange={(v) => setChar(id, { position: [chars[id].position[0], v, chars[id].position[2]] })} />
                          <Slider label="Rotation" value={Math.round((chars[id].rotY * 180) / Math.PI)} min={-180} max={180} step={1} unit="°" onChange={(v) => setChar(id, { rotY: (v * Math.PI) / 180 })} />
                        </div>
                      ))}
                      <Toggle label="Breathing" value={breathing} onChange={setBreathing} />
                      <button className="btn btn-sm" onClick={() => setChars(initialChars())}>
                        ↺ Reset characters
                      </button>
                      {(models.dexter || models.brian) && <p className="muted" style={{ fontSize: 12 }}>Custom 3D models are loaded from the Admin Panel.</p>}
                    </>
                  )}
                  {tab === 'props' && (
                    <>
                      {(
                        [
                          ['evidence', 'Evidence table'],
                          ['slideBox', 'Open slide box'],
                          ['doll', 'Ice Truck doll parts'],
                          ['bags', 'Trash bags'],
                          ['blood', 'Pool of blood'],
                          ['plastic', 'Extra plastic sheets'],
                        ] as const
                      ).map(([k, l]) => (
                        <Toggle key={k} label={l} value={props[k]} onChange={(v) => setProps((x) => ({ ...x, [k]: v }))} />
                      ))}
                      {scene === 'boat' && <p className="muted" style={{ fontSize: 12 }}>Props are hidden on the boat.</p>}
                    </>
                  )}
                  {tab === 'pose' && (
                    <>
                      <div className="tabs" style={{ marginBottom: 14 }}>
                        {(['dexter', 'brian'] as const).map((id) => (
                          <button key={id} className={cx('tab', selected === id && 'on')} onClick={() => setSelected(id)}>
                            {id === 'dexter' ? 'Dexter' : 'Brian'}
                          </button>
                        ))}
                      </div>
                      <label className="label">Pose presets</label>
                      <div className="row" style={{ gap: 6, marginBottom: 16 }}>
                        {Object.entries(POSES[selected]).map(([k, p]) => (
                          <button
                            key={k}
                            className={cx('chip', cur.preset === k && 'on')}
                            onClick={() => {
                              sfx.click();
                              setChar(selected, { pose: p.pose, preset: k, ...(selected === 'dexter' ? { knife: k === 'knife' || cur.knife, slide: k === 'examine' } : {}) });
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <Select label="Joint" value={joint} options={(jointNames[selected] || []).map((j) => [j, JOINT_LABELS[j] || j])} onChange={setJoint} />
                      {['X (forward/back)', 'Y (twist)', 'Z (side)'].map((l, ax) => (
                        <Slider key={ax} label={l} value={jr[ax]} min={-180} max={180} step={1} unit="°" onChange={(v) => setJointRot(ax, v)} />
                      ))}
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn btn-sm" onClick={() => setChar(selected, { pose: { ...cur.pose, [joint]: [0, 0, 0] } })}>
                          Reset joint
                        </button>
                        <button className="btn btn-sm" onClick={() => setChar(selected, { pose: {}, preset: 'custom' })}>
                          T-zero all
                        </button>
                      </div>
                      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>Tip: click a character in the scene to select them.</p>
                    </>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </>
      )}
      {hideUI && (
        <button className="btn btn-xs glass" style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.4 }} onClick={() => setHideUI(false)}>
          Show UI (H)
        </button>
      )}

      {/* capture preview */}
      <AnimatePresence>
        {shot && (
          <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.92, rotate: -1 }} animate={{ scale: 1, rotate: 0 }} className="glass" style={{ borderRadius: 18, padding: 20, maxWidth: '90vw' }}>
              <img src={shot} alt="capture" style={{ maxWidth: '84vw', maxHeight: '70vh', borderRadius: 10, display: 'block' }} />
              <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setShot(null)}>
                  Close
                </button>
                <a className="btn" href={shot} download={`dexter-photo-${Date.now()}.png`}>
                  ⬇ Download PNG
                </a>
                <button className="btn btn-primary" disabled={busy} onClick={shareToGallery}>
                  {busy ? 'Sharing…' : '🖼 Share to gallery'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Letterbox({ ratio }: { ratio: number }) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const f = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  const { w, h } = size;
  if (w / h < ratio) {
    const bh = (h - w / ratio) / 2;
    return (
      <>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: bh, background: '#000', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bh, background: '#000', pointerEvents: 'none' }} />
      </>
    );
  }
  const bw = (w - h * ratio) / 2;
  return (
    <>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: bw, background: '#000', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: bw, background: '#000', pointerEvents: 'none' }} />
    </>
  );
}

function Slider({ label, value, min, max, step, unit = '', onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5 }}>
        <span>{label}</span>
        <span className="mono muted">
          {Number(value).toFixed(step < 0.01 ? 4 : step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', margin: '6px 0 12px' }}>
      <span style={{ fontSize: 13.5 }}>{label}</span>
      <button className={cx('toggle', value && 'on')} onClick={() => onChange(!value)} />
    </div>
  );
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '10px 12px' }}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13.5 }}>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

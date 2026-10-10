import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export const JOINTS = ['hips', 'spine', 'chest', 'neck', 'head', 'lShoulder', 'lElbow', 'lWrist', 'rShoulder', 'rElbow', 'rWrist', 'lHip', 'lKnee', 'lAnkle', 'rHip', 'rKnee', 'rAnkle'] as const;
export const JOINT_LABELS: Record<string, string> = {
  hips: 'Hips', spine: 'Spine', chest: 'Chest', neck: 'Neck', head: 'Head',
  lShoulder: 'Left shoulder', lElbow: 'Left elbow', lWrist: 'Left wrist',
  rShoulder: 'Right shoulder', rElbow: 'Right elbow', rWrist: 'Right wrist',
  lHip: 'Left hip', lKnee: 'Left knee', lAnkle: 'Left ankle',
  rHip: 'Right hip', rKnee: 'Right knee', rAnkle: 'Right ankle',
};

export type Pose = Record<string, [number, number, number]>; // degrees

export const POSES: Record<string, Record<string, { label: string; pose: Pose }>> = {
  dexter: {
    stand: { label: 'Standing', pose: { lShoulder: [0, 0, 7], rShoulder: [0, 0, -7], lElbow: [-12, 0, 0], rElbow: [-12, 0, 0] } },
    knife: { label: 'Knife raised', pose: { spine: [6, 0, 0], head: [16, 0, 0], rShoulder: [-155, 0, -12], rElbow: [-45, 0, 0], rWrist: [-25, 0, 0], lShoulder: [-35, 0, 14], lElbow: [-55, 0, 0], lHip: [-8, 0, 0], rHip: [6, 0, 0], lKnee: [10, 0, 0] } },
    lean: { label: 'Leaning over the table', pose: { spine: [24, 0, 0], chest: [14, 0, 0], head: [18, 0, 0], lShoulder: [-58, 0, 10], rShoulder: [-58, 0, -10], lElbow: [-28, 0, 0], rElbow: [-28, 0, 0], lHip: [-6, 0, 0], rHip: [-6, 0, 0], lKnee: [8, 0, 0], rKnee: [8, 0, 0] } },
    crossed: { label: 'Arms crossed', pose: { lShoulder: [-18, 28, 14], lElbow: [-108, 0, 0], rShoulder: [-18, -28, -14], rElbow: [-108, 0, 0], head: [-4, -12, 0] } },
    examine: { label: 'Examining a slide', pose: { rShoulder: [-62, -10, -8], rElbow: [-112, 0, 0], rWrist: [10, 0, 0], head: [8, -10, 0], lShoulder: [0, 0, 7], lElbow: [-10, 0, 0] } },
    walk: { label: 'Walking', pose: { lShoulder: [22, 0, 6], rShoulder: [-24, 0, -6], lElbow: [-18, 0, 0], rElbow: [-24, 0, 0], lHip: [-24, 0, 0], rHip: [20, 0, 0], lKnee: [10, 0, 0], rKnee: [28, 0, 0] } },
  },
  brian: {
    bound: { label: 'Bound', pose: { lShoulder: [0, 0, 4], rShoulder: [0, 0, -4] } },
    struggle: { label: 'Struggling', pose: { neck: [0, 10, 0], head: [0, 34, 0], spine: [0, 0, 4], lShoulder: [0, 0, 12], lElbow: [-24, 0, 0], rShoulder: [0, 0, -6], rElbow: [-14, 0, 0], lHip: [-8, 0, 0], lKnee: [18, 0, 0] } },
    look: { label: 'Looking at his brother', pose: { neck: [0, -14, 0], head: [-6, -62, 0], lShoulder: [0, 0, 4], rShoulder: [0, 0, -4] } },
    accept: { label: 'Accepting', pose: { head: [-10, -20, 0], lShoulder: [0, 0, 6], rShoulder: [0, 0, -6], lElbow: [-6, 0, 0], rElbow: [-6, 0, 0] } },
  },
};

export type Outfit = { shirt: string; pants: string; skin: string; gloves: string; shoes: string; hair: string };

const toRad = (d: number) => (d * Math.PI) / 180;

function useMats(outfit: Outfit, selected: boolean) {
  return useMemo(() => {
    const em = new THREE.Color(selected ? '#3a0a0e' : '#000000');
    const mk = (color: string, rough = 0.75, extra: any = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: em, ...extra });
    return {
      shirt: mk(outfit.shirt, 0.85),
      pants: mk(outfit.pants, 0.9),
      skin: mk(outfit.skin, 0.55),
      gloves: mk(outfit.gloves, 0.35),
      shoes: mk(outfit.shoes, 0.5),
      hair: mk(outfit.hair, 0.9),
      plastic: new THREE.MeshPhysicalMaterial({ color: '#cfdde4', transparent: true, opacity: 0.2, roughness: 0.12, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
      tape: mk('#4b4f55', 0.6),
      steel: new THREE.MeshStandardMaterial({ color: '#d9dde2', metalness: 1, roughness: 0.18 }),
      handle: mk('#141414', 0.5),
      apron: new THREE.MeshPhysicalMaterial({ color: '#8d9aa1', transparent: true, opacity: 0.14, roughness: 0.15, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
    };
  }, [outfit.shirt, outfit.pants, outfit.skin, outfit.gloves, outfit.shoes, outfit.hair, selected]);
}

/** A capsule segment that hangs downward from its joint, optionally wrapped in plastic. */
function Seg({ r, len, y, mat, wrapMat, sx = 1, sz = 1 }: { r: number; len: number; y: number; mat: THREE.Material; wrapMat?: THREE.Material | null; sx?: number; sz?: number }) {
  return (
    <group position={[0, y, 0]} scale={[sx, 1, sz]}>
      <mesh castShadow receiveShadow material={mat}>
        <capsuleGeometry args={[r, len, 6, 14]} />
      </mesh>
      {wrapMat && (
        <mesh material={wrapMat} scale={[1.18, 1.06, 1.18]}>
          <capsuleGeometry args={[r, len, 6, 14]} />
        </mesh>
      )}
    </group>
  );
}

type Props = {
  outfit: Outfit;
  pose: Pose;
  position?: [number, number, number];
  rotation?: [number, number, number];
  wrapped?: boolean;
  knife?: boolean;
  apron?: boolean;
  slide?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  modelUrl?: string;
  onJoints?: (names: string[]) => void;
};

export function Character(props: Props) {
  if (props.modelUrl)
    return (
      <Suspense fallback={<Mannequin {...props} />}>
        <GLBCharacter {...props} />
      </Suspense>
    );
  return <Mannequin {...props} />;
}

export function Mannequin({ outfit, pose, position = [0, 0, 0], rotation = [0, 0, 0], wrapped, knife, apron, slide, selected, onSelect, onJoints }: Props) {
  const m = useMats(outfit, !!selected);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const r = (k: string) => (el: THREE.Group | null) => (refs.current[k] = el);
  const w = wrapped ? m.plastic : null;

  useEffect(() => {
    onJoints?.([...JOINTS]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    for (const j of JOINTS) {
      const g = refs.current[j];
      if (!g) continue;
      const v = pose[j] || [0, 0, 0];
      g.rotation.set(toRad(v[0]), toRad(v[1]), toRad(v[2]));
    }
  }, [pose]);

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return (
      <group ref={r(`${side}Shoulder`)} position={[0.205 * s, 0.27, 0]}>
        <mesh material={m.shirt} castShadow>
          <sphereGeometry args={[0.062, 14, 12]} />
        </mesh>
        <Seg r={0.052} len={0.22} y={-0.15} mat={m.shirt} wrapMat={w} />
        <group ref={r(`${side}Elbow`)} position={[0, -0.3, 0]}>
          <Seg r={0.046} len={0.2} y={-0.13} mat={m.shirt} wrapMat={w} />
          <group ref={r(`${side}Wrist`)} position={[0, -0.27, 0]}>
            <mesh position={[0, -0.06, 0]} material={m.gloves} castShadow>
              <boxGeometry args={[0.07, 0.11, 0.035]} />
            </mesh>
            {side === 'r' && knife && (
              <group position={[0, -0.09, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh material={m.handle} castShadow>
                  <cylinderGeometry args={[0.016, 0.018, 0.12, 10]} />
                </mesh>
                <mesh position={[0, 0.15, 0]} material={m.steel} castShadow>
                  <boxGeometry args={[0.006, 0.2, 0.035]} />
                </mesh>
              </group>
            )}
            {side === 'r' && slide && (
              <group position={[0, -0.12, 0.03]} rotation={[0.3, 0, 0]}>
                <mesh>
                  <boxGeometry args={[0.025, 0.075, 0.002]} />
                  <meshPhysicalMaterial color="#e6f2f5" transparent opacity={0.5} roughness={0.05} />
                </mesh>
                <mesh position={[0, 0.01, 0.002]}>
                  <sphereGeometry args={[0.006, 10, 8]} />
                  <meshStandardMaterial color="#7a0710" roughness={0.2} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    );
  };

  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return (
      <group ref={r(`${side}Hip`)} position={[0.095 * s, -0.05, 0]}>
        <Seg r={0.072} len={0.3} y={-0.22} mat={m.pants} wrapMat={w} />
        <group ref={r(`${side}Knee`)} position={[0, -0.45, 0]}>
          <Seg r={0.056} len={0.3} y={-0.2} mat={m.pants} wrapMat={w} />
          <group ref={r(`${side}Ankle`)} position={[0, -0.42, 0]}>
            <mesh position={[0, -0.04, 0.05]} material={m.shoes} castShadow>
              <boxGeometry args={[0.095, 0.07, 0.25]} />
            </mesh>
          </group>
        </group>
        {wrapped && (
          <mesh position={[0, -0.28, 0]} material={m.tape} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.012, 6, 20]} />
          </mesh>
        )}
      </group>
    );
  };

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerDown={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      <group ref={r('hips')} position={[0, 1.0, 0]}>
        <mesh material={m.pants} scale={[1.3, 0.75, 0.85]} castShadow>
          <sphereGeometry args={[0.15, 18, 14]} />
        </mesh>
        {w && (
          <mesh material={w} scale={[1.5, 0.9, 1.05]}>
            <sphereGeometry args={[0.15, 18, 14]} />
          </mesh>
        )}
        <group ref={r('spine')} position={[0, 0.08, 0]}>
          <Seg r={0.13} len={0.1} y={0.06} mat={m.shirt} wrapMat={w} sx={1.15} sz={0.75} />
          <group ref={r('chest')} position={[0, 0.16, 0]}>
            <Seg r={0.15} len={0.18} y={0.13} mat={m.shirt} wrapMat={w} sx={1.25} sz={0.72} />
            {wrapped && (
              <mesh position={[0, 0.12, 0]} material={m.tape} rotation={[Math.PI / 2, 0, 0]} scale={[1.25, 0.72, 1]}>
                <torusGeometry args={[0.175, 0.014, 6, 28]} />
              </mesh>
            )}
            {apron && (
              <mesh position={[0, 0.0, 0.125]} material={m.apron}>
                <planeGeometry args={[0.42, 0.95]} />
              </mesh>
            )}
            {arm('l')}
            {arm('r')}
            <group ref={r('neck')} position={[0, 0.33, 0]}>
              <mesh position={[0, 0.04, 0]} material={m.skin} castShadow>
                <cylinderGeometry args={[0.045, 0.05, 0.1, 12]} />
              </mesh>
              <group ref={r('head')} position={[0, 0.09, 0]}>
                <mesh position={[0, 0.1, 0]} scale={[0.88, 1.08, 0.98]} material={m.skin} castShadow>
                  <sphereGeometry args={[0.112, 24, 20]} />
                </mesh>
                <mesh position={[0, 0.135, -0.012]} scale={[0.92, 0.85, 1.0]} material={m.hair}>
                  <sphereGeometry args={[0.113, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
                </mesh>
                <mesh position={[0, 0.085, 0.104]} material={m.skin}>
                  <sphereGeometry args={[0.018, 10, 8]} />
                </mesh>
                {w && (
                  <mesh position={[0, 0.02, 0]} material={w} scale={[1.05, 0.5, 1.05]}>
                    <sphereGeometry args={[0.13, 18, 12]} />
                  </mesh>
                )}
              </group>
            </group>
          </group>
        </group>
        {leg('l')}
        {leg('r')}
      </group>
    </group>
  );
}

/** A custom GLB (uploaded through the Admin Panel). Bones can be posed in Photo Mode. */
function GLBCharacter({ modelUrl, pose, position = [0, 0, 0], rotation = [0, 0, 0], onSelect, onJoints }: Props) {
  const { scene } = useGLTF(modelUrl!);
  const { obj, bones, rest } = useMemo(() => {
    const obj = skeletonClone(scene) as THREE.Object3D;
    obj.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.8 / Math.max(0.001, size.y);
    obj.scale.setScalar(s);
    obj.position.y = -box.min.y * s;
    const bones: Record<string, THREE.Object3D> = {};
    const rest: Record<string, THREE.Euler> = {};
    obj.traverse((o: any) => {
      if (o.isBone) {
        bones[o.name] = o;
        rest[o.name] = o.rotation.clone();
      }
    });
    return { obj, bones, rest };
  }, [scene]);

  useEffect(() => {
    onJoints?.(Object.keys(bones));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bones]);

  useLayoutEffect(() => {
    for (const [name, b] of Object.entries(bones)) {
      const base = rest[name];
      const v = pose[name] || [0, 0, 0];
      b.rotation.set(base.x + toRad(v[0]), base.y + toRad(v[1]), base.z + toRad(v[2]));
    }
  }, [pose, bones, rest]);

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerDown={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      <primitive object={obj} />
    </group>
  );
}

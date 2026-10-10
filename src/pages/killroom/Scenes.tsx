import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useQuality } from './quality';
import { plasticNormal, woodTex, deckTex, metalRibs, concreteTex, evidencePhoto, loadImageTexture } from './textures';

// ============================== shared props ==============================
const steel = new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.95, roughness: 0.32 });
const darkSteel = new THREE.MeshStandardMaterial({ color: '#5b6066', metalness: 0.9, roughness: 0.45 });

export function Table({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.88, 0]} material={steel} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.05, 2.15]} />
      </mesh>
      <mesh position={[0, 0.84, 0]} material={darkSteel}>
        <boxGeometry args={[0.8, 0.04, 2.05]} />
      </mesh>
      {[
        [-0.36, -0.95],
        [0.36, -0.95],
        [-0.36, 0.95],
        [0.36, 0.95],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.42, z]} material={darkSteel} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.84, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]} material={darkSteel}>
        <boxGeometry args={[0.72, 0.02, 1.9]} />
      </mesh>
      {/* restraint straps */}
      {[-0.55, 0.0, 0.55].map((z, i) => (
        <mesh key={i} position={[0, 0.905, z]} castShadow>
          <boxGeometry args={[0.88, 0.012, 0.06]} />
          <meshStandardMaterial color="#1c1a18" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function PlasticSheet({ width, height, position, rotation = [0, 0, 0], seed = 1, opacity = 0.3, tint = '#e9f1f4' }: { width: number; height: number; position: [number, number, number]; rotation?: [number, number, number]; seed?: number; opacity?: number; tint?: string }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, Math.ceil(width * 14), Math.ceil(height * 10));
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = Math.sin(x * 5.3 + seed) * 0.035 + Math.sin(x * 13.1 + y * 0.7 + seed * 2) * 0.012 + Math.sin(y * 2.1 + x * 0.6) * 0.02 * (1 - (y + height / 2) / height);
      p.setZ(i, z);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height, seed]);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: tint,
        transparent: true,
        opacity,
        roughness: 0.18,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
        normalMap: plasticNormal(),
        normalScale: new THREE.Vector2(0.5, 0.5),
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [opacity, tint],
  );
  return <mesh geometry={geo} material={mat} position={position} rotation={rotation} receiveShadow />;
}

function Knife({ position, rotation = [0, 0, 0], length = 0.22 }: any) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.03, 0.022, 0.11]} />
        <meshStandardMaterial color="#121212" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.055 + length / 2]} castShadow>
        <boxGeometry args={[0.032, 0.004, length]} />
        <meshStandardMaterial color="#e6e9ec" metalness={1} roughness={0.15} />
      </mesh>
    </group>
  );
}

export function ToolCart({ position = [0, 0, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.8, 0]} material={steel} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.03, 0.9]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={steel} receiveShadow>
        <boxGeometry args={[0.55, 0.02, 0.9]} />
      </mesh>
      {[
        [-0.25, -0.42],
        [0.25, -0.42],
        [-0.25, 0.42],
        [0.25, 0.42],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} material={darkSteel}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 8]} />
        </mesh>
      ))}
      {/* towel */}
      <mesh position={[0, 0.818, 0]} receiveShadow>
        <boxGeometry args={[0.45, 0.006, 0.8]} />
        <meshStandardMaterial color="#e7e2d8" roughness={1} />
      </mesh>
      <Knife position={[-0.12, 0.83, -0.2]} rotation={[0, 0.05, 0]} length={0.24} />
      <Knife position={[-0.04, 0.83, -0.18]} rotation={[0, -0.04, 0]} length={0.18} />
      <Knife position={[0.04, 0.83, -0.2]} rotation={[0, 0.02, 0]} length={0.12} />
      {/* bone saw */}
      <group position={[0.14, 0.83, -0.05]} rotation={[0, 0.1, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 0.03, 0.12]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <boxGeometry args={[0.07, 0.003, 0.28]} />
          <meshStandardMaterial color="#c7ccd1" metalness={1} roughness={0.3} />
        </mesh>
      </group>
      {/* syringe (M99) */}
      <group position={[-0.1, 0.84, 0.18]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.11, 12]} />
          <meshPhysicalMaterial color="#e9f2f5" transparent opacity={0.45} roughness={0.05} />
        </mesh>
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[0.0015, 0.0015, 0.05, 6]} />
          <meshStandardMaterial color="#ddd" metalness={1} />
        </mesh>
      </group>
      {/* slide box */}
      <group position={[0.1, 0.86, 0.22]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.06, 0.22]} />
          <meshStandardMaterial map={woodTex()} roughness={0.5} />
        </mesh>
      </group>
      {/* duct tape */}
      <mesh position={[0.15, 0.85, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.045, 0.02, 10, 24]} />
        <meshStandardMaterial color="#8a8f95" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function HangingLamp({ position = [0, 2.6, 0] as [number, number, number], on = true, color = '#fff2d6', intensity = 40 }) {
  const q = useQuality();
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(position[0], 0, position[2]);
    return o;
  }, [position]);
  return (
    <group>
      <primitive object={target} />
      <mesh position={[position[0], position[1] + 0.6, position[2]]}>
        <cylinderGeometry args={[0.005, 0.005, 1.2, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={position} castShadow>
        <coneGeometry args={[0.32, 0.22, 24, 1, true]} />
        <meshStandardMaterial color="#1d2024" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[position[0], position[1] - 0.06, position[2]]}>
        <sphereGeometry args={[0.06, 12, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={on ? 6 : 0} />
      </mesh>
      {on && <spotLight position={[position[0], position[1] - 0.1, position[2]]} target={target} angle={0.75} penumbra={0.55} intensity={intensity} distance={9} decay={1.6} color={color} castShadow={q.shadows} shadow-mapSize={[q.mapSize, q.mapSize]} shadow-bias={-0.0004} />}
    </group>
  );
}

function PinnedPhoto({ position, rotation, i, url }: { position: [number, number, number]; rotation: [number, number, number]; i: number; url?: string }) {
  const tex = url ? loadImageTexture(url) : evidencePhoto(i);
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[0.36, 0.45]} />
        <meshStandardMaterial map={tex} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.2, 0.01]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <meshStandardMaterial color="#b3101c" />
      </mesh>
    </group>
  );
}

// ============================== Scenes ==============================
export function KillRoomScene({ lampOn, lampColor, lampIntensity, photos, children }: { lampOn: boolean; lampColor: string; lampIntensity: number; photos: string[]; children?: React.ReactNode }) {
  return (
    <group>
      {/* concrete shell */}
      <mesh position={[0, 2, 0]} receiveShadow>
        <boxGeometry args={[12, 4.2, 12]} />
        <meshStandardMaterial map={concreteTex()} side={THREE.BackSide} roughness={0.95} />
      </mesh>
      {/* plastic floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[6.4, 6.4]} />
        <meshPhysicalMaterial color="#cfd8dc" transparent opacity={0.55} roughness={0.25} clearcoat={1} normalMap={plasticNormal()} normalScale={new THREE.Vector2(0.3, 0.3)} />
      </mesh>
      {/* plastic walls around the work area */}
      <PlasticSheet width={6.4} height={3.6} position={[0, 1.8, -3.2]} seed={1} />
      <PlasticSheet width={6.4} height={3.6} position={[0, 1.8, 3.2]} rotation={[0, Math.PI, 0]} seed={2} />
      <PlasticSheet width={6.4} height={3.6} position={[-3.2, 1.8, 0]} rotation={[0, Math.PI / 2, 0]} seed={3} />
      <PlasticSheet width={6.4} height={3.6} position={[3.2, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]} seed={4} />
      <PlasticSheet width={6.4} height={6.4} position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]} seed={5} opacity={0.18} />
      {/* victim photos on the plastic */}
      {Array.from({ length: 6 }).map((_, i) => (
        <PinnedPhoto key={i} i={i} url={photos[i]} position={[-1.2 + (i % 3) * 0.55, 1.75 - Math.floor(i / 3) * 0.55, -3.12]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.04]} />
      ))}
      <Table />
      <ToolCart position={[1.05, 0, -0.3]} />
      <HangingLamp position={[0, 2.55, 0]} on={lampOn} color={lampColor} intensity={lampIntensity} />
      {/* floor drain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.006, 1.3]}>
        <circleGeometry args={[0.12, 24]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.4} />
      </mesh>
      <pointLight position={[-2.5, 3, 2.5]} intensity={3} distance={8} color="#7d8fa6" />
      {children}
    </group>
  );
}

function Water() {
  // Waves are computed on the GPU (vertex shader) with analytic normals.
  const uTime = useMemo(() => ({ value: 0 }), []);
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: '#071b26', roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader =
        'uniform float uTime;\n' +
        sh.vertexShader
          .replace(
            '#include <beginnormal_vertex>',
            `float k1 = position.x * 0.35 + uTime * 0.9; float k2 = position.y * 0.5 + uTime * 1.3; float k3 = (position.x + position.y) * 0.9 + uTime * 2.0;
             float dx = cos(k1) * 0.042 + cos(k3) * 0.027; float dy = cos(k2) * 0.04 + cos(k3) * 0.027;
             vec3 objectNormal = normalize(vec3(-dx, -dy, 1.0));`,
          )
          .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position); transformed.z += sin(k1) * 0.12 + sin(k2) * 0.08 + sin(k3) * 0.03;');
    };
    return m;
  }, [uTime]);
  useFrame(({ clock }) => {
    uTime.value = clock.elapsedTime;
  });
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
      <planeGeometry args={[120, 120, 120, 120]} />
    </mesh>
  );
}

function Skyline() {
  const blocks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        x: -45 + i * 1.5 + Math.random(),
        h: 2 + Math.random() * 9,
        w: 0.8 + Math.random() * 1.2,
        c: Math.random() > 0.5 ? '#ffd28a' : '#9fd3ff',
      })),
    [],
  );
  return (
    <group position={[0, -0.6, -48]}>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, Math.random() * 3]}>
          <boxGeometry args={[b.w, b.h, 0.8]} />
          <meshStandardMaterial color="#04060a" emissive={b.c} emissiveIntensity={0.015 + Math.random() * 0.04} />
        </mesh>
      ))}
    </group>
  );
}

export function BoatScene({ lampOn, lampColor, lampIntensity, children }: { lampOn: boolean; lampColor: string; lampIntensity: number; children?: React.ReactNode }) {
  const q = useQuality();
  const boat = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!boat.current) return;
    const t = clock.elapsedTime;
    boat.current.rotation.z = Math.sin(t * 0.7) * 0.012;
    boat.current.rotation.x = Math.sin(t * 0.5) * 0.008;
    boat.current.position.y = Math.sin(t * 0.9) * 0.03;
  });
  return (
    <group>
      <color attach="background" args={['#03060b']} />
      <fog attach="fog" args={['#03060b', 10, 46]} />
      <Water />
      <Skyline />
      <mesh position={[18, 14, -40]}>
        <sphereGeometry args={[2.2, 32, 24]} />
        <meshStandardMaterial color="#f4f1e6" emissive="#f4f1e6" emissiveIntensity={1.4} />
      </mesh>
      <directionalLight position={[18, 14, -40]} intensity={0.7} color="#a9c4ff" castShadow={q.shadows} shadow-mapSize={[q.mapSize, q.mapSize]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <group ref={boat}>
        {/* hull */}
        <mesh position={[0, -0.35, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.7, 9]} />
          <meshStandardMaterial color="#e9e6df" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.35, -4.4]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[2.26, 0.7, 2.26]} />
          <meshStandardMaterial color="#e9e6df" roughness={0.4} />
        </mesh>
        {/* deck */}
        <mesh position={[0, 0.005, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.0, 8.8]} />
          <meshStandardMaterial map={deckTex()} roughness={0.7} />
        </mesh>
        {/* cabin */}
        <mesh position={[0, 0.8, -2.7]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 1.6, 2.2]} />
          <meshStandardMaterial color="#d9d6cf" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.2, -1.58]}>
          <boxGeometry args={[2.0, 0.5, 0.02]} />
          <meshStandardMaterial color="#0d1620" metalness={0.6} roughness={0.1} />
        </mesh>
        {/* rails */}
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} position={[x, 0.55, 0]}>
            <boxGeometry args={[0.03, 0.03, 8]} />
            <meshStandardMaterial color="#cfd5db" metalness={1} roughness={0.25} />
          </mesh>
        ))}
        {/* garbage bags */}
        {[
          [-1.0, 0.25, 2.4],
          [-0.65, 0.22, 2.9],
          [-1.15, 0.2, 3.3],
        ].map((p, i) => (
          <mesh key={i} position={p as any} scale={[1, 0.8, 1.1]} castShadow>
            <sphereGeometry args={[0.28, 20, 16]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.25} metalness={0.2} />
          </mesh>
        ))}
        <mesh position={[1.3, 2.2, -2.7]}>
          <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
          <meshStandardMaterial color="#888" />
        </mesh>
        <mesh position={[0, 1.4, -1.5]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#ffe1a8" emissive="#ffb347" emissiveIntensity={4} />
        </mesh>
        <Table />
        <ToolCart position={[1.0, 0, -0.6]} />
        {lampOn && <pointLight position={[0, 1.9, -1.2]} intensity={lampIntensity * 0.6} distance={7} color={lampColor} castShadow={q.pointShadows} />}
        {children}
      </group>
    </group>
  );
}

function Frost() {
  const pts = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 600;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 2.2;
      a[i * 3 + 1] = Math.random() * 2.4;
      a[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 0.08;
      if (y < 0) y = 2.4;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(y * 3 + i) * 0.0008);
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial size={0.012} color="#dff4ff" transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

export function TruckScene({ lampOn, lampColor, lampIntensity, children }: { lampOn: boolean; lampColor: string; lampIntensity: number; children?: React.ReactNode }) {
  const q = useQuality();
  const ribs = metalRibs();
  return (
    <group>
      <color attach="background" args={['#020407']} />
      <fog attach="fog" args={['#0a1520', 4, 16]} />
      {/* truck interior */}
      <mesh position={[0, 1.25, 0]} receiveShadow>
        <boxGeometry args={[2.5, 2.6, 9.4]} />
        <meshStandardMaterial map={ribs} color="#d4e4ef" metalness={0.6} roughness={0.45} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[2.48, 9.38]} />
        <meshStandardMaterial color="#8d99a3" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* fluorescent tubes */}
      {[-3, -0.5, 2].map((z, i) => (
        <group key={i} position={[0, 2.5, z]}>
          <mesh>
            <boxGeometry args={[0.08, 0.04, 1.2]} />
            <meshStandardMaterial color="#dff3ff" emissive="#bfe6ff" emissiveIntensity={lampOn ? 5 : 0.2} />
          </mesh>
          {lampOn && <pointLight position={[0, -0.2, 0]} intensity={lampIntensity * 0.25} distance={5} color={lampColor === '#ffe9c4' ? '#bfe6ff' : lampColor} castShadow={q.pointShadows && i === 1} />}
        </group>
      ))}
      {/* meat rail + hooks */}
      <mesh position={[0.7, 2.3, 0]}>
        <boxGeometry args={[0.04, 0.04, 8.6]} />
        <meshStandardMaterial color="#c9ced3" metalness={1} roughness={0.3} />
      </mesh>
      {[-3.6, -2.4, -1.2, 1.5, 2.7, 3.9].map((z, i) => (
        <group key={i} position={[0.7, 2.1, z]}>
          <mesh>
            <cylinderGeometry args={[0.006, 0.006, 0.36, 6]} />
            <meshStandardMaterial color="#aab2b9" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.22, 0.03]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.05, 0.006, 6, 16, Math.PI * 1.4]} />
            <meshStandardMaterial color="#aab2b9" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* ice blocks */}
      {[
        [-0.9, 0.2, -3.5],
        [-0.85, 0.2, -2.9],
        [-0.9, 0.6, -3.2],
        [-0.9, 0.2, 3.2],
      ].map((p, i) => (
        <mesh key={i} position={p as any} rotation={[0, i * 0.3, 0]} castShadow>
          <boxGeometry args={[0.45, 0.4, 0.45]} />
          <meshPhysicalMaterial color="#cdeeff" transparent opacity={0.55} roughness={0.08} />
        </mesh>
      ))}
      <Frost />
      <Table />
      <ToolCart position={[0.95, 0, 1.6]} rotation={[0, 0, 0]} />
      {/* open doors to the night */}
      <mesh position={[0, 1.25, 4.69]}>
        <planeGeometry args={[2.3, 2.4]} />
        <meshBasicMaterial color="#05080d" />
      </mesh>
      <ambientLight intensity={0.15} color="#6fa8d8" />
      {children}
    </group>
  );
}

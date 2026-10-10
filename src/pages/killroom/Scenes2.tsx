import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Table, ToolCart, HangingLamp, PlasticSheet } from './Scenes';
import { woodTex, logTex, marbleTex, rustTex, cityNightTex, snowWindowTex, plasticNormal, evidencePhoto } from './textures';

type SP = { lampOn: boolean; lampColor: string; lampIntensity: number; children?: React.ReactNode };

// ============================== Dexter's apartment ==============================
export function ApartmentScene({ lampOn, lampColor, lampIntensity, children }: SP) {
  return (
    <group>
      <color attach="background" args={['#060608']} />
      <mesh position={[0, 1.5, 0]} receiveShadow>
        <boxGeometry args={[8, 3, 8]} />
        <meshStandardMaterial color="#b9ad98" roughness={0.9} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7.98, 7.98]} />
        <meshStandardMaterial map={woodTex()} color="#c9a27a" roughness={0.55} />
      </mesh>
      {/* plastic laid down under the table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
        <planeGeometry args={[3.2, 3.8]} />
        <meshPhysicalMaterial color="#d4dde1" transparent opacity={0.45} roughness={0.2} clearcoat={1} normalMap={plasticNormal()} />
      </mesh>
      {/* window with Miami at night */}
      <mesh position={[0, 1.6, -3.98]}>
        <planeGeometry args={[4.2, 1.9]} />
        <meshBasicMaterial map={cityNightTex()} toneMapped={false} />
      </mesh>
      {[-2.1, 0, 2.1].map((x) => (
        <mesh key={x} position={[x, 1.6, -3.95]}>
          <boxGeometry args={[0.06, 1.95, 0.06]} />
          <meshStandardMaterial color="#e9e4da" />
        </mesh>
      ))}
      {/* sofa */}
      <group position={[-2.6, 0, 1.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.5, 0.9]} />
          <meshStandardMaterial color="#3a2f2a" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.65, -0.38]} castShadow>
          <boxGeometry args={[2.2, 0.6, 0.18]} />
          <meshStandardMaterial color="#3a2f2a" roughness={0.95} />
        </mesh>
      </group>
      {/* kitchen counter */}
      <mesh position={[3.1, 0.47, -1.2]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.94, 3]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.4} />
      </mesh>
      <mesh position={[3.1, 0.955, -1.2]}>
        <boxGeometry args={[1.25, 0.04, 3.05]} />
        <meshStandardMaterial color="#e8e5df" roughness={0.25} />
      </mesh>
      {/* the A/C unit where the slides are hidden */}
      <group position={[-3.9, 2.3, -1.6]}>
        <mesh castShadow>
          <boxGeometry args={[0.25, 0.42, 0.8]} />
          <meshStandardMaterial color="#d9d6cf" roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0.13, -0.12 + i * 0.045, 0]}>
            <boxGeometry args={[0.01, 0.012, 0.7]} />
            <meshStandardMaterial color="#8d8a84" />
          </mesh>
        ))}
      </group>
      {/* floor lamp */}
      <group position={[-2.8, 0, -2.6]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
          <meshStandardMaterial color="#222" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 0.3, 20, 1, true]} />
          <meshStandardMaterial color="#f2e2c4" emissive="#ffcf8a" emissiveIntensity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 1.6, 0]} intensity={4} distance={6} color="#ffbe76" />
      </group>
      <Table />
      <ToolCart position={[1.05, 0, -0.3]} />
      <HangingLamp position={[0, 2.5, 0]} on={lampOn} color={lampColor} intensity={lampIntensity} />
      <pointLight position={[0, 1.6, -3.4]} intensity={3} distance={6} color="#6f8bd8" />
      {children}
    </group>
  );
}

// ============================== The shipping container ==============================
function SwingingBulb({ on, color, intensity }: { on: boolean; color: string; intensity: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.08;
  });
  return (
    <group ref={g} position={[0, 2.35, 0]}>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.6, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={on ? 5 : 0.1} />
      </mesh>
      {on && <pointLight position={[0, -0.7, 0]} intensity={intensity * 0.35} distance={7} decay={1.6} color={color} castShadow shadow-mapSize={[1024, 1024]} />}
    </group>
  );
}

export function ContainerScene({ lampOn, lampColor, lampIntensity, children }: SP) {
  return (
    <group>
      <color attach="background" args={['#020203']} />
      <fog attach="fog" args={['#050304', 4, 14]} />
      <mesh position={[0, 1.2, 0]} receiveShadow>
        <boxGeometry args={[2.35, 2.4, 12]} />
        <meshStandardMaterial map={rustTex()} roughness={0.85} metalness={0.4} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[2.33, 11.98]} />
        <meshStandardMaterial map={woodTex()} color="#5a4636" roughness={0.9} />
      </mesh>
      {/* the pool of blood where it all began */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.006, 2.2]}>
        <circleGeometry args={[0.85, 48]} />
        <meshPhysicalMaterial color="#3a0207" roughness={0.05} clearcoat={1} clearcoatRoughness={0.02} />
      </mesh>
      {/* open doors */}
      <mesh position={[0, 1.2, 5.99]}>
        <planeGeometry args={[2.3, 2.38]} />
        <meshBasicMaterial color="#0a1422" />
      </mesh>
      <pointLight position={[0, 1.4, 5.6]} intensity={2.5} distance={6} color="#4d74b8" />
      <Table />
      <ToolCart position={[0.85, 0, -1.6]} rotation={[0, 0, 0]} />
      <SwingingBulb on={lampOn} color={lampColor} intensity={lampIntensity} />
      {children}
    </group>
  );
}

// ============================== New Blood: the cabin ==============================
function Fire({ on }: { on: boolean }) {
  const l = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (l.current) l.current.intensity = on ? 9 + Math.sin(clock.elapsedTime * 11) * 1.6 + Math.sin(clock.elapsedTime * 23) * 0.9 : 0;
  });
  return (
    <group position={[2.8, 0, -2.6]} rotation={[0, -Math.PI / 4, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.6, 1.8, 0.7]} />
        <meshStandardMaterial color="#4a4542" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.5, 0.36]}>
        <boxGeometry args={[0.9, 0.7, 0.02]} />
        <meshStandardMaterial color="#1a0a04" emissive="#ff6a1a" emissiveIntensity={on ? 1.8 : 0} />
      </mesh>
      <pointLight ref={l} position={[0, 0.6, 0.8]} distance={8} color="#ff8a3a" castShadow />
    </group>
  );
}

export function CabinScene({ lampOn, lampColor, lampIntensity, children }: SP) {
  return (
    <group>
      <color attach="background" args={['#05070a']} />
      <mesh position={[0, 1.5, 0]} receiveShadow>
        <boxGeometry args={[7.5, 3, 7.5]} />
        <meshStandardMaterial map={logTex()} roughness={0.9} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7.48, 7.48]} />
        <meshStandardMaterial map={woodTex()} color="#8a6446" roughness={0.75} />
      </mesh>
      <mesh position={[-1.4, 1.6, -3.73]}>
        <planeGeometry args={[1.6, 1.1]} />
        <meshBasicMaterial map={snowWindowTex()} toneMapped={false} />
      </mesh>
      <mesh position={[-1.4, 1.6, -3.72]}>
        <boxGeometry args={[1.7, 0.06, 0.04]} />
        <meshStandardMaterial color="#3a2414" />
      </mesh>
      {/* rifles on the wall */}
      {[0, 0.28].map((y, i) => (
        <group key={i} position={[-3.72, 1.7 + y, 0.4]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[1.1, 0.035, 0.03]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[-0.42, -0.03, 0]}>
            <boxGeometry args={[0.36, 0.08, 0.04]} />
            <meshStandardMaterial color="#5a3720" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Fire on={lampOn} />
      <Table />
      <ToolCart position={[1.05, 0, -0.3]} />
      <HangingLamp position={[0, 2.5, 0]} on={lampOn} color={lampColor} intensity={lampIntensity * 0.7} />
      <pointLight position={[-1.4, 1.6, -3.2]} intensity={2} distance={5} color="#a9c8ff" />
      <pointLight position={[0.5, 2.3, 1.6]} intensity={4} distance={8} color="#ffb070" />
      {children}
    </group>
  );
}

// ============================== Prater's vault ==============================
function Vitrine({ position, kind }: { position: [number, number, number]; kind: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.905, 0]}>
        <boxGeometry args={[0.62, 0.012, 0.62]} />
        <meshStandardMaterial color="#c9a14a" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.56, 0.58, 0.56]} />
        <meshPhysicalMaterial color="#e8f4f8" transparent opacity={0.16} roughness={0.02} clearcoat={1} depthWrite={false} />
      </mesh>
      {kind === 0 && (
        <mesh position={[0, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.1, 20, 16]} />
          <meshStandardMaterial color="#e5dccb" roughness={0.6} />
        </mesh>
      )}
      {kind === 1 && (
        <mesh position={[0, 1.0, 0]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.006, 0.3, 0.04]} />
          <meshStandardMaterial color="#e0e4e8" metalness={1} roughness={0.15} />
        </mesh>
      )}
      {kind === 2 && (
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 20]} />
          <meshPhysicalMaterial color="#c2a36a" transparent opacity={0.6} roughness={0.1} />
        </mesh>
      )}
      {kind === 3 && (
        <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.07, 0.02, 10, 24]} />
          <meshStandardMaterial color="#c9a14a" metalness={1} roughness={0.2} />
        </mesh>
      )}
      <pointLight position={[0, 1.75, 0.2]} intensity={1.6} distance={1.6} color="#fff1d6" />
    </group>
  );
}

export function VaultScene({ lampOn, lampColor, lampIntensity, children }: SP) {
  const spots = useMemo(
    () => [
      [-2.6, 0, -2.6],
      [-0.9, 0, -2.9],
      [0.9, 0, -2.9],
      [2.6, 0, -2.6],
      [-2.9, 0, 0.6],
      [2.9, 0, 0.6],
    ],
    [],
  );
  return (
    <group>
      <color attach="background" args={['#030304']} />
      <mesh position={[0, 1.6, 0]} receiveShadow>
        <boxGeometry args={[8, 3.2, 8]} />
        <meshStandardMaterial color="#121214" roughness={0.6} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7.98, 7.98]} />
        <meshPhysicalMaterial map={marbleTex()} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {/* gold trim */}
      {[-3.98, 3.98].map((z) => (
        <mesh key={z} position={[0, 2.6, z]}>
          <boxGeometry args={[8, 0.03, 0.02]} />
          <meshStandardMaterial color="#c9a14a" metalness={1} roughness={0.25} emissive="#3a2a08" />
        </mesh>
      ))}
      {spots.map((p, i) => (
        <Vitrine key={i} position={p as any} kind={i % 4} />
      ))}
      {/* the collection wall */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-1.6 + i * 0.8, 1.7, -3.96]}>
          <planeGeometry args={[0.42, 0.52]} />
          <meshStandardMaterial map={evidencePhoto(i + 10)} roughness={0.8} />
        </mesh>
      ))}
      <Table />
      <ToolCart position={[1.05, 0, -0.3]} />
      <HangingLamp position={[0, 2.7, 0]} on={lampOn} color={lampColor} intensity={lampIntensity} />
      {children}
    </group>
  );
}

// ============================== Props ==============================
const pink = new THREE.MeshStandardMaterial({ color: '#f1c3b1', roughness: 0.45 });
const blonde = new THREE.MeshStandardMaterial({ color: '#e8cf8a', roughness: 0.6 });

function DollParts() {
  // The Ice Truck Killer's doll, cut into neat pieces.
  return (
    <group>
      <mesh position={[0, 0.04, 0]} castShadow material={pink}>
        <sphereGeometry args={[0.04, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.06, -0.01]} material={blonde}>
        <sphereGeometry args={[0.042, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0.12, 0.022, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={pink}>
        <capsuleGeometry args={[0.022, 0.07, 4, 10]} />
      </mesh>
      {[-0.1, -0.16, 0.2, 0.26].map((x, i) => (
        <mesh key={i} position={[x, 0.012, 0.06]} rotation={[0, 0, Math.PI / 2]} castShadow material={pink}>
          <capsuleGeometry args={[0.009, 0.08, 4, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function OpenSlideBox() {
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.24, 0.06, 0.32]} />
        <meshStandardMaterial map={woodTex()} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.12, -0.16]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.24, 0.18, 0.012]} />
        <meshStandardMaterial map={woodTex()} roughness={0.45} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <group key={i} position={[-0.09 + (i % 7) * 0.03, 0.065, -0.07 + Math.floor(i / 7) * 0.13]}>
          <mesh>
            <boxGeometry args={[0.004, 0.03, 0.1]} />
            <meshPhysicalMaterial color="#e6f2f5" transparent opacity={0.55} roughness={0.05} />
          </mesh>
          <mesh position={[0, 0.006, 0.02]}>
            <sphereGeometry args={[0.005, 8, 6]} />
            <meshStandardMaterial color="#7a0710" roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export type PropsState = { evidence: boolean; slideBox: boolean; doll: boolean; bags: boolean; blood: boolean; plastic: boolean };
export const defaultProps = (): PropsState => ({ evidence: true, slideBox: true, doll: false, bags: true, blood: false, plastic: false });

/** Optional set dressing placed around the table, shared by every scene. */
export function SceneProps({ p }: { p: PropsState }) {
  return (
    <group>
      {p.evidence && (
        <group position={[-1.25, 0, -1.25]}>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 0.04, 0.5]} />
            <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.4} />
          </mesh>
          {[
            [-0.3, -0.2],
            [0.3, -0.2],
            [-0.3, 0.2],
            [0.3, 0.2],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.18, z]}>
              <cylinderGeometry args={[0.012, 0.012, 0.36, 6]} />
              <meshStandardMaterial color="#555" metalness={0.8} />
            </mesh>
          ))}
          <group position={[0.1, 0.4, 0]}>
            {p.slideBox && <OpenSlideBox />}
          </group>
          <group position={[-0.22, 0.4, 0.05]}>{p.doll && <DollParts />}</group>
        </group>
      )}
      {p.bags &&
        [
          [-1.1, 0.24, 1.2],
          [-0.75, 0.2, 1.55],
          [-1.35, 0.2, 1.65],
        ].map((pos, i) => (
          <mesh key={i} position={pos as any} scale={[1, 0.8, 1.1]} castShadow>
            <sphereGeometry args={[0.27, 22, 18]} />
            <meshPhysicalMaterial color="#070707" roughness={0.22} clearcoat={1} clearcoatRoughness={0.3} />
          </mesh>
        ))}
      {p.blood && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.008, -0.6]}>
          <circleGeometry args={[0.45, 40]} />
          <meshPhysicalMaterial color="#4a030a" roughness={0.04} clearcoat={1} clearcoatRoughness={0.02} />
        </mesh>
      )}
      {p.plastic && (
        <>
          <PlasticSheet width={3} height={2.4} position={[0, 1.2, -1.7]} seed={9} opacity={0.26} />
          <PlasticSheet width={3} height={2.4} position={[-1.7, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} seed={11} opacity={0.26} />
        </>
      )}
    </group>
  );
}

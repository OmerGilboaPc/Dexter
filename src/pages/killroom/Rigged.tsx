import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { JOINTS, Pose } from './Mannequin';

export const DEFAULT_MODEL = './models/xbot.glb';

// Our joint names → Mixamo bone names (works with any Mixamo-rigged GLB).
const MIXAMO: Record<string, string> = {
  hips: 'Hips', spine: 'Spine', chest: 'Spine2', neck: 'Neck', head: 'Head',
  lShoulder: 'LeftArm', lElbow: 'LeftForeArm', lWrist: 'LeftHand',
  rShoulder: 'RightArm', rElbow: 'RightForeArm', rWrist: 'RightHand',
  lHip: 'LeftUpLeg', lKnee: 'LeftLeg', lAnkle: 'LeftFoot',
  rHip: 'RightUpLeg', rKnee: 'RightLeg', rAnkle: 'RightFoot',
};
// Which joint each joint "points to", and the direction it should point in the neutral pose.
const AIM: Record<string, [string, [number, number, number]]> = {
  spine: ['chest', [0, 1, 0]], chest: ['neck', [0, 1, 0]], neck: ['head', [0, 1, 0]],
  lShoulder: ['lElbow', [0, -1, 0]], lElbow: ['lWrist', [0, -1, 0]],
  rShoulder: ['rElbow', [0, -1, 0]], rElbow: ['rWrist', [0, -1, 0]],
  lHip: ['lKnee', [0, -1, 0]], lKnee: ['lAnkle', [0, -1, 0]],
  rHip: ['rKnee', [0, -1, 0]], rKnee: ['rAnkle', [0, -1, 0]],
};

export type Skin = { body: string; joints: string };

type Props = {
  url: string;
  pose: Pose;
  skin: Skin;
  position?: [number, number, number];
  rotation?: [number, number, number];
  wrapped?: boolean;
  knife?: boolean;
  slide?: boolean;
  selected?: boolean;
  breathing?: boolean;
  breathRate?: number;
  onSelect?: () => void;
  onJoints?: (names: string[]) => void;
};

const findBone = (bones: THREE.Bone[], name: string) => bones.find((b) => b.name.replace(/^mixamorig[:_]?/i, '') === name);

export function RiggedCharacter({ url, pose, skin, position = [0, 0, 0], rotation = [0, 0, 0], wrapped, knife, slide, selected, breathing = true, breathRate = 1, onSelect, onJoints }: Props) {
  const { scene } = useGLTF(url);

  const rig = useMemo(() => {
    const obj = skeletonClone(scene) as THREE.Object3D;
    // Normalize height to 1.8 m and stand on the floor.
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.8 / Math.max(0.001, size.y);
    obj.scale.multiplyScalar(s);
    obj.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(obj);
    obj.position.y -= box2.min.y;
    obj.position.x -= (box2.min.x + box2.max.x) / 2;
    obj.position.z -= (box2.min.z + box2.max.z) / 2;
    obj.updateMatrixWorld(true);

    const bones: THREE.Bone[] = [];
    const meshes: THREE.SkinnedMesh[] = [];
    obj.traverse((o: any) => {
      if (o.isBone) bones.push(o);
      if (o.isSkinnedMesh || o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        if (o.isSkinnedMesh) meshes.push(o);
      }
    });

    const joint: Record<string, THREE.Bone> = {};
    for (const j of JOINTS) {
      const b = findBone(bones, MIXAMO[j]);
      if (b) joint[j] = b;
    }
    const mapped = Object.keys(joint).length >= 12;

    // Rest orientations relative to the character root.
    const rootInvQ = obj.getWorldQuaternion(new THREE.Quaternion()).invert();
    const restWorldQ = (o: THREE.Object3D) => rootInvQ.clone().multiply(o.getWorldQuaternion(new THREE.Quaternion()));
    const restPos = (o: THREE.Object3D) => obj.worldToLocal(o.getWorldPosition(new THREE.Vector3()));

    // Precompute local = A * R * C for every mapped joint (see Kill Room docs in README).
    const pre: Record<string, { A: THREE.Quaternion; C: THREE.Quaternion }> = {};
    const acc: Record<string, THREE.Quaternion> = {};
    const mappedParent = (j: string) => {
      let p = joint[j].parent;
      while (p) {
        const hit = Object.entries(joint).find(([, b]) => b === p);
        if (hit) return hit[0];
        p = p.parent;
      }
      return null;
    };
    if (mapped) {
      for (const j of JOINTS) {
        const b = joint[j];
        if (!b) continue;
        const mp = mappedParent(j);
        const accParent = mp ? acc[mp] : new THREE.Quaternion();
        let B = new THREE.Quaternion();
        const aim = AIM[j];
        if (aim && joint[aim[0]]) {
          const dir = restPos(joint[aim[0]]).sub(restPos(b)).normalize().applyQuaternion(accParent);
          B = new THREE.Quaternion().setFromUnitVectors(dir, new THREE.Vector3(...aim[1]));
        }
        acc[j] = accParent.clone().multiply(B);
        const W0b = restWorldQ(b);
        const W0pa = b.parent ? restWorldQ(b.parent) : new THREE.Quaternion();
        // local = W0(parent)^-1 · acc(mappedParent)^-1 · R · acc(j) · W0(j)
        pre[j] = { A: W0pa.clone().invert().multiply(accParent.clone().invert()), C: acc[j].clone().multiply(W0b) };
      }
    }
    const generic: Record<string, THREE.Euler> = {};
    if (!mapped) bones.forEach((b) => (generic[b.name] = b.rotation.clone()));

    // Hand bone + scale for props.
    const hand = joint.rWrist;
    const handScale = hand ? hand.getWorldScale(new THREE.Vector3()).x : 1;
    const meshScale = meshes[0] ? meshes[0].getWorldScale(new THREE.Vector3()).x : 1;
    return { obj, bones, meshes, joint, mapped, pre, generic, hand, handScale, meshScale };
  }, [scene]);

  // Materials
  const mats = useMemo(() => {
    const em = new THREE.Color(selected ? '#3a0a0e' : '#000');
    const body = new THREE.MeshPhysicalMaterial({ color: skin.body, roughness: 0.42, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), emissive: em });
    const joints = new THREE.MeshPhysicalMaterial({ color: skin.joints, roughness: 0.3, metalness: 0.4, clearcoat: 0.6, emissive: em });
    return { body, joints };
  }, [skin.body, skin.joints, selected]);

  useEffect(() => {
    rig.meshes.forEach((m) => {
      const name = `${m.name} ${(m.material as any)?.name || ''}`.toLowerCase();
      m.material = name.includes('joint') ? mats.joints : mats.body;
    });
  }, [rig, mats]);

  // Plastic wrap: an inflated copy of each skinned mesh bound to the same skeleton.
  const wrap = useMemo(() => {
    if (!wrapped) return [] as THREE.SkinnedMesh[];
    const inflate = 0.018 / Math.max(1e-6, rig.meshScale);
    const mat = new THREE.MeshPhysicalMaterial({ color: '#d6e3ea', transparent: true, opacity: 0.22, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, depthWrite: false, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', `#include <skinning_vertex>\ntransformed += normalize( objectNormal ) * ${inflate.toFixed(5)};`);
    };
    return rig.meshes.map((m) => {
      const w = new THREE.SkinnedMesh(m.geometry, mat);
      w.bind(m.skeleton, m.bindMatrix);
      w.frustumCulled = false;
      w.renderOrder = 2;
      m.parent?.add(w);
      return w;
    });
  }, [rig, wrapped]);
  useEffect(() => () => wrap.forEach((w) => w.removeFromParent()), [wrap]);

  // Props in the right hand
  const prop = useMemo(() => {
    const g = new THREE.Group();
    if (!rig.hand) return g;
    const k = 1 / rig.handScale;
    g.scale.setScalar(k);
    if (knife) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.12, 12), new THREE.MeshStandardMaterial({ color: '#121212', roughness: 0.5 }));
      handle.position.set(0, 0.08, 0.02);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.22, 0.036), new THREE.MeshStandardMaterial({ color: '#e8ebee', metalness: 1, roughness: 0.14 }));
      blade.position.set(0, 0.25, 0.02);
      handle.castShadow = blade.castShadow = true;
      g.add(handle, blade);
    }
    if (slide) {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.002, 0.025), new THREE.MeshPhysicalMaterial({ color: '#e6f2f5', transparent: true, opacity: 0.5, roughness: 0.05 }));
      glass.position.set(0, 0.1, 0.03);
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), new THREE.MeshStandardMaterial({ color: '#7a0710', roughness: 0.2 }));
      drop.position.set(0.01, 0.102, 0.03);
      drop.scale.y = 0.4;
      g.add(glass, drop);
    }
    rig.hand.add(g);
    return g;
  }, [rig, knife, slide]);
  useEffect(() => () => void prop.removeFromParent(), [prop]);

  useEffect(() => {
    onJoints?.(rig.mapped ? [...JOINTS] : rig.bones.map((b) => b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig]);

  const R = useMemo(() => new THREE.Quaternion(), []);
  const E = useMemo(() => new THREE.Euler(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * breathRate;
    const br = breathing ? Math.sin(t * 1.6) : 0;
    if (rig.mapped) {
      for (const j of JOINTS) {
        const b = rig.joint[j];
        const p = rig.pre[j];
        if (!b || !p) continue;
        const v = pose[j] || [0, 0, 0];
        let x = v[0];
        let z = v[2];
        if (j === 'chest') x += br * 1.4;
        if (j === 'spine') x -= br * 0.6;
        if (j === 'neck') x -= br * 0.8;
        if (j === 'lShoulder') z += br * 0.9;
        if (j === 'rShoulder') z -= br * 0.9;
        E.set((x * Math.PI) / 180, (v[1] * Math.PI) / 180, (z * Math.PI) / 180);
        R.setFromEuler(E);
        b.quaternion.copy(p.A).multiply(R).multiply(p.C);
      }
    } else {
      for (const b of rig.bones) {
        const base = rig.generic[b.name];
        const v = pose[b.name] || [0, 0, 0];
        b.rotation.set(base.x + (v[0] * Math.PI) / 180, base.y + (v[1] * Math.PI) / 180, base.z + (v[2] * Math.PI) / 180);
      }
    }
  });

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
      <primitive object={rig.obj} />
    </group>
  );
}

useGLTF.preload(DEFAULT_MODEL);

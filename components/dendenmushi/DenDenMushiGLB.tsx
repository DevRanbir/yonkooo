"use client";
import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  isRinging: boolean;
  isSpeaking: boolean;
  audioVolume: number;
  isHd?: boolean;
  trackingCoords?: { x: number; y: number } | null;
}

export const DenDenMushiGLB: React.FC<Props> = ({
  isRinging,
  isSpeaking,
  audioVolume,
  isHd = false,
  trackingCoords
}) => {
  const modelPath = isHd ? '/models/den_den_mushi_law.glb' : '/models/ddm_law_lowpoly.glb';
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);
  const mouthNodeRef = useRef<THREE.Object3D | null>(null);

  // Traverse GLB scene to find mouth, jaw, or head mesh for precise Law lip-syncing
  useEffect(() => {
    scene.traverse((child) => {
      const name = child.name.toLowerCase();
      if (name.includes('mouth') || name.includes('jaw') || name.includes('head') || name.includes('face')) {
        mouthNodeRef.current = child;
      }
    });
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Determine target from camera face tracker if active, otherwise pointer
    const effectiveX = trackingCoords ? trackingCoords.x : state.pointer.x;
    const effectiveY = trackingCoords ? trackingCoords.y : state.pointer.y;

    // 1. Idle breathing, Purupurupuru ringing, and Dynamic Face / Pointer Tracking
    if (groupRef.current) {
      if (isRinging) {
        groupRef.current.rotation.z = Math.sin(time * 30) * 0.08;
        groupRef.current.position.y = Math.abs(Math.sin(time * 15)) * 0.15;
      } else {
        groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;
        groupRef.current.position.y = Math.sin(time * 2) * 0.04;
      }

      // Smoothly tilt and turn Law Den Den Mushi to follow face/pointer
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, effectiveX * 0.45, 0.08);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -effectiveY * 0.3, 0.08);
    }

    // 2. LAW REAL-TIME LIP-SYNCING
    if (isSpeaking) {
      const lipSyncOpen = 1 + audioVolume * 0.25 + Math.sin(time * 26) * 0.08;

      if (mouthNodeRef.current) {
        // Animate Law's 3D mouth / jaw node
        mouthNodeRef.current.scale.y = THREE.MathUtils.lerp(mouthNodeRef.current.scale.y, lipSyncOpen, 0.3);
        mouthNodeRef.current.rotation.x = THREE.MathUtils.lerp(mouthNodeRef.current.rotation.x, audioVolume * 0.3, 0.3);
      } else if (groupRef.current) {
        // Fallback head lip-sync scaling
        groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, (isHd ? 0.75 : 1.25) * lipSyncOpen, 0.3);
      }
    } else {
      if (mouthNodeRef.current) {
        mouthNodeRef.current.scale.y = THREE.MathUtils.lerp(mouthNodeRef.current.scale.y, 1.0, 0.2);
        mouthNodeRef.current.rotation.x = THREE.MathUtils.lerp(mouthNodeRef.current.rotation.x, 0.0, 0.2);
      }
      if (groupRef.current) {
        groupRef.current.scale.setScalar(isHd ? 0.75 : 1.25);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.28, 0]} scale={isHd ? 0.8 : 1.3}>
      <primitive object={scene} />
    </group>
  );
};

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/ddm_law_lowpoly.glb');
  useGLTF.preload('/models/den_den_mushi_law.glb');
}


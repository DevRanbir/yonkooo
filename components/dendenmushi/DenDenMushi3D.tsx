"use client";
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MushiConfig } from '@/lib/dendenmushi/mushi';

interface Props {
  config: MushiConfig;
  isRinging: boolean;
  isSpeaking: boolean;
  audioVolume: number;
  trackingCoords?: { x: number; y: number } | null;
}

export const DenDenMushi3D: React.FC<Props> = ({
  config,
  isRinging,
  isSpeaking,
  audioVolume,
  trackingCoords
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftStalkRef = useRef<THREE.Group>(null);
  const rightStalkRef = useRef<THREE.Group>(null);

  const expression = config.face.expression;
  const targetGaze = useRef(new THREE.Vector3(0, 0, 0));

  // High Detail Materials matching HD Law Model
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: config.body.bodyColor,
    roughness: 0.45,
    metalness: 0.08
  }), [config.body.bodyColor]);

  const shellMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: config.shell.primaryColor,
    roughness: 0.25,
    metalness: config.presetId === 'buster_call' ? 0.95 : 0.2
  }), [config.shell.primaryColor, config.presetId]);

  const shellSecondaryMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: config.shell.secondaryColor,
    roughness: 0.3,
    metalness: 0.3
  }), [config.shell.secondaryColor]);

  const dialMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: config.shell.dialColor,
    metalness: 0.85,
    roughness: 0.15
  }), [config.shell.dialColor]);

  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.08
  }), []);

  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: config.face.pupilColor || '#0f172a',
    roughness: 0.1
  }), [config.face.pupilColor]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      if (isRinging) {
        groupRef.current.rotation.z = Math.sin(time * 30) * 0.08;
        groupRef.current.position.y = Math.abs(Math.sin(time * 15)) * 0.15;
      } else {
        groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;
        groupRef.current.position.y = Math.sin(time * 2) * 0.04;
      }
    }

    // Determine target from camera face tracker if active, otherwise pointer
    const effectiveX = trackingCoords ? trackingCoords.x : state.pointer.x;
    const effectiveY = trackingCoords ? trackingCoords.y : state.pointer.y;

    targetGaze.current.x = THREE.MathUtils.lerp(targetGaze.current.x, effectiveX, 0.12);
    targetGaze.current.y = THREE.MathUtils.lerp(targetGaze.current.y, effectiveY, 0.12);

    // 1. Dynamic Head Turn & Tilt (Tracks face or pointer)
    if (headGroupRef.current) {
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetGaze.current.x * 0.42, 0.09);
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, -targetGaze.current.y * 0.32 + Math.sin(time * 1.2) * 0.02, 0.09);
    }

    // 2. Eye Stalks actively orienting inquisitively towards the face or pointer
    if (leftStalkRef.current && rightStalkRef.current) {
      const baseCurve = config.body.antennaCurve * 0.1;
      leftStalkRef.current.rotation.y = THREE.MathUtils.lerp(leftStalkRef.current.rotation.y, targetGaze.current.x * 0.22, 0.1);
      leftStalkRef.current.rotation.x = THREE.MathUtils.lerp(leftStalkRef.current.rotation.x, -targetGaze.current.y * 0.18, 0.1);
      leftStalkRef.current.rotation.z = Math.sin(time * 2.5) * 0.03 + baseCurve;

      rightStalkRef.current.rotation.y = THREE.MathUtils.lerp(rightStalkRef.current.rotation.y, targetGaze.current.x * 0.22, 0.1);
      rightStalkRef.current.rotation.x = THREE.MathUtils.lerp(rightStalkRef.current.rotation.x, -targetGaze.current.y * 0.18, 0.1);
      rightStalkRef.current.rotation.z = -Math.sin(time * 2.5 + 1) * 0.03 - baseCurve;
    }

    // 3. Eye Pupil Gaze Tracking (pupils look right into user's eyes)
    if (leftPupilRef.current && rightPupilRef.current) {
      leftPupilRef.current.position.x = THREE.MathUtils.lerp(leftPupilRef.current.position.x, targetGaze.current.x * 0.05, 0.15);
      leftPupilRef.current.position.y = THREE.MathUtils.lerp(leftPupilRef.current.position.y, targetGaze.current.y * 0.05, 0.15);
      rightPupilRef.current.position.x = THREE.MathUtils.lerp(rightPupilRef.current.position.x, targetGaze.current.x * 0.05, 0.15);
      rightPupilRef.current.position.y = THREE.MathUtils.lerp(rightPupilRef.current.position.y, targetGaze.current.y * 0.05, 0.15);
    }

    // Procedural Mouth Morph (Audio Lip-Syncing)
    if (mouthRef.current) {
      let openAmount = 0.1;
      if (isSpeaking) {
        openAmount = 0.18 + audioVolume * 0.9 + Math.sin(time * 24) * 0.15;
      } else if (expression === 'happy' || expression === 'surprised' || expression === 'sinister') {
        openAmount = 0.28;
      }
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, openAmount, 0.25);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, isSpeaking ? 1.25 : 1.0, 0.25);
    }
  });

  const eyebrowAngleRad = useMemo(() => {
    let angle = (config.face.eyebrowAngle * Math.PI) / 180;
    if (expression === 'angry' || expression === 'sinister') angle += 0.35;
    if (expression === 'worried' || expression === 'sad') angle -= 0.3;
    return angle;
  }, [config.face.eyebrowAngle, expression]);

  return (
    <group ref={groupRef} position={[0, -0.6, 0]} scale={config.body.bodyScale}>
      {/* 🐌 HD SCULPTED SNAIL FOOT & BODY */}
      <group>
        {/* Main Foot Capsule */}
        <mesh material={bodyMat} position={[0, 0.3, 0.2]}>
          <capsuleGeometry args={[0.55 * config.body.bodyWidth, 1.8, 24, 48]} />
        </mesh>
        
        {/* Undulating Foot Base Ripples (Matching HD Law GLB Foot) */}
        <mesh material={bodyMat} position={[0, 0.08, 0.1]} rotation={[-1.57, 0, 0]}>
          <ringGeometry args={[0.55, 0.82, 32]} />
        </mesh>
        <mesh material={bodyMat} position={[0, 0.1, -0.9]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.5, 1.2, 24]} />
        </mesh>
      </group>

      {/* 🦩 DOFLAMINGO PINK FEATHER BOA COLLAR */}
      {(config.body.neckAccessory === 'pink_feather_coat' || config.accessory === 'pink_feather_boa') && (
        <group position={[0, 0.55, 0]}>
          {[...Array(24)].map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const radius = 0.82;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * radius, 0.15 + (i % 2) * 0.05, Math.sin(angle) * radius]}
                rotation={[0.3, angle, 0.2]}
              >
                <coneGeometry args={[0.12, 0.45, 8]} />
                <meshStandardMaterial color="#f472b6" roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 🐚 MULTI-TIERED HIGH-DETAIL SPIRAL SHELL */}
      <group position={[0, 0.95, -0.1]}>
        {/* Primary Shell Sphere */}
        <mesh material={shellMat} castShadow receiveShadow>
          <sphereGeometry args={[0.9, 32, 32]} />
        </mesh>

        {/* Spiral Swirl Ridges */}
        <mesh material={shellSecondaryMat} position={[0.45, 0, 0.1]} rotation={[0, 1.57, 0]}>
          <torusGeometry args={[0.5, 0.16, 24, 48]} />
        </mesh>
        <mesh material={shellSecondaryMat} position={[0.65, 0, 0.1]} rotation={[0, 1.57, 0]}>
          <torusGeometry args={[0.25, 0.12, 24, 48]} />
        </mesh>

        {/* 📷 VEGAPUNK TOP CAMERA LENS */}
        {config.shell.hasTopCameraLens && (
          <group position={[0, 0.92, 0]}>
            <mesh>
              <cylinderGeometry args={[0.28, 0.35, 0.2, 32]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.18, 0.18]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#9333ea" roughness={0.0} metalness={0.9} />
            </mesh>
          </group>
        )}

        {/* 🔢 VEGAPUNK NUMERIC KEYPAD */}
        {config.shell.hasKeypad && (
          <group position={[0.78, 0, 0.2]} rotation={[0, 1.2, 0]}>
            <mesh>
              <boxGeometry args={[0.45, 0.5, 0.08]} />
              <meshStandardMaterial color="#eab308" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.38, 0.42, 0.02]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        )}

        {/* 📞 WHITEBEARD BRASS SIDE SPEAKER */}
        {config.shell.shellShape === 'whitebeard_headset' && (
          <group position={[-0.82, 0, 0.1]} rotation={[0, -1.57, 0]}>
            <mesh>
              <cylinderGeometry args={[0.38, 0.4, 0.15, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.02, 16]} />
              <meshStandardMaterial color="#020617" />
            </mesh>
          </group>
        )}

        {/* ROTARY TELEPHONE DIAL & COILED CABLE */}
        {config.shell.hasRotaryDial && (
          <group position={[0, 0.88, 0]} rotation={[-0.2, 0, 0]}>
            <mesh material={dialMat}>
              <cylinderGeometry args={[0.42, 0.45, 0.1, 32]} />
            </mesh>
            <mesh material={shellSecondaryMat} position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.36, 0.36, 0.02, 32]} />
            </mesh>
          </group>
        )}

        {/* 📞 TELEPHONE RECEIVER HANDSET */}
        {config.shell.receiverOnTop && (
          <group position={[0, 1.05, 0]} rotation={[0, 0, isRinging ? 0.2 : 0]}>
            <mesh material={dialMat}>
              <boxGeometry args={[0.85, 0.12, 0.16]} />
            </mesh>
            <mesh material={dialMat} position={[-0.4, -0.08, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
            </mesh>
            <mesh material={dialMat} position={[0.4, -0.08, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
            </mesh>

            {/* COILED WIRE SPRING CONNECTOR CABLE */}
            <mesh position={[-0.2, -0.4, -0.2]} rotation={[0.5, 0, 0]}>
              <torusGeometry args={[0.15, 0.03, 16, 32]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>

      {/* 🗣️ HEAD & FACE (HD FACIAL ANATOMY) */}
      <group ref={headGroupRef} position={[0, 0.65, 0.9]}>
        <mesh material={bodyMat}>
          <sphereGeometry args={[0.52, 32, 32]} />
        </mesh>

        {/* 👄 PROCEDURAL MOUTH VARIATIONS */}
        {config.face.mouthStyle === 'duck_bill' ? (
          <group position={[0, -0.15, 0.48]}>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.32, 0.08, 0.22]} />
              <meshStandardMaterial color="#f97316" roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.28, 0.08, 0.2]} />
              <meshStandardMaterial color="#ea580c" roughness={0.3} />
            </mesh>
          </group>
        ) : config.face.mouthStyle === 'big_lipstick' ? (
          <group position={[0, -0.15, 0.48]}>
            <mesh ref={mouthRef} position={[0, 0, 0]}>
              <torusGeometry args={[0.18, 0.08, 16, 32]} />
              <meshStandardMaterial color="#be123c" roughness={0.1} />
            </mesh>
          </group>
        ) : (
          <mesh ref={mouthRef} position={[0, -0.15, 0.48]} rotation={[0.1, 0, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color={config.face.mouthStyle === 'toothy_grin' ? '#ffffff' : '#280509'} />
          </mesh>
        )}

        {/* 👑 WHITEBEARD GIANT CRESCENT MUSTACHE */}
        {(config.face.facialHair === 'whitebeard_crescent' || config.accessory === 'whitebeard_mustache') && (
          <group position={[0, -0.08, 0.52]}>
            <mesh position={[-0.45, 0.15, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.08, 0.9, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            <mesh position={[0.45, 0.15, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.08, 0.9, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.02, 0.02]}>
              <boxGeometry args={[0.4, 0.08, 0.08]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* 🔴 BUGGY RED CLOWN NOSE */}
        {(config.face.noseStyle === 'red_clown_nose' || config.accessory === 'clown_nose') && (
          <mesh position={[0, 0.02, 0.55]}>
            <sphereGeometry args={[0.14, 32, 32]} />
            <meshStandardMaterial color="#dc2626" roughness={0.1} />
          </mesh>
        )}

        {/* 🚬 CIGARS (CROCODILE / SMOKER) */}
        {(config.face.mouthStyle === 'cigar_mouth' || config.accessory === 'croc_cigar' || config.accessory === 'smoker_cigars') && (
          <group position={[0.15, -0.15, 0.48]} rotation={[0, 0.4, 0.2]}>
            <mesh rotation={[1.57, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.35, 16]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0, 0, 0.18]}>
              <sphereGeometry args={[0.038, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        )}

        {/* 👁️ EYE STALKS & EYES */}
        {/* Left Stalk */}
        <group ref={leftStalkRef} position={[-0.22 * config.face.eyeSpacing, 0.35 * config.face.eyeHeight, 0.1]}>
          {/* Stalk Joint Ring */}
          <mesh material={dialMat} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          </mesh>

          <mesh material={bodyMat} position={[0, 0.25 * config.body.antennaLength, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5 * config.body.antennaLength, 16]} />
          </mesh>

          {/* Left Eyeball */}
          <group position={[0, 0.52 * config.body.antennaLength, 0.05]} scale={config.face.eyeSize}>
            <mesh material={eyeWhiteMat}>
              <sphereGeometry args={[0.18, 32, 32]} />
            </mesh>

            {/* Left Pupil */}
            <mesh ref={leftPupilRef} material={pupilMat} position={[0, 0, 0.16]}>
              <sphereGeometry args={[config.face.pupilStyle === 'large' ? 0.09 : 0.06, 16, 16]} />
            </mesh>

            {/* Left Eyebrow */}
            {config.face.eyebrowStyle !== 'none' && (
              <mesh position={[0, 0.22, 0.05]} rotation={[0, 0, eyebrowAngleRad]}>
                <boxGeometry args={[0.24, 0.05, 0.04]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            )}

            {/* 🦩 DOFLAMINGO POINTED RED SUNGLASSES (ON LEFT EYE STALK) */}
            {(config.face.glasses === 'doflamingo_red' || config.accessory === 'doflamingo_glasses') && (
              <mesh position={[0.08, 0, 0.12]} rotation={[0, 0, 1.37]}>
                <coneGeometry args={[0.24, 0.45, 3]} />
                <meshStandardMaterial color="#dc2626" metalness={0.9} roughness={0.1} />
              </mesh>
            )}
          </group>
        </group>

        {/* Right Stalk */}
        <group ref={rightStalkRef} position={[0.22 * config.face.eyeSpacing, 0.35 * config.face.eyeHeight, 0.1]}>
          {/* Stalk Joint Ring */}
          <mesh material={dialMat} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          </mesh>

          <mesh material={bodyMat} position={[0, 0.25 * config.body.antennaLength, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5 * config.body.antennaLength, 16]} />
          </mesh>

          {/* Right Eyeball */}
          <group position={[0, 0.52 * config.body.antennaLength, 0.05]} scale={config.face.eyeSize}>
            <mesh material={eyeWhiteMat}>
              <sphereGeometry args={[0.18, 32, 32]} />
            </mesh>

            {/* Right Pupil */}
            <mesh ref={rightPupilRef} material={pupilMat} position={[0, 0, 0.16]}>
              <sphereGeometry args={[config.face.pupilStyle === 'large' ? 0.09 : 0.06, 16, 16]} />
            </mesh>

            {/* Right Eyebrow */}
            {config.face.eyebrowStyle !== 'none' && (
              <mesh position={[0, 0.22, 0.05]} rotation={[0, 0, -eyebrowAngleRad]}>
                <boxGeometry args={[0.24, 0.05, 0.04]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            )}

            {/* 🦩 DOFLAMINGO POINTED RED SUNGLASSES (ON RIGHT EYE STALK) */}
            {(config.face.glasses === 'doflamingo_red' || config.accessory === 'doflamingo_glasses') && (
              <mesh position={[-0.08, 0, 0.12]} rotation={[0, 0, -1.37]}>
                <coneGeometry args={[0.24, 0.45, 3]} />
                <meshStandardMaterial color="#dc2626" metalness={0.9} roughness={0.1} />
              </mesh>
            )}
          </group>
        </group>

        {/* 👒 STRAW HAT (LUFFY) */}
        {config.accessory === 'straw_hat' && (
          <group position={[0, 0.48, -0.1]} rotation={[-0.3, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.75, 0.78, 0.06, 32]} />
              <meshStandardMaterial color="#eab308" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.38, 0.42, 0.35, 32]} />
              <meshStandardMaterial color="#eab308" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.43, 0.43, 0.08, 32]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>
        )}

        {/* 🐯 LAW SPOTTED HAT */}
        {config.accessory === 'law_spotted_hat' && (
          <group position={[0, 0.52, -0.05]}>
            <mesh>
              <sphereGeometry args={[0.45, 32, 32]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.7} />
            </mesh>
            <mesh position={[0.15, 0.2, 0.3]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[-0.15, 0.1, 0.35]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};


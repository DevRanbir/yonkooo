"use client";
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { DenDenMushi3D } from './DenDenMushi3D';
import { DenDenMushiGLB } from './DenDenMushiGLB';
import { MushiConfig } from '@/lib/dendenmushi/mushi';

interface Props {
  config: MushiConfig;
  isRinging: boolean;
  isSpeaking: boolean;
  audioVolume: number;
  trackingCoords?: { x: number; y: number } | null;
}

export const DenDenMushiCanvas: React.FC<Props> = ({
  config,
  isRinging,
  isSpeaking,
  audioVolume,
  trackingCoords
}) => {
  const isGlbMode = config.modelMode === 'glb_law' || config.modelMode === 'glb_law_hd';

  return (
    <div className="w-full h-full min-h-[200px] relative overflow-hidden bg-transparent">
      <Canvas shadows gl={{ alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0.15, 3.8]} fov={42} />
        
        {/* Lighting */}
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 4, -5]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, 2, 2]} intensity={0.9} color="#fef08a" />

        <Suspense fallback={null}>
          {isGlbMode ? (
            <DenDenMushiGLB
              isRinging={isRinging}
              isSpeaking={isSpeaking}
              audioVolume={audioVolume}
              isHd={config.modelMode === 'glb_law_hd'}
              trackingCoords={trackingCoords}
            />
          ) : (
            <DenDenMushi3D
              config={config}
              isRinging={isRinging}
              isSpeaking={isSpeaking}
              audioVolume={audioVolume}
              trackingCoords={trackingCoords}
            />
          )}

          <ContactShadows
            position={[0, -0.34, 0]}
            opacity={0.65}
            scale={4.8}
            blur={2.0}
            far={2}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.0}
          maxDistance={6.0}
          target={[0, 0.05, 0]}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.75}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};


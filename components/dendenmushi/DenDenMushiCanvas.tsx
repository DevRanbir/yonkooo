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
    <div className="w-full h-full min-h-[200px] relative rounded-lg overflow-hidden shadow-xl bg-gradient-to-b from-[#0a2333] via-[#071926] to-[#04121b] border border-[#e8bd6144]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0.4, 4.2]} fov={45} />
        
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
            position={[0, -0.62, 0]}
            opacity={0.7}
            scale={5}
            blur={1.5}
            far={2}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.2}
          maxDistance={6.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={false}
        />
      </Canvas>

      {/* Watermark Badges */}
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-mono text-amber-400 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>MODE: {isGlbMode ? (config.modelMode === 'glb_law_hd' ? '3D GLB (HD LAW)' : '3D GLB (LAW)') : `SEED ${config.seed}`}</span>
      </div>

      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-semibold text-amber-300 capitalize">
        📍 {config.region.replace('_', ' ')}
      </div>
    </div>
  );
};


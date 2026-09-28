"use client";
import React from 'react';
import { Dices, Sparkles, Palette, Eye, Radio, UserCheck, Box } from 'lucide-react';
import {
  MushiConfig,
  RegionTheme,
  ExpressionState,
  PersonalityType,
  EyeShape,
  EyebrowStyle,
  MouthStyle,
  ShellShape,
  AccessoryType,
  CharacterPresetId,
  ModelMode
} from '@/lib/dendenmushi/mushi';
import { generateRandomSeed, generateMushiFromSeed } from '@/lib/dendenmushi/seedGenerator';
import { CHARACTER_PRESETS } from '@/lib/dendenmushi/characterPresets';

interface Props {
  config: MushiConfig;
  onChange: (newConfig: MushiConfig) => void;
}

const CHARACTER_BUTTONS: { id: CharacterPresetId; label: string; icon: string; defaultGlb?: boolean }[] = [
  { id: 'law', label: 'Trafalgar Law (GLB 3D)', icon: '🐯', defaultGlb: true },
  { id: 'whitebeard', label: 'Whitebeard (Newgate)', icon: '👑' },
  { id: 'doflamingo', label: 'Doflamingo (Joker)', icon: '🦩' },
  { id: 'vegapunk', label: 'Vegapunk (SSG Video)', icon: '📷' },
  { id: 'luffy', label: 'Straw Hat Luffy', icon: '👒' },
  { id: 'crocodile', label: 'Sir Crocodile', icon: '🐊' },
  { id: 'ivankov', label: 'Emporio Ivankov', icon: '💄' },
  { id: 'smoker', label: 'Vice Admiral Smoker', icon: '💨' },
  { id: 'kizaru', label: 'Admiral Kizaru', icon: '⚡' },
  { id: 'buggy', label: 'Buggy the Clown', icon: '🔴' },
  { id: 'franky', label: 'Franky Cyborg', icon: '🤖' },
  { id: 'buster_call', label: 'Golden Buster Call', icon: '🚨' }
];

const EYE_SHAPES: EyeShape[] = ['round', 'oval', 'narrow', 'large', 'droopy', 'wide', 'angry', 'sleepy', 'doflamingo_shades'];
const EYEBROW_STYLES: EyebrowStyle[] = ['thick', 'angled', 'flat', 'curved', 'bushy', 'none'];
const MOUTHS: MouthStyle[] = ['wide', 'small', 'oval', 'smile', 'frown', 'shock', 'toothy_grin', 'duck_bill', 'big_lipstick', 'cigar_mouth'];
const SHELL_SHAPES: ShellShape[] = ['classic_spiral', 'ridged_shell', 'tall_spire', 'smooth_dome', 'armored_plates', 'vegapunk_camera', 'whitebeard_headset'];
const ACCESSORIES: AccessoryType[] = [
  'none', 
  'straw_hat', 
  'doflamingo_glasses', 
  'law_spotted_hat', 
  'whitebeard_mustache', 
  'clown_nose', 
  'vegapunk_lens', 
  'croc_cigar', 
  'smoker_cigars', 
  'franky_hair', 
  'pink_feather_boa',
  'marine_hat',
  'pirate_patch',
  'water7_goggles',
  'wano_rope',
  'royal_crown',
  'cp0_glasses',
  'headset'
];
const PERSONALITIES: PersonalityType[] = ['cheerful', 'serious', 'nervous', 'curious', 'sarcastic', 'formal', 'brave', 'sleepy', 'dramatic', 'sinister', 'emperor', 'goofy'];
const EXPRESSIONS: ExpressionState[] = ['happy', 'neutral', 'suspicious', 'surprised', 'angry', 'worried', 'sleepy', 'confident', 'sad', 'curious', 'shock', 'sinister'];

export const CustomizerPanel: React.FC<Props> = ({ config, onChange }) => {
  const handleRandomize = () => {
    const newSeed = generateRandomSeed();
    const newConfig = generateMushiFromSeed(newSeed);
    onChange(newConfig);
  };

  const handleSelectPreset = (presetId: CharacterPresetId, useGlb?: boolean) => {
    const preset = CHARACTER_PRESETS[presetId];
    if (preset) {
      onChange({
        ...preset,
        seed: config.seed,
        modelMode: useGlb ? 'glb_law' : preset.modelMode || 'procedural'
      });
    }
  };

  const handleSeedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const seed = (formData.get('seed') as string) || generateRandomSeed();
    onChange(generateMushiFromSeed(seed));
  };

  const updateFace = (fields: Partial<typeof config.face>) => {
    onChange({
      ...config,
      presetId: 'custom',
      face: { ...config.face, ...fields }
    });
  };

  const updateBody = (fields: Partial<typeof config.body>) => {
    onChange({
      ...config,
      presetId: 'custom',
      body: { ...config.body, ...fields }
    });
  };

  const updateShell = (fields: Partial<typeof config.shell>) => {
    onChange({
      ...config,
      presetId: 'custom',
      shell: { ...config.shell, ...fields }
    });
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-amber-600/40 rounded-2xl p-5 space-y-6 text-slate-100 shadow-2xl overflow-y-auto max-h-[720px]">
      {/* HEADER & RANDOMIZER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="font-nautical font-bold text-lg text-amber-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Character & Facial Customizer
          </h2>
          <p className="text-xs text-slate-400">Choose official One Piece character preset or load GLB reference model</p>
        </div>

        <button
          onClick={handleRandomize}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition transform active:scale-95"
        >
          <Dices className="w-4 h-4 animate-spin-slow" />
          <span>RANDOMIZE</span>
        </button>
      </div>

      {/* 📦 3D RENDER ENGINE TOGGLE */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Box className="w-4 h-4 text-amber-400" />
          3D Model Source Engine
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ ...config, modelMode: 'procedural' })}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              config.modelMode === 'procedural'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🎨 Procedural 3D
          </button>

          <button
            onClick={() => onChange({ ...config, modelMode: 'glb_law' })}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              config.modelMode === 'glb_law'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 Law GLB
          </button>

          <button
            onClick={() => onChange({ ...config, modelMode: 'glb_law_hd' })}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              config.modelMode === 'glb_law_hd'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            💎 Law GLB HD
          </button>
        </div>
      </div>

      {/* 🎭 OFFICIAL ONE PIECE CHARACTER PRESETS GRID */}
      <div className="space-y-2.5 pt-1">
        <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-amber-400" />
          Official Character Presets (1-Click Load)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CHARACTER_BUTTONS.map((char) => (
            <button
              key={char.id}
              onClick={() => handleSelectPreset(char.id, char.defaultGlb)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                config.presetId === char.id
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-200'
              }`}
            >
              <span className="text-sm">{char.icon}</span>
              <span className="truncate">{char.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SEED INPUT FORM */}
      <form onSubmit={handleSeedSubmit} className="flex gap-2 pt-1">
        <div className="flex-1 bg-slate-950/80 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <input
            type="text"
            name="seed"
            defaultValue={config.seed}
            key={config.seed}
            placeholder="Enter Seed String"
            className="w-full bg-transparent text-xs font-mono text-amber-300 focus:outline-none uppercase"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer"
        >
          LOAD SEED
        </button>
      </form>

      {/* 👁️ FACIAL FEATURES SELECTOR */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-amber-400" />
          Facial Feature & Accessory Controls
        </label>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-400 mb-1 block">Mouth & Lip Style</label>
            <select
              value={config.face.mouthStyle}
              onChange={(e) => updateFace({ mouthStyle: e.target.value as MouthStyle })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 capitalize"
            >
              {MOUTHS.map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Facial Hair / Cigar</label>
            <select
              value={config.face.facialHair}
              onChange={(e) => updateFace({ facialHair: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 capitalize"
            >
              <option value="none">None</option>
              <option value="whitebeard_crescent">Whitebeard Crescent Mustache</option>
              <option value="mihawk_goatee">Mihawk Goatee</option>
              <option value="thin_mustache">Thin Wavy Mustache</option>
              <option value="kaido_mustache">Kaido Dragon Mustache</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-400 mb-1 block">Glasses & Shades</label>
            <select
              value={config.face.glasses}
              onChange={(e) => updateFace({ glasses: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 capitalize"
            >
              <option value="none">None</option>
              <option value="doflamingo_red">Doflamingo Red Sunglasses</option>
              <option value="cyborg_shades">Franky Cyborg Shades</option>
              <option value="kizaru_tinted">Kizaru Tinted Glasses</option>
              <option value="cp0_black">CP0 Agent Shades</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Accessory Item</label>
            <select
              value={config.accessory}
              onChange={(e) => onChange({ ...config, accessory: e.target.value as AccessoryType })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 capitalize"
            >
              {ACCESSORIES.map((acc) => (
                <option key={acc} value={acc}>{acc.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-400 mb-1 block">Eye Shape</label>
            <select
              value={config.face.eyeShape}
              onChange={(e) => updateFace({ eyeShape: e.target.value as EyeShape })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 capitalize"
            >
              {EYE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>{shape.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Expression</label>
            <select
              value={config.face.expression}
              onChange={(e) => updateFace({ expression: e.target.value as ExpressionState })}
              className="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-2 text-amber-300 font-bold capitalize"
            >
              {EXPRESSIONS.map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🎨 COLOR PALETTES */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-amber-400" />
          Color Controls
        </label>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 mb-1 block">Body Skin Color</label>
            <input
              type="color"
              value={config.body.bodyColor}
              onChange={(e) => updateBody({ bodyColor: e.target.value })}
              className="w-full h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-700 p-0.5"
            />
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Shell Color</label>
            <input
              type="color"
              value={config.shell.primaryColor}
              onChange={(e) => updateShell({ primaryColor: e.target.value })}
              className="w-full h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-700 p-0.5"
            />
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Pupil Color</label>
            <input
              type="color"
              value={config.face.pupilColor}
              onChange={(e) => updateFace({ pupilColor: e.target.value })}
              className="w-full h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-700 p-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


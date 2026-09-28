import {
  MushiConfig,
  RegionTheme,
  ExpressionState,
  PersonalityType,
  EyeShape,
  EyebrowStyle,
  MouthStyle,
  ShellShape,
  AccessoryType
} from './mushi';

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash >>> 0;
}

export function generateRandomSeed(): string {
  const chars = '0123456789ABCDEF';
  let result = 'MUSHI-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const REGION_THEMES_LIST: RegionTheme[] = [
  'east_blue', 'marine', 'pirate', 'wano', 'water_7', 'royal', 'cp0', 'golden_buster'
];

const EYE_SHAPES: EyeShape[] = ['round', 'oval', 'narrow', 'large', 'droopy', 'wide', 'angry', 'sleepy'];
const EYEBROWS: EyebrowStyle[] = ['thick', 'angled', 'flat', 'curved', 'bushy', 'none'];
const MOUTHS: MouthStyle[] = ['wide', 'small', 'oval', 'smile', 'frown', 'shock'];
const SHELL_SHAPES: ShellShape[] = ['classic_spiral', 'ridged_shell', 'tall_spire', 'smooth_dome', 'armored_plates'];
const PERSONALITIES: PersonalityType[] = ['cheerful', 'serious', 'nervous', 'curious', 'sarcastic', 'formal', 'brave', 'sleepy', 'dramatic'];
const EXPRESSIONS: ExpressionState[] = ['happy', 'neutral', 'suspicious', 'surprised', 'angry', 'worried', 'sleepy', 'confident', 'sad', 'curious'];

const FACTION_PALETTES: Record<RegionTheme, {
  body: string[];
  shell: string[];
  secondary: string[];
  accessory: AccessoryType[];
  defaultPersonality: PersonalityType;
  prefixNames: string[];
}> = {
  east_blue: {
    body: ['#4ade80', '#86efac', '#38bdf8', '#fbbf24'],
    shell: ['#f97316', '#fb923c', '#eab308', '#ec4899'],
    secondary: ['#ffffff', '#fef08a', '#e2e8f0'],
    accessory: ['straw_hat', 'headset'],
    defaultPersonality: 'cheerful',
    prefixNames: ['East Blue', 'Village', 'Sea breeze', 'Windmill']
  },
  marine: {
    body: ['#93c5fd', '#bfdbfe', '#e2e8f0', '#60a5fa'],
    shell: ['#1e3a8a', '#1e40af', '#3b82f6', '#0284c7'],
    secondary: ['#ffffff', '#dbeafe', '#93c5fd'],
    accessory: ['marine_hat', 'headset'],
    defaultPersonality: 'formal',
    prefixNames: ['Justice', 'Base 153', 'Fleet', 'Officer']
  },
  pirate: {
    body: ['#f87171', '#ef4444', '#ca8a04', '#78350f'],
    shell: ['#450a0a', '#18181b', '#7c2d12', '#991b1b'],
    secondary: ['#dc2626', '#f59e0b', '#000000'],
    accessory: ['pirate_patch', 'doflamingo_glasses'],
    defaultPersonality: 'brave',
    prefixNames: ['Grand Line', 'Skull', 'Freebooter', 'Rogue']
  },
  wano: {
    body: ['#f472b6', '#fb7185', '#a78bfa', '#fef08a'],
    shell: ['#be123c', '#7e22ce', '#047857', '#b45309'],
    secondary: ['#fef08a', '#f43f5e', '#ffffff'],
    accessory: ['wano_rope', 'none'],
    defaultPersonality: 'dramatic',
    prefixNames: ['Kuri', 'Flower Capital', 'Samurai', 'Ronin']
  },
  water_7: {
    body: ['#38bdf8', '#71717a', '#0284c7', '#94a3b8'],
    shell: ['#334155', '#475569', '#0f172a', '#ca8a04'],
    secondary: ['#fbbf24', '#cbd5e1', '#0ea5e9'],
    accessory: ['water7_goggles', 'vegapunk_lens'],
    defaultPersonality: 'curious',
    prefixNames: ['Shipwright', 'Dock 1', 'Galley-La', 'Aqua Laguna']
  },
  royal: {
    body: ['#fef08a', '#e9d5ff', '#f472b6', '#bfdbfe'],
    shell: ['#a855f7', '#d946ef', '#eab308', '#2563eb'],
    secondary: ['#fef08a', '#ffffff', '#fb7185'],
    accessory: ['royal_crown', 'none'],
    defaultPersonality: 'formal',
    prefixNames: ['Palace', 'Highness', 'Celestial', 'Alabasta']
  },
  cp0: {
    body: ['#f8fafc', '#e2e8f0', '#cbd5e1', '#0f172a'],
    shell: ['#09090b', '#18181b', '#27272a', '#450a0a'],
    secondary: ['#dc2626', '#ffffff', '#52525b'],
    accessory: ['cp0_glasses', 'headset'],
    defaultPersonality: 'serious',
    prefixNames: ['Aegis', 'Cipher', 'Masked', 'Agent']
  },
  golden_buster: {
    body: ['#fbbf24', '#f59e0b', '#ca8a04', '#fef08a'],
    shell: ['#eab308', '#ca8a04', '#a16207', '#b45309'],
    secondary: ['#dc2626', '#ffffff', '#78350f'],
    accessory: ['headset', 'none'],
    defaultPersonality: 'serious',
    prefixNames: ['Buster Call', 'Golden', 'Admiral', 'Emergency']
  }
};

export function generateMushiFromSeed(seedStr: string, regionOverride?: RegionTheme): MushiConfig {
  const seedNum = stringToSeed(seedStr);
  const rng = mulberry32(seedNum);

  const pickRng = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const rangeRng = (min: number, max: number): number => min + rng() * (max - min);

  const region = regionOverride || pickRng(REGION_THEMES_LIST);
  const palette = FACTION_PALETTES[region];

  const bodyColor = pickRng(palette.body);
  const shellColor = pickRng(palette.shell);
  const secondaryColor = pickRng(palette.secondary);
  const accessory = pickRng(palette.accessory);

  const eyeShape = pickRng(EYE_SHAPES);
  const eyebrowStyle = pickRng(EYEBROWS);
  const mouthStyle = pickRng(MOUTHS);
  const shellShape = pickRng(SHELL_SHAPES);
  const personality = pickRng(PERSONALITIES);
  const initialExpression = pickRng(EXPRESSIONS);

  const namePrefix = pickRng(palette.prefixNames);
  const mushiNumber = seedStr.replace(/[^0-9A-Z]/gi, '').slice(-4) || '007';

  return {
    seed: seedStr,
    name: `${namePrefix} Mushi #${mushiNumber}`,
    presetId: 'custom',
    modelMode: 'procedural',
    region,
    personality,
    face: {
      eyeShape,
      eyeSize: Number(rangeRng(0.85, 1.25).toFixed(2)),
      eyeSpacing: Number(rangeRng(0.85, 1.15).toFixed(2)),
      eyeHeight: Number(rangeRng(0.9, 1.1).toFixed(2)),
      pupilStyle: pickRng(['large', 'small', 'ring', 'cat']),
      pupilColor: rng() > 0.3 ? '#0f172a' : '#1e3a8a',
      eyebrowStyle,
      eyebrowAngle: Math.floor(rangeRng(-12, 15)),
      mouthStyle,
      cheekStyle: pickRng(['none', 'soft_blush', 'spirals', 'scars']),
      expression: initialExpression,
      facialHair: 'none',
      glasses: 'none',
      noseStyle: 'normal'
    },
    body: {
      bodyColor,
      skinPattern: pickRng(['plain', 'spots', 'stripes', 'gradient']),
      patternColor: secondaryColor,
      bodyScale: Number(rangeRng(0.9, 1.1).toFixed(2)),
      bodyWidth: Number(rangeRng(0.9, 1.15).toFixed(2)),
      antennaLength: Number(rangeRng(0.85, 1.2).toFixed(2)),
      antennaCurve: Number(rangeRng(0.8, 1.2).toFixed(2)),
      neckAccessory: 'none'
    },
    shell: {
      shellShape,
      primaryColor: shellColor,
      secondaryColor,
      dialColor: region === 'golden_buster' ? '#dc2626' : '#d4af37',
      pattern: pickRng(['spiral', 'swirl', 'stripes', 'camo', 'solid']),
      wearLevel: Number(rangeRng(0.1, 0.6).toFixed(2)),
      hasRotaryDial: true,
      receiverOnTop: true,
      hasKeypad: false,
      hasTopCameraLens: false
    },
    accessory,
    voice: {
      pitch: Number(rangeRng(0.8, 1.4).toFixed(2)),
      rate: Number(rangeRng(0.9, 1.2).toFixed(2)),
      pitchShiftName: personality === 'serious' ? 'low' : personality === 'nervous' ? 'high' : 'normal'
    }
  };
}

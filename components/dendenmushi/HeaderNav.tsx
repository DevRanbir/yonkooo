"use client";
import React from 'react';
import { Volume2, VolumeX, Code, SlidersHorizontal, Compass, FileText, Phone, ShieldAlert } from 'lucide-react';
import type { RegionTheme, MushiConfig } from '@/lib/dendenmushi/mushi';

interface Props {
  config: MushiConfig;
  currentRole: 'distress' | 'hq';
  isMuted: boolean;
  isCustomizerOpen: boolean;
  onSelectRole: (role: 'distress' | 'hq') => void;
  onToggleMute: () => void;
  onToggleCustomizer: () => void;
  onOpenEmbed: () => void;
  onOpenDistressForm: () => void;
  onSelectRegion: (region: RegionTheme) => void;
}

const REGION_LIST: { id: RegionTheme; name: string }[] = [
  { id: 'east_blue', name: '🌊 EAST BLUE' },
  { id: 'marine', name: '⚓ MARINE NAVY' },
  { id: 'pirate', name: '🏴‍☠️ PIRATE FLEET' },
  { id: 'wano', name: '🌸 WANO COUNTRY' },
  { id: 'water_7', name: '🔨 WATER 7' },
  { id: 'royal', name: '👑 ROYAL PALACE' },
  { id: 'cp0', name: '🕵️ CP0 CIPHER POL' },
  { id: 'golden_buster', name: '🚨 BUSTER CALL' }
];

export const HeaderNav: React.FC<Props> = ({
  config,
  currentRole,
  isMuted,
  isCustomizerOpen,
  onSelectRole,
  onToggleMute,
  onToggleCustomizer,
  onOpenEmbed,
  onOpenDistressForm,
  onSelectRegion
}) => {
  return (
    <header className="w-full bg-[#0D2B3D]/95 backdrop-blur-md border-b border-[#E8BD61]/40 sticky top-[76px] z-30 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 abyssal-shadow">
      {/* BRAND & TITLE */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-[#E8BD61] text-[#071926] flex items-center justify-center text-2xl font-bold border border-[#F0C65D] abyssal-shadow">
          🐌
        </div>
        <div>
          <h1 className="font-serif-heading font-black text-xl sm:text-2xl text-[#E8BD61] tracking-wide flex items-center gap-2">
            GRAND LINE EMERGENCY NETWORK
          </h1>
          <p className="text-[11px] font-mono-signal text-[#A8BBC0] hidden sm:block">
            Den Den Mushi Dispatch System • Two-Sided Communication Architecture
          </p>
        </div>
      </div>

      {/* TWO DISTINCT MODE ROLE SWITCHER BUTTONS */}
      <div className="flex items-center gap-2 font-mono-signal text-xs">
        <button
          onClick={() => onSelectRole('distress')}
          className={`px-3.5 py-2 rounded-sm font-bold flex items-center gap-1.5 transition cursor-pointer abyssal-shadow border ${
            currentRole === 'distress'
              ? 'bg-[#B93B32] text-[#F4EAD5] border-[#E56659]'
              : 'bg-[#071926] text-[#A8BBC0] border-slate-800 hover:text-[#F4EAD5]'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>🆘 /distress (Caller)</span>
        </button>

        <button
          onClick={() => onSelectRole('hq')}
          className={`px-3.5 py-2 rounded-sm font-bold flex items-center gap-1.5 transition cursor-pointer abyssal-shadow border ${
            currentRole === 'hq'
              ? 'bg-[#6AB897] text-[#071926] border-[#6AB897]'
              : 'bg-[#071926] text-[#A8BBC0] border-slate-800 hover:text-[#F4EAD5]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>🏴 /hq (Armada HQ)</span>
        </button>
      </div>

      {/* QUICK ISLAND / REGION SELECTOR */}
      <div className="flex items-center gap-2">
        <div className="bg-[#071926] border border-[#E8BD61]/40 rounded-sm px-3 py-1.5 flex items-center gap-2 text-xs font-mono-signal">
          <Compass className="w-4 h-4 text-[#6AB897]" />
          <select
            value={config.region}
            onChange={(e) => onSelectRegion(e.target.value as RegionTheme)}
            className="bg-transparent text-[#E8BD61] font-semibold focus:outline-none cursor-pointer"
          >
            {REGION_LIST.map((reg) => (
              <option key={reg.id} value={reg.id} className="bg-[#0D2B3D] text-[#F4EAD5]">
                {reg.name}
              </option>
            ))}
          </select>
        </div>

        {/* DISTRESS SOS FORM BUTTON */}
        <button
          onClick={onOpenDistressForm}
          className="bg-[#B93B32] hover:bg-[#E56659] text-[#F4EAD5] font-mono-signal font-bold px-3 py-2 rounded-sm text-xs flex items-center gap-2 border border-[#E56659] abyssal-shadow cursor-pointer transition transform active:scale-95"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">SOS LOG</span>
        </button>

        {/* ACTION BUTTONS */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-sm border transition cursor-pointer abyssal-shadow ${
            isMuted
              ? 'bg-[#B93B32] border-[#E56659] text-[#F4EAD5]'
              : 'bg-[#071926] border-[#E8BD61]/40 text-[#E8BD61] hover:border-[#E8BD61]'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleCustomizer}
          className={`px-3 py-2 rounded-sm border font-mono-signal font-bold text-xs flex items-center gap-2 transition cursor-pointer abyssal-shadow ${
            isCustomizerOpen
              ? 'bg-[#E8BD61] text-[#071926] border-[#F0C65D]'
              : 'bg-[#071926] border-[#E8BD61]/40 text-[#E8BD61] hover:border-[#E8BD61]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">3D</span>
        </button>

        <button
          onClick={onOpenEmbed}
          className="bg-[#6AB897] hover:bg-[#77B7BD] text-[#071926] font-mono-signal font-bold px-3 py-2 rounded-sm text-xs flex items-center gap-2 border border-[#6AB897] abyssal-shadow cursor-pointer transition transform active:scale-95"
        >
          <Code className="w-4 h-4" />
          <span>CONNECT</span>
        </button>
      </div>
    </header>
  );
};


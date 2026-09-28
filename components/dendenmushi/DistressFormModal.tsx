"use client";
import React, { useState } from 'react';
import { X, AlertTriangle, Compass, Send, Sparkles, Navigation, ShieldAlert } from 'lucide-react';
import { soundEngine } from '@/lib/dendenmushi/soundEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSos: (data: {
    classification: string;
    island: string;
    coordinates: string;
    callerId: string;
    frequency: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    priorityScore: number;
    details: string;
  }) => void;
}

const EMERGENCY_CLASSIFICATIONS = [
  'Blizzard Exposure & Hypothermia',
  'Sea King Monster Attack',
  'Buster Call Warship Bombardment',
  'Pirate Fleet Invasion',
  'Aqua Laguna Tsunami Flood',
  'Poison & Venom Exposure',
  'Ship Sinking & Hull Breach'
];

const GRAND_LINE_ISLANDS = [
  'Drum Island (Paradise)',
  'Water 7 (Paradise)',
  'Wano Country (New World)',
  'Alabasta Kingdom (Paradise)',
  'Marineford Sea Gate',
  'Sabaody Archipelago',
  'Enies Lobby Fortress',
  'Fishman Island (Undersea)'
];

const SECTOR_PRESETS = [
  { island: 'Drum Island (Paradise)', coords: 'Big Horn Ridge - Sector 4', caller: 'Dalton (Civilian Guard)', freq: '108.4 MHz', class: 'Blizzard Exposure & Hypothermia' },
  { island: 'Water 7 (Paradise)', coords: 'Dock 1 Repair Bay - Sector 2', caller: 'Paulie (Galley-La Shipwright)', freq: '94.2 MHz', class: 'Aqua Laguna Tsunami Flood' },
  { island: 'Wano Country (New World)', coords: 'Kuri Mountain Ridge - Sector 7', caller: 'Kine\'mon (Samurai)', freq: '112.8 MHz', class: 'Pirate Fleet Invasion' },
  { island: 'Alabasta Kingdom (Paradise)', coords: 'Rainbase Oasis - Sector 1', caller: 'Pell (Royal Guard)', freq: '88.5 MHz', class: 'Poison & Venom Exposure' }
];

export const DistressFormModal: React.FC<Props> = ({ isOpen, onClose, onSubmitSos }) => {
  const [classification, setClassification] = useState(EMERGENCY_CLASSIFICATIONS[0]);
  const [island, setIsland] = useState(GRAND_LINE_ISLANDS[0]);
  const [coordinates, setCoordinates] = useState('Big Horn Ridge - Sector 4');
  const [callerId, setCallerId] = useState('Dalton (Civilian Guard)');
  const [frequency, setFrequency] = useState('108.4 MHz');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('critical');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const priorityScoreMap = {
    low: 10,
    medium: 20,
    high: 35,
    critical: 50
  };

  const currentScore = priorityScoreMap[urgency];

  const handleAutoFill = () => {
    const preset = SECTOR_PRESETS[Math.floor(Math.random() * SECTOR_PRESETS.length)];
    setIsland(preset.island);
    setCoordinates(preset.coords);
    setCallerId(preset.caller);
    setFrequency(preset.freq);
    setClassification(preset.class);
    soundEngine.playAlertTone();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playAlertTone();
    soundEngine.startSiren();

    onSubmitSos({
      classification,
      island,
      coordinates,
      callerId,
      frequency,
      urgency,
      priorityScore: currentScore,
      details: details || 'Emergency distress signal transmitted via Transponder Snail.'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020B12]/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* 📜 WEATHERED PARCHMENT PAPER EMERGENCY FORM (EXACT MATCH FOR USER IMAGE) */}
      <div className="bg-parchment-paper border-2 border-[#E8BD61] rounded-sm max-w-2xl w-full p-6 sm:p-8 text-[#172D36] abyssal-shadow-lg relative overflow-y-auto max-h-[90vh]">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#172D36] hover:text-[#B93B32] transition cursor-pointer font-bold"
        >
          <X className="w-6 h-6" />
        </button>

        {/* FORM TITLE */}
        <div className="border-b-2 border-[#172D36]/20 pb-3 mb-5">
          <h2 className="font-mono-signal font-bold text-lg sm:text-xl uppercase tracking-wider text-[#172D36] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#B93B32]" />
            TRANSPONDER SNAIL EMERGENCY DISTRESS LOG
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono-signal text-xs">
          {/* 1. EMERGENCY CLASSIFICATION */}
          <div>
            <label className="block font-bold text-[#172D36] uppercase tracking-wider mb-1">
              EMERGENCY CLASSIFICATION
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full bg-[#FAF5EA] border border-[#172D36]/40 rounded-sm p-2.5 text-sm font-sans-body font-semibold text-[#172D36] focus:outline-none focus:border-[#B93B32]"
            >
              {EMERGENCY_CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 2. ISLAND & COORDINATES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#172D36] uppercase tracking-wider mb-1">
                GRAND LINE ISLAND
              </label>
              <select
                value={island}
                onChange={(e) => setIsland(e.target.value)}
                className="w-full bg-[#FAF5EA] border border-[#172D36]/40 rounded-sm p-2.5 text-xs font-sans-body font-semibold text-[#172D36] focus:outline-none"
              >
                {GRAND_LINE_ISLANDS.map((is) => (
                  <option key={is} value={is}>{is}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#172D36] uppercase tracking-wider mb-1">
                SECTOR / LOCATION COORDINATES
              </label>
              <input
                type="text"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                className="w-full bg-[#FAF5EA] border border-[#172D36]/40 rounded-sm p-2.5 text-xs font-sans-body font-semibold text-[#172D36] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 3. CALLER ID & FREQUENCY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#172D36] uppercase tracking-wider mb-1">
                REPORTING CALLER / VESSEL ID
              </label>
              <input
                type="text"
                value={callerId}
                onChange={(e) => setCallerId(e.target.value)}
                className="w-full bg-[#FAF5EA] border border-[#172D36]/40 rounded-sm p-2.5 text-xs font-sans-body font-semibold text-[#172D36] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#172D36] uppercase tracking-wider mb-1">
                TRANSPONDER SNAIL FREQUENCY
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-[#FAF5EA] border border-[#172D36]/40 rounded-sm p-2.5 text-xs font-sans-body font-semibold text-[#172D36] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 4. SEVERITY LEVEL & URGENCY TIER BUTTONS */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-[#172D36] uppercase tracking-wider">
                SEVERITY LEVEL & URGENCY TIER
              </label>
              <span className="text-[11px] font-mono-signal font-bold text-[#B93B32]">
                Base Priority: {currentScore} pts (+aging over time)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('low')}
                className={`py-2 px-2 rounded-sm border text-center font-bold transition cursor-pointer ${
                  urgency === 'low'
                    ? 'bg-[#6AB897] text-[#071926] border-[#172D36]'
                    : 'bg-[#FAF5EA] text-[#172D36] border-[#172D36]/30'
                }`}
              >
                <div>LOW</div>
                <div className="text-[10px] font-normal">10 pts</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('medium')}
                className={`py-2 px-2 rounded-sm border text-center font-bold transition cursor-pointer ${
                  urgency === 'medium'
                    ? 'bg-[#E8BD61] text-[#071926] border-[#172D36]'
                    : 'bg-[#FAF5EA] text-[#172D36] border-[#172D36]/30'
                }`}
              >
                <div>MEDIUM</div>
                <div className="text-[10px] font-normal">20 pts</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('high')}
                className={`py-2 px-2 rounded-sm border text-center font-bold transition cursor-pointer ${
                  urgency === 'high'
                    ? 'bg-[#E56659] text-[#F4EAD5] border-[#172D36]'
                    : 'bg-[#FAF5EA] text-[#172D36] border-[#172D36]/30'
                }`}
              >
                <div>HIGH</div>
                <div className="text-[10px] font-normal">35 pts</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('critical')}
                className={`py-2 px-2 rounded-sm border text-center font-bold transition cursor-pointer ${
                  urgency === 'critical'
                    ? 'bg-[#B93B32] text-[#F4EAD5] border-2 border-[#172D36] shadow-md'
                    : 'bg-[#FAF5EA] text-[#172D36] border-[#172D36]/30'
                }`}
              >
                <div>CRITICAL</div>
                <div className="text-[10px] font-normal">50 pts</div>
              </button>
            </div>
          </div>

          {/* 5. EMERGENCY SITUATION DETAILS */}
          <div>
            <label className="block font-bold text-[#172D36] uppercase tracking-wider mb-1">
              EMERGENCY SITUATION & MEDICAL DETAILS
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe injuries, casualties, weather conditions, trapped civilians, or hazardous substances..."
              className="w-full bg-[#FAF5EA] border border-[#172D36]/40 rounded-sm p-2.5 text-xs font-sans-body text-[#172D36] focus:outline-none focus:border-[#B93B32]"
            />
          </div>

          {/* BUTTONS ROW */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAutoFill}
              className="bg-[#FAF5EA] hover:bg-[#F3DFB3] text-[#172D36] border border-[#172D36]/50 font-bold px-4 py-2.5 rounded-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#6AB897]" />
              <span>Auto-Fill Sector Preset</span>
            </button>

            <button
              type="submit"
              className="bg-[#B93B32] hover:bg-[#E56659] text-[#F4EAD5] font-bold px-6 py-2.5 rounded-sm flex items-center gap-2 border border-[#172D36] abyssal-shadow cursor-pointer transition transform active:scale-95 text-sm"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>TRANSMIT DISTRESS SOS ((•))</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


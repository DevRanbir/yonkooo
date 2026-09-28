"use client";
import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Navigation, Anchor, CheckCircle2, Siren, Clock, Plus, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmergencyRequest, TriageLevel, RescueStatus } from '@/lib/dendenmushi/mushi';
import { soundEngine } from '@/lib/dendenmushi/soundEngine';

interface Props {
  isSosActive: boolean;
  onToggleSos: () => void;
}

const SAMPLE_COORDINATES = [
  { coords: "34°12'N, 142°05'E", name: "Water 7 — Dock 1" },
  { coords: "12°45'S, 89°12'W", name: "Marineford Sea Gate" },
  { coords: "04°18'N, 62°50'E", name: "Alabasta River Port" },
  { coords: "41°02'S, 178°40'E", name: "Wano Country — Kuri Port" },
  { coords: "22°09'N, 115°33'W", name: "Sabaody Archipelago — Grove 41" }
];

export const EmergencyTriagePanel: React.FC<Props> = ({ isSosActive, onToggleSos }) => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([
    {
      id: 'REQ-101',
      caller: 'Shipwright Paulie',
      coordinates: "34°12'N, 142°05'E",
      locationName: 'Water 7 — Dock 1',
      incidentDescription: 'Sea King attack near ship building yard',
      startTimeMs: Date.now() - 35000,
      waitSeconds: 35,
      triageLevel: 'code_yellow',
      rescueStatus: 'idle',
      progressPercent: 0
    },
    {
      id: 'REQ-102',
      caller: 'Captain Smoker',
      coordinates: "12°45'S, 89°12'W",
      locationName: 'Marineford Sea Gate',
      incidentDescription: 'Pirate fleet approaching outer defense wall',
      startTimeMs: Date.now() - 78000,
      waitSeconds: 78,
      triageLevel: 'code_red',
      rescueStatus: 'idle',
      progressPercent: 0
    }
  ]);

  const [isSirenOn, setIsSirenOn] = useState(false);

  // 1. Dynamic Priority Aging Algorithm (Live Timer Tick)
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests(prevRequests => {
        return prevRequests.map(req => {
          if (req.rescueStatus === 'arrived') return req;

          const now = Date.now();
          const elapsedSec = Math.floor((now - req.startTimeMs) / 1000);

          // Escalate triage level based on elapsed wait time
          let level: TriageLevel = 'code_green';
          if (elapsedSec >= 75 || isSosActive) {
            level = 'code_black';
          } else if (elapsedSec >= 45) {
            level = 'code_red';
          } else if (elapsedSec >= 20) {
            level = 'code_yellow';
          }

          // If any request escalates to CODE RED or BLACK, auto start siren alert
          if ((level === 'code_red' || level === 'code_black') && !isSirenOn) {
            soundEngine.startSiren();
            setIsSirenOn(true);
          }

          return {
            ...req,
            waitSeconds: elapsedSec,
            triageLevel: level
          };
        }).sort((a, b) => b.waitSeconds - a.waitSeconds); // Sort by highest wait time
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSosActive, isSirenOn]);

  // Handle Dispatching Rescue Crew with Animated Progress
  const handleDispatchRescue = (reqId: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== reqId) return req;
      return {
        ...req,
        rescueStatus: 'dispatching',
        progressPercent: 10
      };
    }));

    // Animated progress simulation
    let progress = 10;
    const progressInterval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);

        // Arrived celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        setRequests(prev => prev.map(r => r.id === reqId ? {
          ...r,
          rescueStatus: 'arrived',
          progressPercent: 100,
          triageLevel: 'code_green'
        } : r));
      } else {
        setRequests(prev => prev.map(r => r.id === reqId ? {
          ...r,
          rescueStatus: 'en_route',
          progressPercent: progress
        } : r));
      }
    }, 1000);
  };

  const handleCreateNewAlert = () => {
    const randomLoc = SAMPLE_COORDINATES[Math.floor(Math.random() * SAMPLE_COORDINATES.length)];
    const newReq: EmergencyRequest = {
      id: `REQ-${Math.floor(Math.random() * 900 + 100)}`,
      caller: 'Merchant Ship Master',
      coordinates: randomLoc.coords,
      locationName: randomLoc.name,
      incidentDescription: 'Unexpected storm & cannon fire distress call',
      startTimeMs: Date.now(),
      waitSeconds: 0,
      triageLevel: 'code_green',
      rescueStatus: 'idle',
      progressPercent: 0
    };
    setRequests(prev => [newReq, ...prev]);
  };

  const handleToggleSiren = () => {
    if (isSirenOn) {
      soundEngine.stopSiren();
      setIsSirenOn(false);
    } else {
      soundEngine.startSiren();
      setIsSirenOn(true);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-amber-600/40 rounded-2xl p-5 space-y-5 text-slate-100 shadow-2xl">
      {/* HEADER & ALARM CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div>
          <h2 className="font-nautical font-bold text-lg text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            Grand Line Emergency Triage & Rescue Dispatch
          </h2>
          <p className="text-xs text-slate-400">Real-time priority aging algorithm & rescue crew tracker</p>
        </div>

        <div className="flex items-center gap-2">
          {/* AUDIO SIREN BUTTON */}
          <button
            onClick={handleToggleSiren}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isSirenOn
                ? 'bg-rose-600 text-white animate-bounce border-rose-400 shadow-lg shadow-rose-600/50'
                : 'bg-slate-950 text-slate-300 border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <Siren className="w-4 h-4" />
            <span>{isSirenOn ? 'STOP SIREN' : 'SIREN ALARM'}</span>
          </button>

          {/* SIMULATE NEW CALL */}
          <button
            onClick={handleCreateNewAlert}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>SIMULATE CALL</span>
          </button>
        </div>
      </div>

      {/* REQUEST QUEUE LIST */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {requests.map((req) => {
          // Triage Styling
          let badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
          let badgeText = 'CODE GREEN (LOW RISK)';
          if (req.triageLevel === 'code_yellow') {
            badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/60 animate-pulse';
            badgeText = 'CODE YELLOW (ESCALATED)';
          } else if (req.triageLevel === 'code_red') {
            badgeStyle = 'bg-rose-600/30 text-rose-300 border-rose-500/80 animate-pulse shadow-lg shadow-rose-900/50';
            badgeText = 'CODE RED (CRITICAL)';
          } else if (req.triageLevel === 'code_black') {
            badgeStyle = 'bg-red-600 text-white border-red-400 animate-bounce shadow-xl shadow-red-500/50 font-black';
            badgeText = '🚨 CODE BLACK (BUSTER CALL)';
          }

          return (
            <div
              key={req.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                req.triageLevel === 'code_black'
                  ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-950/50'
                  : 'bg-slate-950/70 border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              {/* TOP ROW: ID, MAP COORDINATES & TRIAGE BADGE */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">
                    {req.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    👤 {req.caller}
                  </span>
                </div>

                {/* TRIAGE BADGE */}
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold flex items-center gap-1 ${badgeStyle}`}>
                  <Zap className="w-3 h-3" />
                  {badgeText}
                </span>
              </div>

              {/* MAP COORDINATES & LOCATION */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-300 mb-2">
                <span className="flex items-center gap-1 text-teal-400">
                  <Navigation className="w-3.5 h-3.5" />
                  {req.coordinates}
                </span>
                <span>•</span>
                <span className="text-amber-300 truncate">
                  📍 {req.locationName}
                </span>
              </div>

              {/* INCIDENT & DYNAMIC AGING TIMER */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="truncate pr-2">{req.incidentDescription}</span>
                <span className="font-mono font-bold text-amber-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  WAIT: {req.waitSeconds}s
                </span>
              </div>

              {/* DISPATCH RESCUE CREW ACTION & ANIMATED PROGRESS BAR */}
              <div>
                {req.rescueStatus === 'idle' ? (
                  <button
                    onClick={() => handleDispatchRescue(req.id)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition transform active:scale-98"
                  >
                    <Anchor className="w-4 h-4" />
                    <span>DISPATCH RESCUE CREW</span>
                  </button>
                ) : req.rescueStatus === 'arrived' ? (
                  <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>RESCUE CREW ARRIVED ON SCENE (SECURED)</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-amber-300 font-semibold">
                      <span>🛸 DISPATCHING RESCUE FLEET...</span>
                      <span>{req.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${req.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


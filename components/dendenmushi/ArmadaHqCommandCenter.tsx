"use client";
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Navigation, Anchor, PhoneCall, Play, Pause, Download, Radio, CheckCircle2, Siren, UserCheck, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SosSession, FleetUnit, TriageLevel } from '@/lib/dendenmushi/mushi';
import { soundEngine } from '@/lib/dendenmushi/soundEngine';
import { networkSync } from '@/lib/dendenmushi/networkSync';

interface Props {
  onOpenDistressForm: () => void;
}

export const ArmadaHqCommandCenter: React.FC<Props> = ({ onOpenDistressForm }) => {
  const [sessions, setSessions] = useState<SosSession[]>([]);
  const [fleet, setFleet] = useState<FleetUnit[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [incomingSession, setIncomingSession] = useState<SosSession | null>(null);
  const [operatorMsg, setOperatorMsg] = useState('');
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [mapZoom, setMapZoom] = useState<'WORLD' | 'SEA' | 'ISLAND' | 'INCIDENT'>('WORLD');

  // Load active sessions and fleet from network sync
  useEffect(() => {
    const loadedSessions = networkSync.getActiveSessions();
    const loadedFleet = networkSync.getFleetUnits();

    if (loadedSessions.length === 0) {
      const defaultSos: SosSession = {
        sessionId: 'SOS-7F3A91',
        callerId: 'CALLER-82A1',
        callerRole: 'Civilian',
        status: 'CONNECTING',
        createdAt: new Date().toLocaleTimeString(),
        locationName: 'Water 7 — Harbor District',
        coordinates: "34°12'N, 142°05'E",
        incidentType: 'Ship Attack & 2 Injured',
        injuredCount: 2,
        threatActive: true,
        severity: 'code_red',
        channel: '07',
        recordingEvents: [
          { timestamp: '15:42:07', sender: 'SYSTEM', text: 'SOS EMERGENCY SIGNAL INITIATED' },
          { timestamp: '15:42:09', sender: 'SYSTEM', text: 'HQ CONNECTION ESTABLISHED' },
          { timestamp: '15:42:14', sender: 'CALLER', text: "I'm near the harbor. Two people are injured." },
          { timestamp: '15:42:31', sender: 'SYSTEM', text: 'SEVERITY -> CODE RED' }
        ]
      };
      setSessions([defaultSos]);
      setActiveSessionId(defaultSos.sessionId);
    } else {
      setSessions(loadedSessions);
      setActiveSessionId(loadedSessions[0].sessionId);
    }

    setFleet(loadedFleet);
  }, []);

  // Listen for real-time network events from `/distress` or secondary devices
  useEffect(() => {
    const unsubscribe = networkSync.subscribe((event) => {
      if (event.type === 'NEW_SOS_SESSION') {
        const newSos: SosSession = event.payload;
        setSessions(prev => [newSos, ...prev]);
        setIncomingSession(newSos);
        soundEngine.startSiren();
      }

      if (event.type === 'UPDATE_TRANSCRIPT') {
        const updatedSos: SosSession = event.payload;
        setSessions(prev => prev.map(s => s.sessionId === updatedSos.sessionId ? updatedSos : s));
      }

      if (event.type === 'END_SESSION') {
        setSessions(prev => prev.map(s => s.sessionId === event.payload.sessionId ? { ...s, status: 'RESOLVED' } : s));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const activeSession = sessions.find(s => s.sessionId === activeSessionId) || sessions[0];

  const handleAnswerIncomingCall = (sessionToAnswer: SosSession) => {
    soundEngine.stopSiren();
    soundEngine.playGachal();
    setIncomingSession(null);
    setActiveSessionId(sessionToAnswer.sessionId);

    const updated = sessions.map(s => s.sessionId === sessionToAnswer.sessionId ? { ...s, status: 'CONNECTED' as const } : s);
    setSessions(updated);
    networkSync.saveActiveSessions(updated);
    networkSync.broadcast('HQ_ANSWER_CALL', { sessionId: sessionToAnswer.sessionId });
  };

  const handleOperatorSpeak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorMsg.trim() || !activeSession) return;

    soundEngine.playAlertTone();
    const text = operatorMsg.trim();
    setOperatorMsg('');

    const updatedEvents = [
      ...activeSession.recordingEvents,
      { timestamp: new Date().toLocaleTimeString(), sender: 'HQ OPERATOR', text }
    ];

    const updatedSession = { ...activeSession, recordingEvents: updatedEvents };
    setSessions(prev => prev.map(s => s.sessionId === activeSession.sessionId ? updatedSession : s));
    networkSync.broadcast('HQ_OPERATOR_MESSAGE', { sessionId: activeSession.sessionId, text });
  };

  const handleDispatchFleetUnit = (fleetId: string) => {
    soundEngine.playAlertTone();

    const updatedFleet = fleet.map(unit => {
      if (unit.id !== fleetId) return unit;
      return {
        ...unit,
        status: 'EN_ROUTE' as const,
        assignedSessionId: activeSession?.sessionId
      };
    });

    setFleet(updatedFleet);
    networkSync.saveFleetUnits(updatedFleet);

    if (activeSession) {
      const updatedEvents = [
        ...activeSession.recordingEvents,
        { timestamp: new Date().toLocaleTimeString(), sender: 'SYSTEM', text: `DISPATCH AUTHORIZED: Unit ${fleetId} deployed` }
      ];
      const updatedSession = { ...activeSession, status: 'DISPATCHED' as const, assignedFleetId: fleetId, recordingEvents: updatedEvents };
      setSessions(prev => prev.map(s => s.sessionId === activeSession.sessionId ? updatedSession : s));
    }

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 🚨 INCOMING SOS POPUP MODAL */}
      {incomingSession && (
        <div className="fixed inset-0 z-50 bg-[#020B12]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D2B3D] border-2 border-[#B93B32] p-6 rounded-sm text-[#F4EAD5] max-w-md w-full abyssal-shadow-lg text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#B93B32] text-[#F4EAD5] flex items-center justify-center font-bold text-3xl mx-auto animate-bounce">
              🐌
            </div>
            <h3 className="font-serif-heading font-black text-xl text-[#B93B32] uppercase tracking-wider">
              🚨 INCOMING DEN DEN SOS 🚨
            </h3>
            <div className="bg-[#071926] p-3 rounded-sm border border-[#E8BD61]/30 text-xs font-mono-signal text-[#E8BD61] space-y-1">
              <div>CHANNEL: {incomingSession.channel}</div>
              <div>CALLER: {incomingSession.callerId}</div>
              <div>LOCATION: {incomingSession.locationName}</div>
              <div>SEVERITY: {incomingSession.severity.toUpperCase()}</div>
            </div>
            <button
              onClick={() => handleAnswerIncomingCall(incomingSession)}
              className="w-full bg-[#6AB897] hover:bg-[#77B7BD] text-[#071926] font-mono-signal font-bold py-3 px-4 rounded-sm text-sm border border-[#6AB897] abyssal-shadow cursor-pointer transition transform active:scale-95"
            >
              📞 ANSWER DEN DEN MUSHI
            </button>
          </div>
        </div>
      )}

      {/* TOP COMMAND CENTER HEADER */}
      <div className="bg-[#0D2B3D] border border-[#E8BD61]/40 p-4 rounded-sm abyssal-shadow flex flex-wrap items-center justify-between gap-4 font-mono-signal">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#E8BD61] text-[#071926] flex items-center justify-center font-bold text-xl border border-[#F0C65D]">
            🏴
          </div>
          <div>
            <h2 className="font-serif-heading font-black text-lg text-[#E8BD61] tracking-wide">
              CHOPPER'S ARMADA — GRAND LINE EMERGENCY COMMAND
            </h2>
            <p className="text-xs text-[#A8BBC0]">
              NETWORK: <span className="text-[#6AB897]">ONLINE</span> • ACTIVE CHANNELS: <span className="text-[#E8BD61]">17 ONLINE</span>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDistressForm}
          className="bg-[#B93B32] hover:bg-[#E56659] text-[#F4EAD5] font-bold px-4 py-2 rounded-sm text-xs flex items-center gap-2 border border-[#E56659] abyssal-shadow cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>TRANSMIT DISTRESS SOS</span>
        </button>
      </div>

      {/* 4-QUADRANT COMMAND CENTER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* QUADRANT 1: LEFT PANEL — ACTIVE SOS QUEUE */}
        <div className="lg:col-span-3 bg-[#0D2B3D] border border-[#E8BD61]/40 p-4 rounded-sm abyssal-shadow space-y-4">
          <h3 className="font-serif-heading font-bold text-sm text-[#E8BD61] border-b border-[#E8BD61]/20 pb-2 flex items-center justify-between">
            <span>ACTIVE SOS INCIDENTS</span>
            <span className="text-xs font-mono-signal text-[#6AB897]">({sessions.length})</span>
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 font-mono-signal text-xs">
            {sessions.map((s) => (
              <div
                key={s.sessionId}
                onClick={() => setActiveSessionId(s.sessionId)}
                className={`p-3 rounded-sm border cursor-pointer transition ${
                  activeSessionId === s.sessionId
                    ? 'bg-[#E8BD61]/20 border-[#E8BD61] text-[#E8BD61]'
                    : 'bg-[#071926] border-slate-800 text-[#F4EAD5] hover:border-[#E8BD61]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#E8BD61]">{s.sessionId}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
                    s.severity === 'code_red' ? 'bg-[#B93B32] text-white animate-pulse' : 'bg-[#6AB897] text-[#071926]'
                  }`}>
                    {s.severity.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-[#A8BBC0] truncate">📍 {s.locationName}</div>
                <div className="text-[10px] text-[#6AB897] mt-1">STATUS: {s.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* QUADRANT 2: CENTER PANEL — 3D GRAND LINE NAV MAP */}
        <div className="lg:col-span-6 bg-[#0D2B3D] border border-[#E8BD61]/40 p-4 rounded-sm abyssal-shadow space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E8BD61]/20 pb-2 font-mono-signal text-xs">
            <span className="font-serif-heading font-bold text-sm text-[#E8BD61] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#6AB897]" />
              GRAND LINE EMERGENCY MAP
            </span>

            <div className="flex items-center gap-1 bg-[#071926] p-1 rounded-sm border border-slate-800 text-[10px]">
              {(['WORLD', 'SEA', 'ISLAND', 'INCIDENT'] as const).map(z => (
                <button
                  key={z}
                  onClick={() => setMapZoom(z)}
                  className={`px-2 py-0.5 rounded-sm font-bold transition cursor-pointer ${
                    mapZoom === z ? 'bg-[#E8BD61] text-[#071926]' : 'text-[#A8BBC0]'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* MAP CANVAS STYLED CONTAINER */}
          <div className="flex-1 min-h-[320px] bg-[#071926] border border-[#E8BD61]/30 rounded-sm relative overflow-hidden p-4 flex flex-col justify-between">
            {/* Compass Rose Backdrop */}
            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center text-9xl">
              ⚓
            </div>

            {/* GRAND LINE ISLAND NODES */}
            <div className="grid grid-cols-3 gap-4 relative z-10 text-xs font-mono-signal">
              <div className="p-2 bg-[#0D2B3D]/80 border border-[#6AB897]/50 rounded-sm">
                <div className="font-bold text-[#6AB897]">🏝 DRUM ISLAND</div>
                <div className="text-[10px] text-[#A8BBC0]">Paradise Sector 4</div>
              </div>

              <div className="p-2 bg-[#0D2B3D]/80 border border-[#E8BD61]/50 rounded-sm shadow-lg">
                <div className="font-bold text-[#E8BD61]">🏝 WATER 7</div>
                <div className="text-[10px] text-[#6AB897]">📍 ACTIVE SOS (2.4 km)</div>
              </div>

              <div className="p-2 bg-[#0D2B3D]/80 border border-[#6AB897]/50 rounded-sm">
                <div className="font-bold text-[#6AB897]">🌸 WANO COUNTRY</div>
                <div className="text-[10px] text-[#A8BBC0]">New World Sector 7</div>
              </div>
            </div>

            {/* LIVE RESCUE ROUTE ANIMATION */}
            <div className="my-auto relative z-10 p-3 bg-[#0D2B3D]/90 border border-[#E8BD61]/40 rounded-sm">
              <div className="flex justify-between items-center text-xs font-mono-signal mb-1">
                <span className="text-[#E8BD61] font-bold">🚢 FLEET ROUTE: ARMADA BASE ➔ WATER 7</span>
                <span className="text-[#6AB897] font-mono font-bold">ETA: 6 MIN</span>
              </div>
              <div className="w-full h-2 bg-[#071926] rounded-full overflow-hidden border border-[#E8BD61]/30">
                <div className="h-full bg-gradient-to-r from-[#E8BD61] to-[#6AB897] w-[65%] rounded-full animate-pulse" />
              </div>
            </div>

            {/* MAP FOOTER COORDINATES */}
            <div className="relative z-10 flex justify-between text-[11px] font-mono-signal text-[#A8BBC0] border-t border-slate-800 pt-2">
              <span>TARGET: {activeSession ? activeSession.locationName : 'WATER 7'}</span>
              <span>COORDS: {activeSession ? activeSession.coordinates : "34°12'N, 142°05'E"}</span>
            </div>
          </div>
        </div>

        {/* QUADRANT 3: RIGHT PANEL — ARMADA FLEET AVAILABILITY ENGINE */}
        <div className="lg:col-span-3 bg-[#0D2B3D] border border-[#E8BD61]/40 p-4 rounded-sm abyssal-shadow space-y-4 font-mono-signal text-xs">
          <h3 className="font-serif-heading font-bold text-sm text-[#E8BD61] border-b border-[#E8BD61]/20 pb-2">
            ARMADA FLEET AVAILABILITY
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {fleet.map((unit) => (
              <div key={unit.id} className="p-3 bg-[#071926] border border-slate-800 rounded-sm space-y-2">
                <div className="flex justify-between font-bold text-[#F4EAD5]">
                  <span className="truncate pr-1">{unit.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    unit.status === 'AVAILABLE' ? 'bg-[#6AB897] text-[#071926]' : 'bg-[#B93B32] text-white'
                  }`}>
                    {unit.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#A8BBC0] flex justify-between">
                  <span>Speed: {unit.speedKnots} kn</span>
                  <span>Dist: {unit.distanceKm} km</span>
                </div>
                {unit.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => handleDispatchFleetUnit(unit.id)}
                    className="w-full bg-[#6AB897] hover:bg-[#77B7BD] text-[#071926] font-bold py-1.5 px-2 rounded-sm transition cursor-pointer text-center"
                  >
                    DISPATCH UNIT
                  </button>
                ) : (
                  <div className="text-[10px] text-[#6AB897] font-bold text-center bg-[#0D2B3D] py-1 border border-[#6AB897]/30">
                    EN ROUTE TO TARGET
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUADRANT 4: BOTTOM PANEL — LIVE DEN DEN FEED & TAPE RECORDING REPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LIVE DEN DEN EVENT STREAM */}
        <div className="lg:col-span-6 bg-[#0D2B3D] border border-[#E8BD61]/40 p-4 rounded-sm abyssal-shadow space-y-3 font-mono-signal text-xs">
          <h3 className="font-serif-heading font-bold text-sm text-[#E8BD61] border-b border-[#E8BD61]/20 pb-2 flex items-center justify-between">
            <span>LIVE DEN DEN EVENT STREAM</span>
            <span className="text-[#6AB897] font-bold animate-pulse">● FEED ONLINE</span>
          </h3>

          <div className="max-h-[180px] overflow-y-auto space-y-2 bg-[#071926] p-3 rounded-sm border border-slate-800 text-[11px]">
            {activeSession ? (
              activeSession.recordingEvents.map((evt, idx) => (
                <div key={idx} className="flex gap-2 text-[#A8BBC0]">
                  <span className="text-[#E8BD61] shrink-0">{evt.timestamp}</span>
                  <span className="font-bold text-[#6AB897] shrink-0">[{evt.sender}]</span>
                  <span className="text-[#F4EAD5]">{evt.text}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500">No active events logged.</div>
            )}
          </div>

          {/* HQ OPERATOR INTERVENTION INPUT */}
          <form onSubmit={handleOperatorSpeak} className="flex gap-2 pt-1">
            <input
              type="text"
              value={operatorMsg}
              onChange={(e) => setOperatorMsg(e.target.value)}
              placeholder="Operator voice override (speak to caller)..."
              className="flex-1 bg-[#071926] text-[#F4EAD5] border border-[#E8BD61]/40 rounded-sm px-3 py-2 text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#E8BD61] hover:bg-[#F0C65D] text-[#071926] font-bold px-4 py-2 rounded-sm transition cursor-pointer"
            >
              TRANSMIT
            </button>
          </form>
        </div>

        {/* 📼 TAPE RECORDING REPLAY ENGINE */}
        <div className="lg:col-span-6 bg-[#0D2B3D] border border-[#E8BD61]/40 p-4 rounded-sm abyssal-shadow space-y-3 font-mono-signal text-xs">
          <div className="flex justify-between border-b border-[#E8BD61]/20 pb-2">
            <h3 className="font-serif-heading font-bold text-sm text-[#E8BD61]">
              📼 DEN DEN MUSHI AUDIO RECORDING & REPLAY
            </h3>
            <span className="text-[#B93B32] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B93B32] animate-ping" />
              00:03:42
            </span>
          </div>

          <div className="bg-[#071926] p-3 rounded-sm border border-slate-800 space-y-2">
            <div className="flex justify-between text-[11px] text-[#A8BBC0]">
              <span>🎙 CALLER AUDIO TRACK</span>
              <span className="text-[#6AB897]">16-bit 44.1kHz</span>
            </div>
            <div className="w-full h-3 bg-[#0D2B3D] rounded-sm overflow-hidden flex items-center px-1">
              {[...Array(32)].map((_, i) => (
                <div key={i} className="flex-1 mx-0.5 bg-[#E8BD61] rounded-sm" style={{ height: `${(i % 5 + 1) * 20}%` }} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlayingRecording(!isPlayingRecording)}
                className="bg-[#6AB897] hover:bg-[#77B7BD] text-[#071926] font-bold px-3 py-1.5 rounded-sm flex items-center gap-1 cursor-pointer"
              >
                {isPlayingRecording ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingRecording ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => alert("Transcript Log Downloaded!")}
                className="bg-[#071926] hover:bg-slate-800 text-[#E8BD61] border border-[#E8BD61]/40 px-3 py-1.5 rounded-sm flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Record</span>
              </button>
            </div>

            <span className="text-[10px] text-[#A8BBC0]">
              Jurisdiction Consent: Certified Emergency Record
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


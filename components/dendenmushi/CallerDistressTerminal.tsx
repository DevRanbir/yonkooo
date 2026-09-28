"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Camera,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert,
  MessageSquare,
  Palette,
  Dices,
  Box,
  Code,
  FileText,
  Radio,
  UserCheck
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  MushiConfig,
  ChatMessage,
  SosSession,
  MushiEmotionalState,
  RegionTheme,
  CharacterPresetId,
  ModelMode
} from '@/lib/dendenmushi/mushi';
import { CHARACTER_PRESETS } from '@/lib/dendenmushi/characterPresets';
import { generateRandomSeed, generateMushiFromSeed } from '@/lib/dendenmushi/seedGenerator';
import { soundEngine } from '@/lib/dendenmushi/soundEngine';
import { MushiBrain } from '@/lib/dendenmushi/aiBrain';
import { networkSync } from '@/lib/dendenmushi/networkSync';
import { faceTracker } from '@/lib/dendenmushi/faceTracker';

const DenDenMushiCanvas = dynamic(
  () => import('./DenDenMushiCanvas').then((mod) => mod.DenDenMushiCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[220px] rounded-lg flex flex-col items-center justify-center bg-[#071926] border border-[#e8bd6144] text-[#e8bd61] font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#e8bd61] border-t-transparent animate-spin" />
        <span>INITIALIZING 3D TRANSPONDER SNAIL...</span>
      </div>
    )
  }
);

const REGION_LIST: { id: RegionTheme; name: string }[] = [
  { id: 'east_blue', name: '🌊 East Blue' },
  { id: 'marine', name: '⚓ Marine Navy' },
  { id: 'pirate', name: '🏴‍☠️ Pirate Fleet' },
  { id: 'wano', name: '🌸 Wano Country' },
  { id: 'water_7', name: '🔨 Water 7' },
  { id: 'royal', name: '👑 Royal Palace' },
  { id: 'cp0', name: '🕵️ CP0 Cipher Pol' },
  { id: 'golden_buster', name: '🚨 Buster Call' }
];

const CHARACTER_BUTTONS: { id: CharacterPresetId; label: string; icon: string; defaultGlb?: boolean }[] = [
  { id: 'law', label: 'Trafalgar Law', icon: '🐯', defaultGlb: true },
  { id: 'luffy', label: 'Straw Hat Luffy', icon: '👒' },
  { id: 'buster_call', label: 'Golden Buster Call', icon: '🚨' },
  { id: 'whitebeard', label: 'Whitebeard', icon: '👑' },
  { id: 'doflamingo', label: 'Doflamingo', icon: '🦩' },
  { id: 'kizaru', label: 'Admiral Kizaru', icon: '⚡' },
  { id: 'smoker', label: 'Vice Admiral Smoker', icon: '💨' },
  { id: 'crocodile', label: 'Sir Crocodile', icon: '🐊' },
  { id: 'buggy', label: 'Buggy the Clown', icon: '🔴' },
  { id: 'franky', label: 'Franky Cyborg', icon: '🤖' }
];

interface Props {
  config: MushiConfig;
  onConfigChange?: (newConfig: MushiConfig) => void;
  onSelectRegion?: (region: RegionTheme) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenDistressForm?: () => void;
  onOpenEmbed?: () => void;
}

export const CallerDistressTerminal: React.FC<Props> = ({
  config,
  onConfigChange,
  onSelectRegion,
  isMuted = false,
  onToggleMute,
  onOpenDistressForm,
  onOpenEmbed
}) => {
  const [session, setSession] = useState<SosSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connecting' | 'connected' | 'ended'>('idle');
  const [mushiState, setMushiState] = useState<MushiEmotionalState>('idle');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [isCameraTracking, setIsCameraTracking] = useState(false);
  const [trackingCoords, setTrackingCoords] = useState<{ x: number; y: number } | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'customizer' | 'hq'>('chat');
  const [hqSessions, setHqSessions] = useState<SosSession[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiBrain = useRef<MushiBrain>(new MushiBrain(config));
  const initialInputRef = useRef('');
  const cameraPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiBrain.current.updateConfig(config);
  }, [config]);

  useEffect(() => {
    soundEngine.onVolumeUpdate = (vol) => {
      setAudioVolume(vol);
      setIsSpeaking(vol > 0.05);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setHqSessions(networkSync.getActiveSessions());
    const unsubscribe = networkSync.subscribe((event) => {
      setHqSessions(networkSync.getActiveSessions());

      if (event.type === 'HQ_ANSWER_CALL' && session && event.payload.sessionId === session.sessionId) {
        setCallStatus('connected');
        setMushiState('listening');
        soundEngine.stopPurupuru();
        soundEngine.playGachal();

        const hqMsgText = "Purupurupuru... Chopper's Armada HQ Operator receiving transmission! State your emergency, caller!";
        addMessage('mushi', hqMsgText);
        soundEngine.speak(hqMsgText, config.voice.pitch, config.voice.rate);
      }

      if (event.type === 'HQ_OPERATOR_MESSAGE' && session && event.payload.sessionId === session.sessionId) {
        addMessage('operator', event.payload.text);
        soundEngine.speak(event.payload.text, 0.9, 1.0);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [session]);

  const handleSendDistressSignal = () => {
    soundEngine.startPurupuru();
    setCallStatus('calling');
    setMushiState('connecting');

    const newSessionId = `SOS-${Math.floor(Math.random() * 899999 + 100000).toString(16).toUpperCase()}`;
    const callerId = `CALLER-${Math.floor(Math.random() * 8999 + 1000)}`;

    const newSession: SosSession = {
      sessionId: newSessionId,
      callerId,
      callerRole: 'Civilian',
      status: 'CONNECTING',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      locationName: 'Water 7 Harbor District',
      coordinates: "34°12'N, 142°05'E",
      incidentType: 'Ship Attack & Injuries',
      injuredCount: 2,
      threatActive: true,
      severity: 'code_red',
      channel: '07',
      recordingEvents: [
        { timestamp: new Date().toLocaleTimeString(), sender: 'SYSTEM', text: 'SOS EMERGENCY SIGNAL INITIATED', eventType: 'CALL_STARTED' }
      ]
    };

    setSession(newSession);

    // Save & Broadcast to HQ real-time network
    const active = networkSync.getActiveSessions();
    networkSync.saveActiveSessions([newSession, ...active]);
    networkSync.broadcast('NEW_SOS_SESSION', newSession);

    // Auto-answer simulation after 2.2 seconds if HQ is unmanned
    setTimeout(() => {
      setCallStatus('connected');
      setMushiState('listening');
      soundEngine.stopPurupuru();
      soundEngine.playGachal();

      const greeting = `Purupurupuru... Den Den Mushi emergency channel 07 connected! This is ${config.name} at Armada HQ! Identify yourself and state your emergency!`;
      addMessage('mushi', greeting);

      soundEngine.speak(greeting, config.voice.pitch, config.voice.rate);
    }, 2200);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    soundEngine.playAlertTone();
    addMessage('user', userText);
    setInputText('');
    setMushiState('listening');

    // Process through Sarvam AI Brain
    const callStateObj = { status: 'connected', isSosActive: true };
    const aiResult = await aiBrain.current.processInputAsync(userText, callStateObj as any);

    // Emotional state reaction
    if (/attack|injured|fire|help|bomb|explosion/i.test(userText)) {
      setMushiState('emergency_detected');
    } else if (/\?/i.test(userText)) {
      setMushiState('confused');
    } else {
      setMushiState('speaking');
    }

    addMessage('mushi', aiResult.response, aiResult.expression, aiResult.sosTriggered);

    // Sync transcript & audio recording event to HQ
    if (session) {
      const updatedEvents = [
        ...session.recordingEvents,
        { timestamp: new Date().toLocaleTimeString(), sender: 'CALLER', text: userText },
        { timestamp: new Date().toLocaleTimeString(), sender: config.name, text: aiResult.response }
      ];
      const updatedSession = { ...session, recordingEvents: updatedEvents };
      setSession(updatedSession);
      networkSync.broadcast('UPDATE_TRANSCRIPT', updatedSession);
    }

    soundEngine.speak(
      aiResult.response,
      config.voice.pitch,
      config.voice.rate,
      () => setMushiState('speaking'),
      () => setMushiState('listening')
    );
  };

  const addMessage = (sender: 'user' | 'mushi' | 'operator', text: string, expression?: any, sosAlert?: boolean) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp,
      expression,
      sosAlert,
      mushiName: config.name
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleHangUp = () => {
    soundEngine.stopPurupuru();
    soundEngine.stopSiren();
    soundEngine.stopSpeaking();
    soundEngine.stopListening();
    soundEngine.playGachal();
    setCallStatus('ended');
    setMushiState('idle');

    if (session) {
      networkSync.broadcast('END_SESSION', { sessionId: session.sessionId });
    }
  };

  useEffect(() => {
    return () => {
      faceTracker.stop();
    };
  }, []);

  const handleToggleMic = () => {
    if (isListening) {
      soundEngine.stopListening();
      setIsListening(false);
    } else {
      initialInputRef.current = inputText.trim();
      setIsListening(true);
      soundEngine.startListening(
        (transcript) => {
          const base = initialInputRef.current;
          setInputText(base ? `${base} ${transcript}` : transcript);
        },
        (err) => {
          console.warn('Speech STT Error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const toggleCameraTracking = async () => {
    if (!isCameraTracking) {
      const started = await faceTracker.start((coords, videoEl) => {
        setTrackingCoords({ x: coords.x, y: coords.y });
        setIsFaceDetected(coords.isDetected);

        if (videoEl && cameraPreviewRef.current && !cameraPreviewRef.current.contains(videoEl)) {
          cameraPreviewRef.current.innerHTML = '';
          videoEl.className = 'w-full h-full object-cover transform -scale-x-100 rounded-sm';
          cameraPreviewRef.current.appendChild(videoEl);
        }
      });

      if (started) {
        setIsCameraTracking(true);
      } else {
        alert("Camera access denied or unavailable. Den Den Mushi will follow your mouse pointer instead!");
      }
    } else {
      faceTracker.stop();
      setIsCameraTracking(false);
      setTrackingCoords(null);
      setIsFaceDetected(false);
      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.innerHTML = '';
      }
    }
  };

  const handleRandomize = () => {
    if (onConfigChange) {
      const newSeed = generateRandomSeed();
      const newConfig = generateMushiFromSeed(newSeed);
      onConfigChange(newConfig);
    }
  };

  const handleSelectPreset = (presetId: CharacterPresetId, useGlb?: boolean) => {
    if (onConfigChange) {
      const preset = CHARACTER_PRESETS[presetId];
      if (preset) {
        onConfigChange({
          ...preset,
          seed: config.seed,
          modelMode: useGlb ? 'glb_law' : preset.modelMode || 'procedural'
        });
      }
    }
  };

  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch min-h-0 select-none">
      {/* 🐌 LEFT COLUMN: Interactive 3D Den Den Mushi Viewport */}
      <div className="md:col-span-6 lg:col-span-7 h-full flex flex-col relative rounded-md overflow-hidden border border-[#e8bd6144] bg-[#071926]/90 backdrop-blur-md shadow-2xl min-h-0">
        {/* Floating Top HUD Strip */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20 gap-2">
          {/* Status & Channel */}
          <div className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded bg-[#071926]/90 border border-[#e8bd6144] text-[10px] font-mono text-[#f4ead5] shadow-md backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#6ab897] animate-pulse" />
            <span className="font-bold text-[#e8bd61]">FREQ 07</span>
            <span className="text-[#a8bbc0] hidden sm:inline">· {session ? session.sessionId : 'STANDBY'}</span>
          </div>

          {/* Top Quick Actions */}
          <div className="pointer-events-auto flex items-center gap-1">
            {/* Region Selector Dropdown */}
            {onSelectRegion && (
              <select
                value={config.region}
                onChange={(e) => onSelectRegion(e.target.value as RegionTheme)}
                className="bg-[#071926]/90 border border-[#e8bd6144] text-[#e8bd61] rounded px-1.5 py-1 text-[10px] font-mono font-bold cursor-pointer focus:outline-none"
                aria-label="Select Region"
              >
                {REGION_LIST.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#071926] text-[#f4ead5]">
                    {r.name}
                  </option>
                ))}
              </select>
            )}

            {/* Camera Face Tracking Toggle */}
            <button
              type="button"
              onClick={toggleCameraTracking}
              className={`p-1.5 rounded border text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                isCameraTracking
                  ? 'bg-[#6ab897] text-[#071926] border-[#6ab897] font-bold'
                  : 'bg-[#071926]/90 text-[#a8bbc0] border-[#e8bd6144] hover:text-[#f4ead5]'
              }`}
              title={isCameraTracking ? 'Face Tracking Active' : 'Switch to Camera Face Tracking'}
            >
              <Camera size={12} />
              <span className="hidden sm:inline">{isCameraTracking ? 'FACE ON' : 'POINTER'}</span>
            </button>

            {/* Sound Mute Toggle */}
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                className="p-1.5 rounded border border-[#e8bd6144] bg-[#071926]/90 text-[#e8bd61] hover:text-white transition cursor-pointer"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="flex-1 w-full h-full min-h-0 relative">
          <DenDenMushiCanvas
            config={config}
            isRinging={callStatus === 'calling'}
            isSpeaking={isSpeaking}
            audioVolume={audioVolume}
            trackingCoords={trackingCoords}
          />
        </div>

        {/* Floating Bottom HUD Strip */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20 gap-2">
          {/* Emotion Badge */}
          <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded bg-[#071926]/90 border border-[#e8bd6144] text-[10px] font-mono text-[#e8bd61] shadow-md backdrop-blur-xs">
            <span className="text-[#a8bbc0]">EMOTION:</span>
            <span className="font-bold text-[#6ab897] uppercase">{mushiState.replace('_', ' ')}</span>
          </div>

          {/* Primary SOS Action Button */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {session && (
              <div className="bg-[#b93b32] text-white px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>REC LIVE</span>
              </div>
            )}

            {callStatus === 'idle' || callStatus === 'ended' ? (
              <button
                type="button"
                onClick={handleSendDistressSignal}
                className="bg-[#bd3c32] hover:bg-[#932d27] text-[#fff7df] font-mono font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1.5 border border-[#e56659] cursor-pointer shadow-lg animate-pulse transition"
              >
                <Phone size={12} />
                <span>DIAL DISTRESS CALL</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleHangUp}
                className="bg-[#bd3c32] hover:bg-[#932d27] text-[#fff7df] font-mono font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1.5 border border-[#e56659] cursor-pointer shadow-lg transition"
              >
                <PhoneOff size={12} />
                <span>END CALL</span>
              </button>
            )}
          </div>
        </div>

        {/* Face Tracking Camera Preview Mini-PIP */}
        {isCameraTracking && (
          <div className="absolute top-10 right-2 bg-[#071926]/95 border border-[#6ab897] p-1 rounded z-30 flex flex-col items-center shadow-xl">
            <div ref={cameraPreviewRef} className="w-20 h-14 bg-black rounded overflow-hidden border border-[#6ab897]/50 relative">
              <div className={`absolute inset-0 border ${isFaceDetected ? 'border-[#6ab897] animate-pulse' : 'border-[#e8bd61]/40'} m-1 rounded pointer-events-none flex items-center justify-center`}>
                <div className={`w-1 h-1 rounded-full ${isFaceDetected ? 'bg-[#6ab897]' : 'bg-[#e8bd61]'}`} />
              </div>
            </div>
            <span className="text-[8px] font-mono font-bold mt-0.5 text-[#6ab897]">
              {isFaceDetected ? '● LOCKED' : 'SCANNING'}
            </span>
          </div>
        )}
      </div>

      {/* 🎛️ RIGHT COLUMN: Tabbed Console (Chat | Customizer | Fleet HQ) */}
      <div className="md:col-span-6 lg:col-span-5 h-full flex flex-col rounded-md overflow-hidden border border-[#e8bd6144] bg-[#071926]/90 backdrop-blur-md shadow-2xl min-h-0">
        {/* Tab Switcher Header */}
        <div className="flex items-center gap-1 p-1 bg-[#04121b]/80 border-b border-[#e8bd6133] shrink-0 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#e8bd61] text-[#071926]'
                : 'text-[#a8bbc0] hover:text-[#f4ead5]'
            }`}
          >
            <MessageSquare size={11} />
            <span>Voice &amp; Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customizer')}
            className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'customizer'
                ? 'bg-[#e8bd61] text-[#071926]'
                : 'text-[#a8bbc0] hover:text-[#f4ead5]'
            }`}
          >
            <Palette size={11} />
            <span>Snail Traits</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hq')}
            className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'hq'
                ? 'bg-[#6ab897] text-[#071926]'
                : 'text-[#a8bbc0] hover:text-[#f4ead5]'
            }`}
          >
            <ShieldAlert size={11} />
            <span>HQ Radar</span>
          </button>
        </div>

        {/* TAB 1: Live Voice & Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 p-2.5">
            {/* Transcript Feed */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center border border-dashed border-[#e8bd6133] rounded bg-[#04121b]/50 text-[#a8bbc0] space-y-2">
                  <span className="text-2xl">🐌</span>
                  <p className="font-mono text-[11px]">
                    Channel 07 Standby. Click <span className="text-[#e56659] font-bold">&quot;DIAL DISTRESS CALL&quot;</span> or type below to transmit distress signals!
                  </p>
                  <p className="text-[10px] text-[#6ab897]">
                    Speech synthesis &amp; real-time voice AI active.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 mb-0.5 text-[9px] font-mono text-[#a8bbc0]">
                      <span>
                        {msg.sender === 'user'
                          ? '👤 YOU'
                          : msg.sender === 'operator'
                          ? '🏴 FLEET OPERATOR'
                          : `🐌 ${msg.mushiName || config.name}`}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[88%] px-2.5 py-1.5 rounded text-[11px] leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#e8bd61] text-[#071926] font-semibold'
                          : msg.sender === 'operator'
                          ? 'bg-[#6ab897] text-[#071926] font-semibold'
                          : 'bg-[#0d2b3d] border border-[#e8bd6144] text-[#f4ead5]'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Audio Wave Indicator when Snail Speaks */}
            {isSpeaking && (
              <div className="py-1 px-2 mb-1 bg-[#6ab897]/20 border border-[#6ab897]/50 rounded flex items-center justify-between text-[10px] font-mono text-[#6ab897] animate-pulse">
                <span>🔊 SYNTHESIZING VOICE PLAYBACK...</span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-2 bg-[#6ab897] animate-bounce" />
                  <span className="w-1 h-3 bg-[#6ab897] animate-bounce delay-75" />
                  <span className="w-1 h-1 bg-[#6ab897] animate-bounce delay-150" />
                </span>
              </div>
            )}

            {/* Chat Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) handleSendMessage(inputText);
              }}
              className="flex items-center gap-1.5 pt-2 border-t border-[#e8bd6133] shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening dictation...' : 'Type distress message...'}
                className="flex-1 bg-[#04121b] text-[#f4ead5] placeholder-[#a8bbc0] border border-[#e8bd6144] rounded px-2.5 py-1.5 text-xs font-sans focus:outline-none focus:border-[#e8bd61]"
              />
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-1.5 rounded border transition cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-[#b93b32] text-white animate-pulse border-[#e56659]'
                    : 'bg-[#04121b] text-[#e8bd61] border-[#e8bd6144] hover:bg-[#0d2b3d]'
                }`}
                title={isListening ? 'Stop Mic Dictation' : 'Speak via Microphone'}
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-[#e8bd61] hover:bg-[#f0c65d] disabled:opacity-40 text-[#071926] font-mono font-bold px-3 py-1.5 rounded text-xs transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Snail Trait Customizer */}
        {activeTab === 'customizer' && (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 min-h-0 text-xs font-mono">
            {/* Header + Randomizer */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e8bd6133]">
              <div>
                <span className="font-bold text-[#e8bd61] flex items-center gap-1 text-[11px]">
                  <Sparkles size={11} className="text-[#6ab897]" />
                  TRAIT CUSTOMIZER
                </span>
                <span className="text-[10px] text-[#a8bbc0]">Live 3D snail updates</span>
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                className="bg-[#e8bd61] hover:bg-[#f0c65d] text-[#071926] font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer transition"
              >
                <Dices size={11} />
                <span>RANDOMIZE</span>
              </button>
            </div>

            {/* 3D Model Mode Toggle */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#e8bd61] flex items-center gap-1 uppercase">
                <Box size={10} /> 3D Model Engine
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onConfigChange && onConfigChange({ ...config, modelMode: 'procedural' })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-bold cursor-pointer transition ${
                    config.modelMode === 'procedural'
                      ? 'bg-[#e8bd61] text-[#071926] border-[#e8bd61]'
                      : 'bg-[#04121b] text-[#a8bbc0] border-[#e8bd6133] hover:text-[#f4ead5]'
                  }`}
                >
                  🎨 Procedural
                </button>
                <button
                  type="button"
                  onClick={() => onConfigChange && onConfigChange({ ...config, modelMode: 'glb_law' })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-bold cursor-pointer transition ${
                    config.modelMode === 'glb_law'
                      ? 'bg-[#6ab897] text-[#071926] border-[#6ab897]'
                      : 'bg-[#04121b] text-[#a8bbc0] border-[#e8bd6133] hover:text-[#f4ead5]'
                  }`}
                >
                  📦 Law 3D GLB
                </button>
                <button
                  type="button"
                  onClick={() => onConfigChange && onConfigChange({ ...config, modelMode: 'glb_law_hd' })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-bold cursor-pointer transition ${
                    config.modelMode === 'glb_law_hd'
                      ? 'bg-[#a855f7] text-white border-[#a855f7]'
                      : 'bg-[#04121b] text-[#a8bbc0] border-[#e8bd6133] hover:text-[#f4ead5]'
                  }`}
                >
                  💎 Law HD
                </button>
              </div>
            </div>

            {/* Official Character Presets */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#e8bd61] flex items-center gap-1 uppercase">
                <UserCheck size={10} /> Character Archetypes
              </label>
              <div className="grid grid-cols-2 gap-1 max-h-[140px] overflow-y-auto pr-0.5">
                {CHARACTER_BUTTONS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleSelectPreset(char.id, char.defaultGlb)}
                    className="p-1.5 rounded bg-[#04121b] hover:bg-[#0d2b3d] border border-[#e8bd6133] hover:border-[#e8bd61] flex items-center gap-1 text-[10px] text-left transition cursor-pointer text-[#f4ead5]"
                  >
                    <span>{char.icon}</span>
                    <span className="truncate">{char.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Color Swatches */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#e8bd61] flex items-center gap-1 uppercase">
                <Palette size={10} /> Shell &amp; Body Color
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#a8bbc0]">Shell:</span>
                  <input
                    type="color"
                    value={config.shell.primaryColor || '#e8bd61'}
                    onChange={(e) =>
                      onConfigChange &&
                      onConfigChange({
                        ...config,
                        shell: { ...config.shell, primaryColor: e.target.value }
                      })
                    }
                    className="w-6 h-6 rounded border border-[#e8bd6144] cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#a8bbc0]">Skin:</span>
                  <input
                    type="color"
                    value={config.body.bodyColor || '#6ab897'}
                    onChange={(e) =>
                      onConfigChange &&
                      onConfigChange({
                        ...config,
                        body: { ...config.body, bodyColor: e.target.value }
                      })
                    }
                    className="w-6 h-6 rounded border border-[#e8bd6144] cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Armada HQ Radar */}
        {activeTab === 'hq' && (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0 text-xs font-mono">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e8bd6133]">
              <span className="font-bold text-[#6ab897] flex items-center gap-1 text-[11px]">
                <ShieldAlert size={11} />
                FLEET EMERGENCY RADAR
              </span>
              <span className="text-[10px] text-[#6ab897] font-bold">ONLINE</span>
            </div>

            <p className="text-[10px] text-[#a8bbc0] leading-relaxed">
              Monitoring all Grand Line distress frequencies. Incoming calls automatically populate the triage queue.
            </p>

            {/* Active Sessions List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#e8bd61]">ACTIVE SIGNALS ({hqSessions.length}):</span>
              {hqSessions.length === 0 ? (
                <div className="p-2 text-center border border-dashed border-[#e8bd6133] rounded text-[#a8bbc0] text-[10px]">
                  No active distress calls. Channel 07 clear.
                </div>
              ) : (
                hqSessions.slice(0, 3).map((s) => (
                  <div key={s.sessionId} className="p-2 rounded bg-[#04121b] border border-[#e8bd6133] space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#e8bd61]">{s.sessionId}</span>
                      <span className="text-[#e56659] font-bold">{s.severity.toUpperCase()}</span>
                    </div>
                    <div className="text-[#a8bbc0]">{s.locationName} · {s.incidentType}</div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Triggers */}
            <div className="pt-2 flex flex-col gap-1.5">
              {onOpenDistressForm && (
                <button
                  type="button"
                  onClick={onOpenDistressForm}
                  className="w-full bg-[#bd3c32] hover:bg-[#932d27] text-white font-bold py-1.5 px-2 rounded text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileText size={11} />
                  <span>TRANSMIT SOS LOG FORM</span>
                </button>
              )}

              {onOpenEmbed && (
                <button
                  type="button"
                  onClick={onOpenEmbed}
                  className="w-full bg-[#04121b] hover:bg-[#0d2b3d] text-[#e8bd61] border border-[#e8bd6144] font-bold py-1.5 px-2 rounded text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Code size={11} />
                  <span>GET EMBED / API CODE</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

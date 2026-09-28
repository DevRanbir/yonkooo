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
  UserCheck,
  Trash2
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
import {
  subscribeFirebaseChat,
  sendFirebaseChatMessage,
  clearFirebaseChat,
  createFirebaseDistressCall,
  subscribeFirebaseDispatches
} from '@/lib/dendenmushi/firebaseChat';
import { Emergency } from '@/lib/types';

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
  const [liveDispatches, setLiveDispatches] = useState<Emergency[]>([]);

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

  // 1. Subscribe to Firebase 3D Chat in real-time
  useEffect(() => {
    const unsubChat = subscribeFirebaseChat((firebaseMsgs) => {
      setMessages(firebaseMsgs);
    });

    // 2. Subscribe to Firebase Dispatches for HQ Radar
    const unsubDispatches = subscribeFirebaseDispatches((dispatches) => {
      setLiveDispatches(dispatches);
    });

    return () => {
      unsubChat();
      unsubDispatches();
    };
  }, []);

  // 3. Network Sync Listener for multi-window communication
  useEffect(() => {
    const unsubscribe = networkSync.subscribe(async (event) => {
      if (event.type === 'HQ_ANSWER_CALL' && session && event.payload.sessionId === session.sessionId) {
        setCallStatus('connected');
        setMushiState('listening');
        soundEngine.stopPurupuru();
        soundEngine.playGachal();

        const hqMsgText = "Purupurupuru... Chopper's Armada HQ Operator receiving transmission! State your emergency, caller!";
        await sendFirebaseChatMessage({
          sender: 'mushi',
          text: hqMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mushiName: config.name
        }).catch(console.error);
        soundEngine.speak(hqMsgText, config.voice.pitch, config.voice.rate);
      }

      if (event.type === 'HQ_OPERATOR_MESSAGE' && session && event.payload.sessionId === session.sessionId) {
        await sendFirebaseChatMessage({
          sender: 'operator',
          text: event.payload.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }).catch(console.error);
        soundEngine.speak(event.payload.text, 0.9, 1.0);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [session, config]);

  const handleSendDistressSignal = async () => {
    soundEngine.startPurupuru();
    setCallStatus('calling');
    setMushiState('connecting');

    const newSessionId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const callerId = `CALLER-${config.name}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const regionToIslandMap: Record<string, string> = {
      east_blue: 'Loguetown',
      marine: 'Marineford',
      pirate: 'Sabaody Archipelago',
      wano: 'Wano Country',
      water_7: 'Water 7',
      royal: 'Alabasta',
      cp0: 'Enies Lobby',
      golden_buster: 'Buster Call Sector'
    };

    const targetIsland = regionToIslandMap[config.region] || 'Water 7';

    // 1. Write distress record to Firebase Realtime Database
    await createFirebaseDistressCall({
      id: newSessionId,
      type: 'Den Den Mushi Distress Call',
      island: targetIsland,
      sector: 'Harbor District - Channel 07',
      severity: 'critical',
      description: `Emergency transponder transmission initiated via Den Den Mushi (${config.name}). Channel 07 live audio link.`,
      callerName: callerId,
      denDenFrequency: '108.4 MHz'
    }).catch(console.error);

    // 2. Post alert message to Firebase Chat
    await sendFirebaseChatMessage({
      sender: 'system',
      text: `🚨 SOS EMERGENCY SIGNAL INITIATED ON ${targetIsland.toUpperCase()} · FREQ 07 LIVE`,
      timestamp,
      sosAlert: true
    }).catch(console.error);

    const newSession: SosSession = {
      sessionId: newSessionId,
      callerId,
      callerRole: 'Civilian',
      status: 'CONNECTING',
      createdAt: timestamp,
      locationName: targetIsland,
      coordinates: "34°12'N, 142°05'E",
      incidentType: 'Ship Attack & Injuries',
      injuredCount: 2,
      threatActive: true,
      severity: 'code_red',
      channel: '07',
      recordingEvents: [
        { timestamp, sender: 'SYSTEM', text: 'SOS EMERGENCY SIGNAL INITIATED', eventType: 'CALL_STARTED' }
      ]
    };

    setSession(newSession);

    // Auto-answer simulation after 2.2 seconds if HQ is unmanned
    setTimeout(async () => {
      setCallStatus('connected');
      setMushiState('listening');
      soundEngine.stopPurupuru();
      soundEngine.playGachal();

      const greeting = `Purupurupuru... Den Den Mushi emergency channel 07 connected! This is ${config.name} at Armada HQ! Identify yourself and state your emergency!`;
      const gTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await sendFirebaseChatMessage({
        sender: 'mushi',
        text: greeting,
        timestamp: gTimestamp,
        mushiName: config.name
      }).catch(console.error);

      soundEngine.speak(greeting, config.voice.pitch, config.voice.rate);
    }, 2200);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    soundEngine.playAlertTone();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Write user message directly to Firebase Realtime Database
    await sendFirebaseChatMessage({
      sender: 'user',
      text: userText,
      timestamp
    }).catch(console.error);

    setInputText('');
    setMushiState('listening');

    // 2. Process through Sarvam AI Brain
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

    // 3. Write Mushi AI response directly to Firebase Realtime Database
    const replyTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await sendFirebaseChatMessage({
      sender: 'mushi',
      text: aiResult.response,
      timestamp: replyTimestamp,
      expression: aiResult.expression,
      sosAlert: aiResult.sosTriggered,
      mushiName: config.name
    }).catch(console.error);

    soundEngine.speak(
      aiResult.response,
      config.voice.pitch,
      config.voice.rate,
      () => setMushiState('speaking'),
      () => setMushiState('listening')
    );
  };

  const handleClearChat = async () => {
    if (typeof window !== 'undefined' && window.confirm("Purge Channel 07 chat history from Firebase?")) {
      await clearFirebaseChat().catch(console.error);
    }
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
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch min-h-0 select-none">
      {/* 🐌 LEFT COLUMN: Interactive 3D Den Den Mushi Viewport */}
      <div className="md:col-span-6 lg:col-span-7 h-full flex flex-col relative rounded-lg overflow-hidden border-2 border-[#b8860b]/60 bg-transparent min-h-0">
        {/* Floating Top HUD Strip */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20 gap-2">
          {/* Status & Channel */}
          <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fcf8f0]/95 border border-[#b8860b]/60 text-[10px] font-mono text-[#172b31] shadow-xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#2e7d5a] animate-pulse" />
            <span className="font-extrabold text-[#b8860b]">FREQ 07</span>
            <span className="text-[#52636a] hidden sm:inline">· {session ? session.sessionId : 'STANDBY'}</span>
          </div>

          {/* Top Quick Actions */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Region Selector Dropdown */}
            {onSelectRegion && (
              <select
                value={config.region}
                onChange={(e) => onSelectRegion(e.target.value as RegionTheme)}
                className="bg-[#fcf8f0]/95 border border-[#b8860b]/60 text-[#172b31] rounded px-2 py-1 text-[10px] font-mono font-bold cursor-pointer focus:outline-none hover:border-[#b8860b] shadow-xs"
                aria-label="Select Region"
              >
                {REGION_LIST.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#fcf8f0] text-[#172b31]">
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
                  ? 'bg-[#d49b38] text-[#10242f] border-[#d49b38] font-bold shadow-xs'
                  : 'bg-[#fcf8f0]/95 text-[#172b31] border-[#b8860b]/60 hover:text-[#b8860b]'
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
                className="p-1.5 rounded border border-[#b8860b]/60 bg-[#fcf8f0]/95 text-[#172b31] hover:text-[#b8860b] transition cursor-pointer shadow-xs"
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
          <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fcf8f0]/95 border border-[#b8860b]/60 text-[10px] font-mono text-[#172b31] shadow-xs backdrop-blur-xs">
            <span className="text-[#52636a] font-bold">EMOTION:</span>
            <span className="font-extrabold text-[#2e7d5a] uppercase">{mushiState.replace('_', ' ')}</span>
          </div>

          {/* Primary SOS Action Button */}
          <div className="pointer-events-auto flex items-center gap-2">
            {session && (
              <div className="bg-[#bd3c32] text-white px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>REC LIVE</span>
              </div>
            )}

            {callStatus === 'idle' || callStatus === 'ended' ? (
              <button
                type="button"
                onClick={handleSendDistressSignal}
                className="bg-gradient-to-b from-[#bd3c32] to-[#8c221b] hover:from-[#cf3f34] hover:to-[#9c2720] text-[#fff7df] font-mono font-extrabold px-3.5 py-1.5 rounded-md text-[11px] flex items-center gap-1.5 border border-[#f0857a]/70 cursor-pointer shadow-[0_4px_12px_rgba(189,60,50,0.5)] active:translate-y-0.5 transition uppercase tracking-wider"
              >
                <Phone size={13} />
                <span>DIAL DISTRESS CALL</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleHangUp}
                className="bg-gradient-to-b from-[#8c221b] to-[#601510] hover:from-[#9c2720] hover:to-[#701813] text-[#fff7df] font-mono font-extrabold px-3.5 py-1.5 rounded-md text-[11px] flex items-center gap-1.5 border border-[#f0857a]/70 cursor-pointer shadow-[0_4px_12px_rgba(189,60,50,0.5)] transition uppercase tracking-wider"
              >
                <PhoneOff size={13} />
                <span>END CALL</span>
              </button>
            )}
          </div>
        </div>

        {/* Face Tracking Camera Preview Mini-PIP */}
        {isCameraTracking && (
          <div className="absolute top-11 right-2 bg-[#071926]/95 border border-[#d4af37] p-1 rounded z-30 flex flex-col items-center shadow-xl">
            <div ref={cameraPreviewRef} className="w-20 h-14 bg-black rounded overflow-hidden border border-[#d4af37]/50 relative">
              <div className={`absolute inset-0 border ${isFaceDetected ? 'border-[#4ade80] animate-pulse' : 'border-[#e8bd61]/40'} m-1 rounded pointer-events-none flex items-center justify-center`}>
                <div className={`w-1 h-1 rounded-full ${isFaceDetected ? 'bg-[#4ade80]' : 'bg-[#e8bd61]'}`} />
              </div>
            </div>
            <span className="text-[8px] font-mono font-bold mt-0.5 text-[#4ade80]">
              {isFaceDetected ? '● LOCKED' : 'SCANNING'}
            </span>
          </div>
        )}
      </div>

      {/* 🎛️ RIGHT COLUMN: Parchment Command Ledger (Chat | Customizer | Fleet HQ) */}
      <div className="md:col-span-6 lg:col-span-5 h-full flex flex-col rounded-lg overflow-hidden border-2 border-[#b8860b]/60 shadow-[0_10px_30px_rgba(8,18,25,0.45)] bg-[#fcf8f0]/95 backdrop-blur-md min-h-0">
        {/* Tab Switcher Header */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#eae0cd] border-b border-[#c8aa6d]/70 shrink-0 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#d49b38] text-[#12242e] font-extrabold shadow-xs border border-[#a67520]'
                : 'bg-[#ded2ba]/80 text-[#4c5b62] hover:text-[#172b31] hover:bg-[#e6dac0] font-bold border border-transparent'
            }`}
          >
            <MessageSquare size={12} />
            <span>Voice &amp; Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customizer')}
            className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
              activeTab === 'customizer'
                ? 'bg-[#d49b38] text-[#12242e] font-extrabold shadow-xs border border-[#a67520]'
                : 'bg-[#ded2ba]/80 text-[#4c5b62] hover:text-[#172b31] hover:bg-[#e6dac0] font-bold border border-transparent'
            }`}
          >
            <Palette size={12} />
            <span>Snail Traits</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hq')}
            className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
              activeTab === 'hq'
                ? 'bg-[#2e7d5a] text-[#ffffff] font-extrabold shadow-xs border border-[#1b5e3f]'
                : 'bg-[#ded2ba]/80 text-[#4c5b62] hover:text-[#172b31] hover:bg-[#e6dac0] font-bold border border-transparent'
            }`}
          >
            <ShieldAlert size={12} />
            <span>HQ Radar</span>
          </button>
        </div>

        {/* TAB 1: Live Voice & Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 p-2.5">
            {/* Live Firebase Chat Status Strip */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#c8aa6d]/50 text-[10px] font-mono text-[#55656d]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="font-extrabold text-[#172b31]">FIREBASE RTDB CHAT</span>
                <span className="text-[#8c9ba1]">· FREQ 07</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#8c9ba1] font-bold">{messages.length} MSGS</span>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Clear Firebase Chat History"
                    className="p-1 rounded text-[#8c9ba1] hover:text-[#bd3c32] hover:bg-[#ebdcc4] transition cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Transcript Feed */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[#c8aa6d]/60 rounded-md bg-[#f4ebd8]/70 text-[#55656d] space-y-2">
                  <span className="text-2xl">🐌</span>
                  <p className="font-mono text-[11px] text-[#2c3d44] font-semibold">
                    Channel 07 Standby on Firebase. Click <span className="text-[#bd3c32] font-extrabold">&quot;DIAL DISTRESS CALL&quot;</span> or speak to transmit distress signals!
                  </p>
                  <p className="text-[10px] text-[#2e7d5a] font-bold">
                    Connected to Firebase Realtime Database &amp; Sarvam Voice AI.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 mb-0.5 text-[9px] font-mono text-[#62737c]">
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
                      className={`max-w-[88%] px-3 py-1.5 rounded-md text-[11.5px] leading-relaxed shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-[#163344] text-[#fbf5e6] font-semibold border border-[#d4af37]/60'
                          : msg.sender === 'operator'
                          ? 'bg-[#1f5642] text-[#fbf5e6] font-semibold border border-[#5ab38e]/60'
                          : 'bg-[#ffffff] text-[#172b31] border border-[#d4c19a]'
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
              <div className="py-1 px-2.5 mb-1 bg-[#2e7d5a]/15 border border-[#2e7d5a]/40 rounded flex items-center justify-between text-[10px] font-mono text-[#1b5e3f] font-bold animate-pulse">
                <span>🔊 SYNTHESIZING VOICE PLAYBACK...</span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-2 bg-[#2e7d5a] animate-bounce" />
                  <span className="w-1 h-3 bg-[#2e7d5a] animate-bounce delay-75" />
                  <span className="w-1 h-1 bg-[#2e7d5a] animate-bounce delay-150" />
                </span>
              </div>
            )}

            {/* Chat Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) handleSendMessage(inputText);
              }}
              className="flex items-center gap-1.5 pt-2 border-t border-[#c8aa6d]/60 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening dictation...' : 'Type distress message...'}
                className="flex-1 bg-[#ffffff] text-[#172b31] placeholder-[#7d8c93] border-1.5 border-[#c9aa6d] rounded px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-[#b8860b] focus:ring-1 focus:ring-[#b8860b]/40 shadow-inner"
              />
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-1.5 rounded border transition cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-[#bd3c32] text-white animate-pulse border-[#e56659]'
                    : 'bg-[#ebdcc4] text-[#172b31] border-[#c9aa6d] hover:bg-[#dfcdb2]'
                }`}
                title={isListening ? 'Stop Mic Dictation' : 'Speak via Microphone'}
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-[#d49b38] hover:bg-[#c08828] disabled:opacity-40 text-[#12242e] font-mono font-extrabold px-3 py-1.5 rounded text-xs transition flex items-center gap-1 cursor-pointer shrink-0 border border-[#a67520] shadow-2xs"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Snail Trait Customizer */}
        {activeTab === 'customizer' && (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 min-h-0 text-xs font-mono text-[#172b31]">
            {/* Header + Randomizer */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#c8aa6d]/60">
              <div>
                <span className="font-extrabold text-[#172b31] flex items-center gap-1 text-[11px]">
                  <Sparkles size={11} className="text-[#d49b38]" />
                  TRAIT CUSTOMIZER
                </span>
                <span className="text-[10px] text-[#5c6e76]">Live 3D snail updates</span>
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                className="bg-[#d49b38] hover:bg-[#c08828] text-[#12242e] font-extrabold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer transition border border-[#a67520] shadow-2xs"
              >
                <Dices size={11} />
                <span>RANDOMIZE</span>
              </button>
            </div>

            {/* 3D Model Mode Toggle */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#172b31] flex items-center gap-1 uppercase tracking-wider">
                <Box size={10} className="text-[#b8860b]" /> 3D Model Engine
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onConfigChange && onConfigChange({ ...config, modelMode: 'procedural' })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-bold cursor-pointer transition ${
                    config.modelMode === 'procedural'
                      ? 'bg-[#d49b38] text-[#12242e] border-[#a67520] shadow-xs'
                      : 'bg-[#ebdcc4] text-[#4c5b62] border-[#c9aa6d] hover:text-[#172b31]'
                  }`}
                >
                  🎨 Procedural
                </button>
                <button
                  type="button"
                  onClick={() => onConfigChange && onConfigChange({ ...config, modelMode: 'glb_law' })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-bold cursor-pointer transition ${
                    config.modelMode === 'glb_law'
                      ? 'bg-[#2e7d5a] text-white border-[#1b5e3f] shadow-xs'
                      : 'bg-[#ebdcc4] text-[#4c5b62] border-[#c9aa6d] hover:text-[#172b31]'
                  }`}
                >
                  📦 Law 3D GLB
                </button>
                <button
                  type="button"
                  onClick={() => onConfigChange && onConfigChange({ ...config, modelMode: 'glb_law_hd' })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-bold cursor-pointer transition ${
                    config.modelMode === 'glb_law_hd'
                      ? 'bg-[#8938b8] text-white border-[#6c2894] shadow-xs'
                      : 'bg-[#ebdcc4] text-[#4c5b62] border-[#c9aa6d] hover:text-[#172b31]'
                  }`}
                >
                  💎 Law HD
                </button>
              </div>
            </div>

            {/* Official Character Presets */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#172b31] flex items-center gap-1 uppercase tracking-wider">
                <UserCheck size={10} className="text-[#b8860b]" /> Character Archetypes
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                {CHARACTER_BUTTONS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleSelectPreset(char.id, char.defaultGlb)}
                    className="p-1.5 rounded bg-[#f4ebd8] hover:bg-[#ebdcc3] border border-[#c8aa6d]/70 hover:border-[#b8860b] flex items-center gap-1.5 text-[10px] text-left transition cursor-pointer text-[#172b31] font-bold shadow-2xs"
                  >
                    <span>{char.icon}</span>
                    <span className="truncate">{char.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Color Swatches */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#172b31] flex items-center gap-1 uppercase tracking-wider">
                <Palette size={10} className="text-[#b8860b]" /> Shell &amp; Body Color
              </label>
              <div className="flex items-center gap-4 bg-[#f4ebd8] p-2 rounded border border-[#c8aa6d]/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-bold text-[#172b31]">Shell:</span>
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
                    className="w-6 h-6 rounded border border-[#c8aa6d] cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-bold text-[#172b31]">Skin:</span>
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
                    className="w-6 h-6 rounded border border-[#c8aa6d] cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Armada HQ Radar */}
        {activeTab === 'hq' && (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0 text-xs font-mono text-[#172b31]">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#c8aa6d]/60">
              <span className="font-extrabold text-[#2e7d5a] flex items-center gap-1 text-[11px]">
                <ShieldAlert size={12} />
                FLEET EMERGENCY RADAR
              </span>
              <span className="text-[10px] text-[#2e7d5a] font-extrabold bg-[#2e7d5a]/15 px-2 py-0.5 rounded border border-[#2e7d5a]/30">ONLINE</span>
            </div>

            <p className="text-[10.5px] text-[#4c5b62] leading-relaxed">
              Monitoring all Grand Line distress frequencies. Incoming calls automatically populate the triage queue.
            </p>

            {/* Active Sessions List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-[#172b31] uppercase tracking-wider">
                <span>FIREBASE DISPATCHES ({liveDispatches.length}):</span>
                <span className="text-[#2e7d5a] font-mono text-[9px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d5a] animate-pulse" />
                  LIVE SYNC
                </span>
              </div>
              {liveDispatches.length === 0 ? (
                <div className="p-3 text-center border-2 border-dashed border-[#c8aa6d]/60 rounded bg-[#f4ebd8]/70 text-[#55656d] text-[10px] font-semibold">
                  No active distress calls in Firebase. Channel 07 clear.
                </div>
              ) : (
                liveDispatches.slice(0, 5).map((s) => (
                  <div key={s.id} className="p-2 rounded bg-[#f4ebd8] border border-[#c8aa6d] space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#172b31]">{s.id}</span>
                      <span className={`font-extrabold px-1.5 py-0.5 rounded text-[9px] border ${
                        s.severity === 'critical' ? 'bg-[#bd3c32]/10 text-[#bd3c32] border-[#bd3c32]/30' :
                        s.severity === 'high' ? 'bg-[#d49b38]/15 text-[#9e6d16] border-[#d49b38]/30' :
                        'bg-[#2e7d5a]/10 text-[#2e7d5a] border-[#2e7d5a]/30'
                      }`}>
                        {s.severity.toUpperCase()} · {s.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[#4c5b62] font-semibold">{s.island} ({s.sector})</div>
                    <div className="text-[9.5px] text-[#6b7b83] truncate">{s.type} · {s.callerName || 'Unknown Caller'}</div>
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
                  className="w-full bg-[#bd3c32] hover:bg-[#9e2720] text-white font-extrabold py-2 px-3 rounded text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wider"
                >
                  <FileText size={12} />
                  <span>TRANSMIT SOS LOG FORM</span>
                </button>
              )}

              {onOpenEmbed && (
                <button
                  type="button"
                  onClick={onOpenEmbed}
                  className="w-full bg-[#ebdcc4] hover:bg-[#dfcdb2] text-[#172b31] border border-[#c9aa6d] font-bold py-1.5 px-2 rounded text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
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

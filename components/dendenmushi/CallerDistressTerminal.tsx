"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, AlertTriangle, Mic, MicOff, Send, Camera, Sparkles, Volume2, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
const DenDenMushiCanvas = dynamic(
  () => import('./DenDenMushiCanvas').then((mod) => mod.DenDenMushiCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] rounded-2xl flex flex-col items-center justify-center bg-[#071926] border border-[#e8bd61]/40 text-[#e8bd61] font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#e8bd61] border-t-transparent animate-spin" />
        <span>INITIALIZING 3D TRANSPONDER SNAIL...</span>
      </div>
    )
  }
);
import { MushiConfig, ChatMessage, CallState, SosSession, MushiEmotionalState } from '@/lib/dendenmushi/mushi';
import { soundEngine } from '@/lib/dendenmushi/soundEngine';
import { MushiBrain } from '@/lib/dendenmushi/aiBrain';
import { networkSync } from '@/lib/dendenmushi/networkSync';
import { faceTracker } from '@/lib/dendenmushi/faceTracker';

interface Props {
  config: MushiConfig;
}

export const CallerDistressTerminal: React.FC<Props> = ({ config }) => {
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

  // Subscribe to network sync events (e.g. when HQ operator answers call or sends operator message!)
  useEffect(() => {
    const unsubscribe = networkSync.subscribe((event) => {
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

    // Auto-answer simulation after 2 seconds if HQ is unmanned
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
    setMessages(prev => [...prev, msg]);
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
          // Cleanly replace with base typed text + current speech transcript without duplicating!
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

  return (
    <div className="w-full flex flex-col gap-6">
      {/* TOP EMERGENCY CALLER BAR */}
      <div className="bg-[#0D2B3D] border border-[#B93B32] p-4 rounded-sm abyssal-shadow flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#B93B32] text-[#F4EAD5] flex items-center justify-center font-bold text-xl animate-pulse">
            🚨
          </div>
          <div>
            <h2 className="font-serif-heading font-black text-lg text-[#E8BD61] tracking-wide">
              DEN DEN MUSHI CALLER TERMINAL (/distress)
            </h2>
            <p className="text-xs font-mono-signal text-[#A8BBC0]">
              SESSION: {session ? session.sessionId : 'STANDBY'} • CHANNEL: 07 (EMERGENCY)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CAMERA FACE TRACKING TOGGLE */}
          <button
            onClick={toggleCameraTracking}
            className={`px-3 py-1.5 rounded-sm border text-xs font-mono-signal font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isCameraTracking
                ? 'bg-[#6AB897] text-[#071926] border-[#6AB897]'
                : 'bg-[#071926] text-[#A8BBC0] border-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isCameraTracking ? 'FACE TRACKING: ACTIVE' : 'TRACKING: POINTER'}</span>
          </button>

          {callStatus === 'idle' ? (
            <button
              onClick={handleSendDistressSignal}
              className="bg-[#B93B32] hover:bg-[#E56659] text-[#F4EAD5] font-mono-signal font-bold px-4 py-2 rounded-sm text-xs sm:text-sm flex items-center gap-2 border border-[#E56659] abyssal-shadow cursor-pointer transition transform active:scale-95 animate-pulse"
            >
              <Phone className="w-4 h-4" />
              <span>📞 SEND DISTRESS SIGNAL</span>
            </button>
          ) : (
            <button
              onClick={handleHangUp}
              className="bg-[#B93B32] hover:bg-[#E56659] text-[#F4EAD5] font-mono-signal font-bold px-4 py-2 rounded-sm text-xs flex items-center gap-2 border border-[#E56659] abyssal-shadow cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>END TRANSMISSION</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D DEN DEN MUSHI PLATFORM VIEWPORT */}
      <div className="h-[380px] w-full relative">
        <DenDenMushiCanvas
          config={config}
          isRinging={callStatus === 'calling'}
          isSpeaking={isSpeaking}
          audioVolume={audioVolume}
          trackingCoords={trackingCoords}
        />

        {/* EMOTIONAL STATE BADGE */}
        <div className="absolute bottom-3 left-3 bg-[#071926]/90 backdrop-blur-md px-3 py-1.5 rounded-sm border border-[#E8BD61]/40 text-xs font-mono-signal text-[#E8BD61] flex items-center gap-2">
          <span>EMOTION:</span>
          <span className="uppercase font-bold text-[#6AB897]">{mushiState.replace('_', ' ')}</span>
        </div>

        {/* CAMERA FACE TRACKING HUD PREVIEW */}
        {isCameraTracking && (
          <div className="absolute top-3 right-3 bg-[#071926]/90 border border-[#6AB897] p-1.5 rounded-sm abyssal-shadow z-20 flex flex-col items-center">
            <div ref={cameraPreviewRef} className="w-28 h-20 bg-black rounded-sm overflow-hidden border border-[#6AB897]/50 relative">
              <div className={`absolute inset-0 border-2 ${isFaceDetected ? 'border-[#6AB897] animate-pulse' : 'border-[#E8BD61]/40'} m-2 rounded-sm pointer-events-none flex items-center justify-center`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isFaceDetected ? 'bg-[#6AB897]' : 'bg-[#E8BD61]'}`} />
              </div>
            </div>
            <div className="text-[10px] font-mono-signal font-bold mt-1 text-[#6AB897] flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isFaceDetected ? 'bg-[#6AB897] animate-ping' : 'bg-[#E8BD61]'}`} />
              <span>{isFaceDetected ? 'FACE LOCKED' : 'SCANNING FACE...'}</span>
            </div>
          </div>
        )}

        {/* 📼 RECORDING NOTICE */}
        {session && (
          <div className="absolute bottom-3 right-3 bg-[#B93B32] text-[#F4EAD5] px-3 py-1.5 rounded-sm text-xs font-mono-signal font-bold flex items-center gap-2 animate-pulse abyssal-shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>📼 00:02:45 RECORDING LIVE</span>
          </div>
        )}
      </div>

      {/* CALLER DISPATCH CHAT & TRANSMISSION */}
      <div className="bg-[#0D2B3D] border border-[#E8BD61]/40 rounded-sm p-4 sm:p-6 abyssal-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8BD61]/20 pb-3">
          <h3 className="font-serif-heading font-bold text-md text-[#E8BD61] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6AB897]" />
            Live Voice & Dispatch Channel
          </h3>
          <span className="text-xs font-mono-signal text-[#A8BBC0]">
            LOCATION: Water 7 — Harbor District
          </span>
        </div>

        {/* TRANSCRIPT FEED */}
        <div className="overflow-y-auto space-y-3 max-h-[240px] pr-2">
          {messages.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-[#E8BD61]/30 rounded-sm bg-[#071926] text-[#A8BBC0] text-xs font-mono-signal">
              Press <span className="text-[#B93B32] font-bold">"📞 SEND DISTRESS SIGNAL"</span> to initiate live emergency transmission with Armada HQ!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono-signal text-[#A8BBC0]">
                  <span>{msg.sender === 'user' ? '👤 CALLER' : msg.sender === 'operator' ? '🏴 ARMADA HQ OPERATOR' : `🐌 ${msg.mushiName || config.name}`}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-sm text-sm leading-relaxed abyssal-shadow ${
                    msg.sender === 'user'
                      ? 'bg-[#E8BD61] text-[#172D36] font-semibold'
                      : msg.sender === 'operator'
                      ? 'bg-[#6AB897] text-[#071926] font-bold'
                      : 'bg-[#F4E3BE] text-[#172D36] font-medium'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT FORM */}
        <form onSubmit={(e) => { e.preventDefault(); if (inputText.trim()) handleSendMessage(inputText); }} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening dictation...' : 'Type full distress message here...'}
            className="flex-1 bg-[#071926] text-[#F4EAD5] placeholder-[#A8BBC0] border border-[#E8BD61]/40 rounded-sm px-4 py-2.5 text-sm font-sans-body focus:outline-none focus:border-[#E8BD61]"
          />
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-2.5 rounded-sm border font-mono-signal font-bold transition cursor-pointer ${
              isListening ? 'bg-[#B93B32] text-white animate-pulse' : 'bg-[#071926] text-[#E8BD61] border-[#E8BD61]/40'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-[#E8BD61] hover:bg-[#F0C65D] disabled:opacity-40 text-[#071926] font-mono-signal font-bold px-5 py-2.5 rounded-sm transition flex items-center gap-1.5 abyssal-shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};


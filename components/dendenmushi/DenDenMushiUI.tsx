"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Phone, PhoneOff, AlertTriangle, Volume2, Sparkles } from 'lucide-react';
import { MushiConfig, ChatMessage, CallState } from '@/lib/dendenmushi/mushi';
import { soundEngine } from '@/lib/dendenmushi/soundEngine';

interface Props {
  config: MushiConfig;
  messages: ChatMessage[];
  callState: CallState;
  onSendMessage: (text: string) => void;
  onStartCall: () => void;
  onHangUp: () => void;
  onToggleSos: () => void;
}

export const DenDenMushiUI: React.FC<Props> = ({
  config,
  messages,
  callState,
  onSendMessage,
  onStartCall,
  onHangUp,
  onToggleSos
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundEngine.playAlertTone(); // Play user's authentic alert tone OP theme!
    onSendMessage(inputText.trim());
    setInputText(''); // Clear input after sending full message at once!
  };

  const initialInputRef = useRef('');

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

  const isConnected = callState.status === 'connected' || callState.status === 'speaking_user' || callState.status === 'speaking_mushi';

  return (
    <div className={`w-full flex flex-col h-full rounded-sm border ${callState.isSosActive ? 'border-[#B93B32] bg-[#B93B32]/10' : 'border-[#E8BD61]/40 bg-[#0D2B3D]'} p-4 sm:p-6 abyssal-shadow transition-all duration-300`}>
      {/* 🐌 RECEIVER HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E8BD61]/25">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xl ${callState.isSosActive ? 'bg-[#B93B32] text-[#F4EAD5] animate-bounce' : 'bg-[#E8BD61] text-[#071926]'} abyssal-shadow`}>
            🐌
          </div>
          <div>
            <h2 className="font-serif-heading font-bold text-lg text-[#E8BD61] tracking-wide flex items-center gap-2">
              {config.name}
            </h2>
            <p className="text-xs font-mono-signal text-[#A8BBC0]">
              CHANNEL: 07-{(config.region.toUpperCase())} • SEED: {config.seed}
            </p>
          </div>
        </div>

        {/* STATUS BADGES */}
        <div className="flex items-center gap-2">
          {callState.isSosActive && (
            <span className="px-3 py-1 bg-[#B93B32] text-[#F4EAD5] text-xs font-mono-signal font-bold rounded-sm animate-pulse flex items-center gap-1.5 abyssal-shadow">
              <AlertTriangle className="w-3.5 h-3.5" />
              SOS EMERGENCY MODE
            </span>
          )}

          {callState.status === 'ringing' && (
            <span className="px-3 py-1 bg-[#E8BD61]/20 text-[#E8BD61] border border-[#E8BD61] text-xs font-mono-signal font-bold rounded-sm animate-puru flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 animate-spin" />
              PURUPURUPURU...
            </span>
          )}

          {isConnected && !callState.isSosActive && (
            <span className="px-3 py-1 bg-[#6AB897]/20 text-[#6AB897] border border-[#6AB897] text-xs font-mono-signal font-bold rounded-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6AB897] animate-ping" />
              SIGNAL TEAL ACTIVE
            </span>
          )}

          {callState.status === 'idle' && (
            <span className="px-3 py-1 bg-[#071926] text-[#A8BBC0] border border-slate-800 text-xs font-mono-signal rounded-sm">
              RECEIVER ON HOOK
            </span>
          )}
        </div>
      </div>

      {/* 📜 DISPATCH TRANSCRIPT (WEATHERED PARCHMENT PAPER LOOK) */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 min-h-[220px] max-h-[380px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E8BD61]/30 rounded-sm bg-[#071926]/60 text-[#A8BBC0]">
            <Sparkles className="w-8 h-8 text-[#E8BD61] mb-2 animate-pulse" />
            <p className="font-serif-heading font-semibold text-[#E8BD61]">Den Den Mushi Network Ready</p>
            <p className="text-xs text-[#A8BBC0] max-w-sm mt-1 font-sans-body">
              Type your message at once or use <span className="text-[#E8BD61] font-bold">Voice Mic</span>, then press <span className="text-[#6AB897] font-bold">SEND</span>!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono-signal text-[#A8BBC0]">
                <span>{msg.sender === 'user' ? '👤 CALLER' : `🐌 ${msg.mushiName || config.name}`}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-sm text-sm leading-relaxed abyssal-shadow ${
                  msg.sender === 'user'
                    ? 'bg-[#E8BD61] text-[#172D36] font-semibold border border-[#F0C65D]'
                    : msg.sosAlert
                    ? 'bg-[#B93B32] text-[#F4EAD5] border border-[#E56659] font-bold'
                    : 'bg-[#F4E3BE] text-[#172D36] border border-[#dfc696] font-medium'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 🎙️ CONTROLS & VOICE INPUT */}
      <div className="space-y-3 pt-3 border-t border-[#E8BD61]/25">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening... dictating to text box' : 'Type your full message here at once...'}
            className="flex-1 bg-[#071926] text-[#F4EAD5] placeholder-[#A8BBC0] border border-[#E8BD61]/40 rounded-sm px-4 py-2.5 text-sm font-sans-body focus:outline-none focus:border-[#E8BD61] transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-[#E8BD61] hover:bg-[#F0C65D] disabled:opacity-40 text-[#071926] font-mono-signal font-bold px-4 py-2.5 rounded-sm transition flex items-center gap-1.5 abyssal-shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* RECEIVER ACTION BUTTONS */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 font-mono-signal">
          {!isConnected && callState.status !== 'ringing' ? (
            <button
              onClick={onStartCall}
              className="bg-[#6AB897] hover:bg-[#77B7BD] text-[#071926] font-bold py-2.5 px-3 rounded-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm abyssal-shadow cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>CALL</span>
            </button>
          ) : (
            <button
              onClick={onHangUp}
              className="bg-[#B93B32] hover:bg-[#E56659] text-[#F4EAD5] font-bold py-2.5 px-3 rounded-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm abyssal-shadow cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>HANG UP</span>
            </button>
          )}

          <button
            onClick={handleToggleMic}
            className={`${
              isListening
                ? 'bg-[#B93B32] text-[#F4EAD5] animate-pulse'
                : 'bg-[#071926] hover:bg-[#103449] text-[#E8BD61] border border-[#E8BD61]/40'
            } font-bold py-2.5 px-3 rounded-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm abyssal-shadow cursor-pointer`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'STOP MIC' : 'VOICE MIC'}</span>
          </button>

          <button
            onClick={onToggleSos}
            className={`${
              callState.isSosActive
                ? 'bg-[#B93B32] text-[#F4EAD5] animate-bounce'
                : 'bg-[#B93B32]/30 hover:bg-[#B93B32]/60 text-[#E56659] border border-[#B93B32]'
            } font-bold py-2.5 px-3 rounded-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm abyssal-shadow cursor-pointer`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>SOS ALERT</span>
          </button>

          <div className="hidden sm:flex items-center justify-center text-[10px] text-[#6AB897] bg-[#071926] rounded-sm px-2 border border-[#6AB897]/30">
            LAW LIP-SYNC: ON
          </div>
        </div>
      </div>
    </div>
  );
};


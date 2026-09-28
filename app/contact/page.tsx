"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import { OceanBackground } from "@/components/ocean-background";
import { CallerDistressTerminal } from "@/components/dendenmushi/CallerDistressTerminal";
import { DistressFormModal } from "@/components/dendenmushi/DistressFormModal";
import { EmbedModal } from "@/components/dendenmushi/EmbedModal";
import { MushiConfig, RegionTheme, SosSession } from "@/lib/dendenmushi/mushi";
import { generateRandomSeed, generateMushiFromSeed } from "@/lib/dendenmushi/seedGenerator";
import { soundEngine } from "@/lib/dendenmushi/soundEngine";
import { networkSync } from "@/lib/dendenmushi/networkSync";

import { createFirebaseDistressCall, sendFirebaseChatMessage } from "@/lib/dendenmushi/firebaseChat";

export default function ContactPage() {
  const initialSeed = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const seedParam = params.get('seed');
      if (seedParam) return seedParam;
    }
    return generateRandomSeed();
  }, []);

  const [config, setConfig] = useState<MushiConfig>(() => generateMushiFromSeed(initialSeed));
  const [isMuted, setIsMuted] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [isDistressFormOpen, setIsDistressFormOpen] = useState(false);

  const handleSelectRegion = (region: RegionTheme) => {
    const newConfig = generateMushiFromSeed(config.seed, region);
    setConfig(newConfig);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        soundEngine.stopPurupuru();
        soundEngine.stopSiren();
        soundEngine.stopSpeaking();
      }
      return next;
    });
  };

  const handleDistressFormSubmit = async (data: any) => {
    const sessionId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Write distress record directly to Firebase Realtime Database
    await createFirebaseDistressCall({
      id: sessionId,
      type: data.classification,
      island: data.island,
      sector: data.coordinates,
      severity: data.urgency === 'critical' ? 'critical' : data.urgency === 'high' ? 'high' : 'medium',
      description: data.details || `Distress SOS Log transmitted via Transponder Snail (${data.callerId})`,
      callerName: data.callerId || 'Civilian Caller',
      denDenFrequency: data.frequency || '108.4 MHz'
    }).catch(console.error);

    // 2. Broadcast system announcement to Firebase 3D Chat
    await sendFirebaseChatMessage({
      sender: 'system',
      text: `🚨 DISTRESS SOS TRANSMISSION LOGGED: ${data.classification} at ${data.island} (${data.coordinates})`,
      timestamp: timeStr,
      sosAlert: true
    }).catch(console.error);

    const newSession: SosSession = {
      sessionId,
      callerId: data.callerId || 'CALLER-82A1',
      callerRole: 'Civilian Distress Caller',
      status: 'CONNECTING',
      createdAt: timeStr,
      locationName: data.island,
      coordinates: data.coordinates,
      incidentType: data.classification,
      injuredCount: 1,
      threatActive: true,
      severity: data.urgency === 'critical' ? 'code_red' : data.urgency === 'high' ? 'code_yellow' : 'code_green',
      channel: data.frequency || '07',
      recordingEvents: [
        {
          timestamp: timeStr,
          sender: 'CALLER',
          text: `🚨 DISTRESS SOS FORM SUBMITTED: ${data.details}`
        }
      ]
    };

    const currentSessions = networkSync.getActiveSessions();
    const updated = [newSession, ...currentSessions];
    networkSync.saveActiveSessions(updated);
    networkSync.broadcast('SOS_SUBMITTED', newSession);

    if (!isMuted) {
      soundEngine.startSiren();
    }
    setIsDistressFormOpen(false);
  };

  return (
    <main className="contact-page-shell">
      {/* 🌊 Living Ocean Video Background */}
      <OceanBackground />

      {/* 📜 Authentic One Piece Ancient Parchment Scroll */}
      <div className="contact-scroll-wrapper">
        <div className="contact-parchment-scroll">
          {/* Scroll Header */}
          <header className="contact-scroll-heading">
            <div>
              <div className="contact-kicker">
                <Radio size={13} />
                <span>GRAND LINE TRANSPONDER · FREQUENCY 07 PURUPURU STATION</span>
              </div>
              <h1 className="contact-title">
                Den Den Mushi <em>Communicator.</em>
              </h1>
              <p className="contact-subtitle">
                Grand Line priority emergency voice transponder, real-time AI audio link, and fleet triage station.
              </p>
            </div>
          </header>

          {/* Centered Cockpit Terminal inside Parchment Bounds */}
          <div className="contact-terminal-body">
            <CallerDistressTerminal
              config={config}
              onConfigChange={setConfig}
              onSelectRegion={handleSelectRegion}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onOpenDistressForm={() => setIsDistressFormOpen(true)}
              onOpenEmbed={() => setIsEmbedOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* 🧭 Transparent Command Frame HUD Overlay */}
      <div className="landing-frame contact-frame" aria-hidden="true">
        <img src="/landing-command-frame-transparent.png" alt="" />
      </div>

      {/* 🧭 Interactive Corner Nav Controls */}
      <nav className="frame-controls contact-frame-controls" aria-label="Landing page controls">
        <Link href="/dashboard" className="frame-button frame-dashboard">
          DASHBOARD
        </Link>
        <Link href="/contact" className="frame-button frame-contact">
          CONTACT
        </Link>
        <Link href="/map" className="frame-button frame-map">
          MAP
        </Link>
        <Link href="/request" className="frame-button frame-sos">
          SOS
        </Link>
      </nav>

      {/* Modals */}
      <EmbedModal
        config={config}
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
      />

      <DistressFormModal
        isOpen={isDistressFormOpen}
        onClose={() => setIsDistressFormOpen(false)}
        onSubmitSos={handleDistressFormSubmit}
      />
    </main>
  );
}

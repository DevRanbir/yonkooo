"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CallerDistressTerminal } from "@/components/dendenmushi/CallerDistressTerminal";
import { DistressFormModal } from "@/components/dendenmushi/DistressFormModal";
import { EmbedModal } from "@/components/dendenmushi/EmbedModal";
import { MushiConfig, RegionTheme, SosSession } from "@/lib/dendenmushi/mushi";
import { generateRandomSeed, generateMushiFromSeed } from "@/lib/dendenmushi/seedGenerator";
import { soundEngine } from "@/lib/dendenmushi/soundEngine";
import { networkSync } from "@/lib/dendenmushi/networkSync";

export default function ContactPage() {
  useEffect(() => {
    document.documentElement.classList.add("landing-active");
    document.body.classList.add("landing-active");
    return () => {
      document.documentElement.classList.remove("landing-active");
      document.body.classList.remove("landing-active");
    };
  }, []);

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

  const handleDistressFormSubmit = (data: any) => {
    const newSession: SosSession = {
      sessionId: `SOS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      callerId: data.callerId || 'CALLER-82A1',
      callerRole: 'Civilian Distress Caller',
      status: 'CONNECTING',
      createdAt: new Date().toLocaleTimeString(),
      locationName: data.island,
      coordinates: data.coordinates,
      incidentType: data.classification,
      injuredCount: 1,
      threatActive: true,
      severity: data.urgency === 'critical' ? 'code_red' : data.urgency === 'high' ? 'code_yellow' : 'code_green',
      channel: data.frequency || '07',
      recordingEvents: [
        {
          timestamp: new Date().toLocaleTimeString(),
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
    <main className="contact-frame-landing">
      {/* 🌊 Living Ocean Background Video */}
      <video className="landing-bg-video" autoPlay loop muted playsInline>
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* 🖥️ Centered Den Den Mushi Cockpit Hub (Directly Inside Frame Window, Zero Scroll) */}
      <div className="contact-center-hub">
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

      {/* 🧭 Transparent Command Frame HUD Overlay */}
      <div className="landing-frame" aria-hidden="true">
        <img src="/landing-command-frame-transparent.png" alt="" />
      </div>

      {/* 🧭 Interactive Corner Nav Controls */}
      <nav className="frame-controls" aria-label="Landing page controls">
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

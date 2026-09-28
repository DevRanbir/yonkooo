"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { OceanBackground } from "@/components/ocean-background";
import { SiteNav } from "@/components/site-nav";
import { HeaderNav } from "@/components/dendenmushi/HeaderNav";
import { CallerDistressTerminal } from "@/components/dendenmushi/CallerDistressTerminal";
import { ArmadaHqCommandCenter } from "@/components/dendenmushi/ArmadaHqCommandCenter";
import { CustomizerPanel } from "@/components/dendenmushi/CustomizerPanel";
import { DistressFormModal } from "@/components/dendenmushi/DistressFormModal";
import { EmbedModal } from "@/components/dendenmushi/EmbedModal";
import { MushiConfig, RegionTheme, SosSession } from "@/lib/dendenmushi/mushi";
import { generateRandomSeed, generateMushiFromSeed } from "@/lib/dendenmushi/seedGenerator";
import { soundEngine } from "@/lib/dendenmushi/soundEngine";
import { networkSync } from "@/lib/dendenmushi/networkSync";
import { Radio, ShipWheel, Sparkles } from 'lucide-react';

export default function ContactPage() {
  const [currentRole, setCurrentRole] = useState<'distress' | 'hq'>('distress');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') || params.get('role');
      if (mode === 'hq') setCurrentRole('hq');
      else if (mode === 'distress') setCurrentRole('distress');
    }
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
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(true);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [isDistressFormOpen, setIsDistressFormOpen] = useState(false);

  const handleSelectRole = (role: 'distress' | 'hq') => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', role);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSelectRegion = (region: RegionTheme) => {
    const newConfig = generateMushiFromSeed(config.seed, region);
    setConfig(newConfig);
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
    soundEngine.startSiren();
    setIsDistressFormOpen(false);
  };

  return (
    <div className="crew-page contact-page text-foreground min-h-screen relative flex flex-col font-sans selection:bg-[#E8BD61] selection:text-[#071926]">
      {/* 🌊 Yonkooo Living Ocean Background */}
      <OceanBackground />

      {/* 🧭 Yonkooo Master Navigation */}
      <SiteNav />

      {/* 🐌 Den Den Mushi Operations Header */}
      <HeaderNav
        config={config}
        currentRole={currentRole}
        isMuted={isMuted}
        isCustomizerOpen={isCustomizerOpen}
        onSelectRole={handleSelectRole}
        onToggleMute={() => setIsMuted(!isMuted)}
        onToggleCustomizer={() => setIsCustomizerOpen(!isCustomizerOpen)}
        onOpenEmbed={() => setIsEmbedOpen(true)}
        onOpenDistressForm={() => setIsDistressFormOpen(true)}
        onSelectRegion={handleSelectRegion}
      />

      {/* 📜 Yonkooo Page Mast */}
      <div className="page-mast">
        <div>
          <div className="page-kicker">
            <Radio className="h-3.5 w-3.5 text-[#E8BD61]" />
            TRANSPONDER SNAIL CONTACT FREQUENCY · SECTOR 07
          </div>
          <h1 className="page-title text-foreground">
            Den Den Mushi <em>Emergency Communicator</em>
          </h1>
          <p className="page-description text-muted-foreground">
            Direct telepathic contact channel to the Grand Line Rescue Armada. Dial emergency frequencies, 
            customize transponder snail aesthetics, engage interactive 3D face tracking, and monitor HQ dispatches.
          </p>
        </div>
        <div className="page-stamp">
          SIGNAL: ONLINE · FREQ 07
        </div>
      </div>

      {/* 🖥️ Main Interactive Terminals */}
      {currentRole === 'distress' ? (
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10">
          <div className={`${isCustomizerOpen ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} transition-all duration-300 w-full`}>
            <CallerDistressTerminal config={config} />
          </div>

          {isCustomizerOpen && (
            <div className="lg:col-span-5 xl:col-span-4 transition-all duration-300 w-full">
              <CustomizerPanel
                config={config}
                onChange={setConfig}
              />
            </div>
          )}
        </main>
      ) : (
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full z-10">
          <ArmadaHqCommandCenter onOpenDistressForm={() => setIsDistressFormOpen(true)} />
        </main>
      )}

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
    </div>
  );
}

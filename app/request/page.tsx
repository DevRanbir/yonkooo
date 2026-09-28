"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Crosshair,
  MapPin,
  PlusCircle,
  Radio,
  ShieldAlert,
  ShipWheel
} from "lucide-react";
import { OceanBackground } from "../../components/ocean-background";
import { useDispatch } from "../../components/dispatch-provider";
import { emergencyTypes, grandLineIslands, severityPoints, type Severity } from "../../lib/types";

export default function RequestPage() {
  const { create } = useDispatch();
  const [sent, setSent] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity>("critical");
  const [form, setForm] = useState({
    type: "Blizzard Exposure & Hypothermia",
    island: "Drum Island",
    sector: "Big Horn Ridge - Sector 4",
    callerName: "Dalton (Civilian Guard)",
    denDenFrequency: "108.4 MHz",
    description: ""
  });

  const handleDetectLocation = () => {
    const locations = [
      { island: "Drum Island", sector: "Gyppo Slope - North Ridge", caller: "Dr. Kureha Mountain Clinic" },
      { island: "Alabasta", sector: "Yuba Desert - Sand Dune 12", caller: "Kohza Oasis Guard" },
      { island: "Punk Hazard", sector: "Research Lab B - Frozen Basin", caller: "G-5 Border Patrol" },
      { island: "Water 7", sector: "Blue Station - Canal 4", caller: "Franky Family Shipwrights" }
    ];
    const picked = locations[Math.floor(Math.random() * locations.length)];
    setForm((prev) => ({
      ...prev,
      island: picked.island,
      sector: picked.sector,
      callerName: picked.caller
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = create({
      type: form.type,
      island: form.island,
      sector: form.sector,
      callerName: form.callerName,
      denDenFrequency: form.denDenFrequency,
      description: form.description,
      severity
    });
    setSent(item.id);
  };

  return (
    <div className="crew-page request-page text-foreground">
      <OceanBackground />
      <div className="page-mast"><div><p className="page-kicker"><Radio className="h-3.5 w-3.5"/> TRANSPONDER SNAIL · CHANNEL 108.4</p><h1 className="page-title">Send an <em>SOS.</em></h1><p className="page-description">Broadcast your coordinates to the allied rescue armada. Your signal enters the Grand Line queue immediately.</p></div><span className="page-stamp">EMERGENCY FREQUENCY<br/>OPEN</span></div>
      <main className="request-scroll">
        <aside className="request-side"><div className="snail-seal"/><p className="page-kicker">CITIZEN CHANNEL</p><h2 className="font-serif text-3xl leading-none">A clear call<br/><em className="text-primary">saves a crew.</em></h2><p className="safety-note">Demo system only. For a real emergency, use local emergency services first.</p></aside>

        {sent ? (
          <div className="success-scroll">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Signal Transmitted
            </span>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Emergency Case Logged
            </h2>

            <p className="mt-2 text-base text-muted-foreground max-w-md mx-auto">
              Your request <b className="text-foreground font-mono">{sent}</b> has entered the priority queue for{" "}
              <b className="text-foreground">{form.island}</b>. Dispatch coordinates are active.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:opacity-90"
              >
                <span>Track in Command Center</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                className="rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                onClick={() => {
                  setSent(null);
                  setForm((p) => ({ ...p, description: "" }));
                }}
              >
                Submit Another Signal
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-md border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            {/* Classification */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Emergency Classification
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {emergencyTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Island & Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Grand Line Island
                </label>
                <select
                  value={form.island}
                  onChange={(e) => setForm({ ...form, island: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {grandLineIslands.map((isle) => (
                    <option key={isle.name} value={isle.name}>
                      {isle.name} ({isle.sea})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Sector / Location Coordinates
                </label>
                <input
                  required
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  placeholder="e.g. Sector 4, North Ridge"
                  className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Reporter & Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Reporting Caller / Vessel ID
                </label>
                <input
                  required
                  value={form.callerName}
                  onChange={(e) => setForm({ ...form, callerName: e.target.value })}
                  placeholder="e.g. Guard Dalton, Civilian Clinic"
                  className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Transponder Snail Frequency
                </label>
                <input
                  value={form.denDenFrequency}
                  onChange={(e) => setForm({ ...form, denDenFrequency: e.target.value })}
                  placeholder="e.g. 108.4 MHz"
                  className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Severity Level Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-foreground">
                  Severity Level
                </label>
                <span className="text-xs font-semibold text-primary">
                  Base Priority: {severityPoints[severity]} pts (+aging over time)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["low", "medium", "high", "critical"] as Severity[]).map((s) => {
                  const isSelected = severity === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`flex flex-col items-center justify-center rounded-md border p-3 text-center transition-all ${
                        isSelected
                          ? s === "critical"
                            ? "border-destructive bg-destructive/10 text-destructive font-bold ring-2 ring-destructive"
                            : "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm font-bold uppercase">{s}</span>
                      <span className="text-xs mt-0.5 opacity-80">{severityPoints[s]} pts</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Emergency Situation & Medical Details
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe injuries, casualties, weather conditions, trapped civilians, or hazardous substances..."
                className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Crosshair className="h-4 w-4 text-primary" />
                <span>Auto-Fill Sector Preset</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-base font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
              >
                <Radio className="h-5 w-5" />
                <span>Transmit Distress SOS</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

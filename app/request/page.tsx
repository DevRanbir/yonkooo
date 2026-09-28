"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Radio
} from "lucide-react";
import { OceanBackground } from "../../components/ocean-background";
import { useDispatch } from "../../components/dispatch-provider";
import { emergencyTypes, grandLineIslands, severityPoints, type Severity } from "../../lib/types";
import { CustomDrawerSelect } from "../../components/custom-drawer-select";

export default function RequestPage() {
  const { create } = useDispatch();
  const [sent, setSent] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const item = create({
        type: form.type,
        island: form.island,
        sector: form.sector,
        callerName: form.callerName,
        denDenFrequency: form.denDenFrequency,
        description: form.description,
        severity,
      });
      setSent(item.id);
    } catch (error) {
      console.error("Unable to transmit SOS to Realtime Database", error);
      setSubmitError("Signal could not be transmitted. Confirm your Realtime Database URL and rules, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crew-page request-page framed-request text-foreground">
      <OceanBackground />

      <div className="sos-scroll-wrapper">
        <div className="sos-parchment-scroll">
          {/* Scroll Header */}
          <div className="sos-scroll-header">
            <h1 className="sos-scroll-title">
              Send an <em>SOS.</em>
            </h1>
          </div>

          {sent ? (
            <div className="sos-confirmation-box animate-scale-up">
              <CheckCircle2 size={54} className="sos-confirm-icon" />
              <div className="sos-confirm-kicker">SIGNAL TRANSMITTED & LOGGED</div>
              <h2 className="sos-confirm-title">Emergency Signal Transmitted!</h2>
              <p className="sos-confirm-desc">
                Your distress request <b className="font-mono text-[#141f25]">{sent}</b> has entered the Grand Line Priority Queue on{" "}
                <b>{form.island}</b>. Chopper&apos;s Medical Rescue Armada is being coordinated.
              </p>
              <div className="sos-confirm-actions">
                <Link href="/dashboard" className="sos-submit-btn">
                  <span>TRACK IN COMMAND CENTER</span>
                  <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  className="sos-preset-btn"
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
            <form onSubmit={submit} className="sos-form-body">
              {/* Classification */}
              <div className="sos-form-group">
                <label className="sos-field-label">Emergency Classification</label>
                <CustomDrawerSelect
                  value={form.type}
                  onChange={(val) => setForm((prev) => ({ ...prev, type: val }))}
                  options={emergencyTypes}
                  drawerTitle="Emergency Classification Tier"
                />
              </div>

              {/* Island & Sector */}
              <div className="sos-form-grid-2">
                <div className="sos-form-group">
                  <label className="sos-field-label">Grand Line Island</label>
                  <CustomDrawerSelect
                    value={form.island}
                    onChange={(val) => setForm((prev) => ({ ...prev, island: val }))}
                    options={grandLineIslands.map((isle) => ({
                      value: isle.name,
                      label: isle.name,
                      badge: isle.sea,
                      subtext: `${isle.climate} · ${isle.hazards}`
                    }))}
                    drawerTitle="Grand Line Island Coordinates"
                  />
                </div>

                <div className="sos-form-group">
                  <label className="sos-field-label">Sector / Location Coordinates</label>
                  <input
                    required
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    placeholder="e.g. Big Horn Ridge - Sector 4"
                    className="sos-input-field"
                  />
                </div>
              </div>

              {/* Reporter & Frequency */}
              <div className="sos-form-grid-2">
                <div className="sos-form-group">
                  <label className="sos-field-label">Reporting Caller / Vessel ID</label>
                  <input
                    required
                    value={form.callerName}
                    onChange={(e) => setForm({ ...form, callerName: e.target.value })}
                    placeholder="e.g. Dalton (Civilian Guard)"
                    className="sos-input-field"
                  />
                </div>

                <div className="sos-form-group">
                  <label className="sos-field-label">Transponder Snail Frequency</label>
                  <input
                    value={form.denDenFrequency}
                    onChange={(e) => setForm({ ...form, denDenFrequency: e.target.value })}
                    placeholder="e.g. 108.4 MHz"
                    className="sos-input-field"
                  />
                </div>
              </div>

              {/* Severity Level Buttons */}
              <div className="sos-form-group">
                <div className="sos-severity-header">
                  <label className="sos-field-label" style={{ margin: 0 }}>
                    Severity Level & Urgency Tier
                  </label>
                  <span className="sos-points-hint">
                    Base Priority: <b>{severityPoints[severity]} pts</b> (+aging over time)
                  </span>
                </div>

                <div className="sos-severity-grid">
                  {(["low", "medium", "high", "critical"] as Severity[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`sos-sev-btn ${severity === s ? `active ${s}` : ""}`}
                    >
                      <span className="sos-sev-name">{s}</span>
                      <span className="sos-sev-pts">{severityPoints[s]} pts</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Medical Details */}
              <div className="sos-form-group">
                <label className="sos-field-label">Emergency Situation & Medical Details</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe injuries, casualties, weather conditions, trapped civilians, or hazardous substances..."
                  className="sos-input-field sos-textarea-field"
                />
              </div>

              {/* Actions */}
              <div className="sos-actions-row">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="sos-preset-btn"
                  title="Auto-detect nearest Log Pose sector"
                >
                  <Crosshair size={15} />
                  <span>Auto-Fill Sector Preset</span>
                </button>

                <button type="submit" className="sos-submit-btn" disabled={isSubmitting}>
                  <span>{isSubmitting ? "TRANSMITTING SIGNAL…" : "TRANSMIT DISTRESS SOS"}</span>
                  <Radio size={15} />
                </button>
              </div>
              {submitError && <p className="mt-3 text-sm text-[#b52d27]" role="alert">{submitError}</p>}
            </form>
          )}
        </div>
      </div>

      {/* Framed Corner Navigation Controls */}
      <div className="landing-frame request-frame" aria-hidden="true">
        <img src="/landing-command-frame-transparent.png" alt="" />
      </div>
      <nav className="frame-controls request-frame-controls" aria-label="SOS page controls">
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
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Radio,
  ShieldAlert,
  X
} from "lucide-react";
import { OceanBackground } from "../../components/ocean-background";
import { useDispatch } from "../../components/dispatch-provider";
import { priorityScore } from "../../lib/types";

export default function MapPage() {
  const { emergencies, currentTime } = useDispatch();
  const [showTacticalDrawer, setShowTacticalDrawer] = useState(false);
  const [mapSource, setMapSource] = useState<"ohara" | "onepieceworldmap">("ohara");
  const [iframeError, setIframeError] = useState(false);

  // Active emergencies sorted by priority
  const activeEmergencies = emergencies
    .filter((e) => e.status !== "resolved")
    .sort((a, b) => priorityScore(b, currentTime) - priorityScore(a, currentTime));

  const currentIframeSrc =
    mapSource === "ohara"
      ? "https://thelibraryofohara.com/onepieceworldmap/"
      : "https://onepieceworldmap.com/";

  return (
    <div className="crew-page map-page-shell text-foreground">
      <OceanBackground />

      <main className="map-scroll-wrapper">
        <section className="map-parchment-scroll" aria-label="Grand Line Cartography">
          {/* Scroll Header */}
          <div className="map-scroll-heading">
            <div>
              <h1 className="map-title">
                Grand Line <em>World Map.</em>
              </h1>
            </div>

            {/* Toolbar Actions */}
            <div className="map-toolbar">
              {/* Engine Toggle */}
              <div className="map-engine-group" role="group" aria-label="Cartography engine">
                <button
                  type="button"
                  onClick={() => setMapSource("ohara")}
                  className={`map-engine-btn ${mapSource === "ohara" ? "active" : ""}`}
                >
                  Library of Ohara
                </button>
                <button
                  type="button"
                  onClick={() => setMapSource("onepieceworldmap")}
                  className={`map-engine-btn ${mapSource === "onepieceworldmap" ? "active" : ""}`}
                >
                  Interactive Map
                </button>
              </div>

              {/* Signals Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowTacticalDrawer(!showTacticalDrawer)}
                className={`map-tool-btn ${showTacticalDrawer ? "active" : ""}`}
                title="Toggle tactical distress signals drawer"
              >
                <span className="map-signal-dot" />
                <Layers size={13} />
                <span>Signals ({activeEmergencies.length})</span>
              </button>

              {/* Full View External Link */}
              <a
                href={currentIframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="map-tool-btn"
                title="Open full interactive map in new window"
              >
                <span>Full View</span>
                <ExternalLink size={12} />
              </a>

              {/* Transmit SOS direct link */}
              <Link href="/request" className="map-tool-btn cta-sos">
                <Radio size={13} />
                <span>Transmit SOS</span>
              </Link>
            </div>
          </div>

          {/* Map Display Canvas */}
          <div className="map-canvas-container">
            <iframe
              src={currentIframeSrc}
              title="One Piece World Map"
              className="map-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setIframeError(true)}
            />

            {/* Tactical Distress Signals Drawer */}
            {showTacticalDrawer && (
              <aside className="map-tactical-drawer" aria-label="Active distress signals">
                <div className="map-drawer-header">
                  <div className="map-drawer-title">
                    <ShieldAlert size={15} className="text-[#bd3c32]" />
                    <span>Distress Telemetry ({activeEmergencies.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTacticalDrawer(false)}
                    className="map-drawer-close"
                    aria-label="Close signals drawer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="map-drawer-list">
                  {activeEmergencies.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b", fontSize: "12px" }}>
                      No active distress signals in queue.
                    </div>
                  ) : (
                    activeEmergencies.map((e) => {
                      const score = priorityScore(e, currentTime);
                      const waitMins = Math.max(0, Math.floor((currentTime - e.createdAt) / 60000));
                      return (
                        <div key={e.id} className="map-signal-card">
                          <div className="map-signal-top">
                            <span className="map-signal-id">{e.id}</span>
                            <span className={`map-signal-priority map-priority-${e.severity}`}>
                              {score} PTS · {e.severity}
                            </span>
                          </div>

                          <div className="map-signal-name">{e.type}</div>

                          <div className="map-signal-loc">
                            <MapPin size={12} className="text-[#bd3c32] shrink-0" />
                            <span>
                              <b>{e.island}</b> · {e.sector}
                            </span>
                          </div>

                          <div className="map-signal-footer">
                            <span className="map-signal-wait">Waiting: {waitMins}m</span>
                            <Link
                              href={`/dashboard?island=${encodeURIComponent(e.island)}`}
                              className="map-signal-link"
                            >
                              <span>Coordinate</span>
                              <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="map-drawer-footer">
                  <Link
                    href="/request"
                    className="map-tool-btn cta-sos"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <Radio size={13} />
                    <span>TRANSMIT NEW SOS</span>
                  </Link>
                </div>
              </aside>
            )}

            {/* Error Fallback */}
            {iframeError && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(247, 237, 214, 0.95)",
                  padding: "20px",
                  textAlign: "center"
                }}
              >
                <div style={{ maxWidth: "420px" }}>
                  <Compass size={36} className="text-[#bd3c32] mx-auto mb-2" />
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: "0 0 6px" }}>
                    Cartography Connection Notice
                  </h3>
                  <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px" }}>
                    Your browser sandbox restricted iframe rendering. Open the authentic Library of Ohara chart directly:
                  </p>
                  <a
                    href="https://thelibraryofohara.com/onepieceworldmap/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-tool-btn cta-sos"
                    style={{ display: "inline-flex" }}
                  >
                    <span>Launch Library of Ohara</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Corner Pirate HUD Controls */}
      <div className="landing-frame" aria-hidden="true">
        <img src="/landing-command-frame-transparent.png" alt="" />
      </div>
      <nav className="frame-controls map-frame-controls" aria-label="Map page controls">
        <Link href="/dashboard" className="frame-button frame-dashboard">
          DASHBOARD
        </Link>
        <Link href="/map" className="frame-button frame-contact">
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

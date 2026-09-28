"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  const [mapSource, setMapSource] = useState<"onepieceworldmap" | "ohara">("onepieceworldmap");
  const [iframeError, setIframeError] = useState(false);

  // Active emergencies sorted by priority
  const activeEmergencies = emergencies
    .filter((e) => e.status !== "resolved")
    .sort((a, b) => priorityScore(b, currentTime) - priorityScore(a, currentTime));

  const currentIframeSrc =
    mapSource === "onepieceworldmap"
      ? "https://onepieceworldmap.com/"
      : "https://thelibraryofohara.com/onepieceworldmap/";

  return (
    <div className="map-page crew-page flex h-screen flex-col text-foreground overflow-hidden">
      <OceanBackground />

      {/* Minimal Map Control Header Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Grand Line Cartography
            </span>
          </div>

          {/* Engine Source Selector */}
          <div className="hidden md:flex items-center rounded-md border border-border bg-background p-0.5 text-xs">
            <button
              type="button"
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                mapSource === "onepieceworldmap"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMapSource("onepieceworldmap")}
            >
              Interactive Map
            </button>
            <button
              type="button"
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                mapSource === "ohara"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMapSource("ohara")}
            >
              Library of Ohara
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showTacticalDrawer
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-secondary"
            }`}
            onClick={() => setShowTacticalDrawer(!showTacticalDrawer)}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>
              {showTacticalDrawer ? "Hide Signals" : `Signals (${activeEmergencies.length})`}
            </span>
          </button>

          <a
            href="https://thelibraryofohara.com/onepieceworldmap/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            title="Open original map in new window"
          >
            <span>Full View</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Map View & Side Drawer */}
      <div className="relative flex-1 w-full bg-background overflow-hidden">
        <iframe
          src={currentIframeSrc}
          title="One Piece World Map"
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setIframeError(true)}
        />

        {/* Minimal Floating Drawer for Active Signals */}
        {showTacticalDrawer && (
          <aside className="absolute right-0 top-0 bottom-0 z-30 w-full sm:w-88 border-l border-border bg-card p-5 shadow-xl flex flex-col text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Active Distress Signals</h3>
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground p-1"
                onClick={() => setShowTacticalDrawer(false)}
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Sorted by dynamic priority score (severity + elapsed wait time).
            </p>

            <div className="mt-4 flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {activeEmergencies.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No active emergencies at this time.
                </div>
              ) : (
                activeEmergencies.map((e) => {
                  const score = priorityScore(e, currentTime);
                  const waitMins = Math.max(0, Math.floor((currentTime - e.createdAt) / 60000));
                  return (
                    <div
                      key={e.id}
                      className="rounded-md border border-border bg-background p-3.5 text-sm shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
                        <span className="font-bold text-xs text-primary">Priority: {score}</span>
                      </div>

                      <div className="font-semibold text-foreground">{e.type}</div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{e.island} • {e.sector}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2 mt-1">
                        <span>Waiting: <b>{waitMins} min</b></span>
                        <Link
                          href={`/dashboard?island=${encodeURIComponent(e.island)}`}
                          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>Coordinate</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <Link
                href="/request"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Radio className="h-4 w-4" />
                <span>Transmit SOS Signal</span>
              </Link>
            </div>
          </aside>
        )}

        {/* Fallback Notice */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-6 text-center">
            <div className="max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
              <Compass className="mx-auto h-10 w-10 text-primary mb-3" />
              <h3 className="text-lg font-bold text-foreground">Map Embedding Notice</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                If the interactive cartography is restricted by your browser sandbox, you can open the original One Piece map directly:
              </p>
              <a
                href="https://thelibraryofohara.com/onepieceworldmap/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <span>Launch Library of Ohara Map</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

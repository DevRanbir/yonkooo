"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  ShipWheel,
  UserCheck
} from "lucide-react";
import { useDispatch } from "./dispatch-provider";
import {
  priorityScore,
  statusLabel,
  severityPoints,
  severityAgingFactor,
  rescueArmadaCrews,
  type Emergency,
  type Severity
} from "../lib/types";

export function EmergencyCard({
  emergency,
  compact = false,
  onFilterIsland
}: {
  emergency: Emergency;
  compact?: boolean;
  onFilterIsland?: (island: string) => void;
}) {
  const { claim, advance, resolve, currentTime } = useDispatch();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCrewSelect, setShowCrewSelect] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const score = priorityScore(emergency, currentTime);
  const elapsedMinutes = Math.max(0, Math.floor((currentTime - emergency.createdAt) / 60000));
  const basePoints = severityPoints[emergency.severity];
  const agingFactor = severityAgingFactor[emergency.severity] ?? 2.0;
  const agingPoints = Math.floor(elapsedMinutes * agingFactor);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolve(emergency.id, resolutionNotes);
    setShowResolveModal(false);
  };

  const getSeverityStyle = (s: Severity) => {
    switch (s) {
      case "critical":
        return "border-destructive/30 bg-destructive/10 text-destructive";
      case "high":
        return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "medium":
        return "border-primary/30 bg-primary/10 text-primary";
      case "low":
      default:
        return "border-border bg-secondary text-muted-foreground";
    }
  };

  return (
    <>
      <article className="rounded-md border border-border bg-card p-5 text-card-foreground shadow-xs transition-shadow hover:shadow-sm">
        {/* Top: Severity Badge, ID, Priority Score */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${getSeverityStyle(
                emergency.severity
              )}`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{emergency.severity}</span>
            </span>
            <span className="font-mono text-sm text-muted-foreground">{emergency.id}</span>
          </div>

          <div
            className="flex items-center gap-2 rounded border border-border bg-background px-3 py-1 text-sm"
            title={`Base (${basePoints} pts) + Waiting aging (${agingPoints} pts)`}
          >
            <span className="text-muted-foreground text-xs uppercase font-medium">
              Priority
            </span>
            <span className="font-bold text-base text-primary">{score}</span>
          </div>
        </div>

        {/* Title & Location */}
        <div className="mt-3">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {emergency.type}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors text-left"
              onClick={() => onFilterIsland && onFilterIsland(emergency.island)}
              title={`Filter by ${emergency.island}`}
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{emergency.island}</span>
              <span>— {emergency.sector}</span>
            </button>

            {emergency.denDenFrequency && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Radio className="h-3.5 w-3.5" />
                <span>Freq: {emergency.denDenFrequency}</span>
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {!compact && emergency.description && (
          <p className="mt-3 text-sm text-foreground/85 leading-relaxed bg-background/50 p-3 rounded border border-border/60">
            {emergency.description}
          </p>
        )}

        {/* Telemetry Row: Waiting Time & Responding Fleet */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              <span>
                Waiting: <b className="text-foreground">{elapsedMinutes} min</b>
              </span>
              {agingPoints > 0 && (
                <span className="text-xs font-semibold text-primary">
                  (+{agingPoints} aging)
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5">
              <ShipWheel className="h-4 w-4" />
              <span>
                Fleet:{" "}
                <b className="text-foreground">
                  {emergency.team || "Unassigned"}
                </b>
              </span>
            </div>
          </div>

          {/* Operational Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-medium text-muted-foreground">
              Status:
            </span>
            <span
              className={`text-sm font-semibold capitalize ${
                emergency.status === "resolved"
                  ? "text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"
                  : "text-primary"
              }`}
            >
              {emergency.status === "resolved" && <CheckCircle2 className="h-4 w-4" />}
              {statusLabel[emergency.status]}
            </span>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            Reported by: <span className="text-foreground font-medium">{emergency.callerName}</span>
          </span>

          <div className="flex items-center gap-2">
            {emergency.status === "queued" && (
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
                  onClick={() => setShowCrewSelect(!showCrewSelect)}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Assign Team</span>
                </button>

                {showCrewSelect && (
                  <div className="absolute right-0 bottom-full mb-2 w-72 rounded-md border border-border bg-popover p-2 shadow-lg z-30">
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                      Select Response Team
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {rescueArmadaCrews.map((crew) => (
                        <button
                          key={crew.id}
                          type="button"
                          className="flex flex-col text-left rounded px-2.5 py-2 text-sm hover:bg-secondary transition-colors"
                          onClick={() => {
                            claim(emergency.id, crew.name);
                            setShowCrewSelect(false);
                          }}
                        >
                          <span className="font-semibold text-foreground">{crew.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Lead: {crew.captain} • {crew.ship}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {emergency.status !== "queued" && emergency.status !== "resolved" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  onClick={() => advance(emergency.id)}
                  title="Advance to next operational stage"
                >
                  <span>Advance Stage</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                  onClick={() => setShowResolveModal(true)}
                  title="Mark emergency as resolved"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Resolve</span>
                </button>
              </div>
            )}

            {emergency.status === "resolved" && emergency.resolutionNotes && (
              <p className="text-xs text-muted-foreground italic max-w-md truncate">
                &ldquo;{emergency.resolutionNotes}&rdquo;
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Clean Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-xl text-card-foreground">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-lg font-bold">Case Resolution Report</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Record mission notes for case <b className="text-foreground">{emergency.id}</b> ({emergency.island}).
            </p>

            <form onSubmit={handleResolveSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Resolution Summary & Action Taken
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Describe medical treatment, evacuations completed, and current sector condition..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

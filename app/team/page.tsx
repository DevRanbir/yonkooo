"use client";

import {
  Ambulance,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  Radio,
  ShieldCheck,
  ShipWheel,
  UserCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { OceanBackground } from "../../components/ocean-background";
import { useDispatch } from "../../components/dispatch-provider";
import { rescueArmadaCrews, statusLabel, type Status } from "../../lib/types";

const nextStatus: Record<Status, Status> = {
  queued: "assigned",
  assigned: "dispatched",
  dispatched: "arrived",
  arrived: "in_progress",
  in_progress: "resolved",
  resolved: "resolved"
};

const steps: Status[] = ["assigned", "dispatched", "arrived", "in_progress", "resolved"];

export default function TeamPage() {
  const { emergencies, advance } = useDispatch();

  // Find active assignment for Chopper's armada or first active assigned emergency
  const active = emergencies.find(
    (e) => (e.team?.toLowerCase().includes("chopper") || e.status !== "queued") && e.status !== "resolved"
  );

  return (
    <div className="crew-page team-page text-foreground">
      <OceanBackground />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
              <ShipWheel className="h-4 w-4" />
              <span>GRAND LINE MEDICAL FLEET</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Rescue Armada & Response Teams
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor active emergency deployments, operational dispatch pipelines, and vessel readiness.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <span>Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Current Active Assignment */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Active Deployment
          </h2>

          {active ? (
            <div className="rounded-md border border-border bg-card p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary uppercase">
                    Active Mission
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">{active.id}</span>
                </div>

                <span className="text-sm font-semibold text-primary">
                  Status: {statusLabel[active.status]}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold text-foreground">{active.type}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{active.island}</span>
                  <span>— {active.sector}</span>
                </div>
                {active.description && (
                  <p className="mt-2 text-sm text-foreground/85 leading-relaxed bg-background/50 p-3 rounded border border-border/60">
                    {active.description}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShipWheel className="h-4 w-4 text-primary" />
                  <span>
                    Responding Armada: <b className="text-foreground">{active.team || "Chopper Medical Flagship"}</b>
                  </span>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
                  onClick={() => advance(active.id)}
                >
                  <span>Advance to {statusLabel[nextStatus[active.status]]}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card p-8 text-center shadow-xs">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              <h3 className="mt-2 text-base font-semibold text-foreground">
                All Current Distress Signals Handled
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No active missions currently in progress. Response crews are on standby.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <span>View Command Queue</span>
              </Link>
            </div>
          )}
        </section>

        {/* Operational Dispatch Lifecycle Stages */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Standard Dispatch Lifecycle
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {steps.map((stepKey, idx) => {
              const isPastOrCurrent = active ? steps.indexOf(active.status) >= idx : false;
              const isCurrent = active ? active.status === stepKey : false;

              return (
                <div
                  key={stepKey}
                  className={`rounded-md border p-4 text-center transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : isPastOrCurrent
                      ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Stage {idx + 1}
                  </div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {statusLabel[stepKey]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Response Forces Roster */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Allied Medical Armadas & Squadrons
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rescueArmadaCrews.map((crew) => {
              const assignedCase = emergencies.find(
                (e) => e.team === crew.name && e.status !== "resolved"
              );

              return (
                <div
                  key={crew.id}
                  className="rounded-md border border-border bg-card p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-muted-foreground">{crew.id}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          assignedCase
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {assignedCase ? "Deployed" : "Available"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground">{crew.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lead: <span className="text-foreground font-medium">{crew.captain}</span> • {crew.ship}
                    </p>

                    <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                      {crew.specialty}
                    </p>
                  </div>

                  {assignedCase && (
                    <div className="mt-4 border-t border-border pt-3 text-xs text-primary font-medium">
                      Mission: {assignedCase.id} ({assignedCase.island})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

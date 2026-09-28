"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Clock,
  Compass,
  Filter,
  History,
  Layers,
  MapPin,
  PlusCircle,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShipWheel,
  Zap
} from "lucide-react";
import { OceanBackground } from "../../components/ocean-background";
import { EmergencyCard } from "../../components/emergency-card";
import { useDispatch } from "../../components/dispatch-provider";
import { priorityScore, grandLineIslands, rescueArmadaCrews } from "../../lib/types";

export default function DashboardPage() {
  const { emergencies, currentTime, simulateIncomingSOS } = useDispatch();
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
  const [islandFilter, setIslandFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [simulationAlert, setSimulationAlert] = useState<string | null>(null);

  // Active Queue (unresolved cases sorted by Dynamic Priority Score descending)
  const activeQueue = useMemo(() => {
    return [...emergencies]
      .filter((e) => e.status !== "resolved")
      .sort((a, b) => priorityScore(b, currentTime) - priorityScore(a, currentTime));
  }, [emergencies, currentTime]);

  // Resolved History
  const resolvedHistory = useMemo(() => {
    return [...emergencies]
      .filter((e) => e.status === "resolved")
      .sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0));
  }, [emergencies]);

  // Filtered List based on search and filters
  const currentList = activeTab === "queue" ? activeQueue : resolvedHistory;
  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      const matchesIsland = islandFilter === "ALL" || item.island === islandFilter;
      const matchesSeverity = severityFilter === "ALL" || item.severity === severityFilter;
      const matchesSearch =
        searchQuery === "" ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.island.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.team && item.team.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesIsland && matchesSeverity && matchesSearch;
    });
  }, [currentList, islandFilter, severityFilter, searchQuery]);

  // Metrics
  const criticalCount = activeQueue.filter((e) => e.severity === "critical").length;
  const avgWaitMinutes =
    activeQueue.length > 0
      ? Math.round(
          activeQueue.reduce((acc, curr) => acc + (currentTime - curr.createdAt) / 60000, 0) /
            activeQueue.length
        )
      : 0;

  const handleSimulate = () => {
    const sim = simulateIncomingSOS();
    setSimulationAlert(`Incoming distress beacon ${sim.id} received from ${sim.island}!`);
    setTimeout(() => setSimulationAlert(null), 5000);
  };

  return (
    <div className="crew-page dashboard-page text-foreground">
      <OceanBackground />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
              <Radio className="h-4 w-4" />
              <span>GRAND LINE DISPATCH NETWORK</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Emergency Command Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dynamic triage and coordination for incoming distress calls. Priority automatically ages over time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-secondary transition-colors"
              onClick={handleSimulate}
              title="Simulate an incoming distress call"
            >
              <Zap className="h-4 w-4 text-primary" />
              <span>Simulate Incoming SOS</span>
            </button>

            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-secondary transition-colors"
            >
              <Compass className="h-4 w-4 text-primary" />
              <span>World Map</span>
            </Link>

            <Link
              href="/request"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Submit Request</span>
            </Link>
          </div>
        </div>

        {/* Live Simulation Alert */}
        {simulationAlert && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            <div className="flex items-center gap-2 font-medium">
              <Zap className="h-4 w-4" />
              <span>{simulationAlert}</span>
            </div>
            <button
              type="button"
              className="text-primary hover:opacity-80 font-bold"
              onClick={() => setSimulationAlert(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Metrics Grid */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-md border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Active Requests</span>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{activeQueue.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting or in active response</p>
          </div>

          <div className="rounded-md border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Critical Cases</span>
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <p className="mt-3 text-3xl font-bold text-destructive">{criticalCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Immediate deployment needed</p>
          </div>

          <div className="rounded-md border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Avg Waiting Time</span>
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{avgWaitMinutes} min</p>
            <p className="mt-1 text-xs text-muted-foreground">Across all queued signals</p>
          </div>

          <div className="rounded-md border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Resolved Missions</span>
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{resolvedHistory.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Successfully closed cases</p>
          </div>
        </section>

        {/* Main Content Layout: Queue and Sidebar */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Queue Column (2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Tabs and Real-Time Aging Note */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "queue"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("queue")}
                >
                  <Layers className="h-4 w-4" />
                  <span>Active Queue ({activeQueue.length})</span>
                </button>

                <button
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "history"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("history")}
                >
                  <History className="h-4 w-4" />
                  <span>Resolved History ({resolvedHistory.length})</span>
                </button>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Priority aging rate: +2.5 pts / min</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by ID, sector, island, type, or crew..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-input bg-card pl-9 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm font-bold"
                    onClick={() => setSearchQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={islandFilter}
                  onChange={(e) => setIslandFilter(e.target.value)}
                  className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by Island"
                >
                  <option value="ALL">All Islands</option>
                  {grandLineIslands.map((isle) => (
                    <option key={isle.name} value={isle.name}>
                      {isle.name}
                    </option>
                  ))}
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by Severity"
                >
                  <option value="ALL">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {(islandFilter !== "ALL" || severityFilter !== "ALL" || searchQuery) && (
                  <button
                    type="button"
                    className="rounded-md px-3 py-2 text-xs font-medium text-primary hover:bg-secondary transition-colors"
                    onClick={() => {
                      setIslandFilter("ALL");
                      setSeverityFilter("ALL");
                      setSearchQuery("");
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* List of Emergency Cards */}
            <div className="flex flex-col gap-4">
              {filteredList.length === 0 ? (
                <div className="rounded-md border border-border bg-card p-12 text-center text-card-foreground">
                  <Compass className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    No emergency requests found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search query or filters, or simulate an incoming signal.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    onClick={handleSimulate}
                  >
                    <Zap className="h-4 w-4" />
                    <span>Simulate Incoming SOS</span>
                  </button>
                </div>
              ) : (
                filteredList.map((item) => (
                  <EmergencyCard
                    key={item.id}
                    emergency={item}
                    onFilterIsland={(isle) => setIslandFilter(isle)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar: Fleet Readiness & Sector Overview */}
          <div className="flex flex-col gap-6">
            {/* Quick Map Link Card */}
            <div className="rounded-md border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                  <Compass className="h-5 w-5 text-primary" />
                  <span>Grand Line World Map</span>
                </div>
                <Link
                  href="/map"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View Full Map →
                </Link>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cartographic overview of all island sectors, weather zones, and active distress beacons across Paradise and the New World.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {grandLineIslands.map((isle) => {
                  const count = activeQueue.filter((e) => e.island === isle.name).length;
                  return (
                    <button
                      key={isle.name}
                      type="button"
                      className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                      onClick={() => setIslandFilter(isle.name)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{isle.name}</span>
                        <span className="text-xs text-muted-foreground">({isle.sea})</span>
                      </div>
                      {count > 0 ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {count} active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Clear</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Response Forces Status */}
            <div className="rounded-md border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                  <ShipWheel className="h-5 w-5 text-primary" />
                  <span>Response Forces</span>
                </div>
                <Link
                  href="/team"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Manage Teams →
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {rescueArmadaCrews.map((crew) => {
                  const assignedCase = activeQueue.find((e) => e.team === crew.name);
                  return (
                    <div
                      key={crew.id}
                      className="rounded border border-border/80 bg-background/60 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{crew.name}</span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            assignedCase
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {assignedCase ? "Deployed" : "Available"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Lead: {crew.captain} • {crew.ship}
                      </p>
                      {assignedCase && (
                        <p className="mt-1.5 text-xs text-primary font-medium">
                          Active: {assignedCase.id} ({assignedCase.island})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

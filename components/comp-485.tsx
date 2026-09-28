"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Compass,
  EllipsisIcon,
  FastForward,
  FilterIcon,
  Info,
  MapPinIcon,
  RadioIcon,
  SearchIcon,
  ShieldAlert,
  ShieldAlertIcon,
  ShipWheel,
  Trash2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDispatch } from "./dispatch-provider";
import { rescueArmadaCrews, type Severity } from "@/lib/types";

type DispatchStatus = "Awaiting crew" | "In transit" | "Stabilized";
type Priority = "Critical" | "High" | "Medium" | "Low";
type Dispatch = {
  id: string;
  incident: string;
  island: string;
  sector: string;
  islandName: string;
  channel: string;
  priority: Priority;
  severityRaw: Severity;
  status: DispatchStatus;
  crew: string;
  waiting: string;
  rawStatus: string;
  callerName?: string;
  description?: string;
};

export default function DispatchTable() {
  const {
    emergencies,
    currentTime,
    advance,
    claim,
    resolve,
    updateSeverity,
    removeEmergency
  } = useDispatch();

  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<DispatchStatus[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<Dispatch | null>(null);

  // Map real-time emergencies from Firebase into table dispatches with strict deduplication
  const dispatches = useMemo<Dispatch[]>(() => {
    const seen = new Set<string>();
    const unique = emergencies.filter((e) => {
      const key = e.id || e.firebaseKey;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.map((e) => {
      const waitMins = Math.max(0, Math.floor((currentTime - e.createdAt) / 60000));
      const statusFormatted: DispatchStatus =
        e.status === "queued"
          ? "Awaiting crew"
          : e.status === "resolved"
          ? "Stabilized"
          : "In transit";

      const sev = e.severity || "medium";
      const priorityFormatted: Priority = (
        sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase()
      ) as Priority;

      return {
        id: e.id,
        incident: e.type,
        island: `${e.island} · ${e.sector}`,
        islandName: e.island,
        sector: e.sector,
        channel: e.denDenFrequency || "108.4 MHz",
        priority: priorityFormatted,
        severityRaw: sev,
        status: statusFormatted,
        crew: e.team || "Unassigned",
        waiting: `${waitMins} min`,
        rawStatus: e.status,
        callerName: e.callerName,
        description: e.description
      };
    });
  }, [emergencies, currentTime]);

  const visibleDispatches = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return dispatches.filter(
      (dispatch) =>
        (!normalizedQuery ||
          `${dispatch.id} ${dispatch.incident} ${dispatch.island}`
            .toLowerCase()
            .includes(normalizedQuery)) &&
        (!selectedStatuses.length || selectedStatuses.includes(dispatch.status))
    );
  }, [dispatches, query, selectedStatuses]);

  const toggleStatus = (status: DispatchStatus) =>
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status]
    );

  const toggleRow = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const toggleAll = () =>
    setSelected(
      selected.length === visibleDispatches.length ? [] : visibleDispatches.map(({ id }) => id)
    );

  return (
    <div className="dispatch-log">
      <header className="dispatch-log__heading">
        <div>
          <p className="dispatch-log__eyebrow">
            <RadioIcon size={13} /> channel 01 · live dispatches
          </p>
          <h1>Grand Line Dispatch Log</h1>
          <p className="dispatch-log__subtitle">
            Prioritize every signal before it fades below the horizon.
          </p>
        </div>
        <Link className="dispatch-log__sos" href="/request">
          <ShieldAlertIcon size={16} /> Transmit SOS
        </Link>
      </header>

      <div className="dispatch-log__toolbar">
        <div className="dispatch-log__search">
          <SearchIcon size={16} />
          <Input
            aria-label="Search dispatches"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a signal, island, or SOS ID…"
            value={query}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="dispatch-log__filter" variant="outline">
              <FilterIcon size={15} /> Status{" "}
              {selectedStatuses.length > 0 && <span>{selectedStatuses.length}</span>}
              <ChevronDownIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="dispatch-log__menu">
            <DropdownMenuLabel>Filter transmissions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["Awaiting crew", "In transit", "Stabilized"] as DispatchStatus[]).map((status) => (
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes(status)}
                key={status}
                onCheckedChange={() => toggleStatus(status)}
                onSelect={(event) => event.preventDefault()}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="dispatch-log__count">
          <span /> {visibleDispatches.length} signals on frequency
        </p>
      </div>

      <div className="dispatch-log__table-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="dispatch-log__checkbox">
                <Checkbox
                  aria-label="Select all signals"
                  checked={
                    visibleDispatches.length > 0 && selected.length === visibleDispatches.length
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Signal / incident</TableHead>
              <TableHead>Island sector</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rescue crew</TableHead>
              <TableHead>Waiting</TableHead>
              <TableHead style={{ width: 44, textAlign: "center" }}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDispatches.length > 0 ? (
              visibleDispatches.map((dispatch) => (
                <TableRow
                  data-state={selected.includes(dispatch.id) ? "selected" : undefined}
                  key={dispatch.id}
                >
                  <TableCell className="dispatch-log__checkbox">
                    <Checkbox
                      aria-label={`Select ${dispatch.id}`}
                      checked={selected.includes(dispatch.id)}
                      onCheckedChange={() => toggleRow(dispatch.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="dispatch-log__id">
                      {dispatch.id} <RadioIcon size={12} /> {dispatch.channel}
                    </p>
                    <p className="dispatch-log__incident">{dispatch.incident}</p>
                  </TableCell>
                  <TableCell>
                    <span className="dispatch-log__island">
                      <MapPinIcon size={14} /> {dispatch.island}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={dispatch.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={dispatch.status} />
                  </TableCell>
                  <TableCell className="dispatch-log__crew">{dispatch.crew}</TableCell>
                  <TableCell className="dispatch-log__wait">{dispatch.waiting}</TableCell>
                  <TableCell style={{ textAlign: "center", padding: "0 6px" }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Open ${dispatch.id} actions`}
                          className="dispatch-log__more"
                          size="icon"
                          variant="ghost"
                          style={{ cursor: "pointer" }}
                        >
                          <EllipsisIcon size={17} />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="dispatch-log__menu w-56">
                        <DropdownMenuLabel
                          className="font-mono text-[10px] tracking-wider uppercase"
                          style={{ color: "#a82f2b" }}
                        >
                          Actions · {dispatch.id}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Advance Mission Status */}
                        <DropdownMenuItem
                          onClick={() => advance(dispatch.id)}
                          style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}
                        >
                          <FastForward size={14} style={{ color: "#0284c7" }} />
                          <span>Advance Mission Stage</span>
                        </DropdownMenuItem>

                        {/* Assign Response Armada */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}
                          >
                            <ShipWheel size={14} style={{ color: "#a8793b" }} />
                            <span>Assign Rescue Armada</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="dispatch-log__menu w-64">
                            {rescueArmadaCrews.map((crew) => (
                              <DropdownMenuItem
                                key={crew.id}
                                onClick={() => claim(dispatch.id, crew.name)}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  gap: "8px",
                                  alignItems: "center",
                                  fontSize: "12px"
                                }}
                              >
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor: crew.badgeColor,
                                    flexShrink: 0
                                  }}
                                />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {crew.name}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        {/* Set Severity Tier */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}
                          >
                            <ShieldAlert size={14} style={{ color: "#d97706" }} />
                            <span>Set Urgency Tier</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="dispatch-log__menu w-44">
                            {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => (
                              <DropdownMenuItem
                                key={sev}
                                onClick={() => updateSeverity(dispatch.id, sev)}
                                style={{
                                  cursor: "pointer",
                                  textTransform: "uppercase",
                                  fontFamily: "'DM Mono', monospace",
                                  fontSize: "11px",
                                  fontWeight: 700
                                }}
                              >
                                <span>{sev}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        {/* Mark Stabilized / Resolved */}
                        <DropdownMenuItem
                          onClick={() => resolve(dispatch.id)}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            color: "#10b981",
                            fontWeight: 600
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Mark as Stabilized</span>
                        </DropdownMenuItem>

                        {/* Coordinate on World Map */}
                        <DropdownMenuItem asChild style={{ cursor: "pointer" }}>
                          <Link
                            href="/map"
                            style={{ display: "flex", gap: "8px", alignItems: "center" }}
                          >
                            <Compass size={14} style={{ color: "#0284c7" }} />
                            <span>Plot on World Map</span>
                          </Link>
                        </DropdownMenuItem>

                        {/* View Full Incident Description */}
                        {dispatch.description && (
                          <DropdownMenuItem
                            onClick={() => setDetailModalItem(dispatch)}
                            style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}
                          >
                            <Info size={14} style={{ color: "#64748b" }} />
                            <span>View Incident Details</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* Dismiss / Delete Transmission */}
                        <DropdownMenuItem
                          onClick={() => removeEmergency(dispatch.id)}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            color: "#dc2626",
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Dismiss Transmission</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="dispatch-log__empty"
                  colSpan={8}
                  style={{
                    padding: "48px 16px",
                    textAlign: "center",
                    color: "#526066"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <RadioIcon size={24} style={{ opacity: 0.5, color: "#a8793b" }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#172b31" }}>
                      No distress signals on this frequency.
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#786e61" }}>
                      Transmit an emergency signal to broadcast coordinates to the armada.
                    </p>
                    <Link
                      href="/request"
                      className="dispatch-log__sos"
                      style={{ marginTop: "8px", padding: "6px 12px", fontSize: "10px" }}
                    >
                      <ShieldAlertIcon size={14} /> Transmit First SOS
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <footer className="dispatch-log__footer">
        <p>
          {selected.length
            ? `${selected.length} signal${selected.length > 1 ? "s" : ""} selected`
            : visibleDispatches.length === 0
            ? "Network idle · Zero active dispatches in database"
            : "Signals synced with Firebase in real time"}
        </p>
        <div>
          <Button aria-label="Previous page" disabled size="icon" variant="outline">
            <ChevronLeftIcon size={16} />
          </Button>
          <span>1 / 1</span>
          <Button aria-label="Next page" disabled size="icon" variant="outline">
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </footer>

      {/* Incident Details Modal Popup */}
      {detailModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(4, 15, 25, 0.65)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setDetailModalItem(null)}
        >
          <div
            style={{
              backgroundColor: "#fdf8ee",
              backgroundImage: "linear-gradient(180deg, #fdf9ee 0%, #f7edd6 100%)",
              border: "2px solid #a8793b",
              borderRadius: "6px",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.4)",
              maxWidth: "520px",
              width: "100%",
              padding: "20px",
              color: "#172b31",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", borderBottom: "1.5px solid rgba(168, 121, 59, 0.35)", paddingBottom: "10px" }}>
              <div>
                <span style={{ font: "800 10px 'DM Mono', monospace", color: "#a82f2b", letterSpacing: "1px", textTransform: "uppercase" }}>
                  TRANSMISSION LOG · {detailModalItem.id}
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: 800, margin: "4px 0 0" }}>
                  {detailModalItem.incident}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px", fontSize: "12px" }}>
              <div style={{ background: "rgba(255, 252, 244, 0.8)", padding: "8px 10px", borderRadius: "4px", border: "1px solid rgba(168, 121, 59, 0.3)" }}>
                <span style={{ font: "700 9.5px 'DM Mono', monospace", color: "#8a5828", display: "block" }}>COORDINATES</span>
                <span style={{ fontWeight: 600 }}>{detailModalItem.island}</span>
              </div>
              <div style={{ background: "rgba(255, 252, 244, 0.8)", padding: "8px 10px", borderRadius: "4px", border: "1px solid rgba(168, 121, 59, 0.3)" }}>
                <span style={{ font: "700 9.5px 'DM Mono', monospace", color: "#8a5828", display: "block" }}>TRANSPONDER FREQ</span>
                <span style={{ fontWeight: 600 }}>{detailModalItem.channel}</span>
              </div>
              <div style={{ background: "rgba(255, 252, 244, 0.8)", padding: "8px 10px", borderRadius: "4px", border: "1px solid rgba(168, 121, 59, 0.3)" }}>
                <span style={{ font: "700 9.5px 'DM Mono', monospace", color: "#8a5828", display: "block" }}>REPORTING CALLER</span>
                <span style={{ fontWeight: 600 }}>{detailModalItem.callerName || "Unknown Civilian"}</span>
              </div>
              <div style={{ background: "rgba(255, 252, 244, 0.8)", padding: "8px 10px", borderRadius: "4px", border: "1px solid rgba(168, 121, 59, 0.3)" }}>
                <span style={{ font: "700 9.5px 'DM Mono', monospace", color: "#8a5828", display: "block" }}>DEPLOYED ARMADA</span>
                <span style={{ fontWeight: 600 }}>{detailModalItem.crew}</span>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ font: "700 10px 'DM Mono', monospace", color: "#8a5828", display: "block", marginBottom: "4px" }}>
                MEDICAL / SITUATION DETAILS
              </span>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", background: "rgba(255, 252, 244, 0.95)", padding: "10px", borderRadius: "4px", border: "1px solid rgba(168, 121, 59, 0.3)" }}>
                {detailModalItem.description || "No additional description provided in initial broadcast."}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                style={{
                  background: "#bd3c32",
                  color: "#ffffff",
                  border: "1px solid #932d27",
                  borderRadius: "4px",
                  padding: "7px 14px",
                  font: "800 11px 'DM Mono', monospace",
                  cursor: "pointer"
                }}
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={`dispatch-log__priority dispatch-log__priority--${priority.toLowerCase()}`}>
      {priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: DispatchStatus }) {
  return (
    <span
      className={`dispatch-log__status dispatch-log__status--${status
        .replaceAll(" ", "-")
        .toLowerCase()}`}
    >
      <i />
      {status}
    </span>
  );
}

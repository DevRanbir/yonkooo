"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Emergency, Severity, Status } from "../lib/types";
import { priorityScore, rescueArmadaCrews } from "../lib/types";

const seedEmergencies: Emergency[] = [
  {
    id: "SOS-1824",
    type: "Blizzard Exposure & Hypothermia",
    island: "Drum Island",
    sector: "Big Horn Village Ridge",
    severity: "critical",
    description: "Avalanche struck civilian settlement. 7 victims trapped in sub-zero snow drift with severe hypothermia.",
    status: "queued",
    createdAt: Date.now() - 16 * 60000, // 16 minutes ago
    callerName: "Dalton (Civilian Guard)",
    denDenFrequency: "108.4 MHz"
  },
  {
    id: "SOS-1819",
    type: "Toxic Gas Containment Breach",
    island: "Punk Hazard",
    sector: "Research Lab Section C",
    severity: "critical",
    description: "Smiley chemical residue container ruptured. Toxic gas spreading towards coastline evacuation pier.",
    status: "assigned",
    team: "Heart Pirates Medical Submarine",
    claimedAt: Date.now() - 5 * 60000,
    createdAt: Date.now() - 9 * 60000, // 9 minutes ago
    callerName: "G-5 Marine Patrol Scout",
    denDenFrequency: "114.2 MHz"
  },
  {
    id: "SOS-1808",
    type: "Desert Sandstorm Fleet Stranded",
    island: "Alabasta",
    sector: "Yuba Desert Oasis Route",
    severity: "high",
    description: "Sandstorm buried caravan tracks. 32 merchants & pack animals stranded with under 4 hours of water remaining.",
    status: "queued",
    createdAt: Date.now() - 34 * 60000, // 34 minutes ago (high waiting time boosts priority!)
    callerName: "Kohza (Sand Governance)",
    denDenFrequency: "98.6 MHz"
  },
  {
    id: "SOS-1795",
    type: "Aqua Laguna Flood Evacuation",
    island: "Water 7",
    sector: "Lower Canal Station 3",
    severity: "high",
    description: "Tidal wave warning initiated. Lower residential quarter requires water-strider emergency fleet evacuation.",
    status: "dispatched",
    team: "Chopper's Medical Rescue Flagship",
    claimedAt: Date.now() - 20 * 60000,
    createdAt: Date.now() - 25 * 60000,
    callerName: "Galley-La Shipwright Dispatch",
    denDenFrequency: "104.8 MHz"
  },
  {
    id: "SOS-1772",
    type: "Sea King Attack on Civilian Vessel",
    island: "Fishman Island",
    sector: "Coral Hill Trench",
    severity: "medium",
    description: "Carnivorous Sea King damaged bubble coating of cargo brig. Hull integrity holding at 65%.",
    status: "in_progress",
    team: "Revolutionary Army Relief Squadron",
    claimedAt: Date.now() - 40 * 60000,
    createdAt: Date.now() - 52 * 60000,
    callerName: "Neptunian Royal Border Watch",
    denDenFrequency: "92.1 MHz"
  },
  {
    id: "SOS-1740",
    type: "Buster Call Collateral Trauma",
    island: "Dressrosa",
    sector: "Green Bit Shallow Straits",
    severity: "low",
    description: "Minor shrapnel injuries following offshore skirmish. All civilians stabilized; supplies replenished.",
    status: "resolved",
    team: "Doctor Kureha's Highland Snow Sleds",
    createdAt: Date.now() - 95 * 60000,
    claimedAt: Date.now() - 75 * 60000,
    resolvedAt: Date.now() - 30 * 60000,
    resolutionNotes: "Treated 14 minor lacerations with plum wine antiseptic and stabilized shock. Evacuated to harbor.",
    callerName: "Tontatta Patrol Unit",
    denDenFrequency: "102.5 MHz"
  }
];

interface DispatchContextValue {
  emergencies: Emergency[];
  currentTime: number;
  create: (input: Omit<Emergency, "id" | "createdAt" | "status">) => Emergency;
  claim: (id: string, teamName?: string) => void;
  advance: (id: string) => void;
  resolve: (id: string, notes?: string) => void;
  updateSeverity: (id: string, severity: Severity) => void;
  simulateIncomingSOS: () => Emergency;
  resetToSeed: () => void;
}

const DispatchContext = createContext<DispatchContextValue | null>(null);

export function DispatchProvider({ children }: { children: React.ReactNode }) {
  const [emergencies, setEmergencies] = useState<Emergency[]>(seedEmergencies);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ddm-emergencies-v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmergencies(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load saved emergencies", e);
    }
  }, []);

  // Save to localStorage whenever emergencies change
  useEffect(() => {
    try {
      localStorage.setItem("ddm-emergencies-v2", JSON.stringify(emergencies));
    } catch (e) {
      console.error("Failed to save emergencies", e);
    }
  }, [emergencies]);

  // Dynamic real-time timer: tick every 3 seconds to re-calculate waiting times and priorities
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo<DispatchContextValue>(() => ({
    emergencies,
    currentTime,

    create: (input) => {
      const newEmergency: Emergency = {
        ...input,
        id: `SOS-${Math.floor(1000 + Math.random() * 8999)}`,
        createdAt: Date.now(),
        status: "queued",
        denDenFrequency: input.denDenFrequency || "108.4 MHz"
      };
      setEmergencies((prev) => [newEmergency, ...prev]);
      return newEmergency;
    },

    claim: (id: string, teamName?: string) => {
      const selectedCrew = teamName || rescueArmadaCrews[0].name;
      setEmergencies((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "assigned",
                team: selectedCrew,
                claimedAt: Date.now(),
                updatedAt: Date.now()
              }
            : item
        )
      );
    },

    advance: (id: string) => {
      const nextStatusMap: Record<Status, Status> = {
        queued: "assigned",
        assigned: "dispatched",
        dispatched: "arrived",
        arrived: "in_progress",
        in_progress: "resolved",
        resolved: "resolved"
      };

      setEmergencies((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const next = nextStatusMap[item.status];
          return {
            ...item,
            status: next,
            updatedAt: Date.now(),
            resolvedAt: next === "resolved" ? Date.now() : item.resolvedAt,
            resolutionNotes:
              next === "resolved" && !item.resolutionNotes
                ? "Emergency stabilized and successfully resolved by Chopper's Medical Rescue Armada."
                : item.resolutionNotes
          };
        })
      );
    },

    resolve: (id: string, notes?: string) => {
      setEmergencies((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "resolved",
                resolvedAt: Date.now(),
                updatedAt: Date.now(),
                resolutionNotes:
                  notes || "Emergency fully resolved. Medical triage complete; casualties evacuated safely."
              }
            : item
        )
      );
    },

    updateSeverity: (id: string, severity: Severity) => {
      setEmergencies((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, severity, updatedAt: Date.now() }
            : item
        )
      );
    },

    simulateIncomingSOS: () => {
      const randomIslands = ["Drum Island", "Alabasta", "Punk Hazard", "Water 7", "Dressrosa"];
      const randomTypes = [
        "Blizzard Exposure & Hypothermia",
        "Toxic Gas Containment Breach",
        "Desert Sandstorm Fleet Stranded",
        "Aqua Laguna Flood Evacuation",
        "Avalanche Medical Search & Rescue"
      ];
      const randomSeverities: Severity[] = ["critical", "high", "medium"];
      
      const island = randomIslands[Math.floor(Math.random() * randomIslands.length)];
      const type = randomTypes[Math.floor(Math.random() * randomTypes.length)];
      const severity = randomSeverities[Math.floor(Math.random() * randomSeverities.length)];

      const simulated: Emergency = {
        id: `SOS-${Math.floor(2000 + Math.random() * 7999)}`,
        type,
        island,
        sector: `Sector ${Math.floor(1 + Math.random() * 8)} Alpha`,
        severity,
        description: `URGENT DISTRESS BROADCAST: Immediate relief required on ${island}. Den Den Mushi transmission received.`,
        status: "queued",
        createdAt: Date.now(),
        callerName: "Den Den Snail Relay",
        denDenFrequency: "108.4 MHz"
      };

      setEmergencies((prev) => [simulated, ...prev]);
      return simulated;
    },

    resetToSeed: () => {
      setEmergencies(seedEmergencies);
      try {
        localStorage.removeItem("ddm-emergencies-v2");
      } catch (e) {}
    }
  }), [emergencies, currentTime]);

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export const useDispatch = () => {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error("useDispatch must be used within a DispatchProvider");
  }
  return context;
};

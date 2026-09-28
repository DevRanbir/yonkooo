"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Emergency, Severity, Status } from "../lib/types";
import { rescueArmadaCrews } from "../lib/types";
import { realtimeDatabase } from "../lib/firebase";
import { onValue, push, ref, remove, set, update } from "firebase/database";

interface DispatchContextValue {
  emergencies: Emergency[];
  currentTime: number;
  create: (input: Omit<Emergency, "id" | "createdAt" | "status">) => Emergency;
  claim: (id: string, teamName?: string) => void;
  advance: (id: string) => void;
  resolve: (id: string, notes?: string) => void;
  updateSeverity: (id: string, severity: Severity) => void;
  removeEmergency: (id: string) => void;
  simulateIncomingSOS: () => Emergency;
  resetToSeed: () => void;
}

const DispatchContext = createContext<DispatchContextValue | null>(null);

export function DispatchProvider({ children }: { children: React.ReactNode }) {
  // Start with empty array - strictly no fake data if Firebase has no records!
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Real-time synchronization with Firebase Realtime Database
  useEffect(() => {
    try {
      const dispatchesRef = ref(realtimeDatabase, "dispatches");
      const unsubscribe = onValue(
        dispatchesRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            // Firebase has NO data -> emergencies is empty []!
            setEmergencies([]);
            return;
          }

          const data = snapshot.val();
          if (!data || typeof data !== "object") {
            setEmergencies([]);
            return;
          }

          const parsedList: Emergency[] = Object.entries(data).map(([key, val]: [string, any]) => {
            let createdAtNum = Date.now();
            if (typeof val.createdAt === "number") {
              createdAtNum = val.createdAt;
            } else if (typeof val.createdAt === "string") {
              const parsed = parseInt(val.createdAt, 10);
              if (!isNaN(parsed)) createdAtNum = parsed;
            }

            return {
              id: val.id || `SOS-${key.slice(-4).toUpperCase()}`,
              firebaseKey: key,
              type: val.type || "General Emergency",
              island: val.island || "Unknown Island",
              sector: val.sector || "Uncharted Sector",
              severity: (val.severity || "medium") as Severity,
              description: val.description || "",
              status: (val.status || "queued") as Status,
              createdAt: createdAtNum,
              updatedAt: typeof val.updatedAt === "number" ? val.updatedAt : undefined,
              claimedAt: typeof val.claimedAt === "number" ? val.claimedAt : undefined,
              resolvedAt: typeof val.resolvedAt === "number" ? val.resolvedAt : undefined,
              team: val.team,
              callerName: val.callerName,
              denDenFrequency: val.denDenFrequency || "108.4 MHz",
              resolutionNotes: val.resolutionNotes
            };
          });

          // Strictly deduplicate by firebaseKey and id
          const uniqueList: Emergency[] = [];
          const seen = new Set<string>();

          for (const item of parsedList) {
            const keyId = item.firebaseKey || item.id;
            if (!seen.has(keyId) && !seen.has(item.id)) {
              seen.add(keyId);
              seen.add(item.id);
              uniqueList.push(item);
            }
          }

          // Sort by creation time descending (newest first)
          uniqueList.sort((a, b) => b.createdAt - a.createdAt);
          setEmergencies(uniqueList);
        },
        (error) => {
          console.error("Firebase Realtime Database listener error:", error);
          // If offline/error, read from localStorage fallback
          try {
            const saved = localStorage.getItem("ddm-emergencies-v2");
            if (saved) {
              const localList = JSON.parse(saved);
              if (Array.isArray(localList)) {
                setEmergencies(localList);
              }
            }
          } catch {}
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to connect to Firebase Realtime Database:", e);
    }
  }, []);

  // Save to localStorage whenever emergencies change
  useEffect(() => {
    try {
      localStorage.setItem("ddm-emergencies-v2", JSON.stringify(emergencies));
    } catch (e) {
      console.error("Failed to save emergencies to localStorage", e);
    }
  }, [emergencies]);

  // Tick timer every 3 seconds to update relative wait times
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo<DispatchContextValue>(
    () => ({
      emergencies,
      currentTime,

      create: (input) => {
        const id = `SOS-${Math.floor(1000 + Math.random() * 8999)}`;
        const now = Date.now();
        const newEmergency: Emergency = {
          ...input,
          id,
          createdAt: now,
          status: "queued",
          denDenFrequency: input.denDenFrequency || "108.4 MHz"
        };

        // Write directly to Firebase
        try {
          const newRef = push(ref(realtimeDatabase, "dispatches"));
          newEmergency.firebaseKey = newRef.key || undefined;
          set(newRef, {
            ...newEmergency,
            createdAt: now
          }).catch((err) => console.error("Firebase push error:", err));
        } catch (e) {
          console.error("Failed to push to Firebase:", e);
        }

        setEmergencies((prev) => {
          if (
            prev.some(
              (e) =>
                e.id === newEmergency.id ||
                (newEmergency.firebaseKey && e.firebaseKey === newEmergency.firebaseKey)
            )
          ) {
            return prev;
          }
          return [newEmergency, ...prev];
        });
        return newEmergency;
      },

      claim: (id: string, teamName?: string) => {
        const selectedCrew = teamName || rescueArmadaCrews[0].name;
        const target = emergencies.find((e) => e.id === id);
        const now = Date.now();

        if (target?.firebaseKey) {
          try {
            update(ref(realtimeDatabase, `dispatches/${target.firebaseKey}`), {
              status: "assigned",
              team: selectedCrew,
              claimedAt: now,
              updatedAt: now
            }).catch(console.error);
          } catch (e) {
            console.error("Failed to update Firebase:", e);
          }
        }

        setEmergencies((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "assigned",
                  team: selectedCrew,
                  claimedAt: now,
                  updatedAt: now
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

        const target = emergencies.find((e) => e.id === id);
        if (!target) return;

        const next = nextStatusMap[target.status];
        const now = Date.now();
        const resolvedAt = next === "resolved" ? now : target.resolvedAt;
        const resolutionNotes =
          next === "resolved" && !target.resolutionNotes
            ? "Emergency stabilized and successfully resolved by Chopper's Medical Rescue Armada."
            : target.resolutionNotes;

        if (target.firebaseKey) {
          try {
            update(ref(realtimeDatabase, `dispatches/${target.firebaseKey}`), {
              status: next,
              updatedAt: now,
              resolvedAt: resolvedAt || null,
              resolutionNotes: resolutionNotes || null
            }).catch(console.error);
          } catch (e) {
            console.error("Failed to update Firebase status:", e);
          }
        }

        setEmergencies((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              status: next,
              updatedAt: now,
              resolvedAt,
              resolutionNotes
            };
          })
        );
      },

      resolve: (id: string, notes?: string) => {
        const target = emergencies.find((e) => e.id === id);
        const now = Date.now();
        const defaultNotes =
          notes || "Emergency fully resolved. Medical triage complete; casualties evacuated safely.";

        if (target?.firebaseKey) {
          try {
            update(ref(realtimeDatabase, `dispatches/${target.firebaseKey}`), {
              status: "resolved",
              resolvedAt: now,
              updatedAt: now,
              resolutionNotes: defaultNotes
            }).catch(console.error);
          } catch (e) {
            console.error("Failed to resolve in Firebase:", e);
          }
        }

        setEmergencies((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "resolved",
                  resolvedAt: now,
                  updatedAt: now,
                  resolutionNotes: defaultNotes
                }
              : item
          )
        );
      },

      updateSeverity: (id: string, severity: Severity) => {
        const target = emergencies.find((e) => e.id === id);
        const now = Date.now();

        if (target?.firebaseKey) {
          try {
            update(ref(realtimeDatabase, `dispatches/${target.firebaseKey}`), {
              severity,
              updatedAt: now
            }).catch(console.error);
          } catch (e) {
            console.error("Failed to update severity in Firebase:", e);
          }
        }

        setEmergencies((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, severity, updatedAt: now } : item
          )
        );
      },

      removeEmergency: (id: string) => {
        const target = emergencies.find((e) => e.id === id);
        if (target?.firebaseKey) {
          remove(ref(realtimeDatabase, `dispatches/${target.firebaseKey}`)).catch(console.error);
        }
        setEmergencies((prev) => prev.filter((e) => e.id !== id));
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

        const now = Date.now();
        const id = `SOS-${Math.floor(2000 + Math.random() * 7999)}`;
        const simulated: Emergency = {
          id,
          type,
          island,
          sector: `Sector ${Math.floor(1 + Math.random() * 8)} Alpha`,
          severity,
          description: `URGENT DISTRESS BROADCAST: Immediate relief required on ${island}. Den Den Mushi transmission received.`,
          status: "queued",
          createdAt: now,
          callerName: "Den Den Snail Relay",
          denDenFrequency: "108.4 MHz"
        };

        try {
          const newRef = push(ref(realtimeDatabase, "dispatches"));
          simulated.firebaseKey = newRef.key || undefined;
          set(newRef, {
            ...simulated,
            createdAt: now
          }).catch(console.error);
        } catch {}

        setEmergencies((prev) => [simulated, ...prev]);
        return simulated;
      },

      resetToSeed: () => {
        setEmergencies([]);
        try {
          localStorage.removeItem("ddm-emergencies-v2");
          remove(ref(realtimeDatabase, "dispatches")).catch(console.error);
        } catch (e) {}
      }
    }),
    [emergencies, currentTime]
  );

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export const useDispatch = () => {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error("useDispatch must be used within a DispatchProvider");
  }
  return context;
};

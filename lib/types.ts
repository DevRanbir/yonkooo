export type Severity = "critical" | "high" | "medium" | "low";

export type Status = "queued" | "assigned" | "dispatched" | "arrived" | "in_progress" | "resolved";

export interface Emergency {
  id: string;
  type: string;
  island: string;
  sector: string;
  severity: Severity;
  description: string;
  status: Status;
  createdAt: number;
  updatedAt?: number;
  claimedAt?: number;
  resolvedAt?: number;
  team?: string;
  callerName?: string;
  denDenFrequency?: string;
  resolutionNotes?: string;
}

export interface RescueCrew {
  id: string;
  name: string;
  captain: string;
  ship: string;
  specialty: string;
  status: "available" | "deployed" | "standby";
  assignedEmergencyId?: string;
  badgeColor: string;
}

export const severityPoints: Record<Severity, number> = {
  critical: 50,
  high: 35,
  medium: 20,
  low: 10
};

export const severityAgingFactor: Record<Severity, number> = {
  critical: 2.5,
  high: 2.0,
  medium: 1.5,
  low: 1.0
};

/**
 * Calculates priority score combining baseline severity weight and elapsed wait time.
 * Score = Severity_Base + (Elapsed_Minutes * Aging_Factor)
 */
export const priorityScore = (item: Emergency, now: number = Date.now()): number => {
  const elapsedMinutes = Math.max(0, Math.floor((now - item.createdAt) / 60000));
  const agingFactor = severityAgingFactor[item.severity] ?? 2.0;
  const agingScore = Math.floor(elapsedMinutes * agingFactor);
  return severityPoints[item.severity] + agingScore;
};

export const statusLabel: Record<Status, string> = {
  queued: "Queued (Unassigned)",
  assigned: "Crew Assigned",
  dispatched: "Fleet En Route",
  arrived: "Arrived On Site",
  in_progress: "Triage In Progress",
  resolved: "Mission Resolved"
};

export const grandLineIslands = [
  { name: "Drum Island", sea: "Paradise", climate: "Sub-Zero Winter Island", hazards: "Blizzards & Avalanches" },
  { name: "Alabasta", sea: "Paradise", climate: "Summer Desert Island", hazards: "Sandstorms & Dehydration" },
  { name: "Punk Hazard", sea: "New World", climate: "Thermal Fracture Island", hazards: "Toxic Chemical Gas & Magma" },
  { name: "Water 7", sea: "Paradise", climate: "Spring Island", hazards: "Aqua Laguna Tidal Waves" },
  { name: "Dressrosa", sea: "New World", climate: "Tropical Island", hazards: "Civil Unrest & Collateral Damage" },
  { name: "Fishman Island", sea: "Deep Ocean (10,000m)", climate: "Abyssal Bubble Trench", hazards: "Bubble Membrane Rupture" }
];

export const emergencyTypes = [
  "Blizzard Exposure & Hypothermia",
  "Toxic Gas Containment Breach",
  "Desert Sandstorm Fleet Stranded",
  "Aqua Laguna Flood Evacuation",
  "Sea King Attack on Civilian Vessel",
  "Buster Call Collateral Trauma",
  "Epidemic Outbreak & Antidote Shortage",
  "Avalanche Medical Search & Rescue"
];

export const rescueArmadaCrews: RescueCrew[] = [
  {
    id: "CREW-CHOPPER",
    name: "Chopper's Medical Rescue Flagship",
    captain: "Tony Tony Chopper",
    ship: "Going Luffy-senpai Medical Rig",
    specialty: "Emergency Triage, Rumble Ball Heavy Rescue, Antidote Synthesis",
    status: "available",
    badgeColor: "#F23794"
  },
  {
    id: "CREW-HEART",
    name: "Heart Pirates Medical Submarine",
    captain: "Trafalgar D. Water Law",
    ship: "Polar Tang Submersible",
    specialty: "Ope Ope Surgery, Deep Sea Evacuation, Critical Extraction",
    status: "available",
    badgeColor: "#eab308"
  },
  {
    id: "CREW-REVO",
    name: "Revolutionary Army Relief Squadron",
    captain: "Sabo & Koala",
    ship: "Wind Granma Corvette",
    specialty: "Disaster Zone Logistics, Large-Scale Civilian Relocation",
    status: "available",
    badgeColor: "#ef4444"
  },
  {
    id: "CREW-KUREHA",
    name: "Doctor Kureha's Highland Snow Sleds",
    captain: "Dr. Kureha (141 yrs young)",
    ship: "Drum Rock Avalanche Hauler",
    specialty: "Sub-Zero Trauma, Frostbite Reconstruction, Plum Wine Triage",
    status: "available",
    badgeColor: "#06b6d4"
  }
];

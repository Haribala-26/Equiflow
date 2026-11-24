import { PriorityCategory, PriorityConfig } from "./types";

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    severity: 0.30,
    urgency: 0.25,
    vulnerability: 0.20,
    unmetNeed: 0.15,
    populationImpact: 0.10,
  },
  populationCap: 50000,
  formulaVersion: "v1.0",
};

export interface CategoryInfo {
  category: PriorityCategory;
  label: string;
  minScore: number;
  maxScore: number;
  color: string;
  badgeClass: string;
}

export const PRIORITY_CATEGORIES: Record<PriorityCategory, CategoryInfo> = {
  critical: {
    category: "critical",
    label: "Critical",
    minScore: 80.0,
    maxScore: 100.0,
    color: "#B42318",
    badgeClass: "bg-red-950/20 text-[#B42318] border-[#B42318]/30",
  },
  high: {
    category: "high",
    label: "High",
    minScore: 60.0,
    maxScore: 79.999,
    color: "#E04444",
    badgeClass: "bg-rose-950/20 text-[#E04444] border-[#E04444]/30",
  },
  moderate: {
    category: "moderate",
    label: "Moderate",
    minScore: 40.0,
    maxScore: 59.999,
    color: "#D99118",
    badgeClass: "bg-amber-950/20 text-[#D99118] border-[#D99118]/30",
  },
  low: {
    category: "low",
    label: "Low",
    minScore: 0.0,
    maxScore: 39.999,
    color: "#23865B",
    badgeClass: "bg-emerald-950/20 text-[#23865B] border-[#23865B]/30",
  },
};

export function getCategoryForScore(score: number): CategoryInfo {
  if (score >= 80.0) return PRIORITY_CATEGORIES.critical;
  if (score >= 60.0) return PRIORITY_CATEGORIES.high;
  if (score >= 40.0) return PRIORITY_CATEGORIES.moderate;
  return PRIORITY_CATEGORIES.low;
}

export interface CityConfig {
  name: string;
  state: string;
  country: string;
  center: [number, number]; // [lat, lng]
  defaultZoom: number;
  bounds?: [[number, number], [number, number]];
}

export const CITIES: Record<string, CityConfig> = {
  Chennai: {
    name: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    center: [13.0418, 80.2430],
    defaultZoom: 12,
  },
  Coimbatore: {
    name: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    center: [11.0168, 76.9558],
    defaultZoom: 12,
  },
};

export const DEFAULT_CITY = "Chennai";

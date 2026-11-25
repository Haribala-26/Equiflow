export type PriorityCategory = "critical" | "high" | "moderate" | "low";

export type ResourceType = "food" | "water" | "medical" | "shelter" | "hygiene";

export type ResourceUnit = "packs" | "litres" | "kits";

export interface NeedRequest {
  resourceType: ResourceType;
  requestedQty: number;
  locallyAvailableQty: number;
  unit: ResourceUnit;
}

export type VerificationStatus = "verified" | "pending_review" | "unverified";

export interface Area {
  id: string; // e.g. "CHN-001"
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  households: number;
  severity: number; // 0 - 100
  urgency: number; // 0 - 100
  vulnerability: number; // 0 - 100
  needs: NeedRequest[];
  verificationStatus: VerificationStatus;
  active: boolean;
  notes?: string;
}

export interface PriorityWeights {
  severity: number; // default 0.30
  urgency: number; // default 0.25
  vulnerability: number; // default 0.20
  unmetNeed: number; // default 0.15
  populationImpact: number; // default 0.10
}

export interface PriorityConfig {
  weights: PriorityWeights;
  populationCap: number; // default 50000
  formulaVersion: string; // e.g. "v1.0"
  updatedAt?: string;
  updatedBy?: string;
}

export interface PriorityComponent {
  factor: "severity" | "urgency" | "vulnerability" | "unmetNeed" | "populationImpact";
  label: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  weightedContribution: number;
}

export interface PrioritySnapshot {
  areaId: string;
  score: number;
  category: PriorityCategory;
  categoryColor: string;
  components: PriorityComponent[];
  formulaVersion: string;
  confidence: "high" | "medium" | "low";
  unknownFields: string[];
  computedAt: string;
}

export interface ResourceStock {
  type: ResourceType;
  name: string;
  unit: ResourceUnit;
  total: number;
  reserved: number;
  available: number;
  dailyConsumptionRate?: number;
}

export interface AllocationItem {
  areaId: string;
  areaName: string;
  resourceType: ResourceType;
  unit: ResourceUnit;
  eligibleDemand: number;
  floorQty: number;
  weightedQty: number;
  recommendedQty: number;
  unmetQty: number;
  rationale: string;
}

export interface FairnessMetrics {
  overallSatisfactionRate: number; // Percentage 0 - 100
  resourceSatisfactionRate: Record<ResourceType, number>;
  categorySatisfactionRate: Record<PriorityCategory, number>;
  criticalAreasServedCount: number;
  criticalAreasTotal: number;
  criticalCoverageRate: number; // Percentage
  minCoverageAchievedCount: number;
  totalEligibleAreas: number;
  coverageVariance: number;
}

export interface AllocationRun {
  id: string;
  createdAt: string;
  status: "draft" | "pending_approval" | "approved" | "rejected";
  items: AllocationItem[];
  remainingStock: Record<ResourceType, number>;
  fairness: FairnessMetrics;
  inputVersion?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  isScenario?: boolean;
  scenarioId?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  reason?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
}

export interface ShortagePrediction {
  resourceType: ResourceType;
  name: string;
  unit: ResourceUnit;
  usableStock: number;
  dailyConsumption: number;
  daysRemaining: number;
  projectedShortageDate: string;
  status: "critical" | "warning" | "adequate";
  areasAtRiskCount: number;
  recommendedReplenishment: number;
}

export type UserRole =
  | "admin"
  | "coordinator"
  | "field_officer"
  | "resource_manager"
  | "auditor"
  | "viewer";

export interface UserSession {
  role: UserRole;
  name: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

import {
  Area,
  NeedRequest,
  PriorityComponent,
  PriorityConfig,
  PrioritySnapshot,
} from "../types";
import { DEFAULT_PRIORITY_CONFIG, getCategoryForScore } from "../config";

/**
 * Calculates aggregated unmet need ratio [0 - 100] across all need requests.
 * Formula: ((totalRequested - totalAvailable) / totalRequested) * 100
 */
export function calculateUnmetNeedRatio(needs: NeedRequest[]): number {
  if (!needs || needs.length === 0) return 0;

  let totalRequested = 0;
  let totalAvailable = 0;

  for (const need of needs) {
    totalRequested += Math.max(0, need.requestedQty);
    totalAvailable += Math.max(0, need.locallyAvailableQty);
  }

  if (totalRequested === 0) return 0;
  const unmet = Math.max(0, totalRequested - totalAvailable);
  const ratio = (unmet / totalRequested) * 100;
  return Math.min(100, Math.max(0, ratio));
}

/**
 * Normalizes population impact with a capped ceiling.
 * Formula: min(100, (population / populationCap) * 100)
 */
export function calculatePopulationImpact(
  population: number,
  populationCap: number
): number {
  if (population <= 0) return 0;
  return Math.min(100, (population / populationCap) * 100);
}

/**
 * Pure deterministic priority scoring engine.
 * Generates transparent score, component breakdown, confidence rating, and category.
 */
export function calculatePriorityScore(
  area: Area,
  customConfig?: PriorityConfig,
  overrideUnmetNeed?: number,
  overridePopImpact?: number
): PrioritySnapshot {
  const config = customConfig || DEFAULT_PRIORITY_CONFIG;
  const unknownFields: string[] = [];

  // 1. Raw factor extraction and validation
  const rawSeverity = typeof area.severity === "number" ? area.severity : null;
  const rawUrgency = typeof area.urgency === "number" ? area.urgency : null;
  const rawVulnerability =
    typeof area.vulnerability === "number" ? area.vulnerability : null;

  if (rawSeverity === null) unknownFields.push("severity");
  if (rawUrgency === null) unknownFields.push("urgency");
  if (rawVulnerability === null) unknownFields.push("vulnerability");

  // 2. Normalized factor evaluation [0 - 100]
  const normSeverity = Math.min(100, Math.max(0, rawSeverity ?? 50));
  const normUrgency = Math.min(100, Math.max(0, rawUrgency ?? 50));
  const normVulnerability = Math.min(100, Math.max(0, rawVulnerability ?? 50));

  const normUnmetNeed =
    typeof overrideUnmetNeed === "number"
      ? Math.min(100, Math.max(0, overrideUnmetNeed))
      : calculateUnmetNeedRatio(area.needs);

  const normPopImpact =
    typeof overridePopImpact === "number"
      ? Math.min(100, Math.max(0, overridePopImpact))
      : calculatePopulationImpact(area.population, config.populationCap);

  // 3. Weight configuration & dynamically handling missing fields if any
  const weights = config.weights;
  let activeWeightSum = 0;
  const factors: {
    factor: PriorityComponent["factor"];
    label: string;
    weight: number;
    raw: number;
    norm: number;
    isKnown: boolean;
  }[] = [
    {
      factor: "severity",
      label: "Severity (Emergency Impact)",
      weight: weights.severity,
      raw: rawSeverity ?? normSeverity,
      norm: normSeverity,
      isKnown: rawSeverity !== null,
    },
    {
      factor: "urgency",
      label: "Urgency (Time-to-Criticality)",
      weight: weights.urgency,
      raw: rawUrgency ?? normUrgency,
      norm: normUrgency,
      isKnown: rawUrgency !== null,
    },
    {
      factor: "vulnerability",
      label: "Demographic Vulnerability",
      weight: weights.vulnerability,
      raw: rawVulnerability ?? normVulnerability,
      norm: normVulnerability,
      isKnown: rawVulnerability !== null,
    },
    {
      factor: "unmetNeed",
      label: "Resource Shortfall / Unmet Need",
      weight: weights.unmetNeed,
      raw: normUnmetNeed,
      norm: normUnmetNeed,
      isKnown: true,
    },
    {
      factor: "populationImpact",
      label: "Population Exposure Scale",
      weight: weights.populationImpact,
      raw: area.population,
      norm: normPopImpact,
      isKnown: area.population > 0,
    },
  ];

  for (const item of factors) {
    if (item.isKnown) {
      activeWeightSum += item.weight;
    }
  }

  // Fallback to equal weighting if no weights active
  const weightMultiplier = activeWeightSum > 0 ? 1 / activeWeightSum : 1;

  let totalScore = 0;
  const components: PriorityComponent[] = factors.map((item) => {
    // Standard formula when all known, or re-normalized if any unknown
    const effectiveWeight =
      unknownFields.length === 0 ? item.weight : item.weight * weightMultiplier;
    const contribution = item.norm * effectiveWeight;
    if (item.isKnown) {
      totalScore += contribution;
    }

    return {
      factor: item.factor,
      label: item.label,
      weight: Number(item.weight.toFixed(2)),
      rawValue: Number(item.raw.toFixed(1)),
      normalizedValue: Number(item.norm.toFixed(1)),
      weightedContribution: Number(contribution.toFixed(2)),
    };
  });

  // Round score to 1 decimal place (e.g. 80.25 -> 80.3)
  const finalScore = Number(totalScore.toFixed(1));
  const categoryInfo = getCategoryForScore(finalScore);

  // Confidence determination
  let confidence: PrioritySnapshot["confidence"] = "high";
  if (area.verificationStatus === "unverified" || unknownFields.length >= 2) {
    confidence = "low";
  } else if (
    area.verificationStatus === "pending_review" ||
    unknownFields.length === 1
  ) {
    confidence = "medium";
  }

  return {
    areaId: area.id,
    score: finalScore,
    category: categoryInfo.category,
    categoryColor: categoryInfo.color,
    components,
    formulaVersion: config.formulaVersion,
    confidence,
    unknownFields,
    computedAt: new Date().toISOString(),
  };
}

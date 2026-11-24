import {
  AllocationItem,
  AllocationRun,
  Area,
  FairnessMetrics,
  PriorityCategory,
  PrioritySnapshot,
  ResourceStock,
  ResourceType,
} from "../types";
import { calculatePriorityScore } from "../priority/calculator";

export interface AllocationEngineOptions {
  floorRatio?: number; // default 0.20 (20% minimum coverage)
  isScenario?: boolean;
  scenarioId?: string;
}

/**
 * Executes multi-tier fair resource allocation with deterministic guarantees.
 */
export function runAllocation(
  areas: Area[],
  inventory: ResourceStock[],
  snapshots?: Map<string, PrioritySnapshot>,
  options: AllocationEngineOptions = {}
): AllocationRun {
  const floorRatio = options.floorRatio ?? 0.20;
  const activeAreas = areas.filter((a) => a.active);

  // Compute snapshots if not provided
  const priorityMap =
    snapshots ||
    new Map(
      activeAreas.map((a) => [a.id, calculatePriorityScore(a)])
    );

  const allItems: AllocationItem[] = [];
  const remainingStockMap: Record<ResourceType, number> = {
    food: 0,
    water: 0,
    medical: 0,
    shelter: 0,
    hygiene: 0,
  };

  // Process each resource type independently
  for (const stock of inventory) {
    const rType = stock.type;
    const usableStock = Math.max(0, stock.available);

    // 1. Gather demand for this resource
    interface AreaDemand {
      area: Area;
      snapshot: PrioritySnapshot;
      eligibleDemand: number;
      floorQty: number;
      weightedQty: number;
      finalAllocated: number;
      fractionalRemainder: number;
    }

    const demands: AreaDemand[] = [];

    for (const area of activeAreas) {
      const need = area.needs.find((n) => n.resourceType === rType);
      const requested = need ? Math.max(0, need.requestedQty) : 0;
      const local = need ? Math.max(0, need.locallyAvailableQty) : 0;
      const eligibleDemand = Math.max(0, requested - local);

      if (eligibleDemand > 0) {
        const snap = priorityMap.get(area.id) || calculatePriorityScore(area);
        demands.push({
          area,
          snapshot: snap,
          eligibleDemand,
          floorQty: 0,
          weightedQty: 0,
          finalAllocated: 0,
          fractionalRemainder: 0,
        });
      }
    }

    // Sort by priority score descending, then Area ID ascending
    demands.sort((a, b) => {
      if (b.snapshot.score !== a.snapshot.score) {
        return b.snapshot.score - a.snapshot.score;
      }
      return a.area.id.localeCompare(b.area.id);
    });

    let currentStockLeft = usableStock;

    // 2. Minimum Essential Coverage Pass (Phase 1)
    for (const d of demands) {
      if (currentStockLeft <= 0) break;
      const floorTarget = Math.min(
        d.eligibleDemand,
        Math.ceil(d.eligibleDemand * floorRatio)
      );
      const allocatedFloor = Math.min(floorTarget, currentStockLeft);
      d.floorQty = allocatedFloor;
      d.finalAllocated += allocatedFloor;
      currentStockLeft -= allocatedFloor;
    }

    // 3. Weighted Proportional Distribution on Remaining Stock (Phase 2)
    if (currentStockLeft > 0) {
      // Calculate remaining eligible demand
      let totalWeight = 0;
      const candidates = demands.filter(
        (d) => d.eligibleDemand - d.finalAllocated > 0
      );

      const weights = new Map<string, number>();
      for (const c of candidates) {
        const priorityFactor = c.snapshot.score / 100;
        const urgencyFactor = c.area.urgency / 100;
        const vulnFactor = c.area.vulnerability / 100;
        const eligibleRemaining = c.eligibleDemand - c.finalAllocated;

        const weight =
          (0.50 * priorityFactor + 0.30 * urgencyFactor + 0.20 * vulnFactor) *
          eligibleRemaining;
        weights.set(c.area.id, weight);
        totalWeight += weight;
      }

      if (totalWeight > 0) {
        let distributedProportional = 0;
        for (const c of candidates) {
          const w = weights.get(c.area.id) || 0;
          const eligibleRemaining = c.eligibleDemand - c.finalAllocated;
          const exactShare = (currentStockLeft * w) / totalWeight;
          const boundedShare = Math.min(eligibleRemaining, exactShare);

          const integerShare = Math.floor(boundedShare);
          c.weightedQty = integerShare;
          c.finalAllocated += integerShare;
          c.fractionalRemainder = boundedShare - integerShare;
          distributedProportional += integerShare;
        }

        currentStockLeft -= distributedProportional;

        // 4. Largest Remainder Redistribution for indivisible units
        if (currentStockLeft > 0) {
          // Sort candidates by fractional remainder descending
          candidates.sort((a, b) => {
            if (Math.abs(b.fractionalRemainder - a.fractionalRemainder) > 0.0001) {
              return b.fractionalRemainder - a.fractionalRemainder;
            }
            if (b.snapshot.score !== a.snapshot.score) {
              return b.snapshot.score - a.snapshot.score;
            }
            return a.area.id.localeCompare(b.area.id);
          });

          for (const c of candidates) {
            if (currentStockLeft <= 0) break;
            if (c.finalAllocated < c.eligibleDemand) {
              c.finalAllocated += 1;
              c.weightedQty += 1;
              currentStockLeft -= 1;
            }
          }
        }
      }
    }

    remainingStockMap[rType] = currentStockLeft;

    // 5. Generate Allocation Items with audit rationale
    for (const d of demands) {
      const unmet = Math.max(0, d.eligibleDemand - d.finalAllocated);
      const pct =
        d.eligibleDemand > 0
          ? ((d.finalAllocated / d.eligibleDemand) * 100).toFixed(0)
          : "100";

      let rationale = `Covered ${pct}% of need (${d.finalAllocated} of ${d.eligibleDemand} ${stock.unit}). Floor: ${d.floorQty}, Priority Weight: ${d.weightedQty}.`;
      if (unmet > 0) {
        rationale += ` Unmet shortfall: ${unmet} ${stock.unit} due to stock limits.`;
      } else {
        rationale += ` 100% demand fulfilled.`;
      }

      allItems.push({
        areaId: d.area.id,
        areaName: d.area.name,
        resourceType: rType,
        unit: stock.unit,
        eligibleDemand: d.eligibleDemand,
        floorQty: d.floorQty,
        weightedQty: d.weightedQty,
        recommendedQty: d.finalAllocated,
        unmetQty: unmet,
        rationale,
      });
    }
  }

  // 6. Compute Fairness Metrics
  const fairness = evaluateFairness(allItems, activeAreas, priorityMap);

  return {
    id: options.isScenario
      ? `SCEN-${Date.now().toString(36)}`
      : `ALLOC-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: "pending_approval",
    items: allItems,
    remainingStock: remainingStockMap,
    fairness,
    isScenario: options.isScenario,
    scenarioId: options.scenarioId,
  };
}

/**
 * Evaluates fairness metrics across allocation items.
 */
export function evaluateFairness(
  items: AllocationItem[],
  areas: Area[],
  priorityMap: Map<string, PrioritySnapshot>
): FairnessMetrics {
  let totalDemand = 0;
  let totalAllocated = 0;

  const resDemand: Record<ResourceType, number> = { food: 0, water: 0, medical: 0, shelter: 0, hygiene: 0 };
  const resAlloc: Record<ResourceType, number> = { food: 0, water: 0, medical: 0, shelter: 0, hygiene: 0 };

  const catDemand: Record<PriorityCategory, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
  const catAlloc: Record<PriorityCategory, number> = { critical: 0, high: 0, moderate: 0, low: 0 };

  const criticalAreasTotal = areas.filter(
    (a) => (priorityMap.get(a.id)?.score ?? 0) >= 80
  ).length;

  let criticalAreasServed = 0;
  let minCoverageAchievedCount = 0;
  const areaSatisfactionRates: number[] = [];

  // Group items by area
  const areaItemsMap = new Map<string, AllocationItem[]>();
  for (const item of items) {
    totalDemand += item.eligibleDemand;
    totalAllocated += item.recommendedQty;

    resDemand[item.resourceType] += item.eligibleDemand;
    resAlloc[item.resourceType] += item.recommendedQty;

    const snap = priorityMap.get(item.areaId);
    const cat = snap?.category || "moderate";
    catDemand[cat] += item.eligibleDemand;
    catAlloc[cat] += item.recommendedQty;

    const group = areaItemsMap.get(item.areaId) || [];
    group.push(item);
    areaItemsMap.set(item.areaId, group);
  }

  for (const area of areas) {
    const areaItems = areaItemsMap.get(area.id) || [];
    if (areaItems.length > 0) {
      const areaDem = areaItems.reduce((acc, i) => acc + i.eligibleDemand, 0);
      const areaRec = areaItems.reduce((acc, i) => acc + i.recommendedQty, 0);
      const satRate = areaDem > 0 ? (areaRec / areaDem) * 100 : 100;
      areaSatisfactionRates.push(satRate);

      const snap = priorityMap.get(area.id);
      if ((snap?.score ?? 0) >= 80 && areaRec > 0) {
        criticalAreasServed++;
      }
      if (satRate >= 20) {
        minCoverageAchievedCount++;
      }
    }
  }

  // Calculate Variance
  let variance = 0;
  if (areaSatisfactionRates.length > 1) {
    const mean =
      areaSatisfactionRates.reduce((a, b) => a + b, 0) /
      areaSatisfactionRates.length;
    variance =
      areaSatisfactionRates.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      areaSatisfactionRates.length;
  }

  const overallRate = totalDemand > 0 ? (totalAllocated / totalDemand) * 100 : 100;

  const resourceSatisfactionRate: Record<ResourceType, number> = {
    food: resDemand.food > 0 ? (resAlloc.food / resDemand.food) * 100 : 100,
    water: resDemand.water > 0 ? (resAlloc.water / resDemand.water) * 100 : 100,
    medical: resDemand.medical > 0 ? (resAlloc.medical / resDemand.medical) * 100 : 100,
    shelter: resDemand.shelter > 0 ? (resAlloc.shelter / resDemand.shelter) * 100 : 100,
    hygiene: resDemand.hygiene > 0 ? (resAlloc.hygiene / resDemand.hygiene) * 100 : 100,
  };

  const categorySatisfactionRate: Record<PriorityCategory, number> = {
    critical: catDemand.critical > 0 ? (catAlloc.critical / catDemand.critical) * 100 : 100,
    high: catDemand.high > 0 ? (catAlloc.high / catDemand.high) * 100 : 100,
    moderate: catDemand.moderate > 0 ? (catAlloc.moderate / catDemand.moderate) * 100 : 100,
    low: catDemand.low > 0 ? (catAlloc.low / catDemand.low) * 100 : 100,
  };

  return {
    overallSatisfactionRate: Number(overallRate.toFixed(1)),
    resourceSatisfactionRate,
    categorySatisfactionRate,
    criticalAreasServedCount: criticalAreasServed,
    criticalAreasTotal,
    criticalCoverageRate:
      criticalAreasTotal > 0
        ? Number(((criticalAreasServed / criticalAreasTotal) * 100).toFixed(1))
        : 100,
    minCoverageAchievedCount,
    totalEligibleAreas: areaSatisfactionRates.length,
    coverageVariance: Number(Math.sqrt(variance).toFixed(1)), // Standard deviation
  };
}

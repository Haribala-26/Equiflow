import {
  AllocationRun,
  Area,
  ResourceStock,
  ShortagePrediction,
} from "../types";
import { runAllocation } from "../allocation/engine";

export interface ScenarioOverride {
  inventoryUpdates?: Partial<Record<string, number>>; // resourceType -> new available stock
  areaUpdates?: Array<{
    id: string;
    population?: number;
    severity?: number;
    urgency?: number;
    vulnerability?: number;
    needs?: Array<{
      resourceType: string;
      requestedQty: number;
    }>;
  }>;
}

export interface SimulationResult {
  baselineRun: AllocationRun;
  scenarioRun: AllocationRun;
  deltas: {
    overallSatisfactionDelta: number;
    newShortages: Array<{ resourceType: string; deltaDeficit: number }>;
    areaChanges: Array<{
      areaId: string;
      areaName: string;
      resourceType: string;
      baselineQty: number;
      scenarioQty: number;
      difference: number;
    }>;
  };
}

/**
 * Runs what-if simulations on an isolated dataset.
 */
export function simulateScenario(
  baselineAreas: Area[],
  baselineInventory: ResourceStock[],
  overrides: ScenarioOverride
): SimulationResult {
  // 1. Run baseline
  const baselineRun = runAllocation(baselineAreas, baselineInventory);

  // 2. Clone and apply overrides
  const scenarioAreas: Area[] = JSON.parse(JSON.stringify(baselineAreas));
  const scenarioInventory: ResourceStock[] = JSON.parse(
    JSON.stringify(baselineInventory)
  );

  if (overrides.inventoryUpdates) {
    for (const [rType, newAvail] of Object.entries(overrides.inventoryUpdates)) {
      const item = scenarioInventory.find((r) => r.type === rType);
      if (item && typeof newAvail === "number") {
        item.available = Math.max(0, newAvail);
        item.total = item.available + item.reserved;
      }
    }
  }

  if (overrides.areaUpdates) {
    for (const u of overrides.areaUpdates) {
      const a = scenarioAreas.find((area) => area.id === u.id);
      if (a) {
        if (typeof u.population === "number") a.population = u.population;
        if (typeof u.severity === "number") a.severity = u.severity;
        if (typeof u.urgency === "number") a.urgency = u.urgency;
        if (typeof u.vulnerability === "number") a.vulnerability = u.vulnerability;
        if (u.needs) {
          for (const n of u.needs) {
            const need = a.needs.find((item) => item.resourceType === n.resourceType);
            if (need) need.requestedQty = n.requestedQty;
          }
        }
      }
    }
  }

  // 3. Run scenario allocation
  const scenarioRun = runAllocation(scenarioAreas, scenarioInventory, undefined, {
    isScenario: true,
  });

  // 4. Calculate detailed deltas
  const areaChanges: SimulationResult["deltas"]["areaChanges"] = [];
  for (const scenItem of scenarioRun.items) {
    const baseItem = baselineRun.items.find(
      (b) =>
        b.areaId === scenItem.areaId && b.resourceType === scenItem.resourceType
    );
    const baseQty = baseItem ? baseItem.recommendedQty : 0;
    const diff = scenItem.recommendedQty - baseQty;

    if (diff !== 0) {
      areaChanges.push({
        areaId: scenItem.areaId,
        areaName: scenItem.areaName,
        resourceType: scenItem.resourceType,
        baselineQty: baseQty,
        scenarioQty: scenItem.recommendedQty,
        difference: diff,
      });
    }
  }

  const satisfactionDelta = Number(
    (
      scenarioRun.fairness.overallSatisfactionRate -
      baselineRun.fairness.overallSatisfactionRate
    ).toFixed(1)
  );

  return {
    baselineRun,
    scenarioRun,
    deltas: {
      overallSatisfactionDelta: satisfactionDelta,
      newShortages: [],
      areaChanges,
    },
  };
}

/**
 * Computes burn-rate and stock depletion forecasts.
 */
export function calculateShortagePredictions(
  inventory: ResourceStock[],
  consumptionMultipliers: Partial<Record<string, number>> = {}
): ShortagePrediction[] {
  const now = Date.now();

  return inventory.map((stock) => {
    const usable = Math.max(0, stock.available);
    const multiplier = consumptionMultipliers[stock.type] ?? 1.0;
    const baseDaily = stock.dailyConsumptionRate || 1000;
    const dailyConsumption = Math.max(1, Math.round(baseDaily * multiplier));

    const daysRemaining = Number((usable / dailyConsumption).toFixed(1));
    const shortageMs = now + daysRemaining * 24 * 3600 * 1000;
    const projectedShortageDate = new Date(shortageMs).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );

    let status: ShortagePrediction["status"] = "adequate";
    if (daysRemaining < 2.0) {
      status = "critical";
    } else if (daysRemaining < 4.0) {
      status = "warning";
    }

    const recommendedReplenishment = Math.max(
      0,
      dailyConsumption * 7 - usable // 7-day reserve horizon
    );

    return {
      resourceType: stock.type,
      name: stock.name,
      unit: stock.unit,
      usableStock: usable,
      dailyConsumption,
      daysRemaining,
      projectedShortageDate,
      status,
      areasAtRiskCount: daysRemaining < 3 ? 3 : 0,
      recommendedReplenishment,
    };
  });
}

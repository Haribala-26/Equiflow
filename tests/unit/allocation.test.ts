import { describe, it, expect } from "vitest";
import { runAllocation } from "../../src/domain/allocation/engine";
import { simulateScenario, calculateShortagePredictions } from "../../src/domain/simulation/engine";
import { INITIAL_AREAS, INITIAL_INVENTORY } from "../../src/data/mock/seed";

describe("Allocation Engine", () => {
  it("strictly respects stock constraints (Invariant: sum(allocated) <= usableStock)", () => {
    const run = runAllocation(INITIAL_AREAS, INITIAL_INVENTORY);

    for (const stock of INITIAL_INVENTORY) {
      const itemsForResource = run.items.filter((i) => i.resourceType === stock.type);
      const totalAllocated = itemsForResource.reduce((sum, i) => sum + i.recommendedQty, 0);

      expect(totalAllocated).toBeLessThanOrEqual(stock.available);
      expect(totalAllocated + run.remainingStock[stock.type]).toBe(stock.available);
    }
  });

  it("strictly respects demand constraints (Invariant: allocated <= eligibleDemand)", () => {
    const run = runAllocation(INITIAL_AREAS, INITIAL_INVENTORY);

    for (const item of run.items) {
      expect(item.recommendedQty).toBeLessThanOrEqual(item.eligibleDemand);
      expect(item.recommendedQty + item.unmetQty).toBe(item.eligibleDemand);
    }
  });

  it("allocates more to critical/high priority communities under constraints", () => {
    const run = runAllocation(INITIAL_AREAS, INITIAL_INVENTORY);

    const velacheryFood = run.items.find(
      (i) => i.areaId === "CHN-002" && i.resourceType === "food"
    );
    const annaNagarFood = run.items.find(
      (i) => i.areaId === "CHN-007" && i.resourceType === "food"
    );

    expect(velacheryFood).toBeDefined();
    expect(annaNagarFood).toBeDefined();
    // Velachery is Critical (95 severity), Anna Nagar is Low/Moderate (40 severity)
    expect(velacheryFood!.recommendedQty).toBeGreaterThan(annaNagarFood!.recommendedQty);
  });

  it("is fully deterministic (identical runs produce identical numbers)", () => {
    const run1 = runAllocation(INITIAL_AREAS, INITIAL_INVENTORY);
    const run2 = runAllocation(INITIAL_AREAS, INITIAL_INVENTORY);

    expect(run1.items.length).toBe(run2.items.length);
    for (let i = 0; i < run1.items.length; i++) {
      expect(run1.items[i].recommendedQty).toBe(run2.items[i].recommendedQty);
      expect(run1.items[i].unmetQty).toBe(run2.items[i].unmetQty);
    }
    expect(run1.fairness.overallSatisfactionRate).toBe(run2.fairness.overallSatisfactionRate);
  });
});

describe("What-If Simulation Engine", () => {
  it("isolates scenario changes without mutating baseline state", () => {
    const foodStockBefore = INITIAL_INVENTORY.find((r) => r.type === "food")?.available;

    const sim = simulateScenario(INITIAL_AREAS, INITIAL_INVENTORY, {
      inventoryUpdates: { food: 4000 }, // Drop food from 7500 to 4000
    });

    const foodStockAfter = INITIAL_INVENTORY.find((r) => r.type === "food")?.available;
    expect(foodStockAfter).toBe(foodStockBefore);

    // Scenario satisfaction should drop
    expect(sim.scenarioRun.fairness.overallSatisfactionRate).toBeLessThan(
      sim.baselineRun.fairness.overallSatisfactionRate
    );
    expect(sim.deltas.overallSatisfactionDelta).toBeLessThan(0);
  });

  it("calculates accurate shortage predictions", () => {
    const shortages = calculateShortagePredictions(INITIAL_INVENTORY);
    expect(shortages.length).toBe(INITIAL_INVENTORY.length);

    for (const pred of shortages) {
      expect(pred.daysRemaining).toBeGreaterThan(0);
      expect(pred.usableStock).toBeGreaterThan(0);
    }
  });
});

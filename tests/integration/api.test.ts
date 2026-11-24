import { describe, it, expect, beforeEach } from "vitest";
import { getRepository } from "../../src/data/repository";
import { runAllocation } from "../../src/domain/allocation/engine";
import { simulateScenario, calculateShortagePredictions } from "../../src/domain/simulation/engine";
import { assessEmergencyReport } from "../../src/integrations/gemini/client";
import { egmAdapter } from "../../src/integrations/elephant-goldfish/adapter";

describe("End-to-End Domain & API Workflow Verification", () => {
  beforeEach(async () => {
    const repo = getRepository();
    await repo.resetDemo();
  });

  it("completes full lifecycle: area inspection -> priority scoring -> allocation -> approval -> stock deduction", async () => {
    const repo = getRepository();

    // 1. Inspect areas and inventory
    const areas = await repo.getAreas();
    const inventory = await repo.getInventory();
    expect(areas.length).toBe(7);
    expect(inventory.length).toBe(5);

    const initialFoodStock = inventory.find((r) => r.type === "food")!.available;
    expect(initialFoodStock).toBe(7500);

    // 2. Run allocation
    const run = runAllocation(areas, inventory);
    expect(run.status).toBe("pending_approval");
    expect(run.items.length).toBeGreaterThan(0);
    expect(run.fairness.overallSatisfactionRate).toBeGreaterThan(0);

    await repo.saveAllocationRun(run, "Coordinator");

    // 3. EGM Fresh-Eyes Audit
    const audit = await egmAdapter.auditAllocationRun(run);
    expect(audit.status).toBe("ready");
    expect(audit.persona).toBe("Auditor");

    // 4. Approve Allocation
    const foodAllocated = run.items
      .filter((i) => i.resourceType === "food")
      .reduce((sum, i) => sum + i.recommendedQty, 0);

    await repo.approveAllocationRun(run.id, "Coordinator Raman");

    const updatedRun = await repo.getAllocationRunById(run.id);
    expect(updatedRun?.status).toBe("approved");
    expect(updatedRun?.approvedBy).toBe("Coordinator Raman");

    // 5. Verify stock deduction
    const updatedInventory = await repo.getInventory();
    const updatedFoodStock = updatedInventory.find((r) => r.type === "food")!.available;
    expect(updatedFoodStock).toBe(initialFoodStock - foodAllocated);
  });

  it("handles emergency report comprehension with AI fallback", async () => {
    const report = "Urgent relief needed in Saidapet. Severe floodwaters entering homes. Need 1,000 food rations and 4,000 litres clean drinking water.";
    const result = await assessEmergencyReport(report);

    expect(result.suggestedNeeds.length).toBeGreaterThanOrEqual(2);
    expect(result.suggestedSeverity).toBeGreaterThanOrEqual(60);
    expect(result.explanation).toBeDefined();
  });

  it("supports what-if simulations with zero baseline contamination", async () => {
    const repo = getRepository();
    const areas = await repo.getAreas();
    const inventory = await repo.getInventory();

    const sim = simulateScenario(areas, inventory, {
      inventoryUpdates: { food: 3000 },
      areaUpdates: [{ id: "CHN-001", severity: 98 }],
    });

    expect(sim.deltas.areaChanges.length).toBeGreaterThan(0);
    expect(sim.scenarioRun.fairness.overallSatisfactionRate).toBeLessThan(
      sim.baselineRun.fairness.overallSatisfactionRate
    );

    // Baseline areas unaffected
    const baselineAdyar = areas.find((a) => a.id === "CHN-001");
    expect(baselineAdyar?.severity).toBe(90);
  });

  it("restores pristine baseline state upon demo reset", async () => {
    const repo = getRepository();

    // Modify an area
    const areas = await repo.getAreas();
    const adyar = areas[0];
    adyar.population = 99999;
    await repo.saveArea(adyar, "Tester", "Test override");

    const modified = await repo.getAreaById(adyar.id);
    expect(modified?.population).toBe(99999);

    // Reset demo
    await repo.resetDemo();
    const restored = await repo.getAreaById(adyar.id);
    expect(restored?.population).toBe(45000);
  });
});

import { describe, it, expect } from "vitest";
import {
  calculatePriorityScore,
  calculatePopulationImpact,
  calculateUnmetNeedRatio,
} from "../../src/domain/priority/calculator";
import { Area, NeedRequest } from "../../src/domain/types";
import { DEFAULT_PRIORITY_CONFIG, getCategoryForScore } from "../../src/domain/config";

describe("Priority Engine", () => {
  it("computes the exact reference score 80.25 -> 80.3 (Critical)", () => {
    // Reference case from Section A6:
    // Severity=90, Urgency=85, Vulnerability=70, UnmetNeed=80, PopulationImpact=60
    const dummyArea: Area = {
      id: "TEST-001",
      name: "Test Ward",
      latitude: 13.0,
      longitude: 80.2,
      population: 30000, // 30,000 / 50,000 * 100 = 60
      households: 7500,
      severity: 90,
      urgency: 85,
      vulnerability: 70,
      verificationStatus: "verified",
      active: true,
      needs: [],
    };

    const snapshot = calculatePriorityScore(dummyArea, DEFAULT_PRIORITY_CONFIG, 80, 60);

    expect(snapshot.score).toBe(80.3);
    expect(snapshot.category).toBe("critical");
    expect(snapshot.categoryColor).toBe("#B42318");
    expect(snapshot.confidence).toBe("high");

    // Component verification
    const severityComp = snapshot.components.find((c) => c.factor === "severity");
    expect(severityComp?.weightedContribution).toBe(27.0);

    const urgencyComp = snapshot.components.find((c) => c.factor === "urgency");
    expect(urgencyComp?.weightedContribution).toBe(21.25);

    const vulnComp = snapshot.components.find((c) => c.factor === "vulnerability");
    expect(vulnComp?.weightedContribution).toBe(14.0);

    const needComp = snapshot.components.find((c) => c.factor === "unmetNeed");
    expect(needComp?.weightedContribution).toBe(12.0);

    const popComp = snapshot.components.find((c) => c.factor === "populationImpact");
    expect(popComp?.weightedContribution).toBe(6.0);
  });

  it("assigns categories correctly across boundaries", () => {
    expect(getCategoryForScore(80.0).category).toBe("critical");
    expect(getCategoryForScore(100.0).category).toBe("critical");
    expect(getCategoryForScore(79.9).category).toBe("high");
    expect(getCategoryForScore(60.0).category).toBe("high");
    expect(getCategoryForScore(59.9).category).toBe("moderate");
    expect(getCategoryForScore(40.0).category).toBe("moderate");
    expect(getCategoryForScore(39.9).category).toBe("low");
    expect(getCategoryForScore(0.0).category).toBe("low");
  });

  it("caps population normalization correctly at 100", () => {
    expect(calculatePopulationImpact(50000, 50000)).toBe(100);
    expect(calculatePopulationImpact(100000, 50000)).toBe(100);
    expect(calculatePopulationImpact(25000, 50000)).toBe(50);
    expect(calculatePopulationImpact(0, 50000)).toBe(0);
  });

  it("calculates unmet need ratio correctly", () => {
    const needs: NeedRequest[] = [
      { resourceType: "food", requestedQty: 1000, locallyAvailableQty: 200, unit: "packs" },
      { resourceType: "water", requestedQty: 4000, locallyAvailableQty: 1000, unit: "litres" },
    ];
    // Total requested = 5000, Total available = 1200, Unmet = 3800 -> 3800/5000 * 100 = 76%
    expect(calculateUnmetNeedRatio(needs)).toBe(76);
  });

  it("handles unverified status with reduced confidence", () => {
    const unverifiedArea: Area = {
      id: "TEST-002",
      name: "Unverified Area",
      latitude: 13.0,
      longitude: 80.2,
      population: 20000,
      households: 5000,
      severity: 60,
      urgency: 50,
      vulnerability: 40,
      verificationStatus: "unverified",
      active: true,
      needs: [],
    };

    const snapshot = calculatePriorityScore(unverifiedArea);
    expect(snapshot.confidence).toBe("low");
  });
});

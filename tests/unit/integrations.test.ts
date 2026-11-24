import { describe, it, expect } from "vitest";
import { runDeterministicAiFallback, assessEmergencyReport } from "../../src/integrations/gemini/client";
import { egmAdapter } from "../../src/integrations/elephant-goldfish/adapter";
import { runAllocation } from "../../src/domain/allocation/engine";
import { INITIAL_AREAS, INITIAL_INVENTORY } from "../../src/data/mock/seed";

describe("Gemini Integration & Fallback", () => {
  it("extracts structured resource needs via deterministic fallback when no API key", async () => {
    delete process.env.GEMINI_API_KEY;

    const report = "Urgent: 500 households cut off in Velachery by 1.5m flood water. Immediate drinking water and food packs needed. Several elderly with fever need medical attention.";
    const result = await assessEmergencyReport(report);

    expect(result.isFallback).toBe(true);
    expect(result.suggestedSeverity).toBeGreaterThanOrEqual(80);
    expect(result.suggestedUrgency).toBeGreaterThanOrEqual(80);

    const waterNeed = result.suggestedNeeds.find((n) => n.resourceType === "water");
    expect(waterNeed).toBeDefined();
    expect(waterNeed?.quantity).toBeGreaterThan(0);

    const foodNeed = result.suggestedNeeds.find((n) => n.resourceType === "food");
    expect(foodNeed).toBeDefined();

    const medicalNeed = result.suggestedNeeds.find((n) => n.resourceType === "medical");
    expect(medicalNeed).toBeDefined();
  });

  it("handles missing information detection in field reports", () => {
    const vagueReport = "Flooding is bad here. Send help immediately.";
    const result = runDeterministicAiFallback(vagueReport);

    expect(result.missingInformation.length).toBeGreaterThan(0);
    expect(result.isFallback).toBe(true);
  });
});

describe("Elephant-Goldfish Model Adapter", () => {
  it("initializes and provides complete descriptive metadata", async () => {
    const status = await egmAdapter.load();
    expect(status.status).toBe("ready");

    const desc = egmAdapter.describe();
    expect(desc.roles.Elephant).toBeDefined();
    expect(desc.roles.Goldfish).toBeDefined();
  });

  it("audits allocation runs and reports actionable findings", async () => {
    const run = runAllocation(INITIAL_AREAS, INITIAL_INVENTORY);
    const audit = await egmAdapter.auditAllocationRun(run);

    expect(audit.status).toBe("ready");
    expect(audit.persona).toBe("Auditor");
    expect(Array.isArray(audit.findings)).toBe(true);
  });

  it("provides reliable fallback without crashing", () => {
    const fb = egmAdapter.fallback();
    expect(fb.status).toBe("unavailable");
    expect(fb.isFallback).toBe(true);
  });
});

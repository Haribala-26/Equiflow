import { describe, it, expect } from "vitest";
import { z } from "zod";
import { PUT as configHandler } from "@/app/api/priority/config/route";

const weightsSchema = z
  .object({
    severity: z.number().min(0).max(1),
    urgency: z.number().min(0).max(1),
    vulnerability: z.number().min(0).max(1),
    unmetNeed: z.number().min(0).max(1),
    populationImpact: z.number().min(0).max(1),
  })
  .refine(
    (w) => {
      const sum =
        w.severity +
        w.urgency +
        w.vulnerability +
        w.unmetNeed +
        w.populationImpact;
      return Math.abs(sum - 1.0) < 0.005;
    },
    { message: "Scoring weights must sum to exactly 1.0 (100%)" }
  );

describe("MCDA Scoring Weight & Version Validation", () => {
  it("accepts valid weights summing to exactly 1.0 (100%)", () => {
    const validWeights = {
      severity: 0.3,
      urgency: 0.25,
      vulnerability: 0.2,
      unmetNeed: 0.15,
      populationImpact: 0.1,
    };

    const result = weightsSchema.safeParse(validWeights);
    expect(result.success).toBe(true);
  });

  it("rejects weights summing to less than 1.0 (e.g. 90%)", () => {
    const invalidWeights = {
      severity: 0.25,
      urgency: 0.25,
      vulnerability: 0.2,
      unmetNeed: 0.1,
      populationImpact: 0.1, // total = 0.90
    };

    const result = weightsSchema.safeParse(invalidWeights);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("must sum to exactly 1.0");
    }
  });

  it("rejects weights summing to more than 1.0 (e.g. 110%)", () => {
    const invalidWeights = {
      severity: 0.35,
      urgency: 0.3,
      vulnerability: 0.2,
      unmetNeed: 0.15,
      populationImpact: 0.1, // total = 1.10
    };

    const result = weightsSchema.safeParse(invalidWeights);
    expect(result.success).toBe(false);
  });

  it("enforces reason requirement on API updates and increments version", async () => {
    // 1. Missing reason
    const reqWithoutReason = new Request("http://localhost:3000/api/priority/config", {
      method: "PUT",
      headers: {
        "x-user-role": "admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          weights: {
            severity: 0.3,
            urgency: 0.25,
            vulnerability: 0.2,
            unmetNeed: 0.15,
            populationImpact: 0.1,
          },
        },
        reason: "",
      }),
    });

    const resFail = await configHandler(reqWithoutReason as any);
    expect(resFail.status).toBe(400);
    const bodyFail = await resFail.json();
    expect(bodyFail.error.message).toContain("reason is required");

    // 2. Valid with reason
    const reqWithReason = new Request("http://localhost:3000/api/priority/config", {
      method: "PUT",
      headers: {
        "x-user-role": "admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          weights: {
            severity: 0.35,
            urgency: 0.25,
            vulnerability: 0.15,
            unmetNeed: 0.15,
            populationImpact: 0.1,
          },
        },
        reason: "Field calibration post-cyclone warning",
      }),
    });

    const resSuccess = await configHandler(reqWithReason as any);
    expect(resSuccess.status).toBe(200);
    const bodySuccess = await resSuccess.json();
    expect(bodySuccess.config.formulaVersion).toBeDefined();
    expect(bodySuccess.config.formulaVersion).toContain("v1.");
  });
});

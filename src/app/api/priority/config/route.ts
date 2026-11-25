import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { guardPermission } from "@/lib/session";
import { calculatePriorityScore } from "@/domain/priority/calculator";
import { z } from "zod";

const weightConfigSchema = z.object({
  severity: z.number().min(0).max(100),
  urgency: z.number().min(0).max(100),
  vulnerability: z.number().min(0).max(100),
  unmetNeed: z.number().min(0).max(100),
  populationImpact: z.number().min(0).max(100),
}).refine(
  (data) => {
    // If sent as percentages (0-100 summing to 100) or decimals (0-1 summing to 1)
    const sum = data.severity + data.urgency + data.vulnerability + data.unmetNeed + data.populationImpact;
    return Math.abs(sum - 100) < 0.01 || Math.abs(sum - 1.0) < 0.001;
  },
  {
    message: "The five formula weights must sum to exactly 100% (or 1.0).",
  }
);

const updateConfigPayloadSchema = z.object({
  weights: weightConfigSchema,
  populationCap: z.number().positive().default(50000),
  reason: z
    .string({ required_error: "A descriptive justification reason is required for policy adjustments." })
    .min(5, "A descriptive justification reason is required for policy adjustments."),
});

export async function GET() {
  const repo = getRepository();
  const config = await repo.getPriorityConfig();
  const history = await repo.getPriorityConfigHistory();
  return NextResponse.json({ config, history });
}

export async function PUT(req: NextRequest) {
  // Server-side RBAC Guard: config:edit permission required
  const { session, response } = await guardPermission("config:edit", req);
  if (response) return response;

  try {
    const rawBody = await req.json();
    const payload = rawBody.config
      ? { ...rawBody.config, reason: rawBody.reason || rawBody.config.reason }
      : rawBody;
    const parsed = updateConfigPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      const firstErrorMessage =
        parsed.error.errors[0]?.message || "Formula weight validation failed.";
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: firstErrorMessage,
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { weights: rawWeights, populationCap, reason } = parsed.data;
    const repo = getRepository();
    const currentConfig = await repo.getPriorityConfig();

    // Normalize weights to 0.0 - 1.0 range if provided as percentages
    const isPercentage = rawWeights.severity > 1 || rawWeights.urgency > 1;
    const normalizedWeights = {
      severity: isPercentage ? rawWeights.severity / 100 : rawWeights.severity,
      urgency: isPercentage ? rawWeights.urgency / 100 : rawWeights.urgency,
      vulnerability: isPercentage ? rawWeights.vulnerability / 100 : rawWeights.vulnerability,
      unmetNeed: isPercentage ? rawWeights.unmetNeed / 100 : rawWeights.unmetNeed,
      populationImpact: isPercentage ? rawWeights.populationImpact / 100 : rawWeights.populationImpact,
    };

    // Increment minor version (e.g. v1.0 -> v1.1)
    const currentVer = currentConfig.formulaVersion || "v1.0";
    const verMatch = currentVer.match(/v(\d+)\.(\d+)/);
    const major = verMatch ? verMatch[1] : "1";
    const minor = verMatch ? parseInt(verMatch[2], 10) + 1 : 1;
    const newFormulaVersion = `v${major}.${minor}`;

    const newConfig = {
      formulaVersion: newFormulaVersion,
      weights: normalizedWeights,
      populationCap,
    };

    // Save configuration with audit
    await repo.updatePriorityConfig(newConfig, session.name, reason);

    // Recalculate priority scores across all areas to update map colors and leaderboards immediately
    const areas = await repo.getAreas();
    for (const area of areas) {
      calculatePriorityScore(area, newConfig);
    }

    const updatedConfig = await repo.getPriorityConfig();
    const history = await repo.getPriorityConfigHistory();

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      history,
      message: `Formula configuration updated to ${newFormulaVersion}. Area scores and map colors recalculated.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message || "Failed to update configuration" } },
      { status: 500 }
    );
  }
}

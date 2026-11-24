import { z } from "zod";

export const SuggestedNeedSchema = z.object({
  resourceType: z.enum(["food", "water", "medical", "shelter", "hygiene"]),
  quantity: z.number().nonnegative(),
  unit: z.enum(["packs", "litres", "kits"]),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.string(),
});

export const AiAssessmentOutputSchema = z.object({
  summary: z.string(),
  suggestedNeeds: z.array(SuggestedNeedSchema),
  missingInformation: z.array(z.string()),
  contradictions: z.array(z.string()),
  suggestedSeverity: z.number().min(0).max(100),
  suggestedUrgency: z.number().min(0).max(100),
  explanation: z.string(),
  isFallback: z.boolean().default(false),
  fallbackReason: z.string().optional(),
});

export type SuggestedNeed = z.infer<typeof SuggestedNeedSchema>;
export type AiAssessmentOutput = z.infer<typeof AiAssessmentOutputSchema>;

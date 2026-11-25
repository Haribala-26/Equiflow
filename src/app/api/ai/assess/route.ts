import { NextResponse } from "next/server";
import { assessEmergencyReport } from "@/integrations/gemini/client";
import { getRepository } from "@/data/repository";
import { guardPermission } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { session, response } = await guardPermission("ai:assess", req);
    if (response) return response;

    const body = await req.json();
    if (!body.reportText || typeof body.reportText !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "reportText string is required" } },
        { status: 400 }
      );
    }

    const assessment = await assessEmergencyReport(body.reportText);

    // Log audit event for AI assessment
    const repo = getRepository();
    await repo.logAuditEvent({
      actor: body.actor || session.name,
      role: session.role,
      action: "AI_ASSESSMENT_GENERATED",
      entityType: "AIAssessment",
      entityId: `AI-${Date.now().toString(36)}`,
      details: `Generated AI assessment for: "${body.reportText.slice(0, 80)}...". Mode: ${
        assessment.isFallback ? "Deterministic Heuristic Fallback" : "Gemini API"
      }`,
    });

    return NextResponse.json({ assessment });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "AI_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

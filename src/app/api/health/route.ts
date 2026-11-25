import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";

export async function GET() {
  const repo = getRepository();
  const dbHealth = await repo.checkHealth();
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");

  return NextResponse.json({
    status: dbHealth.database === "unreachable" ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbHealth.database,
        source: repo.getDataSourceName(),
        latencyMs: dbHealth.latencyMs,
      },
      geminiAi: {
        status: geminiConfigured ? "configured" : "fallback_mode",
        mode: geminiConfigured ? "Gemini 2.5 Flash" : "Deterministic Heuristic",
      },
      auditEngine: "operational",
      city: "Chennai (Tamil Nadu, India)",
    },
    demoMode: true,
  });
}

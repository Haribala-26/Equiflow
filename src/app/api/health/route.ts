import { NextResponse } from "next/server";

export async function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "MockRepository (In-Memory Transactional)",
      aiEngine: geminiConfigured ? "configured" : "fallback_mode",
      auditEngine: "operational",
      city: "Chennai (Tamil Nadu, India)",
    },
    demoMode: true,
  });
}

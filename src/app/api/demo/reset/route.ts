import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { guardPermission } from "@/lib/session";

export async function POST(req: NextRequest) {
  // Server-side RBAC Guard: demo:reset required (Administrator only)
  const { session, response } = await guardPermission("demo:reset", req);
  if (response) return response;

  const repo = getRepository();
  await repo.resetDemo();
  return NextResponse.json({
    success: true,
    message: "Baseline demo dataset restored successfully by Administrator.",
    actor: session.name,
  });
}

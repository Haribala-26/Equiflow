import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";

export async function GET() {
  const repo = getRepository();
  const events = await repo.getAuditEvents();
  return NextResponse.json({ events });
}

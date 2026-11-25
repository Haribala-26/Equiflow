import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { guardPermission } from "@/lib/session";

export async function GET(req: Request) {
  const { response } = await guardPermission("audit:view-own", req);
  if (response) return response;

  const repo = getRepository();
  const events = await repo.getAuditEvents();
  return NextResponse.json({ events });
}

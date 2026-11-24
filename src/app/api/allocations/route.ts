import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { runAllocation } from "@/domain/allocation/engine";
import { egmAdapter } from "@/integrations/elephant-goldfish/adapter";

export async function GET() {
  const repo = getRepository();
  const runs = await repo.getAllocationRuns();
  return NextResponse.json({ runs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const repo = getRepository();
    const areas = await repo.getAreas();
    const inventory = await repo.getInventory();

    const run = runAllocation(areas, inventory, undefined, {
      floorRatio: body.floorRatio,
    });

    await repo.saveAllocationRun(run, body.actor || "Coordinator");

    // Fresh-eyes EGM audit
    const egmAudit = await egmAdapter.auditAllocationRun(run);

    return NextResponse.json({ run, egmAudit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

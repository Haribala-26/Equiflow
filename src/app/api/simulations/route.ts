import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { simulateScenario } from "@/domain/simulation/engine";
import { guardPermission } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { session, response } = await guardPermission("simulation:run", req);
    if (response) return response;

    const body = await req.json();
    const repo = getRepository();
    const areas = await repo.getAreas();
    const inventory = await repo.getInventory();

    const simulation = simulateScenario(areas, inventory, {
      inventoryUpdates: body.inventoryUpdates,
      areaUpdates: body.areaUpdates,
    });

    return NextResponse.json({ simulation });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SIMULATION_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

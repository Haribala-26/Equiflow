import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { calculateShortagePredictions } from "@/domain/simulation/engine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repo = getRepository();
  const inventory = await repo.getInventory();

  const multipliers: Record<string, number> = {};
  for (const [key, val] of searchParams.entries()) {
    if (key.startsWith("mult_")) {
      const res = key.replace("mult_", "");
      multipliers[res] = parseFloat(val) || 1.0;
    }
  }

  const predictions = calculateShortagePredictions(inventory, multipliers);
  return NextResponse.json({ predictions });
}

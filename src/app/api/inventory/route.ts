import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { ResourceType } from "@/domain/types";

export async function GET() {
  const repo = getRepository();
  const inventory = await repo.getInventory();
  return NextResponse.json({ inventory });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { resourceType, updates, actor, reason } = body;

    if (!resourceType || !updates) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "resourceType and updates required" } },
        { status: 400 }
      );
    }

    const repo = getRepository();
    await repo.updateInventory(resourceType as ResourceType, updates, actor, reason);
    const updated = await repo.getInventory();
    return NextResponse.json({ inventory: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { ResourceType } from "@/domain/types";
import { guardPermission } from "@/lib/session";

export async function GET() {
  const repo = getRepository();
  const inventory = await repo.getInventory();
  return NextResponse.json({ inventory });
}

export async function PATCH(req: NextRequest) {
  // Server-side RBAC Guard: inventory:edit required (Administrator only)
  const { session, response } = await guardPermission("inventory:edit", req);
  if (response) return response;

  try {
    const body = await req.json();
    const { resourceType, updates, reason } = body;

    if (!resourceType || !updates) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "resourceType and updates required" } },
        { status: 400 }
      );
    }

    if (
      (typeof updates.total === "number" && updates.total < 0) ||
      (typeof updates.reserved === "number" && updates.reserved < 0)
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Inventory stock quantities cannot be negative." } },
        { status: 400 }
      );
    }

    const repo = getRepository();
    await repo.updateInventory(resourceType as ResourceType, updates, session.name, reason);
    const updated = await repo.getInventory();
    return NextResponse.json({ inventory: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message || "Failed to update inventory" } },
      { status: 500 }
    );
  }
}

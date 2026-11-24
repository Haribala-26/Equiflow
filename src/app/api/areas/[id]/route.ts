import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { calculatePriorityScore } from "@/domain/priority/calculator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const repo = getRepository();
  const area = await repo.getAreaById(id);

  if (!area) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Area not found" } },
      { status: 404 }
    );
  }

  const config = await repo.getPriorityConfig();
  const priority = calculatePriorityScore(area, config);

  return NextResponse.json({ area: { ...area, priority } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const repo = getRepository();
    const existing = await repo.getAreaById(id);

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Area not found" } },
        { status: 404 }
      );
    }

    const updated = {
      ...existing,
      ...body,
      id, // protect ID
    };

    await repo.saveArea(updated, body.actor || "Coordinator", body.reason);
    return NextResponse.json({ area: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const repo = getRepository();
  await repo.deleteArea(id);
  return NextResponse.json({ success: true, message: "Area deactivated" });
}

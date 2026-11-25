import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { calculatePriorityScore } from "@/domain/priority/calculator";
import { guardPermission } from "@/lib/session";

export async function GET() {
  const repo = getRepository();
  const areas = await repo.getAreas();
  const config = await repo.getPriorityConfig();

  const areasWithPriority = areas.map((area) => ({
    ...area,
    priority: calculatePriorityScore(area, config),
  }));

  return NextResponse.json({
    areas: areasWithPriority,
    totalCount: areas.length,
    activeCount: areas.filter((a) => a.active).length,
  });
}

export async function POST(req: Request) {
  try {
    const { session, response } = await guardPermission("area:edit", req);
    if (response) return response;

    const body = await req.json();
    const repo = getRepository();

    if (!body.name || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Name and coordinates are required" } },
        { status: 400 }
      );
    }

    const newArea = {
      ...body,
      id: body.id || `CHN-${String(Math.floor(Math.random() * 900) + 100)}`,
      active: true,
      needs: body.needs || [],
      verificationStatus: body.verificationStatus || "pending_review",
    };

    await repo.saveArea(newArea, body.actor || session.name, body.reason);
    return NextResponse.json({ area: newArea }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

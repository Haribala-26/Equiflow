import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";

export async function GET() {
  const repo = getRepository();
  const config = await repo.getPriorityConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const repo = getRepository();

    await repo.updatePriorityConfig(body.config, body.actor || "Administrator", body.reason);
    const updated = await repo.getPriorityConfig();
    return NextResponse.json({ config: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

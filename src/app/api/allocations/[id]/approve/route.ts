import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const repo = getRepository();

    await repo.approveAllocationRun(id, body.actor || "Coordinator Raman");
    const updated = await repo.getAllocationRunById(id);

    return NextResponse.json({ success: true, run: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "APPROVAL_FAILED", message: error.message } },
      { status: 400 }
    );
  }
}

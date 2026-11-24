import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.reason) {
      return NextResponse.json(
        { error: { code: "REASON_REQUIRED", message: "A rejection reason is mandatory" } },
        { status: 400 }
      );
    }

    const repo = getRepository();
    await repo.rejectAllocationRun(id, body.actor || "Coordinator Raman", body.reason);
    const updated = await repo.getAllocationRunById(id);

    return NextResponse.json({ success: true, run: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "REJECTION_FAILED", message: error.message } },
      { status: 400 }
    );
  }
}

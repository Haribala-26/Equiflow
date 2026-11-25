import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { guardPermission } from "@/lib/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await guardPermission("allocation:approve", req);
    if (response) return response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const repo = getRepository();

    await repo.approveAllocationRun(id, body.actor || session.name);
    const updated = await repo.getAllocationRunById(id);

    return NextResponse.json({ success: true, run: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "APPROVAL_FAILED", message: error.message } },
      { status: 400 }
    );
  }
}

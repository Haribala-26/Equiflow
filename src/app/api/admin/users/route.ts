import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/data/repository";
import { guardPermission } from "@/lib/session";
import { z } from "zod";

const updateUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "coordinator", "field_officer", "resource_manager", "auditor", "viewer"]).optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { session, response } = await guardPermission("user:manage", req);
  if (response) return response;

  const repo = getRepository();
  const users = await repo.getUsers();
  return NextResponse.json({ users, session });
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await guardPermission("user:manage", req);
  if (response) return response;

  try {
    const rawBody = await req.json();
    const parsed = updateUserSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const { id, role, active } = parsed.data;
    const repo = getRepository();
    await repo.updateUser(id, { role, active }, session.name);

    const updatedUsers = await repo.getUsers();
    return NextResponse.json({
      success: true,
      users: updatedUsers,
      message: `User ${id} updated successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: err.message || "Failed to update user." } },
      { status: 500 }
    );
  }
}

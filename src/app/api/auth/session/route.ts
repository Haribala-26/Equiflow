import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserRole } from "@/domain/types";
import { getServerSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await getServerSession(req);
  return NextResponse.json({ session });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = body?.role?.toLowerCase() as UserRole;

    const validRoles: UserRole[] = ["admin", "coordinator", "field_officer", "resource_manager", "auditor", "viewer"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: { code: "INVALID_ROLE", message: "Role must be a valid UserRole." } },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, role, {
      path: "/",
      httpOnly: false, // Accessible by client JS as well
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      session: {
        role,
        name: ROLE_LABELS[role] || "Emergency Coordinator",
      },
      message: `Session role switched to ${role}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to set session" } },
      { status: 500 }
    );
  }
}

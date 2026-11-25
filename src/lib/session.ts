import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UserRole, UserSession } from "@/domain/types";
import { hasPermission, Permission, ROLE_LABELS } from "./rbac";

export const SESSION_COOKIE_NAME = "equiflow_role";

const VALID_ROLES: UserRole[] = [
  "admin",
  "coordinator",
  "field_officer",
  "resource_manager",
  "auditor",
  "viewer",
];

/**
 * Resolves the active user session on the server.
 * Priority: Request Header (x-user-role) -> Cookie (equiflow_role) -> Default ('coordinator')
 */
export async function getServerSession(req?: Request): Promise<UserSession> {
  let role: UserRole = "coordinator";

  if (req) {
    const headerRole = req.headers.get("x-user-role")?.toLowerCase();
    if (headerRole && VALID_ROLES.includes(headerRole as UserRole)) {
      role = headerRole as UserRole;
    }
  }

  if (role === "coordinator") {
    try {
      const cookieStore = await cookies();
      const cookieRole = cookieStore.get(SESSION_COOKIE_NAME)?.value?.toLowerCase();
      if (cookieRole && VALID_ROLES.includes(cookieRole as UserRole)) {
        role = cookieRole as UserRole;
      }
    } catch {
      // In non-request or edge context, keep default
    }
  }

  return {
    role,
    name: ROLE_LABELS[role] || "Emergency Coordinator",
  };
}

/**
 * Guard utility for API routes. Returns null if authorized,
 * or a 403 Forbidden NextResponse if unauthorized.
 */
export async function guardPermission(
  permission: Permission,
  req?: Request
): Promise<{ session: UserSession; response: NextResponse | null }> {
  const session = await getServerSession(req);

  if (!hasPermission(session.role, permission)) {
    return {
      session,
      response: NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: `Access denied. Role '${session.role}' lacks '${permission}' permission.`,
            requiredPermission: permission,
            currentRole: session.role,
          },
        },
        { status: 403 }
      ),
    };
  }

  return { session, response: null };
}

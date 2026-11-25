import { UserRole } from "@/domain/types";

export type Permission =
  | "area:view"
  | "area:edit"
  | "ai:assess"
  | "ai:review"
  | "allocation:run"
  | "allocation:approve"
  | "allocation:override"
  | "simulation:run"
  | "simulation:apply"
  | "inventory:view"
  | "inventory:edit"
  | "config:view"
  | "config:edit"
  | "audit:view-own"
  | "audit:view-all"
  | "user:manage"
  | "demo:reset"
  | "system:status";

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: [
    "area:view",
    "area:edit",
    "ai:assess",
    "ai:review",
    "allocation:run",
    "allocation:approve",
    "allocation:override",
    "simulation:run",
    "simulation:apply",
    "inventory:view",
    "inventory:edit",
    "config:view",
    "config:edit",
    "audit:view-own",
    "audit:view-all",
    "user:manage",
    "demo:reset",
    "system:status",
  ],
  coordinator: [
    "area:view",
    "area:edit",
    "ai:assess",
    "ai:review",
    "allocation:run",
    "allocation:approve",
    "allocation:override",
    "simulation:run",
    "simulation:apply",
    "inventory:view",
    "config:view",
    "audit:view-own",
  ],
  field_officer: [
    "area:view",
    "area:edit",
    "ai:assess",
  ],
  resource_manager: [
    "inventory:view",
    "inventory:edit",
    "area:view",
  ],
  auditor: [
    "area:view",
    "inventory:view",
    "audit:view-all",
    "audit:view-own",
    "config:view",
  ],
  viewer: [
    "area:view",
    "inventory:view",
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  coordinator: "Emergency Coordinator",
  field_officer: "Field Officer",
  resource_manager: "Resource Manager",
  auditor: "Independent Auditor",
  viewer: "Public Viewer",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "System governance, formula configuration, inventory editing, and user management.",
  coordinator: "Operations focus: field needs, allocation approvals, dispatching, and simulations.",
  field_officer: "On-ground reconnaissance and emergency report submissions.",
  resource_manager: "Central warehouse logistics and stock replenishment.",
  auditor: "Independent oversight and compliance auditing.",
  viewer: "Read-only situational awareness telemetry.",
};

/**
 * Check if a given role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Get all permissions assigned to a role.
 */
export function getRolePermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

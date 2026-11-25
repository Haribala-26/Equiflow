import { describe, it, expect } from "vitest";
import { hasPermission, getRolePermissions, ROLE_PERMISSIONS, ROLE_LABELS } from "../../src/lib/rbac";
import { UserRole } from "../../src/domain/types";

describe("RBAC Permission Matrix", () => {
  it("grants complete operational and administrative permissions to Administrator", () => {
    const adminPerms = getRolePermissions("admin");
    expect(adminPerms.length).toBeGreaterThan(15);
    expect(hasPermission("admin", "config:edit")).toBe(true);
    expect(hasPermission("admin", "inventory:edit")).toBe(true);
    expect(hasPermission("admin", "demo:reset")).toBe(true);
    expect(hasPermission("admin", "user:manage")).toBe(true);
    expect(hasPermission("admin", "allocation:approve")).toBe(true);
  });

  it("restricts Emergency Coordinator to operational permissions only", () => {
    expect(hasPermission("coordinator", "area:view")).toBe(true);
    expect(hasPermission("coordinator", "area:edit")).toBe(true);
    expect(hasPermission("coordinator", "allocation:run")).toBe(true);
    expect(hasPermission("coordinator", "allocation:approve")).toBe(true);
    expect(hasPermission("coordinator", "simulation:run")).toBe(true);
    expect(hasPermission("coordinator", "inventory:view")).toBe(true);

    // Forbidden for Coordinator
    expect(hasPermission("coordinator", "config:edit")).toBe(false);
    expect(hasPermission("coordinator", "inventory:edit")).toBe(false);
    expect(hasPermission("coordinator", "demo:reset")).toBe(false);
    expect(hasPermission("coordinator", "user:manage")).toBe(false);
    expect(hasPermission("coordinator", "audit:view-all")).toBe(false);
    expect(hasPermission("coordinator", "system:status")).toBe(false);
  });

  it("handles future roles gracefully without refactoring", () => {
    expect(hasPermission("viewer", "area:view")).toBe(true);
    expect(hasPermission("viewer", "area:edit")).toBe(false);
    expect(hasPermission("resource_manager", "inventory:edit")).toBe(true);
    expect(hasPermission("resource_manager", "config:edit")).toBe(false);
  });

  it("provides comprehensive role descriptions and human-readable labels", () => {
    expect(ROLE_LABELS.admin).toBe("Administrator");
    expect(ROLE_LABELS.coordinator).toBe("Emergency Coordinator");
  });
});

import { describe, it, expect } from "vitest";
import { POST as resetHandler } from "@/app/api/demo/reset/route";
import { PATCH as inventoryHandler } from "@/app/api/inventory/route";
import { PUT as configHandler } from "@/app/api/priority/config/route";
import { GET as adminUsersHandler } from "@/app/api/admin/users/route";
import { POST as allocationHandler } from "@/app/api/allocations/route";
import { GET as areasHandler } from "@/app/api/areas/route";

describe("Server-Side RBAC Guard Enforcement", () => {
  it("rejects Emergency Coordinator with HTTP 403 on demo reset", async () => {
    const req = new Request("http://localhost:3000/api/demo/reset", {
      method: "POST",
      headers: { "x-user-role": "coordinator" },
    });

    const res = await resetHandler(req as any);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.requiredPermission).toBe("demo:reset");
  });

  it("rejects Emergency Coordinator with HTTP 403 on inventory edits", async () => {
    const req = new Request("http://localhost:3000/api/inventory", {
      method: "PATCH",
      headers: {
        "x-user-role": "coordinator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resourceType: "food",
        updates: { total: 10000 },
        reason: "Unauthorized adjustment",
      }),
    });

    const res = await inventoryHandler(req as any);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.requiredPermission).toBe("inventory:edit");
  });

  it("rejects Emergency Coordinator with HTTP 403 on formula configuration changes", async () => {
    const req = new Request("http://localhost:3000/api/priority/config", {
      method: "PUT",
      headers: {
        "x-user-role": "coordinator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          weights: {
            severity: 0.3,
            urgency: 0.25,
            vulnerability: 0.2,
            unmetNeed: 0.15,
            populationImpact: 0.1,
          },
        },
        reason: "Unauthorized formula change",
      }),
    });

    const res = await configHandler(req as any);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.requiredPermission).toBe("config:edit");
  });

  it("rejects Emergency Coordinator with HTTP 403 on admin user directory access", async () => {
    const req = new Request("http://localhost:3000/api/admin/users", {
      method: "GET",
      headers: { "x-user-role": "coordinator" },
    });

    const res = await adminUsersHandler(req as any);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.requiredPermission).toBe("user:manage");
  });

  it("allows Administrator to access admin user directory", async () => {
    const req = new Request("http://localhost:3000/api/admin/users", {
      method: "GET",
      headers: { "x-user-role": "admin" },
    });

    const res = await adminUsersHandler(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.users).toBeDefined();
    expect(body.users.length).toBeGreaterThanOrEqual(1);
  });

  it("allows Administrator to execute demo reset", async () => {
    const req = new Request("http://localhost:3000/api/demo/reset", {
      method: "POST",
      headers: { "x-user-role": "admin" },
    });

    const res = await resetHandler(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("restored successfully");
  });

  it("allows Emergency Coordinator to perform operational tasks (view areas and run allocation)", async () => {
    // 1. View areas
    const areasReq = new Request("http://localhost:3000/api/areas", {
      method: "GET",
      headers: { "x-user-role": "coordinator" },
    });
    const areasRes = await areasHandler();
    expect(areasRes.status).toBe(200);

    // 2. Run allocation
    const allocReq = new Request("http://localhost:3000/api/allocations", {
      method: "POST",
      headers: {
        "x-user-role": "coordinator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const allocRes = await allocationHandler(allocReq);
    expect(allocRes.status).toBe(201);
  });
});

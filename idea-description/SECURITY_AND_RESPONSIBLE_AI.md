# Equiflow — Security & Responsible AI Architecture

## 1. Role-Based Access Control (RBAC) Specification

Equiflow implements a centralized, declarative Permission Matrix in `src/lib/rbac.ts`. Access control is enforced both in the UI and server-side across all API routes.

### 1.1 Permission Matrix (Single Source of Truth)

| Permission Key | Description | Admin | Coordinator | Field Officer | Resource Mgr | Auditor | Viewer |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `area:view` | Inspect municipal ward data & priority scores | Yes | Yes | Yes | Yes | Yes | Yes |
| `area:edit` | Update ward severity, urgency, or need requests | Yes | Yes | Yes | No | No | No |
| `ai:assess` | Ingest field reports and trigger AI assessment | Yes | Yes | Yes | No | No | No |
| `ai:review` | Accept, edit, or reject AI suggested values | Yes | Yes | No | No | No | No |
| `allocation:run` | Compute constrained optimization runs | Yes | Yes | No | No | No | No |
| `allocation:approve`| Authorize or reject allocation dispatch orders | Yes | Yes | No | No | No | No |
| `allocation:override`| Override recommended quantities with justification | Yes | Yes | No | No | No | No |
| `simulation:run` | Execute what-if stress tests | Yes | Yes | No | No | No | No |
| `simulation:apply`| Commit simulated scenario to live baseline | Yes | Yes | No | No | No | No |
| `inventory:view` | View warehouse stock and shortage burn rates | Yes | Yes | No | Yes | Yes | Yes |
| `inventory:edit` | Modify warehouse stock levels and reserves | Yes | **No** | No | Yes | No | No |
| `config:view` | View MCDA scoring weights and formula version | Yes | Yes | No | No | Yes | No |
| `config:edit` | Calibrate scoring weights (sum=100%) and pop cap | Yes | **No** | No | No | No | No |
| `audit:view-own` | View recent operational event logs | Yes | Yes | No | No | Yes | No |
| `audit:view-all` | Access full system audit trail and overrides | Yes | **No** | No | No | Yes | No |
| `user:manage` | Assign roles and toggle personnel access | Yes | **No** | No | No | No | No |
| `demo:reset` | Reset system back to deterministic seed | Yes | **No** | No | No | No | No |
| `system:status` | View system health, database latency, and AI status| Yes | **No** | No | No | No | No |

---

## 2. Server-Side Guard Enforcement

Hiding buttons in the client UI is insufficient for humanitarian disaster systems. Every API endpoint enforces authorization via `guardPermission(permission, req)` in `src/lib/session.ts`:

```typescript
// Example: Formula Calibration Route (src/app/api/priority/config/route.ts)
export async function PUT(req: NextRequest) {
  const { session, response } = await guardPermission("config:edit", req);
  if (response) return response; // Returns HTTP 403 Forbidden with details if unauthorized
  
  // Proceed with authorized mutation...
}
```

If an unauthorized role attempts to invoke a restricted route:
- The server responds with **HTTP 403 Forbidden**.
- The response returns a structured error object indicating the missing permission and active role without leaking sensitive stack traces.
- The unauthorized attempt is logged to the audit stream.

---

## 3. Responsible AI & Human-in-the-Loop Safeguards

1. **Deterministic Algorithmic Bounds**: AI models (Gemini 2.5 Flash) are used exclusively for semantic comprehension—parsing free-text situational narratives from field workers into structured demand candidates. AI is **never** permitted to directly distribute or allocate humanitarian resources. All resource math is strictly governed by deterministic linear programming and proportional rationing engines.
2. **Deterministic Heuristic Fallback**: If the Gemini API is unreachable, throttled, or encounters network errors, the system seamlessly activates a zero-latency deterministic keyword heuristic parser. System functionality never crashes due to upstream AI outages.
3. **Mandatory Human-in-the-Loop Gate**: All AI-extracted data is presented as suggestions with confidence scores. A human coordinator must explicitly review, adjust, and approve suggestions before they enter the mathematical allocation pipeline.
4. **Transparent Explainability**: Every priority score output includes a component breakdown explaining the weighted contribution of each factor.

---

## 4. Cryptographic & Append-Only Audit Logging

All system mutations—allocation approvals, manual overrides, scoring weight adjustments, stock replenishment, and AI report generations—generate immutable `AuditEvent` records. The audit log is strictly append-only; update and delete operations are rejected at the database level.

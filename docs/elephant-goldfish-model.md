# Elephant–Goldfish Model (EGM) Integration in EQUIFLOW

## 1. Executive Summary

The **Elephant–Goldfish Model (EGM)** is an open-source methodology and AI assistant plugin designed by Google to reconcile long-term context retention with unbiased, critical document verification.

- **The Elephant**: Represents context awareness, memory of project history, user requirements, and constraints. In EQUIFLOW, the Elephant persona designs specifications and drafts domain logic.
- **The Goldfish**: Represents a fresh-eyes persona that examines drafts without conversational baggage or unstated assumptions. It reviews documents and designs for blind spots, edge cases, implementation risks, and ambiguities.

---

## 2. Model Capabilities & Role in EQUIFLOW

In EQUIFLOW, EGM is integrated as an **advisory architectural and documentation audit layer** through a decoupled adapter (`ElephantGoldfishAdapter`):

1. **Document & Specification Review**: Auditing emergency response plans, policy guidelines, and allocation reports.
2. **Fresh-Eyes Assessment Audit**: Providing independent adversarial checks on need assessment drafts before coordinators sign off.
3. **Implementation Readiness Check**: Validating that operational scenarios and allocation decisions follow documented constraints without hidden assumptions.

---

## 3. Architecture & Interface

```
┌──────────────────────────────────────────────┐
│             EQUIFLOW Core Domain             │
│   (Priority Engine & Allocation Engine)      │
└──────────────────────┬───────────────────────┘
                       │ (Never imports EGM directly)
                       ▼
┌──────────────────────────────────────────────┐
│       ElephantGoldfishAdapter (Isolated)     │
├──────────────────────────────────────────────┤
│ + load(): Promise<AdapterStatus>             │
│ + describe(): ModelMetadata                  │
│ + reviewDocument(docText): Promise<Review>   │
│ + auditAllocation(run): Promise<AuditResult> │
│ + fallback(): FallbackReviewResult           │
└──────────────────────────────────────────────┘
```

### Typed Interface

```typescript
export interface EgmFinding {
  severity: "critical" | "warning" | "info";
  category: "structural" | "assumption" | "readiness" | "bias";
  description: string;
  recommendation: string;
}

export interface EgmAuditResult {
  status: "ready" | "degraded" | "unavailable";
  findings: EgmFinding[];
  timestamp: string;
  isFallback: boolean;
}
```

---

## 4. Inputs & Outputs

- **Inputs**:
  - Emergency Incident Briefs
  - Allocation Run Summaries (resource totals, unmet demand, fairness metrics)
  - Need Request Narratives
- **Outputs**:
  - Critical Review Findings: Flagging potential resource bottlenecks or missing geographical factors.
  - Assumptions Checklist: Validating if population vulnerability assumptions are justified.
  - Advisory Score: An explainable, non-binding review rating (0–100) presented alongside the primary deterministic score.

---

## 5. Critical Invariants & Fallback Behaviour

1. **Non-Blocking Invariant**: EGM **never** decides resource quantities and **never** blocks the deterministic priority calculation or allocation execution.
2. **Fallback Behaviour**: If the EGM plugin or subagent environment is unavailable or fails health checks:
   - The adapter returns `{ status: "unavailable", findings: [], isFallback: true }`.
   - The UI displays an "EGM Advisory: Offline (Core Operations Active)" status badge.
   - All priority scoring, resource allocation, and map visualizations proceed with 100% functionality.

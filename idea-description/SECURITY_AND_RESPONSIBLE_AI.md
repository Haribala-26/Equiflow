# Security and Responsible AI Specification

## 1. Role-Based Access Control (RBAC)

| Role | View Data | Edit Areas | Edit Stock | Run Allocations | Approve Allocations | Change Weights | Reset Demo |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Administrator** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **Emergency Coordinator** | ✔ | ✔ | ✖ | ✔ | ✔ | ✖ | ✖ |
| **Field Officer** | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| **Resource Manager** | ✔ | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ |
| **Auditor / Public Viewer**| ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |

## 2. Responsible AI Guardrails

1. **Human-in-the-Loop Approval**: Every allocation recommendation requires authorized human sign-off before inventory is committed.
2. **Mandatory Override Rationale**: Any manual modification of priority scores or allocated quantities requires an explicit text reason logged to the immutable audit log.
3. **No Unilateral AI Actions**: Gemini and EGM outputs are strictly advisory suggestions.
4. **Data Minimization**: No personal identifying information (PII) is stored or processed.

# ADR-003: Server-Side RBAC Guard & Session Governance

## Status
**Accepted**

## Context
Disaster management involves distinct personas:
- **Emergency Coordinators** need real-time operational views, ward prioritization, truck dispatch sign-offs, and shortage alerts.
- **Administrators** need system governance, scoring formula calibration, warehouse stock limits, and audit stream access.
Hiding buttons in the client UI is insufficient for security; API endpoints must enforce role restrictions server-side.

## Decision
1. Implement centralized typed permissions in `src/lib/rbac.ts` (`area:view`, `area:edit`, `allocation:approve`, `config:edit`, `admin:reset`).
2. Implement server-side session resolution in `src/lib/session.ts` with a `guardPermission()` helper.
3. Every mutating API route checks permissions server-side and immediately returns `HTTP 403 Forbidden` if unauthorized.
4. Client UI displays an explicit `AccessRestricted` component when visiting restricted administration routes.

## Consequences
- **Positive**: Prevents privilege escalation and tampering with scoring weights or warehouse totals.
- **Positive**: Demonstrates institutional governance required for government and UN agency deployments.

# Elephant–Goldfish Integration Specification

## 1. Overview

The Elephant–Goldfish Model (EGM) provides independent, adversarial review of project specifications, design documents, and operational allocation plans.

## 2. Role in EQUIFLOW

- **Elephant Persona**: Maintains deep project context, operational constraints, Chennai demographic data, and formula configurations.
- **Goldfish Persona**: Reviews allocation outcomes and emergency plans with fresh eyes, catching unstated assumptions, geographic biases, and edge cases.

## 3. Implementation

The integration is encapsulated in `src/integrations/elephant-goldfish/adapter.ts`:
- Validates model availability via plugin hooks.
- Audits allocation runs for disparity anomalies.
- Yields a structured review object with actionable recommendations.
- Implements complete fallback if the plugin is unreachable.

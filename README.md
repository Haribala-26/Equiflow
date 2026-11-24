# EQUIFLOW — Responsible AI Emergency Resource Distribution Platform

> **Primary Demonstration City:** Chennai, Tamil Nadu, India  
> **Built for:** Google Antigravity & Disaster Humanitarian Logistics  
> **Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Leaflet OpenStreetMap, Google Gemini API, Elephant–Goldfish Model Plugin

---

## 🌟 Executive Summary

**EQUIFLOW** is an industrial-grade, AI-assisted decision-support platform designed to solve the critical crisis of emergency relief distribution during disasters. 

Equal distribution does not equal fair distribution. EQUIFLOW computes transparent priority scores across affected wards using a strict 5-factor mathematical formula, enforces constrained multi-resource optimization ensuring minimum essential coverage, grounds decisions on a genuine interactive Chennai OpenStreetMap, and leverages Google Gemini for unstructured field report extraction with deterministic fallback guarantees.

---

## 🚀 Quickstart

### Prerequisites
- Node.js (v20+ or v22 LTS recommended)
- npm or pnpm

### Run Locally

```bash
# 1. Clone or navigate to the project directory
cd C:\Users\HP\.gemini\antigravity\scratch\equiflow

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

EQUIFLOW comes with a complete Vitest unit and integration test suite:

```bash
# Run strict TypeScript typechecking
npm run typecheck

# Run all 20 unit and integration tests
npm run test

# Run optimized production build
npm run build
```

---

## 🏗️ Architecture & Core Modules

1. **Operations Dashboard (`/`)**: Live operational telemetry, KPI cards, real Chennai map, and live priority leaderboard.
2. **Affected Communities (`/affected-areas`)**: Searchable and filterable registry of 7 Chennai wards (Adyar, Velachery, Saidapet, Perungudi, T. Nagar, Mylapore, Anna Nagar), formula component breakdowns, and the Gemini AI Field Report Assessment tool.
3. **Resource Inventory (`/resource-inventory`)**: Central warehouse inventory tracking Food Packs, Drinking Water, Medical Kits, Shelter Kits, and Hygiene Kits with reservation management.
4. **Allocation Centre (`/allocation-centre`)**: 2-Phase constrained optimization engine (floor coverage pass + weighted proportional pass with largest remainder rounding), fairness metrics, Elephant–Goldfish Model audit, and authorized coordinator dispatch sign-off.
5. **Interactive Map View (`/map-view`)**: Full-screen OpenStreetMap view with synchronized category-colored markers, marker popups, and click-to-focus fly-to telemetry.
6. **What-If Simulations (`/simulations`)**: Sandbox testing supply reductions, population surges, and severity spikes without mutating baseline data.
7. **Reports & Audit Trail (`/reports-audit`)**: Append-only audit log tracking every decision, override rationale, and timestamp.
8. **Settings & Policy Tuning (`/settings`)**: Configurable scoring weights, city switcher (Chennai vs. Coimbatore), and one-click pristine demo reset.

---

## 🛡️ Responsible AI Guardrails

- **AI Never Decides Quantities**: Google Gemini extracts unstructured field requests and explains scores; mathematical algorithms control actual inventory.
- **Deterministic Fallback**: If `GEMINI_API_KEY` is not present, the system runs with local pattern-matching heuristic extraction.
- **Elephant–Goldfish Review**: Adversarial fresh-eyes review catches equity disparity and unstated assumptions before dispatches are committed.
- **Human-in-the-Loop**: All dispatches require authorized sign-off. Any manual override demands an explicit rationale recorded in the audit trail.

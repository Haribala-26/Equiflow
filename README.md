# EQUIFLOW — Intelligent Emergency Resource Distribution Platform

> **Primary Focus City:** Chennai, Tamil Nadu, India  
> **Domain:** Humanitarian Logistics & Disaster Relief Optimization  
> **Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Leaflet OpenStreetMap, Recharts, Vitest

---

## 🌟 Overview

During severe emergencies and natural disasters (such as the monsoon floods in Chennai), emergency response teams face an urgent operational challenge: **relief supplies are severely limited, and demand surges unpredictably across multiple affected areas.**

Equal distribution is not fair distribution. Giving every neighborhood 50 food packs when one zone is submerged in 5 feet of water while another has minor waterlogging causes preventable loss of life.

**EQUIFLOW** is an industrial-grade, AI-assisted decision-support platform designed to replace chaotic guesswork with mathematical fairness, transparent priority scoring, real-time geographic tracking, and automated audit safeguards.

---

## 📐 Mathematical Formulation

EQUIFLOW enforces a strict separation between **AI assistance** and **deterministic math**. While AI helps transcribe and structure messy field messages from the ground, **all resource quantities and priority rankings are computed deterministically.**

### 1. The 5-Factor Priority Scoring Engine

Every monitored area receives a composite Priority Score $P \in [0, 100]$:

$$P = (w_s \cdot S) + (w_u \cdot U) + (w_v \cdot V) + (w_n \cdot N) + (w_p \cdot \min(100, \frac{\text{Pop}}{C_{pop}} \times 100))$$

| Factor | Weight | Description |
| :--- | :---: | :--- |
| **Severity ($S$)** | **30%** | Physical hazard level (flood depth, structural collapse, water levels) |
| **Urgency ($U$)** | **25%** | Time-criticality (isolation, medical emergencies, imminent danger) |
| **Vulnerability ($V$)** | **20%** | Proportion of infants, elderly, pregnant women, and disabled citizens |
| **Unmet Need Ratio ($N$)** | **15%** | Historical deficit ratio ($\frac{\text{Requested} - \text{Received}}{\text{Requested}}$) |
| **Population Impact ($P$)** | **10%** | Scale of affected population capped at 50,000 threshold |

#### Priority Tiers:
- 🔴 **Critical ($P \ge 80$):** Immediate life-support danger (Submerged, zero access)
- 🟠 **High ($60 \le P < 80$):** High vulnerability, severe shortages
- 🟡 **Moderate ($40 \le P < 60$):** Stable, localized shortages
- 🟢 **Low ($P < 40$):** Minimal hazard, baseline monitoring

---

### 2. The 2-Phase Constrained Allocation Algorithm

When total requested resources exceed available warehouse inventory ($\sum \text{Demand} > \text{Supply}$), EQUIFLOW runs a 2-phase constrained optimization:

1. **Phase 1: Minimum Floor Coverage (Anti-Starvation Pass)**  
   Guarantees that every active, eligible area receives at least **20%** of its essential survival needs (drinking water and food packs) before any area receives surplus stock.

2. **Phase 2: Weighted Proportional Distribution**  
   The remaining warehouse stock is divided among eligible areas proportionally based on their priority score and unmet demand:
   $$\text{Share}_i = \text{RemainingSupply} \times \frac{P_i \times \text{Deficit}_i}{\sum (P_k \times \text{Deficit}_k)}$$
   Discreet indivisible units (e.g., cans, packs) are rounded using the **Hamilton-Hare Largest Remainder Method** to ensure zero unit leakage.

---

## 🏗️ System Architecture & Modules

```
equiflow/
├── src/
│   ├── app/                      # Next.js App Router (Pages & REST Endpoints)
│   │   ├── page.tsx              # Mission Control Overview Dashboard
│   │   ├── affected-areas/       # 7 Chennai Wards & AI Field Assessment Tool
│   │   ├── resource-inventory/   # Warehouse Stock & 7-Day Burn Forecast
│   │   ├── allocation-centre/    # 2-Phase Allocation Engine & Truck Dispatches
│   │   ├── map-view/             # Fullscreen Chennai OpenStreetMap
│   │   ├── reports-audit/        # Tamper-Proof Accountability Ledger & Export
│   │   ├── settings/             # Formula Tuning & Pristine Demo Reset
│   │   └── api/                  # REST API routes
│   │
│   ├── domain/                   # Pure Mathematical Engines
│   │   ├── priority/             # 5-factor scoring calculator
│   │   ├── allocation/           # 2-phase constrained allocation algorithm
│   │   ├── config.ts             # Weights, priority thresholds & coordinates
│   │   └── types.ts              # Strongly-typed domain interfaces
│   │
│   ├── components/               # Frontend UI Components
│   │   ├── map/                  # Leaflet interactive map & color-coded markers
│   │   ├── charts/               # Recharts visualizations (shortages, distributions)
│   │   └── layout/               # Header bar and Sidebar navigation
│   │
│   ├── integrations/             # AI & Audit Adapters
│   │   ├── gemini/               # Natural language field report analyzer
│   │   └── elephant-goldfish/    # Automated quality & fairness audit adapter
│   │
│   └── data/                     # Data Storage & Seed Records
│       ├── mock/seed.ts          # 7 Chennai flood zones & emergency stock
│       └── mock/repository.ts    # Transactional in-memory state repository
│
├── tests/                        # Vitest Unit & Integration Suites
├── idea-description/             # 15 Detailed Architecture Specifications
├── package.json                  # Dependencies & scripts
└── README.md                     # Project documentation
```

---

## 🗺️ Monitored Flood Wards (Chennai, Tamil Nadu)

EQUIFLOW comes pre-configured with 7 active flood zones mapped across Greater Chennai:

| Ward Code | Zone / Neighborhood | Coordinates | Population | Baseline Status |
| :--- | :--- | :---: | :---: | :---: |
| **CHN-001** | **Velachery South** | `12.9815, 80.2180` | 42,000 | 🔴 Critical (Waterlogging > 1.5m) |
| **CHN-002** | **Vyasarpadi Industrial** | `13.1118, 80.2612` | 58,000 | 🔴 Critical (Industrial canal breach) |
| **CHN-003** | **Saidapet Canal Basin** | `13.0213, 80.2231` | 36,000 | 🟠 High (Adyar river overflow) |
| **CHN-004** | **Perungudi Lowlands** | `12.9654, 80.2461` | 29,000 | 🟠 High (Marshland runoff) |
| **CHN-005** | **T. Nagar Commercial Basin** | `13.0418, 80.2341` | 48,000 | 🟡 Moderate (Drainage congestion) |
| **CHN-006** | **Mylapore Coastal Fringe** | `13.0368, 80.2676` | 31,000 | 🟢 Low (Elevated coastal zone) |
| **CHN-007** | **Anna Nagar North** | `13.0850, 80.2101` | 52,000 | 🟢 Low (Minor street water) |

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v20+ or v22 LTS
- **npm** or **pnpm**

### Installation & Local Setup

```bash
# 1. Clone repository
git clone https://github.com/Haribala-26/equiflow.git
cd equiflow

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional)
cp .env.example .env.local
# Add your GEMINI_API_KEY (system includes deterministic fallback if omitted)

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Quality Verification & Testing

EQUIFLOW enforces 100% test passing across mathematical calculations, API routes, and edge-case handling:

```bash
# Run unit and integration tests (20 / 20 passing)
npm run test

# Run strict TypeScript compiler verification (0 errors)
npm run typecheck

# Build optimized production bundle
npm run build

# Start production server
npm run start
```

---

## 🐳 Docker Deployment

To run EQUIFLOW in an isolated containerized environment:

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Check running status
docker-compose ps
```

The container will be accessible at `http://localhost:3000`.

---

## 🔒 Responsible AI & Governance

1. **Deterministic Core:** AI does not dictate supply volumes or delivery orders. All mathematical computations are auditable and reproducible.
2. **Deterministic Fallback:** If internet access or API services are unavailable in a disaster zone, the system automatically uses local regex/heuristic field report extraction.
3. **Automated Equity Auditing:** The internal audit adapter continuously analyzes allocations for bias, disparity, and starvation before coordinator sign-off.
4. **Human-in-the-Loop:** All truck dispatches require explicit approval from the Emergency Coordinator.

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

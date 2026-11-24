# Priority Scoring Engine Specification

## 1. Mathematical Formulation

The Priority Score is calculated through a deterministic multi-criteria weighting function:

$$\text{Priority Score} = (\text{Severity} \times 0.30) + (\text{Urgency} \times 0.25) + (\text{Vulnerability} \times 0.20) + (\text{Unmet Need} \times 0.15) + (\text{Population Impact} \times 0.10)$$

Every input factor is normalized on a strict scale of $[0, 100]$.

### Factor Definitions & Normalization

| Factor | Weight | Normalization Methodology |
|---|---:|---|
| **Severity ($S$)** | 30% | Direct scale $[0, 100]$ based on disaster impact, structural damage, water levels. |
| **Urgency ($U$)** | 25% | Direct scale $[0, 100]$ reflecting time-to-criticality (e.g. rising waters, hypothermia risk). |
| **Vulnerability ($V$)** | 20% | De-duplicated percentage of infants, elderly, pregnant, and disabled individuals $[0, 100]$. |
| **Unmet Need ($N$)** | 15% | Aggregated ratio: $\min\left(100, \frac{\text{Total Requested} - \text{Locally Available}}{\text{Total Requested}} \times 100\right)$. |
| **Population Impact ($P$)** | 10% | Capped normalization: $\min\left(100, \frac{\text{Affected Population}}{\text{Population Cap}} \times 100\right)$, where default cap $= 50,000$. |

---

## 2. Priority Categories

| Range | Category | Color Hex | Action Trigger |
|---|---|---|---|
| **80.0 – 100.0** | Critical | `#B42318` | Immediate dispatch within 4 hours |
| **60.0 – 79.9** | High | `#E04444` | Allocation within 12 hours |
| **40.0 – 59.9** | Moderate | `#D99118` | Scheduled daily supply run |
| **0.0 – 39.9** | Low | `#23865B` | Monitoring & standard supply buffer |

---

## 3. Reference Calculation Benchmark

Suppose Adyar (CHN-001) has:
- Severity = 90
- Urgency = 85
- Vulnerability = 70
- Unmet Need = 80
- Population Impact = 60

$$\text{Score} = (90 \times 0.30) + (85 \times 0.25) + (70 \times 0.20) + (80 \times 0.15) + (60 \times 0.10)$$
$$\text{Score} = 27 + 21.25 + 14 + 12 + 6 = 80.25 \rightarrow \mathbf{80.3} \text{ (Category: CRITICAL)}$$

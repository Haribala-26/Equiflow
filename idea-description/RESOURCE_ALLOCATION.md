# Resource Allocation Engine Specification

## 1. Two-Phase Constrained Optimization Algorithm

The allocation engine processes each resource type (Food Packs, Drinking Water, Medical Kits, Shelter Kits, Hygiene Kits) strictly independently to prevent cross-unit contamination.

### Phase 1: Minimum Essential Coverage Pass
To prevent humanitarian abandonment:
- Each eligible area with non-zero unmet demand receives a baseline floor share:
  $$\text{Floor}[a] = \min(\text{EligibleNeed}[a], \lceil \text{EligibleNeed}[a] \times \text{FloorRatio} \rceil)$$
- Where default $\text{FloorRatio} = 0.20$ (20% essential baseline).
- Areas are prioritized in descending order of Priority Score until available stock is exhausted or all floors are met.

### Phase 2: Weighted Proportional Distribution
Remaining usable stock ($\text{Stock}_{\text{rem}} = \text{Stock}_{\text{usable}} - \sum \text{Floor}$) is distributed according to priority weights:

$$\text{Weight}[a] = \left(0.50 \times \frac{\text{Priority}[a]}{100} + 0.30 \times \frac{\text{Urgency}[a]}{100} + 0.20 \times \frac{\text{Vulnerability}[a]}{100}\right) \times \text{EligibleRemaining}[a]$$

$$\text{Share}[a] = \min\left(\text{EligibleRemaining}[a], \left\lfloor \text{Stock}_{\text{rem}} \times \frac{\text{Weight}[a]}{\sum \text{Weight}} \right\rfloor\right)$$

### Phase 3: Water-Filling & Indivisible Remainder Allocation
Leftover units from rounding or demand caps are assigned using the **Largest Remainder Method**:
- Communities with highest unrounded fractional remainders receive 1 unit each.
- Tie-breaker: Highest Priority Score, then lowest Area ID lexicographically.

---

## 2. Hard Invariants

1. $\sum \text{Allocated}[a] \le \text{UsableStock}$
2. $\text{Allocated}[a] \le \text{EligibleUnmetDemand}[a]$
3. $\text{Unmet}[a] = \text{EligibleNeed}[a] - \text{Allocated}[a]$
4. Zero stock leakage: Every unit is either allocated or recorded in `remainingUsableStock`.

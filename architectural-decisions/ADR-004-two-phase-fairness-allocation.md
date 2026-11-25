# ADR-004: 2-Phase Constrained Supply Allocation Algorithm

## Status
**Accepted**

## Context
In acute disaster relief, demand always exceeds available warehouse stock. Naive proportional allocation can starve moderate-priority communities completely, while equal distribution treats lightly affected areas identically to submerged wards.

## Decision
Implement a 2-phase constrained optimization algorithm:
1. **Phase 1: Anti-Starvation Floor**: Guarantee every eligible ward at least 20% of its critical life-saving needs (water and food) before unallocated stock is distributed.
2. **Phase 2: Weighted Proportional Rationing**: Distribute remaining inventory proportionally based on priority scores and unmet demand.
3. **Discrete Unit Conservation**: Use the **Hamilton-Hare Largest Remainder Method** to round fractional quotas without leakage or over-allocation.
4. **Unit Invariance**: Fixed resource units (packs, litres, kits) are strictly enforced; units are never mixed.

## Consequences
- **Positive**: Mathematically prevents localized starvation while directing the bulk of supplies to critical zones.
- **Positive**: Zero discrete rounding leakage ensures exact warehouse inventory balances.

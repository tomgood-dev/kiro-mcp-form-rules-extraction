# Bundling Discount Category Minimums — Iteration 003

**Date**: 2026-08-13  
**Environment**: outsystems-dev.asteronlife.co.nz/QuoteAndApply  
**Setup per test**: Fresh Quote → Age 35 → Male → OccCode=AA (value '1') → Employment=Employed (value '0')

---

## Summary of Findings

**The bundling discount requires each cover to meet a MINIMUM SUM INSURED / MONTHLY BENEFIT threshold before it counts toward the "2+ cover types" discount.**

| Cover Category | Minimum for Bundling Eligibility | Confirmed Boundary |
|---|---|---|
| **Life** | **$100,000** | $99,999 = None; $100,000 = 15% ✓ |
| **TPD** | **$100,000** | $99,999 = None; $100,000 = 15% ✓ |
| **Trauma** | **$25,000** (approx.) | $20,000 = None; $25,000 = 15% |
| **Mortgage & Living (Disability)** | **Between $500–$1,000/mo** | $500/mo = None; $1,000/mo = 15% |

---

## Test A: Life Cover BELOW Potential Minimum

**Config**: Life $10,000 + TPD $200,000

| Field | Value |
|---|---|
| Life Sum Insured | $10,000 (raw: `.1.0.0.0.0.`) |
| TPD Sum Insured | $200,000 (raw: `.2.0.0.0.0.0.`) |
| **Bundling Discount** | **None** |
| Life Premium | $1.33/mo |
| TPD Premium | $11.83/mo |
| Total | $13.16/mo ($157.92/yr) |

**Interpretation**: Life at $10,000 does NOT count toward bundling. Only TPD qualifies → 1 qualifying cover = "None".

---

## Test B: Life at Minimum Threshold Boundary

**Config**: Life at various values + TPD $200,000

| Life SI | Bundling Discount | Life Premium | TPD Premium | Total Monthly |
|---|---|---|---|---|
| $10,000 | **None** | $1.33 | $11.83 | $13.16 |
| $25,000 | **None** | — | — | — |
| $50,000 | **None** | $6.65 | $11.83 | $18.48 |
| $75,000 | **None** | — | — | — |
| **$99,999** | **None** | $13.30 | $11.83 | $25.13 |
| **$100,000** | **15% (2 covers)** | $11.31 | $10.06 | $21.37 |
| $150,000 | **15% (2 covers)** | $14.50 | $10.06 | $24.56 |

### Business Rule Confirmed
> **PREM-23**: Life Cover has a bundling eligibility minimum of **$100,000 Sum Insured**. Below this threshold, Life does not count as a qualifying cover type for the bundling discount. The boundary is EXACT: $99,999 fails, $100,000 qualifies.

### Premium observation
When bundling kicks in at $100,000, the individual cover premiums DECREASE (the 15% discount is applied to each cover's premium). This is why $100,000 Life = $11.31/mo is LESS than $99,999 Life = $13.30/mo — the discount more than offsets the higher sum insured.

---

## Test C: TPD Below Potential Minimum

**Config**: Life $200,000 + TPD at various values

| TPD SI | Bundling Discount | Life Premium | TPD Premium | Total Monthly |
|---|---|---|---|---|
| $10,000 | **None** | $21.18 | $0.59 | $21.77 |
| $50,000 | **None** | — | — | — |
| **$99,999** | **None** | — | — | — |
| **$100,000** | **15% (2 covers)** | $18.00 | $5.03 | $23.03 |

### Business Rule Confirmed
> **PREM-24**: TPD Cover has a bundling eligibility minimum of **$100,000 Sum Insured** — identical threshold to Life Cover. $99,999 fails, $100,000 qualifies.

---

## Test D: Trauma Below Potential Minimum

**Config**: Life $200,000 + Trauma at various values

| Trauma SI | Bundling Discount |
|---|---|
| $10,000 | **None** |
| $10,001 | **None** |
| $11,000 | **None** |
| $12,500 | **None** |
| $15,000 | **None** |
| $20,000 | **None** |
| **$25,000** | **15% (2 covers)** |
| $50,000 | **15% (2 covers)** |
| $99,999 | **15% (2 covers)** |
| $100,000 | **15% (2 covers)** |

### Business Rule Confirmed
> **PREM-25**: Trauma Recovery Cover has a bundling eligibility minimum of **$25,000 Sum Insured** (or between $20,001–$25,000; $25,000 is the first confirmed qualifying value). This is significantly lower than the Life/TPD threshold of $100,000.

**Note**: The exact boundary may be $25,000 (round number) or potentially $21,000/$22,500/$24,000 — narrowing further would require additional tests between $20k and $25k. Given the pattern of round-number thresholds in this system, **$25,000 is the most likely boundary**.

---

## Test E: Disability Cover (Mortgage & Living) Below Minimum

**Config**: Life $200,000 + Income $150,000 + Mortgage & Living at various Monthly Benefits

| M&L Monthly Benefit | Bundling Discount | M&L Premium | Life Premium | Total Monthly |
|---|---|---|---|---|
| $100/mo | **None** | $2.53 | $21.18 | $23.71 |
| $500/mo | **None** | — | — | — |
| **$1,000/mo** | **15% (2 covers)** | $21.50 | $18.00 | $39.50 |

### Business Rule Confirmed
> **PREM-26**: Mortgage & Living (Disability) cover has a bundling eligibility minimum between **$500–$1,000 monthly benefit**. $500/mo does not qualify; $1,000/mo does. The exact threshold likely maps to an annualised equivalent (e.g., $1,000/mo × 12 = $12,000/yr equivalent, or the threshold could simply be at the $1,000/mo mark).

**Note**: Further testing between $500–$1,000 would pinpoint the exact boundary ($750? $600? $999?). The disability cover threshold operates on Monthly Benefit rather than Sum Insured, since that's the primary value field for disability covers.

---

## Test F: Kids Cover Premium & Bundling (NOT EXECUTED)

This test was not executed in this session. The hypothesis was: does Kids Cover premium receive the bundling discount, or is it excluded? Given the minimum-threshold discovery, this test would be valuable but is deferred.

---

## Cross-Cover Summary: Bundling Discount Eligibility Thresholds

| Cover Type | Value Field | Minimum Threshold | Notes |
|---|---|---|---|
| Life | Sum Insured | **$100,000** | Exact boundary confirmed |
| TPD | Sum Insured | **$100,000** | Exact boundary confirmed |
| Trauma Recovery | Sum Insured | **$25,000** (approx) | Between $20k–$25k |
| Cancer | Sum Insured | **Unknown** | Not tested (likely same as Trauma given shared SI range) |
| Accidental Death | Sum Insured | **Unknown** | Not tested |
| Mortgage & Living | Monthly Benefit | **$500–$1,000/mo** | Not narrowed further |
| Income Protection | Monthly Benefit | **Unknown** | Likely same as M&L |
| Workability | Monthly Benefit | **Unknown** | Likely same as M&L |

---

## Impact on Previous Rules

This refines **PREM-20** (from iteration-002): the rule stated that bundling counts "distinct, properly-committed cover types" — which remains true, but with the additional constraint that each cover must ALSO meet its category's minimum Sum Insured / Monthly Benefit threshold to be counted.

**Updated rule statement:**
> The bundling discount counts distinct, properly-committed cover types that **meet or exceed their category's minimum sum insured / monthly benefit threshold**. Covers below threshold are priced normally but do NOT count toward the 2-cover or 3-cover bundling tally.

---

## Automation Notes

- **calcmask action** with `selector:"[id$='_0-b7-Input_SumInsured']"` reliably targets the first lump sum cover's Sum Insured
- **calcmask action** with `selector:"[id$='_1-b7-Input_SumInsured']"` targets the second lump sum cover
- Disability cover Monthly Benefit uses `selector:"[id*='b12'][id$='Input_SumInsured']"`
- The `fill` action works for the Age field (number input) — `type` was problematic (appends to existing value)
- Cover button activation: `eval` → `[...document.querySelectorAll('button.cover-button')].find(b=>b.innerText.trim()==='Life').click()`
- Bundling text extraction: search for "Bundling Discount" in `document.body.innerText` or read `.sidebar-fixed-scrollable` innerText

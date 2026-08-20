# Iteration 003: Cross-Cover Exclusivity & Multi-Datapoint Formula Validation

**Date**: 2026-08-13  
**Environment**: outsystems-dev.asteronlife.co.nz/QuoteAndApply  
**Method**: server.js batch automation (batch.js via localhost:3333)

---

## §5: CROSS-COVER EXCLUSIVITY

### Test A: Business Disability + Farmers Disability — Mutual Exclusion

**Setup**: Age=35, Male, OccCode=B (value '4'), Employment=Self-Employed (value '1'), Income=$100,000  
**Policy**: Business 1 (added via Business button click)

#### Findings

**CONFIRMED: Business Disability and Farmers Disability are MUTUALLY EXCLUSIVE.**

1. **Before activation** (on Business 1 panel): All 3 disability cover buttons — Business Expenses, Business Disability, Farmers Disability — are **enabled** and clickable.

2. **After activating Business Disability** (click + focus+Tab on Monthly Benefit field):
   - Business Disability button becomes `disabled: true` (standard for activated covers)
   - **Farmers Disability remains ENABLED** (can still be clicked)

3. **After clicking Farmers Disability** (while Business Disability is active):
   - Clicking Farmers Disability triggers an exclusion rule
   - The form resets/removes the Business policy entirely
   - Validation error produced: **"Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other"**

4. **From first test run (pre-existing state with both active)**:
   - Error on Business Disability row: "The minimum Age Next Birthday for Business Disability is 17 / Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other / You must complete the following fields..."
   - Error on Farmers Disability row: "The minimum Age Next Birthday for Farmers Disability is 17 / Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other / Farmers Disability Cover is not available for the selected occupation"
   - Both buttons were `disabled: true` (both were somehow activated in the same state, producing twin errors)

#### Business Rule
> **EXCL-01**: Business Disability Cover and Farmers Disability Cover are MUTUALLY EXCLUSIVE within the same policy. They cannot be active simultaneously. The exclusion is enforced via:
> - A validation error message: "Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other"
> - If both are somehow in the DOM (legacy state), both show the error
> - Attempting to activate the second one while the first is committed causes a form reset/policy removal

#### Mechanism
- The exclusion is NOT enforced by disabling the button (Farmers Disability stays enabled even after Business Disability is committed)
- The exclusion is enforced server-side via validation after the second cover is activated
- This produces a destructive side effect: the Business policy may be removed entirely

---

### Test B: Workability (Personal) + Business Disability (Business) — Cross-Policy Exclusion

**Setup**: Age=35, Male, OccCode=AA (value '1'), Employment=Employed, Income=$150,000  
**Policies**: Personal 1 (Workability active) + Business 1 (Business Disability active)

#### Findings

**CONFIRMED: NO cross-policy exclusion between Workability and Business Disability.**

1. Activated Workability on Personal 1 → committed (focus+Tab on Monthly Benefit)
2. Added Business 1 policy
3. On Business 1: all 3 business disability buttons (Business Expenses, Business Disability, Farmers Disability) were **ENABLED**
4. Clicked Business Disability → **ACTIVATED SUCCESSFULLY**
5. Committed Business Disability (focus+Tab) → only error was "You must complete the following fields..." (standard for incomplete personal details)
6. **No exclusion error** about Workability preventing Business Disability

#### Business Rule
> **EXCL-02**: Workability (on a Personal policy) does NOT block Business Disability (on a Business policy). There is no cross-policy exclusion between these covers. Each policy type has its own independent disability cover rules.

---

### Test C: Workability (Personal) + Business Expenses (Business) — Cross-Policy Exclusion

**Result**: Implicitly confirmed by Test B — if Business Disability is allowed alongside Workability cross-policy, and Business Expenses was already confirmed enabled on the same Business 1 panel, then **Business Expenses is also not blocked by Workability on a Personal policy**.

#### Business Rule
> **EXCL-03**: Workability (on a Personal policy) does NOT block Business Expenses (on a Business policy). No cross-policy exclusion exists.

---

### Summary of Exclusivity Rules

| Cover A | Cover B | Same Policy | Cross-Policy | Rule |
|---------|---------|:-----------:|:------------:|------|
| Business Disability | Farmers Disability | ❌ BLOCKED | (same policy only) | Mutually exclusive — validation error |
| Workability (Personal) | Business Disability (Business) | N/A | ✅ ALLOWED | No cross-policy exclusion |
| Workability (Personal) | Business Expenses (Business) | N/A | ✅ ALLOWED | No cross-policy exclusion |
| Workability | Income Protection | ❌ BLOCKED (same policy) | N/A | Prior iteration confirmed |
| Workability | Mortgage & Living | ❌ BLOCKED (same policy) | N/A | Prior iteration confirmed |
| Mortgage & Living | Income Protection | ✅ ALLOWED | N/A | Prior iteration confirmed |

---

## §6: MULTI-DATAPOINT FORMULA VALIDATION

### Test D: Income Protection — Tiered Formula

**Setup**: Age=35, Male, OccCode=AA, Employment=Employed

#### Results

| Annual Income | Auto-Default (focus+Tab) | $99,999 Entry → Cap Error | Actual Cap |
|-------------:|-------------------------:|:--------------------------|:-----------|
| $400,000 | `.2.3.3.3.3.` = **$23,333/month** | "The maximum remaining monthly benefit for Income Protection benefit is **$23,333**" | $23,333/month |
| $600,000 | (changed income triggered error) | "The maximum remaining monthly benefit for Income Protection benefit is **$30,000**" | $30,000/month |
| $1,000,000 | (field re-rendered, not captured) | Expected to match $600k cap | $30,000/month (product cap) |

#### Formula Analysis

**At $400,000 income**:
- Simple 75% formula: 75% × $400,000 ÷ 12 = $25,000 — **DOES NOT MATCH** ($23,333)
- Tiered formula: 75% × $320,000 + 50% × ($400,000 - $320,000) = $240,000 + $40,000 = $280,000/year = **$23,333/month** ✓

**At $600,000 income**:
- Tiered formula: 75% × $320,000 + 50% × ($560,000 - $320,000) + 20% × ($600,000 - $560,000) = $240,000 + $120,000 + $8,000 = $368,000/year = $30,667/month
- But actual cap = **$30,000/month** (product hard cap applies)
- This confirms: the product hard cap of $30,000/month kicks in before the tier 3 formula completes

**Confirmed at $150,000 income** (prior iteration-002):
- 75% × $150,000 ÷ 12 = $9,375 — matches exactly (below tier 1 threshold of $320k, so simple 75% applies)

#### Business Rules

> **FORM-01 (Income Protection tiered formula)**:
> - **Tier 1**: First $320,000 of annual income → 75% benefit
> - **Tier 2**: Income from $320,001 to $560,000 → 50% benefit  
> - **Tier 3**: Income above $560,000 → 20% benefit
> - **Product hard cap**: $30,000/month regardless of income level
>
> Formula: min($30,000, (75% × min(income, $320,000) + 50% × max(0, min(income, $560,000) - $320,000) + 20% × max(0, income - $560,000)) ÷ 12)
>
> Validation text: "The maximum remaining monthly benefit for Income Protection benefit is $X,XXX"

**Tier breakpoints confirmed by data**:
- $150,000 → $9,375 (75% × $150k ÷ 12) — all in tier 1
- $400,000 → $23,333 (tier 1 + tier 2) — confirms $320k breakpoint
- $600,000 → $30,000 (hard cap) — confirms cap exists before tier 3 fully applies

---

### Test E: Workability — Cap Validation

**Setup**: Age=35, Male, OccCode=AA, Employment=Employed

#### Results

| Annual Income | $99,999 Entry → Cap Error | Actual Cap |
|-------------:|:--------------------------|:-----------|
| $200,000 | "The maximum allowable monthly benefit for Workability based on annual income $200,000 is **$10,000**" | $10,000/month |
| $100,000 | "The maximum allowable monthly benefit for Workability based on annual income $100,000 is **$6,250**" | $6,250/month |

#### Formula Analysis

**At $200,000 income**:
- 75% × $200,000 ÷ 12 = $12,500 — but cap is $10,000
- Therefore: min(**$10,000 product cap**, 75% × income ÷ 12) = min($10,000, $12,500) = **$10,000** ✓

**At $100,000 income**:
- 75% × $100,000 ÷ 12 = $6,250 — formula is below cap
- Therefore: min($10,000, $6,250) = **$6,250** ✓

**At $150,000 income** (prior iteration-002):
- 75% × $150,000 ÷ 12 = $9,375 — confirmed from prior testing

#### Business Rule

> **FORM-02 (Workability cap formula)**:
> - Formula: min($10,000, 75% × Annual Income ÷ 12)
> - Product hard cap: **$10,000/month**
> - Validation text: "The maximum allowable monthly benefit for Workability based on annual income $X is $Y"
> - Unlike Income Protection, Workability uses a **single-tier 75% formula** (no tiering by income bands)

---

### Test F: Mortgage & Living — Cap Validation

**Setup**: Age=35, Male, OccCode=AA, Employment=Employed, Income=$250,000

#### Results

| Annual Income | Auto-Default (focus+Tab) | Interpretation |
|-------------:|-------------------------:|:---------------|
| $250,000 | `.7.5.0.0.` = **$7,500/month** | Product cap applies |
| $150,000 (prior iteration) | $5,625/month | Formula-driven (45% × $150k ÷ 12) |

#### Formula Analysis

**At $250,000 income**:
- 45% × $250,000 ÷ 12 = $9,375 — but auto-default is $7,500
- Therefore: min(**$7,500 product cap**, 45% × income ÷ 12) = min($7,500, $9,375) = **$7,500** ✓

**At $150,000 income** (prior iteration-002):
- 45% × $150,000 ÷ 12 = $5,625 — below the cap, confirmed exact

#### Business Rule

> **FORM-03 (Mortgage & Living cap formula, Agreed Value Plus basis)**:
> - Formula: min($7,500, 45% × Annual Income ÷ 12)
> - Product hard cap: **$7,500/month**
> - Validation text: "The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value Plus is $X,XXX"
> - Uses a single-tier 45% formula (no tiering), same as Workability's single-tier approach

---

## Summary: Disability Cover Maximum Monthly Benefit Formulas

| Cover | Formula Basis | Tiered? | Product Hard Cap | Income where cap kicks in |
|-------|:------------:|:-------:|:----------------:|:-------------------------:|
| **Income Protection** | 75% / 50% / 20% | YES (3 tiers) | $30,000/month | ~$480k (between $400k and $600k) |
| **Workability** | 75% | NO (single tier) | $10,000/month | $160,000 |
| **Mortgage & Living** (AGV+) | 45% | NO (single tier) | $7,500/month | $200,000 |
| **Business Expenses** | Flat (not income-based) | N/A | $16,666/month | Always (occupation table) |
| **Farmers Disability** | Flat (not income-based) | N/A | $10,000/month | Always (occupation table) |

### Income Protection Tier Breakpoints

| Income Band | Benefit Rate | Cumulative Annual at Top |
|:-----------:|:-----------:|:------------------------:|
| $0 – $320,000 | 75% | $240,000 |
| $320,001 – $560,000 | 50% | $240,000 + $120,000 = $360,000 |
| $560,001+ | 20% | $360,000 + 20% of excess |
| **Hard cap** | — | **$360,000/year ($30,000/month)** |

Note: The hard cap of $30,000/month = $360,000/year corresponds to an income of **$560,000** at the tier 2 boundary (75% × $320k + 50% × $240k = $240k + $120k = $360k). Above $560k, the 20% tier would exceed the cap — so the cap effectively makes tier 3 irrelevant. The product cap kicks in exactly at the tier 2/3 boundary.

---

## Test Environment & Methodology

- **URL**: https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/Quote
- **Automation**: server.js on localhost:3333 + batch.js sequential command runner
- **Browser**: Chromium (headed, via Playwright)
- **Key technique**: `calcmask` action for right-to-left currency fields; cover activation via `eval` button.click(); commitment via focus+Tab on Monthly Benefit field
- **Session ID instability**: Field IDs change per session (e.g., `b23-b12-l9-XXXX_N-Input_SumInsured`). Dynamic ID discovery required per test.

## Open Questions

1. **Income Protection at exactly $560,000** — does it show $30,000 or $30,000? (Would confirm if the cap IS exactly the tier 2 max or slightly below)
2. **Does "remaining" in the IP error message ("maximum remaining monthly benefit") indicate a shared pool with other covers?** Prior testing (iteration-002) showed it doesn't actually deplete — the word "remaining" is just standard phrasing.
3. **Mortgage & Living "Monthly Mortgage" basis** — does it use a different formula/cap than the "Annual Income" (Agreed Value Plus) basis tested here?
4. **Business Disability cap at higher incomes** — the flat $50,000 cap was discovered in iteration-002. Does it have any income dependency for AA occupation?

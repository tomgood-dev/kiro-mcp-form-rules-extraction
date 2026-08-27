# Policy Structure — Policy-Level Toggles, Personal/Business, and Multi-Life

> Child of [Quote Screen](../page.md). Rule ID prefix: `POL-`

This page covers everything above the level of an individual cover: the policy-wide settings that apply to every cover on a policy, the Personal/Business mechanism, and the multi-life ("Add life") structure.

## Policy-level toggles

These apply to every cover within the policy they're set on.

| Rule ID | Field | Type | Default | Options | Notes |
|---|---|---|---|---|---|
| `POL-01` | Inflation Adjustment Benefit | Checkbox | **On** | On/Off | Adjusts sum insured annually for inflation |
| `POL-02` | Premium Freeze | Checkbox | Off | On/Off | Locks premiums — no annual increases |
| `POL-03` | We Pay Your Premiums | Select | None | None / 30 days / 60 days / 90 days | Waives lump sum cover premiums if the insured cannot work >10 hrs/week after the chosen wait period. Tooltip: *"Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period."* Adds a waiver cost to the premium; does not add any sub-fields. |
| `POL-04` | Flexi Rate | Select | N/A | N/A, then 2.5%–30.0% in 2.5% steps (13 options total) | Reduces the Adviser's commission by the selected percentage and passes that reduction to the client as a premium discount. Tooltip: *"Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission."* For how this interacts with the agency's default commission category and IC/RC selection, see [Adviser Use / Commission Category](../adviser-use-commission/page.md). |

### Mutual exclusivity: Inflation Adjustment vs. Premium Freeze

| Rule ID | Rule |
|---|---|
| `POL-05` | **Inflation Adjustment Benefit and Premium Freeze are mutually exclusive**, and the system enforces this **silently** — no error message is shown. Confirmed behavior: if Inflation Adjustment is already on and you turn Premium Freeze on, the system automatically switches Inflation Adjustment off (Premium Freeze wins). This is a UX trap worth flagging to BAs writing acceptance criteria: a user checking "Premium Freeze" will see Inflation Adjustment silently uncheck itself with no warning. |

## Personal / Business — CONFIRMED: add-policy action (resolved in iteration 003)

Clicking "Personal" or "Business" creates a new, independently-numbered policy. This is NOT a two-state toggle.

| Rule ID | Rule | Evidence |
|---|---|---|
| `POL-06` | Clicking **"Personal"** or **"Business"** each time creates a **new, independently-numbered policy** (Personal 1, Personal 2, Business 1, Business 2, ...) and immediately switches the visible panel to that new, empty policy. | Confirmed across multiple sessions: creating Personal 1 → Business 1 → Personal 2 → Business 2 in sequence, watching the "Policies" badge count up to 4. *(Confirmed in iteration 003 — see changelog)* |
| `POL-07` | A single Life can carry **multiple Personal policies and multiple Business policies concurrently.** | Same test as above — all four policies coexisted; switching between policy links round-tripped correctly. |
| `POL-08` | Each policy link has an adjacent **icon-only "remove this policy" control**, with **no confirmation dialog** — clicking it deletes that policy instantly. | Used to remove policies individually; each removal updated the Policies badge and remaining links correctly. |
| `POL-09` | Policy numbering is **independent per type** — removing "Personal 2" did not renumber "Business 2" down to "Business 1". | Observed directly during cleanup. |

| Rule ID | Rule |
|---|---|
| `POL-10` | The set of available Lump Sum and Disability covers **does change** depending on whether you're looking at a Personal-type or Business-type policy — see [Lump Sum Covers](../lump-sum-covers/page.md) and [Disability Covers](../disability-covers/page.md) for the exact menus. See `POL-14`–`POL-16` for confirmed details. |
| `POL-10b` | Sub-cover/rider buttons (Acc. TPD, Acc. Trauma, Acc. Cancer, Major Trauma, TPD on Trauma) are only available under **Personal**-type policies. |

## Multi-life ("Add life")

| Rule ID | Rule |
|---|---|
| `POL-11` | Clicking **"Add life"** creates a new, **fully independent** `Life N` tab — blank Personal Details, and its own fresh "Personal 1" policy with zero covers. Nothing is copied or shared from Life 1. |
| `POL-12` | **CONFIRMED: Add Life IS blocked when the current life doesn't meet minimum requirements.** A blocking modal appears: *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"* (dismissed with an OK button). The earlier finding that "Add life" succeeded unconditionally on a completely empty Life 1 was likely observing a state before any cover had been partially configured — once a cover is activated (even incompletely), the system enforces completion before allowing a new life. *(Confirmed in iteration 003 — see changelog)* |
| `POL-13` | The Premium panel aggregates **"Total Monthly/Yearly Premium (All Lives)"** — a genuine combined total across every life on the quote — while still showing each life's own premium subtotal separately underneath. |
| `POL-13b` | Each life is independently configurable — different covers, amounts, sum insured levels, and options per life, with no shared state beyond the aggregate premium total. Confirmed 2026-08-26 for two specific cases not previously tested: (1) Life 2's own age-based validation (TPD minimum age 17) fires independently even when Life 1 is fully valid; (2) Life 2's Kids Cover count starts at 0, not leaked from Life 1's value. |

## Business policy cover menus — CONFIRMED (resolved in iteration 003)

| Rule ID | Rule |
|---|---|
| `POL-14` | **Business policy Lump Sum covers: Life, TPD, Trauma, Specific Injury** (4 covers). Cancer, Accidental Death, and Needlestick are NOT available on Business policies. *(Confirmed in iteration 003 — see changelog)* |
| `POL-15` | **Business policy Disability covers: Business Expenses, Business Disability, Farmers Disability.** Mortgage & Living is the only cover shared between Personal and Business menus (see [Disability Covers — DC-04/DC-05](../disability-covers/page.md)). |
| `POL-16` | **Cover-menu split is driven by policy type (Personal vs Business), NOT by occupation code.** The cover menu changes based on which policy (Personal-type or Business-type) is currently selected — occupation code affects individual cover *eligibility* within that menu (see [Lump Sum Covers — LSC-02/LSC-03](../lump-sum-covers/page.md)) but does not control which covers appear in the menu itself. |

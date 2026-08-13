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
| `POL-04` | Flexi Rate | Select | N/A | N/A, then 2.5%–30.0% in 2.5% steps (13 options total) | Reduces the Adviser's commission by the selected percentage and passes that reduction to the client as a premium discount. Tooltip: *"Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission."* |

### Mutual exclusivity: Inflation Adjustment vs. Premium Freeze

| Rule ID | Rule |
|---|---|
| `POL-05` | **Inflation Adjustment Benefit and Premium Freeze are mutually exclusive**, and the system enforces this **silently** — no error message is shown. Confirmed behavior: if Inflation Adjustment is already on and you turn Premium Freeze on, the system automatically switches Inflation Adjustment off (Premium Freeze wins). This is a UX trap worth flagging to BAs writing acceptance criteria: a user checking "Premium Freeze" will see Inflation Adjustment silently uncheck itself with no warning. |

## Personal / Business — ⚠️ open discrepancy, see hub page §4

Two independent testing sessions produced conflicting models of how "Personal" and "Business" work. Both are documented below with their evidence; **neither has been confirmed as definitively correct** — this needs a clarifying re-test.

### Session 1 finding: Personal/Business are "add a new policy" actions

| Rule ID | Rule | Evidence |
|---|---|---|
| `POL-06` | Clicking **"Personal"** or **"Business"** each time creates a **new, independently-numbered policy** (Personal 1, Personal 2, Business 1, Business 2, ...) and immediately switches the visible panel to that new, empty policy. | Confirmed by creating Personal 1 → Business 1 → Personal 2 → Business 2 in sequence and watching the "Policies" badge count up to 4. |
| `POL-07` | A single Life can carry **multiple Personal policies and multiple Business policies concurrently.** | Same test as above — all four policies coexisted; switching between the "Personal 1" and "Business 1" links (not the buttons) round-tripped to each one's own independent cover configuration correctly. |
| `POL-08` | Each policy link has an adjacent **icon-only "remove this policy" control**, with **no confirmation dialog** — clicking it deletes that policy instantly. | Used to remove Personal 2, Business 1, and Business 2 individually; each removal updated the Policies badge and remaining links correctly. |
| `POL-09` | Policy numbering is **independent per type** — removing "Personal 2" did not renumber "Business 2" down to "Business 1". | Observed directly during cleanup of the 4-policy test state. |

### Session 2 finding: Personal/Business is a two-state toggle

| Rule ID | Rule | Evidence |
|---|---|---|
| `POL-06b` (conflicts with `POL-06`–`POL-09`) | Personal and Business are described as two mutually-exclusive **policy type** states on a single policy, not separate policy instances. Switching does not clear already-configured covers, but a cover that becomes unavailable in the new state loses its configuration. No "selected" CSS class was found on either button, so the session could not determine selection state from the DOM directly. | This session's own "Policies" badge was observed showing "1" throughout policy-type switching in their test — i.e. they did not observe the badge incrementing the way Session 1 did, though it isn't clear from their notes whether they specifically tried clicking either button a second/third time to check. |

**Recommendation for whoever resolves this:** repeat Session 1's exact test (click Personal, then Business, then Personal again, watching the Policies badge count each time) on a fresh quote and confirm which model holds. If Session 1's model is correct, Session 2's Lump-Sum-cover-menu findings for "Business" (`LSC-01` conflict, see [Lump Sum Covers](../lump-sum-covers/page.md)) may simply have been recorded while viewing a specific policy instance rather than a persistent "Business mode," which would also need re-checking.

### What both sessions agree on

| Rule ID | Rule |
|---|---|
| `POL-10` | The set of available Lump Sum and Disability covers **does change** depending on whether you're looking at a Personal-type or Business-type policy — see [Lump Sum Covers](../lump-sum-covers/page.md) and [Disability Covers](../disability-covers/page.md) for the exact menus, which themselves have a documented discrepancy. |
| `POL-10b` | Sub-cover/rider buttons (Acc. TPD, Acc. Trauma, Acc. Cancer, Major Trauma, TPD on Trauma) are only available under **Personal**-type policies. |

## Multi-life ("Add life")

| Rule ID | Rule |
|---|---|
| `POL-11` | Clicking **"Add life"** creates a new, **fully independent** `Life N` tab — blank Personal Details, and its own fresh "Personal 1" policy with zero covers. Nothing is copied or shared from Life 1. |
| `POL-12` | ⚠️ **Discrepancy — see hub §4 point 4.** A dedicated, isolated test (fresh quote, no fields filled, no covers) found that clicking "Add life" succeeds **unconditionally** with **no validation** of Life 1's completeness. A separate, less-isolated observation during broader multi-life testing saw a **blocking modal** appear: *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"* (dismissed with an OK button). These may not be a true contradiction — it's possible *creating* a new life via "Add life" is unconditional, while *switching to view* an already-existing but still-incomplete life (via clicking its tab) is separately gated. This distinction has not been isolated by either session. |
| `POL-13` | The Premium panel aggregates **"Total Monthly/Yearly Premium (All Lives)"** — a genuine combined total across every life on the quote — while still showing each life's own premium subtotal separately underneath. |
| `POL-14` | Each life is independently configurable — different covers, amounts, sum insured levels, and options per life, with no shared state beyond the aggregate premium total. |

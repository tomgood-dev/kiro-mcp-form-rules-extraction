# Premium Calculation, Payment Frequency & Bundling Discounts

> Child of [Quote Screen](../page.md). Rule ID prefix: `PREM-`

## What triggers a premium recalculation

| Rule ID | Action | Recalculation scope |
|---|---|---|
| `PREM-01` | Gender changed | **Full** — every cover, every premium, cover eligibility |
| `PREM-02` | Smoking status changed | Full — all premiums |
| `PREM-03` | Age changed (via DOB or direct entry) | Full — all premiums + cover eligibility |
| `PREM-04` | Occupation Code changed | Partial — cover eligibility + premiums |
| `PREM-05` | Cover activated/deactivated | Partial — that cover + the total |
| `PREM-06` | Sum Insured/Monthly Benefit changed + blurred | Partial — that cover's premium only |
| `PREM-07` | Premium Structure changed | Partial — that cover's premium |
| `PREM-08` | Flexi Rate changed | Full — all premiums discounted |
| `PREM-09` | Payment Frequency changed | Display only — recalculates the shown amounts for the new frequency, does not change the underlying annual premium |
| `PREM-10` | We Pay Your Premiums changed | Partial — adds/removes the waiver benefit cost |
| `PREM-11` | Number of Kids / Kids Sum Insured changed | Partial — Kids Cover premium line only |

## Display behavior

| Rule ID | Rule |
|---|---|
| `PREM-12` | Shows **$0.00** for any cover with no (or an invalid) Sum Insured/Monthly Benefit entered. |
| `PREM-13` | Updates live, no page reload. |
| `PREM-14` | Total aggregates across **all lives** on the quote (see [Policy Structure — POL-13](../policy-structure/page.md)). |
| `PREM-15` | Adviser Use and Loadings buttons appear but are effectively inert until a valid, priced quote exists. |

## Payment frequency — conversion formula confirmed

| Rule ID | Frequency | Options (select) |
|---|---|---|
| `PREM-16` | Fortnightly, **Monthly** (default), Quarterly, Half Yearly, Yearly | 5 options |

| Rule ID | Rule |
|---|---|
| `PREM-17` | The Premium panel's own label switches between "Total Monthly Premium" / "Total Fortnightly Premium" / etc. depending on the selected frequency. |
| `PREM-18` | **Fortnightly = Yearly Premium ÷ 26**, with **independent rounding per payment period.** Worked example confirmed live: Monthly $21.18 × 12 = Yearly $254.16. Switching to Fortnightly: $254.16 ÷ 26 = $9.7754 → displayed rounded to **$9.77**. Multiplying back: $9.77 × 26 = **$254.02** — a **deliberate/inherent rounding artifact**: the "Total Yearly Premium" figure shown while in Fortnightly mode ($254.02) is genuinely different from the one shown in Monthly mode ($254.16), because each frequency independently derives its own yearly total from its own rounded per-period amount, rather than all frequencies deriving from one canonical annual figure. **This is worth flagging to BAs/QA writing reconciliation logic** — comparing "yearly premium" across two different frequency views is not a like-for-like comparison. |

## Bundling Discounts — corrected rule (see hub §4 for why this needed correcting)

| Rule ID | Rule |
|---|---|
| `PREM-19` | Tooltip: *"A discount that applies to Personal & Business for taking out multiple cover types: 2 cover types: 15%, 3 or more cover types: 20%."* |
| `PREM-20` | **The discount counts distinct, properly-committed cover types across Lump Sum AND Disability covers combined** — it is not restricted to one category. Confirmed: 2 committed covers of any mix (e.g. Life + TPD, or Life + Income Protection) → **"15% (2 covers)"**; 3+ committed covers → **"20% (3 covers or more)"**. |
| `PREM-21` | A Disability cover that is active but **not yet committed** (its benefit field never focused+blurred — see [Disability Covers — DC-01/DC-02](../disability-covers/page.md)) does **not** count toward this tally, since it isn't really "on" yet. An earlier test session incorrectly concluded Disability covers were excluded from bundling entirely — that was purely this uncommitted-cover artifact, not a real category exclusion. |
| `PREM-22` | Displayed as **"None"** when only 1 cover type is committed. |

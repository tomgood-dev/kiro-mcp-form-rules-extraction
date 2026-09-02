# Kids Cover

> Child of [Quote Screen](../page.md). Rule ID prefix: `KID-`

Kids Cover provides a lump sum benefit for the insured's children. It's a Personal-policy-only concept.

## Fields

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `KID-01` | Number of Kids | Select | 0–9 | 0 |

Selecting a number **N** greater than 0 generates **N** identical repeating blocks ("Kid 1" ... "Kid N"), each with:

| Rule ID | Per-kid field | Type | Required |
|---|---|---|---|
| `KID-02` | First Name | Text | No |
| `KID-03` | Surname | Text | No |
| `KID-04` | Gender | Button group (Male/Female) | No |
| `KID-05` | Date of birth | Native `<input type="date">` | **Yes — the only required field per kid** |
| `KID-06` | Sum insured | Select | No |

## Sum Insured tier list

| Rule ID | Rule |
|---|---|
| `KID-07` | Fixed tier list from **$50,000 (labelled "Free" — no additional premium)** up to **$200,000**, in **$10,000 increments** (16 options total: $50k, $60k, $70k, ... $200k). |

## Dependency and premium rules

| Rule ID | Rule |
|---|---|
| `KID-08` | **Kids Cover requires at least one Personal Insurance Cover.** Cannot be submitted standalone — Apply is blocked until at least one cover (any type from the Personal menu: Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, M&L, IP, or Workability) is active. The kid detail rows render immediately when Number of Kids > 0, but Apply produces: *"Please add at least one Personal Insurance Cover before adding Kids Cover"*. |
| `KID-09` | **Kids premium is a single aggregated line** within the parent life's premium total — NOT itemized per child. There is no "Kid 1 premium" / "Kid 2 premium" breakdown visible in the premium panel. |
| `KID-10` | Kids Cover premium is only charged once a kid's Sum Insured **exceeds** the free $50,000 tier. |

## Other rules

| Rule ID | Rule |
|---|---|
| `KID-11` | Maximum 9 kids per life. |
| `KID-12` | *(Re-corrected 2026-09-02 — the 2026-08-26 "correction" below was itself wrong.)* Date of birth is a genuine native date input with hard min/max bounds, and the field genuinely is a **~21-year window**, as originally stated before the (incorrect) 2026-08-26 revision. Confirmed live (today = 2026-09-02) by disambiguating against the known ADULT DOB field (`id="b15-Input_BirthDate"`) in the same page state: the adult field showed `min="1952-09-02"`, `max="2016-09-02"` (a genuine 64-year span, matching `PD-11`'s 11–75 Age Next Birthday range) — while the genuinely separate kid DOB field showed `min="2005-09-04"`, `max="2026-09-02"` (a genuine **21-year span**). The 2026-08-26 investigation most likely read the adult's own field by mistake and concluded the two were the same. Both bounds are rolling/relative to today, not fixed calendar dates — re-derive relative to the current date. A ~21-year window is also the business-sensible reading for a "Kids Cover" field, unlike the previous 64-year finding which would have allowed a 74-year-old "kid." |
| `KID-13` | Not available on Business policies — see [Policy Structure](../policy-structure/page.md). |

---

# Multi Lives and Policies

> Rule ID prefix: `MLP-`. Source: user story ACB-4394, confirmed by
> `multi-lives-and-policies-v1.spec.js` (run 2026-09-02). A quote can hold multiple lives, each
> life can hold multiple policies (Personal/Business).

## Confirmed rules [Story ACB-4394, 2026-09-02]

| Rule ID | Rule |
|---|---|
| `MLP-01` | A life can be added to a quote via the **"Add life"** button (the story calls it "+Life"). |
| `MLP-02` | Each added life exposes the full Personal Details field set plus all Personal-policy covers (Life/TPD/Trauma/Cancer/Acd. Death/Needlestick/Specific Injury, M&L/IP/Workability) and Kids Cover. |
| `MLP-03` | Clicking "Add life" without minimum details is blocked by a modal — title **"Cannot proceed"**, body **"Please enter the minimum requirement for a quote before proceeding to another life"**, single **OK** button. ⚠ Story AC03 says "requirement**s**" (plural) + a trailing full stop — see Discrepancy record below. |
| `MLP-04` | With minimum details (age, gender, smoker) + a priced cover present, "Add life" succeeds and creates the next life. |
| `MLP-05` | The right-hand panel shows a per-life premium (within each life's section) plus a single all-lives total (**"Total Monthly Premium (All Lives)"** / **"Total Yearly Premium"**). There is NOT a repeated per-life "Total Yearly Premium" heading. |
| `MLP-09` | Apply with any life below the minimum premium shows **"The minimum premium is $240.00 per year per Life insured."** (verbatim). |
| `MLP-14` | **"Personal"** adds a Personal policy tab exposing: Inflation, Premium Freeze, We Pay Your Premiums, Flexi Rate, all 7 lump-sum covers, M&L/IP/Workability, and Kids Cover. |
| `MLP-15` | **"Business"** adds a Business policy tab exposing: Inflation, We Pay Your Premiums, Flexi Rate, Life/TPD/Trauma/Specific Injury, and Business Disability/Farmers Disability/Business Expenses. **Absent on Business:** Cancer, Acd. Death, Needlestick, M&L, IP, Workability, Premium Freeze, Kids Cover. |
| `MLP-16` | Clicking the "X" (`a > i.fa-times`) on a policy tab removes that policy tab. |
| `MLP-18` | Life tabs and policy tabs are individually navigable. Active life = `button.osui-tabs__header-item.osui-tabs--is-active`; active policy tab = `div` styled `border-bottom: 2px solid blue`. |
| `MLP-27` | Clicking "Add life" moves control to the newly-added life (it becomes the active life tab). |
| `MLP-28` | Adding a policy moves control to the newly-added policy (it becomes the active policy tab, blue underline). |
| `BR-B` (MLP) | **Maximum 5 policies (Personal + Business combined) per life.** Once 5 exist, both the "Personal" and "Business" add buttons are disabled. |
| `BR-A` (MLP) | **Maximum 10 lives per quote** — story-stated business rule and AC13; the "Add life" button is designed to disable at 10. *(Test blocked-with-evidence: building 10 valid lives in one browser session was not reliably automatable — see `multi-lives-and-policies-v1.md` Deferred. Rule not overturned — a diagnostic built 5 lives cleanly in isolation.)* |

## DOM reference (for future tests)

- **Life tab:** `<button class="osui-tabs__header-item ...">` (rendered in a disabled + an enabled copy). Active adds `osui-tabs--is-active`. Close icon = `<i class="fa fa-times">` inside the enabled copy.
- **Policy tab:** `<div><a><span>Personal 1</span></a><a style="margin-left:10px"><i class="icon fa fa-times"></i></a></div>`. Active tab: inline `border-bottom: 2px solid blue`. Errored tab: inline `background-color: var(--color-error-light)`.

## Discrepancy Evidence Records

#### MLP-03 — "minimum requirement(s)" wording mismatch

- **AC / Rule ID:** AC03 / MLP-03
- **Verbatim requirement:** (Acceptance Criteria row AC03) *"…the system must display the following error message: 'Please enter the minimum requirements for a quote before proceeding to another life.'"*
- **Reproduction steps:** 1. Log in, open a new quote (`/QuoteAndApply/`). 2. Do NOT enter any Personal Details. 3. Click the "Add life" button. 4. Read the modal.
- **Expected result:** "Please enter the minimum **requirements** for a quote before proceeding to another life." (plural, trailing full stop).
- **Actual result:** modal — title "Cannot proceed"; body "Please enter the minimum **requirement** for a quote before proceeding to another life" (singular, **no** trailing full stop); one **OK** button.
- **Evidence artifact(s):** `evidence/03-probe-multi-lives-recon-5/mlp06-delete-life-confirm.png` (same modal), recon-3 verbatim capture in `test-runs/multi-lives-and-policies-v1/generation-log-2026-09-02T15-16.md`.
- **Environment:** https://outsystems-dev.asteronlife.co.nz, hanno.coetzee+1123@resolutionlife.com.au, 2026-09-02.
- **Reproducibility:** reproduced on every run (recon-1/-3/-5 + 3 spec runs).
- **Test encoding:** `multi-lives-and-policies-v1.spec.js` → MLP-03/AC03 (asserts the story's plural text; currently FAILS on the singular/plural + full-stop difference).

#### MLP-06/07/08 — no delete-confirmation dialog on the life-tab "X"

- **AC / Rule ID:** AC06/AC07/AC08 / MLP-06/07/08
- **Verbatim requirement:** (AC06) *"When the user clicks the 'X' icon on a life tab, Then a confirmation pop-up should appear with the message: 'Are you sure you want to delete this life?' And the pop-up should present two options: Cancel and Delete."*
- **Reproduction steps:** 1. Open a new quote; set age 35 / Male / OCC AA. 2. Activate Life, enter Sum Insured $200,000. 3. Click "Add life" (creates Life 2). 4. Click the "X" (`i.fa-times`) on the ENABLED copy of the Life 1 tab. 5. Read the resulting modal + its buttons.
- **Expected result:** modal "Are you sure you want to delete this life?" with **Cancel** and **Delete** buttons.
- **Actual result:** modal — "Cannot proceed / Please enter the minimum requirement for a quote before proceeding to another life / OK". No delete-confirmation dialog of the story's shape was reachable; the life was not deleted.
- **Evidence artifact(s):** `evidence/03-probe-multi-lives-recon-5/mlp06-delete-life-confirm.png`.
- **Environment:** as above, 2026-09-02.
- **Reproducibility:** reproduced on recon-5 + all 3 spec runs.
- **Test encoding:** `multi-lives-and-policies-v1.spec.js` → MLP-06/07/08/AC06-08 (asserts the story's delete-confirmation modal; currently FAILS). AC07/AC08 (Cancel/Delete behaviours) are unreachable until the dialog exists.

#### MLP-26 — "correct the errors before proceeding" modal not reproducible

- **AC / Rule ID:** AC26 / MLP-26
- **Verbatim requirement:** (AC26) *"Given the user has added a policy for a life And it has any error message, When the user attempts to add a new life, Then the system must throw an error message 'Please correct the errors before proceeding to another life' in the pop-up with OK button And it should not allow to add another life until they fix errors."*
- **Reproduction steps (attempted):** 1. Open a new quote; set age 35 / Male / OCC AA. 2a. Activate Life, leave Sum Insured blank; OR 2b. Activate Life, enter an over-cap Sum Insured ($60,000,000). 3. Click "Add life". 4. Read for the modal.
- **Expected result:** modal "Please correct the errors before proceeding to another life" with OK; adding a life blocked.
- **Actual result:** no modal. A blank Sum Insured shows NO visible error and no modal on Add life; an over-cap $60M SI shows no error at all. The specific "policy has an error" state AC26 assumes could not be produced from the reachable Quote screen (only the min-premium error, via Apply, was reproducible — a different message).
- **Evidence artifact(s):** `evidence/03-probe-multi-lives-recon-5/mlp26-b-modal.png`; recon-4/-5 notes.
- **Environment:** as above, 2026-09-02.
- **Reproducibility:** the non-appearance reproduced on recon-4, recon-5, and all 3 spec runs.
- **Test encoding:** `multi-lives-and-policies-v1.spec.js` → MLP-26/AC26 (asserts the story modal; currently FAILS). Needs author/BA clarification on what policy-error state triggers AC26 (likely only reachable via the Apply/validation path).

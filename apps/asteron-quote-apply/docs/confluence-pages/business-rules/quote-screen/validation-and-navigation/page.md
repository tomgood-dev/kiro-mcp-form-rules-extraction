# Validation & Navigation

> Child of [Quote Screen](../page.md). Rule ID prefix: `VAL-`

This page covers the footer action buttons, the full validation error catalog, and how "Apply" actually moves you through the flow.

## The Apply-time diagnostic technique

| Rule ID | Rule |
|---|---|
| `VAL-01` | Clicking **Apply** re-runs full validation and shows, per cover, a **live diff** of everything currently wrong with it: unmet dependencies, limit breaches, and personal fields still missing to price that specific cover. Fix one thing and click Apply again — the message narrows to only what's still wrong. This is the most reliable way to discover a cover's exact rules: set a deliberately oversized value, click Apply, and read the error text verbatim. |
| `VAL-02` | Worked example (TPD): empty form + oversized Sum Insured → *"...Gender, Age Next Birthday & Occupation/Occupation Code"* (plus the max-SI line) → after filling those three → narrows to *"Please enter a value for employment status"* → after filling that → only the max-SI line remains. |

## Footer buttons

| Rule ID | Button | Behavior |
|---|---|---|
| `VAL-03` | **Save** | Opens a modal: *"Add Reference (Optional)"* with a single optional text input and Cancel/Save buttons. Does **not** save immediately — waits for this confirmation. After confirming: the URL gains a real `QuoteId` (previously blank), gains `IsSaveEnabled=true`, and `IsClone=false` is removed. The page header shows a "Last modified" timestamp. No toast/success notification was observed in the DOM. |
| `VAL-04` | **Save as New** | Opens the **same** "Add Reference" modal. Intended to create a new quote copy with a fresh QuoteId, leaving the original unchanged — full round-trip not independently confirmed (modal was still open at the point of testing). Available even before the first Save (i.e. while `QuoteId` is still blank). |
| `VAL-05` | **View PDF** | Always visible/enabled in the footer, including when the premium is $0.00 or the quote hasn't been saved yet. Not independently confirmed what it actually produces — treat as "presumed to generate/open the quote illustration PDF" pending a direct test. |
| `VAL-06` | **Close** | Always visible. Presumed to navigate back to the quote list (`/QuoteAndApply/`) — not independently confirmed whether it prompts for unsaved changes first. |
| `VAL-07` | **Auto-save on blur:** tabbing out of any Sum Insured/Monthly Benefit field triggers an **immediate save** with no modal — this happens silently in the background, separate from the explicit Save button's "Add Reference" flow. |

## What "Apply" actually does — silent navigation, same URL

> ⚠ **Known issue, unresolved as of 2026-08-26 — clicking Apply on what should be a fully
> valid, minimal single-Life quote (Age/Gender/Occupation Code set, Employment Status set,
> Annual Income set, Life $200,000 priced) does not complete.** Confirmed live: the Apply
> button remains present and enabled, the "Illustration" heading remains, and no stable
> visible error explains why — but a **transient** error, *"Please complete the client's
> employment details before applying"* (`VAL-23`), flashes for roughly 0.6-4s after the
> click and then disappears on its own, even though Employment Status genuinely was set
> beforehand. This looks like a real validation-state/validation-display desync (the
> error clears before the underlying block does), not a test timing artifact — reproduced
> with both a fully-detailed and a minimal-baseline config, both giving the identical
> "no stable error, no navigation" result. See
> `apps/asteron-quote-apply/docs/bug-reports/apply-never-completes-transient-employment-status-error.md`
> for full evidence. Not yet confirmed with a BA/PM as regression vs. intentional. Until
> resolved, treat `VAL-08`/`VAL-09`/`VAL-11` below as the *documented intended* behavior,
> not confirmed current live behavior.

| Rule ID | Rule |
|---|---|
| `VAL-08` | When the current configuration is fully valid, clicking **Apply** silently advances the single-page app to a **Client Details** screen (Apply Flow step 2) — replacing "Illustration" with a "Client summary"-style heading, and the footer button set changes completely (Close/View PDF/Save as New/Save/Apply all disappear, replaced by different controls). |
| `VAL-09` | **Critical automation gotcha: the browser URL does not change during this transition** in some observed cases — do not rely on URL polling to detect that Apply succeeded. Check the page's visible heading/footer content instead. (Note: a separate observation recorded the URL changing to a `/QuoteAndApply/Client?ApplicationId=...` pattern after a full successful Apply+Save round-trip — the two observations may reflect different points in the same flow, e.g. an intermediate same-URL summary view versus the final post-save navigation. Treat both as possible and verify current behavior by content, not URL, either way.) |
| `VAL-10` | If validation fails instead, the screen stays on "Illustration" and shows the relevant error text — nothing navigates. |

## Minimum requirements to successfully Apply

| Rule ID | Requirement | Error if missing |
|---|---|---|
| `VAL-11` | Employment Status selected (not "Select one") | *"Please complete the client's employment details before applying"* |
| `VAL-12` | Every life on the quote meets its own minimum requirement | *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"* (**modal dialog**, dismissed with OK) — see the open discrepancy at [Policy Structure — POL-12](../policy-structure/page.md) about exactly when this fires |
| `VAL-13` | At least one cover with a real (committed, non-zero) Sum Insured/Benefit | Implied by the "minimum requirement for a quote" language above |

Per-life minimum, inferred from the above and from `PD-*`: Gender selected, Age Next Birthday filled (11–75), Occupation Code or Occupation selected, and at least one cover genuinely priced (see [Lump Sum Covers — LSC-40](../lump-sum-covers/page.md) and [Disability Covers — DC-01/DC-02](../disability-covers/page.md) for what "genuinely priced" means for each cover category).

## Full validation error catalog

| Rule ID | Error text | Trigger | Severity |
|---|---|---|---|
| `VAL-14` | *"Required field!"* | Age Next Birthday empty | Inline, client-side |
| `VAL-15` | *"Age next birthday should be between 11 and 75"* | Client-side range check | Inline |
| `VAL-16` | *"Age Next Birthday must be between 11 and 75"* | Server-side range check (post-blur) | Inline |
| `VAL-17` | *"Please complete the 'Sum Insured' field in the above row"* | Cover activated but Sum Insured never entered | Inline |
| `VAL-18` | *"The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17"* | Age < 17 with TPD configured | Inline |
| `VAL-19` | *"You must complete the following fields - Gender, Age Next Birthday & Occupation/Occupation Code"* | Cover(s) configured, required personal fields still empty (this exact field list narrows dynamically per `VAL-01`) | Combined/inline |
| `VAL-20` | *"Please contact underwriting as this Occupation requires Individual Consideration"* | Occupation Code = IC, fields incomplete | Warning |
| `VAL-21` | *"You must complete the following fields - Gender, Age Next Birthday, Occupation/Occupation Code, Employment Status & Annual Income $"* | IC occupation with all required fields missing | Combined |
| `VAL-22` | *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"* | See `VAL-12` | **Modal, blocking** |
| `VAL-23` | *"Please complete the client's employment details before applying"* | Apply clicked, Employment Status still "Select one" | Blocking |
| `VAL-24` | *"The minimum premium is $240.00 per year per Life insured"* | Total premium for a life is below $240/year (e.g. a zombie unfilled cover per `LSC-40`) | Inline banner |
| `VAL-25` | *(per-cover max-value errors)* | See the exact wording for each cover on [Lump Sum Covers](../lump-sum-covers/page.md) and [Disability Covers](../disability-covers/page.md) | Inline |
| `VAL-26` | *(per-cover occupation-availability errors)* | See [Lump Sum Covers](../lump-sum-covers/page.md) and [Disability Covers](../disability-covers/page.md) | Inline |
| `VAL-32` | *(Flexi Rate / commission-category messages, e.g. "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected", "Please select IC/RC in Adviser Use for all policies")* | See [Adviser Use / Commission Category](../adviser-use-commission/page.md) | Inline / Adviser Use modal |

## Validation timing

| Rule ID | Trigger | When validated |
|---|---|---|
| `VAL-27` | Age field blur (Tab out) | Immediate — both the client-side and server-side messages can appear |
| `VAL-28` | Sum Insured/Benefit field blur | Immediate — also triggers the silent auto-save (`VAL-07`) |
| `VAL-29` | Apply button click | All required fields/covers checked simultaneously, per `VAL-01` |
| `VAL-30` | Cover activation | Server checks age/occupation eligibility immediately |
| `VAL-31` | Gender/Occupation change | Server recalculates cover eligibility immediately |

# Adviser Use / Commission Category

> Child of [Quote Screen](../page.md). Rule ID prefix: `ADV-`
> Source spec: [User Story - Select Default Commission Category](../../../user-stories/User%20Story-%20Select%20Default%20Commission%20Category.md) (Jira ACB-13175)
> Tested by: `apps/asteron-quote-apply/tests/comm-cat-v1.spec.js` ([test doc](../../test-documentation/comm-cat-v1.md))
> **This feature is treated as already built** — the source doc's Jira Status field is blank,
> but per `.kiro/steering/test-expansion-process.md` ("acceptance-criteria mode"), a mismatch
> here is a candidate defect, not evidence the feature isn't shipped. Every mismatch below is
> backed by a full Discrepancy Evidence Record, not a one-line summary.

## What this is

Clicking **Adviser Use** on a valid, priced quote opens a **"Commissions"** modal. It has two sections:

1. **Default for Agency** — an agency-wide default commission category (Upfront / Level 30 / Spread 20) with an **Update** button.
2. **Per-life commission detail** — per policy ("Personal Insurance - N"), a **Select IC/RC** dropdown and a **Select All** / per-cover commission-category dropdown, plus a **Split commission** checkbox.

The Default for Agency setting is **shared across the agency**, not per-quote — changing it affects future quotes agency-wide. Tests must not click its Update button against the shared dev environment without a clear reason to.

## Confirmed rules

| Rule ID | Rule |
|---|---|
| `ADV-01` | Label reads **"Default for Agency (`<agency numbers>`)"** — a comma-separated list of real agency numbers, confirming AC01. |
| `ADV-02` | Default commission category options are exactly **Upfront / Level 30 / Spread 20** — no "Nil Commission" option is ever offered as a default (AC02, and the doc's explicit "Nil Commission Option" rule). |
| `ADV-03` | First-time default (no prior agency configuration) is **Upfront** (AC03). |
| `ADV-04` | When **Flexi Rate = N/A**, the **Select IC/RC** dropdown for a cover has exactly one real option (`IC-100%, RC-100%`) besides "Please Select", and it is **auto-selected** rather than left on "Please Select" (AC14). |
| `ADV-05` | Selecting the **30% Flexi Rate** displays: *"Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected"* (AC11, exact text confirmed). No "Please select IC/RC" validation appears in this state. |
| `ADV-06` | At 30% Flexi Rate, the per-cover commission rows (**Select IC/RC**, **Select All**, per-cover dropdown) are **removed from the modal entirely** — only the agency-wide Default for Agency dropdown remains. This matches the doc's "Adviser Use Cover display" note that covers are not shown in this scenario. |
| `ADV-07` | **Update** button starts **disabled**, and only enables once the Default for Agency selection genuinely differs from the currently-saved value; reverting the selection back to the saved value re-disables it (AC04, AC05, and the spirit of AC09). See "Retracted finding" below — this was initially misreported as broken. |

## Discrepancy Evidence Record — genuine, reproduced 3× on separate runs

#### 7.5% Flexi Rate: Select IC/RC does not default per the user story's own worked example

- **AC / Rule ID:** AC10 / the user story's **"Use Case: Multiple IC/RC Rate" → Example 2** (part of the multi-option IC/RC matrix; AC15 territory)
- **Verbatim requirement** (from `User Story- Select Default Commission Category.md`, "Example 2 - If the FR selected is 7.50%" table):
  > "Pick list options | IC-100%, RC-50%; or IC-50%, RC-100%; or IC-75%, RC-100%, or IC-25%, RC-100%"
  > "Default IC/RC expectation | IC-75%, RC-100% is the Default for UPFRONT for 7.5%. Expect to see this value in the IC/RC field after opening the Adviser Use screen."
- **Reproduction steps:**
  1. Log in as `hanno.coetzee+1123@resolutionlife.com.au` at `https://outsystems-dev.asteronlife.co.nz`.
  2. Open a **New Quote**. Set Age Next Birthday = **35**, Gender = **Male**, Occupation Code = **AA** (dropdown value `1`).
  3. Activate the **Life** cover, enter Sum Insured = **500000** (via calc-mask: 12× Backspace, then type digits, then Tab). Confirm the quote prices (Total Yearly Premium appears).
  4. Leave the agency's Default for Agency commission category at its default (**Upfront** — confirmed via `ADV-03`, untouched in this repro).
  5. Set the **Flexi Rate** dropdown (`select[id*="FlexiRate"]`) to **7.5%**.
  6. Click **Adviser Use** to open the Commissions modal.
  7. Read the **Select IC/RC** dropdown for "Personal Insurance - 1" (located by fingerprint: first option `"Please Select"`, remaining options all matching `/^IC-\d+%, RC-\d+%$/`).
- **Expected result:** Selected value = **`IC-75%, RC-100%`** (per Example 2, for the Upfront agency default).
- **Actual result** (verbatim, identical across all 3 runs below):
  ```json
  {
    "options": ["Please Select", "IC-100%, RC-50%", "IC-25%, RC-100%", "IC-50%, RC-100%", "IC-75%, RC-100%", "IC-100%, RC-100%"],
    "selectedIndex": 5,
    "selectedText": "IC-100%, RC-100%"
  }
  ```
  The option set itself is a near-match to the spec (4 expected options plus an extra `IC-100%, RC-100%`), but the **auto-selected default is wrong** — it lands on `IC-100%, RC-100%` (index 5) instead of `IC-75%, RC-100%`.
- **Evidence artifacts** (in `evidence/` next to this page):
  - `finding-02-7.5pct-icrc-default-mismatch.png` — screenshot from `apps/asteron-quote-apply/probes/probe-commission-evidence.js` (run 2)
  - `finding-02-test-run-failure-screenshot.png` — Playwright's own failure screenshot from running the real test file, `comm-cat-v1.spec.js`, Part 5 (run 3 — closest to how this will run in the OutSystems Test Console)
  - `raw-probe-output-run2.json` — raw JSON dump from run 2
- **Environment:** `https://outsystems-dev.asteronlife.co.nz`, account `hanno.coetzee+1123@resolutionlife.com.au`, observed 2026-08-20.
- **Reproducibility:** Confirmed **3 times** on 3 separate script executions (`apps/asteron-quote-apply/probes/probe-commission-category.js`, `apps/asteron-quote-apply/probes/probe-commission-evidence.js`, and `comm-cat-v1.spec.js` Part 5 via the real Playwright Test runner). Identical result every time — no variance observed.
- **Test encoding:** `comm-cat-v1.spec.js`, Part 5 ("7.5% FLEXI RATE -> IC/RC DEFAULT PER USER STORY EXAMPLE 2"), asserts the spec's expected value (`IC-75%, RC-100%`) and currently fails with exactly the actual value shown above. This assertion will pass automatically once the default-selection logic is corrected — no test change needed when it ships.

## Retracted finding — Update button (methodology note, kept for the record)

An earlier probe (`apps/asteron-quote-apply/probes/probe-commission-category.js`) reported the **Update** button as already enabled on modal open, before any change — apparently contradicting AC04/AC05. On this session's instruction to document discrepancies to defect-report quality, a deeper, controlled re-investigation was done (4 further runs — timing samples with zero interaction, and a clean re-test using only Playwright's real `selectOption()` API). Full raw output: `evidence/update-button-investigation-raw-output.txt`.

**Conclusion: this was a false positive, not a real defect.** The original probe's own `page.mouse.wheel(0, 400)` call (used just to scroll a screenshot into view) is the suspected contaminant — most likely an OS/browser quirk where a wheel event over a focused `<select>` silently changes its value, which the app's reactive binding then treated as a genuine user change. A clean re-run with zero interaction after opening the modal showed the button staying disabled for 12+ seconds with nothing touched, and a re-run using only real `selectOption()` calls confirmed the full expected sequence: disabled by default → enabled after a real change → disabled again after reverting to the saved value. `ADV-07` above reflects the corrected, confirmed conclusion.

**Lesson for future probes against this app:** avoid `page.mouse.wheel()` (or any raw scroll) while a `<select>` might be under the cursor — it can silently mutate the select's value and produce a false reading. Prefer `locator.scrollIntoViewIfNeeded()` over `page.mouse.wheel()` when framing a screenshot.

## Deferred (not yet investigated — explicitly, not silently skipped)

| AC(s) | Why deferred |
|---|---|
| AC09 | Partially covered by `ADV-07`'s revert-to-saved-value behavior; the exact "no changes made across a session" first-open case beyond first-time-ever-configured is not separately isolated. |
| AC12, AC13, AC15–AC19 | Rest of the multi-option IC/RC matrix (Examples 1, 3, 4 in the source doc) — each is its own persona/Flexi-Rate/commission-category combination and needs the same reproduce-3-times rigor as the 7.5% case above before being encoded. |
| AC20–AC25 | Cross-quote persistence (agency default changes must not retroactively affect saved quotes) — requires saving two separate quotes and reopening them, not yet attempted. |
| AC26 | Data integrity after deployment — not testable pre-deployment by definition. |
| AC27 | STP / LIFE400 `createPolicy` payload — requires backend/payload inspection, out of scope for UI-only Playwright tests. |

# Business Rules — Loadings (Quote screen)

Source: user story ACB-3599 (Enter Loadings). Provenance tags: **[Story ACB-3599, 2026-09-11]**
where confirmed by the acceptance-criteria test `enter-loadings-v1.spec.js`.

## Confirmed rules

| Rule ID | Rule | Provenance |
|---|---|---|
| LOAD-01 | Loadings pop-up offers a **Percentage** dropdown per cover: None, 25%, 50%, 75%, 100%, 125%, 150%, 175%, 200%, 225%, 250%, 275%, 300%, 325%, 350%, 375%, 400% (17 options). | [Story ACB-3599, 2026-09-11] |
| LOAD-02 | **Per Mille** dollar input per lump-sum cover (Life, Trauma, Cancer). | [Story ACB-3599, 2026-09-11] |
| LOAD-03 | **TPD** and **Disability** Per Mille fields are **greyed/disabled** (percentage only; per-mille default 0). Confirmed by field id: `Input_PerMille_TPD` and `Input_PerMille_Disability` are `disabled`; `Input_PerMille` (Life), `_Trauma`, `_Cancer` are enabled. | [Story ACB-3599, 2026-09-11] |
| LOAD-04 | Cancel / X returns to the Quote screen. | [Story ACB-3599, 2026-09-11] |
| LOAD-05 | Clicking **OK** with a valid per-mille loading redirects back to the Quote screen and displays **"Loadings have been applied"** (AC04/AC08). | [Story ACB-3599, 2026-09-11] |
| LOAD-06 | Percentage / Per mille "?" tooltips explain the loading types ("...loadings are applied where a client..."). | [Story ACB-3599, 2026-09-11] |
| LOAD-07 | Opening Loadings on an unpriced quote (premium $0) shows a blocking error message. | [Story ACB-3599, 2026-09-11] |

## Discrepancy Evidence Records

#### LOAD-D1 — Per-mille loading > $20.00 is accepted with NO maximum-per-mille error

- **AC / Rule ID:** AC07 (ACB-3599)
- **Verbatim requirement:** "**Given** AC02 is active and the user is on the **Loadings** screen
  **When** the user enters loading value greater than 20.00 per mille **Then** the system must
  display an error message *The maximum per mille loading is $20.00*". (Also stated in AC02's
  Per Mille bullet: "Maximum allowable entry: $20 per cover type".)
- **Reproduction steps:**
  1. Log in (QA), open a New Quote (adviser session).
  2. Set personal details: Age Next Birthday 40, Male, Occupation Code 1 (AA).
  3. Activate **Life** cover, Sum Insured **$200,000** (quote priced).
  4. Click the **Loadings** link to open the Loadings pop-up.
  5. In the **Life Per Mille** field (`id=b25-b16-Input_PerMille`), enter **25** (i.e. > $20.00); blur.
  6. Observe: no error. Repeat with **20.01** — still no error. Enter **20** (boundary) — correctly no error.
- **Expected result:** entering a value > $20.00 shows "The maximum per mille loading is $20.00".
- **Actual result:** the field accepts **25** (`input.value = "25"`, `input.validity.valid = true`,
  empty `validationMessage`) and **20.01** with **no** "maximum per mille" text anywhere in the
  document body, no `[class*="feedback"|"error"]`, `[role="alert"]`, or `.text-danger` element
  carrying the message. The $20 cap is not enforced or surfaced on the per-mille field.
- **Evidence artifact(s):** `../../../probes/evidence/02-probe-loadings-popup-2026-09-11/` —
  `notes.md`, `popup-result.json` (`ac07_over20_error: {matched:"", hasMax:false}`),
  `ac07-result.json` (`valueLanded: {value:"25", valid:true}`,
  `ac07_over20_errSurfaces: {hasMaxInBody:false, ...}`, `ac07_2001_hasMax:false`).
- **Environment:** https://outsystems-qa.asteronlife.co.nz, account a, 2026-09-11.
- **Reproducibility:** reproduced across two independent probe scripts and two interaction
  techniques (Playwright `fill()`+blur AND keyboard `type()`+Tab). No variance between runs.
- **Test encoding:** `enter-loadings-v1.spec.js` → test "AC07: Per Mille loading > $20.00 →
  maximum-per-mille error (+ $20.00 boundary accept)". The at-$20.00 accept side passes; the
  over-limit side asserts the spec's expected error and is **expected-to-fail** until the app
  enforces/displays the cap.
- **Likely explanation:** #1 (real gap/defect) — the story asserts current shippable behaviour;
  the cap is simply not implemented on the Loadings per-mille field on QA. Not a test artifact
  (value self-verified as landed and valid).

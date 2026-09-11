# Probe run 02 — Loadings pop-up DOM + AC04/AC07/AC08 behaviour (2026-09-11)

- **Date/time:** 2026-09-11 ~10:25 AEST
- **Scripts:** `probe-loadings-popup-2026-09-11.js` (map + behaviour), `probe-loadings-ac07-2026-09-11.js` (focused AC07 re-probe)
- **Account:** a, QA
- **Persona:** Age 40, Male, OccCode 1 (AA), Life cover $200,000 priced

## DOM map (pinned selectors)

Per-mille inputs inside the Loadings modal (all `type=number`):
- Life: `b25-b16-Input_PerMille` (enabled)
- TPD: `b25-b16-Input_PerMille_TPD` (**disabled** ✓ AC06)
- Trauma: `b25-b16-Input_PerMille_Trauma` (enabled)
- Cancer: `b25-b16-Input_PerMille_Cancer` (enabled)
- Disability: `b25-b16-Input_PerMille_Disability` (**disabled** ✓ AC06)

Modal buttons: `Cancel` (`.btn`), `OK` (`.btn.btn-primary`).

## AC04 / AC08 — CONFIRMED MATCHING (encode as passing)

After entering a per-mille loading and clicking OK:
- "**Loadings have been applied**" message present on the Quote screen (`loadingsApplied: true`, line = "Loadings have been applied").
- Redirected back to the Quote screen (`backOnQuote: true`).

## AC07 — CONFIRMED NOT MATCHING (candidate defect → expected-fail + Discrepancy Record)

Requirement (verbatim): "When the user enters loading value greater than 20.00 per mille Then the
system must display an error message *The maximum per mille loading is $20.00*".

Observed, reproduced across BOTH scripts (fill+blur AND keyboard-type+Tab):
- Enter `25` in Life per-mille: value LANDED (`value:"25"`, `validity.valid:true`), **NO** "maximum
  per mille" error anywhere (body text, `[class*=feedback|error]`, `[role=alert]`, `.text-danger`).
- Enter `20.01` (just over): value landed `20.01`, still **no** max error.
- Enter `20` (at boundary): no error (correct — boundary accept).

Not a test artifact: the value self-verified as landed and valid; two independent interaction
techniques agree. This is a genuine app/story discrepancy — the >$20 cap error is not enforced/
shown on the Loadings per-mille field on QA.

## Encoding decision
- AC04/AC08 → passing assertions (behavioural: "Loadings have been applied" + back on Quote).
- AC06 → tighten to assert TPD + Disability per-mille disabled BY ID (was: any disabled input).
- AC07 → assert the spec's expected error ("The maximum per mille loading is $20.00") appears for
  input 25 → EXPECTED TO FAIL until fixed. Plus $20.00 at-boundary ACCEPT (no error) which passes.
- AC05 (down-arrow → Underwriting Guide external URL, new window) stays deferred: leaves the app;
  encode as a window.open/popup-target capture separately (external navigation).

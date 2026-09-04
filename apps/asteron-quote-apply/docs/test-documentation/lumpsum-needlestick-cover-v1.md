# Test: Lumpsum Needlestick Cover — lumpsum-needlestick-cover-v1

> **Test file:** `lumpsum-needlestick-cover-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`, account A) — run 13-18-51
> **Source:** ACB-2931 user story ("Lumpsum Needlestick Cover"), acceptance-criteria mode
> **Result:** 10/11 passing, 1 confirmed failing (AC05 — genuine app discrepancy, expected-to-fail)

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present | New quote | 7 covers present | ✅ Pass | |
| 2 | AC03 | Needlestick SI dropdown $0-$500k ($50k steps) + Premium Structure greyed/Stepped | Companion Life + Needlestick | 11-option $0..$500,000 select; Structure Stepped AND disabled | ✅ Pass | SI is a `<select>`, not a calc-mask (probe-confirmed) |
| 3 | AC04 | Needlestick alone → companion-required error | Needlestick, no companion | "requires one of the following covers: Life, Trauma Recovery, Cancer, TPD or Income Protection" | ✅ Pass | Negative side |
| 4 | AC10 | Needlestick WITH companion accepted | Life + Needlestick | No companion-required error | ✅ Pass | Positive complement of AC04 |
| 5 | AC05 | Ineligible occupation → not-available error | Occ AM + Needlestick | "Needlestick not available for the selected occupation" | ❌ Fail | **Confirmed app discrepancy** — see record below |
| 6 | AC06 | Below-min-age error | ANB 16 | "minimum age next birthday for Needlestick cover is 17" | ✅ Pass | |
| 7 | AC06 | At-min-age accept (boundary) | ANB 17 | No min-age error | ✅ Pass | At-boundary accept |
| 8 | AC07 | Over-max-age error | ANB 66 | "maximum age next birthday for Needlestick cover is 65" | ✅ Pass | |
| 9 | AC07 | At-max-age accept (boundary) | ANB 65 | No max-age error | ✅ Pass | At-boundary accept |
| 10 | AC08/AC09 | Max 1 Needlestick — disabled after 1, re-enables on remove | Life + Needlestick, then remove | +Needlestick disabled at 1, enabled after remove | ✅ Pass | Negative/absence + re-enable |
| 11 | AC11 | "?" tooltip hepatitis/HIV text | Life + Needlestick | tooltip mentions "hepatitis B or C or HIV" | ✅ Pass | Robust title/body search (no click) |

## Discrepancy Evidence Record

#### AC05 — ineligible occupation does not show the required error message

- **AC / Rule ID:** AC05 (ACB-2931)
- **Verbatim requirement:** "Given I have selected the Needlestick option, When I choose an occupation that is not eligible for Needlestick cover, Then the system must display an error message stating: 'Needlestick not available for the selected occupation'."
- **Reproduction steps:** 1. New quote, ANB 40, Gender Male, Occupation code = AM (ineligible per legacy LSC-02). 2. Activate a Life companion ($200,000). 3. Click Needlestick. 4. Click Apply.
- **Expected result:** error "Needlestick not available for the selected occupation".
- **Actual result (probe 2026-09-04):** the Needlestick button stays ENABLED (`disabled:false`) but clicking it does NOT add a Needlestick cover card (SumInsured input count stays 1 — the Life companion only), and NO occupation-related error is shown anywhere (body text + all `[title]` attrs scanned; Apply returns zero visible errors). The only occupation-related text present is the generic Needlestick tooltip ("For certain occupations, provides additional financial protection..."). So the gating manifests as a SILENT activation no-op, not the specified error message.
- **Evidence artifact(s):** probe output captured in the generation session (probe `_probe-ac05`, 2026-09-04); test-run screenshot `test-runs/lumpsum-needlestick-cover-v1/2026-09-04T13-18-51/` (AC05 failure).
- **Environment:** BASE_URL https://outsystems-dev.asteronlife.co.nz, account hanno.coetzee+1123, 2026-09-04.
- **Reproducibility:** reproduced on the AC05 probe run and two full spec runs (same silent no-op each time).
- **Test encoding:** `lumpsum-needlestick-cover-v1.spec.js` AC05 asserts the spec's expected message and is EXPECTED TO FAIL until the app surfaces it.

## Deferred

None — all 11 ACs (AC01–AC11) encoded; AC05 is a confirmed discrepancy (expected-fail), the rest pass with positive + negative/absence + boundary-accept coverage via `recordCheck`.

## Notes — session instability

Per `.kiro/steering/test-expansion-process.md`, this account intermittently forces a mid-run logout
under cumulative load. On an earlier run AC01/AC02 and AC11 were session casualties (browser closed /
tooltip raced); both passed on the clean run 13-18-51. AC11 was also hardened to search the DOM/`title`
attributes directly instead of racing a click-triggered popover. Two accounts were used to run this
spec in parallel with the Specific Injury spec (separate `AUTH_STATE_FILENAME`) — the two sessions did
not conflict with each other.

## Business Rule Corrections

None (AC05 is filed as a discrepancy above, pending dev/BA confirmation — app behaviour not yet changed).

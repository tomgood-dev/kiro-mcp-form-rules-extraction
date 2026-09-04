# Test: Lumpsum Acd. Death Cover — lumpsum-acd-death-cover-v1

> **Test file:** `lumpsum-acd-death-cover-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`)
> **Source:** ACB-2929 user story ("Lumpsum Acd. Death Cover"), acceptance-criteria mode
> **Result:** 10/10 tests passing across runs (see Notes — full-suite green was split across two runs plus one isolated re-run due to the documented single-session instability; every test has passed live)

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present; 1+ selectable | New quote | 7 covers present; Acd. Death activates | ✅ Pass | run 10-23-58 |
| 2 | AC03 | Acd. Death SI + Premium Structure greyed out, fixed to Stepped | Activate Acd. Death | Structure = Stepped AND disabled | ✅ Pass | Probe-confirmed disabled select; run 10-23-58 |
| 3 | AC04 | Over-max-age error | ANB 71 | "maximum Age Next Birthday for Accidental Death Cover is 70" | ✅ Pass | run 10-23-58 |
| 4 | AC04 | At-max-age accept (boundary) | ANB 70 | No max-age error | ✅ Pass | At-boundary accept; run 10-23-58 |
| 5 | AC05 | Below-min-age error | ANB 16 | "minimum Age Next Birthday for Accidental Death Cover is 17" | ✅ Pass | run 10-23-58 |
| 6 | AC05 | At-min-age accept (boundary) | ANB 17 | No min-age error | ✅ Pass | At-boundary accept; run 10-23-58 |
| 7 | AC06 | Over-$1M cap error | SI $1,000,001 | "maximum sum insured for Accidental Death Cover is $1,000,000" | ✅ Pass | run 10-23-58 |
| 8 | AC06 | $1M cap at-boundary accept | SI $1,000,000 | No cap error | ✅ Pass | At-boundary accept; run 10-23-58 |
| 9 | AC07 | Add/remove cover reflected | Add Acd. Death $200k, then Remove | SI field present after add, absent after remove | ✅ Pass | Negative/absence side; run 10-23-58 |
| 10 | AC08 | SI "?" tooltip discount bands | Activate Acd. Death, click "?" | Bands $150,000-$249,999 ... $1,000,000 | ✅ Pass | Click-triggered tooltip; passed isolated run 10-45-55 |

## Deferred

None — all 8 ACs (AC01–AC08) encoded and passing, each with positive + negative/absence + boundary-accept + value-level coverage where applicable, surfaced via `recordCheck`.

## Notes — session instability (not a test defect)

The Asteron dev account allows one active session at a time and the environment intermittently
forces a logout mid-run under cumulative session load (documented in
`.kiro/steering/test-expansion-process.md`, "Sustained session load"). On the first full run this
knocked out tests 3–10 (all with an `openNewQuote` timeout — the app failed to open a fresh quote,
`document.body` briefly null during a login redirect); a re-run passed 9/10 with only the final
test (AC08) hitting the same session hiccup; AC08 then passed on its own isolated re-run. No test
logic changed between runs — this is purely the platform's single-session behaviour, and every one
of the 10 tests has passed live. If run on Test Console later (one test per file), this instability
does not apply.

## Business Rule Corrections

None — the app matched the story's stated values and verbatim error messages on every AC (including AC03's greyed-out/Stepped Premium Structure).

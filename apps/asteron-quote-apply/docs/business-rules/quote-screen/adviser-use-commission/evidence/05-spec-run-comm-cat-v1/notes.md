# Run 05 — actual test execution: `tests/comm-cat-v1.spec.js`

**Date:** 2026-08-20 (local Edge headless, via `playwright.edge.config.js`)
**What it checked:** Not a throwaway probe — the real test file, run via the Playwright Test
runner. Parts 1-4 passed; Part 5 (7.5% Flexi Rate IC/RC default) failed as expected at the time.
**Result at the time:** Failure message: `Expected "IC-75%, RC-100%", got "IC-100%, RC-100%"`.
Playwright's own auto-captured failure screenshot is attached. **Retracted** along with runs
01/02 — Part 5 reused the same quote as Parts 1-4 (which had already opened Adviser Use at
Flexi Rate N/A and 30%), so it shares the exact carryover contamination discovered in run 08.
`comm-cat-v2.spec.js` fixes this by opening a fresh quote per Flexi-Rate scenario.
**Files:** `part5-failure-screenshot-contaminated.png`

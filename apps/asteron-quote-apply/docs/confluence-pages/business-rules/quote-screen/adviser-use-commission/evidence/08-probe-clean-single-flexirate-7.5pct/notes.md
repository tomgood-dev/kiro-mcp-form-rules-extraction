# Run 08 — `probes/probe-clean-single-flexirate.js` (TARGET_FR=7.5%)

**Date:** 2026-08-20
**What it checked:** Truly minimal re-check of the 7.5% Flexi Rate IC/RC default from runs
01/02/05 — fresh browser session, fresh quote, Flexi Rate set to 7.5% BEFORE Adviser Use is
opened for the first and only time (never opened at N/A or any other rate first).
**Result:** Select IC/RC = `IC-75%, RC-100%` selected, with exactly the 4 documented options —
**matches the user story exactly.** This is the run that overturned the original "7.5% mismatch"
finding: runs 01/02/05 had all opened Adviser Use at Flexi Rate N/A (whose correct default,
`IC-100%, RC-100%`, happens to match what they wrongly observed at 7.5%) before switching rates
in the same quote/session.
**Files:** `raw-output.txt` (console-only, no screenshot taken in this probe)

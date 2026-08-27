# Run 10 — `probes/probe-fresh-quote-isolation.js`

**Date:** 2026-08-20
**What it checked:** Whether opening a fresh quote (New Quote navigation) within the SAME
browser/login session is sufficient to reset the carryover state found in runs 01/02/05/07, or
whether only a fully fresh browser session (new login) resets it. Quote 1 at Flexi Rate 7.5%,
then Quote 2 (fresh "New Quote", same session) at Flexi Rate 12.5%.
**Result:** Quote 1 correctly showed `IC-75%, RC-100%`. Quote 2 correctly showed `Please Select`
— **no carryover from Quote 1**, even though it's the same browser/login session. Confirms a
fresh "New Quote" navigation is sufficient isolation. This decides how `comm-cat-v2.spec.js` is
structured: one fresh quote per Flexi-Rate scenario, all within the one `test()` Test Console
allows, rather than reusing a single quote across scenarios (which is what caused the false
positives in the first place).
**Files:** `raw-output.txt` (console-only, no screenshot taken in this probe)

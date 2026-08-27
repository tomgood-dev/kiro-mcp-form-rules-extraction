# Run 06 — `probes/probe-example1-category-default.js`

**Date:** 2026-08-20
**What it checked:** Example 1 (2.5% Flexi Rate) against the user story, distinguishing "Select
All" from the individual "Life Cover" row by nearby label text (naive option-set fingerprints
can't tell them apart).
**Result:** CONFIRMED matching — Select IC/RC = `IC-100%, RC-50%` (documented default), Life
Cover row = `Upfront` (documented default). "Select All" separately shows "Please Select", which
is correct — it's a bulk-apply control, not a status display, and the doc only requires the
per-cover row to default to Upfront.
**Files:** `example1-2.5pct-full-modal.png`, `raw-output.txt`

# Run 07 — `probes/probe-examples-3-4.js`

**Date:** 2026-08-20
**What it checked:** Example 3 (15% Flexi Rate) and Example 4 (12.5% Flexi Rate, multiple
UPFRONT IC/RC rates), both against the same fresh quote in sequence (Example 3 tested first,
then Flexi Rate switched to 12.5% and Adviser Use reopened for Example 4).
**Result at the time:**
- Example 3 (15%): CONFIRMED matching — Select IC/RC = `IC-50%, RC-50%` (documented default),
  Life Cover = `Upfront`. This one holds up (see run 09's clean re-check).
- Example 4 (12.5%): appeared to show a defect — Select IC/RC had an undocumented 5th option
  (`IC-50%, RC-50%`) auto-selected, when the doc says it should default to "Please Select" with
  exactly 4 options. **Retracted** — `IC-50%, RC-50%` is Example 3's own correct default; this
  was the same-session carryover from testing Example 3 immediately beforehand in this script.
  This exact anomaly is what triggered the carryover investigation (runs 08-10).
**Files:** `example4-12.5pct-contaminated-reading.png`, `raw-output.txt`

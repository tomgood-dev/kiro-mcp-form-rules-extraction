# Run 01 — `probes/probe-commission-category.js`

**Date:** 2026-08-20
**What it checked:** First deep probe of the Commissions modal — Update button state before/after
changing Default-for-Agency, and Select IC/RC at Flexi Rate 7.5% and 30%.
**Result at the time:** Reported Update button as `disabled: false` both before and after a
change (later found to be a false positive — see `../update-button-investigation.txt`), and
Select IC/RC at 7.5% as `IC-100%, RC-100%` (later found to be a carryover artifact from opening
Adviser Use at Flexi Rate N/A earlier in the same session — see run 08).
**Screenshots:** None retained — taken before the per-run evidence convention existed and later
deleted. Console output is quoted verbatim in `../update-button-investigation.txt` ("RUN A").

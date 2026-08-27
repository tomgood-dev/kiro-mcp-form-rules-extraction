# Run 02 — `probes/probe-commission-evidence.js`

**Date:** 2026-08-20
**What it checked:** Re-check of the Update button (fresh session) and Select IC/RC at Flexi
Rate 7.5%, intended as an independent confirmation of run 01.
**Result at the time:** Update button showed `disabled: true` on open (contradicting run 01 —
this discrepancy is what triggered the full investigation in `../update-button-investigation.txt`).
Select IC/RC at 7.5% again showed `IC-100%, RC-100%` selected — at the time this looked like a
2nd independent confirmation of a real defect, but this run *also* opened Adviser Use at Flexi
Rate N/A first (to check the Update button) before switching to 7.5%, so it shares the same
carryover contamination discovered later in run 08. **Retracted** — see run 08/09/10 for the
clean re-tests that overturned this.
**Files:** `update-button-disabled-true.png`, `icrc-7.5pct-contaminated-reading.png`, `raw-output.json`

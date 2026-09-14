# Probe — Kids Cover AC08/AC09 premium (2026-09-14)

## OUTCOME: AC08 + AC09 CONFIRMED PASS. No defect. (Initial "$0.00 defect" was a test artifact, retracted.)

Final clean run (blur fix applied), account a / QA, Age 40 Male OccCode 1, Life $200k:
- Life alone = **$296.16/yr** ($24.68/mo).
- + 1 kid @ $100k SI = **$356.16/yr** — kid adds **$5.00/mo** → AC08 (kids priced) ✓.
- + 3 kids @ $100k SI = **$476.16/yr**; panel shows a SINGLE **"Kids $15.00"** line
  (Life $24.68 + Kids $15.00 = $39.68/mo) → AC09 (one aggregated Kids line regardless of count) ✓.
- Zero on-screen errors once the DOB fields are blurred.

## The fix (what made it work — 3 driving lessons)

1. **Blur after filling the kid DOB.** The DOB shows a transient "Required field!" until it loses
   focus; on blur the value commits and the error clears. Fill-then-immediately-read saw the
   transient error + a $0.00 panel and nearly got written up as an app defect. (User-observed.)
2. **Set kid SI before DOB.** Setting a kid SI tier re-renders the kids repeating list and clears
   already-entered DOBs — fill DOBs LAST, then landing-verify.
3. **Kid SI is the tier DROPDOWN** — use `selectOption`. Do NOT write the masked `Input_SumInsured`
   via `.value` (corrupts to ".2.0.0..").

Encoded in the `setupKidsCover` helper in kids-cover-v1.spec.js. Both ACs are now PASSING
value-level tests (harness run 2026-09-14: 2 passed). No business-rule discrepancy.

## Process note
This closes the coverage audit's ONE silent omission. It also drove three steering additions:
check on-screen errors after every interaction; the stale-auth-state refresh rule; and the
autonomy/communication operating rules. Result JSONs: oneshot/diag/final/iterative-result.json.

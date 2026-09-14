# Probe run — Kids Cover AC08/AC09 premium (2026-09-14)

- **Scripts:** `probe-kids-premium-oneshot-2026-09-14.js`, then `probe-kids-premium-diag-2026-09-14.js`
  (error-swept diagnostic).
- **Account:** a, QA. Persona: Age 40, Male, OccCode 1 (AA), Life $200,000, 2 kids.

## OUTCOME: NO app defect confirmed. Earlier "$0.00 = AC08/AC09 defect" was a TEST-DRIVING ARTIFACT — RETRACTED.

Initial runs showed the panel dropping to $0.00 when kid SI was set > $50k, and I nearly wrote it
up as an AC08/AC09 defect. The error-swept diagnostic (checking on-screen errors after EVERY step)
disproved that:

1. **A "Required field!" error appeared** the moment kid SI was set — I had been ignoring it.
2. **Cause 1 — SI re-render wipes DOB:** setting a kid SI tier RE-RENDERS the kids repeating list
   and clears previously-entered per-kid DOBs. My fill order (DOBs then SI) left kid 2's DOB empty
   → "Required field!" → panel $0.00. Fixing the order (SI first, then DOBs, verify none empty)
   recovered the premium to $296.16.
3. **Cause 2 — corrupted masked SI field:** a Sum Insured field read `.2.0.0.0.0.0.` (calc-mask
   corruption from writing a masked field via `.value`/selectOption instead of digit-by-digit
   `fillCalcMask`). This is the residual "Required field!"/validation blocker.

Both causes are MY driving technique, not app behaviour. **AC08/AC09 remain UNVERIFIED** — do not
encode them as pass or expected-fail until the kids scenario is driven cleanly (masked SI via
`fillCalcMask`, SI-before-DOB order, all required fields verified filled, zero on-screen errors),
then read whether a real kids premium + single aggregated "Kids" line appears.

## Lessons (fed into steering)

- **Check on-screen errors after EVERY interaction** — added to `test-expansion-process.md` Probe &
  Interaction Safety. The ignored "Required field!" is exactly what this rule catches.
- **The kids repeating list re-renders on SI change and wipes DOBs** — order matters: set SI first,
  then per-kid DOB, then verify none empty before reading the premium.
- **Masked SI fields must use `fillCalcMask` (digit-by-digit)** — `.value`/selectOption corrupts
  them to `.2.0.0.0...` and fails validation.

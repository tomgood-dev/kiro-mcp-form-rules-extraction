# 14 — probe-ac16-apply (employment-details Apply gate blocks IC/RC validation)

- **Date/time:** 2026-08-28 ~15:30–15:48
- **Command:** `node apps/asteron-quote-apply/probes/probe-ac16-apply.js` (run twice, two field orderings)
  plus spec runs of AC16 and VAL-08.
- **Goal:** Reach the AC16 IC/RC-at-Apply validation ("Please select IC/RC in Adviser Use for
  all policies.") by clicking Apply on a Flexi-12.5% quote without picking an IC/RC option.

## What was checked and found

1. **Run A** — set Age/Gender/OCC → Employment Status = Employed → income 150,000 → Life $500k →
   Flexi 12.5% → Apply.
   - Employment Status read back = **"Employed"**, Income = **"150,000"** (both stuck).
   - Apply error: **"Please complete the client's employment details before applying"** — NOT the
     IC/RC validation.

2. **Run B** — reordered so Employment Status = Employed is set **last**, AFTER Flexi 12.5%
   (hypothesis: Flexi change resets employment).
   - Employment Status read back immediately before Apply = **"Employed"**.
   - Apply error: still **"Please complete the client's employment details before applying"**.
   - → The gate is NOT about the visible Employment Status dropdown value.

3. **Spec AC16 with SI $200k** → Apply error was **"The minimum premium is $240.00 per year per
   Life insured."** (premium below floor at Flexi 12.5%). Raised SI to $1M → min-premium cleared,
   but the employment-details gate returned (as in runs A/B).

4. **VAL-08/09/10 regression** — the previously-passing
   `validation-and-navigation.spec.js` VAL-08 ("a fully valid single-cover configuration allows
   Apply to proceed", recipe: `setMinimumPersonalDetails({employmentStatus:'Employed'})` + Life
   $200k) **now FAILS**: `[step] Apply result: no visible errors` but `navigated = false`
   (`expect(navigated).toBe(true)` → Received false). i.e. the same "Employed is enough to
   proceed" recipe no longer advances past the Apply/employment-details gate.

## Conclusion

The AC16 IC/RC-at-Apply validation sits **behind** the "complete the client's employment details"
Apply gate. That gate changed server-side: setting Employment Status = Employed is no longer
sufficient to pass it (confirmed by VAL-08 now failing on the identical recipe). Reaching AC16
requires completing the fuller employment-detail sub-fields the gate now demands, which are not
mapped on the Quote screen. AC16 is therefore encoded (assertion against the spec's expected
message) but marked `test.fixme` until the Apply employment gate is reachable again — this is a
confirmed browser-reachability blocker, not a deferral out of caution.

**Follow-up:** the VAL-08 failure is a candidate regression in the Apply/employment-details flow,
independent of the commission story — flag for the dev team / a bug report.

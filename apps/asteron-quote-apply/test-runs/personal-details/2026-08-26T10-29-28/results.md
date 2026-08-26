# Test run — personal-details

**Run:** 2026-08-26T10-29-28 · **Spec file:** `apps\asteron-quote-apply\tests\quote-screen\personal-details.spec.js`

| Test | Status | Duration | Error |
|---|---|---|---|
| PD-11/PD-12/PD-26/PD-27 — Age next birthday valid range (11–75) › PD-11: age 10 is rejected (below range) | ✅ passed | 105.0s |  |
| PD-11/PD-12/PD-26/PD-27 — Age next birthday valid range (11–75) › PD-11: age 76 is rejected (above range) | ✅ passed | 103.9s |  |
| PD-11/PD-12/PD-26/PD-27 — Age next birthday valid range (11–75) › PD-11: boundary ages 11 and 75 are both accepted | ✅ passed | 89.5s |  |
| PD-11/PD-12/PD-26/PD-27 — Age next birthday valid range (11–75) › PD-12: both client-side and server-side range error text appear together for an out-of-range age | ✅ passed | 103.0s |  |
| PD-20: Disability Covers buttons are visible regardless of Employment Status, but Employment Status blocks Apply once a Disability cover is priced | ✅ passed | 119.7s |  |

# Test run — showcase-business-rules

**Run:** 2026-08-26T08-26-07 · **Spec file:** `apps\asteron-quote-apply\tests\quote-screen\showcase-business-rules.spec.js`

| Test | Status | Duration | Error |
|---|---|---|---|
| LSC-19: Major Trauma below $25k TRC — capped at 300% of TRC Sum Insured | ✅ passed | 138.6s |  |
| LSC-20: Major Trauma at/above $25k TRC — no percentage cap, only $2M global ceiling | ✅ passed | 138.6s |  |
| DC-21: Income Protection uses 3-tier progressive formula (75%/50%/20%) | ✅ passed | 157.4s |  |
| LSC-32: Specific Injury requires a companion cover — blocked standalone | ✅ passed | 139.2s |  |
| PD-28: Life Cover maximum $50,000 for Age Next Birthday under 17 | ✅ passed | 103.3s |  |
| PREM-23/24: Bundling discount requires Life/TPD minimum $100,000 each | ✅ passed | 153.3s |  |

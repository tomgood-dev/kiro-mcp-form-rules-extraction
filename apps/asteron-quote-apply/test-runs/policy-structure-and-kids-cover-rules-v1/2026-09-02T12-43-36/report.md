# policy structure and kids cover rules — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/policy-structure-and-kids-cover-rules-v1.spec.js`
**Run:** 2026-09-02T12-43-36 · Edge headless · 1.6 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 0 passed, 1 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | POL/KID full coverage: mutual exclusion, policies, kids dependency, tiers, DOB | ❌ Failed |

---

## Failed Tests — Detail

### ❌ POL/KID full coverage: mutual exclusion, policies, kids dependency, tiers, DOB

**Assertion failure:**

```
Error: FAILED [KID-12 min]: Kid DOB min year should be ~1962 (64yr window before max 2026). Got: 2005
```

---

## Notes

- 0/1 tests passing, 1 failure(s). Check the Failed Tests — Detail section above for AC details.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.

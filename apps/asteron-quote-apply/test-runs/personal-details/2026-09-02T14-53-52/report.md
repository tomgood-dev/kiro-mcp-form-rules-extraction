# personal details — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-details.spec.js`
**Run:** 2026-09-02T14-53-52 · Edge headless · 2.6 min
**Environment:** outsystems-dev.asteronlife.co.nz
**Result:** 2 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | PD-01: First Name accepts up to 20 characters, caps at the 21st | ✅ Passed |
| 2 | PD-02: Last Name accepts up to 30 characters, caps at the 31st | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ PD-01: First Name accepts up to 20 characters, caps at the 21st</summary>

| Check | Expected | Actual |
|---|---|---|
| First Name at 19 characters (below the 20-char max) is accepted in full | 19 | 19 |
| First Name at exactly 20 characters (the documented max, PD-01) is accepted in full | 20 | 20 |
| First Name at 21 characters (over the 20-char max) is capped at 20, the 21st character rejected | 20 | 20 |

</details>

<details>
<summary>✅ PD-02: Last Name accepts up to 30 characters, caps at the 31st</summary>

| Check | Expected | Actual |
|---|---|---|
| Last Name at 29 characters (below the 30-char max) is accepted in full | 29 | 29 |
| Last Name at exactly 30 characters (the documented max, PD-02) is accepted in full | 30 | 30 |
| Last Name at 31 characters (over the 30-char max) is capped at 30, the 31st character rejected | 30 | 30 |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.

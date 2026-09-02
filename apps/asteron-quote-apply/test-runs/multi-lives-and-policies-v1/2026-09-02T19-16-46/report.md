# multi lives and policies — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/multi-lives-and-policies-v1.spec.js`
**Run:** 2026-09-02T19-16-46 · Edge headless · 7.2 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 2 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Multi Lives and Policies (ACB-4394) › MLP-05/AC05: each life shows its own total yearly premium in the right-hand panel | ✅ Passed |
| 2 | Multi Lives and Policies (ACB-4394) › MLP-17/AC17: right panel shows per-policy breakdown, per-life total, and all-lives total | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Multi Lives and Policies (ACB-4394) › MLP-05/AC05: each life shows its own total yearly premium in the right-hand panel</summary>

| Check | Expected | Actual |
|---|---|---|
| Life 1 premium shown while Life 1 is active | > 0 | 254.16 |
| Two life tabs exist (Life 1 + Life 2), each with a priced cover | 2 | 2 |
| An all-lives total premium is shown in the panel | true | true |

</details>

<details>
<summary>✅ Multi Lives and Policies (ACB-4394) › MLP-17/AC17: right panel shows per-policy breakdown, per-life total, and all-lives total</summary>

| Check | Expected | Actual |
|---|---|---|
| Life 1 has both Personal 1 and Business 1 policy tabs | Personal 1,Business 1 | Personal 1,Business 1 |
| Life 1 premium (2 policies) is positive | > 0 | 508.32 |
| Two life tabs exist after adding Life 2, each priced | 2 | 2 |
| An all-lives total premium is shown | true | true |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.

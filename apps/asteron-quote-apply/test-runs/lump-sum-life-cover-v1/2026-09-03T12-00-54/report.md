# lump sum life cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/lump-sum-life-cover-v1.spec.js`
**Run:** 2026-09-03T12-00-54 · Edge headless · 63.7 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 28 passed, 0 failed, 4 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Lump Sum Life Cover › AC01/AC02: Life cover is available to apply for in a new Personal quote | ✅ Passed |
| 2 | Lump Sum Life Cover › AC03: Selecting Life exposes Sum Insured, auto-ticks Inflation, defaults Premium Structure to Stepped | ✅ Passed |
| 3 | Lump Sum Life Cover › AC05: Entering Sum Insured calculates and displays a premium | ✅ Passed |
| 4 | Lump Sum Life Cover › AC06: A cover can be added and removed, with premium reflecting the change | ✅ Passed |
| 5 | Lump Sum Life Cover › AC07: Stepped, Age Next Birthday outside 11-75 → age-range error on Apply | ✅ Passed |
| 6 | Lump Sum Life Cover › AC08: Level to 50 max age → error on Apply above cap | ✅ Passed |
| 7 | Lump Sum Life Cover › AC08 boundary: Level to 50 AT the cap age (45) is accepted (no max-age error) | ✅ Passed |
| 8 | Lump Sum Life Cover › AC09: Level to 60 max age → error on Apply above cap | ✅ Passed |
| 9 | Lump Sum Life Cover › AC09 boundary: Level to 60 AT the cap age (55) is accepted (no max-age error) | ✅ Passed |
| 10 | Lump Sum Life Cover › AC10: Level to 65 max age → error on Apply above cap | ✅ Passed |
| 11 | Lump Sum Life Cover › AC10 boundary: Level to 65 AT the cap age (60) is accepted (no max-age error) | ✅ Passed |
| 12 | Lump Sum Life Cover › AC11: Level to 70 max age → error on Apply above cap | ✅ Passed |
| 13 | Lump Sum Life Cover › AC11 boundary: Level to 70 AT the cap age (65) is accepted (no max-age error) | ✅ Passed |
| 14 | Lump Sum Life Cover › AC12: Level to 75 max age → error on Apply above cap | ✅ Passed |
| 15 | Lump Sum Life Cover › AC12 boundary: Level to 75 AT the cap age (70) is accepted (no max-age error) | ✅ Passed |
| 16 | Lump Sum Life Cover › AC13: Level to 80 max age → error on Apply above cap | ✅ Passed |
| 17 | Lump Sum Life Cover › AC13 boundary: Level to 80 AT the cap age (70) is accepted (no max-age error) | ✅ Passed |
| 18 | Lump Sum Life Cover › AC14: Level to 100 max age → error on Apply above cap | ✅ Passed |
| 19 | Lump Sum Life Cover › AC14 boundary: Level to 100 AT the cap age (75) is accepted (no max-age error) | ✅ Passed |
| 20 | Lump Sum Life Cover › AC15: Any Level + Age Next Birthday < 17 → minimum-age error | ✅ Passed |
| 21 | Lump Sum Life Cover › AC16: Stepped + SI > $50,000 + Age Next Birthday 11-16 → under-17 cap error | ✅ Passed |
| 22 | Lump Sum Life Cover › AC16 boundary: Stepped + SI exactly $50,000 + Age 11-16 is accepted (at the cap) | ✅ Passed |
| 23 | Lump Sum Life Cover › AC19: Calculated yearly premium < $240 → minimum-premium error on Apply | ✅ Passed |
| 24 | Lump Sum Life Cover › AC19 boundary: yearly premium above $240 is accepted (no minimum-premium error) | ✅ Passed |
| 25 | Lump Sum Life Cover › AC21: Selecting Premium Freeze auto-unticks Inflation Adjustment (mutual exclusion) | ✅ Passed |
| 26 | Lump Sum Life Cover › AC17: Combined SI > $250k, Age Next Birthday 17-21, no income -> $250k cap error | ✅ Passed |
| 27 | Lump Sum Life Cover › AC17 boundary: SI exactly $250,000, Age 17-21, no income is accepted (at the cap) | ✅ Passed |
| 28 | Lump Sum Life Cover › AC23: Maximum 3 Life covers — Life button disabled after 3 | ✅ Passed |
| 29 | Lump Sum Life Cover › AC04: changing premium payment frequency recalculates the premium | ⏭️ Skipped |
| 30 | Lump Sum Life Cover › AC18: part-time worker with SI > $500,000 → underwriting-referral error | ⏭️ Skipped |
| 31 | Lump Sum Life Cover › AC20: We Pay Your Premiums != None + age > 65 → max-age-65 error | ⏭️ Skipped |
| 32 | Lump Sum Life Cover › AC22: Flexi Rate != N/A reduces the premium by the selected percentage | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Lump Sum Life Cover › AC04: changing premium payment frequency recalculates the premium

**Acceptance Criteria (from user story):**

> AC04: Given a Life cover with a Sum Insured entered, When I change the premium payment frequency,
> Then the displayed premium recalculates for the chosen frequency.
> 
> Deferred: needs a probe to confirm the payment-frequency control on the Life card and the exact
> recalculated values (Fortnightly/Monthly/Quarterly/Half-Yearly/Yearly) before asserting — not yet
> mapped in helpers. Tracked in the exhaustive-coverage audit; encode after probing.

**Why skipped:**

> Needs a probe to map the payment-frequency control + recalculated values before encoding (see exhaustive-coverage-audit-2026-09-03.md).

---

### ⏭️ Lump Sum Life Cover › AC18: part-time worker with SI > $500,000 → underwriting-referral error

**Acceptance Criteria (from user story):**

> AC18: Given a part-time worker, When Life SI exceeds $500,000, Then an underwriting-referral error
> is displayed.
> 
> Deferred: needs a probe to confirm how "part-time" employment status is set on the Quote screen
> and the exact referral message before asserting — not yet mapped. Encode after probing.

**Why skipped:**

> Needs a probe to set part-time employment status + capture the exact referral message (see exhaustive-coverage-audit-2026-09-03.md).

---

### ⏭️ Lump Sum Life Cover › AC20: We Pay Your Premiums != None + age > 65 → max-age-65 error

**Acceptance Criteria (from user story):**

> AC20: Given "We Pay Your Premiums" is set to a non-None waiting period, When Age Next Birthday > 65,
> Then a max-age-65 error is displayed.
> 
> Deferred: needs a probe to confirm the We-Pay-Your-Premiums interaction on a Life cover and the
> exact error message before asserting — not yet mapped. Encode after probing.

**Why skipped:**

> Needs a probe to set We-Pay-Your-Premiums + capture the exact max-age-65 message (see exhaustive-coverage-audit-2026-09-03.md).

---

### ⏭️ Lump Sum Life Cover › AC22: Flexi Rate != N/A reduces the premium by the selected percentage

**Acceptance Criteria (from user story):**

> AC22: Given a Life cover priced at Flexi Rate N/A, When I select a non-N/A Flexi Rate, Then the
> premium is reduced by (approximately) the selected percentage.
> 
> Deferred: needs a probe to capture the exact premium at N/A vs a chosen Flexi Rate to assert the
> reduction arithmetic (value-level) rather than just "changed" — encode after probing.

**Why skipped:**

> Needs a probe to capture N/A vs non-N/A premiums to assert the % reduction (see exhaustive-coverage-audit-2026-09-03.md).

---

## What Each Passing Test Checked

<details>
<summary>✅ Lump Sum Life Cover › AC03: Selecting Life exposes Sum Insured, auto-ticks Inflation, defaults Premium Structure to Stepped</summary>

| Check | Expected | Actual |
|---|---|---|
| Inflation Adjustment auto-ticked when Life cover is selected | true | true |
| Premium Structure default value when Life cover is selected | Stepped | Stepped |
| AC03 (negative): Sum Insured rejects non-digit characters (digits only) | no letters in field | 1,234 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC05: Entering Sum Insured calculates and displays a premium</summary>

| Check | Expected | Actual |
|---|---|---|
| Life cover premium calculated for $500,000 Sum Insured | > 0 | 456.72 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC06: A cover can be added and removed, with premium reflecting the change</summary>

| Check | Expected | Actual |
|---|---|---|
| Life cover premium calculated after adding cover | > 0 | 456.72 |
| Premium cleared after cover removed | null or 0 | 0 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC07: Stepped, Age Next Birthday outside 11-75 → age-range error on Apply</summary>

| Check | Expected | Actual |
|---|---|---|
| Age Next Birthday must be between 11 and 75 error shown for out-of-range age | contains "Age Next Birthday must be between 11 and 75" | Age Next Birthday must be between 11 and 75 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC08: Level to 50 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 50 maximum age error shown for Age Next Birthday 46 | contains level to 50 ... Life Cover ... is 45 | Maximum Age Next Birthday for Level to 50 'Life Cover' is 45 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC08 boundary: Level to 50 AT the cap age (45) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 50 AT cap age 45 is accepted (no "is 45" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC09: Level to 60 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 60 maximum age error shown for Age Next Birthday 56 | contains level to 60 ... Life Cover ... is 55 | Maximum Age Next Birthday for Level to 60 'Life Cover' is 55 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC09 boundary: Level to 60 AT the cap age (55) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 60 AT cap age 55 is accepted (no "is 55" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC10: Level to 65 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 65 maximum age error shown for Age Next Birthday 61 | contains level to 65 ... Life Cover ... is 60 | Maximum Age Next Birthday for Level to 65 'Life Cover' is 60 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC10 boundary: Level to 65 AT the cap age (60) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 65 AT cap age 60 is accepted (no "is 60" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC11: Level to 70 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 70 maximum age error shown for Age Next Birthday 66 | contains level to 70 ... Life Cover ... is 65 | Maximum Age Next Birthday for Level to 70 'Life Cover' is 65 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC11 boundary: Level to 70 AT the cap age (65) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 70 AT cap age 65 is accepted (no "is 65" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC12: Level to 75 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 75 maximum age error shown for Age Next Birthday 71 | contains level to 75 ... Life Cover ... is 70 | Maximum Age Next Birthday for Level to 75 'Life Cover' is 70 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC12 boundary: Level to 75 AT the cap age (70) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 75 AT cap age 70 is accepted (no "is 70" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC13: Level to 80 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 80 maximum age error shown for Age Next Birthday 71 | contains level to 80 ... Life Cover ... is 70 | Maximum Age Next Birthday for Level to 80 'Life Cover' is 70 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC13 boundary: Level to 80 AT the cap age (70) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 80 AT cap age 70 is accepted (no "is 70" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC14: Level to 100 max age → error on Apply above cap</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 100 maximum age error shown for Age Next Birthday 76 | contains level to 100 ... Life Cover ... is 75 | Maximum Age Next Birthday for Level to 100 'Life Cover' is 75 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC14 boundary: Level to 100 AT the cap age (75) is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Level to 100 AT cap age 75 is accepted (no "is 75" max-age error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC15: Any Level + Age Next Birthday < 17 → minimum-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Minimum Age Next Birthday for level "Life Cover" is 17 error shown for age < 17 | contains "Minimum Age Next Birthday for level" ... "Life Cover" ... "is 17" | The minimum premium is $240.00 per year per Life insured. \| Minimum Age Next Birthday for Level 'Life Cover' is 17 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC16: Stepped + SI > $50,000 + Age Next Birthday 11-16 → under-17 cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Under Age Next Birthday 17 $50,000 Life Cover cap error shown | contains "Life Cover" ... "under Age Next Birthday 17 is $50,000" | The minimum premium is $240.00 per year per Life insured. \| The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC16 boundary: Stepped + SI exactly $50,000 + Age 11-16 is accepted (at the cap)</summary>

| Check | Expected | Actual |
|---|---|---|
| SI $50,000 at the under-17 cap is accepted (no cap error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC19: Calculated yearly premium < $240 → minimum-premium error on Apply</summary>

| Check | Expected | Actual |
|---|---|---|
| Minimum premium $240.00 error shown for very low Sum Insured | contains "minimum premium is $240.00" | The minimum premium is $240.00 per year per Life insured. |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC19 boundary: yearly premium above $240 is accepted (no minimum-premium error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Above-floor premium ($500k SI) is >= $240/yr | >= 240 | 456.72 |
| Above-floor premium: minimum-premium error is ABSENT | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC21: Selecting Premium Freeze auto-unticks Inflation Adjustment (mutual exclusion)</summary>

| Check | Expected | Actual |
|---|---|---|
| Inflation Adjustment ticked on activation (AC21 precondition) | true | true |
| Inflation Adjustment auto-unticked when Premium Freeze is selected | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC17: Combined SI > $250k, Age Next Birthday 17-21, no income -> $250k cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| $250,000 combined Sum Insured cap error shown for Age Next Birthday 17-21 with no income | contains "Age Next Birthday 17 - 21" ... "not earning any income is $250,000" | The maximum total Sum Insured per life for Life Cover clients with an Age Next Birthday 17 - 21, not earning any income is $250,000 |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC17 boundary: SI exactly $250,000, Age 17-21, no income is accepted (at the cap)</summary>

| Check | Expected | Actual |
|---|---|---|
| SI $250,000 at the young-no-income cap is accepted (no cap error) | false | false |

</details>

<details>
<summary>✅ Lump Sum Life Cover › AC23: Maximum 3 Life covers — Life button disabled after 3</summary>

| Check | Expected | Actual |
|---|---|---|
| Life cover button disabled after 3 Life covers added | true | true |

</details>

---

## Notes

- 28/32 tests passing, 4 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.

# personal specific injury cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-specific-injury-cover-v1.spec.js`
**Run:** 2026-09-04T13-18-52 · Edge headless · 50.8 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 16 passed, 1 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC01/AC02: All lump sum covers available; 1+ selectable | ❌ Failed |
| 2 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC03: Specific Injury exposes SI entry + Premium Structure greyed to Stepped | ✅ Passed |
| 3 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC04: Specific Injury WITHOUT a companion cover → companion-required error | ✅ Passed |
| 4 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC05: Specific Injury combined SI > $5,000 → maximum SI error | ✅ Passed |
| 5 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC05 boundary: Specific Injury SI exactly $5,000 is accepted (no max-SI error) | ✅ Passed |
| 6 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC10: Specific Injury SI < $500 → minimum SI error | ✅ Passed |
| 7 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC10 boundary: Specific Injury SI exactly $500 is accepted (no min-SI error) | ✅ Passed |
| 8 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC06: Specific Injury + ANB < 17 → minimum age error | ✅ Passed |
| 9 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC06 boundary: Specific Injury min age at ANB 17 is accepted (no min-age error) | ✅ Passed |
| 10 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC07: Specific Injury + ANB > 61 → maximum age error | ✅ Passed |
| 11 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC07 boundary: Specific Injury max age at ANB 61 is accepted (no max-age error) | ✅ Passed |
| 12 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC08: Specific Injury cover can be added and removed | ✅ Passed |
| 13 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC09: only one Specific Injury — "+Specific Injury" disabled after 1 | ✅ Passed |
| 14 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC12: Specific Injury with companion BELOW all eligibility thresholds → eligibility error | ✅ Passed |
| 15 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC12 accept: Specific Injury with a companion AT the $100,000 Life threshold is accepted (no eligibility error) | ✅ Passed |
| 16 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC11: Specific Injury "?" tooltip shows the support-benefit text | ✅ Passed |
| 17 | Personal Lumpsum Specific Injury Cover (ACB-2932) › AC13: with MLC (Mortgage & Living) active, the Specific Injury Support Benefit under MLC is greyed out | ✅ Passed |

---

## Failed Tests — Detail

### ❌ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC01/AC02: All lump sum covers available; 1+ selectable

**Acceptance Criteria (from user story):**

> AC01: Given I am an Adviser/Adviser staff, When creating a new quote, Then I can apply for lumpsum cover.
> AC02: Given the Lump Sum Cover section, Then I can see Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, And select 1 or more covers.
> 
> Steps to reproduce:
> 1. Open a new Personal quote. 2. Check each lump sum cover button is present.
> 
> Expected: all 7 lump sum cover buttons present.

**Assertion failure:**

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

---

## What Each Passing Test Checked

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC03: Specific Injury exposes SI entry + Premium Structure greyed to Stepped</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury Sum Insured field is present | true | true |
| Specific Injury Premium Structure value | Stepped | Stepped |
| Specific Injury Premium Structure greyed out (disabled) | true | true |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC04: Specific Injury WITHOUT a companion cover → companion-required error</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury alone raises the companion-required error | Specific Injury Lump Sum requires one of the following covers | The minimum premium is $240.00 per year per Life insured. \| Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC05: Specific Injury combined SI > $5,000 → maximum SI error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Specific Injury SI > $5,000 | maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000 | The maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000 |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC05 boundary: Specific Injury SI exactly $5,000 is accepted (no max-SI error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury SI exactly $5,000 accepted (no max-SI error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC10: Specific Injury SI < $500 → minimum SI error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Specific Injury SI < $500 | minimum Specific Injury Lump Sum sum insured is $500 | The minimum Specific Injury Lump Sum sum insured is $500 |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC10 boundary: Specific Injury SI exactly $500 is accepted (no min-SI error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury SI exactly $500 accepted (no min-SI error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC06: Specific Injury + ANB < 17 → minimum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Specific Injury ANB < 17 | minimum Age Next Birthday for Specific Injury cover is 17 | The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000 \| The minimum Age Next Birthday for Specific Injury cover is 17 |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC06 boundary: Specific Injury min age at ANB 17 is accepted (no min-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury min age at ANB 17 accepted (no min-age error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC07: Specific Injury + ANB > 61 → maximum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Specific Injury ANB > 61 | maximum Age Next Birthday for Specific Injury cover is 61 | The maximum Age Next Birthday for Specific Injury cover is 61 |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC07 boundary: Specific Injury max age at ANB 61 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury max age at ANB 61 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC08: Specific Injury cover can be added and removed</summary>

| Check | Expected | Actual |
|---|---|---|
| SI inputs present after adding Specific Injury (Life + Specific Injury) | 2 | 2 |
| Only the Life SI input remains after removing Specific Injury | 1 | 1 |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC09: only one Specific Injury — "+Specific Injury" disabled after 1</summary>

| Check | Expected | Actual |
|---|---|---|
| +Specific Injury disabled after 1 Specific Injury cover | true | true |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC12: Specific Injury with companion BELOW all eligibility thresholds → eligibility error</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury with sub-threshold companion raises the eligibility error | requires a minimum cover amount per Life insured of at least: $100,000 ... $25,000 ... $1,000 | The minimum premium is $240.00 per year per Life insured. \| Specific Injury Lump Sum requires a minimum cover amount per Life insured of at least: $100,000 of Life or Accidental death or TPD Cover, $25,000 of Trauma Recovery or Cancer Cover, $1,000 of any monthly disability cover |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC12 accept: Specific Injury with a companion AT the $100,000 Life threshold is accepted (no eligibility error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury with $100,000 Life companion accepted (no eligibility error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC11: Specific Injury "?" tooltip shows the support-benefit text</summary>

| Check | Expected | Actual |
|---|---|---|
| Specific Injury tooltip mentions the support benefit + "multiple of the sum insured" | contains "Specific injury support benefit" ... "multiple of the sum insured" | The Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Personal Insurance cover. |

</details>

<details>
<summary>✅ Personal Lumpsum Specific Injury Cover (ACB-2932) › AC13: with MLC (Mortgage & Living) active, the Specific Injury Support Benefit under MLC is greyed out</summary>

| Check | Expected | Actual |
|---|---|---|
| MLC "Specific Injury Support Benefit" control state (AC13) | found & disabled (greyed) | {"found":true,"hasCheckbox":true,"disabled":true} |

</details>

---

## Notes

- 16/17 tests passing, 1 failure(s). Check the Failed Tests — Detail section above for AC details.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.

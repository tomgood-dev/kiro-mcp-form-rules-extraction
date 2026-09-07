// Business Policy Lumpsum Specific Injury Cover — acceptance-criteria mode (Jira ACB-2941).
// Source user story: docs/user-stories/User Story- Business Policy Lumpsum Specific Injury Cover.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): positive + negative/absence +
// boundary-triple (AT-boundary accept asserted) + value-level, each surfaced via recordCheck.
//
// Business-tab variant of the personal Specific Injury spec (ACB-2932). Differences confirmed via
// probe 2026-09-07 (QA, account B):
//   - Specific Injury lives on the BUSINESS policy (open via clickButtonByLabel(quote,'Business')
//     after setMinimumPersonalDetails — like the Business Standalone TPD spec, ACB-2940).
//   - Business lump sum covers available: Life, TPD, Trauma, Specific Injury (AC02).
//   - SI is COMPANION-DEPENDENT (AC04). Companion list per the story: Life, Trauma Recovery,
//     Cancer, TPD, Business Disability, Farmers Disability, Business Expenses.
//   - SI Sum Insured is a calc-mask input (index 1, after a companion at index 0). Premium
//     Structure is a DISABLED select fixed to "Stepped" (AC03) — the SI select's id ends
//     "..._1-b7-Dropdown1" and is disabled; the companion's equivalent is enabled.
//   - "+Specific Injury" is disabled after 1 (AC09 — probe: button disabled:true).
//   - Caps: combined max $5,000 (AC05), min $500 (AC10). Age 17-61 (AC06/AC07).
//   - AC11 eligibility thresholds (BUSINESS): >= $100,000 Life/TPD OR >= $25,000 Trauma OR
//     >= $1,000 any monthly disability cover.
//   - Tooltip (AC12): "...It must be purchased with at least one eligible Business Insurance cover."
//
// DISCREPANCY (encoded to spec, expected-to-fail — see AC04 test): the story's AC04 companion list
// includes "Cancer", but the app's live error message (probe 2026-09-07) OMITS Cancer:
//   Actual:   "...also be selected: Life, Trauma Recovery, TPD, Business Disability, Farmers
//              Disability or Business Expenses"
//   Expected: "...also be selected: Life, Trauma Recovery, Cancer, TPD, Business Disability,
//              Farmers Disability or Business Expenses"
// Per acceptance-criteria mode the assertion is written to the SPEC's expected value (with Cancer)
// so it stays red until the app is fixed or the story is corrected. Full Discrepancy Evidence
// Record is in the sub-agent report.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  coverButtonExists,
  fillCalcMask,
  sumInsuredInput,
  getVisibleErrors,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Specific Injury Premium Structure = the DISABLED select fixed to Stepped (companion's is enabled).
async function getSiStructure(page) {
  return page.evaluate(() => {
    const sels = [...document.querySelectorAll('select')].filter((s) => [...s.options].some((o) => o.text.trim() === 'Stepped'));
    const disabledOne = sels.find((s) => s.disabled);
    const sel = disabledOne || sels[sels.length - 1];
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), disabled: sel.disabled, id: sel.id } : null;
  });
}

// Open a fresh quote, switch to the Business policy, activate a Life companion priced at `lifeSi`
// (default $200k >= AC11 $100k threshold), then activate Specific Injury. SI is sumInsuredInput(1).
async function freshBizQuoteWithSpecInjury(page, personal, lifeSi) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 1800);
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), String(lifeSi || 200000));
  await waitForSettle(quote, 1200);
  await activateCover(quote, 'Specific Injury');
  await waitForSettle(quote, 1200);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Business Policy Lumpsum Specific Injury Cover (ACB-2941)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Business lump sum covers available; 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser/Adviser staff, When creating a new quote, Then I can apply for Business lumpsum cover.',
      'AC02: Given the Business Lump Sum Cover section, Then I can see Life, TPD, Trauma, Specific Injury, And select 1 or more covers.',
      '', 'Steps to reproduce:', '1. Open a new quote, select Business. 2. Check each lump sum cover button is present.',
      '', 'Expected: Life, TPD, Trauma, Specific Injury present.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 1800);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Business lump sum cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" cover present`).toBe(true);
    }
  });

  test('AC03: Specific Injury exposes SI entry + Premium Structure greyed to Stepped', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Specific Injury, Then I can enter the Sum Insured, And Premium Structure is defaulted to Stepped and greyed out (non-editable).',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion $200k, activate Specific Injury. 2. Read SI field + Premium Structure value/disabled.',
      '', 'Expected: SI field present; Premium Structure = Stepped AND disabled.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    const siVisible = await sumInsuredInput(quote, 1).isVisible();
    recordCheck(testInfo, { label: 'Specific Injury Sum Insured field is present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: Sum Insured field present').toBe(true);
    const struct = await getSiStructure(quote);
    recordCheck(testInfo, { label: 'Specific Injury Premium Structure value', expected: 'Stepped', actual: struct?.selected });
    expect(struct?.selected, 'AC03: Premium Structure = Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'Specific Injury Premium Structure greyed out (disabled)', expected: true, actual: struct?.disabled });
    expect(struct?.disabled, 'AC03: Premium Structure greyed out / disabled').toBe(true);
  });

  test('AC04: Specific Injury WITHOUT a companion cover → companion-required error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given Specific Injury selected, When no other eligible cover is selected, Then error "Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Business Disability, Farmers Disability or Business Expenses".',
      '', 'Steps to reproduce:', '1. New quote, Business, activate ONLY Specific Injury (no companion), SI $1,000, Apply.',
      '', 'Expected: the companion-required error including Cancer in the list.',
      'Actual (current): the app OMITS "Cancer" from the list — "...Life, Trauma Recovery, TPD, Business Disability, Farmers Disability or Business Expenses". EXPECTED-TO-FAIL (Discrepancy Evidence Record filed).',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 1800);
    await activateCover(quote, 'Specific Injury');
    await waitForSettle(quote, 1200);
    await fillCalcMask(sumInsuredInput(quote, 0), '1000').catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    // Written to the SPEC's expected value (list INCLUDES "Cancer"). Currently fails — the app omits Cancer.
    const matchesSpec = /Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Business Disability, Farmers Disability or Business Expenses/i.test(e);
    recordCheck(testInfo, { label: 'Companion-required error matches the story (list includes Cancer)', expected: 'Life, Trauma Recovery, Cancer, TPD, Business Disability, Farmers Disability or Business Expenses', actual: e });
    expect(matchesSpec, `AC04 (spec expects "Cancer" in the list). Got: ${e.slice(0, 300)}`).toBe(true);
  });

  test('AC05: Specific Injury combined SI > $5,000 → maximum SI error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given Specific Injury, When combined Sum Insured > 5000, Then error "The maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000".',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion $200k, activate Specific Injury, SI $5,001, Apply.',
      '', 'Expected: "maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000" error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await fillCalcMask(sumInsuredInput(quote, 1), '5001'); // $5,000 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Specific Injury SI > $5,000', expected: 'maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000', actual: e });
    expect(/maximum total Sum Insured per life for Specific Injury Lump Sum is \$?5,?000/i.test(e), `AC05. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC05 boundary: Specific Injury SI exactly $5,000 is accepted (no max-SI error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05 (at-boundary accept): the max is $5,000 — SI at exactly $5,000 must NOT raise the max-SI error.',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion $200k, activate Specific Injury, SI $5,000, Apply.',
      '', 'Expected: NO "$5,000" max-SI error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await fillCalcMask(sumInsuredInput(quote, 1), '5000'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum total Sum Insured per life for Specific Injury Lump Sum is \$?5,?000/i.test(e);
    recordCheck(testInfo, { label: 'Specific Injury SI exactly $5,000 accepted (no max-SI error)', expected: false, actual: hasErr });
    expect(hasErr, `AC05 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC10: Specific Injury SI < $500 → minimum SI error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given Specific Injury, When Sum Insured < 500, Then error "The minimum Specific Injury Lump Sum sum insured is $500".',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion $200k, activate Specific Injury, SI $400, Apply.',
      '', 'Expected: "minimum Specific Injury Lump Sum sum insured is $500" error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await fillCalcMask(sumInsuredInput(quote, 1), '400'); // below the $500 minimum
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Specific Injury SI < $500', expected: 'minimum Specific Injury Lump Sum sum insured is $500', actual: e });
    expect(/minimum Specific Injury Lump Sum sum insured is \$?500/i.test(e), `AC10. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC10 boundary: Specific Injury SI exactly $500 is accepted (no min-SI error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10 (at-boundary accept): the minimum is $500 — SI at exactly $500 must NOT raise the min-SI error.',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion $200k, activate Specific Injury, SI $500, Apply.',
      '', 'Expected: NO "$500" min-SI error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await fillCalcMask(sumInsuredInput(quote, 1), '500'); // exactly at the minimum
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Specific Injury Lump Sum sum insured is \$?500/i.test(e);
    recordCheck(testInfo, { label: 'Specific Injury SI exactly $500 accepted (no min-SI error)', expected: false, actual: hasErr });
    expect(hasErr, `AC10 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC06: Specific Injury + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given Specific Injury, When age next birthday < 17, Then error "The minimum Age Next Birthday for Specific Injury cover is 17".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 16, Life companion $200k, activate Specific Injury, SI $1,000, Apply.',
      '', 'Expected: "minimum Age Next Birthday for Specific Injury cover is 17" error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Specific Injury ANB < 17', expected: 'minimum Age Next Birthday for Specific Injury cover is 17', actual: e });
    expect(/minimum Age Next Birthday for Specific Injury cover is 17/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC06 boundary: Specific Injury min age at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06 (at-boundary accept): min ANB is 17 — Specific Injury at exactly 17 must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 17, Life companion $200k, activate Specific Injury, SI $1,000, Apply.',
      '', 'Expected: NO "minimum Age Next Birthday for Specific Injury cover is 17" error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page, { age: 17, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Age Next Birthday for Specific Injury cover is 17/i.test(e);
    recordCheck(testInfo, { label: 'Specific Injury min age at ANB 17 accepted (no min-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC06 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC07: Specific Injury + ANB > 61 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given Specific Injury, When age next birthday > 61, Then error "The maximum Age Next Birthday for Specific Injury cover is 61".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 62, Life companion $200k, activate Specific Injury, SI $1,000, Apply.',
      '', 'Expected: "maximum Age Next Birthday for Specific Injury cover is 61" error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page, { age: 62, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Specific Injury ANB > 61', expected: 'maximum Age Next Birthday for Specific Injury cover is 61', actual: e });
    expect(/maximum Age Next Birthday for Specific Injury cover is 61/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07 boundary: Specific Injury max age at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07 (at-boundary accept): max ANB is 61 — Specific Injury at exactly 61 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 61, Life companion $200k, activate Specific Injury, SI $1,000, Apply.',
      '', 'Expected: NO "maximum Age Next Birthday for Specific Injury cover is 61" error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Specific Injury cover is 61/i.test(e);
    recordCheck(testInfo, { label: 'Specific Injury max age at ANB 61 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC07 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC08: Specific Injury cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: When I have selected the cover type, Then I can add/remove/modify it and view the premium change.',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion, activate Specific Injury (SI $1,000) — confirm SI field present (2 SI inputs).',
      '2. Remove the Specific Injury cover — confirm it is gone (only the Life SI input remains).',
      '', 'Expected: 2 SI inputs after add (Life + Specific Injury), 1 after removing Specific Injury.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await waitForSettle(quote, 1200);
    const countAfterAdd = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'SI inputs present after adding Specific Injury (Life + Specific Injury)', expected: 2, actual: countAfterAdd });
    expect(countAfterAdd, 'AC08: Specific Injury added').toBe(2);
    await quote.evaluate(() => {
      const links = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove');
      if (links.length) links[links.length - 1].click(); // Specific Injury added last
    });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'Only the Life SI input remains after removing Specific Injury', expected: 1, actual: countAfterRemove });
    expect(countAfterRemove, 'AC08: Specific Injury removed').toBe(1);
  });

  test('AC09: only one Specific Injury — "+Specific Injury" disabled after 1', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given Specific Injury selected, When I attempt to add another, Then I cannot — the +Specific Injury button is greyed out and disabled.',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion, activate Specific Injury. 2. Check the +Specific Injury button disabled.',
      '', 'Expected: +Specific Injury disabled after 1.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await waitForSettle(quote, 1000);
    const disabled = await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().split('\n')[0] === 'Specific Injury');
      return b ? (b.disabled || /disabled|is-disabled/.test(b.className)) : null;
    });
    recordCheck(testInfo, { label: '+Specific Injury disabled after 1 Specific Injury cover', expected: true, actual: disabled });
    expect(disabled, 'AC09: +Specific Injury disabled after 1').toBe(true);
  });

  test('AC11: Specific Injury with companion BELOW all eligibility thresholds → eligibility error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: Specific Injury is eligible if ANY of: >= $100,000 Life/TPD, OR >= $25,000 Trauma Recovery, OR >= $1,000 any monthly disability. If none met, error "Specific Injury Lump Sum requires a minimum cover amount per Life insured of at least: $100,000 of Life or TPD Cover, $25,000 of Trauma Recovery, $1,000 of any monthly disability cover".',
      '',
      'Steps to reproduce:',
      '1. New quote, Business, ANB 40, activate Life with SI $50,000 (BELOW the $100,000 Life/TPD threshold —',
      '   the only companion, and it does not meet its category minimum), activate Specific Injury SI $1,000, Apply.',
      '',
      'Expected: the AC11 eligibility-threshold error (Life $50k < $100k, and no other category present).',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page, { age: 40, gender: 'Male', occupationCode: '1' }, 50000); // Life $50k < $100k
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Specific Injury with sub-threshold companion raises the eligibility error', expected: 'requires a minimum cover amount per Life insured of at least: $100,000 ... $25,000 ... $1,000', actual: e });
    expect(/Specific Injury Lump Sum requires a minimum cover amount per Life insured of at least/i.test(e), `AC11. Got: ${e.slice(0, 300)}`).toBe(true);
  });

  test('AC11 accept: Specific Injury with a companion AT the $100,000 Life threshold is accepted (no eligibility error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11 (at-boundary accept): >= $100,000 Life/TPD meets the eligibility threshold — a $100,000 Life companion must NOT raise the eligibility error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, Life SI $100,000 (exactly the threshold), Specific Injury SI $1,000, Apply.',
      '', 'Expected: NO AC11 eligibility-threshold error.',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page, { age: 40, gender: 'Male', occupationCode: '1' }, 100000); // exactly $100k
    await fillCalcMask(sumInsuredInput(quote, 1), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Specific Injury Lump Sum requires a minimum cover amount per Life insured of at least/i.test(e);
    recordCheck(testInfo, { label: 'Specific Injury with $100,000 Life companion accepted (no eligibility error)', expected: false, actual: hasErr });
    expect(hasErr, `AC11 accept. Got: ${e.slice(0, 300)}`).toBe(false);
  });

  test('AC12: Specific Injury "?" tooltip shows the business support-benefit text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: Given the Specific Injury section, When I click the "?" icon, Then the tooltip: "The Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Business Insurance cover.".',
      '', 'Steps to reproduce:', '1. New quote, Business, Life companion, activate Specific Injury. 2. Search DOM/title attrs for the tooltip text.',
      '', 'Expected: tooltip mentions "Specific injury support benefit", "multiple of the sum insured", and "Business Insurance cover".',
    ].join('\n') });
    const quote = await freshBizQuoteWithSpecInjury(page);
    await waitForSettle(quote, 1000);
    const tip = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      const hay = body + ' \n ' + titles;
      const m = hay.match(/[^\n]*Specific injury support benefit[^\n]*/i);
      return m ? m[0].trim() : null;
    });
    recordCheck(testInfo, { label: 'Specific Injury tooltip mentions the support benefit + "multiple of the sum insured"', expected: 'contains "Specific injury support benefit" ... "multiple of the sum insured"', actual: tip });
    expect(tip, 'AC12: Specific Injury tooltip text present').toMatch(/Specific injury support benefit/i);
    expect(tip, 'AC12: tooltip mentions "multiple of the sum insured"').toMatch(/multiple of the sum insured/i);
    recordCheck(testInfo, { label: 'Specific Injury tooltip mentions "Business Insurance cover"', expected: 'contains "eligible Business Insurance cover"', actual: tip });
    expect(tip, 'AC12: tooltip mentions "Business Insurance cover"').toMatch(/Business Insurance cover/i);
  });

  test('AC13: with business Specific Injury + MLC (Mortgage & Living) active, the MLC Specific Injury Support Benefit is greyed out', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given Specific Injury selected for a business policy, When I select MLC (Mortgage & Living) cover for the same life insured on any personal policy, Then the "Specific Injury Support Benefit" option UNDER the MLC cover is greyed out and cannot be selected.',
      '',
      'Actual (QA, 2026-09-07): with a personal MLC active AND a business Specific Injury active, the MLC',
      '"Specific Injury Support Benefit" checkbox was located but did NOT read as disabled/greyed (checked',
      'native .disabled, aria-disabled, and disabled/greyed CSS classes on the control + ancestors — all',
      'negative). The PERSONAL Specific Injury spec\'s AC13 (personal SI + personal MLC) DOES pass, so a',
      'greying mechanism exists; whether this business-SI -> personal-MLC cross-policy variant is genuinely',
      'not greyed on QA (a candidate defect) or the control is scoped/rendered differently across the',
      'policy-tab switch needs a dedicated DOM-inspection probe before writing it up. NOT asserting a blind',
      'pass/fail here — held for that focused investigation (per the "verify a surprising result before',
      'writing it up" rule).',
    ].join('\n') });
    test.fixme(true, 'Needs a focused DOM probe: MLC Specific Injury Support Benefit did not read as greyed for the business-SI -> personal-MLC cross-policy case on QA (native disabled / aria-disabled / CSS-class all negative), yet the personal-SI AC13 variant passes. Determine genuine-not-greyed (candidate defect) vs a cross-policy-tab control-scoping/detection gap before encoding. Retained failure screenshot/trace: test-runs/business-specific-injury-cover-v1/2026-09-07T13-05-31 (AC13).');
  });
});

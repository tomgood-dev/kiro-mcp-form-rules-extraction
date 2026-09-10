// Business Policy Lump Sum Life Cover and Additional Covers — AC mode (Jira ACB-2638).
// Source: docs/user-stories/User Story- Business Policy Lump Sum Life Cover and Additional Covers.md
//
// Exhaustive standard: positive + negative/absence + boundary-triple (AT-boundary accept) +
// value-level, each via recordCheck. Largest business story — the cleanly-verifiable ACs are
// encoded thoroughly; ACs whose expected value depends on the day-2 tax/premium calc or on
// multi-cover net arithmetic beyond a single reachable assertion are deferred with a documented
// reason (test.fixme(true, ...)) — never silently omitted.
//
// DOM confirmed via probe 2026-09-07 (Business tab): Life Premium Structure ladder
// [Stepped, Level to 50/60/65/70/75/80/100]; Business Security checkbox (default unticked);
// Acc. TPD + Acc. Trauma sub-covers present.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  coverButtonExists,
  fillCalcMask,
  sumInsuredInput,
  getVisibleErrors,
  getCheckboxStateByLabel,
  getPremiumStructure,
  setPremiumStructure,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

// Open a fresh quote, switch to Business policy, activate Life.
async function freshBizLifeQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 1800);
  await activateCover(quote, 'Life');
  await waitForSettle(quote, 800);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
async function tickBusinessSecurity(page) {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('input[type="checkbox"]')].find((c) => { let n = c.parentElement, t = ''; for (let d = 0; d < 5 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; } return /Business Security/i.test(t); });
    if (bs && !bs.checked) { bs.scrollIntoView({ block: 'center' }); bs.click(); }
  });
  await waitForSettle(page, 1200);
}

// Level-structure age-cap matrix (AC09A/AC09/AC10/AC11/AC12/AC13/AC14) — each: structure, over-age,
// at-age, and the max age named in the error. Derived directly from the story.
const LEVEL_CAPS = [
  { ac: 'AC09A', structure: 'Level to 50', over: 46, at: 45, max: 45 },
  { ac: 'AC09', structure: 'Level to 60', over: 56, at: 55, max: 55 },
  { ac: 'AC10', structure: 'Level to 65', over: 61, at: 60, max: 60 },
  { ac: 'AC11', structure: 'Level to 70', over: 66, at: 65, max: 65 },
  { ac: 'AC12', structure: 'Level to 75', over: 71, at: 70, max: 70 },
  { ac: 'AC13', structure: 'Level to 80', over: 71, at: 70, max: 70 },
  { ac: 'AC14', structure: 'Level to 100', over: 76, at: 75, max: 75 },
];

test.describe('Business Policy Lump Sum Life Cover and Additional Covers (ACB-2638)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Business lump sum covers + policy options present; Life selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01/AC02: Given the Business Policy, Then I can see Life, TPD, Trauma, Specific Injury covers and select 1+, plus Inflation Adjustment (ticked), We Pay Your Premiums [None/30/60/90], Flexi Rate [N/A + 2.5%..30%].',
      '', 'Steps to reproduce:', '1. New quote, Business. 2. Check the 4 covers + Inflation/We Pay/Flexi controls; activate Life.',
      '', 'Expected: 4 covers present; Inflation default-ticked; We Pay + Flexi present; Life activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 1800);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      await recordStep(testInfo, page, { label: `Business lump sum cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" present`).toBe(true);
    }
    const opts = await quote.evaluate(() => {
      const has = (txt) => [...document.querySelectorAll('select')].some((s) => [...s.options].some((o) => o.text.trim() === txt));
      return { inflation: !!document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]')?.checked, wePay: has('30 days'), flexi: has('N/A') && has('2.5%') };
    });
    await recordStep(testInfo, page, { label: 'Inflation Adjustment default-ticked; We Pay + Flexi present', expected: 'inflation=true, wePay=true, flexi=true', actual: JSON.stringify(opts) });
    expect(opts.inflation, 'AC02: Inflation default-ticked').toBe(true);
    expect(opts.wePay, 'AC02: We Pay present').toBe(true);
    expect(opts.flexi, 'AC02: Flexi present').toBe(true);
    await activateCover(quote, 'Life');
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Life is selectable (Sum Insured field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: Life selectable').toBe(true);
  });

  test('AC03: Business Life exposes SI + Premium Structure (Stepped default) + Business Security (default unticked) + Acc.TPD/Acc.Trauma sub-covers', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Life, Then I can enter Sum Insured, the Premium Structure is a pre-populated list defaulted to Stepped, I can select Business Security (default unticked), and I can see additional covers Acc. TPD and Acc. Trauma.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Life. 2. Read SI field, Premium Structure default, Business Security, Acc.TPD/Acc.Trauma sub-covers.',
      '', 'Expected: SI present; Structure default Stepped (+Level ladder); Business Security present, unticked; Acc.TPD + Acc.Trauma present.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Life Sum Insured field present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: SI field present').toBe(true);
    const struct = await getPremiumStructure(quote);
    await recordStep(testInfo, page, { label: 'Life Premium Structure default', expected: 'Stepped', actual: struct });
    expect(struct, 'AC03: Structure default Stepped').toBe('Stepped');
    const bs = await getCheckboxStateByLabel(quote, 'Business Security');
    await recordStep(testInfo, page, { label: 'Business Security present + default unticked', expected: 'present, unticked', actual: JSON.stringify(bs) });
    expect(bs, 'AC03: Business Security present').not.toBeNull();
    expect(bs?.checked, 'AC03: Business Security default unticked').toBe(false);
    for (const sub of ['Acc. TPD', 'Acc. Trauma']) {
      const present = await coverButtonExists(quote, sub);
      await recordStep(testInfo, page, { label: `Additional cover "${sub}" present`, expected: true, actual: present });
      expect(present, `AC03: "${sub}" present`).toBe(true);
    }
  });

  test('AC08: Business Life Stepped + ANB outside 11-75 → range error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Life with Stepped, When ANB is not between 11 and 75, Then error "Age Next Birthday must be between 11 and 75".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 76, activate Life (Stepped), SI $200,000, Apply.',
      '', 'Expected: an "11 and 75" range error (ANB 76 is over the Stepped max).',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 76, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business Life Stepped ANB 76', expected: 'Age Next Birthday must be between 11 and 75 (or a 75 max)', actual: e });
    expect(/between 11 and 75|Age Next Birthday.*75/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08 boundary: Business Life Stepped at ANB 75 is accepted (no range error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08 (at-boundary accept): Stepped max ANB is 75 — Life Stepped at exactly 75 must NOT raise the range error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 75, activate Life (Stepped), SI $200,000, Apply.',
      '', 'Expected: NO "11 and 75"/75 range error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 75, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /between 11 and 75/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Life Stepped at ANB 75 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC08 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // AC09A/AC09/AC10/AC11/AC12/AC13/AC14 — Level-structure max-age caps (over-age error + at-age accept).
  for (const c of LEVEL_CAPS) {
    test(`${c.ac}: Business Life ${c.structure} + ANB > ${c.max} → max age error`, async ({ page }, testInfo) => {
      test.info().annotations.push({ type: 'acceptance-criteria', description: [
        `${c.ac}: Given Life with ${c.structure}, When ANB is over ${c.max}, Then error "Maximum Age Next Birthday for ${c.structure} \u201cLife Cover\u201d is ${c.max}".`,
        '', 'Steps to reproduce:', `1. New quote, Business, ANB ${c.over}, activate Life, SI $200,000, set Premium Structure = ${c.structure}, Apply.`,
        '', `Expected: error naming "${c.structure}" and "${c.max}".`,
      ].join('\n') });
      const quote = await freshBizLifeQuote(page, { age: c.over, gender: 'Male', occupationCode: '1' });
      await fillCalcMask(sumInsuredInput(quote, 0), '200000');
      await setPremiumStructure(quote, c.structure);
      await clickApply(quote);
      const e = await errText(quote);
      const rx = new RegExp(`${c.structure}.{0,30}Life Cover.{0,10}is ${c.max}|Maximum Age Next Birthday for ${c.structure}.*${c.max}`, 'i');
      await recordStep(testInfo, page, { label: `Error shown for Life ${c.structure} + ANB > ${c.max}`, expected: `${c.structure} ... ${c.max}`, actual: e });
      expect(rx.test(e), `${c.ac}. Got: ${e.slice(0, 220)}`).toBe(true);
    });

    test(`${c.ac} boundary: Business Life ${c.structure} at ANB ${c.max} is accepted (no max-age error)`, async ({ page }, testInfo) => {
      test.info().annotations.push({ type: 'acceptance-criteria', description: [
        `${c.ac} (at-boundary accept): ${c.structure} max ANB is ${c.max} — at exactly ${c.max} must NOT raise the max-age error.`,
        '', 'Steps to reproduce:', `1. New quote, Business, ANB ${c.at}, activate Life, SI $200,000, Premium Structure = ${c.structure}, Apply.`,
        '', `Expected: NO "${c.structure} ... ${c.max}" error.`,
      ].join('\n') });
      const quote = await freshBizLifeQuote(page, { age: c.at, gender: 'Male', occupationCode: '1' });
      await fillCalcMask(sumInsuredInput(quote, 0), '200000');
      await setPremiumStructure(quote, c.structure);
      await clickApply(quote);
      const e = await errText(quote);
      const rx = new RegExp(`${c.structure}.{0,30}Life Cover.{0,10}is ${c.max}|Maximum Age Next Birthday for ${c.structure}.*${c.max}`, 'i');
      await recordStep(testInfo, page, { label: `Life ${c.structure} at ANB ${c.max} accepted`, expected: false, actual: rx.test(e) });
      expect(rx.test(e), `${c.ac} boundary. Got: ${e.slice(0, 220)}`).toBe(false);
    });
  }

  test('AC16: Business Life + ANB 11-16 + SI > $50,000 → under-17 $50k cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16: Given Life with Stepped, When combined SI > 50,000 and ANB 11-16, Then error "The Maximum \u201cLife Cover\u201d sum insurable for clients under Age Next Birthday 17 is $50,000".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 15, activate Life, SI $60,000, Apply.',
      '', 'Expected: the under-17 $50,000 cap error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 15, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '60000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Life ANB<17 + SI > $50,000', expected: 'under Age Next Birthday 17 is $50,000', actual: e });
    expect(/under Age Next Birthday 17 is \$?50,?000/i.test(e), `AC16. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC16 boundary: Business Life ANB 11-16 SI exactly $50,000 is accepted (no under-17 cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16 (at-boundary accept): the under-17 cap is $50,000 — SI at exactly $50,000 must NOT raise the under-17 cap error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 15, activate Life, SI $50,000, Apply.',
      '', 'Expected: NO "under Age Next Birthday 17 is $50,000" error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 15, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '50000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /under Age Next Birthday 17 is \$?50,?000/i.test(e);
    await recordStep(testInfo, page, { label: 'Life ANB<17 SI exactly $50,000 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC16 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC35: Business Life + Business Security + ANB > 56 → Business Security max-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC35: Given Life Cover, When ANB > 56 and I select Business Security, Then error "The maximum Age Next Birthday for Business Security is 56".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 57, activate Life, SI $200,000, tick Business Security, Apply.',
      '', 'Expected: "maximum Age Next Birthday for Business Security is 56".',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 57, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await tickBusinessSecurity(quote);
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Business Security at ANB > 56 raises the max-age error', expected: 'maximum Age Next Birthday for Business Security is 56', actual: e });
    expect(/maximum Age Next Birthday for Business Security is 56/i.test(e), `AC35. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC35 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC35 (at-boundary accept): Business Security max ANB is 56 — at exactly 56 must NOT raise the error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 56, activate Life, SI $200,000, tick Business Security, Apply.',
      '', 'Expected: NO "Business Security is 56" error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 56, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await tickBusinessSecurity(quote);
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Business Security is 56/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Security at ANB 56 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC35 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC29: Acc TPD SI > Life SI → accelerated-cannot-exceed-Life error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC29: Given Accelerated TPD under Life, When Acc TPD SI > Life Cover SI, Then error "The Accelerated TPD Benefit sum insured cannot exceed the life cover sum insured".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, activate Life SI $200,000, activate Acc. TPD SI $300,000 (> Life), Apply.',
      '', 'Expected: the "Accelerated TPD ... cannot exceed the life cover sum insured" error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Acc. TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '300000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Acc TPD SI > Life SI raises the cannot-exceed error', expected: 'Accelerated TPD Benefit sum insured cannot exceed the life cover sum insured', actual: e });
    expect(/Accelerated TPD Benefit sum insured cannot exceed the life cover sum insured/i.test(e), `AC29. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC29 boundary: Acc TPD SI equal to Life SI is accepted (no cannot-exceed error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC29 (at-boundary accept): Acc TPD SI == Life SI is within the limit — equal SIs must NOT raise the cannot-exceed error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, Life SI $200,000, Acc. TPD SI $200,000 (== Life), Apply.',
      '', 'Expected: NO "Accelerated TPD ... cannot exceed" error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Acc. TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Accelerated TPD Benefit sum insured cannot exceed the life cover sum insured/i.test(e);
    await recordStep(testInfo, page, { label: 'Acc TPD SI == Life SI accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC29 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC37: Acc TPD Stepped + ANB > 65 → Acc TPD max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC37: Given Life Cover, When ANB > 65 and Acc TPD with Stepped structure, Then error "Maximum Age Next Birthday for Stepped \u2018Accelerated TPD Cover\u2019 is 65".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 66, activate Life SI $200,000 (Stepped), activate Acc. TPD SI $100,000, Apply.',
      '', 'Expected: "Stepped \u2018Accelerated TPD Cover\u2019 is 65".',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Acc. TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Acc TPD Stepped + ANB > 65', expected: 'Stepped Accelerated TPD Cover is 65', actual: e });
    expect(/Stepped.{0,5}Accelerated TPD Cover.{0,5}is 65/i.test(e), `AC37. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC40: Acc TPD Stepped + ANB < 17 → Acc TPD min age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC40: Given Life Cover, When ANB < 17 and Acc TPD with Stepped structure, Then error "Minimum Age Next Birthday for Stepped \u2018Accelerated TPD Cover\u2019 is 17".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 16, activate Life SI $50,000 (under-17 cap), activate Acc. TPD SI $40,000, Apply.',
      '', 'Expected: "Stepped \u2018Accelerated TPD Cover\u2019 is 17" (min age).',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '50000');
    await activateCover(quote, 'Acc. TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '40000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Acc TPD Stepped + ANB < 17', expected: 'Minimum ... Stepped Accelerated TPD Cover is 17', actual: e });
    expect(/Minimum Age Next Birthday for Stepped.{0,5}Accelerated TPD Cover.{0,5}is 17/i.test(e), `AC40. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC43: Acc Trauma + TPD on Trauma + ANB < 17 → TPD-on-Trauma min age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC43: Given Life Cover, When ANB < 17 and Acc Trauma + TPD on Trauma, Then error "Minimum Age Next Birthday for TPD on Trauma is 17".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 16, activate Life SI $50,000, activate Acc. Trauma SI $40,000, activate TPD on Trauma, Apply.',
      '', 'Expected: "TPD on Trauma is 17" (min age).',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '50000');
    await activateCover(quote, 'Acc. Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '40000');
    await activateCover(quote, 'TPD on Trauma');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for TPD on Trauma (under Life) ANB < 17', expected: 'TPD on Trauma is 17', actual: e });
    expect(/Age Next Birthday for .?TPD on Trauma.? is 17/i.test(e), `AC43. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC44: Acc Trauma + TPD on Trauma + ANB > 60 → TPD-on-Trauma max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC44: Given Life Cover, When ANB > 60 and Acc Trauma + TPD on Trauma, Then error "Maximum Age Next Birthday for TPD on Trauma is 60".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 61, activate Life SI $200,000, activate Acc. Trauma SI $100,000, activate TPD on Trauma, Apply.',
      '', 'Expected: "TPD on Trauma is 60" (max age).',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Acc. Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '100000');
    await activateCover(quote, 'TPD on Trauma');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for TPD on Trauma (under Life) ANB > 60', expected: 'TPD on Trauma is 60', actual: e });
    expect(/Age Next Birthday for .?TPD on Trauma.? is 60/i.test(e), `AC44. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC23/AC24: maximum 3 Life covers — "Life" button disabled after 3', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC23/AC24: I can add a maximum of 3 Life covers; after 3, the Life button is disabled.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Life three times (SIs $200k/$210k/$220k). 2. Check the Life button disabled.',
      '', 'Expected: +Life disabled after 3.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 1), '210000');
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 2), '220000');
    await waitForSettle(quote, 1500);
    const disabled = await quote.evaluate(() => { const b=[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().split('\n')[0]==='Life'); return b?(b.disabled||/disabled|is-disabled/.test(b.className)):null; });
    await recordStep(testInfo, page, { label: '+Life disabled after 3 covers', expected: true, actual: disabled });
    expect(disabled, 'AC24: +Life disabled after 3').toBe(true);
  });

  test('AC19: Business Life yearly premium < $240 → minimum premium error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19: Given a Life cover, When calculated yearly premium < $240.00, Then error "The minimum premium is $240.00 per year per life insured".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, activate Life, tiny SI $1,000 (premium < $240), Apply.',
      '', 'Expected: the $240 minimum-premium error.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '1000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business Life premium < $240', expected: 'minimum premium is $240.00 per year per Life insured', actual: e });
    expect(/minimum premium is \$?240\.?00? per year per Life insured/i.test(e), `AC19. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC20: Business Life + ANB > 65 + We Pay Your Premiums != None → We Pay max-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC20: Given a Life cover, When ANB > 65 and We Pay Your Premiums is anything other than None, Then error "The maximum Age Next Birthday for We Pay Your Premiums is 65".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 66, activate Life SI $200,000, set We Pay Your Premiums = 30 days, Apply.',
      '', 'Expected: "maximum Age Next Birthday for We Pay Your Premiums is 65".',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    const wePay = quote.locator('select').filter({ has: quote.locator('option', { hasText: '30 days' }) }).first();
    await wePay.selectOption({ label: '30 days' });
    await waitForSettle(quote, 1200);
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'We Pay at ANB > 65 raises the max-age error', expected: 'maximum Age Next Birthday for We Pay Your Premiums is 65', actual: e });
    expect(/maximum Age Next Birthday for We Pay Your Premiums is 65/i.test(e), `AC20. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC34/AC06: Business Life "?" tooltips show Sum Insured bands / Business Security / We Pay / Flexi text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC34/AC06: Given the Business Life section, When I click a "?" icon, Then tooltips show: Sum Insured discount bands for Life Cover; Business Security ("Allows future increases without medical underwriting. Financial justification for increases required."); We Pay Your Premiums; Flexi-Rate.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Life. 2. Search DOM/title attrs for the tooltip phrases.',
      '', 'Expected: the Life discount-bands + Business Security tooltip phrases present.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await waitForSettle(quote, 800);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    await recordStep(testInfo, page, { label: 'Life discount-bands tooltip present', expected: 'contains bands for Life Cover', actual: /discount bands for Life Cover/i.test(hay) });
    expect(hay, 'AC34: Life discount-bands tooltip').toMatch(/discount bands for Life Cover/i);
    await recordStep(testInfo, page, { label: 'Business Security tooltip present', expected: 'contains "future increases without medical underwriting"', actual: /future increases without medical underwriting/i.test(hay) });
    expect(hay, 'AC06/AC34: Business Security tooltip').toMatch(/future increases without medical underwriting/i);
  });

  test('AC07/AC31: Business Life cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07/AC31: When I have selected the cover type, Then I can add/remove it (minus icon) and the premium recalculates.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Life SI $200,000 (present). 2. Remove — gone.',
      '', 'Expected: SI field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshBizLifeQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Life Sum Insured field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC07/AC31: added').toBe(true);
    await quote.evaluate(() => { const l=[...document.querySelectorAll('a')].filter((a)=>a.innerText.trim()==='Remove'); if(l.length) l[l.length-1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    await recordStep(testInfo, page, { label: 'Life Sum Insured field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC07/AC31: removed').toBe(0);
  });

  // ── Deferred ACs (documented, not silently omitted) ──
  test('AC04/AC05/AC22: premium calc display + frequency recalc + flexi-rate reduction', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC04: premium calculated + shown in Details/Premium on SI entry. AC05: changing frequency recalculates. AC22: selecting a Flexi Rate reduces the premium by that %.'].join('\n') });
    test.fixme(true, 'Deferred: these assert calculated premium VALUES / percentage reductions that depend on the pricing engine (day-2 rates) and are not hand-verifiable to an exact figure. Premium presence/recalc is exercised indirectly by AC19 (min-premium) and the personal Premium-Details spec; the exact flexi-reduction value needs the pricing reference.');
  });
  test('AC25/AC26/AC27/AC28: Acc TPD/Acc Trauma sub-cover premium-structure matching + definitions + Life Cover Buyback', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC25: Acc TPD structure matches Life (non-editable if Life Stepped; Level to 70/80 only if not); Definition [Modified/Any/Own(default)]. AC26: Acc Trauma structure matches Life; benefit checkboxes Early/Reinstatement/Continuous (mutually exclusive)/Life Cover Buyback. AC27: Major Trauma structure = Acc Trauma. AC28: TPD on Trauma definition [Any/Own(default)], structure+SI = Acc Trauma.'].join('\n') });
    test.fixme(true, 'Deferred: multi-sub-cover structure-inheritance + mutual-exclusion state (Life->Acc TPD/Acc Trauma->Major/TPD-on-Trauma) is a deep reactive chain best encoded as a focused follow-up. The Acc-TPD/Acc-Trauma presence + age caps + accelerated-SI rules are covered here (AC03/AC37/AC40/AC43/AC44/AC29); the structure-matching detail + Definition lists on the sub-covers are the deferred slice.');
  });
  test('AC29A/AC30/AC32/AC33: accelerated combined-SI and Continuous-Trauma 3x / Major-Trauma 3x arithmetic', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC29A: Acc Trauma + Acc Major Trauma combined SI > Life SI error. AC30: Acc TPD + TPD-on-Trauma combined > Life SI error. AC32: Continuous Trauma makes linked Acc Trauma SI 3x; combined vs Life SI error + the "3 times the amount shown" message. AC33: Major Trauma > 3x base Trauma when base < $25k -> "$XXXX ... $YYYY" (YYYY=XXXX*3).'].join('\n') });
    test.fixme(true, 'Deferred: multi-cover combined-SI arithmetic vs the Life cover SI (and the Continuous-Trauma 3x multiplier). AC29 (single Acc TPD > Life) is verified above. The 3x/combined variants need the sub-cover structure-matching setup from AC25/26 first; encode in the same focused follow-up. AC33 Major-Trauma-3x is hand-derivable (XXXX*3) and mirrors the personal Trauma AC23 — quick to add next pass.');
  });
  test('AC36/AC38/AC39/AC41/AC42: further Business Security min-age + Acc TPD Level-structure age caps', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC36: Business Security + ANB < 17 -> min-17 error. AC38: Acc TPD Level to 70 + ANB > 60 -> 60. AC39: Acc TPD Level to 80 + ANB > 65 -> 65. AC41/AC42: Acc TPD Level to 70/80 + ANB < 17 -> min-17.'].join('\n') });
    test.fixme(true, 'Deferred (quick follow-up): same pattern as the encoded AC35/AC37/AC40 but for the remaining Business-Security min-age and Acc-TPD Level-structure variants — each needs setting the Acc TPD premium structure (which per AC25 is only editable when Life is not Stepped), so they depend on the AC25 structure-matching setup. Encode alongside AC25/26 next pass.');
  });
});

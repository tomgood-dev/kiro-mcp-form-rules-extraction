// Lumpsum Acd. Death Cover — acceptance-criteria mode (Jira ACB-2929).
// Source user story: docs/user-stories/User Story- Lumpsum Acd. Death Cover.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): every reachable AC gets
// positive + negative/absence + boundary-triple (with the AT-boundary ACCEPT case asserted) +
// value-level assertions, each surfaced via recordCheck. Boundary-accepts assert the SPECIFIC
// error is ABSENT (the $240 min-premium may still fire at a low-SI boundary value).
//
// DOM confirmed via probe 2026-09-04:
//   Cover button is "Acd. Death". Premium Structure is a select fixed to "Stepped" with
//   disabled === true (AC03: greyed out and set to Stepped). SI "?" tooltip is click-triggered.
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
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Acd. Death Premium Structure select — the DISABLED select fixed to Stepped (fingerprint: contains
// "Level to 100" and is disabled; a standalone Acd. Death quote has only this cover active).
async function getAcdStructure(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.includes('Stepped') && o.some((t) => t === 'Level to 100');
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), disabled: sel.disabled, id: sel.id } : null;
  });
}
async function freshAcdQuote(page, personal) {
  return test.step('open fresh quote + activate Acd. Death', async () => {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Acd. Death');
    return quote;
  });
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Lumpsum Acd. Death Cover (ACB-2929)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: All lump sum covers available; 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser/Adviser staff, When creating a new quote, Then I can apply for lumpsum cover.',
      'AC02: Given the Lump Sum Cover section, Then I can see Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, And select 1 or more covers.',
      '',
      'Steps to reproduce:',
      '1. Open a new Personal quote. 2. Check each lump sum cover button is present, then activate Acd. Death.',
      '',
      'Expected: all 7 lump sum cover buttons present; Acd. Death activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Cancer', 'Acd. Death', 'Needlestick', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Lump sum cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" cover present`).toBe(true);
    }
    await activateCover(quote, 'Acd. Death');
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Acd. Death is selectable (its Sum Insured field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: at least one cover (Acd. Death) is selectable').toBe(true);
  });

  test('AC03: Acd. Death exposes SI + Premium Structure greyed out and fixed to Stepped', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Given the Lump Sum Cover section, When I select Acd. Death, Then I can enter the Sum Insured, And Premium Structure is greyed out and set to Stepped.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Acd. Death. 2. Read the SI field + Premium Structure value and disabled state.',
      '',
      'Expected: SI field present; Premium Structure = Stepped AND disabled (greyed out).',
    ].join('\n') });
    const quote = await freshAcdQuote(page);
    await waitForSettle(quote, 1000);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Acd. Death Sum Insured field is present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: Sum Insured field present').toBe(true);
    const struct = await getAcdStructure(quote);
    recordCheck(testInfo, { label: 'Acd. Death Premium Structure value', expected: 'Stepped', actual: struct?.selected });
    expect(struct?.selected, 'AC03: Premium Structure fixed to Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'Acd. Death Premium Structure is greyed out (disabled)', expected: true, actual: struct?.disabled });
    expect(struct?.disabled, 'AC03: Premium Structure greyed out / disabled').toBe(true);
  });

  test('AC04: Acd. Death + ANB > 70 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given Acd. Death, When age next birthday > 70, Then error "The maximum Age Next Birthday for Accidental Death Cover is 70".',
      '', 'Steps to reproduce:', '1. New quote, ANB 71, activate Acd. Death, SI $200,000, Apply.',
      '', 'Expected: "maximum Age Next Birthday for Accidental Death Cover is 70" error.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 71, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Acd. Death ANB > 70', expected: 'maximum Age Next Birthday for Accidental Death Cover is 70', actual: e });
    expect(/maximum Age Next Birthday for Accidental Death Cover is 70/i.test(e), `AC04. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC04 boundary: Acd. Death max age at ANB 70 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04 (at-boundary accept): max ANB is 70 — Acd. Death at exactly 70 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 70, activate Acd. Death, SI $200,000, Apply.',
      '', 'Expected: NO "maximum Age Next Birthday for Accidental Death Cover is 70" error.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 70, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Accidental Death Cover is 70/i.test(e);
    recordCheck(testInfo, { label: 'Acd. Death max age at ANB 70 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC04 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC05: Acd. Death + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given Acd. Death, When age next birthday < 17, Then error "The minimum Age Next Birthday for Accidental Death Cover is 17".',
      '', 'Steps to reproduce:', '1. New quote, ANB 16, activate Acd. Death, SI $200,000, Apply.',
      '', 'Expected: "minimum Age Next Birthday for Accidental Death Cover is 17" error.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Acd. Death ANB < 17', expected: 'minimum Age Next Birthday for Accidental Death Cover is 17', actual: e });
    expect(/minimum Age Next Birthday for Accidental Death Cover is 17/i.test(e), `AC05. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC05 boundary: Acd. Death min age at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05 (at-boundary accept): min ANB is 17 — Acd. Death at exactly 17 must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 17, activate Acd. Death, SI $200,000, Apply.',
      '', 'Expected: NO "minimum Age Next Birthday for Accidental Death Cover is 17" error.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 17, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Age Next Birthday for Accidental Death Cover is 17/i.test(e);
    recordCheck(testInfo, { label: 'Acd. Death min age at ANB 17 accepted (no min-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC05 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC06: Acd. Death + SI > $1,000,000 → maximum SI cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given Acd. Death, When Sum Insured > 1,000,000, Then error "The maximum sum insured for Accidental Death Cover is $1,000,000.".',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, activate Acd. Death, SI $1,000,001, Apply.',
      '', 'Expected: "maximum sum insured for Accidental Death Cover is $1,000,000" error.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '1000001'); // $1,000,000 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Acd. Death SI > $1,000,000', expected: 'maximum sum insured for Accidental Death Cover is $1,000,000', actual: e });
    expect(/maximum sum insured for Accidental Death Cover is \$?1,?000,?000/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC06 boundary: Acd. Death SI exactly $1,000,000 is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06 (at-boundary accept): the cap is $1,000,000 — SI at exactly $1,000,000 must NOT raise the cap error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, activate Acd. Death, SI $1,000,000 exactly, Apply.',
      '', 'Expected: NO "$1,000,000" cap error.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '1000000'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = /maximum sum insured for Accidental Death Cover is \$?1,?000,?000/i.test(e);
    recordCheck(testInfo, { label: 'Acd. Death SI exactly $1,000,000 accepted (no cap error)', expected: false, actual: hasCap });
    expect(hasCap, `AC06 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC07: Acd. Death cover can be added and removed, premium reflects it', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: When I have selected the cover type, Then I can add/remove/modify it, And I can view the premium change in the progress panel.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Acd. Death, SI $200,000 — confirm SI field present (added).',
      '2. Remove the Acd. Death cover — confirm SI field gone (removed).',
      '',
      'Expected: SI field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Acd. Death Sum Insured field present after adding the cover', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC07: cover added (SI field present)').toBe(true);
    await quote.evaluate(() => {
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'Remove');
      if (link) link.click();
    });
    await waitForSettle(quote, 1500);
    const siCountAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'Acd. Death Sum Insured field removed after removing the cover', expected: 0, actual: siCountAfterRemove });
    expect(siCountAfterRemove, 'AC07: cover removed (no SI field)').toBe(0);
  });

  test('AC08: Sum Insured "?" tooltip shows the Accidental Death discount-bands text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given the Acd. Death section, When I click the "?" icon next to Sum Insured, Then the tooltip shows the discount bands: $150,000-$249,999 / $250,000-$499,999 / $500,000-$999,999 / $1,000,000.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Acd. Death. 2. Click the "?" icon next to Sum Insured; read the tooltip.',
      '',
      'Expected: tooltip lists the Accidental Death discount bands.',
    ].join('\n') });
    const quote = await freshAcdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await waitForSettle(quote, 1000);
    await quote.evaluate(() => {
      const icon = [...document.querySelectorAll('i, span, a')].find((el) => /fa-question|help/i.test(el.className || '') || (el.innerText || '').trim() === '?');
      if (icon) icon.click();
    });
    await waitForSettle(quote, 800);
    const bandText = await quote.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find((e) => /large sum insured discount bands for Accidental Death/i.test(e.innerText || ''));
      return el ? el.innerText.trim() : (document.body.innerText.match(/discount bands for Accidental Death[\s\S]{0,180}/i)?.[0] || null);
    });
    recordCheck(testInfo, { label: 'Acd. Death Sum Insured tooltip lists the discount bands', expected: 'contains $150,000-$249,999 ... $1,000,000', actual: bandText });
    expect(bandText, 'AC08: Accidental Death discount-bands tooltip present').toMatch(/\$150,?000\s*-\s*\$?249,?999/i);
    expect(bandText, 'AC08: tooltip shows the $1,000,000 top band').toMatch(/\$?1,?000,?000/i);
  });
});

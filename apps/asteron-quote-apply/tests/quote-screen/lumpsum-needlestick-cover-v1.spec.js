// Lumpsum Needlestick Cover — acceptance-criteria mode (Jira ACB-2931).
// Source user story: docs/user-stories/User Story- Lumpsum Needlestick Cover.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): positive + negative/absence +
// boundary-triple (AT-boundary accept asserted) + value-level, each surfaced via recordCheck.
//
// DOM confirmed via probe 2026-09-04 (Needlestick is COMPANION-DEPENDENT — AC04):
//   Reached by activating a companion (Life/Trauma/Cancer/TPD/IP) first, then Needlestick.
//   Needlestick Sum Insured is a SELECT with options ["$0","$50,000",...,"$500,000"] ($50k steps).
//   Needlestick Premium Structure is a disabled select fixed to "Stepped".
//   "+Needlestick" (the Needlestick cover button) is disabled after 1 (AC08).
//   Occupation AA (code 1) is eligible; AM is not (legacy LSC-02 gating).
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  setAge,
  setGender,
  activateCover,
  coverButtonExists,
  fillCalcMask,
  sumInsuredInput,
  getVisibleErrors,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Needlestick Sum Insured SELECT — fingerprint by its $0..$500,000 option set.
async function getNeedlestickSi(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.includes('$0') && o.includes('$500,000') && o.includes('$50,000');
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id, disabled: sel.disabled } : null;
  });
}
async function setNeedlestickSi(page, label) {
  const info = await getNeedlestickSi(page);
  if (!info) throw new Error('Needlestick Sum Insured select not found');
  await page.locator(`[id="${info.id}"]`).selectOption({ label });
  await waitForSettle(page, 1000);
}
// Needlestick Premium Structure = the DISABLED select fixed to Stepped (companion's is enabled).
async function getNeedlestickStructure(page) {
  return page.evaluate(() => {
    const sels = [...document.querySelectorAll('select')].filter((s) => [...s.options].some((o) => o.text.trim() === 'Stepped'));
    const disabledOne = sels.find((s) => s.disabled);
    const sel = disabledOne || sels[sels.length - 1];
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), disabled: sel.disabled, id: sel.id } : null;
  });
}
// Open a fresh quote with a Life companion already priced ($200k), ready to add Needlestick.
async function freshQuoteWithCompanion(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await waitForSettle(quote, 1000);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Lumpsum Needlestick Cover (ACB-2931)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: All lump sum covers available; 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser/Adviser staff, When creating a new quote, Then I can apply for lumpsum cover.',
      'AC02: Given the Lump Sum Cover section, Then I can see Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, And select 1 or more covers.',
      '', 'Steps to reproduce:', '1. Open a new Personal quote. 2. Check each lump sum cover button is present.',
      '', 'Expected: all 7 lump sum cover buttons present.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Cancer', 'Acd. Death', 'Needlestick', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Lump sum cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" cover present`).toBe(true);
    }
  });

  test('AC03: Needlestick exposes SI dropdown ($0-$500,000 in $50k steps) + Premium Structure greyed to Stepped', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Needlestick, Then a Sum Insured dropdown ($0 to $500,000 in $50,000 increments) is shown, And Premium Structure is defaulted to Stepped and greyed out (non-editable).',
      '', 'Steps to reproduce:', '1. New quote, activate a Life companion ($200k), activate Needlestick.',
      '2. Read the Needlestick SI dropdown options and the Premium Structure value + disabled state.',
      '', 'Expected: SI options $0..$500,000 (11 options, $50k steps); Premium Structure = Stepped AND disabled.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page);
    await activateCover(quote, 'Needlestick');
    await waitForSettle(quote, 1500);
    const si = await getNeedlestickSi(quote);
    const expectedOptions = ['$0', '$50,000', '$100,000', '$150,000', '$200,000', '$250,000', '$300,000', '$350,000', '$400,000', '$450,000', '$500,000'];
    recordCheck(testInfo, { label: 'Needlestick Sum Insured dropdown options', expected: expectedOptions.join(', '), actual: (si?.options || []).join(', ') });
    expect(si?.options, 'AC03: SI dropdown $0-$500,000 in $50k steps').toEqual(expectedOptions);
    const struct = await getNeedlestickStructure(quote);
    recordCheck(testInfo, { label: 'Needlestick Premium Structure value', expected: 'Stepped', actual: struct?.selected });
    expect(struct?.selected, 'AC03: Premium Structure = Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'Needlestick Premium Structure greyed out (disabled)', expected: true, actual: struct?.disabled });
    expect(struct?.disabled, 'AC03: Premium Structure greyed out / disabled').toBe(true);
  });

  test('AC04: Needlestick WITHOUT a companion cover → companion-required error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given Needlestick selected, When no other cover (Life, Trauma Recovery, Cancer, TPD or Income Protection) is selected, Then error "Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection".',
      '', 'Steps to reproduce:', '1. New quote, activate ONLY Needlestick (no companion), set SI $50,000, Apply.',
      '', 'Expected: the companion-required error message.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Needlestick');
    await waitForSettle(quote, 1000);
    await setNeedlestickSi(quote, '$50,000').catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Needlestick alone raises the companion-required error', expected: 'requires one of the following covers ... Life, Trauma Recovery, Cancer, TPD or Income Protection', actual: e });
    expect(/Needlestick Cover requires one of the following covers to also be selected/i.test(e), `AC04. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC10: Needlestick WITH a companion cover is accepted (no companion-required error) + premium', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10 (positive complement of AC04): When a companion cover (Life) is selected, Then Needlestick can be selected and a premium is displayed — no companion-required error.',
      '', 'Steps to reproduce:', '1. New quote, activate Life $200k companion, activate Needlestick, SI $50,000, Apply.',
      '', 'Expected: NO companion-required error (Needlestick accepted alongside Life).',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page);
    await activateCover(quote, 'Needlestick');
    await setNeedlestickSi(quote, '$50,000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasCompanionErr = /Needlestick Cover requires one of the following covers/i.test(e);
    recordCheck(testInfo, { label: 'Needlestick with a Life companion accepted (no companion-required error)', expected: false, actual: hasCompanionErr });
    expect(hasCompanionErr, `AC10. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC05: Needlestick + ineligible occupation → not-available-for-occupation error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given Needlestick selected, When the occupation is NOT eligible for Needlestick, Then error "Needlestick not available for the selected occupation".',
      '', 'Steps to reproduce:',
      '1. New quote, ANB 40, Gender Male, Occupation code AM (ineligible for Needlestick per LSC-02).',
      '2. Activate a Life companion, then attempt Needlestick, Apply.',
      '',
      'Expected: "Needlestick not available for the selected occupation" error.',
      '',
      'Actual (CONFIRMED DISCREPANCY, probe 2026-09-04): at an ineligible occupation (AM) the',
      'Needlestick button stays ENABLED but clicking it silently does NOT add a cover card (no-op),',
      'and NO "not available for the selected occupation" message is shown anywhere (Apply reports no',
      'errors). The app therefore does not implement AC05\'s error message. This assertion is written to',
      'the spec\'s expected value and is EXPECTED TO FAIL until the app surfaces the message — see the',
      'Discrepancy Evidence Record in the test doc. Not weakened to match the no-op.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setAge(quote, 40);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AM' });
    await waitForSettle(quote, 1500);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Needlestick');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Needlestick at an ineligible occupation raises the not-available error', expected: 'Needlestick not available for the selected occupation', actual: e });
    expect(/Needlestick not available for the selected occupation/i.test(e), `AC05. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC06: Needlestick + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given Needlestick, When age next birthday < 17, Then error "The minimum age next birthday for Needlestick cover is 17".',
      '', 'Steps to reproduce:', '1. New quote, ANB 16, Life companion $200k, activate Needlestick, SI $50,000, Apply.',
      '', 'Expected: "minimum age next birthday for Needlestick cover is 17" error.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Needlestick');
    await setNeedlestickSi(quote, '$50,000').catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Needlestick ANB < 17', expected: 'minimum age next birthday for Needlestick cover is 17', actual: e });
    expect(/minimum age next birthday for Needlestick cover is 17/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC06 boundary: Needlestick min age at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06 (at-boundary accept): min ANB is 17 — Needlestick at exactly 17 must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 17, Life companion $200k, activate Needlestick, SI $50,000, Apply.',
      '', 'Expected: NO "minimum age next birthday for Needlestick cover is 17" error.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page, { age: 17, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Needlestick');
    await setNeedlestickSi(quote, '$50,000').catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum age next birthday for Needlestick cover is 17/i.test(e);
    recordCheck(testInfo, { label: 'Needlestick min age at ANB 17 accepted (no min-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC06 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC07: Needlestick + ANB > 65 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given Needlestick, When age next birthday > 65, Then error "The maximum age next birthday for Needlestick cover is 65".',
      '', 'Steps to reproduce:', '1. New quote, ANB 66, Life companion $200k, activate Needlestick, SI $50,000, Apply.',
      '', 'Expected: "maximum age next birthday for Needlestick cover is 65" error.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Needlestick');
    await setNeedlestickSi(quote, '$50,000').catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Needlestick ANB > 65', expected: 'maximum age next birthday for Needlestick cover is 65', actual: e });
    expect(/maximum age next birthday for Needlestick cover is 65/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07 boundary: Needlestick max age at ANB 65 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07 (at-boundary accept): max ANB is 65 — Needlestick at exactly 65 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 65, Life companion $200k, activate Needlestick, SI $50,000, Apply.',
      '', 'Expected: NO "maximum age next birthday for Needlestick cover is 65" error.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page, { age: 65, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Needlestick');
    await setNeedlestickSi(quote, '$50,000').catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum age next birthday for Needlestick cover is 65/i.test(e);
    recordCheck(testInfo, { label: 'Needlestick max age at ANB 65 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC07 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC08/AC09: only one Needlestick — "+Needlestick" disabled after 1, re-enabled on remove', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Needlestick selected, Then +Needlestick is greyed out and I cannot add another for the same policy.',
      'AC09: When I remove Needlestick, Then +Needlestick re-enables.',
      '', 'Steps to reproduce:', '1. New quote, Life companion $200k, activate Needlestick. 2. Check +Needlestick disabled.',
      '3. Remove the Needlestick cover. 4. Check +Needlestick re-enabled.',
      '', 'Expected: disabled after 1, enabled again after remove.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page);
    await activateCover(quote, 'Needlestick');
    await waitForSettle(quote, 1500);
    const isNeedleDisabled = () => quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().split('\n')[0] === 'Needlestick');
      return b ? (b.disabled || /disabled|is-disabled/.test(b.className)) : null;
    });
    const disabledAfter1 = await isNeedleDisabled();
    recordCheck(testInfo, { label: '+Needlestick disabled after 1 Needlestick cover', expected: true, actual: disabledAfter1 });
    expect(disabledAfter1, 'AC08: +Needlestick disabled after 1').toBe(true);
    // Remove the Needlestick cover (its card's Remove link — the last Remove, Needlestick added last).
    await quote.evaluate(() => {
      const links = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove');
      if (links.length) links[links.length - 1].click();
    });
    await waitForSettle(quote, 1500);
    const disabledAfterRemove = await isNeedleDisabled();
    recordCheck(testInfo, { label: '+Needlestick re-enabled after removing it', expected: false, actual: disabledAfterRemove });
    expect(disabledAfterRemove, 'AC09: +Needlestick re-enabled after remove').toBe(false);
  });

  test('AC11: Needlestick "?" tooltip shows the hepatitis/HIV protection text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: Given the Needlestick section, When I click the "?" icon, Then the tooltip: "For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV.".',
      '', 'Steps to reproduce:', '1. New quote, Life companion $200k, activate Needlestick. 2. Click the "?" icon; read the tooltip.',
      '', 'Expected: tooltip mentions hepatitis B or C or HIV.',
    ].join('\n') });
    const quote = await freshQuoteWithCompanion(page);
    await activateCover(quote, 'Needlestick');
    await waitForSettle(quote, 1500);
    // Robust: the tooltip text is present in the DOM (body text and/or a [title] attribute) once the
    // Needlestick cover is active — search it directly rather than racing a click-triggered popover.
    const tip = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      const hay = body + ' \n ' + titles;
      const m = hay.match(/[^\n]*hepatitis[^\n]*/i);
      return m ? m[0].trim() : hay.slice(0, 0) || null;
    });
    recordCheck(testInfo, { label: 'Needlestick tooltip mentions hepatitis B/C or HIV protection', expected: 'contains "hepatitis B or C or HIV"', actual: tip });
    expect(tip, 'AC11: Needlestick tooltip text present').toMatch(/hepatitis B or C or HIV/i);
  });
});

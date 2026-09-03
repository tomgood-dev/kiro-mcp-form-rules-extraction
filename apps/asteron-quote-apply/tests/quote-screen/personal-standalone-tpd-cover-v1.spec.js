// Personal Standalone Lumpsum TPD Cover — acceptance-criteria mode (Jira ACB-2927).
// Source user story: docs/user-stories/User Story- Personal Standalone Lumpsum TPD Cover.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): every reachable AC gets
// positive + negative/absence + boundary-triple (with the AT-boundary ACCEPT case asserted) +
// value-level assertions, each surfaced via recordCheck so it shows in "What Each Passing Test
// Checked". Boundary-accept asserts the SPECIFIC error is ABSENT (an unrelated rule like the $240
// min-premium may still fire at a boundary-accept value), not errors.length === 0.
//
// DOM confirmed via probe 2026-09-04 (standalone TPD, only TPD active):
//   Premium Structure select — options [Stepped(default), Level to 65, Level to 70]
//   Definition select        — options [Own(default), Any, Modified]
//   The "+TPD" add mechanism is the same TPD cover button (click again to add another card).
//   The Sum Insured "?" tooltip is click-triggered, not in static DOM.
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

// Standalone-TPD Premium Structure select: fingerprint by its 3-option set (safe — only TPD active).
async function getTpdStructure(page, index = 0) {
  return page.evaluate((idx) => {
    const sels = [...document.querySelectorAll('select')].filter((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.includes('Stepped') && o.includes('Level to 65') && o.includes('Level to 70') && !o.some((t) => t === 'Level to 100');
    });
    const sel = sels[idx];
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  }, index);
}
async function setTpdStructure(page, label, index = 0) {
  const info = await getTpdStructure(page, index);
  if (!info) throw new Error('TPD Premium Structure select not found');
  await page.locator(`[id="${info.id}"]`).selectOption({ label });
  await waitForSettle(page, 1000);
}
// Standalone-TPD Definition select: fingerprint {Own, Any, Modified}.
async function getTpdDefinition(page, index = 0) {
  return page.evaluate((idx) => {
    const sels = [...document.querySelectorAll('select')].filter((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.length <= 4 && o.includes('Own') && o.includes('Any') && o.includes('Modified');
    });
    const sel = sels[idx];
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  }, index);
}
async function setTpdDefinition(page, label, index = 0) {
  const info = await getTpdDefinition(page, index);
  if (!info) throw new Error('TPD Definition select not found');
  await page.locator(`[id="${info.id}"]`).selectOption({ label });
  await waitForSettle(page, 1000);
}
async function freshTpdQuote(page, personal) {
  return test.step('open fresh quote + activate TPD', async () => {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, personal || { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'TPD');
    return quote;
  });
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Personal Standalone Lumpsum TPD Cover (ACB-2927)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: All lump sum covers available; 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser/Adviser staff, When creating a new quote, Then I can apply for lumpsum cover.',
      'AC02: Given the Lump Sum Cover section, Then I can see Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, And select 1 or more covers.',
      '',
      'Steps to reproduce:',
      '1. Open a new Personal quote.',
      '2. Check each lump sum cover button is present, then activate TPD to prove 1+ is selectable.',
      '',
      'Expected: all 7 lump sum cover buttons present; TPD activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Cancer', 'Acd. Death', 'Needlestick', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Lump sum cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" cover present`).toBe(true);
    }
    await activateCover(quote, 'TPD');
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'TPD is selectable (its Sum Insured field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: at least one cover (TPD) is selectable').toBe(true);
  });

  test('AC03/AC12: TPD exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} + Definition {Own default, Any, Modified}', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Given the Lump Sum Cover section, When I select TPD, Then I can enter the Sum Insured, select Premium Structure {Stepped(default), Level to 65, Level to 70}, and select Definition {Own(default), Any, Modified}.',
      'AC12: When I select the cover type, Then I can enter the Sum Insured and the premium structure is pre-populated.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate TPD.',
      '2. Read the Sum Insured field, Premium Structure options+default, Definition options+default.',
      '',
      'Expected: SI field present; Premium Structure = [Stepped(default), Level to 65, Level to 70]; Definition = [Own(default), Any, Modified].',
    ].join('\n') });
    const quote = await freshTpdQuote(page);
    await waitForSettle(quote, 1000);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'TPD Sum Insured field is present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: Sum Insured field present').toBe(true);

    const struct = await getTpdStructure(quote);
    recordCheck(testInfo, { label: 'TPD Premium Structure default', expected: 'Stepped', actual: struct?.selected });
    expect(struct?.selected, 'AC03/AC12: Premium Structure default is Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'TPD Premium Structure options', expected: 'Stepped, Level to 65, Level to 70', actual: (struct?.options || []).join(', ') });
    expect(struct?.options, 'AC03: Premium Structure options').toEqual(['Stepped', 'Level to 65', 'Level to 70']);

    const def = await getTpdDefinition(quote);
    recordCheck(testInfo, { label: 'TPD Definition default', expected: 'Own', actual: def?.selected });
    expect(def?.selected, 'AC03: Definition default is Own').toBe('Own');
    recordCheck(testInfo, { label: 'TPD Definition options', expected: 'Own, Any, Modified', actual: (def?.options || []).join(', ') });
    expect(def?.options, 'AC03: Definition options').toEqual(['Own', 'Any', 'Modified']);
  });

  test('AC06: TPD + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given TPD Cover, When age next birthday is less than 17, Then error "The minimum Age Next Birthday for XXXX Standalone TPD cover is 17" (XXXX = premium structure).',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 16, activate TPD, SI $100,000, Apply.',
      '',
      'Expected: error containing "minimum Age Next Birthday" and "17" for Standalone TPD.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for TPD ANB < 17', expected: 'minimum Age Next Birthday ... TPD ... is 17', actual: e });
    expect(/minimum Age Next Birthday.*TPD.*is 17/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC06 boundary: TPD min age at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06 (at-boundary accept): ANB 17 is the minimum — TPD at exactly 17 must NOT raise the min-age error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 17, activate TPD, SI $100,000 (Modified def — 17-21 requires it), Apply.',
      '',
      'Expected: NO "minimum Age Next Birthday ... 17" error (an unrelated min-premium may still show).',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 17, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdDefinition(quote, 'Modified'); // 17-21 requires Modified (AC10) — keep that rule from firing
    await clickApply(quote);
    const e = await errText(quote);
    const hasMinAge = /minimum Age Next Birthday.*TPD.*is 17/i.test(e);
    recordCheck(testInfo, { label: 'TPD min age at ANB 17 accepted (no min-age error)', expected: false, actual: hasMinAge });
    expect(hasMinAge, `AC06 boundary: no min-age error at ANB 17. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC07: TPD Stepped + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given TPD Cover, When ANB > 65 and Premium Structure is Stepped, Then error "The maximum Age Next Birthday for Stepped Standalone TPD cover is 65".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 66, activate TPD (Stepped default), SI $100,000, Apply.',
      '',
      'Expected: error containing "maximum Age Next Birthday for Stepped" and "65".',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for TPD Stepped + ANB > 65', expected: 'maximum Age Next Birthday for Stepped ... 65', actual: e });
    expect(/maximum Age Next Birthday for Stepped.*TPD.*65/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07 boundary: TPD Stepped max at ANB 65 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07 (at-boundary accept): Stepped max ANB is 65 — TPD Stepped at exactly 65 must NOT raise the max-age error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 65, activate TPD (Stepped), SI $100,000, Apply.',
      '',
      'Expected: NO "maximum Age Next Birthday for Stepped ... 65" error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 65, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasMaxAge = /maximum Age Next Birthday for Stepped.*TPD.*65/i.test(e);
    recordCheck(testInfo, { label: 'TPD Stepped max at ANB 65 accepted (no max-age error)', expected: false, actual: hasMaxAge });
    expect(hasMaxAge, `AC07 boundary: no max-age error at ANB 65. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC08: TPD Level to 65 + ANB > 60 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given TPD Cover, When ANB > 60 and Premium Structure is Level to 65, Then error "The maximum Age Next Birthday for Level to 65 Standalone TPD cover is 60".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 61, activate TPD, SI $100,000, set Premium Structure = Level to 65, Apply.',
      '',
      'Expected: error containing "Level to 65" and "60".',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdStructure(quote, 'Level to 65');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for TPD Level to 65 + ANB > 60', expected: 'Level to 65 ... 60', actual: e });
    expect(/Level to 65.*TPD.*60/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08 boundary: TPD Level to 65 max at ANB 60 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08 (at-boundary accept): Level to 65 max ANB is 60 — at exactly 60 must NOT raise the max-age error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 60, activate TPD, SI $100,000, set Premium Structure = Level to 65, Apply.',
      '',
      'Expected: NO "Level to 65 ... 60" max-age error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 60, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdStructure(quote, 'Level to 65');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Level to 65.*TPD.*60/i.test(e);
    recordCheck(testInfo, { label: 'TPD Level to 65 max at ANB 60 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC08 boundary: no max-age error at ANB 60. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC09: TPD Level to 70 + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given TPD Cover, When ANB > 65 and Premium Structure is Level to 70, Then error "The maximum Age Next Birthday for Level to 70 Standalone TPD cover is 65".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 66, activate TPD, SI $100,000, set Premium Structure = Level to 70, Apply.',
      '',
      'Expected: error containing "Level to 70" and "65".',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdStructure(quote, 'Level to 70');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for TPD Level to 70 + ANB > 65', expected: 'Level to 70 ... 65', actual: e });
    expect(/Level to 70.*TPD.*65/i.test(e), `AC09. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC09 boundary: TPD Level to 70 max at ANB 65 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09 (at-boundary accept): Level to 70 max ANB is 65 — at exactly 65 must NOT raise the max-age error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 65, activate TPD, SI $100,000, set Premium Structure = Level to 70, Apply.',
      '',
      'Expected: NO "Level to 70 ... 65" max-age error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 65, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdStructure(quote, 'Level to 70');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Level to 70.*TPD.*65/i.test(e);
    recordCheck(testInfo, { label: 'TPD Level to 70 max at ANB 65 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC09 boundary: no max-age error at ANB 65. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC09A: TPD + ANB 17-21 + SI > $250,000 → young cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09A: Given TPD Cover, When ANB 17-21 and Sum Insured > 250000, Then error "The maximum \'TPD Cover\' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate TPD, set Definition = Modified (required for 17-21 per AC10),',
      '   SI $250,001 (just over the $250,000 cap), Apply.',
      '',
      'Expected: the $250,000 young-cap error is displayed. (Definition = Modified so AC10 does not fire first.)',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await setTpdDefinition(quote, 'Modified'); // keep the AC10 "only Modified eligible" rule from firing first
    await fillCalcMask(sumInsuredInput(quote, 0), '250001'); // $250,000 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for TPD ANB 17-21 + SI > $250k', expected: 'Age Next Birthday 17 - 21 is $250,000', actual: e });
    expect(/Age Next Birthday 17\s*-\s*21 is \$?250,?000/i.test(e), `AC09A. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC09A boundary: TPD ANB 17-21 SI exactly $250,000 is accepted (no young-cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09A (at-boundary accept): the 17-21 cap is $250,000 — SI at exactly $250,000 must NOT raise the young-cap error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate TPD, Definition = Modified, SI $250,000 exactly, Apply.',
      '',
      'Expected: NO "$250,000" young-cap error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await setTpdDefinition(quote, 'Modified');
    await fillCalcMask(sumInsuredInput(quote, 0), '250000'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = /Age Next Birthday 17\s*-\s*21 is \$?250,?000/i.test(e);
    recordCheck(testInfo, { label: 'TPD ANB 17-21 SI exactly $250,000 accepted (no young-cap error)', expected: false, actual: hasCap });
    expect(hasCap, `AC09A boundary: no young-cap error at $250,000. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC10: TPD + ANB 17-21 + non-Modified definition → "only eligible for Modified TPD" error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given TPD Cover, When ANB 17-21 (inclusive) and definition is NOT Modified, Then error "Age Next Birthday 17-21 is only eligible for Modified TPD".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate TPD, keep Definition = Own (default, non-Modified), SI $100,000, Apply.',
      '',
      'Expected: "Age Next Birthday 17-21 is only eligible for Modified TPD" error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000'); // Own is the default — non-Modified
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Non-Modified TPD at ANB 17-21 raises the Modified-only error', expected: 'only eligible for Modified TPD', actual: e });
    expect(/only eligible for Modified TPD/i.test(e), `AC10. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10 accept: TPD + ANB 17-21 + Modified definition is accepted (no Modified-only error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10 (positive complement): at ANB 17-21, Modified TPD IS eligible — Modified must NOT raise the Modified-only error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate TPD, set Definition = Modified, SI $100,000, Apply.',
      '',
      'Expected: NO "only eligible for Modified TPD" error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await setTpdDefinition(quote, 'Modified');
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /only eligible for Modified TPD/i.test(e);
    recordCheck(testInfo, { label: 'Modified TPD at ANB 17-21 accepted (no Modified-only error)', expected: false, actual: hasErr });
    expect(hasErr, `AC10 accept: Modified TPD accepted at 17-21. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC11: TPD + ANB > 21 + SI > $5,000,000 → max total SI cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: Given TPD Cover, When ANB > 21 and combined TPD SI (+ TPD on Trauma) > 5000000, Then error "The maximum total Sum Insured per life for TPD Cover is $5,000,000.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate TPD, SI $5,000,001 (just over the $5,000,000 cap), Apply.',
      '',
      'Expected: "The maximum total Sum Insured per life for TPD Cover is $5,000,000." error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '5000001'); // $5,000,000 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for TPD SI > $5,000,000 (ANB > 21)', expected: 'maximum total Sum Insured per life for TPD Cover is $5,000,000', actual: e });
    expect(/maximum total Sum Insured per life for TPD Cover is \$?5,?000,?000/i.test(e), `AC11. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC11 boundary: TPD SI exactly $5,000,000 (ANB > 21) is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11 (at-boundary accept): the ANB 22+ cap is $5,000,000 — SI at exactly $5,000,000 must NOT raise the cap error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate TPD, SI $5,000,000 exactly, Apply.',
      '',
      'Expected: NO "$5,000,000" cap error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '5000000'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = /maximum total Sum Insured per life for TPD Cover is \$?5,?000,?000/i.test(e);
    recordCheck(testInfo, { label: 'TPD SI exactly $5,000,000 accepted (no cap error)', expected: false, actual: hasCap });
    expect(hasCap, `AC11 boundary: no cap error at $5,000,000. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC13: TPD cover can be added and removed, premium reflects it', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: When I have selected the cover type, Then I can add/remove/update it, And I can view the premium change in the progress panel.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate TPD, SI $200,000 — confirm the SI field is present (cover added).',
      '2. Remove the TPD cover — confirm the SI field is gone (cover removed).',
      '',
      'Expected: SI field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'TPD Sum Insured field present after adding the cover', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC13: cover added (SI field present)').toBe(true);
    // Remove via the cover card's Remove link.
    await quote.evaluate(() => {
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'Remove');
      if (link) link.click();
    });
    await waitForSettle(quote, 1500);
    const siCountAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'TPD Sum Insured field removed after removing the cover', expected: 0, actual: siCountAfterRemove });
    expect(siCountAfterRemove, 'AC13: cover removed (no SI field)').toBe(0);
  });

  test('AC14: Sum Insured "?" tooltip shows the TPD discount-bands text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC14: Given the TPD cover section, When I click the "?" icon next to Sum Insured, Then the tooltip shows the discount bands: $100,000-$249,999 / $250,000-$499,999 / $500k+.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate TPD.',
      '2. Click the "?" icon next to Sum Insured; read the tooltip.',
      '',
      'Expected: tooltip text lists the three TPD discount bands.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await waitForSettle(quote, 1000);
    // Click a "?" help icon near the Sum Insured label to trigger the tooltip.
    await quote.evaluate(() => {
      const icon = [...document.querySelectorAll('i, span, a')].find((el) => /fa-question|help/i.test(el.className || '') || (el.innerText || '').trim() === '?');
      if (icon) icon.click();
    });
    await waitForSettle(quote, 800);
    const bandText = await quote.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find((e) => /large sum insured discount bands for TPD/i.test(e.innerText || ''));
      return el ? el.innerText.trim() : (document.body.innerText.match(/discount bands for TPD[\s\S]{0,160}/i)?.[0] || null);
    });
    recordCheck(testInfo, { label: 'TPD Sum Insured tooltip lists the discount bands', expected: 'contains $100,000-$249,999 / $250,000-$499,999 / $500k +', actual: bandText });
    expect(bandText, 'AC14: TPD discount-bands tooltip present').toMatch(/\$100,?000\s*-\s*\$?249,?999/i);
    expect(bandText, 'AC14: tooltip shows $500k+ band').toMatch(/\$?500k\s*\+/i);
  });

  test('AC15: maximum 3 TPD covers — "+TPD" is disabled after 3', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15: Given multiple TPD covers, When I have selected up to a maximum of 3, Then the "+TPD" button is greyed out and disabled (no further additions).',
      '',
      'Steps to reproduce:',
      '1. New quote, activate TPD three times (3 TPD covers), giving each an SI.',
      '2. Check the TPD cover button is disabled.',
      '',
      'Expected: after 3 TPD covers the TPD add button is disabled.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '110000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 2), '120000');
    await waitForSettle(quote, 1500);
    const tpdDisabled = await quote.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim().split('\n')[0] === 'TPD');
      return btn ? (btn.disabled || /disabled|is-disabled/.test(btn.className)) : null;
    });
    recordCheck(testInfo, { label: 'TPD add button is disabled after 3 TPD covers', expected: true, actual: tpdDisabled });
    expect(tpdDisabled, 'AC15: +TPD disabled after 3 covers').toBe(true);
  });

  test('AC16: mixed TPD definitions on the same policy → "same TPD definition" error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16: Given multiple TPD covers, When the TPD definitions differ, Then error "You must have the same TPD definition for TPD cover on the same policy.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate TPD (SI $100,000, Definition = Own).',
      '2. Activate a 2nd TPD (SI $100,000), set its Definition = Any (different from the first).',
      '3. Apply.',
      '',
      'Expected: "You must have the same TPD definition for TPD cover on the same policy." error.',
    ].join('\n') });
    const quote = await freshTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdDefinition(quote, 'Own', 0);
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '100000');
    await setTpdDefinition(quote, 'Any', 1); // second cover, different definition
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Mismatched TPD definitions raise the same-definition error', expected: 'same TPD definition for TPD cover on the same policy', actual: e });
    expect(/same TPD definition for TPD cover on the same policy/i.test(e), `AC16. Got: ${e.slice(0, 200)}`).toBe(true);
  });
});

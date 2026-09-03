// Personal Lumpsum Standalone Cancer Cover — acceptance-criteria mode (Jira ACB-2928).
// Source user story: docs/user-stories/User Story- Personal Lumpsum Standalone Cancer Cover.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): every reachable AC gets
// positive + negative/absence + boundary-triple (with the AT-boundary ACCEPT case asserted) +
// value-level assertions, each surfaced via recordCheck. Boundary-accepts assert the SPECIFIC
// error is ABSENT (the $240 min-premium may still fire at a low-SI boundary value).
//
// DOM confirmed via probe 2026-09-04 (standalone Cancer):
//   Premium Structure select — [Stepped, Level to 65, Level to 70]; the 1st/2nd/3rd Cancer cover
//   DEFAULT to Stepped / Level to 65 / Level to 70 respectively (AC14 progression — confirmed).
//   "+Cancer" is the same Cancer cover button; disabled=true after 3 covers (AC13).
//   The SI "?" tooltip is click-triggered, not in static DOM.
// The combined-cap error strings (AC07-AC12) are the same ones already validated live by the
// personal-lump-sum-trauma-v1 spec ("...Trauma Recovery Cover, including Cancer Cover, ... $250,000/$2,000,000").
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

// Nth Premium Structure select (fingerprint {Stepped, Level to 65, Level to 70}); safe because a
// standalone-Cancer quote only has Cancer covers active. Index = cover order (probe-confirmed).
async function getStructure(page, index = 0) {
  return page.evaluate((idx) => {
    const sels = [...document.querySelectorAll('select')].filter((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.includes('Stepped') && o.includes('Level to 65') && o.includes('Level to 70') && !o.some((t) => t === 'Level to 100');
    });
    const sel = sels[idx];
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  }, index);
}
async function setStructure(page, label, index = 0) {
  const info = await getStructure(page, index);
  if (!info) throw new Error(`Premium Structure select #${index} not found`);
  await page.locator(`[id="${info.id}"]`).selectOption({ label });
  await waitForSettle(page, 1000);
}
async function freshCancerQuote(page, personal) {
  return test.step('open fresh quote + activate Cancer', async () => {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Cancer');
    return quote;
  });
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
const RX_YOUNG_CAP = /Trauma Recovery Cover, including Cancer Cover,.*17\s*-\s*21 is \$?250,?000/i;
const RX_2M_CAP = /Trauma Recovery Cover, including Cancer Cover, is \$?2,?000,?000/i;

test.describe('Personal Lumpsum Standalone Cancer Cover (ACB-2928)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: All lump sum covers available; 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser/Adviser staff, When creating a new quote, Then I can apply for lumpsum cover.',
      'AC02: Given the Lump Sum Cover section, Then I can see Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, And select 1 or more covers.',
      '',
      'Steps to reproduce:',
      '1. Open a new Personal quote. 2. Check each lump sum cover button is present, then activate Cancer.',
      '',
      'Expected: all 7 lump sum cover buttons present; Cancer activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Cancer', 'Acd. Death', 'Needlestick', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Lump sum cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" cover present`).toBe(true);
    }
    await activateCover(quote, 'Cancer');
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Cancer is selectable (its Sum Insured field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: at least one cover (Cancer) is selectable').toBe(true);
  });

  test('AC03: Cancer exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70}', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Given the Lumpsum Cover section, When I select Cancer, Then I can enter the Sum Insured and select Premium Structure {Stepped(default), Level to 65, Level to 70}.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Cancer. 2. Read the SI field and Premium Structure options+default.',
      '',
      'Expected: SI field present; Premium Structure = [Stepped(default), Level to 65, Level to 70].',
    ].join('\n') });
    const quote = await freshCancerQuote(page);
    await waitForSettle(quote, 1000);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Cancer Sum Insured field is present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: Sum Insured field present').toBe(true);
    const struct = await getStructure(quote);
    recordCheck(testInfo, { label: 'Cancer Premium Structure default', expected: 'Stepped', actual: struct?.selected });
    expect(struct?.selected, 'AC03: Premium Structure default is Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'Cancer Premium Structure options', expected: 'Stepped, Level to 65, Level to 70', actual: (struct?.options || []).join(', ') });
    expect(struct?.options, 'AC03: Premium Structure options').toEqual(['Stepped', 'Level to 65', 'Level to 70']);
  });

  test('AC04: Cancer Stepped + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given Cancer, When ANB > 65 and Premium Structure is Stepped, Then error "The maximum age next birthday for stepped premium Cancer Cover is 65".',
      '', 'Steps to reproduce:', '1. New quote, ANB 66, activate Cancer (Stepped default), SI $100,000, Apply.',
      '', 'Expected: error containing "Stepped" and "Cancer Cover is 65".',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Cancer Stepped + ANB > 65', expected: 'stepped ... Cancer Cover is 65', actual: e });
    expect(/stepped.*Cancer Cover is 65/i.test(e), `AC04. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC04 boundary: Cancer Stepped max at ANB 65 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04 (at-boundary accept): Stepped max ANB is 65 — Cancer Stepped at exactly 65 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 65, activate Cancer (Stepped), SI $100,000, Apply.',
      '', 'Expected: NO "Stepped ... Cancer Cover is 65" error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 65, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /stepped.*Cancer Cover is 65/i.test(e);
    recordCheck(testInfo, { label: 'Cancer Stepped max at ANB 65 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC04 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC05: Cancer Level to 65 + ANB > 60 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given Cancer, When ANB > 60 and Premium Structure is Level to 65, Then error "The maximum age next birthday for Level to 65 Cancer Cover is 60".',
      '', 'Steps to reproduce:', '1. New quote, ANB 61, activate Cancer, SI $100,000, set Premium Structure = Level to 65, Apply.',
      '', 'Expected: error containing "Level to 65" and "60".',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setStructure(quote, 'Level to 65');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Cancer Level to 65 + ANB > 60', expected: 'Level to 65 ... 60', actual: e });
    expect(/Level to 65.*Cancer Cover is 60/i.test(e), `AC05. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC05 boundary: Cancer Level to 65 max at ANB 60 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05 (at-boundary accept): Level to 65 max ANB is 60 — at exactly 60 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 60, activate Cancer, SI $100,000, Premium Structure = Level to 65, Apply.',
      '', 'Expected: NO "Level to 65 ... 60" error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 60, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setStructure(quote, 'Level to 65');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Level to 65.*Cancer Cover is 60/i.test(e);
    recordCheck(testInfo, { label: 'Cancer Level to 65 max at ANB 60 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC05 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC06: Cancer Level to 70 + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given Cancer, When ANB > 65 and Premium Structure is Level to 70, Then error "The maximum age next birthday for Level to 70 Cancer Cover is 65".',
      '', 'Steps to reproduce:', '1. New quote, ANB 66, activate Cancer, SI $100,000, set Premium Structure = Level to 70, Apply.',
      '', 'Expected: error containing "Level to 70" and "65".',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setStructure(quote, 'Level to 70');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Cancer Level to 70 + ANB > 65', expected: 'Level to 70 ... 65', actual: e });
    expect(/Level to 70.*Cancer Cover is 65/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC06 boundary: Cancer Level to 70 max at ANB 65 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06 (at-boundary accept): Level to 70 max ANB is 65 — at exactly 65 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 65, activate Cancer, SI $100,000, Premium Structure = Level to 70, Apply.',
      '', 'Expected: NO "Level to 70 ... 65" error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 65, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setStructure(quote, 'Level to 70');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Level to 70.*Cancer Cover is 65/i.test(e);
    recordCheck(testInfo, { label: 'Cancer Level to 70 max at ANB 65 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC06 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC07: Cancer + ANB 17-21 + SI > $250,000 → young combined-cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given Cancer Cover, When ANB 17-21 and Sum Insured > 250000, Then error "The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000.".',
      '', 'Steps to reproduce:', '1. New quote, ANB 19, activate Cancer, SI $250,001, Apply.',
      '', 'Expected: the $250,000 young combined-cap error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '250001'); // $250,000 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Cancer ANB 17-21 + SI > $250k', expected: '17 - 21 is $250,000 (incl Cancer)', actual: e });
    expect(RX_YOUNG_CAP.test(e), `AC07. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC07 boundary: Cancer ANB 17-21 SI exactly $250,000 is accepted (no young-cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07 (at-boundary accept): the 17-21 cap is $250,000 — SI at exactly $250,000 must NOT raise the young-cap error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 19, activate Cancer, SI $250,000 exactly, Apply.',
      '', 'Expected: NO "$250,000" young-cap error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '250000'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = RX_YOUNG_CAP.test(e);
    recordCheck(testInfo, { label: 'Cancer ANB 17-21 SI exactly $250,000 accepted (no young-cap error)', expected: false, actual: hasCap });
    expect(hasCap, `AC07 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC08: Trauma + Cancer + ANB 17-21 + combined SI > $250,000 → young combined-cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Trauma & Cancer Cover, When ANB 17-21 and combined Sum Insured > 250000, Then the $250,000 combined-cap error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate Trauma SI $200,000, activate Cancer SI $100,000 (combined $300,000 > $250,000), Apply.',
      '',
      'Expected: the $250,000 combined-cap error. Arithmetic (Rule #8): $200k + $100k = $300k, clearly over $250k; each cover >= its own minimum.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 19, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 1), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Trauma+Cancer combined > $250k (ANB 17-21)', expected: '17 - 21 is $250,000 (incl Cancer)', actual: e });
    expect(RX_YOUNG_CAP.test(e), `AC08. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC09: Cancer + ANB 22-65 + SI > $2,000,000 → $2M cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given Cancer Cover, When ANB 22-65 (inclusive) and Sum Insured > 2000000, Then error "The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000.".',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, activate Cancer, SI $2,000,001, Apply.',
      '', 'Expected: the $2,000,000 cap error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '2000001'); // $2,000,000 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Cancer ANB 22-65 + SI > $2M', expected: 'including Cancer Cover, is $2,000,000', actual: e });
    expect(RX_2M_CAP.test(e), `AC09. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC09 boundary: Cancer ANB 22-65 SI exactly $2,000,000 is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09 (at-boundary accept): the 22-65 cap is $2,000,000 — SI at exactly $2,000,000 must NOT raise the cap error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, activate Cancer, SI $2,000,000 exactly, Apply.',
      '', 'Expected: NO "$2,000,000" cap error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '2000000'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = RX_2M_CAP.test(e);
    recordCheck(testInfo, { label: 'Cancer ANB 22-65 SI exactly $2,000,000 accepted (no cap error)', expected: false, actual: hasCap });
    expect(hasCap, `AC09 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC10: Cancer + ANB 22-65 + SI < $10,000 → minimum SI error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given Cancer Cover, When ANB 22-65 and Sum Insured < 10000 per policy, Then error "The minimum Cancer Cover sum insured is $10,000.".',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, activate Cancer, SI $9,000, Apply.',
      '', 'Expected: "The minimum Cancer Cover sum insured is $10,000." error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '9000'); // below the $10,000 minimum
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Cancer SI < $10,000', expected: 'minimum Cancer Cover sum insured is $10,000', actual: e });
    expect(/minimum Cancer Cover sum insured is \$?10,?000/i.test(e), `AC10. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10 boundary: Cancer SI exactly $10,000 is accepted (no min-SI error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10 (at-boundary accept): the minimum is $10,000 — SI at exactly $10,000 must NOT raise the min-SI error.',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, activate Cancer, SI $10,000 exactly, Apply.',
      '', 'Expected: NO "minimum Cancer Cover sum insured is $10,000" error.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '10000'); // exactly at the minimum
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Cancer Cover sum insured is \$?10,?000/i.test(e);
    recordCheck(testInfo, { label: 'Cancer SI exactly $10,000 accepted (no min-SI error)', expected: false, actual: hasErr });
    expect(hasErr, `AC10 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC11: Trauma + Cancer + ANB 22-65 + combined SI > $2,000,000 → $2M cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: Given Trauma & Cancer Cover, When ANB 22-65 and combined Sum Insured > 2000000, Then the $2,000,000 combined-cap error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma SI $1,500,000, activate Cancer SI $600,000 (combined $2,100,000 > $2,000,000), Apply.',
      '',
      'Expected: the $2,000,000 combined-cap error. Arithmetic (Rule #8): $1.5M + $0.6M = $2.1M > $2M; each >= its own minimum.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '1500000');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 1), '600000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Trauma+Cancer combined > $2M (ANB 22-65)', expected: 'including Cancer Cover, is $2,000,000', actual: e });
    expect(RX_2M_CAP.test(e), `AC11. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC12: Trauma + Major Trauma + Cancer + ANB 22-65 + combined SI > $2,000,000 → $2M cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: Given Trauma, Major Trauma & Cancer Cover, When ANB 22-65 and combined Sum Insured > 2000000, Then the $2,000,000 combined-cap error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma SI $1,500,000, activate Major Trauma SI $300,000, activate Cancer SI $600,000',
      '   (combined $2,400,000 > $2,000,000), Apply.',
      '',
      'Expected: the $2,000,000 combined-cap error. Arithmetic (Rule #8): $1.5M + $0.3M + $0.6M = $2.4M > $2M.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '1500000');
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '300000');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 2), '600000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Trauma+MajorTrauma+Cancer combined > $2M', expected: 'including Cancer Cover, is $2,000,000', actual: e });
    expect(RX_2M_CAP.test(e), `AC12. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC13: maximum 3 Cancer covers — "+Cancer" disabled after 3, re-enables on remove', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given I add 3 standalone Cancer covers, Then the +Cancer button is greyed out; And it re-enables when I remove one Cancer cover.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Cancer three times. 2. Check +Cancer disabled. 3. Remove one Cancer cover. 4. Check +Cancer re-enabled.',
      '',
      'Expected: disabled after 3, enabled again after removing one.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 1), '110000');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 2), '120000');
    await waitForSettle(quote, 1500);
    const isCancerDisabled = () => quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().split('\n')[0] === 'Cancer');
      return b ? (b.disabled || /disabled|is-disabled/.test(b.className)) : null;
    });
    const disabledAt3 = await isCancerDisabled();
    recordCheck(testInfo, { label: '+Cancer disabled after 3 Cancer covers', expected: true, actual: disabledAt3 });
    expect(disabledAt3, 'AC13: +Cancer disabled after 3').toBe(true);
    // Remove one Cancer cover.
    await quote.evaluate(() => {
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'Remove');
      if (link) link.click();
    });
    await waitForSettle(quote, 1500);
    const disabledAfterRemove = await isCancerDisabled();
    recordCheck(testInfo, { label: '+Cancer re-enabled after removing one (now 2 covers)', expected: false, actual: disabledAfterRemove });
    expect(disabledAfterRemove, 'AC13: +Cancer re-enabled after remove').toBe(false);
  });

  test('AC14: 2nd/3rd Cancer covers default to the next Premium Structure (Stepped → Level to 65 → Level to 70)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC14: Given a Cancer cover exists, When I add a second/third, Then the default Premium Structure is the next available (1st=Stepped, 2nd=Level to 65, 3rd=Level to 70), and I can still change it.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Cancer (read default structure #0). 2. Add 2nd Cancer (read #1). 3. Add 3rd Cancer (read #2).',
      '',
      'Expected: defaults Stepped / Level to 65 / Level to 70 in that order (confirmed via probe 2026-09-04).',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await waitForSettle(quote, 1000);
    const d1 = (await getStructure(quote, 0))?.selected;
    recordCheck(testInfo, { label: '1st Cancer cover default Premium Structure', expected: 'Stepped', actual: d1 });
    expect(d1, 'AC14: 1st Cancer default = Stepped').toBe('Stepped');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 1), '110000');
    await waitForSettle(quote, 1500);
    const d2 = (await getStructure(quote, 1))?.selected;
    recordCheck(testInfo, { label: '2nd Cancer cover default Premium Structure', expected: 'Level to 65', actual: d2 });
    expect(d2, 'AC14: 2nd Cancer default = Level to 65').toBe('Level to 65');
    await activateCover(quote, 'Cancer');
    await fillCalcMask(sumInsuredInput(quote, 2), '120000');
    await waitForSettle(quote, 1500);
    const d3 = (await getStructure(quote, 2))?.selected;
    recordCheck(testInfo, { label: '3rd Cancer cover default Premium Structure', expected: 'Level to 70', actual: d3 });
    expect(d3, 'AC14: 3rd Cancer default = Level to 70').toBe('Level to 70');
    // ...and it's still changeable (change #2 back to Stepped).
    await setStructure(quote, 'Stepped', 2);
    const changed = (await getStructure(quote, 2))?.selected;
    recordCheck(testInfo, { label: '3rd Cancer Premium Structure is still changeable', expected: 'Stepped', actual: changed });
    expect(changed, 'AC14: structure remains user-changeable').toBe('Stepped');
  });

  test('AC15: Sum Insured "?" tooltip shows the Cancer discount-bands text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15: Given the Cancer cover section, When I click the "?" icon next to Sum Insured, Then the tooltip shows the discount bands: $100,000-$249,999 / $250,000+.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Cancer. 2. Click the "?" icon next to Sum Insured; read the tooltip.',
      '',
      'Expected: tooltip lists the Cancer discount bands.',
    ].join('\n') });
    const quote = await freshCancerQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await waitForSettle(quote, 1000);
    await quote.evaluate(() => {
      const icon = [...document.querySelectorAll('i, span, a')].find((el) => /fa-question|help/i.test(el.className || '') || (el.innerText || '').trim() === '?');
      if (icon) icon.click();
    });
    await waitForSettle(quote, 800);
    const bandText = await quote.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find((e) => /large sum insured discount bands for Cancer/i.test(e.innerText || ''));
      return el ? el.innerText.trim() : (document.body.innerText.match(/discount bands for Cancer[\s\S]{0,140}/i)?.[0] || null);
    });
    recordCheck(testInfo, { label: 'Cancer Sum Insured tooltip lists the discount bands', expected: 'contains $100,000-$249,999 / $250,000+', actual: bandText });
    expect(bandText, 'AC15: Cancer discount-bands tooltip present').toMatch(/\$100,?000\s*-\s*\$?249,?999/i);
  });
});

// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/lump-sum-covers/page.md
// Source user story: docs/user-stories/User Story- Personal Lump Sum Standalone Trauma Cover and Additional Covers.md (Jira ACB-2926)
// Acceptance-criteria mode — story values are the source of truth; a mismatch is a candidate defect.
//
// Generated from the user story using accumulated app context (helpers + LSC- business rules) —
// no fresh exploration. Trauma reuses the same patterns as Life: cover button, SI calc-mask,
// Premium Structure select (fingerprint-located), Apply-time error banners.
//
// Independent AC checks run in parallel (each opens its own fresh quote).
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  coverButtonExists,
  removeAllCoverCards,
  fillCalcMask,
  sumInsuredInput,
  getTotalYearlyPremium,
  getVisibleErrors,
  clickApply,
  waitForSettle,
  getCheckboxStateByLabel,
  tickCheckboxByLabel,
  getTpdOnTraumaDefinition,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Trauma Premium Structure select: fingerprint by its distinctive 3-option set.
async function getTraumaStructureId(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.includes('Stepped') && o.includes('Level to 65') && o.includes('Level to 70') && !o.some((t) => t === 'Level to 100');
    });
    return sel ? sel.id : null;
  });
}
async function setTraumaStructure(page, label) {
  const id = await getTraumaStructureId(page);
  if (!id) throw new Error('Trauma Premium Structure select not found');
  await page.locator(`[id="${id}"]`).selectOption({ label });
  await waitForSettle(page, 1000);
}
async function getTraumaStructureDefault(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.includes('Stepped') && o.includes('Level to 65') && o.includes('Level to 70') && !o.some((t) => t === 'Level to 100');
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) } : null;
  });
}

async function freshTraumaQuote(page, personal) {
  return test.step('open fresh quote + activate Trauma', async () => {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, personal || { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Trauma');
    return quote;
  });
}

test.describe('Personal Lump Sum Trauma Cover', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: All lump sum covers available; 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new quote, Then I can apply for lump sum cover.',
      'AC02: Given the Lump Sum Cover section, Then I can see Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, and select 1 or more.',
      '',
      'Steps to reproduce:',
      '1. Open a new Personal quote.',
      '2. Check each lump sum cover button is present.',
      '',
      'Expected: all 7 lump sum cover buttons present.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    for (const c of ['Life', 'TPD', 'Trauma', 'Cancer', 'Acd. Death', 'Needlestick', 'Specific Injury']) {
      const present = await coverButtonExists(quote, c);
      recordCheck(testInfo, { label: `Lump sum cover "${c}" button present`, expected: true, actual: present });
      expect(present, `AC02: "${c}" cover button present`).toBe(true);
    }
  });

  test('AC03: Trauma exposes SI + Premium Structure (Stepped default; Stepped/Level to 65/70)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Given the Lump Sum Cover section, When I select Trauma, Then I can enter Sum Insured; select Premium Structure {Stepped (default), Level to 65, Level to 70}; choose optional benefits (Early Trauma, Trauma Reinstatement, Continuous Trauma); and view additional covers (Major Trauma, TPD on Trauma).',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate Trauma.',
      '2. Check SI field present; Premium Structure options + default; Major Trauma / TPD on Trauma sub-cover buttons present.',
      '',
      'Expected: SI present; structure = {Stepped, Level to 65, Level to 70} default Stepped; Major Trauma + TPD on Trauma buttons present.',
    ].join('\n') });
    const quote = await freshTraumaQuote(page);
    expect(await sumInsuredInput(quote, 0).isVisible(), 'AC03: Trauma SI field present').toBe(true);
    const structure = await getTraumaStructureDefault(quote);
    expect(structure, 'AC03: Trauma Premium Structure select present').not.toBeNull();
    recordCheck(testInfo, { label: 'Trauma Premium Structure default value', expected: 'Stepped', actual: structure.selected });
    expect(structure.selected, 'AC03: default Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'Trauma Premium Structure has Stepped/Level to 65/Level to 70 options', expected: 3, actual: structure.options.filter((o) => /Stepped|Level to 65|Level to 70/.test(o)).length });
    expect(structure.options.filter((o) => /Stepped|Level to 65|Level to 70/.test(o)).length, 'AC03: has Stepped/Level to 65/Level to 70').toBeGreaterThanOrEqual(3);
    expect(await coverButtonExists(quote, 'Major Trauma'), 'AC03: Major Trauma sub-cover present').toBe(true);
    expect(await coverButtonExists(quote, 'TPD on Trauma'), 'AC03: TPD on Trauma sub-cover present').toBe(true);
  });

  test('AC06: Trauma + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given Trauma Cover, When age next birthday is less than 17, Then error "The minimum Age Next Birthday for Trauma Recovery Cover is 17".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 16, activate Trauma, SI $100,000, Apply.',
      '',
      'Expected: error "minimum Age Next Birthday for Trauma Recovery Cover is 17".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Trauma ANB < 17', expected: 'minimum Age Next Birthday for Trauma Recovery Cover is 17', actual: e });
    expect(/minimum Age Next Birthday for Trauma Recovery Cover is 17/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07: Trauma Stepped + ANB > 70 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given Trauma Cover, When ANB > 70 and Premium Structure is Stepped, Then error "The maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 71, activate Trauma (Stepped default), SI $100,000, Apply.',
      '',
      'Expected: error "maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 71, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Trauma Stepped + ANB > 70', expected: 'maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70', actual: e });
    expect(/maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08: Trauma Level to 65 + ANB > 60 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Trauma Cover, When ANB > 60 and Premium Structure is Level to 65, Then error "The maximum age next birthday for Level to 65 Trauma Recovery cover is 60".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 61, activate Trauma, SI $100,000, set Premium Structure = Level to 65, Apply.',
      '',
      'Expected: error containing "Level to 65 Trauma Recovery cover is 60".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTraumaStructure(quote, 'Level to 65');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Trauma Level to 65 + ANB > 60', expected: 'Level to 65 Trauma Recovery cover is 60', actual: e });
    expect(/Level to 65 Trauma Recovery cover is 60/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC09: Trauma Level to 70 + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given Trauma Cover, When ANB > 65 and Premium Structure is Level to 70, Then error "The maximum age next birthday for Level to 70 Trauma Recovery cover is 65".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 66, activate Trauma, SI $100,000, set Premium Structure = Level to 70, Apply.',
      '',
      'Expected: error containing "Level to 70 Trauma Recovery cover is 65".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTraumaStructure(quote, 'Level to 70');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Trauma Level to 70 + ANB > 65', expected: 'Level to 70 Trauma Recovery cover is 65', actual: e });
    expect(/Level to 70 Trauma Recovery cover is 65/i.test(e), `AC09. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  // AC06-AC09 boundary: the AT-boundary ACCEPT side. Each Trauma age limit must ACCEPT the value
  // at the boundary (mandatory 2026-09-03; previously only the failing side was tested).
  //   - min age 17 (accepted, vs 16 rejected by AC06)
  //   - Stepped max 70 (accepted at 70, vs 71 rejected by AC07)
  //   - Level to 65 max 60 (accepted at 60, vs 61 rejected by AC08)
  //   - Level to 70 max 65 (accepted at 65, vs 66 rejected by AC09)
  const traumaAgeAccept = [
    { ac: 'AC06', label: 'min age', age: 17, structure: null, badMsg: /minimum Age Next Birthday for Trauma Recovery Cover is 17/i },
    { ac: 'AC07', label: 'Stepped max', age: 70, structure: null, badMsg: /maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70/i },
    { ac: 'AC08', label: 'Level to 65 max', age: 60, structure: 'Level to 65', badMsg: /Level to 65 Trauma Recovery cover is 60/i },
    { ac: 'AC09', label: 'Level to 70 max', age: 65, structure: 'Level to 70', badMsg: /Level to 70 Trauma Recovery cover is 65/i },
  ];
  for (const c of traumaAgeAccept) {
    test(`${c.ac} boundary: Trauma ${c.label} at ANB ${c.age} is accepted (no age error)`, async ({ page }, testInfo) => {
      test.info().annotations.push({ type: 'acceptance-criteria', description: [
        `${c.ac} boundary (accept side): Trauma at ANB exactly ${c.age} (${c.label}) must be ACCEPTED — the`,
        'corresponding age error must NOT fire. Complements the failing-side test above.',
        '',
        'Steps to reproduce:',
        `1. New quote, ANB ${c.age}, activate Trauma, SI $100,000${c.structure ? `, set Premium Structure = ${c.structure}` : ' (Stepped default)'}.`,
        '2. Click Apply.',
        '',
        `Expected: NO "${c.label}" Trauma age error at ANB ${c.age}.`,
      ].join('\n') });
      const quote = await freshTraumaQuote(page, { age: c.age, gender: 'Male', occupationCode: '1' });
      await fillCalcMask(sumInsuredInput(quote, 0), '100000');
      if (c.structure) await setTraumaStructure(quote, c.structure);
      await clickApply(quote);
      const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
      const hasAgeErr = c.badMsg.test(e);
      recordCheck(testInfo, { label: `Trauma ${c.label} at ANB ${c.age} accepted (no age error)`, expected: false, actual: hasAgeErr });
      expect(hasAgeErr, `${c.ac} boundary: ANB ${c.age} must be accepted for Trauma ${c.label}. Errors: ${e.slice(0, 200)}`).toBe(false);
    });
  }

  test('AC10: Trauma + ANB 17-21 + SI > $250k → young combined cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given Trauma Cover, When ANB 17-21 and Sum Insured > 250000, Then error "The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate Trauma, SI $250,001, Apply.',
      '',
      'Expected: error containing "Age Next Birthday 17 - 21 is $250,000".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '250001');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    const ok = /Trauma Recovery Cover/i.test(e) && /Age Next Birthday 17\s*-\s*21 is \$?250,?000/i.test(e);
    recordCheck(testInfo, { label: 'Error shown for Trauma ANB 17-21 + SI > $250k', expected: 'Trauma Recovery Cover ... Age Next Birthday 17 - 21 is $250,000', actual: e });
    expect(ok, `AC10. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC14: Trauma + ANB 22-70 + SI > $2M → $2M combined cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC14: Given Trauma Cover, When ANB 22-70 and combined SI > 2,000,000, Then error "The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $2,000,001, Apply.',
      '',
      'Expected: error containing "Trauma Recovery Cover, including Cancer Cover, is $2,000,000".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '2000001');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Trauma ANB 22-70 + SI > $2M', expected: 'Trauma Recovery Cover, including Cancer Cover, is $2,000,000', actual: e });
    expect(/Trauma Recovery Cover, including Cancer Cover, is \$?2,?000,?000/i.test(e), `AC14. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC21: Trauma + ANB 22-70 + SI < $5,000 → minimum SI error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC21: Given Trauma Cover, When ANB 22-70 and Sum Insured < 5000, Then error "The minimum Trauma Cover sum insured is $5,000.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $4,000, Apply.',
      '',
      'Expected: error containing "minimum Trauma Cover sum insured is $5,000".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '4000');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Trauma ANB 22-70 + SI < $5,000', expected: 'minimum Trauma Cover sum insured is $5,000', actual: e });
    expect(/minimum Trauma Cover sum insured is \$?5,?000/i.test(e), `AC21. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10/AC14/AC21 boundary: SI exactly at each Trauma cap is accepted', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'Boundary accept side for the Trauma Sum Insured caps (complements the over/under error tests):',
      '- AC10: ANB 17-21, SI exactly $250,000 is ACCEPTED (vs $250,001 rejected).',
      '- AC14: ANB 22-70, SI exactly $2,000,000 is ACCEPTED (vs $2,000,001 rejected).',
      '- AC21: ANB 22-70, SI exactly $5,000 is ACCEPTED (vs $4,000 rejected).',
      '',
      'Expected: none of the corresponding cap/min errors fire at the exact boundary value.',
    ].join('\n') });
    // AC10 accept: $250,000 at ANB 19
    let quote = await freshTraumaQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '250000');
    await clickApply(quote);
    let e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    let hasErr = /Age Next Birthday 17\s*-\s*21 is \$?250,?000/i.test(e);
    recordCheck(testInfo, { label: 'AC10 boundary: SI $250,000 at ANB 17-21 accepted (no cap error)', expected: false, actual: hasErr });
    expect(hasErr, `AC10 boundary: $250,000 must be accepted. Errors: ${e.slice(0, 200)}`).toBe(false);
    // AC14 accept: $2,000,000 at ANB 40
    quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '2000000');
    await clickApply(quote);
    e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    hasErr = /Trauma Recovery Cover, including Cancer Cover, is \$?2,?000,?000/i.test(e);
    recordCheck(testInfo, { label: 'AC14 boundary: SI $2,000,000 at ANB 22-70 accepted (no cap error)', expected: false, actual: hasErr });
    expect(hasErr, `AC14 boundary: $2,000,000 must be accepted. Errors: ${e.slice(0, 200)}`).toBe(false);
    // AC21 accept: $5,000 at ANB 40 (min SI). Note a $5k Trauma SI may trip the $240 min-premium
    // rule — assert specifically that the MIN-SI error is absent (the boundary under test).
    quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await clickApply(quote);
    e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    hasErr = /minimum Trauma Cover sum insured is \$?5,?000/i.test(e);
    recordCheck(testInfo, { label: 'AC21 boundary: SI $5,000 at ANB 22-70 accepted (no min-SI error)', expected: false, actual: hasErr });
    expect(hasErr, `AC21 boundary: $5,000 must be accepted (no min-SI error). Errors: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC23 boundary: Major Trauma SI exactly 3x Trauma SI is accepted (at the cap)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC23 boundary (accept side): Major Trauma SI is capped at 3x the Trauma SI. At EXACTLY 3x it must',
      'be ACCEPTED — the "maximum Sum Insured for Major Trauma Benefit" error must NOT fire. Complements',
      'the > 3x error test (Trauma $20,000 → Major Trauma $60,001 rejected; $60,000 accepted).',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $20,000.',
      '2. Activate Major Trauma, enter SI $60,000 (exactly 3 x $20,000).',
      '',
      'Expected: NO "maximum Sum Insured for Major Trauma Benefit" error.',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Female', occupationCode: '4' });
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '60000'); // exactly 3x
    await waitForSettle(quote, 1000);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    const hasErr = /maximum Sum Insured for Major Trauma Benefit/i.test(e);
    recordCheck(testInfo, { label: 'AC23 boundary: Major Trauma SI = 3x Trauma SI accepted (no 300% cap error)', expected: false, actual: hasErr });
    expect(hasErr, `AC23 boundary: Major Trauma $60,000 (=3x $20,000) must be accepted. Errors: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC23: Major Trauma SI > 3x Trauma SI (TRC < $25k) → 300% cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC23: Given Trauma + Major Trauma, When standalone Trauma SI < $25,000 and Major Trauma SI exceeds 3x the Trauma SI, Then error "The maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $XXXX is $YYYY." (YYYY = XXXX x 3).',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $20,000.',
      '2. Activate Major Trauma, enter SI $60,001 (> 3 x $20,000 = $60,000).',
      '3. Read the error.',
      '',
      'Expected: error containing "maximum Sum Insured for Major Trauma Benefit".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Female', occupationCode: '4' });
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '60001');
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Major Trauma SI > 3x Trauma SI', expected: 'maximum Sum Insured for Major Trauma Benefit', actual: e });
    expect(/maximum Sum Insured for Major Trauma Benefit/i.test(e), `AC23. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC22: Trauma + Major Trauma + Major Trauma SI < $5,000 → min Major Trauma SI error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC22: Given Trauma + Major Trauma, When ANB 22-70 and Major Trauma Sum Insured < 5000, Then error "The minimum Major Trauma Benefit sum insured is $5,000.".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $100,000.',
      '2. Activate Major Trauma, SI $4,000, Apply.',
      '',
      'Expected: error containing "minimum Major Trauma Benefit sum insured is $5,000".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '4000');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for Major Trauma SI < $5,000', expected: 'minimum Major Trauma Benefit sum insured is $5,000', actual: e });
    expect(/minimum Major Trauma Benefit sum insured is \$?5,?000/i.test(e), `AC22. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC18: Maximum 3 Trauma covers — +Trauma button disabled after 3', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC18: Given multiple Trauma covers, When I select up to a maximum of 3 Trauma covers, Then the "+Trauma" button must be greyed out and disabled.',
      '',
      'Steps to reproduce:',
      '1. New quote, activate Trauma three times (filling each SI).',
      '2. Check the Trauma button is disabled after the 3rd.',
      '',
      'Expected: Trauma button disabled after 3 covers.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    for (let i = 0; i < 3; i++) {
      await activateCover(quote, 'Trauma');
      await fillCalcMask(sumInsuredInput(quote, i), String(100000 + i * 10000)).catch(() => {});
    }
    const disabled = await quote.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Trauma');
      if (!btn) return null;
      return btn.disabled || btn.getAttribute('aria-disabled') === 'true' || (btn.className || '').toLowerCase().includes('disabled');
    });
    recordCheck(testInfo, { label: 'Trauma cover button disabled after 3 covers added', expected: true, actual: disabled });
    expect(disabled, 'AC18: Trauma button disabled after 3').toBe(true);
  });

  test('AC25: TPD on Trauma + ANB < 17 → min age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC25: Given Trauma Cover, When ANB < 17 and I select TPD on Trauma, Then error "The minimum Age Next Birthday for TPD on Trauma is 17".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 16, activate Trauma, SI $100,000.',
      '2. Activate TPD on Trauma sub-cover, Apply.',
      '',
      'Expected: error containing "minimum Age Next Birthday for TPD on Trauma is 17".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'TPD on Trauma');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for TPD on Trauma ANB < 17', expected: 'minimum Age Next Birthday for TPD on Trauma is 17', actual: e });
    expect(/minimum Age Next Birthday for TPD on Trauma is 17/i.test(e), `AC25. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC26: TPD on Trauma + ANB > 60 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC26: Given Trauma Cover, When ANB > 60 and I select TPD on Trauma, Then error "The maximum Age Next Birthday for TPD on Trauma is 60".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 61, activate Trauma, SI $100,000.',
      '2. Activate TPD on Trauma, Apply.',
      '',
      'Expected: error containing "maximum Age Next Birthday for TPD on Trauma is 60".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'TPD on Trauma');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for TPD on Trauma ANB > 60', expected: 'maximum Age Next Birthday for TPD on Trauma is 60', actual: e });
    expect(/maximum Age Next Birthday for TPD on Trauma is 60/i.test(e), `AC26. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC04: Major Trauma inherits Premium Structure from Trauma + own SI field', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given Trauma Cover, When I select Major Trauma, Then I can enter its Sum Insured, And its Premium Structure is pre-populated the same as Trauma Cover.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $100,000.',
      '2. Activate Major Trauma.',
      '3. Confirm a 2nd SI field appears and the structure matches Trauma (Stepped).',
      '',
      'Expected: Major Trauma has its own SI; structure = Stepped (mirrors Trauma).',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'Major Trauma');
    expect(await sumInsuredInput(quote, 1).isVisible(), 'AC04: Major Trauma SI field present').toBe(true);
    // Major Trauma structure is locked to Stepped (matches Trauma default) — LSC-18.
    const mtStepped = await quote.evaluate(() => {
      const sels = [...document.querySelectorAll('select')].filter((s) => { const o = [...s.options].map((x) => x.text.trim()); return o.length === 1 && o[0] === 'Stepped'; });
      return sels.length > 0;
    });
    recordCheck(testInfo, { label: 'Major Trauma Premium Structure mirrors Trauma (Stepped)', expected: true, actual: mtStepped });
    expect(mtStepped, 'AC04: Major Trauma Premium Structure = Stepped (mirrors Trauma)').toBe(true);
  });

  test('AC05/AC27: TPD on Trauma exposes SI + structure + Definition {Own default, Any}', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given Trauma Cover, When I select TPD on Trauma, Then I see SI (same as Trauma), Premium Structure (same as Trauma), and a Definition dropdown {Own (default), Any}.',
      'AC27: Given Trauma Cover, When ANB 17-21 and I select TPD on Trauma and definition is not Modified TPD, Then error "Age Next Birthday 17-21 is only eligible for Modified TPD".',
      '',
      'Steps to reproduce (AC05):',
      '1. New quote, ANB 40, activate Trauma, SI $100,000.',
      '2. Activate TPD on Trauma.',
      '3. Confirm Definition dropdown = {Own (default), Any}.',
      '',
      'Expected (AC05): Definition present, default Own, options Own/Any.',
      'NOTE on AC27: the Definition dropdown offers only {Own, Any} — there is NO "Modified" option, so the AC27 scenario (non-Modified at 17-21 → error) cannot select Modified. AC27 is encoded separately below as expected-behaviour check.',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'TPD on Trauma');
    const def = await getTpdOnTraumaDefinition(quote);
    expect(def, 'AC05: TPD on Trauma Definition dropdown present').not.toBeNull();
    recordCheck(testInfo, { label: 'TPD on Trauma Definition default value', expected: 'Own', actual: def.selected });
    expect(def.selected, 'AC05: Definition default Own').toBe('Own');
    recordCheck(testInfo, { label: 'TPD on Trauma Definition options', expected: ['Own', 'Any'], actual: def.options });
    expect(def.options.includes('Own') && def.options.includes('Any'), 'AC05: Definition options include Own and Any').toBe(true);
  });

  test('AC27: ANB 17-21 + TPD on Trauma (non-Modified) → Modified-TPD eligibility error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC27: Given Trauma Cover, When ANB 17-21 and I select TPD on Trauma and definition is not Modified TPD, Then error "Age Next Birthday 17-21 is only eligible for Modified TPD".',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 19, activate Trauma, SI $100,000.',
      '2. Activate TPD on Trauma (Definition defaults to Own — not Modified).',
      '3. Apply.',
      '',
      'Expected: error containing "only eligible for Modified TPD".',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await activateCover(quote, 'TPD on Trauma');
    await clickApply(quote);
    const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'Error shown for ANB 17-21 + TPD on Trauma (non-Modified)', expected: 'only eligible for Modified TPD', actual: e });
    expect(/only eligible for Modified TPD/i.test(e), `AC27. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC20: Trauma Reinstatement and Continuous Trauma are mutually exclusive', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC20: Given AC03 active, When I select Trauma Reinstatement OR Continuous Trauma Benefit, Then the other must be greyed out/disabled — both cannot be selected simultaneously.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma.',
      '2. Tick Trauma Reinstatement.',
      '3. Check Continuous Trauma Benefit is now disabled.',
      '',
      'Expected: ticking one disables the other.',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await tickCheckboxByLabel(quote, 'Trauma Reinstatement');
    const continuous = await getCheckboxStateByLabel(quote, 'Continuous Trauma');
    expect(continuous, 'AC20: Continuous Trauma checkbox present').not.toBeNull();
    recordCheck(testInfo, { label: 'Continuous Trauma disabled after selecting Trauma Reinstatement', expected: true, actual: continuous.disabled });
    expect(continuous.disabled, 'AC20: Continuous Trauma disabled after selecting Reinstatement').toBe(true);
  });

  // AC11-AC13, AC15-AC17: combined-cap variants (Trauma + Cancer / + Major Trauma) at the two age bands.
  const combined = [
    { ac: 'AC11', age: 19, covers: ['Cancer'], sis: ['250000', '1'], cap: '250,000', msg: /Age Next Birthday 17\s*-\s*21 is \$?250,?000/i },
    { ac: 'AC12', age: 19, covers: ['Major Trauma'], sis: ['200000', '100000'], cap: '250,000', msg: /Age Next Birthday 17\s*-\s*21 is \$?250,?000/i },
    { ac: 'AC15', age: 40, covers: ['Cancer'], sis: ['1500000', '600000'], cap: '2,000,000', msg: /Trauma Recovery Cover, including Cancer Cover, is \$?2,?000,?000/i },
    { ac: 'AC16', age: 40, covers: ['Major Trauma'], sis: ['1500000', '600000'], cap: '2,000,000', msg: /including Cancer Cover, is \$?2,?000,?000/i },
  ];
  for (const c of combined) {
    test(`${c.ac}: Trauma + ${c.covers.join(' + ')} combined SI over $${c.cap} (ANB ${c.age}) → cap error`, async ({ page }, testInfo) => {
      test.info().annotations.push({ type: 'acceptance-criteria', description: [
        `${c.ac}: Given Trauma + ${c.covers.join(' + ')}, When ANB ${c.age <= 21 ? '17-21' : '22-70'} and combined Sum Insured exceeds $${c.cap}, Then the combined-cap error is displayed.`,
        '',
        'Steps to reproduce:',
        `1. New quote, ANB ${c.age}, activate Trauma, SI $${c.sis[0]}.`,
        `2. Activate ${c.covers.join(' + ')}, SI $${c.sis[1]} (combined > $${c.cap}).`,
        '3. Read the error (Apply if needed).',
        '',
        `Expected: combined-cap error mentioning $${c.cap}.`,
      ].join('\n') });
      const quote = await freshTraumaQuote(page, { age: c.age, gender: 'Male', occupationCode: '1' });
      await fillCalcMask(sumInsuredInput(quote, 0), c.sis[0]);
      for (const cover of c.covers) await activateCover(quote, cover);
      await fillCalcMask(sumInsuredInput(quote, 1), c.sis[1]);
      await clickApply(quote);
      const e = await getVisibleErrors(quote).then((x) => x.join(' | '));
      recordCheck(testInfo, { label: `Error shown for Trauma + ${c.covers.join(' + ')} combined SI over $${c.cap} (ANB ${c.age})`, expected: `combined-cap error mentioning $${c.cap}`, actual: e });
      expect(c.msg.test(e), `${c.ac}: expected $${c.cap} cap error. Got: ${e.slice(0, 250)}`).toBe(true);
    });
  }

  test('AC24: Sum Insured "?" tooltip shows the Trauma discount-bands text', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC24: Given the Trauma cover section, When I click the "?" icon next to a label, Then the corresponding tooltip is displayed. (Checked for the Sum Insured tooltip: discount bands $100,000-$249,999 / $250,000-$499,999 / $500k+.)',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma.',
      '2. Hover/click the "?" next to Sum Insured.',
      '3. Read the tooltip text.',
      '',
      'Expected: tooltip mentions the Trauma discount bands (e.g. "$250,000").',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    // Tooltip text may render in the DOM (title attr / hidden tooltip node). Search for the
    // discount-band phrase anywhere on the page after activating Trauma.
    const hasTooltipText = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title')).join(' ');
      const hay = (body + ' ' + titles).toLowerCase();
      return hay.includes('discount band') || (hay.includes('$250,000') && hay.includes('$500'));
    });
    expect(hasTooltipText, 'AC24: Trauma Sum Insured discount-band tooltip text present in DOM').toBe(true);
  });

  test('AC19: Trauma cover can be added and removed, premium reflects it', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19: When I select the cover type, Then I can add/remove/update it and view premium changes.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 40, activate Trauma, SI $100,000 (premium > 0).',
      '2. Remove the cover; premium clears.',
      '',
      'Expected: add → premium > 0; remove → premium cleared.',
    ].join('\n') });
    const quote = await freshTraumaQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    const premiumAfterAdd = await getTotalYearlyPremium(quote);
    recordCheck(testInfo, { label: 'Yearly premium after adding Trauma cover', expected: 'greater than 0', actual: premiumAfterAdd });
    expect(premiumAfterAdd, 'AC19: premium after add').toBeGreaterThan(0);
    await removeAllCoverCards(quote);
    const after = await getTotalYearlyPremium(quote);
    recordCheck(testInfo, { label: 'Yearly premium after removing Trauma cover', expected: 'null or 0', actual: after });
    expect(after === null || after === 0, 'AC19: premium cleared after remove').toBe(true);
  });

  // AC13 & AC17: triple-cover combined-cap variants (Trauma + Major Trauma + Cancer) carrying a
  // distinct message ("...Trauma Recovery Cover, Major Trauma, including Cancer Cover..."). Not yet
  // encoded — flagged in the audit as silently-omitted. Deferred (not silently dropped) pending a
  // probe to capture the exact triple-cover message + the SI split that triggers it at each band.
  test('AC13: Trauma + Major Trauma + Cancer combined SI over $250k (ANB 17-21) → triple-cover cap error', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given Trauma + Major Trauma + Cancer, When ANB 17-21 and combined SI > $250,000, Then the',
      'triple-cover combined-cap error ("Trauma Recovery Cover, Major Trauma, including Cancer Cover ...',
      '$250,000") is displayed.',
      '',
      'Deferred: needs a probe to capture the exact triple-cover message and the SI split that triggers',
      'it (distinct from the two-cover AC11/AC12 message already tested). Encode after probing.',
    ].join('\n') });
    test.fixme(true, 'Needs a probe to capture the exact Trauma+MajorTrauma+Cancer triple-cover $250k message (see exhaustive-coverage-audit-2026-09-03.md).');
  });

  test('AC17: Trauma + Major Trauma + Cancer combined SI over $2M (ANB 22-70) → triple-cover cap error', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17: Given Trauma + Major Trauma + Cancer, When ANB 22-70 and combined SI > $2,000,000, Then the',
      'triple-cover combined-cap error ("Trauma Recovery Cover, Major Trauma, including Cancer Cover ...',
      '$2,000,000") is displayed.',
      '',
      'Deferred: needs a probe to capture the exact triple-cover message and the SI split that triggers',
      'it (distinct from the two-cover AC15/AC16 message already tested). Encode after probing.',
    ].join('\n') });
    test.fixme(true, 'Needs a probe to capture the exact Trauma+MajorTrauma+Cancer triple-cover $2M message (see exhaustive-coverage-audit-2026-09-03.md).');
  });

});

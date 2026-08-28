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
} = require('../../helpers/quote-helpers');

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

  test('AC01/AC02: All lump sum covers available; 1+ selectable', async ({ page }) => {
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
      expect(await coverButtonExists(quote, c), `AC02: "${c}" cover button present`).toBe(true);
    }
  });

  test('AC03: Trauma exposes SI + Premium Structure (Stepped default; Stepped/Level to 65/70)', async ({ page }) => {
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
    expect(structure.selected, 'AC03: default Stepped').toBe('Stepped');
    expect(structure.options.filter((o) => /Stepped|Level to 65|Level to 70/.test(o)).length, 'AC03: has Stepped/Level to 65/Level to 70').toBeGreaterThanOrEqual(3);
    expect(await coverButtonExists(quote, 'Major Trauma'), 'AC03: Major Trauma sub-cover present').toBe(true);
    expect(await coverButtonExists(quote, 'TPD on Trauma'), 'AC03: TPD on Trauma sub-cover present').toBe(true);
  });

  test('AC06: Trauma + ANB < 17 → minimum age error', async ({ page }) => {
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
    expect(/minimum Age Next Birthday for Trauma Recovery Cover is 17/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07: Trauma Stepped + ANB > 70 → max age error', async ({ page }) => {
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
    expect(/maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08: Trauma Level to 65 + ANB > 60 → max age error', async ({ page }) => {
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
    expect(/Level to 65 Trauma Recovery cover is 60/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC09: Trauma Level to 70 + ANB > 65 → max age error', async ({ page }) => {
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
    expect(/Level to 70 Trauma Recovery cover is 65/i.test(e), `AC09. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10: Trauma + ANB 17-21 + SI > $250k → young combined cap error', async ({ page }) => {
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
    expect(ok, `AC10. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC14: Trauma + ANB 22-70 + SI > $2M → $2M combined cap error', async ({ page }) => {
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
    expect(/Trauma Recovery Cover, including Cancer Cover, is \$?2,?000,?000/i.test(e), `AC14. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC21: Trauma + ANB 22-70 + SI < $5,000 → minimum SI error', async ({ page }) => {
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
    expect(/minimum Trauma Cover sum insured is \$?5,?000/i.test(e), `AC21. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC23: Major Trauma SI > 3x Trauma SI (TRC < $25k) → 300% cap error', async ({ page }) => {
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
    expect(/maximum Sum Insured for Major Trauma Benefit/i.test(e), `AC23. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC22: Trauma + Major Trauma + Major Trauma SI < $5,000 → min Major Trauma SI error', async ({ page }) => {
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
    expect(/minimum Major Trauma Benefit sum insured is \$?5,?000/i.test(e), `AC22. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC18: Maximum 3 Trauma covers — +Trauma button disabled after 3', async ({ page }) => {
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
    expect(disabled, 'AC18: Trauma button disabled after 3').toBe(true);
  });

  test('AC25: TPD on Trauma + ANB < 17 → min age error', async ({ page }) => {
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
    expect(/minimum Age Next Birthday for TPD on Trauma is 17/i.test(e), `AC25. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC26: TPD on Trauma + ANB > 60 → max age error', async ({ page }) => {
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
    expect(/maximum Age Next Birthday for TPD on Trauma is 60/i.test(e), `AC26. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC19: Trauma cover can be added and removed, premium reflects it', async ({ page }) => {
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
    expect(await getTotalYearlyPremium(quote), 'AC19: premium after add').toBeGreaterThan(0);
    await removeAllCoverCards(quote);
    const after = await getTotalYearlyPremium(quote);
    expect(after === null || after === 0, 'AC19: premium cleared after remove').toBe(true);
  });

});

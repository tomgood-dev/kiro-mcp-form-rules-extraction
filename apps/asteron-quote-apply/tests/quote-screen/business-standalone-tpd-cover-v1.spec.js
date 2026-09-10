// Business Policy Lumpsum Standalone TPD Cover — acceptance-criteria mode (Jira ACB-2940).
// Source: docs/user-stories/User Story- Business Policy Lumpsum Standalone TPD Cover.md
//
// Exhaustive standard: positive + negative/absence + boundary-triple (AT-boundary accept) +
// value-level, each via recordCheck. Business-tab variant of the personal Standalone TPD spec
// (ACB-2927) — same Stepped/Level-to-65/70 structure, Own/Any/Modified definition, $250k (17-21) /
// $5M caps, Modified-only 17-21 rule, max-3, same-definition rule — PLUS a Business Security checkbox.
// DOM confirmed via probe 2026-09-07 (Business tab): structure [Stepped/Level to 65/Level to 70];
// definition [Own/Any/Modified]; Business Security checkbox default unticked; $5M cap verbatim
// "The maximum total Sum Insured per life for TPD Cover is $5,000,000.".
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
  getCheckboxStateByLabel,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

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
// Open a fresh quote, switch to the Business policy, and activate TPD.
async function freshBizTpdQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 1800);
  await activateCover(quote, 'TPD');
  await waitForSettle(quote, 800);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
// Tick the Business Security checkbox for the (only) TPD cover.
async function tickBusinessSecurity(page) {
  await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
    const bs = boxes.find((c) => { let n = c.parentElement, t = ''; for (let d = 0; d < 5 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; } return /Business Security/i.test(t); });
    if (bs && !bs.checked) { bs.scrollIntoView({ block: 'center' }); bs.click(); }
  });
  await waitForSettle(page, 1200);
}

test.describe('Business Policy Lumpsum Standalone TPD Cover (ACB-2940)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Business policy lump sum covers available; TPD selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new quote, Then I can apply for business lumpsum cover.',
      'AC02: Given the Business Lump Sum Cover section, Then I can see Life, TPD, Trauma, Specific Injury, And select 1 or more covers.',
      '', 'Steps to reproduce:', '1. New quote, select Business. 2. Check Life/TPD/Trauma/Specific Injury present; activate TPD.',
      '', 'Expected: the 4 business lump sum covers present; TPD activates.',
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
    await activateCover(quote, 'TPD');
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'TPD is selectable (Sum Insured field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: TPD selectable').toBe(true);
  });

  test('AC03: Business TPD exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} + Definition {Own default, Any, Modified} + Business Security (default unchecked)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select TPD, Then I can enter the Sum Insured, select Premium Structure {Stepped(default), Level to 65, Level to 70}, select Definition {Own(default), Any, Modified}, and select the Business Security checkbox (default unchecked).',
      '', 'Steps to reproduce:', '1. New quote, Business, activate TPD. 2. Read SI field, Structure, Definition, Business Security.',
      '', 'Expected: Structure [Stepped(def), Level to 65, Level to 70]; Definition [Own(def), Any, Modified]; Business Security present + unticked.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'TPD Sum Insured field present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: SI field present').toBe(true);
    const struct = await getTpdStructure(quote);
    await recordStep(testInfo, page, { label: 'TPD Premium Structure default + options', expected: 'Stepped(def); Stepped/Level to 65/Level to 70', actual: `${struct?.selected}; ${(struct?.options||[]).join('/')}` });
    expect(struct?.selected, 'AC03: Structure default Stepped').toBe('Stepped');
    expect(struct?.options, 'AC03: Structure options').toEqual(['Stepped', 'Level to 65', 'Level to 70']);
    const def = await getTpdDefinition(quote);
    await recordStep(testInfo, page, { label: 'TPD Definition default + options', expected: 'Own(def); Own/Any/Modified', actual: `${def?.selected}; ${(def?.options||[]).join('/')}` });
    expect(def?.selected, 'AC03: Definition default Own').toBe('Own');
    expect(def?.options, 'AC03: Definition options').toEqual(['Own', 'Any', 'Modified']);
    const bs = await getCheckboxStateByLabel(quote, 'Business Security');
    await recordStep(testInfo, page, { label: 'Business Security checkbox present + default unchecked', expected: 'present, unchecked', actual: JSON.stringify(bs) });
    expect(bs, 'AC03: Business Security present').not.toBeNull();
    expect(bs?.checked, 'AC03: Business Security default unchecked').toBe(false);
  });

  test('AC04: Business TPD + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given TPD Cover, When ANB < 17, Then error "The minimum Age Next Birthday for XXXX \'Standalone TPD cover\' is 17" (XXXX = structure).',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 16, activate TPD, SI $100,000, Apply.',
      '', 'Expected: error "minimum Age Next Birthday ... TPD ... is 17".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 16, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business TPD ANB < 17', expected: 'minimum Age Next Birthday ... TPD ... 17', actual: e });
    expect(/minimum Age Next Birthday.*TPD.*is 17/i.test(e), `AC04. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC04 boundary: Business TPD min age at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04 (at-boundary accept): min ANB is 17 — TPD at exactly 17 (Modified, per 17-21 rule) must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 17, activate TPD, Definition Modified, SI $100,000, Apply.',
      '', 'Expected: NO min-age error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 17, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdDefinition(quote, 'Modified');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Age Next Birthday.*TPD.*is 17/i.test(e);
    await recordStep(testInfo, page, { label: 'Business TPD min age at ANB 17 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC04 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC05: Business TPD Stepped + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given TPD Cover, When ANB > 65 and Premium Structure Stepped, Then error "The maximum Age Next Birthday for Stepped \'Standalone TPD cover\' is 65".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 66, activate TPD (Stepped), SI $100,000, Apply.',
      '', 'Expected: "maximum Age Next Birthday for Stepped ... 65".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business TPD Stepped + ANB > 65', expected: 'maximum ... Stepped ... TPD ... 65', actual: e });
    expect(/maximum Age Next Birthday for Stepped.*TPD.*65/i.test(e), `AC05. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC05 boundary: Business TPD Stepped max at ANB 65 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05 (at-boundary accept): Stepped max ANB is 65 — TPD Stepped at exactly 65 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 65, activate TPD (Stepped), SI $100,000, Apply.',
      '', 'Expected: NO "Stepped ... 65" max-age error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 65, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Stepped.*TPD.*65/i.test(e);
    await recordStep(testInfo, page, { label: 'Business TPD Stepped max at ANB 65 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC05 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC06: Business TPD Level to 65 + ANB > 60 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given TPD Cover, When ANB > 60 and Premium Structure Level to 65, Then error "The maximum Age Next Birthday for Level to 65 \'Standalone TPD cover\' is 60".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 61, activate TPD, SI $100,000, Structure Level to 65, Apply.',
      '', 'Expected: "Level to 65 ... 60".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 61, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdStructure(quote, 'Level to 65');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business TPD Level to 65 + ANB > 60', expected: 'Level to 65 ... TPD ... 60', actual: e });
    expect(/Level to 65.*TPD.*60/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07: Business TPD Level to 70 + ANB > 65 → max age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given TPD Cover, When ANB > 65 and Premium Structure Level to 70, Then error "The maximum Age Next Birthday for Level to 70 \'Standalone TPD cover\' is 65".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 66, activate TPD, SI $100,000, Structure Level to 70, Apply.',
      '', 'Expected: "Level to 70 ... 65".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 66, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdStructure(quote, 'Level to 70');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business TPD Level to 70 + ANB > 65', expected: 'Level to 70 ... TPD ... 65', actual: e });
    expect(/Level to 70.*TPD.*65/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08: Business TPD + ANB 17-21 + SI > $250,000 → young cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given TPD Cover, When ANB 17-21 and combined SI (across PER/BUS incl. Acc TPD + TPD on Trauma) > 250000, Then error "The maximum \'TPD Cover\' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000.".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 19, activate TPD, Definition Modified (17-21), SI $250,001, Apply.',
      '', 'Expected: the $250,000 young-cap error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await setTpdDefinition(quote, 'Modified');
    await fillCalcMask(sumInsuredInput(quote, 0), '250001');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business TPD ANB 17-21 + SI > $250k', expected: 'Age Next Birthday 17 - 21 is $250,000', actual: e });
    expect(/Age Next Birthday 17\s*-\s*21 is \$?250,?000/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08 boundary: Business TPD ANB 17-21 SI exactly $250,000 is accepted (no young-cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08 (at-boundary accept): the 17-21 cap is $250,000 — SI at exactly $250,000 must NOT raise the young-cap error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 19, activate TPD, Definition Modified, SI $250,000, Apply.',
      '', 'Expected: NO "$250,000" young-cap error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await setTpdDefinition(quote, 'Modified');
    await fillCalcMask(sumInsuredInput(quote, 0), '250000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = /Age Next Birthday 17\s*-\s*21 is \$?250,?000/i.test(e);
    await recordStep(testInfo, page, { label: 'Business TPD ANB 17-21 SI exactly $250,000 accepted', expected: false, actual: hasCap });
    expect(hasCap, `AC08 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC09: Business TPD + ANB 17-21 + non-Modified definition → "only eligible for Modified TPD"', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given TPD Cover, When ANB 17-21 (inclusive) and definition is NOT Modified, Then error "Age Next Birthday 17-21 is only eligible for Modified TPD".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 19, activate TPD, keep Definition Own (default), SI $100,000, Apply.',
      '', 'Expected: "only eligible for Modified TPD".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 19, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Non-Modified TPD at ANB 17-21 raises the Modified-only error', expected: 'only eligible for Modified TPD', actual: e });
    expect(/only eligible for Modified TPD/i.test(e), `AC09. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10: Business TPD + ANB > 21 + SI > $5,000,000 → max total SI cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given TPD Cover, When ANB > 21 and combined SI (across PER/BUS incl. Acc TPD + TPD on Trauma) > 5000000, Then error "The maximum total Sum Insured per life for TPD Cover is $5,000,000.".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, activate TPD, SI $5,000,001, Apply.',
      '', 'Expected: "maximum total Sum Insured per life for TPD Cover is $5,000,000".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '5000001');
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Error shown for Business TPD SI > $5,000,000', expected: 'maximum total Sum Insured per life for TPD Cover is $5,000,000', actual: e });
    expect(/maximum total Sum Insured per life for TPD Cover is \$?5,?000,?000/i.test(e), `AC10. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10 boundary: Business TPD SI exactly $5,000,000 is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10 (at-boundary accept): the ANB 22+ cap is $5,000,000 — SI at exactly $5,000,000 must NOT raise the cap error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, activate TPD, SI $5,000,000, Apply.',
      '', 'Expected: NO "$5,000,000" cap error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '5000000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = /maximum total Sum Insured per life for TPD Cover is \$?5,?000,?000/i.test(e);
    await recordStep(testInfo, page, { label: 'Business TPD SI exactly $5,000,000 accepted', expected: false, actual: hasCap });
    expect(hasCap, `AC10 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC11/AC14: multi-TPD default-structure progression (Stepped→Level to 65→Level to 70) + max 3 disables +TPD', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: 1st TPD defaults Stepped, 2nd Level to 65, 3rd Level to 70 (all changeable). AC14: after 3 TPD covers the +TPD button is greyed out / disabled.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate TPD (read default), add 2nd (read), add 3rd (read), check +TPD disabled.',
      '', 'Expected: defaults Stepped / Level to 65 / Level to 70; +TPD disabled after 3.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await waitForSettle(quote, 800);
    const d1 = (await getTpdStructure(quote, 0))?.selected;
    await recordStep(testInfo, page, { label: '1st TPD default structure', expected: 'Stepped', actual: d1 });
    expect(d1, 'AC11: 1st TPD default Stepped').toBe('Stepped');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '110000');
    await waitForSettle(quote, 1200);
    const d2 = (await getTpdStructure(quote, 1))?.selected;
    await recordStep(testInfo, page, { label: '2nd TPD default structure', expected: 'Level to 65', actual: d2 });
    expect(d2, 'AC11: 2nd TPD default Level to 65').toBe('Level to 65');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 2), '120000');
    await waitForSettle(quote, 1200);
    const d3 = (await getTpdStructure(quote, 2))?.selected;
    await recordStep(testInfo, page, { label: '3rd TPD default structure', expected: 'Level to 70', actual: d3 });
    expect(d3, 'AC11: 3rd TPD default Level to 70').toBe('Level to 70');
    const disabled = await quote.evaluate(() => { const b=[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().split('\n')[0]==='TPD'); return b?(b.disabled||/disabled|is-disabled/.test(b.className)):null; });
    await recordStep(testInfo, page, { label: '+TPD disabled after 3 covers', expected: true, actual: disabled });
    expect(disabled, 'AC14: +TPD disabled after 3').toBe(true);
  });

  test('AC15: mismatched TPD definitions on the same policy → same-definition error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15: Given multiple TPD covers, When the TPD definitions differ, Then error "You must have the same TPD definition for TPD cover on the same policy.".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 40, activate TPD (SI $100k, Def Own), activate 2nd TPD (SI $100k, Def Any), Apply.',
      '', 'Expected: the same-definition error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await setTpdDefinition(quote, 'Own', 0);
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '100000');
    await setTpdDefinition(quote, 'Any', 1);
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Mismatched TPD definitions raise the same-definition error', expected: 'same TPD definition for TPD cover on the same policy', actual: e });
    expect(/same TPD definition for TPD cover on the same policy/i.test(e), `AC15. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC17: Business TPD + Business Security + ANB > 56 → Business Security max-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17: Given TPD Cover, When ANB > 56 and I select Business Security, Then error "The maximum Age Next Birthday for Business Security is 56".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 57, activate TPD, SI $100,000, tick Business Security, Apply.',
      '', 'Expected: "maximum Age Next Birthday for Business Security is 56".',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 57, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await tickBusinessSecurity(quote);
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Business Security at ANB > 56 raises the max-age error', expected: 'maximum Age Next Birthday for Business Security is 56', actual: e });
    expect(/maximum Age Next Birthday for Business Security is 56/i.test(e), `AC17. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC17 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17 (at-boundary accept): Business Security max ANB is 56 — at exactly 56 must NOT raise the Business Security max-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 56, activate TPD, SI $100,000, tick Business Security, Apply.',
      '', 'Expected: NO "Business Security is 56" error.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 56, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await tickBusinessSecurity(quote);
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Business Security is 56/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Security at ANB 56 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC17 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC12: Business TPD cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: When I have selected the cover type, Then I can add/remove/update it and view the premium change.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate TPD, SI $200,000 (present). 2. Remove — gone.',
      '', 'Expected: SI field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'TPD Sum Insured field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC12: added').toBe(true);
    await quote.evaluate(() => { const l=[...document.querySelectorAll('a')].filter((a)=>a.innerText.trim()==='Remove'); if(l.length) l[l.length-1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    await recordStep(testInfo, page, { label: 'TPD Sum Insured field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC12: removed').toBe(0);
  });

  test('AC13: Business TPD "?" tooltip shows the discount-bands + Business Security text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given the TPD section, When I click a "?" icon, Then tooltips show: Sum Insured discount bands ($100,000-$249,999 / $250,000-$499,999 / $500,000) and Business Security ("Allows future increases without medical underwriting...").',
      '', 'Steps to reproduce:', '1. New quote, Business, activate TPD. 2. Search DOM/title attrs for the tooltip phrases.',
      '', 'Expected: TPD discount-bands + Business Security tooltip phrases present.',
    ].join('\n') });
    const quote = await freshBizTpdQuote(page, { age: 40, gender: 'Male', occupationCode: '1' });
    await waitForSettle(quote, 800);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    await recordStep(testInfo, page, { label: 'TPD discount-bands tooltip present', expected: 'contains bands for TPD Cover', actual: /discount bands for TPD Cover/i.test(hay) });
    expect(hay, 'AC13: TPD discount-bands tooltip').toMatch(/discount bands for TPD Cover/i);
    await recordStep(testInfo, page, { label: 'Business Security tooltip present', expected: 'contains "future increases without medical underwriting"', actual: /future increases without medical underwriting/i.test(hay) });
    expect(hay, 'AC13: Business Security tooltip').toMatch(/future increases without medical underwriting/i);
  });

  // ── Deferred AC (documented) ──
  test('AC16: Acc TPD / TPD on Trauma + ANB 17-21 non-Modified → Modified-only error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC16: Given Acc TPD or TPD on Trauma, When ANB 17-21 and definition not Modified, Then "Age Next Birthday 17-21 is only eligible for Modified TPD".'].join('\n') });
    test.fixme(true, 'Deferred: Acc TPD / TPD on Trauma are sub-covers under Life/Trauma (not standalone TPD) — belongs with the Business Life (ACB-2638) / Business Trauma (ACB-2939) specs where those sub-covers live. The standalone-TPD Modified-only rule is covered by AC09 here.');
  });
});

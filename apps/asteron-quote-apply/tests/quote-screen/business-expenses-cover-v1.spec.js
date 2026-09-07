// Business Policy Disability Cover — Business Expenses — acceptance-criteria mode (Jira ACB-2695).
// Source: docs/user-stories/User Story- Business Policy Disability Cover - Business Expenses.md
//
// Exhaustive standard: positive + negative/absence + boundary-triple (AT-boundary accept) +
// value-level, each via recordCheck. Business-tab disability cover.
//
// DOM confirmed via probe 2026-09-07 (QA, account D):
//  - Business policy exposes Business Disability / Farmers Disability / Business Expenses buttons.
//  - Activating Business Expenses shows a Monthly Benefit (Input_SumInsured), a Premium Structure
//    select (default "Stepped", DISABLED), a Benefit Period select (default "1 Year", DISABLED),
//    and a Waiting Period select [14 Days(def)/30/60/90 Days] (enabled).
//  - +Business Expenses button becomes disabled after 1 activation (max-1).
//  - $16,666 accepted; $99,999 -> "The maximum allowable Business Expenses monthly benefit for the
//    selected occupation is $16,666".
//  - occupation S -> "Business Expenses Cover is not available for the selected occupation."
//    (AM/AA/A1/A2/B/C accepted).
//  - ANB 62 -> "The maximum Age Next Birthday for Business Expenses cover is 61"; ANB 61 accepted.
//  - ANB 16 -> "The minimum Age Next Birthday for Business Expenses cover is 17"; ANB 17 accepted.
//  - Personal Workability + Business Expenses -> "Business Expenses Cover is not available to be
//    taken in conjunction with Workability Cover".
//
// NOTE on story wording: AC08/AC09 quote "...for Business Expensesis 61 / is 17" (a typo). The app
// renders "...for Business Expenses cover is 61 / 17" — same numeric rule, so the assertion targets
// the number + phrase robustly rather than the story's typo.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  coverButtonExists,
  fillCalcMask,
  commitWithoutTyping,
  sumInsuredInput,
  getVisibleErrors,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

// Open a fresh quote and switch to the Business policy. Personal details include Employment Status
// + Annual Income (required to price a disability cover).
async function freshBizQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, Object.assign({ age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 }, personal || {}));
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 1800);
  return quote;
}

// Read a disability select by fingerprint. kind: 'structure' (Stepped+Level to 100),
// 'benefitPeriod' (1 Year + 6 Months), 'waitingPeriod' (14 Days + 90 Days).
async function readDisabilitySelect(page, kind) {
  return page.evaluate((k) => {
    function match(opts) {
      if (k === 'structure') return opts.includes('Stepped') && opts.some((o) => o === 'Level to 100');
      if (k === 'benefitPeriod') return opts.includes('1 Year') && opts.includes('6 Months');
      if (k === 'waitingPeriod') return opts.includes('14 Days') && opts.includes('90 Days') && opts.length <= 5;
      return false;
    }
    const sel = [...document.querySelectorAll('select')].find((s) => match([...s.options].map((o) => o.text.trim())));
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), disabled: sel.disabled } : null;
  }, kind);
}

async function beButtonState(page) {
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Business Expenses');
    return b ? { disabled: b.disabled || /disabled|is-disabled/.test(b.className), className: b.className } : null;
  });
}

test.describe('Business Policy Disability Cover — Business Expenses (ACB-2695)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Business policy exposes disability covers; Business Expenses selectable; combo = Business/Farmers Disability + Business Expenses', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new quote for a business policy, Then I can apply for Disability cover.',
      'AC02: Given the Disability Cover section, When creating a new business quote, Then I can see Business/Farmers Disability and Business Expenses, and can only have Business Disability & Business Expenses OR Farmers Disability & Business Expenses, each once.',
      '',
      'Steps to reproduce:',
      '1. New quote, set personal details (Employed, income 150000), select Business policy.',
      '2. Check Business Disability, Farmers Disability, Business Expenses buttons present.',
      '3. Activate Business Expenses; confirm the Monthly Benefit field appears.',
      '',
      'Expected: all three disability cover buttons present; Business Expenses activates (benefit field appears).',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    for (const cover of ['Business Disability', 'Farmers Disability', 'Business Expenses']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Business disability cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" present`).toBe(true);
    }
    await activateCover(quote, 'Business Expenses');
    await waitForSettle(quote, 1200);
    const benefitVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Business Expenses is selectable (Monthly Benefit field appears)', expected: true, actual: benefitVisible });
    expect(benefitVisible, 'AC02: Business Expenses selectable').toBe(true);
  });

  test('AC03: Business Expenses exposes Monthly Benefit + Premium Structure {Stepped, greyed/disabled} + Benefit Period {1 Year, greyed/disabled} + Waiting Period {14(def)/30/60/90 Days, editable}', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Business Expenses, Then: (1) allow entry of Monthly Benefit; (2) Premium Structure dropdown shows Stepped (default) displayed greyed out (non-editable); (3) Benefit Period pre-populated "1 year" greyed out (non-editable); Waiting Period dropdown [14 Days (default), 30 Days, 60 Days, 90 Days].',
      '',
      'Steps to reproduce:',
      '1. New quote, Business, activate Business Expenses.',
      '2. Read Monthly Benefit field, Premium Structure (selected + disabled), Benefit Period (selected + disabled), Waiting Period (selected + options).',
      '',
      'Expected: Monthly Benefit editable; Premium Structure default Stepped + disabled; Benefit Period "1 Year" + disabled; Waiting Period default 14 Days with options [14/30/60/90 Days].',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    await activateCover(quote, 'Business Expenses');
    await waitForSettle(quote, 1200);

    const benefitEditable = await sumInsuredInput(quote, 0).isEditable();
    recordCheck(testInfo, { label: 'Monthly Benefit field allows entry (editable)', expected: true, actual: benefitEditable });
    expect(benefitEditable, 'AC03.1: Monthly Benefit editable').toBe(true);

    const struct = await readDisabilitySelect(quote, 'structure');
    recordCheck(testInfo, { label: 'Premium Structure default is Stepped', expected: 'Stepped', actual: struct && struct.selected });
    expect(struct && struct.selected, 'AC03.2: Premium Structure default Stepped').toBe('Stepped');
    recordCheck(testInfo, { label: 'Premium Structure is greyed out / disabled (non-editable)', expected: true, actual: struct && struct.disabled });
    expect(struct && struct.disabled, 'AC03.2: Premium Structure disabled').toBe(true);

    const bp = await readDisabilitySelect(quote, 'benefitPeriod');
    recordCheck(testInfo, { label: 'Benefit Period pre-populated "1 Year"', expected: '1 Year', actual: bp && bp.selected });
    expect(bp && bp.selected, 'AC03.3: Benefit Period 1 Year').toBe('1 Year');
    recordCheck(testInfo, { label: 'Benefit Period is greyed out / disabled (non-editable)', expected: true, actual: bp && bp.disabled });
    expect(bp && bp.disabled, 'AC03.3: Benefit Period disabled').toBe(true);

    const wp = await readDisabilitySelect(quote, 'waitingPeriod');
    recordCheck(testInfo, { label: 'Waiting Period default is 14 Days', expected: '14 Days', actual: wp && wp.selected });
    expect(wp && wp.selected, 'AC03.4: Waiting Period default 14 Days').toBe('14 Days');
    recordCheck(testInfo, { label: 'Waiting Period options', expected: '14 Days/30 Days/60 Days/90 Days', actual: wp && wp.options.join('/') });
    expect(wp && wp.options, 'AC03.4: Waiting Period options').toEqual(['14 Days', '30 Days', '60 Days', '90 Days']);
    recordCheck(testInfo, { label: 'Waiting Period is editable (not greyed out)', expected: false, actual: wp && wp.disabled });
    expect(wp && wp.disabled, 'AC03.4: Waiting Period editable').toBe(false);
  });

  test('AC04: Business Expenses + unsuitable occupation (S) → "not available for the selected occupation"', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given AC03 active, When I have selected Business Expenses And the selected occupation is not suitable, Then error "Business Expenses Cover is not available for the selected occupation.".',
      '',
      'Steps to reproduce:',
      '1. New quote, set occupation code S (probe-confirmed unsuitable), Employed, income 150000, Business policy.',
      '2. Activate Business Expenses, Monthly Benefit $5,000, Apply.',
      '',
      'Expected: "Business Expenses Cover is not available for the selected occupation.".',
      'Probe (2026-09-07): AM/AA/A1/A2/B/C accepted; S -> this error; U/IC -> different occupation errors.',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    await quote.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption({ label: 'S' });
    await waitForSettle(quote, 1500);
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Unsuitable occupation (S) raises the not-available error', expected: 'Business Expenses Cover is not available for the selected occupation.', actual: e });
    expect(/Business Expenses Cover is not available for the selected occupation\./i.test(e), `AC04. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC04 (negative/contrast): suitable occupation (AA) → NO occupation-not-available error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04 (contrast): a suitable occupation must NOT raise the occupation-not-available error.',
      '',
      'Steps to reproduce:',
      '1. New quote, occupation AA (default), Employed, income 150000, Business.',
      '2. Activate Business Expenses, Monthly Benefit $5,000, Apply.',
      '',
      'Expected: NO "not available for the selected occupation" error.',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /not available for the selected occupation/i.test(e);
    recordCheck(testInfo, { label: 'Suitable occupation (AA) does NOT raise the occupation error', expected: false, actual: hasErr });
    expect(hasErr, `AC04 contrast. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC05: Business Expenses monthly benefit > $16,666 → max monthly benefit error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given AC03 active, When Business Expenses monthly benefit > 16666, Then error "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666." (max $200,000 p.a. = $16,666/mo).',
      '',
      'Steps to reproduce:',
      '1. New quote, Business, activate Business Expenses, Monthly Benefit $16,667, Apply.',
      '',
      'Expected: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666".',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '16667'); // 16666 cap + 1 = over
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Monthly benefit $16,667 (>cap) raises the $16,666 max error', expected: 'The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666', actual: e });
    expect(/maximum allowable Business Expenses monthly benefit for the selected occupation is \$?16,?666/i.test(e), `AC05. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC05 boundary: Business Expenses monthly benefit exactly $16,666 is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05 (at-boundary accept): the cap is $16,666 — exactly $16,666 must NOT raise the cap error.',
      '',
      'Steps to reproduce:',
      '1. New quote, Business, activate Business Expenses, Monthly Benefit $16,666, Apply.',
      '',
      'Expected: NO "$16,666" cap error.',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '16666');
    await clickApply(quote);
    const e = await errText(quote);
    const hasCap = /maximum allowable Business Expenses monthly benefit for the selected occupation is \$?16,?666/i.test(e);
    recordCheck(testInfo, { label: 'Monthly benefit exactly $16,666 accepted (no cap error)', expected: false, actual: hasCap });
    expect(hasCap, `AC05 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC06: after selecting Business Expenses the +Business Expenses button is disabled (max 1)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given AC03 active, When I select Business Expenses, Then the ability to add another Business Expenses is disabled and the "+ Business Expenses" button is grayed out / non-clickable.',
      '',
      'Steps to reproduce:',
      '1. New quote, Business. 2. Check the +Business Expenses button enabled before. 3. Activate Business Expenses. 4. Check the button now disabled.',
      '',
      'Expected: enabled before activation, disabled after.',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    const before = await beButtonState(quote);
    recordCheck(testInfo, { label: '+Business Expenses enabled before any activation', expected: false, actual: before && before.disabled });
    expect(before && before.disabled, 'AC06: enabled before').toBe(false);
    await activateCover(quote, 'Business Expenses');
    await waitForSettle(quote, 1200);
    const after = await beButtonState(quote);
    recordCheck(testInfo, { label: '+Business Expenses disabled after 1 activation (max 1)', expected: true, actual: after && after.disabled });
    expect(after && after.disabled, 'AC06: disabled after 1').toBe(true);
  });

  test('AC07: Business Expenses cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: When I have selected the cover type, Then I can add/remove/update the cover and view the premium change in the progress panel.',
      '',
      'Steps to reproduce:',
      '1. New quote, Business, activate Business Expenses (Monthly Benefit field present). 2. Remove — field gone.',
      '',
      'Expected: benefit field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshBizQuote(page);
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Business Expenses benefit field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC07: added').toBe(true);
    await quote.evaluate(() => { const l = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove'); if (l.length) l[l.length - 1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'Business Expenses benefit field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC07: removed').toBe(0);
  });

  test('AC08: Business Expenses + ANB > 61 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Business Expenses selected, When age next birthday is more than 61, Then error "The maximum Age Next Birthday for Business Expenses is 61" (app renders "...Business Expenses cover is 61").',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 62, Employed, income 150000, Business. 2. Activate Business Expenses, auto-default benefit, Apply.',
      '',
      'Expected: "maximum Age Next Birthday for Business Expenses ... is 61".',
    ].join('\n') });
    const quote = await freshBizQuote(page, { age: 62 });
    await activateCover(quote, 'Business Expenses');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'ANB 62 (>61) raises the max-age error', expected: 'The maximum Age Next Birthday for Business Expenses ... is 61', actual: e });
    expect(/maximum Age Next Birthday for Business Expenses.*is 61/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC08 boundary: Business Expenses at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08 (at-boundary accept): max ANB is 61 — Business Expenses at exactly 61 must NOT raise the max-age error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 61, Business, activate Business Expenses, Monthly Benefit $5,000, Apply.',
      '',
      'Expected: NO "Business Expenses ... is 61" max-age error.',
    ].join('\n') });
    const quote = await freshBizQuote(page, { age: 61 });
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Business Expenses.*is 61/i.test(e);
    recordCheck(testInfo, { label: 'ANB 61 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC08 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC09: Business Expenses + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given Business Expenses selected, When age next birthday is less than 17, Then error "The minimum Age Next Birthday for Business Expenses is 17" (app renders "...Business Expenses cover is 17").',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 16, Employed, income 150000, Business. 2. Activate Business Expenses, auto-default benefit, Apply.',
      '',
      'Expected: "minimum Age Next Birthday for Business Expenses ... is 17".',
    ].join('\n') });
    const quote = await freshBizQuote(page, { age: 16 });
    await activateCover(quote, 'Business Expenses');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'ANB 16 (<17) raises the min-age error', expected: 'The minimum Age Next Birthday for Business Expenses ... is 17', actual: e });
    expect(/minimum Age Next Birthday for Business Expenses.*is 17/i.test(e), `AC09. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC09 boundary: Business Expenses at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09 (at-boundary accept): min ANB is 17 — Business Expenses at exactly 17 must NOT raise the min-age error.',
      '',
      'Steps to reproduce:',
      '1. New quote, ANB 17, Business, activate Business Expenses, Monthly Benefit $5,000, Apply.',
      '',
      'Expected: NO "Business Expenses ... is 17" min-age error.',
    ].join('\n') });
    const quote = await freshBizQuote(page, { age: 17 });
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Age Next Birthday for Business Expenses.*is 17/i.test(e);
    recordCheck(testInfo, { label: 'ANB 17 accepted (no min-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC09 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC10: Personal Workability + Business Expenses → conjunction error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given I have selected Personal policy Workability cover, When I have also selected Business Expenses, Then error "Business Expenses Cover is not available to be taken in conjunction with Workability Cover".',
      '',
      'Steps to reproduce:',
      '1. New quote, Employed, income 150000. 2. On the Personal policy activate Workability (auto-default benefit).',
      '3. Switch to Business policy, activate Business Expenses, Monthly Benefit $5,000, Apply.',
      '',
      'Expected: "Business Expenses Cover is not available to be taken in conjunction with Workability Cover".',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await activateCover(quote, 'Workability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1500);
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 1800);
    await activateCover(quote, 'Business Expenses');
    await waitForSettle(quote, 1500);
    const count = await quote.locator('input[id*="SumInsured"]').count();
    await fillCalcMask(sumInsuredInput(quote, count - 1), '5000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Workability + Business Expenses raises the conjunction error', expected: 'Business Expenses Cover is not available to be taken in conjunction with Workability Cover', actual: e });
    expect(/Business Expenses Cover is not available to be taken in conjunction with Workability Cover/i.test(e), `AC10. Got: ${e.slice(0, 200)}`).toBe(true);
  });
});

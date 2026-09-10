// Business Policy Disability Cover — Business/Farmers Disability — acceptance-criteria mode (Jira ACB-2691).
// Source: docs/user-stories/User Story- Business Policy Disability Cover - Business-Farmers Disability.md
//
// Exhaustive standard (per .kiro/steering/test-expansion-process.md + TEST-GENERATION-PROCESS.md):
// positive + negative/absence + boundary-triple (AT-boundary accept asserted) + value-level, each via
// recordCheck. These are BUSINESS-policy covers — opened via clickButtonByLabel(quote,'Business',...)
// after setMinimumPersonalDetails, with Employment Status + Annual Income set (disability covers need them).
// The disability "commitment trap" applies: focus+blur (commitWithoutTyping) or a typed benefit is needed
// before Apply for a cover to actually be committed.
//
// DOM + verbatim error strings confirmed via live QA probes 2026-09-07
// (apps/asteron-quote-apply/probes/probe-business-farmers-disability*.js, ...-errors.js, ...-mutex-tooltip.js,
//  probe-farmers-cap-occ-c.js, probe-ac25-ac17.js):
//   Buttons present: Business Disability, Farmers Disability, Business Expenses.
//   Business Disability: Classification [Employed(def), Equity Owner (>75%), Equity Owner (up to 75%)];
//     Benefit Period [6(def)/9/12/18/24 Months]; Waiting Period [30(def)/60/90 Days];
//     Business Security checkbox (default UNticked) + Partial Disablement (default ticked);
//     Premium Structure locked/disabled to "Stepped".
//   Farmers Disability: NO Classification dropdown; Benefit Period adds "5 Years"; same waiting/checkboxes.
//   Both +buttons disable after activation (max-1). Occupation-code dropdown exposes single-letter codes
//     only (AA/AM/A1/A2/B/C/S/U/IC) — occ code C(5) is an ELIGIBLE Farmers occupation; U(7) → "This occupation
//     is not eligible"; IC(8) → "Please contact underwriting ... Individual Consideration".
//   Verbatim: $50,000 / $10,000 caps, age 61 max, age 17 min, Business Security age 56 max, Business<->Farmers
//     mutual exclusivity, Farmers+Employed employment-status error, Business/Farmers + Workability conjunction,
//     AC25 classification/benefit-period combo — all confirmed live.
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
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

// ── Business/Farmers Disability select readers (fingerprinted by option set) ──
async function getClassification(page) {
  return page.evaluate(() => {
    const s = [...document.querySelectorAll('select')].find((x) => {
      const o = [...x.options].map((t) => t.text.trim());
      return o.includes('Employed') && o.some((t) => /Equity Owner/.test(t));
    });
    return s ? { selected: s.options[s.selectedIndex].text.trim(), options: [...s.options].map((o) => o.text.trim()), id: s.id } : null;
  });
}
async function getBenefitPeriod(page) {
  return page.evaluate(() => {
    const s = [...document.querySelectorAll('select')].find((x) => {
      const o = [...x.options].map((t) => t.text.trim());
      return o.includes('6 Months') && o.includes('24 Months');
    });
    return s ? { selected: s.options[s.selectedIndex].text.trim(), options: [...s.options].map((o) => o.text.trim()), id: s.id } : null;
  });
}
async function getWaitingPeriod(page) {
  return page.evaluate(() => {
    const s = [...document.querySelectorAll('select')].find((x) => {
      const o = [...x.options].map((t) => t.text.trim());
      return o.includes('30 Days') && o.includes('90 Days') && o.length <= 4;
    });
    return s ? { selected: s.options[s.selectedIndex].text.trim(), options: [...s.options].map((o) => o.text.trim()), id: s.id } : null;
  });
}
// Premium Structure select for a disability cover: fingerprint "Stepped" + "Level to Expiry" (per probe).
async function getPremiumStructure(page) {
  return page.evaluate(() => {
    const s = [...document.querySelectorAll('select')].find((x) => {
      const o = [...x.options].map((t) => t.text.trim());
      return o.includes('Stepped') && o.includes('Level to Expiry');
    });
    return s ? { selected: s.options[s.selectedIndex].text.trim(), disabled: s.disabled, id: s.id } : null;
  });
}
// Checkbox {checked,disabled} by nearby label (first non-empty line of an ancestor).
async function getCheckbox(page, labelRe) {
  return page.evaluate((reSrc) => {
    const re = new RegExp(reSrc, 'i');
    const c = [...document.querySelectorAll('input[type="checkbox"]')].find((x) => {
      let n = x.parentElement, t = '';
      for (let d = 0; d < 6 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; }
      return re.test(t);
    });
    return c ? { checked: c.checked, disabled: c.disabled } : null;
  }, labelRe.source);
}
// Real click on the Business Security checkbox (fires the OutSystems handler), then settle.
async function tickBusinessSecurity(page) {
  await page.evaluate(() => {
    const c = [...document.querySelectorAll('input[type="checkbox"]')].find((x) => {
      let n = x.parentElement, t = '';
      for (let d = 0; d < 6 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; }
      return /Business Security/i.test(t);
    });
    if (c && !c.checked) { c.scrollIntoView({ block: 'center' }); c.click(); }
  });
  await waitForSettle(page, 1500);
}
// Select an option on the classification / benefit-period select by native selectOption, then verify it landed.
async function setSelectByFingerprint(page, matchOptions, label) {
  const id = await page.evaluate((mo) => {
    const s = [...document.querySelectorAll('select')].find((x) => { const o = [...x.options].map((t) => t.text.trim()); return mo.every((m) => o.includes(m)); });
    return s ? s.id : null;
  }, matchOptions);
  if (!id) throw new Error('Select not found for options ' + JSON.stringify(matchOptions));
  await page.locator(`[id="${id}"]`).selectOption({ label });
  await waitForSettle(page, 1500);
}

// Custom Apply reader: returns the joined visible error text (post-Apply, stabilised by clickApply's waiter).
async function applyAndErrors(page) {
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await waitForSettle(page);
  // stabilise (mirror of clickApply's polling)
  const deadline = Date.now() + 8000; let prev = null, streak = 0;
  while (Date.now() < deadline && streak < 2) {
    const cur = await page.evaluate(() => document.body.innerText);
    streak = cur === prev ? streak + 1 : 1; prev = cur;
    if (streak < 2) await page.waitForTimeout(500);
  }
  const errs = await getVisibleErrors(page);
  return errs.join(' | ');
}

// Open a fresh quote, switch to Business policy, with Employment Status + Income set for disability covers.
async function freshBiz(page, opts) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, Object.assign(
    { age: 40, gender: 'Male', occupationCode: '5', employmentStatus: 'Self-Employed', income: 200000 }, opts || {}));
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 2500);
  return quote;
}
// Fresh quote with a PERSONAL Workability cover committed, then switch to Business (for AC17/AC18).
async function freshWorkabilityThenBiz(page, opts) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, Object.assign(
    { age: 40, gender: 'Male', occupationCode: '5', employmentStatus: 'Self-Employed', income: 200000 }, opts || {}));
  await activateCover(quote, 'Workability');
  await fillCalcMask(sumInsuredInput(quote, 0), '5000');
  await waitForSettle(quote, 1500);
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 2500);
  return quote;
}

test.describe('Business Policy Disability Cover — Business/Farmers Disability (ACB-2691)', () => {
  test.describe.configure({ mode: 'parallel' });

  // ── AC01/AC02 — covers present & selectable ──
  test('AC01/AC02: Business policy Disability covers available (Business Disability, Farmers Disability, Business Expenses); selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new business-policy quote, Then I can apply for Disability cover.',
      'AC02: Given the Disability Cover section of a new business quote, Then I can see the Disability cover buttons — Business Disability, Farmers Disability, Business Expenses — and can select 1 or more.',
      '', 'Steps to reproduce:',
      '1. New quote; set ANB 40, Male, occ C, Self-Employed, income $200,000.',
      '2. Click Business policy. 3. Confirm Business Disability / Farmers Disability / Business Expenses buttons present.',
      '4. Activate Business Disability; confirm its Monthly Benefit field appears.',
      '', 'Expected: all three business Disability cover buttons present; Business Disability activates (benefit field shows).',
    ].join('\n') });
    const quote = await freshBiz(page);
    for (const cover of ['Business Disability', 'Farmers Disability', 'Business Expenses']) {
      const present = await coverButtonExists(quote, cover);
      await recordStep(testInfo, page, { label: `Business Disability cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" present`).toBe(true);
    }
    await activateCover(quote, 'Business Disability');
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Business Disability selectable (Monthly Benefit field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: Business Disability selectable').toBe(true);
  });

  // ── AC03 — Business Disability controls ──
  test('AC03: Business Disability exposes Monthly Benefit + Classification[Employed(def)/Equity Owner (up to 75%)/Equity Owner (>75%)] + Benefit Period[6(def)/9/12/18/24 Months] + Waiting[30(def)/60/90 Days] + Business Security(unticked)+Partial Disablement(ticked) + Stepped', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Business Disability, Then: Monthly Benefit entry; Classification dropdown [Employed, Equity Owner (up to 75%), Equity Owner (>75%)];',
      'Premium Structure pre-populated "Stepped"; Benefit Period [6 Months(default), 9, 12, 18, 24 Months]; Waiting Period [30 Days(default), 60, 90 Days];',
      'checkboxes Business Security and Partial Disablement (default selected).',
      '', 'Steps to reproduce:',
      '1. New quote, Business, activate Business Disability. 2. Read the benefit field, classification, benefit period, waiting period, structure, checkboxes.',
      '', 'Expected: Classification default Employed with the 3 options; Benefit Period default 6 Months w/ 5 options; Waiting default 30 Days w/ 3 options;',
      'Business Security present + default UNticked; Partial Disablement present + default ticked; Premium Structure "Stepped".',
      '', 'Actual (current): matches — note Classification option ORDER in DOM is [Employed, Equity Owner (>75%), Equity Owner (up to 75%)]; asserted as a set.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1500);

    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Business Disability Monthly Benefit field present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: Monthly Benefit field').toBe(true);

    const cls = await getClassification(quote);
    await recordStep(testInfo, page, { label: 'Classification default', expected: 'Employed', actual: cls && cls.selected });
    expect(cls && cls.selected, 'AC03: Classification default Employed').toBe('Employed');
    await recordStep(testInfo, page, { label: 'Classification options (as a set)', expected: 'Employed, Equity Owner (up to 75%), Equity Owner (>75%)', actual: cls && cls.options.join(', ') });
    expect(new Set(cls ? cls.options : []), 'AC03: Classification options').toEqual(new Set(['Employed', 'Equity Owner (up to 75%)', 'Equity Owner (>75%)']));

    const bp = await getBenefitPeriod(quote);
    await recordStep(testInfo, page, { label: 'Benefit Period default', expected: '6 Months', actual: bp && bp.selected });
    expect(bp && bp.selected, 'AC03: Benefit Period default').toBe('6 Months');
    await recordStep(testInfo, page, { label: 'Benefit Period options', expected: '6/9/12/18/24 Months', actual: bp && bp.options.join('/') });
    expect(bp && bp.options, 'AC03: Benefit Period options').toEqual(['6 Months', '9 Months', '12 Months', '18 Months', '24 Months']);

    const wp = await getWaitingPeriod(quote);
    await recordStep(testInfo, page, { label: 'Waiting Period default', expected: '30 Days', actual: wp && wp.selected });
    expect(wp && wp.selected, 'AC03: Waiting Period default').toBe('30 Days');
    await recordStep(testInfo, page, { label: 'Waiting Period options', expected: '30/60/90 Days', actual: wp && wp.options.join('/') });
    expect(wp && wp.options, 'AC03: Waiting Period options').toEqual(['30 Days', '60 Days', '90 Days']);

    const ps = await getPremiumStructure(quote);
    await recordStep(testInfo, page, { label: 'Premium Structure pre-populated Stepped', expected: 'Stepped', actual: ps && ps.selected });
    expect(ps && ps.selected, 'AC03: Premium Structure Stepped').toBe('Stepped');

    const bs = await getCheckbox(quote, /Business Security/);
    await recordStep(testInfo, page, { label: 'Business Security present + default unticked', expected: 'present, unchecked', actual: JSON.stringify(bs) });
    expect(bs, 'AC03: Business Security present').not.toBeNull();
    expect(bs && bs.checked, 'AC03: Business Security default unticked').toBe(false);

    const pd = await getCheckbox(quote, /Partial Disablement/);
    await recordStep(testInfo, page, { label: 'Partial Disablement present + default ticked', expected: 'present, checked', actual: JSON.stringify(pd) });
    expect(pd, 'AC03: Partial Disablement present').not.toBeNull();
    expect(pd && pd.checked, 'AC03: Partial Disablement default ticked').toBe(true);
  });

  // ── AC04/AC05 — Farmers Disability controls ──
  test('AC04/AC05: Farmers Disability exposes Monthly Benefit + Benefit Period[6(def)/9/12/18/24 Months/5 Years] + Waiting[30(def)/60/90 Days] + Business Security/Partial Disablement; NO Classification', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: When I select Farmers Disability, Then: Monthly Benefit entry; Premium Structure "Stepped"; Benefit Period [6(def)/9/12/18/24 Months/5 Years]; Waiting [30(def)/60/90 Days]; Business Security + Partial Disablement(default) checkboxes.',
      'AC05: Given Farmers Disability, Then the system must NOT display/allow a Classification.',
      '', 'Steps to reproduce:',
      '1. New quote, Business, Self-Employed, occ C. 2. Activate Farmers Disability. 3. Read benefit field, benefit period, waiting, structure, checkboxes, and confirm NO classification dropdown.',
      '', 'Expected: Benefit Period includes "5 Years" (default 6 Months); Waiting [30/60/90 Days]; Business Security(unticked)+Partial Disablement(ticked); Premium Structure Stepped; Classification ABSENT.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Farmers Disability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1500);

    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Farmers Disability Monthly Benefit field present', expected: true, actual: siVisible });
    expect(siVisible, 'AC04: Monthly Benefit field').toBe(true);

    const bp = await getBenefitPeriod(quote);
    await recordStep(testInfo, page, { label: 'Farmers Benefit Period default', expected: '6 Months', actual: bp && bp.selected });
    expect(bp && bp.selected, 'AC04: Benefit Period default').toBe('6 Months');
    await recordStep(testInfo, page, { label: 'Farmers Benefit Period options (adds 5 Years)', expected: '6/9/12/18/24 Months/5 Years', actual: bp && bp.options.join('/') });
    expect(bp && bp.options, 'AC04: Benefit Period options incl. 5 Years').toEqual(['6 Months', '9 Months', '12 Months', '18 Months', '24 Months', '5 Years']);

    const wp = await getWaitingPeriod(quote);
    await recordStep(testInfo, page, { label: 'Farmers Waiting Period default + options', expected: '30 Days; 30/60/90 Days', actual: `${wp && wp.selected}; ${wp && wp.options.join('/')}` });
    expect(wp && wp.selected, 'AC04: Waiting default').toBe('30 Days');
    expect(wp && wp.options, 'AC04: Waiting options').toEqual(['30 Days', '60 Days', '90 Days']);

    const ps = await getPremiumStructure(quote);
    await recordStep(testInfo, page, { label: 'Farmers Premium Structure Stepped', expected: 'Stepped', actual: ps && ps.selected });
    expect(ps && ps.selected, 'AC04: Premium Structure Stepped').toBe('Stepped');

    const bs = await getCheckbox(quote, /Business Security/);
    const pd = await getCheckbox(quote, /Partial Disablement/);
    await recordStep(testInfo, page, { label: 'Farmers Business Security(unticked) + Partial Disablement(ticked)', expected: 'BS unchecked, PD checked', actual: `BS=${JSON.stringify(bs)} PD=${JSON.stringify(pd)}` });
    expect(bs && bs.checked, 'AC04: Business Security default unticked').toBe(false);
    expect(pd && pd.checked, 'AC04: Partial Disablement default ticked').toBe(true);

    // AC05: NO classification dropdown present anywhere
    const cls = await getClassification(quote);
    await recordStep(testInfo, page, { label: 'AC05: Classification dropdown ABSENT for Farmers', expected: null, actual: cls });
    expect(cls, 'AC05: no Classification for Farmers').toBeNull();
  });

  // ── AC09 — max 1 Business Disability ──
  test('AC09: after adding Business Disability the +Business Disability button is disabled (max 1)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given Farmers/Business Disability active, When I add Business Disability, Then the +Business Disability button is greyed out / non-clickable (cannot add a second).',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Business Disability. 2. Read the +Business Disability button disabled state.',
      '', 'Expected: +Business Disability button disabled after one is added.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1500);
    const disabled = await quote.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Business Disability'); return b ? b.disabled : null; });
    await recordStep(testInfo, page, { label: '+Business Disability disabled after adding one', expected: true, actual: disabled });
    expect(disabled, 'AC09: +Business Disability disabled').toBe(true);
  });

  // ── AC10 — max 1 Farmers Disability ──
  test('AC10: after adding Farmers Disability the +Farmers Disability button is disabled (max 1)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given Business Disability active, When I add Farmers Disability, Then the +Farmers Disability button is greyed out / non-clickable (cannot add a second).',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occ C, activate Farmers Disability. 2. Read the +Farmers Disability button disabled state.',
      '', 'Expected: +Farmers Disability button disabled after one is added.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Farmers Disability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1500);
    const disabled = await quote.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Farmers Disability'); return b ? b.disabled : null; });
    await recordStep(testInfo, page, { label: '+Farmers Disability disabled after adding one', expected: true, actual: disabled });
    expect(disabled, 'AC10: +Farmers Disability disabled').toBe(true);
  });

  // ── AC11 — add / remove cover ──
  test('AC11: Business Disability cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: When I have selected the cover type, Then I can add/remove it and view the premium change in the progress panel.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Business Disability, benefit $5,000 (present). 2. Remove — gone.',
      '', 'Expected: benefit field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await waitForSettle(quote, 1200);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    await recordStep(testInfo, page, { label: 'Business Disability benefit field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC11: added').toBe(true);
    await quote.evaluate(() => { const l = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove'); if (l.length) l[l.length - 1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    await recordStep(testInfo, page, { label: 'Business Disability benefit field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC11: removed').toBe(0);
  });

  // ── AC12 — Business Security tooltip ──
  test('AC12: Business Security tooltip text present ("Allows future increases without medical underwriting. Financial justification for increases required.")', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: When I click the "?" icon next to a label, Then the corresponding tooltip is displayed. Business Security tooltip: "Allows future increases without medical underwriting. Financial justification for increases required."',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Business Disability. 2. Search the DOM for the Business Security tooltip phrase.',
      '', 'Expected: the Business Security tooltip phrase is present in the rendered DOM.',
      '', 'Note: the "?" icons (fa-question-circle) carry no title/aria-label; the tooltip copy is present in the rendered DOM (confirmed via probe).',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1500);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    const has = /future increases without medical underwriting\.\s*Financial justification for increases required\./i.test(hay);
    await recordStep(testInfo, page, { label: 'Business Security tooltip text present', expected: true, actual: has });
    expect(has, 'AC12: Business Security tooltip present').toBe(true);
  });

  // ── AC13 — Business Disability age > 61 ──
  test('AC13: Business Disability + ANB > 61 → max-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given Business Disability, When age next birthday > 61, Then "The maximum Age Next Birthday for Business Disability is 61".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 62, activate Business Disability, benefit $5,000, Apply.',
      '', 'Expected: "The maximum Age Next Birthday for Business Disability is 61".',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 62 });
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Business Disability ANB 62 max-age error', expected: 'The maximum Age Next Birthday for Business Disability is 61', actual: e });
    expect(/The maximum Age Next Birthday for Business Disability is 61/i.test(e), `AC13. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC13 boundary: Business Disability at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13 (at-boundary accept): max ANB is 61 — Business Disability at exactly 61 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 61, activate Business Disability, benefit $5,000, Apply.',
      '', 'Expected: NO "Business Disability is 61" max-age error.',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 61 });
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    const has = /The maximum Age Next Birthday for Business Disability is 61/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Disability at ANB 61 accepted', expected: false, actual: has });
    expect(has, `AC13 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC14 — Farmers Disability age > 61 ──
  test('AC14: Farmers Disability + ANB > 61 → max-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC14: Given Farmers Disability, When age next birthday > 61, Then "The maximum Age Next Birthday for Farmers Disability is 61".',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occ C, ANB 62, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: "The maximum Age Next Birthday for Farmers Disability is 61".',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 62 });
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers Disability ANB 62 max-age error', expected: 'The maximum Age Next Birthday for Farmers Disability is 61', actual: e });
    expect(/The maximum Age Next Birthday for Farmers Disability is 61/i.test(e), `AC14. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC14 boundary: Farmers Disability at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC14 (at-boundary accept): max ANB is 61 — Farmers Disability at exactly 61 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occ C, ANB 61, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: NO "Farmers Disability is 61" max-age error.',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 61 });
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    const has = /The maximum Age Next Birthday for Farmers Disability is 61/i.test(e);
    await recordStep(testInfo, page, { label: 'Farmers Disability at ANB 61 accepted', expected: false, actual: has });
    expect(has, `AC14 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC15 — Business Disability $50,000 cap ──
  test('AC15: Business Disability monthly benefit > $50,000 → cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15: Given Business Disability, When monthly benefit > 50000, Then "The maximum allowable monthly benefit for Business Disability Cover is $50,000".',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Business Disability, monthly benefit $50,001, Apply.',
      '', 'Expected: "The maximum allowable monthly benefit for Business Disability Cover is $50,000".',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '50001'); // 50001 > 50000 cap
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Business Disability > $50,000 cap error', expected: 'The maximum allowable monthly benefit for Business Disability Cover is $50,000', actual: e });
    expect(/The maximum allowable monthly benefit for Business Disability Cover is \$50,000/i.test(e), `AC15. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC15 boundary: Business Disability monthly benefit exactly $50,000 is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15 (at-boundary accept): the Business Disability cap is $50,000 — exactly $50,000 must NOT raise the cap error.',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Business Disability, monthly benefit $50,000, Apply.',
      '', 'Expected: NO "$50,000" cap error.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '50000'); // exactly at $50,000 cap
    const e = await applyAndErrors(quote);
    const has = /The maximum allowable monthly benefit for Business Disability Cover is \$50,000/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Disability exactly $50,000 accepted', expected: false, actual: has });
    expect(has, `AC15 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC16 — Farmers Disability $10,000 cap (on ELIGIBLE occupation C so the cap fires cleanly) ──
  test('AC16: Farmers Disability monthly benefit > $10,000 (eligible occupation) → cap error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16: Given Farmers Disability, When monthly benefit > 10000, Then "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000".',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occupation C (eligible for Farmers), activate Farmers Disability, monthly benefit $10,001, Apply.',
      '', 'Expected: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000".',
      '', 'Note: occupation C is used because it is Farmers-eligible, so the $10,000 cap error fires cleanly without the "not available for the selected occupation" error masking it (confirmed via probe).',
    ].join('\n') });
    const quote = await freshBiz(page); // occ C, Self-Employed by default in freshBiz
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '10001'); // 10001 > 10000 cap
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers Disability > $10,000 cap error', expected: 'The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000', actual: e });
    expect(/The maximum allowable Farmers Disability monthly benefit for the selected occupation is \$10,000/i.test(e), `AC16. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC16 boundary: Farmers Disability monthly benefit exactly $10,000 (eligible occupation) is accepted (no cap error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16 (at-boundary accept): the Farmers Disability cap is $10,000 — exactly $10,000 on an eligible occupation must NOT raise the cap error.',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occupation C, activate Farmers Disability, monthly benefit $10,000, Apply.',
      '', 'Expected: NO "$10,000" cap error.',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '10000'); // exactly at $10,000 cap
    const e = await applyAndErrors(quote);
    const has = /The maximum allowable Farmers Disability monthly benefit for the selected occupation is \$10,000/i.test(e);
    await recordStep(testInfo, page, { label: 'Farmers Disability exactly $10,000 accepted', expected: false, actual: has });
    expect(has, `AC16 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC06/AC07/AC08 — Farmers occupation / employment-status eligibility (letter-code coverage) ──
  test('AC07: Farmers Disability + Employment Status "Employed" → employment-status error (+ occupation not available)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given Farmers Disability, When Employment Status is "Employed", Then "Eligibility for Farmers Disability Cover requires an Employment Status of either \'Self Employed\' or \'Employed by own company\'." (and the occupation-not-available error).',
      '', 'Steps to reproduce:', '1. New quote, Business, Employment Status = Employed, occ AA, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: the employment-status eligibility error appears.',
    ].join('\n') });
    const quote = await freshBiz(page, { employmentStatus: 'Employed', occupationCode: '1' });
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers + Employed employment-status error', expected: "Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company'", actual: e });
    expect(/Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company'/i.test(e), `AC07. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC06: Farmers Disability + occupation requiring Individual Consideration (IC) → underwriting message (+ occupation not available)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given Farmers Disability, When the selected occupation is not suitable, Then "Farmers Disability Cover is not available for the selected occupation." (Here: occupation IC, which additionally requires Individual Consideration.)',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occupation IC, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: "Farmers Disability Cover is not available for the selected occupation" (with the IC underwriting message).',
    ].join('\n') });
    const quote = await freshBiz(page, { occupationCode: '8' }); // IC
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers + IC occupation → not-available error', expected: 'Farmers Disability Cover is not available for the selected occupation', actual: e });
    expect(/Farmers Disability Cover is not available for the selected occupation/i.test(e), `AC06. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC08: Farmers Disability + ineligible occupation (U) → "This occupation is not eligible" + not available', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Farmers Disability, When the occupation is not eligible, Then "This occupation is not eligible." and "Farmers Disability Cover is not available for the selected occupation". (Here: occupation U.)',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occupation U, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: both "This occupation is not eligible" and "...not available for the selected occupation".',
    ].join('\n') });
    const quote = await freshBiz(page, { occupationCode: '7' }); // U
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers + U occupation → not-eligible', expected: 'This occupation is not eligible', actual: e });
    expect(/This occupation is not eligible/i.test(e), `AC08 (not eligible). Got: ${e.slice(0, 250)}`).toBe(true);
    await recordStep(testInfo, page, { label: 'Farmers + U occupation → not available for occupation', expected: 'Farmers Disability Cover is not available for the selected occupation', actual: e });
    expect(/Farmers Disability Cover is not available for the selected occupation/i.test(e), `AC08 (not available). Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC06/AC08 contrast: Farmers Disability + eligible occupation (C, Self-Employed) → NO occupation/eligibility error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06/AC08 (negative/contrast): an ELIGIBLE Farmers occupation must NOT raise the "not available for the selected occupation" / "not eligible" errors — proves the eligibility gate is specific, not always-on.',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occupation C (eligible), activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: no occupation-not-available and no not-eligible error.',
    ].join('\n') });
    const quote = await freshBiz(page); // occ C, Self-Employed
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    const hasOcc = /not available for the selected occupation/i.test(e) || /This occupation is not eligible/i.test(e);
    await recordStep(testInfo, page, { label: 'Eligible occupation C → no occupation/eligibility error', expected: false, actual: hasOcc });
    expect(hasOcc, `AC06/08 contrast. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  // ── AC17 — Farmers + personal Workability conjunction ──
  test('AC17: Farmers Disability + personal Workability → conjunction error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17: Given Farmers Disability, When personal policy Workability cover is also selected, Then "Farmers Disability Cover is not available to be taken in conjunction with Workability Cover".',
      '', 'Steps to reproduce:', '1. New quote, personal policy: activate Workability, benefit $5,000. 2. Switch to Business policy, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: "Farmers Disability Cover is not available to be taken in conjunction with Workability Cover".',
    ].join('\n') });
    const quote = await freshWorkabilityThenBiz(page);
    await activateCover(quote, 'Farmers Disability');
    const n = await quote.locator('input[id*="SumInsured"]').count();
    await fillCalcMask(sumInsuredInput(quote, n - 1), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers + Workability conjunction error', expected: 'Farmers Disability Cover is not available to be taken in conjunction with Workability Cover', actual: e });
    expect(/Farmers Disability Cover is not available to be taken in conjunction with Workability Cover/i.test(e), `AC17. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  // ── AC18 — Business Disability + personal Workability conjunction ──
  test('AC18: Business Disability + personal Workability → conjunction error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC18: Given Business Disability, When personal policy Workability cover is also selected, Then "Business Disability Cover is not available to be taken in conjunction with Workability Cover".',
      '', 'Steps to reproduce:', '1. New quote, personal policy: activate Workability, benefit $5,000. 2. Switch to Business policy, activate Business Disability, benefit $5,000, Apply.',
      '', 'Expected: "Business Disability Cover is not available to be taken in conjunction with Workability Cover".',
    ].join('\n') });
    const quote = await freshWorkabilityThenBiz(page);
    await activateCover(quote, 'Business Disability');
    const n = await quote.locator('input[id*="SumInsured"]').count();
    await fillCalcMask(sumInsuredInput(quote, n - 1), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Business + Workability conjunction error', expected: 'Business Disability Cover is not available to be taken in conjunction with Workability Cover', actual: e });
    expect(/Business Disability Cover is not available to be taken in conjunction with Workability Cover/i.test(e), `AC18. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  // ── AC19/AC20 — Business <-> Farmers mutual exclusivity ──
  test('AC19/AC20: Business Disability + Farmers Disability together → mutual-exclusivity error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19/AC20: Given Business Disability (or Farmers Disability), When the other of the two is also selected, Then "Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other".',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occ C. 2. Activate Business Disability, benefit $5,000. 3. Activate Farmers Disability, benefit $5,000. 4. Apply.',
      '', 'Expected: "Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other".',
      '', 'Note: both covers must carry a committed benefit for the rule to fire (with $0/uncommitted the min-premium rule fires instead — confirmed via probe).',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await waitForSettle(quote, 1500);
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 1), '5000');
    await waitForSettle(quote, 1500);
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Business + Farmers mutual-exclusivity error', expected: 'Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other', actual: e });
    expect(/Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other/i.test(e), `AC19/20. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  // ── AC22 — Business Security age > 56 ──
  test('AC22: Business Disability + Business Security + ANB > 56 → Business Security max-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC22: Given Business/Farmers Disability, When age next birthday > 56 and I select Business Security, Then "The maximum Age Next Birthday for Business Security is 56".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 57, activate Business Disability, benefit $5,000, tick Business Security, Apply.',
      '', 'Expected: "The maximum Age Next Birthday for Business Security is 56".',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 57 });
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await tickBusinessSecurity(quote);
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Business Security ANB 57 max-age error', expected: 'The maximum Age Next Birthday for Business Security is 56', actual: e });
    expect(/The maximum Age Next Birthday for Business Security is 56/i.test(e), `AC22. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC22 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC22 (at-boundary accept): Business Security max ANB is 56 — at exactly 56 must NOT raise the Business Security max-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 56, activate Business Disability, benefit $5,000, tick Business Security, Apply.',
      '', 'Expected: NO "Business Security is 56" error.',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 56 });
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await tickBusinessSecurity(quote);
    const e = await applyAndErrors(quote);
    const has = /The maximum Age Next Birthday for Business Security is 56/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Security at ANB 56 accepted', expected: false, actual: has });
    expect(has, `AC22 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC23 — Business Disability age < 17 ──
  test('AC23: Business Disability + ANB < 17 → min-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC23: Given Business Disability, When age next birthday < 17, Then "The minimum Age Next Birthday for Business Disability is 17".',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 16, activate Business Disability, benefit $5,000, Apply.',
      '', 'Expected: "The minimum Age Next Birthday for Business Disability is 17".',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 16 });
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Business Disability ANB 16 min-age error', expected: 'The minimum Age Next Birthday for Business Disability is 17', actual: e });
    expect(/The minimum Age Next Birthday for Business Disability is 17/i.test(e), `AC23. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC23 boundary: Business Disability at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC23 (at-boundary accept): min ANB is 17 — Business Disability at exactly 17 must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, ANB 17, activate Business Disability, benefit $5,000, Apply.',
      '', 'Expected: NO "Business Disability is 17" min-age error.',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 17 });
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    const has = /The minimum Age Next Birthday for Business Disability is 17/i.test(e);
    await recordStep(testInfo, page, { label: 'Business Disability at ANB 17 accepted', expected: false, actual: has });
    expect(has, `AC23 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC24 — Farmers Disability age < 17 ──
  test('AC24: Farmers Disability + ANB < 17 → min-age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC24: Given Farmers Disability, When age next birthday < 17, Then "The minimum Age Next Birthday for Farmers Disability is 17".',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occ C, ANB 16, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: "The minimum Age Next Birthday for Farmers Disability is 17".',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 16 });
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'Farmers Disability ANB 16 min-age error', expected: 'The minimum Age Next Birthday for Farmers Disability is 17', actual: e });
    expect(/The minimum Age Next Birthday for Farmers Disability is 17/i.test(e), `AC24. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC24 boundary: Farmers Disability at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC24 (at-boundary accept): min ANB is 17 — Farmers Disability at exactly 17 must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote, Business, Self-Employed, occ C, ANB 17, activate Farmers Disability, benefit $5,000, Apply.',
      '', 'Expected: NO "Farmers Disability is 17" min-age error.',
    ].join('\n') });
    const quote = await freshBiz(page, { age: 17 });
    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    const e = await applyAndErrors(quote);
    const has = /The minimum Age Next Birthday for Farmers Disability is 17/i.test(e);
    await recordStep(testInfo, page, { label: 'Farmers Disability at ANB 17 accepted', expected: false, actual: has });
    expect(has, `AC24 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  // ── AC25 — Business Disability classification / benefit-period combo ──
  test('AC25: Business Disability + Classification "Equity Owner (>75%)" + Benefit Period 18/24 Months → invalid-combo error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC25: Given Business Disability, When classification is "Equity Owner (>75%)" and I select Benefit Period 18 or 24 months, Then "The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months".',
      '', 'Steps to reproduce:', '1. New quote, Business, activate Business Disability, benefit $5,000. 2. Set Classification = Equity Owner (>75%). 3. Set Benefit Period = 18 Months. 4. Apply.',
      '', 'Expected: "The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months".',
    ].join('\n') });
    const quote = await freshBiz(page);
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await waitForSettle(quote, 1200);
    // Set classification via native selectOption, then self-verify it landed.
    await setSelectByFingerprint(quote, ['Employed', 'Equity Owner (>75%)'], 'Equity Owner (>75%)');
    await setSelectByFingerprint(quote, ['6 Months', '24 Months'], '18 Months');
    const state = await quote.evaluate(() => {
      const cls = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.text.includes('Equity Owner')));
      const bp = [...document.querySelectorAll('select')].find((s) => { const o = [...s.options].map((x) => x.text.trim()); return o.includes('6 Months') && o.includes('24 Months'); });
      return { classification: cls ? cls.options[cls.selectedIndex].text.trim() : null, benefitPeriod: bp ? bp.options[bp.selectedIndex].text.trim() : null };
    });
    // Self-verify the interaction genuinely took effect before trusting the Apply result.
    await recordStep(testInfo, page, { label: 'AC25 preconditions landed (Classification + Benefit Period)', expected: 'Equity Owner (>75%) + 18 Months', actual: `${state.classification} + ${state.benefitPeriod}` });
    expect(state.classification, 'AC25 precondition: classification set').toBe('Equity Owner (>75%)');
    expect(state.benefitPeriod, 'AC25 precondition: benefit period set').toBe('18 Months');
    const e = await applyAndErrors(quote);
    await recordStep(testInfo, page, { label: 'AC25 invalid classification/benefit-period combo error', expected: 'The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months', actual: e });
    expect(/The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months/i.test(e), `AC25. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  // ── AC21 — DEFERRED (genuinely unreachable on this account) ──
  test('AC21: Sharemilker occupation → Farmers Disability $5,000 cap', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC21: Given occupation "Sharemilker - Not an employee milker", When Farmers Disability is selected, Then "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $5,000".',
      '', 'Deferred reason: the named farming occupations in the story\'s Business Rules (Sharemilker, Dairy Farm Manager, etc.) are NOT selectable from the occupation control available to this test account.',
      'Probe (probe-business-farmers-disability.js, 2026-09-07) confirmed the Business-policy Occupation Code dropdown exposes only single-letter risk classes [AM/AA/A1/A2/B/C/S/U/IC] — there is no named-occupation typeahead on this screen for this account, so "Sharemilker - Not an employee milker" cannot be selected and the $5,000 sub-cap cannot be reached from the browser here.',
      '', 'Expected (per story): "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $5,000".',
    ].join('\n') });
    test.fixme(true, 'Named farming occupation "Sharemilker - Not an employee milker" is not selectable from the single-letter Occupation Code dropdown available to this account (probe-business-farmers-disability.js confirmed only AM/AA/A1/A2/B/C/S/U/IC). The $5,000 sub-cap requires that named occupation and cannot be reached from the browser here.');
  });
});

// Personal Disability Cover — Workability — acceptance-criteria mode (Jira ACB-2648).
// Source user story: docs/user-stories/User Story- Personal Disability Cover - Workability.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): positive + negative/absence +
// boundary-triple (AT-boundary accept asserted) + value-level, each surfaced via recordCheck.
//
// DOM confirmed via probe 2026-09-04 (income-based disability cover — needs Employment + Income):
//   Structure [Stepped(def), Level to Expiry]; Benefit Period [To Age 65(def), To Age 70] (only 2);
//   Waiting [30(def)/45/60/75/90 Days] (a distinct set from M&L/IP).
//   Max monthly benefit = min($10,000, 75%/12 of income) → $150k = $9,375; over-cap error verbatim
//   "The maximum allowable monthly benefit for Workability based on annual income $150,000 is $9,375".
//   DISCREPANCY (probe 2026-09-04): AC03 says Increasing Claim is "default ticked" but the app shows
//   it UNticked — encoded as expected-to-fail (AC03b) with a Discrepancy Evidence Record in the doc.
//   Workability cannot coexist with M&L / Income Protection (AC08; legacy DC-28 confirms).
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
  getInflationAdjustmentChecked,
  getCheckboxStateByLabel,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

async function getSelectByOptions(page, mustInclude, mustExclude) {
  return page.evaluate(({ inc, exc }) => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return inc.every((t) => o.includes(t)) && (!exc || !exc.some((t) => o.includes(t)));
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  }, { inc: mustInclude, exc: mustExclude });
}
async function freshWkQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
  await activateCover(quote, 'Workability');
  await waitForSettle(quote, 1500);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Personal Disability Cover — Workability (ACB-2648)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Disability covers available; Workability selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new personal-policy quote, Then I can apply for Disability cover.',
      'AC02: Given the Disability Cover section, Then I can see Mortgage & Living, Income Protection, Workability, And select 1 or more.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Check the 3 disability covers present; activate Workability.',
      '', 'Expected: all 3 disability covers present; Workability activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed', income: 150000 });
    for (const cover of ['Mortgage & Living', 'Income Protection', 'Workability']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Disability cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" present`).toBe(true);
    }
    await activateCover(quote, 'Workability');
    await waitForSettle(quote, 1000);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Workability is selectable (Monthly Benefit field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: Workability selectable').toBe(true);
  });

  test('AC03: Workability exposes SI + Premium Structure / Benefit Period / Waiting Period with documented options/defaults', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Workability, Then Monthly Benefit auto-populates (editable); Premium Structure [Stepped(default), Level to Expiry]; Benefit Period [To Age 65(default), To Age 70]; Waiting Period [30 Days(default), 45, 60, 75, 90 Days].',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate Workability. 3. Read each dropdown + defaults.',
      '', 'Expected: option sets + defaults exactly as documented (note the distinct benefit/waiting sets).',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Workability Monthly Benefit field present', expected: true, actual: siVisible });
    expect(siVisible, 'AC03: Monthly Benefit field present').toBe(true);
    const struct = await getSelectByOptions(quote, ['Stepped', 'Level to Expiry']);
    recordCheck(testInfo, { label: 'Premium Structure options + default', expected: 'Stepped(default), Level to Expiry', actual: `${(struct?.options||[]).join(', ')} [def=${struct?.selected}]` });
    expect(struct?.options, 'AC03: Structure options').toEqual(['Stepped', 'Level to Expiry']);
    expect(struct?.selected, 'AC03: Structure default Stepped').toBe('Stepped');
    // Benefit Period has ONLY To Age 65 / To Age 70 (exclude 2 Years to avoid matching M&L/IP's select).
    const benefit = await getSelectByOptions(quote, ['To Age 65', 'To Age 70'], ['2 Years']);
    recordCheck(testInfo, { label: 'Benefit Period options + default', expected: 'To Age 65(default), To Age 70', actual: `${(benefit?.options||[]).join(', ')} [def=${benefit?.selected}]` });
    expect(benefit?.options, 'AC03: Benefit Period options').toEqual(['To Age 65', 'To Age 70']);
    expect(benefit?.selected, 'AC03: Benefit Period default To Age 65').toBe('To Age 65');
    // Waiting has 45/75 Days (distinct from M&L/IP which have 14/180/365/730).
    const waiting = await getSelectByOptions(quote, ['30 Days', '45 Days', '75 Days']);
    recordCheck(testInfo, { label: 'Waiting Period options + default', expected: '30(default)/45/60/75/90 Days', actual: `${(waiting?.options||[]).join(', ')} [def=${waiting?.selected}]` });
    expect(waiting?.options, 'AC03: Waiting Period options').toEqual(['30 Days', '45 Days', '60 Days', '75 Days', '90 Days']);
    expect(waiting?.selected, 'AC03: Waiting Period default 30 Days').toBe('30 Days');
  });

  test('AC03b: Increasing Claim default (STORY says ticked) — CONFIRMED DISCREPANCY (app shows unticked)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: "Optional Benefits — Increasing Claim (default ticked)".',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate Workability. 3. Read the Increasing Claim checkbox.',
      '', 'Expected: Increasing Claim ticked by default.',
      'Actual (CONFIRMED DISCREPANCY, probe 2026-09-04): Increasing Claim is UNticked by default for',
      'Workability (unlike M&L and IP where it IS default-ticked). Encoded to the spec\'s expected value',
      '(ticked) and EXPECTED TO FAIL until the app default is corrected — see the Discrepancy Evidence',
      'Record in the test doc. Not weakened to match the app.',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    const inc = await getCheckboxStateByLabel(quote, 'Increasing Claim');
    recordCheck(testInfo, { label: 'Workability Increasing Claim default (story: ticked)', expected: true, actual: inc?.checked });
    expect(inc?.checked, 'AC03: Increasing Claim default-ticked (per story)').toBe(true);
  });

  test('AC04: Workability cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: When I have selected the cover type, Then I can add/remove/update it and view the premium change.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate Workability (auto-default benefit) — SI present. 3. Remove — SI gone.',
      '', 'Expected: Monthly Benefit field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Workability Monthly Benefit field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC04: added').toBe(true);
    await quote.evaluate(() => { const l=[...document.querySelectorAll('a')].filter((a)=>a.innerText.trim()==='Remove'); if(l.length) l[l.length-1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'Workability Monthly Benefit field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC04: removed').toBe(0);
  });

  test('AC05: only one Workability — "+ Workability" disabled after 1', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given the Disability section, When I select Workability, Then the "+ Workability" button is greyed out and non-clickable (cannot add another).',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate Workability. 3. Check the Workability button disabled.',
      '', 'Expected: +Workability disabled after 1.',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    const disabled = await quote.evaluate(() => { const b=[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().split('\n')[0]==='Workability'); return b?(b.disabled||/disabled|is-disabled/.test(b.className)):null; });
    recordCheck(testInfo, { label: '+Workability disabled after 1', expected: true, actual: disabled });
    expect(disabled, 'AC05: +Workability disabled after 1').toBe(true);
  });

  test('AC06/AC11: Workability Monthly Benefit > min($10k, 75%/12 of income) → max-benefit error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06/AC11: Given Workability, When the Monthly Benefit exceeds min($10,000, 75% of annual income / 12), Then error "The maximum allowable monthly benefit for Workability based on annual income $XXXX is $YYYY".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, income $150,000). 2. Activate Workability. 3. Enter Monthly Benefit $9,376',
      '   (min($10,000, $150,000*0.75/12=$9,375) = $9,375; +$1 over), Apply.',
      '',
      'Expected: "...based on annual income $150,000 is $9,375" error. Arithmetic (Rule #8): min($10,000, $9,375)=$9,375.',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '9376'); // $9,375 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Workability Monthly Benefit > $9,375', expected: 'Workability based on annual income $150,000 is $9,375', actual: e });
    expect(/maximum allowable monthly benefit for Workability based on annual income \$?150,?000 is \$?9,?375/i.test(e), `AC06/AC11. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC06/AC11 boundary: Workability Monthly Benefit exactly $9,375 is accepted (no max-benefit error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06/AC11 (at-boundary accept): the max is $9,375 at $150k income — Monthly Benefit at exactly $9,375 must NOT raise the max-benefit error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), Workability, Monthly Benefit $9,375 exactly, Apply.',
      '', 'Expected: NO "$9,375" max-benefit error.',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '9375'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum allowable monthly benefit for Workability based on annual income \$?150,?000 is \$?9,?375/i.test(e);
    recordCheck(testInfo, { label: 'Workability Monthly Benefit exactly $9,375 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC06/AC11 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC07: Workability + ANB > 61 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given Workability, When age next birthday > 61, Then error "The maximum Age Next Birthday for Workability is 61".',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 62. 2. Activate Workability, auto-default benefit, Apply.',
      '', 'Expected: "maximum Age Next Birthday for Workability ... 61" error.',
    ].join('\n') });
    const quote = await freshWkQuote(page, { age: 62, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Workability ANB > 61', expected: 'maximum Age Next Birthday for Workability ... 61', actual: e });
    expect(/maximum Age Next Birthday for Workability.*61/i.test(e), `AC07. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC07 boundary: Workability max age at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07 (at-boundary accept): max ANB is 61 — Workability at exactly 61 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 61. 2. Activate Workability, auto-default benefit, Apply.',
      '', 'Expected: NO "Workability ... 61" max-age error.',
    ].join('\n') });
    const quote = await freshWkQuote(page, { age: 61, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Workability.*61/i.test(e);
    recordCheck(testInfo, { label: 'Workability max age at ANB 61 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC07 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC13: Workability + ANB < 17 → minimum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given Workability, When age next birthday < 17, Then error "The minimum Age Next Birthday for Workability is 17".',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 16. 2. Activate Workability, auto-default benefit, Apply.',
      '', 'Expected: "minimum Age Next Birthday for Workability ... 17" error.',
    ].join('\n') });
    const quote = await freshWkQuote(page, { age: 16, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    // Best-effort commit — at an under-min-age the benefit field can render late/differently; the
    // min-age error surfaces on Apply regardless (as AC07 shows for the max-age side).
    await commitWithoutTyping(sumInsuredInput(quote, 0)).catch(() => {});
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for Workability ANB < 17', expected: 'minimum Age Next Birthday for Workability ... 17', actual: e });
    expect(/minimum Age Next Birthday for Workability.*17/i.test(e), `AC13. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC13 boundary: Workability min age at ANB 17 is accepted (no min-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13 (at-boundary accept): min ANB is 17 — Workability at exactly 17 must NOT raise the min-age error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 17. 2. Activate Workability, auto-default benefit, Apply.',
      '', 'Expected: NO "Workability ... 17" min-age error.',
    ].join('\n') });
    const quote = await freshWkQuote(page, { age: 17, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /minimum Age Next Birthday for Workability.*17/i.test(e);
    recordCheck(testInfo, { label: 'Workability min age at ANB 17 accepted (no min-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC13 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC08: Workability + Income Protection on the same policy → conjunction error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given Workability, When I also select Income Protection or Mortgage & Living, Then error "Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, $150k). 2. Activate Workability (auto-default benefit). 3. Activate Income Protection (auto-default benefit). 4. Apply.',
      '',
      'Expected: the "not available to be taken in conjunction with" conjunction error (legacy DC-28 confirms M&L/IP↔Workability exclusivity).',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await activateCover(quote, 'Income Protection');
    await commitWithoutTyping(sumInsuredInput(quote, 1));
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Workability + Income Protection raises the conjunction error', expected: 'not available to be taken in conjunction with', actual: e });
    expect(/not available to be taken in conjunction with/i.test(e), `AC08. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC12: Workability, unselecting Inflation Adjustment (with Increasing Claim ticked) → coupling error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: Given Workability, When I unselect Inflation Adjustment (while Increasing Claim is selected), Then error "If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken for this policy".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, $150k). 2. Activate Workability, auto-default benefit. 3. Tick Increasing Claim (app default is unticked — see AC03b). 4. Untick Inflation Adjustment. 5. Apply.',
      '',
      'Expected: the Increasing-Claim/Inflation coupling error.',
    ].join('\n') });
    const quote = await freshWkQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    // Ensure Increasing Claim is ON (app default is unticked for Workability per AC03b), then untick Inflation.
    await quote.evaluate(() => {
      const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
      const inc = boxes.find((c) => { let n=c.parentElement, t=''; for(let d=0;d<5&&n;d++){t=(n.innerText||'').trim().split('\n')[0]; if(t)break; n=n.parentElement;} return /Increasing Claim/i.test(t); });
      if (inc && !inc.checked) { inc.scrollIntoView({ block: 'center' }); inc.click(); }
    });
    await waitForSettle(quote, 1200);
    const inflBefore = await getInflationAdjustmentChecked(quote);
    recordCheck(testInfo, { label: 'Inflation Adjustment ticked by default (precondition)', expected: true, actual: inflBefore });
    await quote.evaluate(() => { const cb=document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]'); if(cb&&cb.checked){cb.scrollIntoView({block:'center'}); cb.click();} });
    await waitForSettle(quote, 1500);
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Unselecting Inflation with Increasing Claim raises the coupling error', expected: 'If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken', actual: e });
    expect(/If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken/i.test(e), `AC12. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  // ── Deferred ACs (documented, not silently omitted) ──
  test('AC09/AC09A/AC10: Workability × Business Disability / Farmers / Business Expenses conjunction errors', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC09/AC09A/AC10: Workability cannot coexist with Business Disability, Farmers Disability, or Business Expenses (order-dependent conjunction error). These are BUSINESS-policy disability covers.'].join('\n') });
    test.fixme(true, 'Deferred: AC09/AC09A/AC10 require Business-policy disability covers (Business Disability / Farmers / Business Expenses) on the same life as a personal Workability — cross-policy (personal + business) state. Best encoded once the Business-policy cover specs exist (next cluster). Workability↔M&L/IP exclusivity is verified as AC08 above; legacy DC-28 also confirms the personal-side exclusivity.');
  });
});

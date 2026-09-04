// Personal Disability Cover — Mortgage & Living — acceptance-criteria mode (Jira ACB-2653).
// Source user story: docs/user-stories/User Story- Personal Disability Cover - Mortgage & Living.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): positive + negative/absence +
// boundary-triple (AT-boundary accept asserted) + value-level, each surfaced via recordCheck.
//
// DOM confirmed via probe 2026-09-04 (income-based cover — needs Employment + Income). Dropdowns
// (all option sets confirmed): Cover Type [Annual Income(def), Monthly Mortgage]; Method [Agreed
// Value, Agreed Value Plus(def)]; Structure [Stepped(def), Level to Expiry]; Benefit Period
// [2 Years, 5 Years, To Age 65(def), To Age 70]; Waiting [14/30(def)/60/90/180/365/730 Days].
// Optional benefits (checkboxes): Increasing Claim (default-ticked), Income Top-up, Specific Injury
// Support, Immediate Assist, Ten-Hour Benefit (unticked when Employed), Mental Health Discount.
// Verified value: Agreed Value Plus max monthly benefit = 45% of income / 12 → $150k = $5,625; the
// over-cap error is verbatim "The maximum remaining monthly benefit for Mortgage and Living Cover
// Agreed Value Plus is $5,625" (matches legacy DC-15 + this story's AC11).
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
  tickCheckboxByLabel,
  clickApply,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Fingerprint each M&L dropdown by its distinctive option set.
async function getSelectByOptions(page, mustInclude) {
  return page.evaluate((inc) => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return inc.every((t) => o.includes(t));
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  }, mustInclude);
}
async function setSelectByOptions(page, mustInclude, label) {
  const info = await getSelectByOptions(page, mustInclude);
  if (!info) throw new Error(`Select with options ${mustInclude.join('/')} not found`);
  await page.locator(`[id="${info.id}"]`).selectOption({ label });
  await waitForSettle(page, 1200);
}
// Open a fresh quote (Employed, $150k income) and activate Mortgage & Living, auto-defaulting the benefit.
async function freshMlQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
  await activateCover(quote, 'Mortgage & Living');
  await waitForSettle(quote, 1500);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Personal Disability Cover — Mortgage & Living (ACB-2653)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Disability covers available (Mortgage & Living / Income Protection / Workability); 1+ selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new quote, Then I can apply for Disability cover.',
      'AC02: Given the Disability Cover section, Then I can see Mortgage & Living, Income Protection, Workability, And select 1 or more.',
      '', 'Steps to reproduce:', '1. New quote (Employed, income $150k). 2. Check the 3 disability cover buttons present; activate M&L.',
      '', 'Expected: all 3 disability covers present; M&L activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed', income: 150000 });
    for (const cover of ['Mortgage & Living', 'Income Protection', 'Workability']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Disability cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" present`).toBe(true);
    }
    await activateCover(quote, 'Mortgage & Living');
    await waitForSettle(quote, 1000);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Mortgage & Living is selectable (Monthly Benefit field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: M&L selectable').toBe(true);
  });

  test('AC03: M&L exposes all dropdowns with documented options/defaults + optional-benefit checkboxes (Increasing Claim default-ticked)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Mortgage & Living, Then: Cover Type [Annual Income(default), Monthly Mortgage]; Method [Agreed Value, Agreed Value Plus(default)]; Premium Structure [Stepped(default), Level to Expiry]; Benefit Period [2 Years, 5 Years, To Age 65(default), To Age 70]; Waiting Period [14/30(default)/60/90/180/365/730 Days]; optional-benefit checkboxes incl. Increasing Claim (default ticked); and a Split Benefit option.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate M&L. 3. Read each dropdown + defaults, the checkboxes, and Split Benefit presence.',
      '', 'Expected: option sets + defaults exactly as documented; Increasing Claim ticked by default; Split Benefit present.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    const coverType = await getSelectByOptions(quote, ['Annual Income', 'Monthly Mortgage']);
    recordCheck(testInfo, { label: 'Cover Type options + default', expected: 'Annual Income(default), Monthly Mortgage', actual: `${(coverType?.options||[]).join(', ')} [def=${coverType?.selected}]` });
    expect(coverType?.options, 'AC03: Cover Type options').toEqual(['Annual Income', 'Monthly Mortgage']);
    expect(coverType?.selected, 'AC03: Cover Type default Annual Income').toBe('Annual Income');
    const method = await getSelectByOptions(quote, ['Agreed Value', 'Agreed Value Plus']);
    recordCheck(testInfo, { label: 'Method options + default', expected: 'Agreed Value, Agreed Value Plus(default)', actual: `${(method?.options||[]).join(', ')} [def=${method?.selected}]` });
    expect(method?.options, 'AC03: Method options').toEqual(['Agreed Value', 'Agreed Value Plus']);
    expect(method?.selected, 'AC03: Method default Agreed Value Plus').toBe('Agreed Value Plus');
    const struct = await getSelectByOptions(quote, ['Stepped', 'Level to Expiry']);
    recordCheck(testInfo, { label: 'Premium Structure options + default', expected: 'Stepped(default), Level to Expiry', actual: `${(struct?.options||[]).join(', ')} [def=${struct?.selected}]` });
    expect(struct?.options, 'AC03: Structure options').toEqual(['Stepped', 'Level to Expiry']);
    expect(struct?.selected, 'AC03: Structure default Stepped').toBe('Stepped');
    const benefit = await getSelectByOptions(quote, ['2 Years', 'To Age 65', 'To Age 70']);
    recordCheck(testInfo, { label: 'Benefit Period options + default', expected: '2 Years, 5 Years, To Age 65(default), To Age 70', actual: `${(benefit?.options||[]).join(', ')} [def=${benefit?.selected}]` });
    expect(benefit?.options, 'AC03: Benefit Period options').toEqual(['2 Years', '5 Years', 'To Age 65', 'To Age 70']);
    expect(benefit?.selected, 'AC03: Benefit Period default To Age 65').toBe('To Age 65');
    const waiting = await getSelectByOptions(quote, ['14 Days', '30 Days', '730 Days']);
    recordCheck(testInfo, { label: 'Waiting Period options + default', expected: '14/30(default)/60/90/180/365/730 Days', actual: `${(waiting?.options||[]).join(', ')} [def=${waiting?.selected}]` });
    expect(waiting?.options, 'AC03: Waiting Period options').toEqual(['14 Days', '30 Days', '60 Days', '90 Days', '180 Days', '365 Days', '730 Days']);
    expect(waiting?.selected, 'AC03: Waiting Period default 30 Days').toBe('30 Days');
    // Increasing Claim default-ticked.
    const incClaim = await getCheckboxStateByLabel(quote, 'Increasing Claim');
    recordCheck(testInfo, { label: 'Increasing Claim checkbox default', expected: 'checked', actual: incClaim?.checked });
    expect(incClaim?.checked, 'AC03: Increasing Claim default-ticked').toBe(true);
    for (const label of ['Income Top-up Package', 'Specific Injury Support Benefit', 'Immediate Assist Package', 'Ten-Hour Benefit', 'Mental Health Discount']) {
      const st = await getCheckboxStateByLabel(quote, label);
      recordCheck(testInfo, { label: `Optional benefit "${label}" is present`, expected: 'present', actual: st ? 'present' : 'ABSENT' });
      expect(st, `AC03: "${label}" checkbox present`).not.toBeNull();
    }
    const splitPresent = await quote.evaluate(() => /Split Benefit/i.test(document.body.innerText));
    recordCheck(testInfo, { label: 'Split Benefit option present', expected: true, actual: splitPresent });
    expect(splitPresent, 'AC03: Split Benefit present').toBe(true);
  });

  test('AC08: only one Mortgage & Living — "+ Mortgage & Living" disabled after 1', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given the Disability section, When I select Mortgage & Living, Then the "+ Mortgage & Living" button is greyed out and non-clickable (cannot add another).',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate M&L. 3. Check the M&L button disabled.',
      '', 'Expected: +Mortgage & Living disabled after 1.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    const disabled = await quote.evaluate(() => { const b=[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().split('\n')[0]==='Mortgage & Living'); return b?(b.disabled||/disabled|is-disabled/.test(b.className)):null; });
    recordCheck(testInfo, { label: '+Mortgage & Living disabled after 1', expected: true, actual: disabled });
    expect(disabled, 'AC08: +M&L disabled after 1').toBe(true);
  });

  test('AC09: M&L cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: When I have selected the cover type, Then I can add/remove/update it and view the premium change.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate M&L (auto-default benefit) — SI field present. 3. Remove — SI field gone.',
      '', 'Expected: Monthly Benefit field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'M&L Monthly Benefit field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC09: added').toBe(true);
    await quote.evaluate(() => { const l=[...document.querySelectorAll('a')].filter((a)=>a.innerText.trim()==='Remove'); if(l.length) l[l.length-1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'M&L Monthly Benefit field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC09: removed').toBe(0);
  });

  test('AC10: M&L + ANB > 61 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given Mortgage & Living, When age next birthday > 61, Then error "The maximum age next birthday for Mortgage & Living is 61".',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 62. 2. Activate M&L, auto-default benefit, Apply.',
      '', 'Expected: "maximum age next birthday for Mortgage & Living is 61" error.',
    ].join('\n') });
    const quote = await freshMlQuote(page, { age: 62, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for M&L ANB > 61', expected: 'maximum Age Next Birthday for Mortgage & Living ... 61', actual: e });
    expect(/maximum Age Next Birthday for Mortgage & Living.*is 61/i.test(e), `AC10. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC10 boundary: M&L max age at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10 (at-boundary accept): max ANB is 61 — M&L at exactly 61 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 61. 2. Activate M&L, auto-default benefit, Apply.',
      '', 'Expected: NO "Mortgage & Living is 61" max-age error.',
    ].join('\n') });
    const quote = await freshMlQuote(page, { age: 61, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Mortgage & Living.*is 61/i.test(e);
    recordCheck(testInfo, { label: 'M&L max age at ANB 61 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC10 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC11: M&L Agreed Value Plus + Monthly Benefit > 45%/12 of income → max-benefit error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: Given Mortgage & Living – Agreed Value Plus, When Monthly Benefit exceeds $7,500 OR 115% of mortgage repayments OR 45% of annual income, Then error "The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value Plus is $XXXX".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, income $150,000), Method = Agreed Value Plus (default). 2. Activate M&L.',
      '3. Enter Monthly Benefit $5,626 (45%/12 of $150k = $5,625; +$1 over), Apply.',
      '',
      'Expected: "...Agreed Value Plus is $5,625" error. Arithmetic (Rule #8): $150,000 * 0.45 / 12 = $5,625.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '5626'); // $5,625 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for M&L AV+ Monthly Benefit > $5,625', expected: 'Agreed Value Plus is $5,625', actual: e });
    expect(/Mortgage and Living Cover Agreed Value Plus is \$?5,?625/i.test(e), `AC11. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC11 boundary: M&L AV+ Monthly Benefit exactly $5,625 is accepted (no max-benefit error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11 (at-boundary accept): the AV+ max is $5,625 at $150k income — Monthly Benefit at exactly $5,625 must NOT raise the max-benefit error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), M&L, Monthly Benefit $5,625 exactly, Apply.',
      '', 'Expected: NO "Agreed Value Plus is $5,625" error.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '5625'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Mortgage and Living Cover Agreed Value Plus is \$?5,?625/i.test(e);
    recordCheck(testInfo, { label: 'M&L AV+ Monthly Benefit exactly $5,625 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC11 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC18: M&L with Increasing Claim ticked, unselecting Inflation Adjustment → coupling error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC18: Given Mortgage & Living, When I unselect Inflation Adjustment (while Increasing Claim is selected), Then error "If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken for this policy".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, $150k). 2. Activate M&L (Increasing Claim is default-ticked, Inflation default-ticked).',
      '3. Untick Inflation Adjustment Benefit. 4. Apply.',
      '',
      'Expected: the Increasing-Claim/Inflation coupling error.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    // Confirm Increasing Claim is on (default), then untick Inflation Adjustment Benefit.
    const inflBefore = await getInflationAdjustmentChecked(quote);
    recordCheck(testInfo, { label: 'Inflation Adjustment ticked by default (precondition)', expected: true, actual: inflBefore });
    await quote.evaluate(() => { const cb=document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]'); if(cb&&cb.checked){cb.scrollIntoView({block:'center'}); cb.click();} });
    await waitForSettle(quote, 1500);
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Unselecting Inflation with Increasing Claim raises the coupling error', expected: 'If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken', actual: e });
    expect(/If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken/i.test(e), `AC18. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC26: Ten-Hour Benefit is UNticked by default for an Employed (non-Self-Employed) life', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC26: Given Employment Status other than Self-Employed, When I select Mortgage & Living on a PERSONAL policy, Then the Ten-Hour Benefit tick box shows unticked (and is selectable).',
      '', 'Steps to reproduce:', '1. New quote, Employment = Employed, income $150k. 2. Activate M&L. 3. Read Ten-Hour Benefit checkbox.',
      '', 'Expected: Ten-Hour Benefit unticked and enabled.',
    ].join('\n') });
    const quote = await freshMlQuote(page, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    const st = await getCheckboxStateByLabel(quote, 'Ten-Hour Benefit');
    recordCheck(testInfo, { label: 'Ten-Hour Benefit default state (Employed)', expected: 'unticked & enabled', actual: JSON.stringify(st) });
    expect(st?.checked, 'AC26: Ten-Hour Benefit unticked for Employed').toBe(false);
    expect(st?.disabled, 'AC26: Ten-Hour Benefit selectable for Employed').toBe(false);
  });

  test('AC25: Ten-Hour Benefit is TICKED by default for a Self-Employed life', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC25: Given Employment Status = Self-Employed, When I select Mortgage & Living on a PERSONAL policy, Then the Ten-Hour Benefit tick box shows ticked.',
      '', 'Steps to reproduce:', '1. New quote, Employment = Self-Employed, income $150k. 2. Activate M&L. 3. Read Ten-Hour Benefit checkbox.',
      '', 'Expected: Ten-Hour Benefit ticked.',
    ].join('\n') });
    const quote = await freshMlQuote(page, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Self-Employed', income: 150000 });
    const st = await getCheckboxStateByLabel(quote, 'Ten-Hour Benefit');
    recordCheck(testInfo, { label: 'Ten-Hour Benefit default state (Self-Employed)', expected: 'ticked', actual: JSON.stringify(st) });
    expect(st?.checked, 'AC25: Ten-Hour Benefit ticked for Self-Employed').toBe(true);
  });

  test('AC12: M&L "?" tooltips show the documented Split Benefit / Agreed Value(+) text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: Given the M&L section, When I click a "?" icon, Then the tooltip shows the documented text — e.g. Split Benefit ("Splits the total monthly benefit into two sums insured..."), Agreed Value ("will offset \'other income\'..."), Agreed Value Plus ("will not offset \'other income\'...").',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate M&L. 3. Search DOM/title attributes for the tooltip phrases.',
      '', 'Expected: the Split Benefit and Agreed Value (Plus) tooltip phrases are present.',
    ].join('\n') });
    const quote = await freshMlQuote(page);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    recordCheck(testInfo, { label: 'Split Benefit tooltip text present', expected: 'contains "Splits the total monthly benefit into two"', actual: /Splits the total monthly benefit into two/i.test(hay) });
    expect(hay, 'AC12: Split Benefit tooltip').toMatch(/Splits the total monthly benefit into two/i);
    recordCheck(testInfo, { label: 'Agreed Value Plus tooltip text present', expected: "contains \"will not offset 'other income'\"", actual: /will not offset .other income./i.test(hay) });
    expect(hay, 'AC12: Agreed Value Plus tooltip').toMatch(/will not offset .other income./i);
  });

  // ── Deferred ACs (documented, not silently omitted) ──
  // Each requires either the day-2 tax-tier excel figures (unverifiable by hand) or multi-cover /
  // cross-policy net-remaining arithmetic / dynamic state transitions beyond a single reachable
  // assertion. Encoded as fixme(true, reason) with the AC context so the report shows why.
  test('AC04: Split Benefit auto-calc + opposite-method default + its own structure/waiting', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC04: Split Benefit prepopulates via the net-remaining calc, defaults to the OPPOSITE method to the main benefit, and exposes its own Premium Structure + Waiting Period.'].join('\n') });
    test.fixme(true, 'Deferred: the split-benefit amount is a net-remaining calculation (Step1 minus existing net MLC benefit) whose exact value depends on the day-2 tax-tier excel; the opposite-method default + own dropdowns are testable but the value assertion is not hand-verifiable. Encode once the excel reference values are available.');
  });
  test('AC05/AC06/AC15/AC16: Monthly Mortgage cover type — repayment field, calc, and required-field error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC05/AC15: Monthly Mortgage / Annual Income cover types auto-populate the monthly benefit via business rules (editable). AC06: no mortgage repayment entered → "Please complete the \'Mortgage Monthly Repayment\' field below". AC16: benefit above the calculated value → max-benefit error.'].join('\n') });
    test.fixme(true, 'Deferred: the auto-populated monthly benefit under Monthly Mortgage / Annual Income depends on the day-2 tax-tier excel figures (115% of mortgage repayments / tiered after-tax income) that cannot be hand-verified here. AC06 required-field error is testable and should be split out and encoded next pass.');
  });
  test('AC07/AC14/AC16/AC17: cross-policy / cross-cover combined-benefit and Agreed Value ($XXXX) caps', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC07/AC16: combined main + split monthly benefit across policies exceeding the calculated benefit → "$XXXX" error. AC14: Agreed Value (not Plus) over 115% of mortgage repayments → "$XXXX" error. AC17: combined MLC + IP per life over the calculated value → the "lower IP/MLC amount" error.'].join('\n') });
    test.fixme(true, 'Deferred: each XXXX is a calculated monthly benefit derived from the day-2 tax-tier excel and/or cross-policy net-remaining arithmetic (multi-policy state). AC11/AC14 Agreed Value Plus 45%/12 is verified above; the tax-tiered Agreed Value and cross-cover figures need the excel reference to assert exact values.');
  });
  test('AC19/AC20/AC21/AC22/AC23/AC24: Mental Health Discount cross-cover sync + 2-Year-benefit-period greying', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC20-24: with MLC + IP on the same policy, Mental Health Discount is greyed when benefit period is 2 Years (one/both covers), auto-syncs the checkbox across both covers when enabled, and recomputes premium. AC19: duplicate M&L with a different method → "Please select the same calculation method for all Mortgage & Living Covers".'].join('\n') });
    test.fixme(true, 'Deferred: requires MLC + IP coexisting with matched/mismatched benefit periods and asserting cross-cover checkbox auto-sync + premium recompute — multi-cover reactive state best encoded as its own focused spec after the single-cover MLC and IP specs are green. AC19 (same-method) is testable and should be split out next pass.');
  });
  test('AC27/AC28/AC29/AC30: Ten-Hour Benefit dynamic employment/occupation transitions', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC27/AC28: changing Employment Status to/from Self-Employed re-ticks Ten-Hour Benefit (and it should not change back). AC29/AC30: Home Duties/Homemaker occupation disables Ten-Hour Benefit; changing away re-enables it.'].join('\n') });
    test.fixme(true, 'Deferred: dynamic post-activation state transitions (change employment/occupation AFTER M&L is active, then re-read the Ten-Hour checkbox). The static defaults are covered by AC25/AC26 above; the transition sequences need a dedicated stateful test to avoid the single-session reactive-race issues, encoded next pass.');
  });
});

// Personal Disability Cover — Income Protection — acceptance-criteria mode (Jira ACB-2646).
// Source user story: docs/user-stories/User Story- Personal Disability Cover - Income Protection.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): positive + negative/absence +
// boundary-triple (AT-boundary accept asserted) + value-level, each surfaced via recordCheck.
//
// DOM confirmed via probe 2026-09-04 (income-based cover — needs Employment + Income). Dropdowns:
// Definition [Loss Of Earnings, Loss Of Earnings Plus(def)]; Structure [Stepped(def), Level to
// Expiry]; Benefit Period [2 Years, 5 Years, To Age 65(def), To Age 70]; Waiting [14/30(def)/60/90/
// 180/365/730 Days]. Checkboxes: Increasing Claim (default-ticked), Income Top-up, Specific Injury
// Support, Immediate Assist, Mental Health Discount. Split Waiting Period present; +IP disabled
// after 1. Verified value: max monthly benefit = 75% of income / 12 → $150k = $9,375; over-cap error
// verbatim "The maximum remaining monthly benefit for Income Protection benefit is $9,375".
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

async function getSelectByOptions(page, mustInclude) {
  return page.evaluate((inc) => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return inc.every((t) => o.includes(t));
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  }, mustInclude);
}
async function freshIpQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
  await activateCover(quote, 'Income Protection');
  await waitForSettle(quote, 1500);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));

test.describe('Personal Disability Cover — Income Protection (ACB-2646)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Disability covers available; Income Protection selectable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser, When creating a new personal-policy quote, Then I can apply for Disability cover.',
      'AC02: Given the Disability Cover section, Then I can see Mortgage & Living, Income Protection, Workability, And select 1 or more.',
      '', 'Steps to reproduce:', '1. New quote (Employed, income $150k). 2. Check the 3 disability covers present; activate Income Protection.',
      '', 'Expected: all 3 disability covers present; IP activates.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed', income: 150000 });
    for (const cover of ['Mortgage & Living', 'Income Protection', 'Workability']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Disability cover "${cover}" is available`, expected: true, actual: present });
      expect(present, `AC02: "${cover}" present`).toBe(true);
    }
    await activateCover(quote, 'Income Protection');
    await waitForSettle(quote, 1000);
    const siVisible = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'Income Protection is selectable (Monthly Benefit field appears)', expected: true, actual: siVisible });
    expect(siVisible, 'AC02: IP selectable').toBe(true);
  });

  test('AC03: IP exposes all dropdowns with documented options/defaults + optional-benefit checkboxes (Increasing Claim default-ticked)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I select Income Protection, Then: Definition [Loss Of Earnings, Loss Of Earnings Plus(default)]; Premium Structure [Stepped(default), Level to Expiry]; Benefit Period [2 Years, 5 Years, To Age 65(default), To Age 70]; Waiting Period [14/30(default)/60/90/180/365/730 Days]; optional-benefit checkboxes incl. Increasing Claim (default ticked); and a Split Waiting Period option.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate IP. 3. Read each dropdown + defaults, the checkboxes, and Split Waiting Period presence.',
      '', 'Expected: option sets + defaults exactly as documented; Increasing Claim ticked by default; Split Waiting Period present.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    const def = await getSelectByOptions(quote, ['Loss Of Earnings', 'Loss Of Earnings Plus']);
    recordCheck(testInfo, { label: 'Definition options + default', expected: 'Loss Of Earnings, Loss Of Earnings Plus(default)', actual: `${(def?.options||[]).join(', ')} [def=${def?.selected}]` });
    expect(def?.options, 'AC03: Definition options').toEqual(['Loss Of Earnings', 'Loss Of Earnings Plus']);
    expect(def?.selected, 'AC03: Definition default LOE Plus').toBe('Loss Of Earnings Plus');
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
    const incClaim = await getCheckboxStateByLabel(quote, 'Increasing Claim');
    recordCheck(testInfo, { label: 'Increasing Claim checkbox default', expected: 'checked', actual: incClaim?.checked });
    expect(incClaim?.checked, 'AC03: Increasing Claim default-ticked').toBe(true);
    for (const label of ['Income Top-up Package', 'Specific Injury Support Benefit', 'Immediate Assist Package', 'Mental Health Discount']) {
      const st = await getCheckboxStateByLabel(quote, label);
      recordCheck(testInfo, { label: `Optional benefit "${label}" is present`, expected: 'present', actual: st ? 'present' : 'ABSENT' });
      expect(st, `AC03: "${label}" checkbox present`).not.toBeNull();
    }
    const splitPresent = await quote.evaluate(() => /Split Waiting Period/i.test(document.body.innerText));
    recordCheck(testInfo, { label: 'Split Waiting Period option present', expected: true, actual: splitPresent });
    expect(splitPresent, 'AC03: Split Waiting Period present').toBe(true);
  });

  test('AC06: only one Income Protection — "+ Income Protection" disabled after 1', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given the Disability section, When I select Income Protection, Then the "+ Income Protection" button is greyed out and non-clickable (cannot add another).',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate IP. 3. Check the IP button disabled.',
      '', 'Expected: +Income Protection disabled after 1.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    const disabled = await quote.evaluate(() => { const b=[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().split('\n')[0]==='Income Protection'); return b?(b.disabled||/disabled|is-disabled/.test(b.className)):null; });
    recordCheck(testInfo, { label: '+Income Protection disabled after 1', expected: true, actual: disabled });
    expect(disabled, 'AC06: +IP disabled after 1').toBe(true);
  });

  test('AC08: IP cover can be added and removed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: When I have selected the cover type, Then I can add/remove/update it and view the premium change.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate IP (auto-default benefit) — SI field present. 3. Remove — SI field gone.',
      '', 'Expected: Monthly Benefit field present after add, absent after remove.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 1000);
    const presentAfterAdd = await sumInsuredInput(quote, 0).isVisible();
    recordCheck(testInfo, { label: 'IP Monthly Benefit field present after adding', expected: true, actual: presentAfterAdd });
    expect(presentAfterAdd, 'AC08: added').toBe(true);
    await quote.evaluate(() => { const l=[...document.querySelectorAll('a')].filter((a)=>a.innerText.trim()==='Remove'); if(l.length) l[l.length-1].click(); });
    await waitForSettle(quote, 1500);
    const countAfterRemove = await quote.locator('input[id*="SumInsured"]').count();
    recordCheck(testInfo, { label: 'IP Monthly Benefit field removed after removing', expected: 0, actual: countAfterRemove });
    expect(countAfterRemove, 'AC08: removed').toBe(0);
  });

  test('AC17: IP + ANB > 61 → maximum age error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17: Given Income Protection, When age next birthday > 61, Then error "The maximum age next birthday for Income Protection is 61".',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 62. 2. Activate IP, auto-default benefit, Apply.',
      '', 'Expected: "maximum age next birthday for Income Protection is 61" error.',
    ].join('\n') });
    const quote = await freshIpQuote(page, { age: 62, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for IP ANB > 61', expected: 'maximum Age Next Birthday for Income Protection ... 61', actual: e });
    expect(/maximum Age Next Birthday for Income Protection.*is 61/i.test(e), `AC17. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC17 boundary: IP max age at ANB 61 is accepted (no max-age error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17 (at-boundary accept): max ANB is 61 — IP at exactly 61 must NOT raise the max-age error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), ANB 61. 2. Activate IP, auto-default benefit, Apply.',
      '', 'Expected: NO "Income Protection is 61" max-age error.',
    ].join('\n') });
    const quote = await freshIpQuote(page, { age: 61, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /maximum Age Next Birthday for Income Protection.*is 61/i.test(e);
    recordCheck(testInfo, { label: 'IP max age at ANB 61 accepted (no max-age error)', expected: false, actual: hasErr });
    expect(hasErr, `AC17 boundary. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC19: IP Monthly Benefit > 75%/12 of income → max-benefit error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19: Given Income Protection, When the Monthly Benefit entered is greater than the calculated Monthly Benefit, Then error "The maximum remaining monthly benefit for Income Protection benefit is $XXXX".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, income $150,000). 2. Activate IP (LOE+ default). 3. Enter Monthly Benefit $9,376',
      '   (75%/12 of $150k = $9,375; +$1 over), Apply.',
      '',
      'Expected: "...Income Protection benefit is $9,375" error. Arithmetic (Rule #8): $150,000 * 0.75 / 12 = $9,375.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '9376'); // $9,375 cap + $1
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for IP Monthly Benefit > $9,375', expected: 'Income Protection benefit is $9,375', actual: e });
    expect(/Income Protection benefit is \$?9,?375/i.test(e), `AC19. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC19 boundary: IP Monthly Benefit exactly $9,375 is accepted (no max-benefit error)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19 (at-boundary accept): the IP max is $9,375 at $150k income — Monthly Benefit at exactly $9,375 must NOT raise the max-benefit error.',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k), IP, Monthly Benefit $9,375 exactly, Apply.',
      '', 'Expected: NO "Income Protection benefit is $9,375" error.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '9375'); // exactly at the cap
    await clickApply(quote);
    const e = await errText(quote);
    const hasErr = /Income Protection benefit is \$?9,?375/i.test(e);
    recordCheck(testInfo, { label: 'IP Monthly Benefit exactly $9,375 accepted', expected: false, actual: hasErr });
    expect(hasErr, `AC19 boundary. Got: ${e.slice(0, 250)}`).toBe(false);
  });

  test('AC25: IP maximum monthly benefit is capped at $30,000 (very high income)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC25: Given Income Protection, When the combined Monthly Benefit exceeds $30,000, Then error "The maximum remaining monthly benefit for Income Protection benefit is $30,000." (the absolute IP cap; max monthly benefit = max of net-income/12 capped at $30,000).',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, income $1,000,000 — net-income/12 exceeds $30k). 2. Activate IP.',
      '3. Enter Monthly Benefit $30,001 (just over the absolute $30,000 cap), Apply.',
      '',
      'Expected: "...Income Protection benefit is $30,000." error.',
    ].join('\n') });
    const quote = await freshIpQuote(page, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 1000000 });
    await fillCalcMask(sumInsuredInput(quote, 0), '30001'); // just over the absolute $30,000 cap
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Error shown for IP Monthly Benefit > $30,000 (high income)', expected: 'Income Protection benefit is $30,000', actual: e });
    expect(/Income Protection benefit is \$?30,?000/i.test(e), `AC25. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC22: IP with Increasing Claim ticked, unselecting Inflation Adjustment → coupling error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC22: Given Income Protection, When I unselect Inflation Adjustment (while Increasing Claim is selected), Then error "If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken for this policy".',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate IP (Increasing Claim + Inflation both default-ticked). 3. Untick Inflation Adjustment. 4. Apply.',
      '', 'Expected: the Increasing-Claim/Inflation coupling error.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    const inflBefore = await getInflationAdjustmentChecked(quote);
    recordCheck(testInfo, { label: 'Inflation Adjustment ticked by default (precondition)', expected: true, actual: inflBefore });
    await quote.evaluate(() => { const cb=document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]'); if(cb&&cb.checked){cb.scrollIntoView({block:'center'}); cb.click();} });
    await waitForSettle(quote, 1500);
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Unselecting Inflation with Increasing Claim raises the coupling error', expected: 'If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken', actual: e });
    expect(/If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken/i.test(e), `AC22. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC24: two IP covers with different definitions → same-definition error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC24: Given multiple Income Protection covers for a life, When I select different definitions for those covers, Then error "Please ensure all Income Protection covers for an individual life have the same definition - either LOE or LOE+".',
      '',
      'Steps to reproduce:',
      '1. New quote (Employed, $150k). 2. Activate IP, set its Definition = Loss Of Earnings. 3. Add IP on a second personal policy, set its Definition = Loss Of Earnings Plus. 4. Apply.',
      '',
      'Expected: the same-definition error. NOTE: a second IP on the SAME policy is blocked (AC06), so',
      'this needs a second personal policy — if that setup is not reachable here it is deferred with evidence.',
    ].join('\n') });
    test.fixme(true, 'Deferred: AC06 blocks a second IP on the same policy, so AC24 requires a second personal policy (+ Personal Policy) with its own IP at a different definition — multi-policy state best encoded in a dedicated stateful test after the single-cover IP spec is green. The single-cover pieces (definition dropdown + values) are covered by AC03.');
  });

  test('AC18: IP "?" tooltips show the documented Split Waiting Period / Income Top-up text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC18: Given the IP section, When I click a "?" icon, Then the tooltip shows the documented text — e.g. Split Waiting Period ("Splits the total monthly benefit into two sums insured each with a different waiting period."), Income Top-up Package ("Income booster - Pays an extra 33%...").',
      '', 'Steps to reproduce:', '1. New quote (Employed, $150k). 2. Activate IP. 3. Search DOM/title attributes for the tooltip phrases.',
      '', 'Expected: the Split Waiting Period and Income Top-up tooltip phrases are present.',
    ].join('\n') });
    const quote = await freshIpQuote(page);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    recordCheck(testInfo, { label: 'Split Waiting Period tooltip text present', expected: 'contains "each with a different waiting period"', actual: /each with a different waiting period/i.test(hay) });
    expect(hay, 'AC18: Split Waiting Period tooltip').toMatch(/each with a different waiting period/i);
    recordCheck(testInfo, { label: 'Income Top-up Package tooltip text present', expected: 'contains "Income booster"', actual: /Income booster/i.test(hay) });
    expect(hay, 'AC18: Income Top-up tooltip').toMatch(/Income booster/i);
  });

  // ── Deferred ACs (documented, not silently omitted) ──
  test('AC04/AC10/AC12/AC14/AC16: Split Waiting Period auto-calc split monthly benefit + editability', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC04/AC10/AC12/AC14/AC16: selecting Split Waiting Period auto-calculates a split monthly benefit (net-remaining) via business rules, exposes its own waiting period (14 Days default), and lets both the main and split monthly benefit be amended.'].join('\n') });
    test.fixme(true, 'Deferred: the split monthly benefit is a net-remaining calc (max monthly benefit minus existing net IP benefit incl. split) whose exact value depends on the day-2 tax-tier excel; the Split Waiting Period control + its own waiting dropdown are testable but the value assertion is not hand-verifiable. Encode with the excel reference values.');
  });
  test('AC07/AC09/AC11/AC13/AC15/AC21: LOE vs LOE+ calculated max monthly benefit values', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC09/AC13: LOE / LOE+ auto-calculate & display the maximum monthly benefit via business rules. AC07: combined main+split over the calculated benefit → "$XXXX" error. AC11/AC15: the max monthly benefit is amendable. AC21: adding IP after MLC auto-calcs via the "Remaining GROSS IP balance insurable" rule.'].join('\n') });
    test.fixme(true, 'Deferred: the tiered net-income LOE/LOE+ figures and the post-MLC "remaining GROSS IP balance" depend on the day-2 tax-tier excel and cross-cover state. The simple 75%/12 boundary ($9,375) and the absolute $30,000 cap are verified above (AC19/AC25); the tiered/cross-cover exact values need the excel reference.');
  });
  test('AC20: combined MLC + IP over the calculated benefit → "lower IP/MLC amount" error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC20: with MLC + IP on the same policy per life, when combined monthly benefit exceeds the calculated monthly benefit, error "You must lower IP amount to $XXXX to retain that level of MLC cover. Or lower the total MLC amount to $YYYY to retain that level of IP Cover".'].join('\n') });
    test.fixme(true, 'Deferred: cross-cover (MLC + IP) combined-benefit rule whose $XXXX/$YYYY are calculated-benefit-minus-other-cover figures from the day-2 tax-tier excel. Best encoded as a dedicated MLC+IP interaction spec with the excel reference values.');
  });
  test('AC23: IP with Benefit Period 2 Years → Mental Health Discount greyed out', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC23: Given Income Protection, When Benefit Period = 2 Years, Then the Mental Health Discount option is greyed out.'].join('\n') });
    test.fixme(true, 'Deferred (quick follow-up): testable in isolation (set Benefit Period = 2 Years, assert Mental Health Discount checkbox disabled) but the reactive re-render of the checkbox disabled-state after changing the benefit-period dropdown needs a stable-signal wait to avoid a race; split out and encode next pass alongside the MLC/IP Mental-Health cross-sync ACs.');
  });
});

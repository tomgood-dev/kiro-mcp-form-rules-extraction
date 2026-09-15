// Occupation (Apply-flow screen) — acceptance-criteria mode.
// Source: docs/user-stories/User Story- Occupation.md
//
// The Apply flow is fully reachable + completable on QA (proven end-to-end 2026-09-15, policy
// J4211922 — see docs/apply-flow-end-to-end-2026-09-15.md). The "Occupation" screen this story
// describes is the OCCUPATION page INSIDE Insurance & Financial Details. Live navigation confirmed
// (probe-occupation-screen-2026-09-15.js):
//   Insurance History  <-- Previous --  OCCUPATION  -- Next -->  FINANCIAL (income)
// So AC03 (Previous -> Insurance History) and AC04 (Next -> Income) hold. AC01 (occupation is
// captured on the application) holds — the section header shows "Principal Occupation: <name>",
// carried from the quote screen. AC02 (an on-screen "applying for offers" dropdown + Employer name +
// Country + Address ON THIS SCREEN) is a DISCREPANCY: the live OCCUPATION page only asks hazardous-
// duties; those AC02 fields are not present here (occupation name/code are captured on the quote
// screen). AC02 is therefore encoded as an expected-to-fail assertion (per the rulebook) so the
// suite goes green automatically if/when those fields are added to this screen.
const { test, expect } = require('@playwright/test');
const {
  reachApplicationFlow, proceedThroughClientSummary, passDutyOfDisclosure, fillPersonalDetailsScreen,
  applyFlowScreen, applyFlowNext, answerAllNoOnPage, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Drive quote -> Client Summary -> DoD -> Personal Details -> Insurance & Financial Details, then
// walk to the OCCUPATION page. Returns the application page positioned on OCCUPATION.
async function reachOccupationScreen(page) {
  const quote = await reachApplicationFlow(page, { cover: 'Life', sumInsured: '1000000', personal: { age: 40, dob: '1986-12-15' } });
  await proceedThroughClientSummary(quote, { firstName: 'Solo', lastName: 'One' });
  await passDutyOfDisclosure(quote);
  await fillPersonalDetailsScreen(quote, { dob: '1986-12-15' });
  await applyFlowNext(quote, 6000); // leave Personal Details -> Insurance & Financial Details
  // Section lands on INSURANCE HISTORY; answer No + Next until OCCUPATION. Capture AC01 evidence
  // (the "Principal Occupation: <name>" header) as we walk — it renders on the Insurance History page.
  let occCaptured = false;
  for (let i = 0; i < 4; i++) {
    const s = await applyFlowScreen(quote);
    if (!occCaptured) occCaptured = await occupationIsCaptured(quote);
    if (/OCCUPATION/.test(s.section)) break;
    await answerAllNoOnPage(quote);
    await waitForSettle(quote, 800);
    await applyFlowNext(quote, 5000);
  }
  return { quote, occCaptured };
}

// AC01 evidence: the section header carries "Principal Occupation: <name>" (on the Insurance History
// page of the section). Capture it while walking, so AC01 doesn't depend on the OCCUPATION page's own body.
async function occupationIsCaptured(page) {
  return page.evaluate(() => /Principal Occupation:\s*\S+/i.test(document.body.innerText || '') || /\bAccountant\b/i.test(document.body.innerText || ''));
}

test.describe('Occupation — Apply-flow screen (Insurance & Financial Details)', () => {
  test('AC01/AC03/AC04: occupation captured; Previous->Insurance History; Next->Income. AC02: offers/Employer/Country/Address fields (expected-fail — absent on this screen)', async ({ page }, testInfo) => {
    test.setTimeout(720000);
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: I must have the ability to provide my client\u2019s Occupation on the application.',
      'AC02: On the Occupation screen capture: "applying for any of the following offers" dropdown',
      '  (Not applicable / Dentists & Dental Surgeons), Name of Employer, Country (dropdown), Address.',
      'AC03: In the Occupation screen, Previous -> Insurance History screen.',
      'AC04: In the Occupation screen, Next -> Income screen.',
      '',
      'Steps to reproduce:',
      '1. Build a priced Life quote (age 40, Accountant), Apply -> Client Summary -> Proceed -> Duty of',
      '   Disclosure (agree) -> Personal Details (complete) -> Insurance & Financial Details.',
      '2. From Insurance History, Next to reach the OCCUPATION page.',
      '3. Read the section header (occupation captured); test Previous and Next targets; check AC02 fields.',
      '',
      'Expected: AC01 occupation shown; AC03 Previous->Insurance History; AC04 Next->Income(Financial).',
      'Actual: AC01/AC03/AC04 hold. AC02 FAILS — the live OCCUPATION page asks only hazardous-duties;',
      'the offers dropdown / Employer / Country / Address are NOT on this screen (occupation name+code',
      'are captured on the quote screen and carried as "Principal Occupation: <name>").',
    ].join('\n') });

    const { quote, occCaptured } = await reachOccupationScreen(page);

    // Confirm we are on the OCCUPATION page.
    const onOcc = await applyFlowScreen(quote);
    recordCheck(testInfo, { label: 'Reached the Occupation screen', expected: 'OCCUPATION', actual: onOcc.section });
    expect(onOcc.section, 'On OCCUPATION page').toBe('OCCUPATION');

    // AC01: occupation captured on the application (section header carries "Principal Occupation: <name>").
    const occupationCaptured = occCaptured || await occupationIsCaptured(quote);
    recordCheck(testInfo, { label: 'AC01: occupation captured on application', expected: 'true (Principal Occupation shown)', actual: String(occupationCaptured) });
    expect(occupationCaptured, 'AC01: occupation is captured on the application').toBe(true);

    // AC03: Previous from OCCUPATION -> Insurance History.
    await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const p=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^previous$/i.test((b.innerText||'').trim())); if(p)p.click(); });
    await waitForSettle(quote, 4000);
    const afterPrev = await applyFlowScreen(quote);
    recordCheck(testInfo, { label: 'AC03: Previous from Occupation goes to', expected: 'INSURANCE HISTORY', actual: afterPrev.section });
    expect(afterPrev.section, 'AC03: Previous -> Insurance History').toBe('INSURANCE HISTORY');

    // Return to OCCUPATION (answer Insurance History No, Next).
    await answerAllNoOnPage(quote);
    await waitForSettle(quote, 600);
    await applyFlowNext(quote, 5000);
    const backOnOcc = await applyFlowScreen(quote);
    expect(backOnOcc.section, 'back on OCCUPATION').toBe('OCCUPATION');

    // AC04: Next from OCCUPATION -> Income (the FINANCIAL page asks annual earned income).
    await answerAllNoOnPage(quote);
    await waitForSettle(quote, 800);
    await applyFlowNext(quote, 5000);
    const afterNext = await applyFlowScreen(quote);
    recordCheck(testInfo, { label: 'AC04: Next from Occupation goes to (Income)', expected: 'FINANCIAL', actual: afterNext.section });
    expect(afterNext.section, 'AC04: Next -> Income (FINANCIAL page)').toBe('FINANCIAL');

    // AC02 (EXPECTED-FAIL): the offers dropdown / Employer / Country / Address are NOT on the
    // Occupation screen. Go back to OCCUPATION and assert the spec's fields are present (they are not,
    // so this fails until the app adds them).
    await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const p=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^previous$/i.test((b.innerText||'').trim())); if(p)p.click(); });
    await waitForSettle(quote, 4000);
    const ac02 = await quote.evaluate(() => {
      const t = (document.body.innerText || '');
      return {
        offersDropdown: /applying for any of the following offers|Dentists & Dental Surgeons/i.test(t),
        employer: /Name of (the )?Employer|Employer name/i.test(t),
        country: /Country/i.test(t),
      };
    });
    recordCheck(testInfo, { label: 'AC02: "applying for offers" dropdown present on Occupation screen', expected: 'true', actual: String(ac02.offersDropdown) });
    recordCheck(testInfo, { label: 'AC02: Employer name field present on Occupation screen', expected: 'true', actual: String(ac02.employer) });
    // Assert to the SPEC's expected value -> fails until the app adds these AC02 fields to the screen.
    expect(ac02.offersDropdown, 'AC02: "applying for any of the following offers" dropdown present on Occupation screen (spec-expected; currently absent)').toBe(true);
    expect(ac02.employer, 'AC02: Name of Employer field present on Occupation screen (spec-expected; currently absent)').toBe(true);
  });
});

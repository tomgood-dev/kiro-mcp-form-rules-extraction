// Navigation Behaviour (URE / apply-flow progress-panel navigation) — acceptance-criteria mode.
// Source: docs/user-stories/User Story- Navigation Behaviour.md
//
// The apply flow is fully reachable + completable on QA (proven 2026-09-15, policy J4211922 — see
// docs/apply-flow-end-to-end-2026-09-15.md). PC01 "URE Questionnaire completed" is satisfied by
// driving through the Personal Statement (the URE questionnaire) to the Underwriting Decision.
//
// The "completion tick" of these ACs is confirmed live (probe-ure-nav-2026-09-15.js): each completed
// step in the left PROGRESS SIDEBAR ("1. Quote / 2. Client / ... / 5. Personal Statement") carries an
// `<i class="text-success fa fa-check-ci">` tick. getApplyFlowSidebar()/clickApplyFlowStep() read/drive it.
//
// AC01 (ticks appear for completed sections) and AC03 (click a previous completed step -> navigate
// there, tick retained) are encoded as PASSING. AC02 (changing an answer that triggers further
// questions removes the tick) and AC04 (updating section 3/4 + Next unticks section 5+) require
// mid-questionnaire answer-mutation that forces NEW questions and then re-reading tick state; that
// dynamic-mutation path is not yet characterized by a probe, so they are deferred-with-evidence
// (reachable — the flow + sidebar are driveable — but the specific answer that spawns follow-ups and
// the resulting untick have not been mapped). Never silently omitted.
const { test, expect } = require('@playwright/test');
const {
  reachApplicationFlow, proceedThroughClientSummary, passDutyOfDisclosure, fillPersonalDetailsScreen,
  passInsuranceAndFinancial, passTeleInterview, passPersonalStatement, applyFlowScreen, applyFlowNext,
  getApplyFlowSidebar, clickApplyFlowStep, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Drive the full apply flow through the URE (Personal Statement) so PC01 "questionnaire completed"
// holds, landing on the Underwriting Decision with all prior sections complete.
async function completeUreQuestionnaire(page) {
  const quote = await reachApplicationFlow(page, { cover: 'Life', sumInsured: '1000000', personal: { age: 40, dob: '1986-12-15' } });
  await proceedThroughClientSummary(quote, { firstName: 'Solo', lastName: 'One' });
  await passDutyOfDisclosure(quote);
  await fillPersonalDetailsScreen(quote, { dob: '1986-12-15' });
  await applyFlowNext(quote, 6000);
  await passInsuranceAndFinancial(quote, 120000);
  await passTeleInterview(quote);
  await passPersonalStatement(quote, { drinks: '5' });
  return quote;
}

test.describe('Navigation Behaviour — apply-flow progress panel (URE)', () => {
  test('AC01: completion ticks appear for completed sections. AC03 (literal): clicking the progress-panel step navigates (expected-fail — sidebar is read-only)', async ({ page }, testInfo) => {
    test.setTimeout(900000);
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'PC01: URE Questionnaire completed.',
      'AC01: When the URE personal questionnaire is completed, a completion tick appears in the navigation panel.',
      'AC03: Clicking a previous page navigates there and shows its completion tick.',
      '',
      'Steps to reproduce:',
      '1. Build a priced Life quote, Apply -> Client Summary -> DoD -> Personal Details -> Insurance &',
      '   Financial Details -> Tele Interview -> complete the Personal Statement (URE questionnaire).',
      '2. Read the progress sidebar: completed steps carry an <i class="text-success fa fa-check-ci"> tick.',
      '3. Click a completed previous step (Personal Details) — confirm it navigates and still shows its tick.',
      '',
      'Expected: completed sections are ticked (AC01); clicking a completed previous step navigates to it',
      'and it remains ticked (AC03).',
    ].join('\n') });

    const quote = await completeUreQuestionnaire(page);
    // After the questionnaire, we are on the Underwriting Decision; prior sections are complete.
    const onScreen = await applyFlowScreen(quote);
    recordCheck(testInfo, { label: 'Reached post-questionnaire (Underwriting Decision)', expected: '/QuoteAndApply/UnderwritingDecision', actual: onScreen.url });
    expect(onScreen.url, 'reached Underwriting Decision (questionnaire completed)').toContain('UnderwritingDecision');

    // AC01: completed sections show a completion tick in the progress sidebar.
    const sidebar = await getApplyFlowSidebar(quote);
    const completedLabels = sidebar.filter((s) => s.completed).map((s) => s.label);
    recordCheck(testInfo, { label: 'AC01: number of sidebar sections showing a completion tick', expected: '>= 4 (Quote, Client, Duty of Disclosure, Personal Details, ...)', actual: String(completedLabels.length) + ' (' + completedLabels.join(', ') + ')' });
    expect(completedLabels.length, 'AC01: multiple completed sections carry a completion tick').toBeGreaterThanOrEqual(4);
    // Personal Details specifically should be ticked (a section we completed).
    const pdTicked = sidebar.some((s) => /Personal Details/i.test(s.label) && s.completed);
    recordCheck(testInfo, { label: 'AC01: Personal Details section is ticked', expected: 'true', actual: String(pdTicked) });
    expect(pdTicked, 'AC01: Personal Details shows its completion tick').toBe(true);

    // AC03: the story says "click those pages ... redirected to corresponding page". Confirmed live
    // (probe-ure-nav-2026-09-15.js): the progress-sidebar step is a plain <div> (no anchor, cursor:auto)
    // and clicking it does NOT navigate. Navigation to previous pages is via the footer "Previous"
    // button instead. Encode BOTH: (a) the spec's clickable-nav expectation as expected-fail, and
    // (b) the working Previous-button navigation + tick retention (the story's underlying intent).

    // (a) AC03 spec literal — clicking the sidebar step navigates. EXPECTED-FAIL (sidebar is read-only).
    const beforeUrl = (await applyFlowScreen(quote)).url;
    await clickApplyFlowStep(quote, 'Personal Details');
    const afterStepClick = await applyFlowScreen(quote);
    const stepClickNavigated = afterStepClick.url !== beforeUrl && /PersonalDetails/.test(afterStepClick.url);
    recordCheck(testInfo, { label: 'AC03: clicking the "Personal Details" progress-panel step navigates to it', expected: 'true (spec: click the page -> redirected)', actual: String(stepClickNavigated) + ' (sidebar step is a non-clickable <div>)' });
    expect(stepClickNavigated, 'AC03: clicking the progress-panel page navigates to it (spec-expected; the sidebar is currently a read-only <div>, so this fails until the steps are made clickable)').toBe(true);
  });

  test('AC03 (via Previous): previous-page navigation works and the page retains its completion tick', async ({ page }, testInfo) => {
    test.setTimeout(900000);
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03 (underlying intent — "I want to go to previous pages so I can update the details"): using the',
      'footer Previous button navigates to the prior page, and completed pages retain their completion tick.',
      '',
      'Steps: complete the URE questionnaire; from the post-questionnaire screen click Previous; confirm it',
      'navigates back and the sidebar still shows completion ticks for completed sections.',
      '',
      'Expected: Previous navigates to the prior page; completed sections stay ticked.',
      'Note: this covers the story\u2019s intent because the progress-sidebar steps themselves are NOT',
      'clickable (a read-only <div>) — see the AC03-literal expected-fail in the sibling test.',
    ].join('\n') });
    const quote = await completeUreQuestionnaire(page);
    const start = await applyFlowScreen(quote);
    recordCheck(testInfo, { label: 'Post-questionnaire screen', expected: 'UnderwritingDecision', actual: start.url });
    expect(start.url, 'reached post-questionnaire').toContain('UnderwritingDecision');
    // Previous should navigate back a page.
    await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const p=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^previous$/i.test((b.innerText||'').trim())); if(p)p.click(); });
    await waitForSettle(quote, 5000);
    const afterPrev = await applyFlowScreen(quote);
    const navigated = afterPrev.url !== start.url;
    recordCheck(testInfo, { label: 'AC03: Previous navigates away from the post-questionnaire screen', expected: 'true (url changes)', actual: String(navigated) + ' -> ' + afterPrev.url });
    expect(navigated, 'AC03: Previous navigates to the prior page').toBe(true);
    // Completed sections still ticked.
    const sidebar = await getApplyFlowSidebar(quote);
    const stillTicked = sidebar.filter((s) => s.completed).length;
    recordCheck(testInfo, { label: 'AC03: completed sections retain their tick after Previous', expected: '>= 4', actual: String(stillTicked) });
    expect(stillTicked, 'AC03: completed pages retain their completion tick after navigating back').toBeGreaterThanOrEqual(4);
  });

  test('AC02/AC04: completion tick disappears when an answer change triggers further questions / unticks later sections', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: Changing an answer that results in further questions being asked -> completion tick disappears.',
      'AC04: After updating details in section 3 or 4 and clicking Next -> section 5 onwards are no longer ticked.',
      '',
      'Deferred reason: reachability is NOT the blocker (the apply flow + progress sidebar are fully',
      'driveable, and AC01/AC03 are encoded as passing above). AC02/AC04 require mid-questionnaire',
      'answer-MUTATION that forces NEW follow-up questions, then re-reading the tick state to prove it',
      'cleared. The specific answer that spawns follow-ups (e.g. flipping a Personal Statement health',
      'question to Yes and confirming the section un-ticks) has not yet been characterized by a probe.',
      'This needs a dedicated probe mapping which answer change adds questions + the resulting untick,',
      'then encoding — a follow-up, not a silent omission.',
    ].join('\n') });
    test.fixme(true, 'Deferred (2026-09-15, characterized — reachable flow but the answer-mutation path is walled). AC01/AC03 are encoded+passing. For AC02/AC04 two probe approaches were tried (probe-ure-untick-2026-09-15.js): (1) complete the questionnaire, navigate back, flip a Yes on the landing page — the Personal Statement tick did NOT clear and no follow-up questions appeared; (2) walk footer Previous to reach a health page (Mental/Physical Health) to flip a Yes there — footer Previous from the RESIDENCE AND TRAVEL landing page EXITS the Personal Statement (to Tele Interview) rather than paging back through the internal health pages, so the individual health questions are not re-exposed for mutation via this path. Conclusion: once the URE questionnaire is complete, its internal health pages are not reachable for answer-changing through footer Previous; AC02/AC04 need the questionnaire\\'s OWN internal edit/navigation affordance (not yet located) to re-open a specific health question, flip it to Yes so follow-ups spawn, and observe the tick clear. That affordance must be found by a further probe before these can be encoded — getApplyFlowSidebar() already reads the tick state, so only the re-open mechanism is missing.');
  });
});

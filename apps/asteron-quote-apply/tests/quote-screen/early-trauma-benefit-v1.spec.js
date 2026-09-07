// Early Trauma Benefit — acceptance-criteria mode (Jira ACB-10105).
// Source: docs/user-stories/User Story- Early Trauma Benefit.md
//
// Probe 2026-09-07: "Early Trauma Benefit" is a CHECKBOX on the Trauma cover (Standalone/Acc). Its
// CALCULATED Sum Insured (20% of Trauma SI, min lesser-of-$10k, max $100k) is NOT surfaced as a
// field/value on the quote screen — ticking it did not add or display an Early Trauma SI input
// (the only SI input still showed the Trauma SI). The story's AC05 confirms the Early Trauma SI is
// sent to the PDF / L400 (backend), i.e. not shown on-screen. So AC01-AC05 (the SI calc + PDF/L400)
// are NOT browser-assertable from the quote screen. We verify the reachable part (checkbox present
// on Trauma) and defer the calc/backend ACs with this evidence — not silently omitted.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput,
  getCheckboxStateByLabel, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

test.describe('Early Trauma Benefit (ACB-10105)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC00 (reachable part): Early Trauma Benefit is a selectable option on a Trauma cover', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC00: I can add/remove an Early Trauma Benefit option on a Standalone or Accelerated Trauma benefit. (Reachable part: the Early Trauma Benefit control is present + selectable once a Trauma cover is active.)',
      '', 'Steps to reproduce:', '1. New quote, activate Trauma, SI $30,000. 2. Confirm the "Early Trauma Benefit" checkbox is present and togglable (default unticked).',
      '', 'Expected: Early Trauma Benefit checkbox present, unticked by default, and can be ticked.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '30000');
    await waitForSettle(quote, 1200);
    const before = await getCheckboxStateByLabel(quote, 'Early Trauma');
    recordCheck(testInfo, { label: 'Early Trauma Benefit checkbox present + default unticked', expected: 'present, unticked', actual: JSON.stringify(before) });
    expect(before, 'AC00: Early Trauma Benefit control present').not.toBeNull();
    expect(before?.checked, 'AC00: default unticked').toBe(false);
    // Tick it and confirm it registers as ticked (the toggle is reachable, even though the resulting SI is backend).
    await quote.evaluate(() => {
      const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
      const et = boxes.find((c) => { let n = c.parentElement, t = ''; for (let d = 0; d < 5 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; } return /Early Trauma/i.test(t); });
      if (et && !et.checked) { et.scrollIntoView({ block: 'center' }); et.click(); }
    });
    await waitForSettle(quote, 1200);
    const after = await getCheckboxStateByLabel(quote, 'Early Trauma');
    recordCheck(testInfo, { label: 'Early Trauma Benefit can be ticked', expected: true, actual: after?.checked });
    expect(after?.checked, 'AC00: Early Trauma Benefit togglable').toBe(true);
  });

  // ── Deferred ACs (documented, with probe evidence) ──
  test('AC01/AC02/AC03/AC04/AC05: calculated Early Trauma SI (20% / min $10k / max $100k) + PDF/L400', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC01-AC04: Early Trauma SI = (<=10k -> =Trauma SI; 10-50k -> 10k; >50k -> 20% of Trauma SI capped $100k). AC05: correct SIs shown in the PDF and sent to L400.'].join('\n') });
    test.fixme(true, 'Deferred (not browser-reachable): probe 2026-09-07 confirmed the calculated Early Trauma Benefit SI is NOT surfaced on the quote screen — ticking the Early Trauma checkbox did not add/display an Early Trauma SI input (the only SI input still showed the Trauma SI). Per the story AC05, the Early Trauma SI is delivered via the PDF / L400 (backend). So the SI-calc rules (AC01-AC04) and the PDF/L400 output (AC05) cannot be asserted from the browser quote screen. Verify via a generated PDF / an L400 payload capture (backend/document test), outside this browser suite. The reachable checkbox behaviour is covered by AC00 above.');
  });
});

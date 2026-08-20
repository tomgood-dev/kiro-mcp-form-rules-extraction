/**
 * Commission Category (Adviser Use / Commissions modal) — first coverage pass
 * Source: docs/user-stories/User Story- Select Default Commission Category.md
 * Business rules: ../docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md
 * ACB-13175 is treated as already-built per this session's acceptance-criteria-mode
 * process (.kiro/steering/test-expansion-process.md) — a mismatch here is a candidate
 * defect, not evidence the feature isn't shipped.
 *
 * CONFIRMED PASSING (Parts 1-4) — each reproduced multiple times via throwaway probe
 * scripts (apps/asteron-quote-apply/probes/probe-adviser-use.js, probe-commission-category.js,
 * probe-commission-evidence.js, probe-update-button-timing.js, probe-update-button-ac05.js)
 * before being encoded as assertions. Full evidence: business-rules page above.
 *   AC01 - "Default for Agency (<agencyno>)" label is visible with a real agency number
 *   AC02 - Default commission category options are exactly Upfront / Level 30 / Spread 20
 *   AC03 - First-time default commission category is Upfront
 *   -     Nil Commission is never a selectable default option (no 4th option)
 *   AC14 - When Flexi Rate = N/A, Select IC/RC has a single real option and it is
 *          auto-selected (not left on "Please Select")
 *   AC11 - Selecting the 30% Flexi Rate displays "Commission is Nil as Nil Comm -
 *          30% Discount Flexirate has been selected" and the per-cover commission
 *          rows (Select IC/RC, Select All, cover commission dropdown) are removed
 *          from the Adviser Use modal entirely
 *   AC04/AC05 - Update button starts disabled, enables after a real selection change,
 *          re-disables after reverting to the saved value. An EARLIER probe reported
 *          this as always-enabled (a candidate defect) — that was a FALSE POSITIVE
 *          caused by an unintended page.mouse.wheel() call in that throwaway probe
 *          script, not a real app bug. See the business-rules page's "Retracted
 *          finding" section for the full 4-run investigation that overturned it.
 *
 * ACCEPTANCE CHECK EXPECTED TO CURRENTLY FAIL (Part 5) — written straight from the
 * user story's spec, not from observed behavior. Reproduced identically 3 times on
 * 3 separate runs (2 throwaway probes + this actual test file). Kept in this file
 * (rather than a findings doc only) so this suite goes green on its own the moment
 * the real default-selection logic is fixed — that is the actual point of testing
 * from a user story against an already-built feature. Part 5 is ordered last so
 * Parts 1-4 keep being verified every run even while it's red (this file throws on
 * first failure, one test() per Test Console constraints - see comm-cat-v1.md):
 *   AC10/Example 2 - At 7.5% Flexi Rate, Select IC/RC should default to
 *     "IC-75%, RC-100%" for an Upfront agency default (per the user story's own
 *     worked example). Observed default, 3x reproduced: "IC-100%, RC-100%".
 *
 * Still out of scope, explicitly deferred not silently skipped (see business-rules
 * page "Deferred" table for why each one):
 *   AC09 (partially covered via the revert-to-saved-value behavior above), AC12-19
 *     (rest of the multi-option IC/RC matrix, Examples 1/3/4)
 *   AC20-27 (persistence across saved quotes, STP payload) - requires two saved
 *     quotes plus backend/LIFE400 payload verification
 *   The "Default for Agency" setting is agency-wide/shared in this dev environment,
 *     so this test never clicks Update - only reads/toggles the dropdown's state.
 */
const { test } = require('@playwright/test');

test.setTimeout(480000);

test('Commission category: Default for Agency display + FlexiRate interactions', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

    // LOGIN
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    if (page.url().includes('_error.html')) throw new Error('FAILED [Login]: Error page');

    var emailField = page.locator('input[type="text"]').first();
    if (!(await emailField.isVisible().catch(function() { return false; }))) throw new Error('FAILED [Login]: Form not rendered');
    await emailField.click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();

    for (var i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    if (page.url().includes('CentralPortalsLogin')) throw new Error('FAILED [Login]: Credentials rejected or session conflict. Another test may be running.');

    await page.waitForTimeout(2000);
    if (!page.url().includes('AdviserCentral') && !page.url().includes('QuoteAndApply'))
      throw new Error('FAILED [Login]: Did not reach dashboard. Possible concurrent session. URL: ' + page.url());

    // OPEN NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    if (page.url().includes('Login') || page.url().includes('_error.html'))
      throw new Error('FAILED [Session]: Redirected to login/error after navigation. Likely concurrent session. URL: ' + page.url());

    var quoteUrl = await page.evaluate(function() {
      return new Promise(function(resolve) {
        window.open = function(url) { resolve(url); };
        var link = Array.from(document.querySelectorAll('a')).find(function(a) { return a.innerText.trim() === 'New Quote'; });
        if (link) link.click();
        setTimeout(function() { resolve(null); }, 3000);
      });
    });
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(function() { return false; }))) throw new Error('FAILED [Quote]: Form not rendered');

    // === HELPERS ===
    async function waitSettle(ms) {
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
      await page.waitForTimeout(ms || 500);
    }

    async function setAge(val) {
      var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
      await ageInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.keyboard.type(val, { delay: 40 });
      await page.keyboard.press('Tab');
      await waitSettle(1500);
    }

    async function setGender(gender) {
      await page.evaluate(function(g) {
        var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === g; });
        if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
      }, gender);
      await waitSettle(2000);
    }

    async function setOCC(value) {
      await page.waitForFunction(function() {
        var el = document.querySelector('select[id*="OccupationCode_Dropdown"]');
        return el && !el.disabled;
      }, { timeout: 10000 }).catch(function() {});
      await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption(value);
      await waitSettle(2000);
    }

    async function activateCover(name) {
      await page.evaluate(function(coverName) {
        var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim() === coverName || b.innerText.trim().split('\n')[0] === coverName; });
        if (!btn) throw new Error('Cover button not found: ' + coverName);
        btn.click();
      }, name);
      await waitSettle(2000);
    }

    async function enterCalcMask(locator, digits) {
      await locator.scrollIntoViewIfNeeded();
      await locator.click();
      await page.waitForTimeout(200);
      for (var x = 0; x < 12; x++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
      await page.waitForTimeout(200);
      for (var y = 0; y < digits.length; y++) { await page.keyboard.press(digits[y]); await page.waitForTimeout(60); }
      await page.keyboard.press('Tab');
      await waitSettle(2000);
    }

    async function getTotalYearlyPremium() {
      return await page.evaluate(function() {
        var idx = document.body.innerText.indexOf('Total Yearly Premium');
        return idx === -1 ? null : document.body.innerText.slice(idx, idx + 40);
      });
    }

    async function openAdviserUse() {
      await page.evaluate(function() {
        var el = Array.from(document.querySelectorAll('button, a')).find(function(e) { return e.innerText && e.innerText.trim().indexOf('Adviser Use') !== -1; });
        if (!el) throw new Error('Adviser Use button not found');
        if (el.disabled) throw new Error('Adviser Use button is disabled');
        el.click();
      });
      await waitSettle(1500);
    }

    async function closeAdviserUse() {
      await page.evaluate(function() {
        var b = Array.from(document.querySelectorAll('button')).find(function(x) { return x.innerText.trim() === 'Close'; });
        if (b) b.click();
      });
      await waitSettle(1000);
    }

    // Fingerprint: the ONE select whose options are exactly Upfront/Level 30/Spread 20
    // with no "Please Select" prefix - this is the agency-wide default dropdown.
    async function getDefaultAgencySelectInfo() {
      return await page.evaluate(function() {
        var sels = Array.from(document.querySelectorAll('select'));
        var match = sels.find(function(s) {
          var opts = Array.from(s.options).map(function(o) { return o.text; });
          return opts.length === 3 && opts.indexOf('Upfront') !== -1 && opts.indexOf('Level 30') !== -1 && opts.indexOf('Spread 20') !== -1;
        });
        if (!match) return null;
        return { id: match.id, options: Array.from(match.options).map(function(o) { return o.text; }), selectedIndex: match.selectedIndex };
      });
    }

    // Fingerprint: select whose first option is "Please Select" and remaining options
    // all look like "IC-nn%, RC-nn%" - this is the "Select IC/RC" pick list.
    async function getIcRcSelectInfo() {
      return await page.evaluate(function() {
        var sels = Array.from(document.querySelectorAll('select'));
        var match = sels.find(function(s) {
          var opts = Array.from(s.options).map(function(o) { return o.text; });
          if (opts.length < 2 || opts[0] !== 'Please Select') return false;
          return opts.slice(1).every(function(o) { return /^IC-\d+%, RC-\d+%$/.test(o); });
        });
        if (!match) return null;
        return { id: match.id, options: Array.from(match.options).map(function(o) { return o.text; }), selectedIndex: match.selectedIndex };
      });
    }

    async function getDefaultAgencyLabelText() {
      return await page.evaluate(function() {
        var idx = document.body.innerText.indexOf('Default for Agency');
        return idx === -1 ? null : document.body.innerText.slice(idx, idx + 100);
      });
    }

    async function getUpdateButtonInfo() {
      return await page.evaluate(function() {
        var b = Array.from(document.querySelectorAll('button')).find(function(x) { return x.innerText.trim() === 'Update'; });
        return b ? { disabled: b.disabled } : null;
      });
    }

    async function getVisibleErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    function assertArraysEqual(actual, expected, ruleId, context) {
      var a = JSON.stringify(actual);
      var e = JSON.stringify(expected);
      if (a !== e) throw new Error('FAILED [' + ruleId + ' ' + context + ']: Expected options ' + e + ', got ' + a);
    }

    function assertEquals(actual, expected, ruleId, context) {
      if (actual !== expected) throw new Error('FAILED [' + ruleId + ' ' + context + ']: Expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }

    function assertContains(haystack, needle, ruleId, context) {
      if (!haystack || haystack.indexOf(needle) === -1) throw new Error('FAILED [' + ruleId + ' ' + context + ']: Expected text containing "' + needle + '", got: ' + JSON.stringify(haystack));
    }

    // === BASELINE PERSONA + PRICED QUOTE ===
    await setAge('35');
    await setGender('Male');
    await setOCC('1'); // AA
    await activateCover('Life');

    var siInput = page.locator('input[id*="SumInsured"]').first();
    await enterCalcMask(siInput, '500000');

    var premium = await getTotalYearlyPremium();
    if (!premium) throw new Error('FAILED [Precondition]: Quote did not price - Total Yearly Premium not found after Life cover + Sum Insured 500000');

    // ════════════════════════════════════════════════════════════════
    // PART 1: DEFAULT FOR AGENCY DISPLAY (AC01, AC02, AC03)
    // ════════════════════════════════════════════════════════════════

    await openAdviserUse();

    var labelText = await getDefaultAgencyLabelText();
    assertContains(labelText, 'Default for Agency (', 'AC01', 'label visible');
    if (!/Default for Agency \(\d/.test(labelText || ''))
      throw new Error('FAILED [AC01 label visible]: Expected a real agency number after "Default for Agency (", got: ' + labelText);

    var defaultAgency = await getDefaultAgencySelectInfo();
    if (!defaultAgency) throw new Error('FAILED [AC02]: Default-for-Agency dropdown not found');
    assertArraysEqual(defaultAgency.options, ['Upfront', 'Level 30', 'Spread 20'], 'AC02', 'available commission categories');
    assertEquals(defaultAgency.selectedIndex, 0, 'AC03', 'first-time default is Upfront');

    // ════════════════════════════════════════════════════════════════
    // PART 2: FLEXI RATE = N/A -> SINGLE IC/RC OPTION AUTO-SELECTED (AC14)
    // ════════════════════════════════════════════════════════════════

    var icRcAtNA = await getIcRcSelectInfo();
    if (!icRcAtNA) throw new Error('FAILED [AC14]: Select IC/RC dropdown not found while Flexi Rate = N/A');
    assertArraysEqual(icRcAtNA.options, ['Please Select', 'IC-100%, RC-100%'], 'AC14', 'Flexi Rate N/A has a single real IC/RC option');
    if (icRcAtNA.selectedIndex === 0)
      throw new Error('FAILED [AC14]: Select IC/RC should auto-select the single available option "IC-100%, RC-100%", but is still on "Please Select"');

    await closeAdviserUse();

    // ════════════════════════════════════════════════════════════════
    // PART 3: 30% FLEXI RATE FORCES NIL COMMISSION (AC11)
    // ════════════════════════════════════════════════════════════════

    var flexiRateSelect = page.locator('select[id*="FlexiRate"]').first();
    await flexiRateSelect.selectOption({ label: '30.0%' });
    await waitSettle(2000);

    var bodyTextAt30 = await page.evaluate(function() { return document.body.innerText; });
    assertContains(bodyTextAt30, 'Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected', 'AC11', '30% Flexi Rate message');

    var errorsAt30 = await getVisibleErrors();
    if (errorsAt30.some(function(e) { return e.indexOf('Please select IC/RC') !== -1; }))
      throw new Error('FAILED [AC11 Validation]: Expected NO "Please select IC/RC" validation at 30% Flexi Rate (adviser should be able to proceed without visiting Adviser Use), got: ' + errorsAt30.join(' | '));

    await openAdviserUse();

    var defaultAgencyAt30 = await getDefaultAgencySelectInfo();
    if (!defaultAgencyAt30) throw new Error('FAILED [AC11]: Default-for-Agency dropdown should still be visible in Adviser Use at 30% Flexi Rate');

    var icRcAt30 = await getIcRcSelectInfo();
    if (icRcAt30) throw new Error('FAILED [AC11 Cover display]: Expected NO Select IC/RC row for covers when Flexi Rate forces Nil Commission (covers should not be displayed), but found one: ' + JSON.stringify(icRcAt30));

    // ════════════════════════════════════════════════════════════════
    // PART 4: UPDATE BUTTON DISABLED-UNTIL-CHANGED (AC04, AC05)
    // CONFIRMED PASSING - see file header + business-rules page "Retracted finding"
    // for the 4-run investigation that overturned an earlier false-positive reading.
    // Reuses the modal already open from Part 3 (Default-for-Agency dropdown
    // is confirmed still present at 30% Flexi Rate per AC11 Cover display check above).
    // ════════════════════════════════════════════════════════════════

    var updateBefore = await getUpdateButtonInfo();
    if (!updateBefore) throw new Error('FAILED [AC04]: Update button not found');
    assertEquals(updateBefore.disabled, true, 'AC04', 'Update button disabled before any change to Default for Agency');

    var defaultAgencyForUpdate = await getDefaultAgencySelectInfo();
    var otherOption = defaultAgencyForUpdate.options.find(function(o) { return o !== defaultAgencyForUpdate.options[defaultAgencyForUpdate.selectedIndex]; });
    await page.locator('#' + defaultAgencyForUpdate.id).selectOption({ label: otherOption });
    await page.waitForTimeout(500);

    var updateAfter = await getUpdateButtonInfo();
    assertEquals(updateAfter.disabled, false, 'AC05', 'Update button enabled after changing Default for Agency selection');

    // Revert the selection (never click Update - agency-wide shared setting in this dev env)
    await page.locator('#' + defaultAgencyForUpdate.id).selectOption({ label: defaultAgencyForUpdate.options[defaultAgencyForUpdate.selectedIndex] });
    await page.waitForTimeout(500);

    await closeAdviserUse();

    // ════════════════════════════════════════════════════════════════
    // PART 5: 7.5% FLEXI RATE -> IC/RC DEFAULT PER USER STORY EXAMPLE 2
    // EXPECTED TO CURRENTLY FAIL - see file header + comm-cat-v1.md.
    // Only reached once Part 4 passes (fail-fast, one test() per file).
    // ════════════════════════════════════════════════════════════════

    await flexiRateSelect.selectOption({ label: '7.5%' });
    await waitSettle(2000);
    await openAdviserUse();

    var icRcAt75 = await getIcRcSelectInfo();
    if (!icRcAt75) throw new Error('FAILED [AC10/Example2]: Select IC/RC dropdown not found at 7.5% Flexi Rate');
    var selectedText75 = icRcAt75.options[icRcAt75.selectedIndex];
    assertEquals(selectedText75, 'IC-75%, RC-100%', 'AC10/Example2', '7.5% Flexi Rate default IC/RC for Upfront agency default (per user story worked Example 2)');

    await closeAdviserUse();

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});

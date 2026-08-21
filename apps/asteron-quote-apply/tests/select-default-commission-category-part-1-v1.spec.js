/**
 * Select Default Commission Category — Part 1 (Parts 1-4: modal defaults & Update button)
 * Source: docs/user-stories/User Story- Select Default Commission Category.md
 * Business rules: ../docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md
 * ACB-13175 is treated as already-built per this session's acceptance-criteria-mode
 * process (.kiro/steering/test-expansion-process.md) — a mismatch here is a candidate
 * defect, not evidence the feature isn't shipped.
 *
 * Named/renamed 2026-08-21. History: originally comm-cat-v1.spec.js (single quote,
 * reused across Flexi Rate switches - caused carryover false positives), then
 * comm-cat-v2.spec.js: a single 7-part file opening a fresh quote per part (needed to
 * avoid the Select IC/RC carryover bug - see below), which sustained one login session
 * through 7 "New Quote" cycles. That's more sustained load than any other test in this
 * suite puts on one session, and it correlated with two real instability events (a
 * 15-minute hang on the 7th fresh quote in one run; a full forced logout mid-test on
 * the 3rd fresh quote in another). Split into two files - this one (Parts 1-4) and
 * select-default-commission-category-part-2-v1.spec.js (Parts 5-7), each with its own
 * login - which halved the sustained load per session and resolved both instability
 * events; both files ran clean end-to-end with zero retries after the split. Both files
 * were later renamed from topic-based names to this story-based part-N scheme.
 *
 * CRITICAL STRUCTURAL DIFFERENCE FROM v1: every Flexi-Rate-dependent check below opens
 * its OWN fresh quote (via "New Quote" navigation, same login session). v1 reused a
 * single quote across parts and switched Flexi Rate mid-quote, which caused the Select
 * IC/RC field to carry over a STALE selection from the previously-viewed Flexi Rate
 * instead of computing a fresh default — this produced two false-positive "defects" in
 * v1 (see business-rules page "Retracted findings"; steering doc "Stateful-component
 * carryover across a driving field's value"). A fresh "New Quote" navigation within the
 * same session was confirmed sufficient isolation (evidence/10-probe-fresh-quote-isolation/).
 *
 * ALL CHECKS BELOW ARE CONFIRMED PASSING — every one was re-verified with a fresh quote
 * per Flexi Rate value before being encoded. Full evidence: business-rules page above.
 *   AC01/AC02/AC03 - Default for Agency label, options (Upfront/Level 30/Spread 20 only,
 *          no Nil Commission), first-time default = Upfront
 *   AC14  - Flexi Rate N/A: Select IC/RC has a single real option, auto-selected
 *   AC11  - 30% Flexi Rate: exact "Nil Comm" message; per-cover rows hidden from modal
 *   AC04/AC05 - Update button disabled by default, enabled after a real change,
 *          disabled again after reverting (an earlier probe's "always enabled" reading
 *          was a false positive from a stray mouse.wheel() call — see business-rules page)
 *   ADV-08 (Example 1, 2.5%)  - Select IC/RC = IC-100%,RC-50%; Life Cover row = Upfront
 *
 * See select-default-commission-category-part-2-v1.spec.js for Examples 2/3/4 (Parts 5-7).
 *
 * Still out of scope, explicitly deferred not silently skipped (see business-rules page
 * "Deferred" table for why each one):
 *   AC06-08 (Save/persist + confirmation message), AC09 (partial), AC10 remainder,
 *     AC12/13/15-19 (rest of the IC/RC matrix), AC18, AC20-27 (persistence, STP payload)
 *   The "Default for Agency" setting is agency-wide/shared in this dev environment,
 *     so this test never clicks Update - only reads/toggles the dropdown's state.
 */
const { test } = require('@playwright/test');

test.setTimeout(900000);

test('Select Default Commission Category - Part 1: Default for Agency, 30% Nil Commission, Update button, Example 1', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

    // LOGIN (once - fresh quotes are opened per part below, same session)
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

    console.log('[comm-cat-part1] Login OK, ' + new Date().toISOString());

    // === HELPERS ===
    async function waitSettle(ms) {
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
      await page.waitForTimeout(ms || 500);
    }

    // Opens a genuinely fresh quote ("New Quote" navigation) - confirmed sufficient
    // isolation for the Select IC/RC carryover bug, without needing a new login session.
    async function openFreshQuote() {
      console.log('[comm-cat-part1]   openFreshQuote: navigating to quote list...');
      await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      if (page.url().includes('Login') || page.url().includes('_error.html'))
        throw new Error('FAILED [Session]: Redirected to login/error after navigation. Likely concurrent session. URL: ' + page.url());

      console.log('[comm-cat-part1]   openFreshQuote: clicking New Quote...');
      var quoteUrl = await page.evaluate(function() {
        return new Promise(function(resolve) {
          window.open = function(url) { resolve(url); };
          var link = Array.from(document.querySelectorAll('a')).find(function(a) { return a.innerText.trim() === 'New Quote'; });
          if (link) link.click();
          setTimeout(function() { resolve(null); }, 3000);
        });
      });
      // window.open() can be called with a relative path (observed with an alternate
      // account) or an absolute URL (observed with the primary account) - normalize
      // before navigating, since page.goto() requires an absolute URL.
      if (quoteUrl && quoteUrl.indexOf('http') !== 0) quoteUrl = BASE_URL + (quoteUrl.indexOf('/') === 0 ? '' : '/') + quoteUrl;
      if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
      else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(function() { return false; }))) throw new Error('FAILED [Quote]: Form not rendered');
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
      // Self-verifying with retry: confirm the click actually registered (per Probe &
      // Interaction Safety rule) rather than trusting a raw evaluate+click with no
      // follow-up check. An occasional click-doesn't-register race was observed on this
      // control - retry a couple times before failing for real.
      for (var attempt = 1; attempt <= 3; attempt++) {
        var clicked = await page.evaluate(function(g) {
          var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === g; });
          if (!btn) return false;
          btn.scrollIntoView({ block: 'center' });
          btn.click();
          return true;
        }, gender);
        if (!clicked) throw new Error('FAILED [setGender]: "' + gender + '" button-group-item not found in DOM');
        await waitSettle(2000);
        var selected = await page.evaluate(function(g) {
          var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === g; });
          return btn ? btn.className.indexOf('button-group-selected-item') !== -1 : false;
        }, gender);
        if (selected) return;
        console.log('[comm-cat-part1]   setGender: attempt ' + attempt + ' did not register, retrying...');
      }
      throw new Error('FAILED [setGender]: clicked "' + gender + '" 3 times but it is never selected afterward - click is not registering');
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

    // Fresh quote + minimum persona (Age 35, Male, OCC AA) + Life $500,000, priced.
    async function freshPricedQuote() {
      console.log('[comm-cat-part1]   freshPricedQuote: opening new quote...');
      await openFreshQuote();
      console.log('[comm-cat-part1]   freshPricedQuote: setting age...');
      await setAge('35');
      console.log('[comm-cat-part1]   freshPricedQuote: setting gender...');
      await setGender('Male');
      console.log('[comm-cat-part1]   freshPricedQuote: setting occupation code...');
      await setOCC('1'); // AA
      console.log('[comm-cat-part1]   freshPricedQuote: activating Life cover...');
      await activateCover('Life');
      console.log('[comm-cat-part1]   freshPricedQuote: entering Sum Insured...');
      var siInput = page.locator('input[id*="SumInsured"]').first();
      await enterCalcMask(siInput, '500000');
      var premium = await getTotalYearlyPremium();
      if (!premium) throw new Error('FAILED [Precondition]: Quote did not price - Total Yearly Premium not found after Life cover + Sum Insured 500000');
      console.log('[comm-cat-part1]   freshPricedQuote: priced OK (' + premium.replace(/\s+/g, ' ').trim() + ')');
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

    async function setFlexiRate(label) {
      await page.locator('select[id*="FlexiRate"]').first().selectOption({ label: label });
      await waitSettle(2000);
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

    // Fingerprint: nearest-label technique to distinguish "Life Cover" (per-cover row,
    // status display) from "Select All" (bulk-apply control, legitimately blank at open).
    async function getLifeCoverCategoryInfo() {
      return await page.evaluate(function() {
        function nearestLabelText(el) {
          var node = el;
          for (var depth = 0; depth < 4 && node; depth++) {
            var sib = node.previousElementSibling;
            while (sib) {
              var t = (sib.innerText || '').trim();
              if (t) return t.split('\n')[0].slice(0, 60);
              sib = sib.previousElementSibling;
            }
            node = node.parentElement;
          }
          return null;
        }
        var sels = Array.from(document.querySelectorAll('select'));
        var match = sels.find(function(s) { return (nearestLabelText(s) || '').indexOf('Life Cover') !== -1; });
        if (!match) return null;
        return { options: Array.from(match.options).map(function(o) { return o.text; }), selectedIndex: match.selectedIndex };
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

    // ════════════════════════════════════════════════════════════════
    // PART 1: DEFAULT FOR AGENCY DISPLAY (AC01, AC02, AC03) + N/A AUTO-SELECT (AC14)
    // Fresh quote #1. Flexi Rate is untouched (N/A) - both checks read the SAME
    // untouched state, no Flexi Rate switch happens between them.
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-part1] PART 1 starting: Default for Agency display + AC14 (N/A auto-select)');
    await freshPricedQuote();
    await openAdviserUse();

    var labelText = await getDefaultAgencyLabelText();
    assertContains(labelText, 'Default for Agency (', 'AC01', 'label visible');
    if (!/Default for Agency \(\d/.test(labelText || ''))
      throw new Error('FAILED [AC01 label visible]: Expected a real agency number after "Default for Agency (", got: ' + labelText);

    var defaultAgency = await getDefaultAgencySelectInfo();
    if (!defaultAgency) throw new Error('FAILED [AC02]: Default-for-Agency dropdown not found');
    assertArraysEqual(defaultAgency.options, ['Upfront', 'Level 30', 'Spread 20'], 'AC02', 'available commission categories');
    assertEquals(defaultAgency.selectedIndex, 0, 'AC03', 'first-time default is Upfront');

    var icRcAtNA = await getIcRcSelectInfo();
    if (!icRcAtNA) throw new Error('FAILED [AC14]: Select IC/RC dropdown not found while Flexi Rate = N/A');
    assertArraysEqual(icRcAtNA.options, ['Please Select', 'IC-100%, RC-100%'], 'AC14', 'Flexi Rate N/A has a single real IC/RC option');
    if (icRcAtNA.selectedIndex === 0)
      throw new Error('FAILED [AC14]: Select IC/RC should auto-select the single available option "IC-100%, RC-100%", but is still on "Please Select"');

    await closeAdviserUse();
    console.log('[comm-cat-part1] PART 1 PASSED');

    // ════════════════════════════════════════════════════════════════
    // PART 2: 30% FLEXI RATE FORCES NIL COMMISSION (AC11)
    // Fresh quote #2.
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-part1] PART 2 starting: 30% Flexi Rate forces Nil Commission');
    await freshPricedQuote();
    await setFlexiRate('30.0%');

    // AC11's trigger is literally "When the user navigates to the Adviser Use page" (and
    // the narrative section says "display this message in the Adviser Use page should the
    // adviser enter the page") - the message is scoped to opening Adviser Use, not to
    // selecting the Flexi Rate on the main quote page. Open it before checking.
    await openAdviserUse();

    var bodyTextAt30 = await page.evaluate(function() { return document.body.innerText; });
    assertContains(bodyTextAt30, 'Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected', 'AC11', '30% Flexi Rate message');

    var errorsAt30 = await getVisibleErrors();
    if (errorsAt30.some(function(e) { return e.indexOf('Please select IC/RC') !== -1; }))
      throw new Error('FAILED [AC11 Validation]: Expected NO "Please select IC/RC" validation at 30% Flexi Rate (adviser should be able to proceed without visiting Adviser Use), got: ' + errorsAt30.join(' | '));

    var defaultAgencyAt30 = await getDefaultAgencySelectInfo();
    if (!defaultAgencyAt30) throw new Error('FAILED [AC11]: Default-for-Agency dropdown should still be visible in Adviser Use at 30% Flexi Rate');

    var icRcAt30 = await getIcRcSelectInfo();
    if (icRcAt30) throw new Error('FAILED [AC11 Cover display]: Expected NO Select IC/RC row for covers when Flexi Rate forces Nil Commission (covers should not be displayed), but found one: ' + JSON.stringify(icRcAt30));

    await closeAdviserUse();
    console.log('[comm-cat-part1] PART 2 PASSED');

    // ════════════════════════════════════════════════════════════════
    // PART 3: UPDATE BUTTON DISABLED-UNTIL-CHANGED (AC04, AC05)
    // Fresh quote #3. Flexi Rate untouched (N/A) - this check doesn't depend on
    // Flexi Rate at all, but uses its own fresh quote for consistency/safety.
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-part1] PART 3 starting: Update button disabled-until-changed');
    await freshPricedQuote();
    await openAdviserUse();

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
    console.log('[comm-cat-part1] PART 3 PASSED');

    // ════════════════════════════════════════════════════════════════
    // PART 4: EXAMPLE 1 - FLEXI RATE 2.5% (ADV-08)
    // Fresh quote #4.
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-part1] PART 4 starting: Example 1, Flexi Rate 2.5%');
    await freshPricedQuote();
    await setFlexiRate('2.5%');
    await openAdviserUse();

    var icRc25 = await getIcRcSelectInfo();
    if (!icRc25) throw new Error('FAILED [ADV-08]: Select IC/RC dropdown not found at 2.5% Flexi Rate');
    assertArraysEqual(icRc25.options, ['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%'], 'ADV-08', '2.5% Flexi Rate IC/RC pick list (Example 1)');
    assertEquals(icRc25.options[icRc25.selectedIndex], 'IC-100%, RC-50%', 'ADV-08', '2.5% Flexi Rate default IC/RC for Upfront (Example 1)');

    var lifeCover25 = await getLifeCoverCategoryInfo();
    if (!lifeCover25) throw new Error('FAILED [ADV-08]: Life Cover commission category row not found at 2.5% Flexi Rate');
    assertEquals(lifeCover25.options[lifeCover25.selectedIndex], 'Upfront', 'ADV-08', '2.5% Flexi Rate Life Cover default category (Example 1)');

    await closeAdviserUse();
    console.log('[comm-cat-part1] PART 4 PASSED - ALL PARTS PASSED');

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});

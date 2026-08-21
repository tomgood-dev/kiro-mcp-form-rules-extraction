/**
 * Commission Category — Flexi Rate IC/RC Examples (Parts 5-7)
 * Source: docs/user-stories/User Story- Select Default Commission Category.md
 * Business rules: ../docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md
 * ACB-13175 is treated as already-built per this session's acceptance-criteria-mode
 * process (.kiro/steering/test-expansion-process.md) — a mismatch here is a candidate
 * defect, not evidence the feature isn't shipped.
 *
 * Named/renamed 2026-08-21. History: originally comm-cat-v1.spec.js (single quote,
 * reused across Flexi Rate switches - caused carryover false positives), then
 * comm-cat-v2.spec.js (fresh quote per part, but all 7 parts in one session - caused
 * two instability events from sustained session load), then split into this file
 * (Parts 5-7) and commission-category-modal-defaults-and-update-button-v1.spec.js
 * (Parts 1-4), each with its own login. See that file's header for the full
 * sustained-session-load rationale.
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
 *   ADV-09 (Example 2, 7.5%) - Select IC/RC = IC-75%,RC-100% (v1 reported IC-100%,RC-100%
 *          here — that was the carryover artifact described above, retracted)
 *   ADV-10 (Example 3, 15%) - Select IC/RC = IC-50%,RC-50%; Life Cover row = Upfront
 *   ADV-11 (Example 4, 12.5%, multiple UPFRONT IC/RC rates) - Select IC/RC correctly
 *          stays on "Please Select" (does NOT auto-select) with exactly 4 documented
 *          options (v1 reported a 5th phantom option auto-selected — also the carryover
 *          artifact, retracted)
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

test('Commission category v2b: Examples 2, 3, 4', async ({ page }) => {
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

    console.log('[comm-cat-flexirate] Login OK, ' + new Date().toISOString());

    // === HELPERS ===
    async function waitSettle(ms) {
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
      await page.waitForTimeout(ms || 500);
    }

    // Opens a genuinely fresh quote ("New Quote" navigation) - confirmed sufficient
    // isolation for the Select IC/RC carryover bug, without needing a new login session.
    async function openFreshQuote() {
      console.log('[comm-cat-flexirate]   openFreshQuote: navigating to quote list...');
      await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      if (page.url().includes('Login') || page.url().includes('_error.html'))
        throw new Error('FAILED [Session]: Redirected to login/error after navigation. Likely concurrent session. URL: ' + page.url());

      console.log('[comm-cat-flexirate]   openFreshQuote: clicking New Quote...');
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
        console.log('[comm-cat-flexirate]   setGender: attempt ' + attempt + ' did not register, retrying...');
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
      console.log('[comm-cat-flexirate]   freshPricedQuote: opening new quote...');
      await openFreshQuote();
      console.log('[comm-cat-flexirate]   freshPricedQuote: setting age...');
      await setAge('35');
      console.log('[comm-cat-flexirate]   freshPricedQuote: setting gender...');
      await setGender('Male');
      console.log('[comm-cat-flexirate]   freshPricedQuote: setting occupation code...');
      await setOCC('1'); // AA
      console.log('[comm-cat-flexirate]   freshPricedQuote: activating Life cover...');
      await activateCover('Life');
      console.log('[comm-cat-flexirate]   freshPricedQuote: entering Sum Insured...');
      var siInput = page.locator('input[id*="SumInsured"]').first();
      await enterCalcMask(siInput, '500000');
      var premium = await getTotalYearlyPremium();
      if (!premium) throw new Error('FAILED [Precondition]: Quote did not price - Total Yearly Premium not found after Life cover + Sum Insured 500000');
      console.log('[comm-cat-flexirate]   freshPricedQuote: priced OK (' + premium.replace(/\s+/g, ' ').trim() + ')');
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

    function assertArraysEqual(actual, expected, ruleId, context) {
      var a = JSON.stringify(actual);
      var e = JSON.stringify(expected);
      if (a !== e) throw new Error('FAILED [' + ruleId + ' ' + context + ']: Expected options ' + e + ', got ' + a);
    }

    function assertEquals(actual, expected, ruleId, context) {
      if (actual !== expected) throw new Error('FAILED [' + ruleId + ' ' + context + ']: Expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }

    // ════════════════════════════════════════════════════════════════
    // PART 5: EXAMPLE 2 - FLEXI RATE 7.5% (ADV-09)
    // Fresh quote #1 (of this file). v1 got this wrong (IC-100%,RC-100% observed)
    // because it reused a quote already opened at Flexi Rate N/A - see file header.
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-flexirate] PART 5 starting: Example 2, Flexi Rate 7.5%');
    await freshPricedQuote();
    await setFlexiRate('7.5%');
    await openAdviserUse();

    var icRc75 = await getIcRcSelectInfo();
    if (!icRc75) throw new Error('FAILED [ADV-09]: Select IC/RC dropdown not found at 7.5% Flexi Rate');
    assertArraysEqual(icRc75.options, ['Please Select', 'IC-100%, RC-50%', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-100%'], 'ADV-09', '7.5% Flexi Rate IC/RC pick list (Example 2)');
    assertEquals(icRc75.options[icRc75.selectedIndex], 'IC-75%, RC-100%', 'ADV-09', '7.5% Flexi Rate default IC/RC for Upfront (Example 2)');

    await closeAdviserUse();
    console.log('[comm-cat-flexirate] PART 5 PASSED');

    // ════════════════════════════════════════════════════════════════
    // PART 6: EXAMPLE 3 - FLEXI RATE 15% (ADV-10)
    // Fresh quote #2 (of this file).
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-flexirate] PART 6 starting: Example 3, Flexi Rate 15%');
    await freshPricedQuote();
    await setFlexiRate('15.0%');
    await openAdviserUse();

    var icRc15 = await getIcRcSelectInfo();
    if (!icRc15) throw new Error('FAILED [ADV-10]: Select IC/RC dropdown not found at 15% Flexi Rate');
    assertArraysEqual(icRc15.options, ['Please Select', 'IC-0%, RC-100%', 'IC-100%, RC-0%', 'IC-50%, RC-50%'], 'ADV-10', '15% Flexi Rate IC/RC pick list (Example 3)');
    assertEquals(icRc15.options[icRc15.selectedIndex], 'IC-50%, RC-50%', 'ADV-10', '15% Flexi Rate default IC/RC for Upfront (Example 3)');

    var lifeCover15 = await getLifeCoverCategoryInfo();
    if (!lifeCover15) throw new Error('FAILED [ADV-10]: Life Cover commission category row not found at 15% Flexi Rate');
    assertEquals(lifeCover15.options[lifeCover15.selectedIndex], 'Upfront', 'ADV-10', '15% Flexi Rate Life Cover default category (Example 3)');

    await closeAdviserUse();
    console.log('[comm-cat-flexirate] PART 6 PASSED');

    // ════════════════════════════════════════════════════════════════
    // PART 7: EXAMPLE 4 - FLEXI RATE 12.5%, MULTIPLE UPFRONT IC/RC RATES (ADV-11)
    // Fresh quote #3 (of this file). v1 got this wrong (a 5th phantom option
    // auto-selected) because it tested this immediately after Example 3 in the
    // same quote - see file header.
    // ════════════════════════════════════════════════════════════════

    console.log('[comm-cat-flexirate] PART 7 starting: Example 4, Flexi Rate 12.5%');
    await freshPricedQuote();
    await setFlexiRate('12.5%');
    await openAdviserUse();

    var icRc125 = await getIcRcSelectInfo();
    if (!icRc125) throw new Error('FAILED [ADV-11]: Select IC/RC dropdown not found at 12.5% Flexi Rate');
    assertArraysEqual(icRc125.options, ['Please Select', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-0%', 'IC-75%, RC-50%'], 'ADV-11', '12.5% Flexi Rate IC/RC pick list (Example 4)');
    if (icRc125.selectedIndex !== 0)
      throw new Error('FAILED [ADV-11]: Select IC/RC should stay on "Please Select" at 12.5% Flexi Rate (multiple valid UPFRONT options exist, adviser must choose), but got: ' + icRc125.options[icRc125.selectedIndex]);

    await closeAdviserUse();
    console.log('[comm-cat-flexirate] PART 7 PASSED - ALL PARTS PASSED');

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});

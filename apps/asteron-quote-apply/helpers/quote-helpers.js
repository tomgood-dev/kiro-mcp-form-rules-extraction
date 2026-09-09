// Shared interaction helpers for the Quote screen ("Illustration" step) test suite.
//
// These encode every interaction gotcha discovered during manual exploration —
// see apps/asteron-quote-apply/docs/business-rules/technical-automation-appendix/page.md
// for the narrative version. Reuse these instead of hand-rolling interactions in
// spec files; the fragile parts (calc-mask fields, occupation search, the
// disability-cover commitment trap) are easy to get subtly wrong.
//
// The generic OutSystems primitives this file builds on (calc-mask entry, the
// evaluate()-click-to-avoid-missed-XHR pattern, the vscomp type-ahead widget, the
// window.open()-capture navigation pattern) live in outsystems-generic-helpers.js -
// none of that is specific to the Quote screen, so start there if you're building
// helpers for a different screen (e.g. Apply Flow) or a different OutSystems app.
// This file only adds the Quote-screen-specific layer on top: what fields exist,
// what the cover buttons are called, how premium/bundling text is laid out.

const {
  waitForSettle,
  fillCalcMask,
  commitWithoutTyping,
  getVisibleErrors,
  expectErrorContaining,
  clickButtonByLabel,
  buttonByLabelExists,
  captureWindowOpenFromLink,
  selectFromTypeahead,
} = require('./outsystems-generic-helpers');

/**
 * Opens a brand-new Quote screen and returns the Page it's on.
 * Assumes `page` is already authenticated (via storageState).
 *
 * "New Quote" is an <a target="_blank"> whose JS handler calls window.open() — the app builds the
 * quote in a NEW TAB with the proper session context. Critically, that context is what renders the
 * footer action bar (Close / View PDF / Save as New / Save / Apply). Re-navigating the same tab to
 * the captured URL does NOT reproduce it (the footer bar + working Apply are missing) — confirmed
 * 2026-09-09. So we must capture and drive the REAL popup tab, not deep-link. Returns the popup page
 * (or the same page if, in some environments, it opens in-place).
 */
async function openNewQuote(page) {
  console.log('  [step] Opening a new quote...');
  await page.goto('/QuoteAndApply/');
  await page.waitForLoadState('domcontentloaded');
  const link = page.locator('a', { hasText: 'New Quote' }).first();
  await link.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await waitForSettle(page, 1500);

  // The New Quote handler (OutSystems chooseNav) runs UpdateAdviserInSession then window.open(...) to
  // a NEW TAB — that adviser-session context is what makes Apply functional and the footer action bar
  // render. Deep-linking to the quote URL SKIPS this and yields an inert Apply (confirmed 2026-09-09).
  // So we MUST capture the real popup tab. Canonical pattern: arm the popup waiter, THEN click.
  const context = page.context();
  let popup = null;
  for (let attempt = 1; attempt <= 2 && !popup; attempt++) {
    try {
      const [p] = await Promise.all([
        context.waitForEvent('page', { timeout: 25000 }),
        link.click(),
      ]);
      popup = p;
    } catch (_) {
      // retry: some runs need the list to settle first
      await waitForSettle(page, 2000);
    }
  }
  if (!popup) {
    throw new Error('openNewQuote: New Quote did not open a popup tab after 2 attempts. The quote MUST be '
      + 'entered via the New Quote button (it runs UpdateAdviserInSession + window.open) — deep-linking '
      + 'the quote URL yields an inert Apply and no footer action bar. Aborting rather than proceeding on a broken quote.');
  }
  await popup.waitForLoadState('domcontentloaded').catch(() => {});
  // Force a large viewport on the popup (window.open sizes it 1200x700, hiding the responsive footer bar).
  await popup.setViewportSize({ width: 1920, height: 1080 }).catch(() => {});
  const quote = popup;
  console.log('  [step] New Quote opened in a new tab (proper adviser-session entry; footer bar present)');

  await quote.locator('input[id*="Input_AgeNextBirthday"], input[id*="Input_FirstName"]').first()
    .waitFor({ state: 'visible', timeout: 30000 });
  await waitForSettle(quote);
  console.log('  [step] Quote form rendered OK');
  return quote;
}

/**
 * Sets Age Next Birthday using the type action pattern (click + select-all + delete +
 * type + tab) required for OutSystems reactive binding — a plain `.fill()` does not
 * reliably trigger the same validation/recalculation.
 * @param {import('@playwright/test').Page} page
 * @param {number|string} age
 */
async function setAge(page, age) {
  console.log(`  [step] Setting Age Next Birthday = ${age}`);
  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type(String(age), { delay: 40 });
  await page.keyboard.press('Tab');
  await waitForSettle(page, 1000);
}

/**
 * Sets Gender — a button group, NOT a radio input (getByRole('radio') will not find
 * it). Triggers a FULL page recalculation — waits for it to complete.
 * @param {import('@playwright/test').Page} page
 * @param {'Male'|'Female'} gender
 */
async function setGender(page, gender) {
  console.log(`  [step] Setting Gender = ${gender}`);
  await page.evaluate((g) => {
    const btn = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')]
      .find(b => b.innerText.trim() === g);
    if (btn && !btn.className.includes('selected')) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
    }
  }, gender);
  await waitForSettle(page, 2000);
}

/**
 * Fills the minimum Personal Details fields needed to price a Lump Sum cover
 * (age, gender, occupation) and optionally Employment Status / Annual Income
 * for Disability cover scenarios.
 *
 * @param {import('@playwright/test').Page} page - the Quote tab
 * @param {object} opts
 * @param {number} [opts.age=35]
 * @param {'Male'|'Female'} [opts.gender='Male']
 * @param {string} [opts.occupationSearch='Civil Engineer']
 * @param {string} [opts.occupationOptionStartsWith='Civil Engineer - qualified']
 * @param {string} [opts.employmentStatus] - 'Employed' | 'Self-Employed' | 'Employed by own company' | 'Other'
 * @param {string|number} [opts.income] - Annual income, digits only, e.g. 150000
 */
async function setMinimumPersonalDetails(page, opts = {}) {
  const {
    age = 35,
    gender = 'Male',
    occupationCode = '1', // '1'=AA by default (safe for all covers)
    employmentStatus,
    income,
  } = opts;

  await setAge(page, age);
  await setGender(page, gender);

  // Occupation Code — native <select> dropdown. May be temporarily disabled after Gender change.
  console.log(`  [step] Setting Occupation Code = ${occupationCode}`);
  const occDropdown = page.locator('select[id*="OccupationCode_Dropdown"]').first();
  await occDropdown.waitFor({ state: 'visible', timeout: 10000 });
  // Wait for dropdown to become enabled (OutSystems may disable during recalculation)
  await page.waitForFunction(
    () => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await occDropdown.selectOption(occupationCode);
  await waitForSettle(page, 1500);

  if (employmentStatus) {
    console.log(`  [step] Setting Employment Status = ${employmentStatus}`);
    const empDropdown = page.locator('select[id*="EmploymentStatus_Dropdown"]').first();
    await empDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(
      () => !document.querySelector('select[id*="EmploymentStatus_Dropdown"]')?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await empDropdown.selectOption({ label: employmentStatus });
    await waitForSettle(page, 1500);
  }
  if (income !== undefined) {
    console.log(`  [step] Setting Annual Income = ${income}`);
    await fillCalcMask(page.locator('input[id*="MaskedInput"]').first(), String(income));
    await waitForSettle(page, 1000);
  }
  console.log('  [step] Personal Details set OK');
}

/**
 * Sets the primary insured's Date of Birth (a mandatory field for Apply — see project-context.md
 * "Mandatory fields"). The primary insured DOB input id contains 'b15-Input_BirthDate' (distinct
 * from a kid's repeating-list DOB). fill() lands the value in the OutSystems reactive pipeline where
 * a raw .value assignment does not.
 * @param {import('@playwright/test').Page} page
 * @param {string} dob ISO date 'YYYY-MM-DD'
 */
async function setDateOfBirth(page, dob) {
  console.log(`  [step] Setting Date of Birth = ${dob}`);
  const id = await page.evaluate(() => {
    const els = [].slice.call(document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]'));
    // primary insured DOB = the b15- one (not a kid repeating-list input)
    const primary = els.filter((i) => /b15-Input_BirthDate/.test(i.id))[0] || els[0];
    return primary ? primary.id : null;
  });
  if (!id) throw new Error('setDateOfBirth: DOB input not found');
  await page.locator(`[id="${id}"]`).fill(dob);
  await waitForSettle(page, 1200);
}

/**
 * Fills the COMPLETE set of personal-details fields mandatory to APPLY (a superset of the
 * pricing-minimum set — see project-context.md "Mandatory fields — CHECK THESE FIRST"). Confirmed
 * Apply-gate fields: First/Last Name, Date of Birth, Gender, Smoking, Occupation (name via typeahead)
 * + Occupation Code, Employment Status, Pre-tax Annual Income. Use this before clicking Apply /
 * driving the application flow; missing any of these makes Apply SILENTLY do nothing.
 * @param {import('@playwright/test').Page} page
 * @param {object} [opts]
 */
async function completePersonalDetailsForApply(page, opts = {}) {
  const {
    firstName = 'Test', lastName = 'Applicant',
    dob = '1985-06-15', age, gender = 'Male', smoking = 'No',
    occupationSearch = 'Accountant', occupationCode = '1',
    employmentStatus = 'Employed', income = 120000,
  } = opts;
  console.log('  [step] Completing personal details for Apply...');
  // Names
  await page.evaluate((n) => {
    function si(sel, v) { const e = document.querySelector(sel); if (e) { e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); } }
    si('input[id*="Input_FirstName"]', n.f); si('input[id*="Input_LastName"]', n.l);
  }, { f: firstName, l: lastName });
  await waitForSettle(page, 500);
  // DOB (preferred over ANB for Apply); if age given too, set it as a fallback signal.
  await setDateOfBirth(page, dob).catch((e) => console.log(`  [step] DOB set skipped: ${e.message}`));
  if (age !== undefined) await setAge(page, age).catch(() => {});
  await setGender(page, gender);
  // Smoking status button-group (Yes/No)
  await page.evaluate((s) => { const b = [].slice.call(document.querySelectorAll('.button-group-item, button')).filter((x) => x.offsetParent !== null && x.innerText.trim() === s); if (b.length) b[0].click(); }, smoking).catch(() => {});
  await waitForSettle(page, 800);
  // Occupation name via typeahead + code
  await setOccupation(page, occupationSearch).catch((e) => console.log(`  [step] occupation set skipped: ${e.message}`));
  await waitForSettle(page, 800);
  const occDropdown = page.locator('select[id*="OccupationCode_Dropdown"]').first();
  await occDropdown.selectOption(occupationCode).catch(() => {});
  await waitForSettle(page, 800);
  // Employment status
  await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: employmentStatus }).catch(async () => {
    await page.evaluate(() => { const s = document.querySelector('select[id*="EmploymentStatus_Dropdown"]'); if (s) { const o = [].slice.call(s.options).filter((x) => !/select/i.test(x.text) && x.text.trim())[0]; if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } } });
  });
  await waitForSettle(page, 800);
  // Pre-tax Annual Income (MANDATORY for Apply — the field missed on 2026-09-09)
  console.log(`  [step] Setting Pre-tax Annual Income = ${income}`);
  await fillCalcMask(page.locator('input[id*="AnnualIncome"], input[id*="MaskedInput"]').first(), String(income)).catch((e) => console.log(`  [step] income set skipped: ${e.message}`));
  await waitForSettle(page, 1000);
  console.log('  [step] Personal details for Apply complete');
}

/**
 * Saves the current quote via the reference popup. IMPORTANT: the popup contains TWO "Save" buttons —
 * the quote-screen action behind the modal and the popup's own `button.btn-primary`. Only the
 * btn-primary one fires the real `ActionSaveQuote` server action (confirmed 2026-09-09; clicking the
 * wrong one only triggers field recalcs and does NOT persist). Success is confirmed by the
 * ActionSaveQuote network response, NOT by a URL QuoteId change (which does not happen in-place).
 * @param {import('@playwright/test').Page} page
 * @param {string} [reference] optional reference (max 30 chars)
 * @returns {Promise<boolean>} true if ActionSaveQuote responded 2xx
 */
async function saveQuote(page, reference = 'AUTO' + Date.now().toString().slice(-6)) {
  console.log(`  [step] Saving quote (ref=${reference})...`);
  const saved = page.waitForResponse((r) => /ActionSaveQuote/i.test(r.url()) && r.request().method() === 'POST', { timeout: 20000 }).then((r) => r.status() < 400).catch(() => false);
  // Open the save popup (quote-screen footer "Save" — scroll it into view first; the footer bar can
  // sit below the fold).
  await page.evaluate(() => { const b = [].slice.call(document.querySelectorAll('button,a')).filter((x) => x.offsetParent !== null && x.innerText.trim().split('\n')[0] === 'Save')[0]; if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } });
  await waitForSettle(page, 1800);
  // Reference field.
  await page.evaluate((ref) => { const ri = document.getElementById('Input_Reference') || document.querySelector('input[id*="Input_Reference"]'); if (ri) { ri.focus(); ri.value = ref; ri.dispatchEvent(new Event('input', { bubbles: true })); ri.dispatchEvent(new Event('change', { bubbles: true })); } }, reference.slice(0, 30));
  await waitForSettle(page, 500);
  // Click the popup's btn-primary Save.
  await page.evaluate(() => { const b = [].slice.call(document.querySelectorAll('button,a')).filter((x) => x.offsetParent !== null && /btn-primary/.test(String(x.className)) && /^save$/i.test(x.innerText.trim().split('\n')[0]))[0]; if (b) b.click(); });
  const ok = await saved;
  await waitForSettle(page, 3000);
  console.log(`  [step] Save ${ok ? 'OK (ActionSaveQuote 2xx)' : 'NOT confirmed (no ActionSaveQuote 2xx)'}`);
  return ok;
}

/**
 * Clicks Apply and confirms the application flow was entered. Requires ALL mandatory personal-details
 * fields filled first (use completePersonalDetailsForApply) — otherwise Apply silently does nothing.
 * Returns the page/frame now showing the application flow (same tab or a popup) + whether it progressed.
 * @param {import('@playwright/test').Page} page
 */
async function clickApplyNow(page) {
  console.log('  [step] Clicking Apply (to enter application flow)...');
  const urlBefore = page.url();
  const bodyBefore = await page.evaluate(() => (document.body.innerText || '').length);
  // Use a real Playwright locator click. NOTE (corrected 2026-09-10): Apply is NOT a "trusted gesture"
  // problem — a normal getByRole click works. The earlier "Apply does nothing" was because the mandatory
  // Adviser Use commission dropdowns were unfilled (fillAdviserUse must run first). getByRole/element
  // clicks were ALSO unreliable when done via evaluate; real locator clicks work.
  await page.getByRole('button', { name: 'Apply', exact: true }).click({ timeout: 10000 });
  // Wait for navigation to the Client summary / application flow.
  await page.waitForFunction(
    () => /client summary|duty of disclosure|proceed to application|personal statement/i.test(document.body.innerText || ''),
    { timeout: 20000 }
  ).catch(() => {});
  await waitForSettle(page, 3000);
  const errors = await getVisibleErrors(page);
  const bodyAfter = await page.evaluate(() => (document.body.innerText || '').length);
  const onNext = await page.evaluate(() => /client summary|duty of disclosure|proceed to application|personal statement/i.test(document.body.innerText || ''));
  const progressed = onNext || page.url() !== urlBefore || Math.abs(bodyAfter - bodyBefore) > 200;
  console.log(`  [step] Apply ${progressed ? 'progressed (Client summary / application flow)' : 'did NOT progress'}${errors.length ? ' — errors: ' + JSON.stringify(errors).slice(0, 160) : ''}`);
  return { progressed, errors };
}

/**
 * Fills the mandatory Adviser Use (commission) popup — a REQUIRED step before Apply will progress.
 * Confirmed 2026-09-10: on a priced quote the popup's "Select All" and per-cover commission-structure
 * dropdowns default to "Please Select"; Apply silently refuses until they're set. Setting "Select All"
 * to a valid structure (default 'Upfront') cascades to the per-cover dropdowns. Then OK closes the modal.
 *
 * CRITICAL: the Adviser Use link, the dropdowns' cascade, and the OK button need REAL Playwright clicks
 * / change events — evaluate-based element.click() does NOT open the modal or fire OK.
 * @param {import('@playwright/test').Page} page
 * @param {string} [structure] commission structure to select ('Upfront' | 'Level 30' | 'Spread 20')
 */
async function fillAdviserUse(page, structure = 'Upfront') {
  console.log(`  [step] Filling Adviser Use (commission = ${structure})...`);
  await page.getByText('Adviser Use', { exact: true }).first().click({ timeout: 10000 });
  await waitForSettle(page, 2500);
  // Set the "Select All" dropdown (cascades) + any per-cover commission dropdown still on "Please Select".
  const set = await page.evaluate((struct) => {
    function vis(e) { return e && e.offsetParent !== null; }
    function nl(el) { let n = el; for (let d = 0; d < 5 && n; d++) { let s = n.previousElementSibling; while (s) { const t = (s.innerText || '').trim(); if (t) return t.split('\n')[0].slice(0, 45); s = s.previousElementSibling; } n = n.parentElement; } return ''; }
    const done = [];
    [...document.querySelectorAll('select')].filter(vis).forEach((s) => {
      const label = nl(s);
      const cur = (s.options[s.selectedIndex] || {}).text || '';
      if ((/select all/i.test(label) || /life cover|cover$/i.test(label)) && /please select/i.test(cur)) {
        const opt = [...s.options].find((o) => o.text.trim() === struct);
        if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); done.push(label); }
      }
    });
    return done;
  }, structure);
  await waitForSettle(page, 2000);
  // OK closes the modal (real click).
  await page.getByRole('button', { name: 'OK', exact: true }).click({ timeout: 10000 }).catch(() => {});
  await waitForSettle(page, 2000);
  console.log(`  [step] Adviser Use set: ${JSON.stringify(set)}`);
  return set;
}

/**
 * Full quote -> application-flow entry. Opens a new quote, fills all Apply-mandatory personal details,
 * activates a cover with a sum insured, fills the mandatory Adviser Use commission popup, then clicks
 * Apply — reaching the Client Summary page (Step 2 of the apply flow). Returns the quote page (now on
 * Client Summary) so callers can drive onward (Proceed to application -> Duty of Disclosure -> ...).
 * @param {import('@playwright/test').Page} page
 * @param {object} [opts] { cover='Life', sumInsured='500000', personal, commission='Upfront' }
 */
async function reachApplicationFlow(page, opts = {}) {
  const { cover = 'Life', sumInsured = '500000', personal = {}, commission = 'Upfront' } = opts;
  const quote = await openNewQuote(page);
  await completePersonalDetailsForApply(quote, personal);
  await activateCover(quote, cover);
  await fillCalcMask(sumInsuredInput(quote, 0), String(sumInsured));
  await waitForSettle(quote, 1500);
  await fillAdviserUse(quote, commission);
  const { progressed, errors } = await clickApplyNow(quote);
  if (!progressed) throw new Error(`reachApplicationFlow: Apply did not progress to Client Summary. Errors: ${JSON.stringify(errors)}`);
  return quote;
}

/**
 * From the Client Summary page (Step 2, reached by reachApplicationFlow), fills its OWN mandatory
 * First/Last Name fields (a SEPARATE screen from the quote — its names default empty and block Proceed)
 * and clicks "Proceed to application", advancing to Duty of Disclosure (Step 3).
 * MUST use real Playwright fill() for the names (raw .value injection does not register in the
 * OutSystems reactive model on this screen — confirmed 2026-09-10). Returns the page (now on DoD).
 * @param {import('@playwright/test').Page} page  (the quote/application page, on Client Summary)
 * @param {object} [opts] { firstName='Test', lastName='Applicant' }
 */
async function proceedThroughClientSummary(page, opts = {}) {
  const { firstName = 'Test', lastName = 'Applicant' } = opts;
  console.log('  [step] Client Summary: filling mandatory names + Proceed to application...');
  const ids = await page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const f = [...document.querySelectorAll('input')].filter((i) => vis(i) && /Input_FirstName/i.test(i.id || ''))[0];
    const l = [...document.querySelectorAll('input')].filter((i) => vis(i) && /Input_LastName/i.test(i.id || ''))[0];
    return { first: f ? f.id : null, last: l ? l.id : null };
  });
  if (ids.first) await page.locator(`[id="${ids.first}"]`).fill(firstName);
  if (ids.last) await page.locator(`[id="${ids.last}"]`).fill(lastName);
  await waitForSettle(page, 1500);
  await page.getByRole('button', { name: /proceed to application/i }).first().click({ timeout: 10000 });
  await page.waitForFunction(() => /duty of disclosure/i.test(document.body.innerText || ''), { timeout: 20000 }).catch(() => {});
  await waitForSettle(page, 3000);
  const onDoD = await page.evaluate(() => /duty of disclosure/i.test(document.body.innerText || ''));
  console.log(`  [step] Client Summary Proceed ${onDoD ? 'reached Duty of Disclosure' : 'did NOT reach Duty of Disclosure'}`);
  return { reachedDoD: onDoD };
}

/** Opens the Occupation type-ahead, types a search string, and clicks the first matching option. */
async function setOccupation(page, searchText, optionStartsWith) {
  return selectFromTypeahead(page, 'Select an option', searchText, optionStartsWith);
}

/**
 * Activates a top-level cover by its exact button text (Life, TPD, Trauma,
 * Cancer, Acd. Death, Needlestick, Specific Injury, Mortgage & Living, Income
 * Protection, Workability, Business Expenses, Business Disability, Farmers
 * Disability). Standard Playwright .click() can miss the activating XHR for
 * some of these, so this drives a real `.click()` via evaluate on the button
 * whose visible text starts with the given label.
 */
async function activateCover(page, buttonLabel) {
  console.log(`  [step] Activating cover: ${buttonLabel}`);
  return clickButtonByLabel(page, buttonLabel, 'Cover button');
}

/** True if a cover button with this exact label exists at all (present vs. removed from DOM). */
async function coverButtonExists(page, buttonLabel) {
  return buttonByLabelExists(page, buttonLabel);
}

/** Removes an active cover card by clicking the "Remove" link nearest its heading text. */
async function removeCoverCard(page, cardHeadingStartsWith) {
  await page.evaluate((headingText) => {
    const removeLinks = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove');
    const link = removeLinks.find((l) => l.closest('div')?.parentElement?.innerText?.split('\n')[0].startsWith(headingText));
    if (!link) throw new Error(`No "Remove" link found near heading starting with: "${headingText}"`);
    link.click();
  }, cardHeadingStartsWith);
  await waitForSettle(page);
}

/** Removes every currently-active cover card on the page (bulk cleanup between scenarios in one test). */
async function removeAllCoverCards(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove').forEach((a) => a.click());
  });
  await waitForSettle(page);
}

/**
 * Clicks the footer Apply button and waits for the page to reach a STABLE post-Apply
 * state before reading errors - not just a fixed settle delay. Confirmed live
 * (2026-08-26 investigation) that Apply can trigger a cascade of several recalculation
 * requests (occupation eligibility, default commission, etc.) during which a transient
 * validation message can appear and then clear again as later requests resolve - e.g.
 * "Please complete the client's employment details before applying" flashed at ~600ms
 * and was gone by ~7.6s on a config where Employment Status genuinely had been set. A
 * single early read (the old fixed ~400ms wait) can land in that window and produce a
 * false "no errors" or a since-cleared error, which is what caused VAL-08/09/10, VAL-11,
 * and KID-05 to misreport in the 2026-08-26 full-suite run. This instead polls
 * document.body.innerText for stability (2 consecutive identical reads) before treating
 * the state as final, per the project's "self-verifying interaction" rule - never trust
 * a read that isn't confirmed stable.
 */
async function clickApply(page) {
  console.log('  [step] Clicking Apply...');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await waitForSettle(page);

  const stabilityDeadline = Date.now() + 8000;
  let previous = null;
  let stableStreak = 0;
  while (Date.now() < stabilityDeadline && stableStreak < 2) {
    const current = await page.evaluate(() => document.body.innerText);
    stableStreak = current === previous ? stableStreak + 1 : 1;
    previous = current;
    if (stableStreak < 2) await page.waitForTimeout(500);
  }

  const errors = await getVisibleErrors(page);
  console.log(errors.length ? `  [step] Apply result: ${errors.length} visible error(s): ${JSON.stringify(errors).slice(0, 200)}` : '  [step] Apply result: no visible errors');
}

/** Reads the current "Total Yearly Premium" figure as a number (e.g. 254.16), or null if not present. */
async function getTotalYearlyPremium(page) {
  const text = await page.evaluate(() => {
    const idx = document.body.innerText.indexOf('Total Yearly Premium');
    if (idx === -1) return null;
    return document.body.innerText.slice(idx, idx + 40);
  });
  if (!text) return null;
  const m = text.match(/\$([\d,.]+)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

/** Reads the current Bundling Discount label text (e.g. "None", "15% (2 covers)"). */
async function getBundlingDiscount(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const idx = text.indexOf('Bundling Discounts');
    if (idx === -1) return null;
    const chunk = text.slice(idx, idx + 60);
    const line = chunk.split('\n')[1];
    return line ? line.trim() : null;
  });
}

/**
 * True if the screen has silently navigated from "Illustration" to the Client-summary
 * step. Per VAL-08/VAL-09, the URL doesn't reliably change and the exact heading text
 * was never confirmed verbatim — so this checks the one hard, documented signal
 * instead: the footer button set (Close/View PDF/Save as New/Save/Apply) disappearing
 * along with the "Illustration" heading.
 */
async function isOnClientSummary(page) {
  return page.evaluate(() => {
    const hasApplyButton = [...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Apply');
    return !hasApplyButton && !document.body.innerText.includes('Illustration');
  });
}

/** Returns the Nth (0-based) Sum Insured / Monthly Benefit calc-mask input currently on the page. */
function sumInsuredInput(page, index = 0) {
  return page.locator('input[id*="SumInsured"]').nth(index);
}

// ── Lump Sum cover benefit controls (discovered via probe-life-checkboxes.js) ──
// Stable-ish OutSystems element IDs on the Life (and other lump sum) cover cards:
//   Checkbox_InflationAdjustmentBenefit — auto-ticked on Life activation
//   Checkbox_PremiumFreeze              — off by default; ticking it unticks Inflation (mutual exclusion)
//   Dropdown_Premiums                   — "We Pay Your Premiums" select (default "None")
//   Dropdown_FlexiRate                  — Flexi Rate select (default "N/A")
//   PaymentFrequencyDropdown            — premium payment frequency (Monthly/Yearly/etc.)
// The Premium Structure select has an OPAQUE, position-generated id (e.g.
// "b23-l2-1472_0-b7-Dropdown1") that must NOT be relied on — locate it by its distinctive
// option set (Stepped + Level to 50..100) instead. This is the fingerprint pattern.

/** Reads the Inflation Adjustment Benefit checkbox state (true/false), or null if absent. */
async function getInflationAdjustmentChecked(page) {
  return page.evaluate(() => {
    const cb = document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]');
    return cb ? cb.checked : null;
  });
}

/** Reads the Premium Freeze checkbox state (true/false), or null if absent. */
async function getPremiumFreezeChecked(page) {
  return page.evaluate(() => {
    const cb = document.querySelector('input[id*="Checkbox_PremiumFreeze"]');
    return cb ? cb.checked : null;
  });
}

/** Ticks the Premium Freeze checkbox (real click to fire the OutSystems handler) and settles. */
async function setPremiumFreeze(page) {
  console.log('  [step] Ticking Premium Freeze...');
  await page.evaluate(() => {
    const cb = document.querySelector('input[id*="Checkbox_PremiumFreeze"]');
    if (cb && !cb.checked) { cb.scrollIntoView({ block: 'center' }); cb.click(); }
  });
  await waitForSettle(page, 1500);
}

// Finds the Premium Structure select's opaque id by fingerprint (options include Stepped +
// Level to 100). Returns the id string, or null. Cached-free — cheap enough to re-find.
async function findPremiumStructureSelectId(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const opts = [...s.options].map((o) => o.text.trim());
      return opts.includes('Stepped') && opts.some((o) => o === 'Level to 100');
    });
    return sel ? sel.id : null;
  });
}

/** Reads the current Premium Structure selected option text (e.g. "Stepped"), or null. */
async function getPremiumStructure(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const opts = [...s.options].map((o) => o.text.trim());
      return opts.includes('Stepped') && opts.some((o) => o === 'Level to 100');
    });
    return sel ? sel.options[sel.selectedIndex].text.trim() : null;
  });
}

/** Sets Premium Structure by visible label (Stepped, Level to 50/60/65/70/75/80/100). */
async function setPremiumStructure(page, label) {
  console.log(`  [step] Setting Premium Structure = ${label}`);
  const id = await findPremiumStructureSelectId(page);
  if (!id) throw new Error('Premium Structure select not found (no Stepped/Level-to options)');
  await page.locator(`[id="${id}"]`).selectOption({ label });
  await waitForSettle(page, 1000);
}

// ── Generic label-fingerprinted controls (avoid opaque OutSystems ids) ──
// A checkbox is identified by the visible text near it (its container's innerText). Returns the
// element's id, or null. Works for Trauma optional benefits (Early Trauma / Trauma Reinstatement /
// Continuous Trauma) whose ids are position-generated (e.g. ..._2927_1-Checkbox1).
async function findCheckboxIdByLabel(page, labelSubstr) {
  return page.evaluate((sub) => {
    const cb = [...document.querySelectorAll('input[type="checkbox"]')].find((c) => {
      let cont = c.parentElement, txt = '';
      for (let d = 0; d < 4 && cont; d++) { txt = (cont.innerText || '').trim(); if (txt) break; cont = cont.parentElement; }
      return txt.toLowerCase().includes(sub.toLowerCase());
    });
    return cb ? cb.id : null;
  }, labelSubstr);
}

/** Reads a checkbox's {checked, disabled} by nearby label, or null if not found. */
async function getCheckboxStateByLabel(page, labelSubstr) {
  return page.evaluate((sub) => {
    const cb = [...document.querySelectorAll('input[type="checkbox"]')].find((c) => {
      let cont = c.parentElement, txt = '';
      for (let d = 0; d < 4 && cont; d++) { txt = (cont.innerText || '').trim(); if (txt) break; cont = cont.parentElement; }
      return txt.toLowerCase().includes(sub.toLowerCase());
    });
    return cb ? { checked: cb.checked, disabled: cb.disabled } : null;
  }, labelSubstr);
}

/** Ticks a checkbox identified by nearby label (real click for the OutSystems handler). */
async function tickCheckboxByLabel(page, labelSubstr) {
  console.log(`  [step] Ticking checkbox: ${labelSubstr}`);
  const id = await findCheckboxIdByLabel(page, labelSubstr);
  if (!id) throw new Error(`Checkbox not found near label: ${labelSubstr}`);
  await page.evaluate((cid) => { const c = document.getElementById(cid); if (c && !c.checked) { c.scrollIntoView({ block: 'center' }); c.click(); } }, id);
  await waitForSettle(page, 1500);
}

/** Reads the TPD-on-Trauma Definition select's {selected, options}, or null. Fingerprint: {Own, Any}. */
async function getTpdOnTraumaDefinition(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => {
      const o = [...s.options].map((x) => x.text.trim());
      return o.length <= 3 && o.includes('Own') && o.includes('Any');
    });
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()), id: sel.id } : null;
  });
}

module.exports = {
  openNewQuote,
  waitForSettle,
  setAge,
  setGender,
  setMinimumPersonalDetails,
  setDateOfBirth,
  completePersonalDetailsForApply,
  saveQuote,
  clickApplyNow,
  fillAdviserUse,
  reachApplicationFlow,
  proceedThroughClientSummary,
  setOccupation,
  fillCalcMask,
  commitWithoutTyping,
  activateCover,
  coverButtonExists,
  removeCoverCard,
  removeAllCoverCards,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  getTotalYearlyPremium,
  getBundlingDiscount,
  isOnClientSummary,
  sumInsuredInput,
  getInflationAdjustmentChecked,
  getPremiumFreezeChecked,
  setPremiumFreeze,
  getPremiumStructure,
  setPremiumStructure,
  findCheckboxIdByLabel,
  getCheckboxStateByLabel,
  tickCheckboxByLabel,
  getTpdOnTraumaDefinition,
};

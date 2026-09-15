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
/**
 * Best-effort: select an Adviser in the "Operating as / Adviser" vscomp dropdown on the
 * /QuoteAndApply landing page. This must be set before "New Quote" will fire window.open
 * (confirmed 2026-09-11). No-op if the dropdown isn't present or already has a value.
 */
async function selectAdviserIfPresent(page) {
  try {
    const toggle = page.locator('#b5-DropdownSearchAdviser .vscomp-toggle-button, [id*="DropdownSearchAdviser"] .vscomp-toggle-button').first();
    if (!(await toggle.count())) return;
    const current = (await toggle.innerText().catch(() => '')) || '';
    if (current && !/select/i.test(current.trim())) return; // already chosen
    await toggle.click().catch(() => {});
    await waitForSettle(page, 800);
    // Options render in a .vscomp-options list; pick the first real (non-placeholder) option.
    const opt = page.locator('.vscomp-option:not(.disabled)').filter({ hasNotText: /^select/i }).first();
    await opt.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await opt.count()) {
      await opt.click().catch(() => {});
      await waitForSettle(page, 1200);
      console.log('  [step] Adviser selected in the Operating-as dropdown');
    } else {
      // Close the dropdown if we couldn't pick, to avoid intercepting the New Quote click.
      await page.keyboard.press('Escape').catch(() => {});
    }
  } catch (_) { /* best-effort */ }
}

async function openNewQuote(page) {
  console.log('  [step] Opening a new quote...');
  await page.goto('/QuoteAndApply/');
  await page.waitForLoadState('domcontentloaded');
  const link = page.locator('a', { hasText: 'New Quote' }).first();
  await link.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await waitForSettle(page, 1500);

  // Select an Adviser first — the "Adviser: Select..." vscomp dropdown (id b5-DropdownSearchAdviser)
  // must have a value before "New Quote" fires window.open (confirmed 2026-09-11: with no adviser
  // selected, clicking New Quote no-ops — no popup, no nav). Best-effort: open the vscomp, pick the
  // first real option. Skip silently if it's already set or not present.
  await selectAdviserIfPresent(page);

  // The New Quote handler (OutSystems chooseNav) runs UpdateAdviserInSession then window.open(...) to
  // a NEW TAB — that adviser-session context is what makes Apply functional and the footer action bar
  // render. Deep-linking to the quote URL SKIPS this and yields an inert Apply (confirmed 2026-09-09).
  // So we MUST capture the real popup tab. Canonical pattern: arm the popup waiter, THEN click.
  const context = page.context();
  let popup = null;
  for (let attempt = 1; attempt <= 4 && !popup; attempt++) {
    try {
      // On retries, re-navigate + re-settle so the New Quote link/list is fresh (the flake is
      // usually the list not being fully ready when we click).
      if (attempt > 1) {
        await page.goto('/QuoteAndApply/').catch(() => {});
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await waitForSettle(page, 2000 + attempt * 1000);
      }
      const freshLink = page.locator('a', { hasText: 'New Quote' }).first();
      await freshLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      const [p] = await Promise.all([
        context.waitForEvent('page', { timeout: 25000 }),
        freshLink.click(),
      ]);
      popup = p;
    } catch (_) {
      await waitForSettle(page, 2000);
    }
  }
  if (!popup) {
    throw new Error('openNewQuote: New Quote did not open a popup tab after 4 attempts. The quote MUST be '
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
  // The commission popup is opened by a BUTTON labelled "Adviser Use" (class contains 'btn') — NOT
  // the per-life section-header DIVs that also read "Adviser Use" (2026-09-14: in multi-life view a
  // getByText().first() matched a header DIV, opening nothing; the real trigger is the button).
  const adviserBtn = page.locator('button', { hasText: /^Adviser Use$/ }).first();
  await adviserBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  let opened = await adviserBtn.click({ timeout: 6000 }).then(() => true).catch(() => false);
  if (!opened) {
    opened = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((e) => e.offsetParent !== null && (e.innerText || '').trim() === 'Adviser Use');
      if (b) { b.scrollIntoView({ block: 'center' }); b.click(); return true; }
      return false;
    });
  }
  console.log(`  [step] Adviser Use button ${opened ? 'clicked' : 'NOT FOUND'}`);
  await waitForSettle(page, 2500);
  // Set commission for ALL lives. In multi-life the popup has a Select-All-style commission dropdown
  // that cascades, PLUS a per-life commission dropdown per life. Set the first one, wait for the
  // cascade, then sweep any that are STILL "Please Select" (per-life). Apply silently gates if ANY
  // commission dropdown remains unset (confirmed 2026-09-14).
  const setAll = async () => page.evaluate((struct) => {
    function vis(e) { return e && e.offsetParent !== null; }
    function commission(s) { const o = [...s.options].map((x) => x.text.trim()); return o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20'); }
    let n = 0;
    [...document.querySelectorAll('select')].filter(vis).filter(commission).forEach((s) => {
      if (/please select/i.test((s.options[s.selectedIndex] || {}).text || '')) {
        const opt = [...s.options].find((o) => o.text.trim() === struct);
        if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); n++; }
      }
    });
    return n;
  }, structure);
  const set = await setAll(); await waitForSettle(page, 1500);
  const set2 = await setAll(); await waitForSettle(page, 1000);
  const set3 = await setAll(); await waitForSettle(page, 1000);
  // verify none remain unset
  const remaining = await page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    function commission(s) { const o = [...s.options].map((x) => x.text.trim()); return o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20'); }
    return [...document.querySelectorAll('select')].filter(vis).filter(commission).filter((s) => /please select/i.test((s.options[s.selectedIndex] || {}).text || '')).length;
  });
  console.log(`  [step] Adviser Use commission dropdowns set (pass counts ${set}/${set2}/${set3}); ${remaining} still unset`);
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

/* ============================================================================
 * APPLY-FLOW HELPERS (post-quote application wizard)
 * Verified end-to-end on QA 2026-09-15 (full submission -> policy J4211922).
 * See docs/apply-flow-end-to-end-2026-09-15.md for the full map + the 3 answer-traps.
 * These encode the proven interaction sequences so apply-flow ACs can be scripted
 * without re-deriving the page-cycling / dynamic-id logic.
 * ========================================================================== */

/** Read the current apply-flow screen: pathname + the visible section heading. */
async function applyFlowScreen(page) {
  return page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const heads = [].slice.call(document.querySelectorAll('h1,h2,h3')).filter(vis).map((e) => (e.innerText || '').trim()).filter(Boolean);
    const bodyHead = (document.body.innerText.match(/(MENTAL HEALTH|PHYSICAL HEALTH - EVER|PHYSICAL HEALTH - IN THE LAST 5 YEARS|OTHER MEDICAL HISTORY|FAMILY HISTORY|UNDERWRITING ASSESSMENTS & CLAIMS|RESIDENCE AND TRAVEL|OCCUPATION|FINANCIAL|INSURANCE HISTORY|Questionnaire Completed|Unanswered Questions)/) || [''])[0];
    return { url: location.pathname, heading: heads[0] || '', section: bodyHead };
  });
}

/** Click the footer primary "Next" and wait for the wizard to settle. */
async function applyFlowNext(page, settleMs = 5000) {
  await page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const n = [].slice.call(document.querySelectorAll('button.btn-primary,button,a')).find((b) => vis(b) && /^next$/i.test((b.innerText || '').trim()));
    if (n) n.click();
  });
  await waitForSettle(page, settleMs);
}

/**
 * Reads the apply-flow PROGRESS SIDEBAR (the "1. Quote / 2. Client / ..." panel). Each completed
 * step carries a completion tick: `<i class="... text-success fa fa-check-ci">` next to its label
 * (confirmed live 2026-09-15 — this is the "completion tick" of the Navigation Behaviour ACs).
 * Returns [{ label, completed }] for the numbered top-level steps.
 */
async function getApplyFlowSidebar(page) {
  return page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    // Numbered step labels look like "1. Quote", "4. Personal Details", "5. Personal Statement", "6. Summary and payment".
    const out = [];
    const seen = {};
    [].slice.call(document.querySelectorAll('*')).forEach((e) => {
      if (!vis(e)) return;
      const txt = (e.childElementCount === 0 ? (e.textContent || '') : '').replace(/\s+/g, ' ').trim();
      const m = txt.match(/^(\d+)\.\s+(.+)$/);
      if (!m || m[2].length > 40) return;
      const key = m[1] + '.' + m[2];
      if (seen[key]) return; seen[key] = 1;
      // The tick <i> is a sibling within the same step row; climb to the row and look for fa-check-ci.
      let row = e; for (let k = 0; k < 4 && row; k++) { row = row.parentElement; if (row && row.querySelector('i.fa-check-ci, i[class*="check-ci"]')) break; }
      const completed = !!(row && row.querySelector('i.fa-check-ci, i[class*="check-ci"]'));
      out.push({ num: Number(m[1]), label: m[2].trim(), completed });
    });
    return out.sort((a, b) => a.num - b.num);
  });
}

/** Clicks a progress-sidebar step by its label (partial match) to navigate to it. */
async function clickApplyFlowStep(page, labelMatch) {
  await page.evaluate((lm) => {
    function vis(e) { return e && e.offsetParent !== null; }
    const el = [].slice.call(document.querySelectorAll('a,span,div,li')).find((e) => vis(e) && e.childElementCount <= 2 && new RegExp('^\\d+\\.\\s*' + lm, 'i').test((e.textContent || '').replace(/\s+/g, ' ').trim()));
    if (el) { (el.closest('a') || el).click(); }
  }, labelMatch);
  await waitForSettle(page, 4000);
}

/** Duty of Disclosure: set the adviser-confirmation Yes and click Next. */
async function passDutyOfDisclosure(page) {
  console.log('  [apply] Duty of Disclosure: agree + Next');
  await page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    // Yes can be a button-group item or a radio-styled div; click the first "Yes".
    const yes = [].slice.call(document.querySelectorAll('.button-group-item,button,[id*="RadioButton1"] input,[id*="Yes"] input,input[type="radio"][value="Yes"]')).find((x) => vis(x) && (/^yes$/i.test((x.innerText || '').trim()) || /Yes/i.test(x.value || '')));
    if (yes) yes.click();
  });
  await waitForSettle(page, 1500);
  await applyFlowNext(page, 6000);
}

/**
 * Personal Details application screen. Fills the confirmed mandatory set (Title, Marital Status,
 * Cm/Kg masked, Mobile, Email, DOB, home address via lookup) and answers the Yes/No button-groups.
 * Uses real Playwright selectOption/fill (raw .value does not commit reliably here). Verifies the
 * masked height/weight landed and retries. Postal-same-as-home + button-groups default answered.
 * @param {object} opts { title, maritalStatus, cm, kg, mobile, email, addressQuery, dob (match quote ANB) }
 */
async function fillPersonalDetailsScreen(page, opts = {}) {
  const { title = 'Mr', maritalStatus = 'Single', cm = '180', kg = '80', mobile = '0211234567', email = 'test@example.com', addressQuery = '12 Queen', dob } = opts;
  console.log('  [apply] Personal Details screen');
  // Title + Marital Status via real selectOption (by label).
  await page.locator('select[id*="b5-Dropdown_Title"]').first().selectOption({ label: title }).catch(async () => {
    await page.evaluate((t) => { const s = document.querySelector('select[id*="Dropdown_Title"]'); if (s) { for (let i = 0; i < s.options.length; i++) { if (s.options[i].text.trim() === t) { s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); break; } } } }, title);
  });
  await page.locator('select[id*="b5-Dropdown_MaritalStatus"]').first().selectOption({ label: maritalStatus }).catch(() => {});
  await waitForSettle(page, 500);
  // Mobile + Email via real fill.
  await page.locator('input[id*="b5-Input_MobileNumber"]').first().fill(mobile).catch(() => {});
  await page.locator('input[id*="b5-Input_Email"]').first().fill(email).catch(() => {});
  // DOB (must match quote ANB) via real fill.
  if (dob) await page.locator('input[id*="b5-Input_DateOfBirth"]').first().fill(dob).catch(() => {});
  // Height/Weight: masked Cm/Kg ONLY (leave Feet/Inches/Stones/Pounds blank). fillCalcMask +
  // verify the digits landed (mask can show just "." if focus was lost); retry once.
  for (const [sel, val, name] of [['input[id*="b5-Input_Cm"]', cm, 'Cm'], ['input[id*="b5-Input_Kg"]', kg, 'Kg']]) {
    const loc = page.locator(sel).first();
    await fillCalcMask(loc, val).catch(() => {});
    await waitForSettle(page, 400);
    const landed = await loc.inputValue().catch(() => '');
    if (!/\d/.test(landed)) { // mask empty -> retry with explicit focus+type
      await loc.evaluate((e) => e.focus()).catch(() => {});
      await loc.type(val, { delay: 40 }).catch(() => {});
      await waitForSettle(page, 400);
      console.log(`  [apply] ${name} retry -> "${await loc.inputValue().catch(() => '')}"`);
    }
  }
  await waitForSettle(page, 600);
  // Home address: focus FIRST (click alone leaves it unfocused -> "No options to show"), type, pick a real suggestion.
  const addr = page.locator('input[id*="b5-b20-Input_AddressLookup"]').first();
  await addr.evaluate((e) => e.focus()).catch(() => {});
  await addr.type(addressQuery, { delay: 70 }).catch(() => {});
  await waitForSettle(page, 3000);
  const picked = await page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const opt = [].slice.call(document.querySelectorAll('li,[role="option"],.dropdown-item,[class*="suggestion"],[class*="Option"]')).filter(vis).find((x) => /\d+\s+.+,.+\d{4}/.test((x.innerText || '').trim()));
    if (opt) { opt.click(); return (opt.innerText || '').trim().slice(0, 40); }
    return null;
  });
  console.log(`  [apply] address picked: ${picked || '(none yet)'}`);
  await waitForSettle(page, 1500);
  // Answer the Yes/No button-groups by their QUESTION text (each set has a Yes + No item):
  //  - "postal address same as ... home" => Yes (skips the 2nd/postal address block)
  //  - everything else (Paramedical Services "mobile medical", etc.) => No
  await page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const items = [].slice.call(document.querySelectorAll('.button-group-item')).filter(vis);
    const seen = [];
    items.forEach((it) => {
      // Climb until the ancestor text is meaningfully longer than "Yes No" (i.e. includes the question).
      let c = it; let q = '';
      for (let k = 0; k < 9 && c; k++) { c = c.parentElement; if (c) { const t = (c.innerText || '').replace(/\s+/g, ' ').trim(); if (t.length > 15 && /yes\s*no/i.test(t)) { q = t; break; } } }
      if (!c || seen.indexOf(c) >= 0) return; seen.push(c);
      const wantYes = /postal address same as|same as (your |the )?home address/i.test(q);
      const pick = [].slice.call(c.querySelectorAll('.button-group-item')).find((b) => new RegExp('^' + (wantYes ? 'yes' : 'no') + '$', 'i').test((b.innerText || '').trim()));
      if (pick) pick.click();
    });
  });
  await waitForSettle(page, 1500);
}

/** Answer every visible Yes/No question on the current questionnaire page "No" (radio-styled). */
async function answerAllNoOnPage(page) {
  return page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const nos = [].slice.call(document.querySelectorAll('input[type="radio"][id*="RadioButton2-input"],input[type="radio"][id*="-b12-No-input"],input[type="radio"][id*="b9-No-input"]')).filter(vis);
    let n = 0; nos.forEach((i) => { if (!i.checked) { i.click(); if (!i.checked) { i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); } } n++; });
    // Any "Please select" dropdown that offers No -> No.
    [].slice.call(document.querySelectorAll('select')).filter(vis).forEach((s) => { if (/select an option|please select/i.test((s.options[s.selectedIndex] || {}).text || '')) { for (let i = 0; i < s.options.length; i++) { if (/^no$/i.test(s.options[i].text)) { s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); break; } } } });
    return n;
  });
}

/**
 * Clears the Insurance & Financial Details 3-page loop (occupation hazards No, income + mortgage,
 * insurance history No) then advances past "Questionnaire Completed".
 */
async function passInsuranceAndFinancial(page, income = 120000) {
  console.log('  [apply] Insurance & Financial Details');
  for (let i = 0; i < 6; i++) {
    const s = await applyFlowScreen(page);
    if (/Questionnaire Completed/.test(s.section)) break;
    if (/Unanswered Questions/.test(s.section)) {
      // open the first remaining Answer, or finish if none.
      const opened = await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const b = [].slice.call(document.querySelectorAll('button,a')).filter((x) => vis(x) && /^answer$/i.test((x.innerText || '').trim()))[0]; if (b) { b.click(); return true; } return false; });
      if (!opened) break;
      await waitForSettle(page, 3500);
      continue;
    }
    await answerAllNoOnPage(page);
    // Fill the FINANCIAL income masked field with the full id if present.
    await page.evaluate((inc) => { function vis(e) { return e && e.offsetParent !== null; } const m = [].slice.call(document.querySelectorAll('input[id*="b8-Input_AnswerTextMasked2"]')).filter(vis)[0]; if (m && !m.value) { m.focus(); m.dispatchEvent(new Event('focus', { bubbles: true })); } }, income);
    const incEl = page.locator('input[id*="b8-Input_AnswerTextMasked2"]').first();
    if (await incEl.count()) await fillCalcMask(incEl, String(income)).catch(() => {});
    await waitForSettle(page, 1000);
    await applyFlowNext(page, 5000);
  }
  // Past "Questionnaire Completed" -> next stage.
  await applyFlowNext(page, 6000);
}

/** Tele Interview: answer No (radio-styled DIVs) and advance to Personal Statement. */
async function passTeleInterview(page) {
  console.log('  [apply] Tele Interview: No');
  await page.evaluate(() => {
    const d = document.querySelector('[id*="b3-RadioButton2"]');
    const inp = d ? (d.querySelector('input') || d) : null;
    if (inp) { inp.click(); if (inp.tagName === 'INPUT') { inp.checked = true; inp.dispatchEvent(new Event('change', { bubbles: true })); } }
  });
  await waitForSettle(page, 1500);
  await applyFlowNext(page, 6000);
}

/**
 * Clears the Personal Statement (the 3 answer-traps handled): No to health pages, citizen=Yes on
 * Residence, standard-drinks number on Alcohol, "None of the above" on Family History. Loops until
 * the Unanswered count is 0, then advances past "Questionnaire Completed".
 * @param {object} opts { drinks = '5' }
 */
async function passPersonalStatement(page, opts = {}) {
  const { drinks = '5' } = opts;
  console.log('  [apply] Personal Statement (3 answer-traps)');
  for (let guard = 0; guard < 25; guard++) {
    const s = await applyFlowScreen(page);
    if (/Questionnaire Completed/.test(s.section)) break;
    if (/Unanswered Questions/.test(s.section)) {
      const count = await page.evaluate(() => [].slice.call(document.querySelectorAll('button,a')).filter((b) => b.offsetParent !== null && /^answer$/i.test((b.innerText || '').trim())).length);
      if (count === 0) break;
      await page.evaluate(() => { const b = [].slice.call(document.querySelectorAll('button,a')).filter((x) => x.offsetParent !== null && /^answer$/i.test((x.innerText || '').trim()))[0]; if (b) b.click(); });
      await waitForSettle(page, 3500);
      continue;
    }
    // FAMILY HISTORY: tick "None of the above" (last checkbox); do not batch-No.
    if (/FAMILY HISTORY/.test(s.section)) {
      await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const cbs = [].slice.call(document.querySelectorAll('input[type="checkbox"]')).filter(vis); const none = cbs[cbs.length - 1]; if (none && !none.checked) { none.click(); if (!none.checked) { none.checked = true; none.dispatchEvent(new Event('change', { bubbles: true })); } } });
      await waitForSettle(page, 800);
      await applyFlowNext(page, 5000);
      continue;
    }
    // Everything else: answer No first, then fix the RESIDENCE + ALCOHOL traps.
    await answerAllNoOnPage(page);
    if (/RESIDENCE AND TRAVEL/.test(s.section)) {
      // citizen = Yes (first b3 group). Overrides the batch-No above.
      await page.evaluate(() => { const y = document.querySelector('input[type="radio"][id*="b3-RadioButton1-input"]'); if (y) { y.click(); y.checked = true; y.dispatchEvent(new Event('change', { bubbles: true })); } });
      await waitForSettle(page, 1500);
      // any "how long in NZ" dropdown (only shows if citizen=No) -> Over 5 years, just in case.
      await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const d = [].slice.call(document.querySelectorAll('select')).filter(vis).find((s2) => [].slice.call(s2.options).some((o) => /over 5 years/i.test(o.text))); if (d) { for (let i = 0; i < d.options.length; i++) { if (/over 5 years/i.test(d.options[i].text)) { d.selectedIndex = i; d.dispatchEvent(new Event('change', { bubbles: true })); break; } } } });
    }
    // ALCOHOL: fill the masked standard-drinks field by its FULL id (partial id hits wrong element).
    const drinkEl = page.locator('input[id$="b8-Input_AnswerTextMasked"]').first();
    if (await drinkEl.count()) {
      const id = await drinkEl.getAttribute('id').catch(() => null);
      if (id) { const cur = await drinkEl.inputValue().catch(() => ''); if (!cur) await fillCalcMask(drinkEl, String(drinks)).catch(() => {}); }
    }
    await waitForSettle(page, 1000);
    await applyFlowNext(page, 5000);
  }
  await applyFlowNext(page, 6000);
}

/** Owner & Address Detail: select the existing person (value 0) in both dropdowns and click Add for each. */
async function passOwnerAndAddress(page) {
  console.log('  [apply] Owner & Address Detail');
  await page.evaluate(() => { const s = document.querySelector('select[id*="Dropdown_PolicyOwnerRelatedParty"]'); if (s) { s.value = '0'; s.selectedIndex = Math.max(1, s.selectedIndex); s.dispatchEvent(new Event('change', { bubbles: true })); } });
  await waitForSettle(page, 1500);
  await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const add = [].slice.call(document.querySelectorAll('button,a')).filter((b) => vis(b) && /^add$/i.test((b.innerText || '').trim()))[0]; if (add) add.click(); });
  await waitForSettle(page, 3000);
  await page.evaluate(() => { const s = document.querySelector('select[id*="Dropdown_AddressRelatedParty"]'); if (s) { s.value = '0'; s.selectedIndex = Math.max(1, s.selectedIndex); s.dispatchEvent(new Event('change', { bubbles: true })); } });
  await waitForSettle(page, 2000);
  await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const adds = [].slice.call(document.querySelectorAll('button,a')).filter((b) => vis(b) && /^add$/i.test((b.innerText || '').trim())); if (adds.length) adds[adds.length - 1].click(); });
  await waitForSettle(page, 3000);
  await applyFlowNext(page, 6000);
}

/**
 * Payment: Direct Debit with test bank details, tick product-line + DD-authority, Apply to Policy, Next.
 * NB the bank-number field id collides with BankName on a partial match — set it by exact suffix.
 */
async function passPaymentDirectDebit(page, opts = {}) {
  const { bankName = 'ANZ Bank', accountName = 'Test Applicant', bank = '01', branch = '0001', account = '0123456', suffix = '00' } = opts;
  console.log('  [apply] Payment: Direct Debit');
  await page.evaluate(() => { const s = document.querySelector('select[id*="DropdownPaymentMethod"]'); if (s) { for (let i = 0; i < s.options.length; i++) { if (/direct debit/i.test(s.options[i].text)) { s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); break; } } } });
  await waitForSettle(page, 3000);
  await page.evaluate((o) => {
    function setExact(suffixId, v) { const els = [].slice.call(document.querySelectorAll('input')).filter((e) => e.id.endsWith(suffixId)); if (els[0]) { const e = els[0]; e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); } }
    setExact('b6-Input_BankName', o.bankName); setExact('b6-Input_AccountName', o.accountName);
    setExact('b6-Input_Bank', o.bank); setExact('b6-Input_Branch', o.branch);
    setExact('b6-Input_AccountNumber', o.account); setExact('b6-Input_AccountNumber2', o.suffix);
  }, { bankName, accountName, bank, branch, account, suffix });
  await waitForSettle(page, 1000);
  // Tick product line + DD authority (all visible checkboxes except a header select-all).
  await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } [].slice.call(document.querySelectorAll('input[type="checkbox"][id*="CheckboxItem"],input[type="checkbox"][id*="b6-Checkbox2"]')).filter(vis).forEach((c) => { if (!c.checked) { c.click(); if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } } }); });
  await waitForSettle(page, 1500);
  await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const b = [].slice.call(document.querySelectorAll('button,a')).filter((x) => vis(x) && /apply to policy/i.test((x.innerText || '').trim()))[0]; if (b) b.click(); });
  await waitForSettle(page, 4000);
  await applyFlowNext(page, 6000);
}

/** Submit Application: tick the acknowledgment declaration and click Submit Application. Returns the policy number if reached. */
async function submitApplication(page) {
  console.log('  [apply] Submit Application');
  await page.evaluate(() => { const c = document.querySelector('input[type="checkbox"][id*="AcknowledgmentCheckbox"]'); if (c && !c.checked) { c.click(); if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } } });
  await waitForSettle(page, 1500);
  await page.evaluate(() => { function vis(e) { return e && e.offsetParent !== null; } const b = [].slice.call(document.querySelectorAll('button,a')).filter((x) => vis(x) && /submit application/i.test((x.innerText || '').trim()))[0]; if (b) b.click(); });
  await waitForSettle(page, 9000);
  return page.evaluate(() => { const m = document.body.innerText.match(/([A-Z]\d{6,})/); return { submitted: /application has been submitted/i.test(document.body.innerText), policyNumber: m ? m[1] : null }; });
}

module.exports = {
  openNewQuote,
  waitForSettle,
  applyFlowScreen,
  applyFlowNext,
  getApplyFlowSidebar,
  clickApplyFlowStep,
  passDutyOfDisclosure,
  fillPersonalDetailsScreen,
  answerAllNoOnPage,
  passInsuranceAndFinancial,
  passTeleInterview,
  passPersonalStatement,
  passOwnerAndAddress,
  passPaymentDirectDebit,
  submitApplication,
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

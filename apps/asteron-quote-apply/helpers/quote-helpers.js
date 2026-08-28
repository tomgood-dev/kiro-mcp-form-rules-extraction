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
 * "New Quote" uses a JS handler that calls window.open(). In headless mode
 * this may or may not create a popup. We patch window.open to capture the
 * target URL, then navigate to it directly.
 */
async function openNewQuote(page) {
  console.log('  [step] Opening a new quote...');
  await page.goto('/QuoteAndApply/');
  await page.waitForLoadState('domcontentloaded');
  // Wait for the actual "New Quote" link to be usable instead of a blind sleep —
  // this is the real condition the old 3s sleep was guessing at.
  await page.locator('a', { hasText: 'New Quote' }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  const quoteUrl = await captureWindowOpenFromLink(page, 'New Quote');

  if (quoteUrl) {
    // Navigate to the captured URL
    await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
  } else {
    // Fallback: navigate directly to a new blank quote
    await page.goto('/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
  }

  // Wait for the quote form to actually render — this real locator wait already
  // covers what the old second 3s blind sleep was guessing at.
  await page.locator('input[id*="Input_AgeNextBirthday"], input[id*="Input_FirstName"]').first()
    .waitFor({ state: 'visible', timeout: 30000 });
  await waitForSettle(page);
  console.log('  [step] Quote form rendered OK');
  return page;
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

module.exports = {
  openNewQuote,
  waitForSettle,
  setAge,
  setGender,
  setMinimumPersonalDetails,
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
};

// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/adviser-use-commission/page.md
// Source user story: docs/user-stories/User Story- Select Default Commission Category.md
// AC06/AC07/AC08: Update button save, confirmation message, and persistence of the
// agency-wide default.
//
// THIS TEST IS EXPECTED TO FAIL. Live investigation (evidence/12, evidence/13 — two
// independent probe scripts, one with a full sign-out/sign-in to rule out client-side
// caching) found that clicking Update does not display the AC07 confirmation message,
// does not re-disable the Update button, and does not persist the new value server-side
// even across a completely fresh login session. Per the acceptance-criteria-mode process,
// this test encodes the SPEC's expected behavior so it stays red until the real defect
// is fixed, rather than being written to match the app's current (broken) behavior.
//
// This is a Shape B (continuous-narrative) file, not Shape A — it deliberately stays
// ONE test() rather than being split into independent tests, because a later assertion
// (AC06/AC08: does a brand-new login session see the change?) depends on state mutated
// earlier in this SAME test. Splitting it would give each piece a fresh, unauthenticated
// context and silently break the story. Mutates the shared agency-wide Default for
// Agency setting for the duration of the test, then reverts it to Upfront in a `finally`
// block regardless of pass/fail, so a failure here doesn't leave the shared dev
// environment in a different state for other tests (Part 1's AC03 check assumes Upfront).
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
} = require('../../helpers/quote-helpers');
const {
  openAdviserUse,
  getDefaultAgencySelectInfo,
  setDefaultAgency,
  clickUpdate,
  bodyContainsConfirmationMessage,
} = require('../../helpers/adviser-use-helpers');

const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';

async function signOut(page) {
  await page.locator('button:has-text("Sign out")').click().catch(() => {});
  // A short gap here reliably causes the next login attempt to hit a stale-session
  // conflict (confirmed empirically this session) — give the server-side session
  // teardown more time to actually complete before logging back in.
  await page.waitForTimeout(8000);
}

// The default `page` fixture is already authenticated via the run's shared storageState
// (see playwright.config.js), but this test also needs a genuinely FRESH login mid-test
// to prove AC06/AC08 across sessions — storageState is a one-time snapshot taken before
// the run started, so after signOut() it no longer reflects a valid session.
async function loginOnce(page) {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');
  await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  if (page.url().includes('_error.html')) throw new Error('Login failed: error page');
  const emailField = page.locator('input[type="text"]').first();
  if (!(await emailField.isVisible().catch(() => false))) throw new Error('Login failed: form not rendered');
  await emailField.click();
  await page.keyboard.type(email, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(password, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed: credentials rejected or session conflict.');
}

// Retries once with a longer gap — a stale server-side session from the just-completed
// sign-out occasionally rejects the very next login attempt (confirmed empirically
// this session), and a second attempt after waiting reliably succeeds.
async function login(page) {
  try {
    await loginOnce(page);
  } catch (err) {
    console.log('  [step] Login failed, waiting 15s and retrying once: ' + err.message);
    await page.waitForTimeout(15000);
    await loginOnce(page);
  }
}

async function pricedQuote(page) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '500000');
  return quote;
}

async function currentDefaultAgencyValue(page) {
  const info = await getDefaultAgencySelectInfo(page);
  return info ? info.options[info.selectedIndex] : null;
}

test.setTimeout(900000);

test('Select Default Commission Category — Part 3: Update button save, confirmation message, persistence (AC06/AC07/AC08)', async ({ page }) => {
  try {
    await test.step('AC03/ADV-03 baseline: agency default should be Upfront before this test changes it', async () => {
      const quote = await pricedQuote(page);
      await openAdviserUse(quote);
      const before = await currentDefaultAgencyValue(quote);
      expect(before, 'AC03/ADV-03 baseline').toBe('Upfront');
    });

    let sawConfirmation = false;
    await test.step('AC06/AC07: change the agency default, click Update, expect confirmation', async () => {
      await setDefaultAgency(page, 'Level 30');
      await clickUpdate(page);

      // Poll briefly in case the confirmation is a transient toast, per the "verify
      // before writing up" rule — don't rely on a single snapshot even for this check.
      for (let i = 0; i < 8; i++) {
        if (await bodyContainsConfirmationMessage(page)) { sawConfirmation = true; break; }
        await page.waitForTimeout(500);
      }
    });
    expect(sawConfirmation, 'AC07: expected the confirmation message "Your default commission structure setting has been updated." to appear after clicking Update').toBe(true);

    await test.step('AC06/AC08: a brand-new quote in a brand-new login session should see the new default', async () => {
      await signOut(page);
      await login(page);
      const quote = await pricedQuote(page);
      await openAdviserUse(quote);
      const afterFreshLogin = await currentDefaultAgencyValue(quote);
      expect(afterFreshLogin, 'AC06/AC08: the updated agency default should be visible from a brand-new login session, not just the quote it was set in').toBe('Level 30');
    });

  } finally {
    // Revert to Upfront regardless of pass/fail, so this test doesn't leave the shared
    // agency default changed for the rest of the suite (Part 1's AC03 check assumes Upfront).
    await test.step('cleanup: revert Default for Agency to Upfront', async () => {
      try {
        const quote = await pricedQuote(page);
        await openAdviserUse(quote);
        const current = await currentDefaultAgencyValue(quote);
        if (current !== 'Upfront') {
          await setDefaultAgency(quote, 'Upfront');
          await clickUpdate(quote);
        }
      } catch (revertErr) {
        console.error('WARNING: revert-to-Upfront cleanup failed: ' + revertErr.message);
      }
      await signOut(page);
    });
  }
});

/**
 * LSC-32 + LSC-19 + LSC-20: Lump Sum Cover rules
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180000);

test('LSC rules: companion cover + Major Trauma caps', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

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
    if (page.url().includes('CentralPortalsLogin')) throw new Error('FAILED [Login]: Credentials rejected');

    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    var quoteUrl = await page.evaluate(function() { return new Promise(function(resolve) { window.open = function(url) { resolve(url); }; var link = Array.from(document.querySelectorAll('a')).find(function(a) { return a.innerText.trim() === 'New Quote'; }); if (link) link.click(); setTimeout(function() { resolve(null); }, 3000); }); });
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(function() { return false; }))) throw new Error('FAILED [Quote]: Form not rendered');

    // Personal details
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(function() { var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === 'Male'; }); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);

    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    // --- LSC-32: Specific Injury requires companion cover ---
    await page.evaluate(function() { var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'Specific Injury'; }); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    var siField = page.locator('input[id*="SumInsured"]').first();
    await siField.scrollIntoViewIfNeeded(); await siField.click(); await page.waitForTimeout(200);
    for (var j = 0; j < 12; j++) await page.keyboard.press('Backspace'); await page.waitForTimeout(200);
    var d1 = '5000'; for (var k = 0; k < d1.length; k++) { await page.keyboard.press(d1[k]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.waitForTimeout(3000);

    var errors1 = await page.evaluate(function() { var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')); return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); }); });
    if (!errors1.some(function(e) { return e.indexOf('Specific Injury Lump Sum requires') !== -1; }))
      throw new Error('FAILED [LSC-32]: Expected companion-cover error. Got: ' + errors1.join(' | ').substring(0, 200));

    // --- LSC-19: Major Trauma 300% cap ---
    // Remove Specific Injury
    await page.evaluate(function() { var links = Array.from(document.querySelectorAll('a')).filter(function(a) { return a.innerText.trim() === 'Remove'; }); links.forEach(function(l) { l.click(); }); });
    await page.waitForTimeout(3000);

    // Activate Trauma, enter $20,000
    await page.evaluate(function() { var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'Trauma'; }); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    var traumaSI = page.locator('input[id*="SumInsured"]').first();
    await traumaSI.scrollIntoViewIfNeeded(); await traumaSI.click(); await page.waitForTimeout(200);
    for (var m = 0; m < 12; m++) await page.keyboard.press('Backspace'); await page.waitForTimeout(200);
    var d2 = '20000'; for (var n = 0; n < d2.length; n++) { await page.keyboard.press(d2[n]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
    await page.waitForTimeout(2000);

    // Activate Major Trauma, enter $60,001
    await page.evaluate(function() { var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'Major Trauma'; }); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    var majorSI = page.locator('input[id*="SumInsured"]').nth(1);
    await majorSI.scrollIntoViewIfNeeded(); await majorSI.click(); await page.waitForTimeout(200);
    for (var p = 0; p < 12; p++) await page.keyboard.press('Backspace'); await page.waitForTimeout(200);
    var d3 = '60001'; for (var q = 0; q < d3.length; q++) { await page.keyboard.press(d3[q]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
    await page.waitForTimeout(2000);

    var errors2 = await page.evaluate(function() { var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')); return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); }); });
    if (!errors2.some(function(e) { return e.indexOf('maximum Sum Insured for Major Trauma Benefit') !== -1; }))
      throw new Error('FAILED [LSC-19]: Expected 300% cap error. Got: ' + errors2.join(' | ').substring(0, 200));

    // --- LSC-20: $2M global ceiling (no % cap at $25k+) ---
    await traumaSI.scrollIntoViewIfNeeded(); await traumaSI.click(); await page.waitForTimeout(200);
    for (var r = 0; r < 12; r++) await page.keyboard.press('Backspace'); await page.waitForTimeout(200);
    var d4 = '25000'; for (var s = 0; s < d4.length; s++) { await page.keyboard.press(d4[s]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
    await page.waitForTimeout(2000);

    await majorSI.scrollIntoViewIfNeeded(); await majorSI.click(); await page.waitForTimeout(200);
    for (var t = 0; t < 12; t++) await page.keyboard.press('Backspace'); await page.waitForTimeout(200);
    var d5 = '1975001'; for (var u = 0; u < d5.length; u++) { await page.keyboard.press(d5[u]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
    await page.waitForTimeout(2000);

    var errors3 = await page.evaluate(function() { var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')); return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); }); });
    var has300 = errors3.some(function(e) { return e.indexOf('maximum Sum Insured for Major Trauma Benefit based on') !== -1; });
    if (has300) throw new Error('FAILED [LSC-20]: Got 300% error at $25k TRC - should only have $2M cap');
    var has2M = errors3.some(function(e) { return e.indexOf('maximum total Sum Insured per life for Trauma Recovery Cover') !== -1; });
    if (!has2M) throw new Error('FAILED [LSC-20]: Expected $2M global cap error. Got: ' + errors3.join(' | ').substring(0, 200));

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
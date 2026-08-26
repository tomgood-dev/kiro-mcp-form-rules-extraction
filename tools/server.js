/**
 * Interactive Playwright browser server — DOM-first API.
 *
 * Keeps a headed browser open and accepts HTTP commands so an AI can
 * drive it step-by-step via structured DOM data (no screenshots).
 *
 * Start:  node server.js
 * Stop:   Ctrl-C
 *
 * POST http://localhost:3333  body: JSON command
 *
 * READ commands (return structured data):
 *   { action: "state" }            — url + buttons + fields + errors + modals (main call)
 *   { action: "url" }
 *   { action: "buttons" }
 *   { action: "fields" }
 *   { action: "errors" }
 *   { action: "find", kind: "select"|"button"|"input", fingerprint: {...} }
 *                                    — fingerprint-based element lookup, e.g.
 *                                    { optionsInclude: ["Upfront","Level 30"] },
 *                                    { firstOptionEquals: "Please Select", optionsMatch: "^IC-\\d+%, RC-\\d+%$" },
 *                                    { textIncludes: "Adviser Use" } (buttons),
 *                                    { nearestLabelIncludes: "Life Cover" }.
 *                                    Errors if 0 or >1 elements match - refine the
 *                                    fingerprint rather than picking blindly.
 *   { action: "eval", code: "..." } — run arbitrary JS in page, return result
 *
 * WRITE commands (perform interaction):
 *   { action: "click",  selector: "text=Apply" }
 *   { action: "click",  id: "abc123" }
 *   { action: "fill",   selector: "...", value: "John" }
 *   { action: "fill",   id: "...",       value: "John" }
 *   { action: "select", selector: "...", value: "option-value" }
 *   { action: "select", id: "...",       value: "option-value" }
 *   { action: "select", selector: "...", label: "Visible Option Text" } — match by label
 *                                    instead of an opaque value attribute
 *   { action: "check",  id: "..." }
 *   { action: "press",  key: "Tab" }
 *   { action: "scroll", direction: "bottom" | "top" }
 *   { action: "wait",   ms: 1000 }
 *   { action: "back" }
 *
 * CLI: node server.js <url> [--headless] [--storage-state <path>]
 *   --headless          run without a visible browser window and without slowMo - for
 *                        programmatic use (e.g. tools/verify-finding.js spawning this as
 *                        a child process), not for interactive human driving
 *   --storage-state F    load a Playwright storageState.json (cookies/session) instead of
 *                        starting logged out - reuse the same auth an app's Playwright
 *                        tests already produce (e.g. apps/<app>/.auth/state.json) rather
 *                        than re-expressing login credentials as generic click/fill steps
 * Env: PORT (default 3333) - set when running more than one instance at once (each
 *   independent verification reading needs its own browser session/port).
 */

const { chromium } = require('@playwright/test');
const http = require('http');

const PORT = Number(process.env.PORT) || 3333;

const cliArgs = process.argv.slice(2);
// URL to open — first non-flag CLI arg, or defaults to the DemoQA practice form
const START_URL = cliArgs.find((a) => !a.startsWith('--')) || 'https://demoqa.com/automation-practice-form';
const HEADLESS = cliArgs.includes('--headless') || process.env.HEADLESS === 'true';
const storageStateFlagIdx = cliArgs.indexOf('--storage-state');
const STORAGE_STATE = storageStateFlagIdx !== -1 ? cliArgs[storageStateFlagIdx + 1] : undefined;

let page;

// ── Browser setup ─────────────────────────────────────────────────────────────

async function setup() {
  const browser = await chromium.launch({ headless: HEADLESS, slowMo: HEADLESS ? 0 : 60 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, ...(STORAGE_STATE ? { storageState: STORAGE_STATE } : {}) });
  page = await context.newPage();
  page.setDefaultTimeout(30000);

  console.log(`[setup] Opening ${START_URL}`);
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  console.log('[setup] Ready. Server listening on http://localhost:' + PORT);
}

// ── DOM readers (run in browser) ──────────────────────────────────────────────

const READ_BUTTONS = () => {
  const seen = new Set();
  return [...document.querySelectorAll('button, a, [role="button"]')]
    .map(el => {
      const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || '')
        .trim().replace(/\s+/g, ' ');
      const rect = el.getBoundingClientRect();
      return {
        text: text.substring(0, 80),
        id: el.id || null,
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaDisabled: el.getAttribute('aria-disabled'),
        disabled: el.disabled || false,
        inFooter: !!el.closest('footer, [class*="footer"]'),
        visible: rect.width > 0 || rect.height > 0,
        tag: el.tagName.toLowerCase(),
      };
    })
    .filter(b => {
      if (!b.text || b.text.length < 1) return false;
      const key = b.id || b.text;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const READ_FIELDS = () =>
  [...document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="radio"]):not([type="checkbox"]), select, textarea'
  )].map(el => {
    const byFor = el.id && document.querySelector(`label[for="${el.id}"]`);
    let label = byFor?.innerText?.trim()
      || el.getAttribute('aria-label')
      || el.placeholder
      || el.name
      || '(unlabelled)';

    // Walk up to find a label/legend if not found directly
    if (label === '(unlabelled)') {
      let p = el.parentElement;
      for (let i = 0; i < 6; i++) {
        if (!p) break;
        const found = p.querySelector('label, legend, [class*="label"]');
        if (found && found !== el && !found.contains(el)) {
          label = found.innerText?.trim() || label;
          break;
        }
        p = p.parentElement;
      }
    }

    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || el.tagName.toLowerCase(),
      id: el.id || null,
      name: el.name || null,
      label: label.replace(/\s+/g, ' ').substring(0, 80),
      value: el.value || null,
      required: el.required,
      disabled: el.disabled,
      visible: rect.width > 0 || rect.height > 0,
      options: el.tagName === 'SELECT'
        ? [...el.options].map(o => ({ value: o.value, text: o.text.trim() }))
        : null,
      selectedIndex: el.tagName === 'SELECT' ? el.selectedIndex : null,
    };
  });

const READ_ERRORS = () => {
  const seen = new Set();
  return [...document.querySelectorAll(
    '[class*="error"], [class*="invalid"], [class*="feedback"], [class*="validation"], [class*="message"], [class*="alert"], [role="alert"]'
  )].flatMap(el => {
    const text = el.innerText?.trim() || '';
    if (!text || text.length > 400 || seen.has(text)) return [];
    seen.add(text);
    return [text];
  }).filter(t =>
    /required|invalid|between|least|maximum|minimum|cannot|must|please|select|error|exceed|format/i.test(t)
  );
};

const READ_MODALS = () => {
  const sel = '[role="dialog"],[role="alertdialog"],[class*="modal"],[class*="popup"],[class*="overlay"]';
  return [...document.querySelectorAll(sel)]
    .map(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return null;
      const s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return null;
      return {
        role: el.getAttribute('role'),
        text: el.innerText?.trim().substring(0, 200),
        buttons: [...el.querySelectorAll('button, a, [role="button"]')]
          .map(b => ({ text: (b.innerText || b.textContent || '').trim().substring(0, 40), id: b.id || null }))
          .filter(b => b.text),
      };
    })
    .filter(Boolean);
};

// ── Command handler ───────────────────────────────────────────────────────────

async function waitForLoad() {
  await page.locator('text=Loading').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

function buildLocator(cmd) {
  if (cmd.id)       return page.locator(`[id="${cmd.id}"]`).first();
  if (cmd.selector) return page.locator(cmd.selector).first();
  throw new Error('Command needs either id or selector');
}

async function handle(cmd) {
  switch (cmd.action) {

    case 'state': {
      // Scroll to ensure all sections are accessible before reading
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      const [buttons, fields, errors, modals] = await Promise.all([
        page.evaluate(READ_BUTTONS),
        page.evaluate(READ_FIELDS),
        page.evaluate(READ_ERRORS),
        page.evaluate(READ_MODALS),
      ]);
      return {
        ok: true,
        url: page.url(),
        buttons,
        fields,
        errors,
        modals,
      };
    }

    case 'url':
      return { ok: true, url: page.url() };

    case 'buttons':
      return { ok: true, buttons: await page.evaluate(READ_BUTTONS) };

    case 'fields':
      return { ok: true, fields: await page.evaluate(READ_FIELDS) };

    case 'errors':
      return { ok: true, errors: await page.evaluate(READ_ERRORS) };

    case 'find': {
      // Generalizes the "find the <select>/button whose shape matches X" fingerprint
      // pattern every app-specific helper in this repo has reimplemented ad hoc (e.g.
      // apps/asteron-quote-apply/helpers/adviser-use-helpers.js's getIcRcSelectInfo,
      // getDefaultAgencySelectInfo, getLifeCoverCategoryInfo) - this is the same three
      // patterns, made app-agnostic and reusable via tools/verify-finding.js.
      const kind = cmd.kind;
      const fp = cmd.fingerprint || {};
      let candidates;

      if (kind === 'button') {
        candidates = await page.evaluate(READ_BUTTONS);
        if (fp.textIncludes) candidates = candidates.filter((b) => b.text.includes(fp.textIncludes));
      } else {
        candidates = await page.evaluate(READ_FIELDS);
        if (kind) candidates = candidates.filter((f) => f.tag === kind || f.type === kind);
        if (fp.optionsInclude) {
          candidates = candidates.filter(
            (f) => f.options && fp.optionsInclude.every((want) => f.options.some((o) => o.text === want))
          );
        }
        if (fp.firstOptionEquals) {
          candidates = candidates.filter((f) => f.options && f.options[0] && f.options[0].text === fp.firstOptionEquals);
        }
        if (fp.optionsMatch) {
          const re = new RegExp(fp.optionsMatch);
          candidates = candidates.filter((f) => {
            if (!f.options || !f.options.length) return false;
            const rest = fp.firstOptionEquals ? f.options.slice(1) : f.options;
            return rest.length > 0 && rest.every((o) => re.test(o.text));
          });
        }
        if (fp.nearestLabelIncludes) {
          const ids = candidates.filter((f) => f.id).map((f) => f.id);
          const matchedIds = await page.evaluate(
            ({ ids, labelSubstr }) => {
              function nearestLabelText(el) {
                let node = el;
                for (let depth = 0; depth < 4 && node; depth++) {
                  let sib = node.previousElementSibling;
                  while (sib) {
                    const t = (sib.innerText || '').trim();
                    if (t) return t.split('\n')[0].slice(0, 60);
                    sib = sib.previousElementSibling;
                  }
                  node = node.parentElement;
                }
                return null;
              }
              return ids.filter((id) => {
                const el = document.getElementById(id);
                if (!el) return false;
                return (nearestLabelText(el) || '').includes(labelSubstr);
              });
            },
            { ids, labelSubstr: fp.nearestLabelIncludes }
          );
          candidates = candidates.filter((f) => matchedIds.includes(f.id));
        }
      }

      if (!candidates.length) return { ok: false, error: 'find: no element matched the fingerprint', matchCount: 0 };
      if (candidates.length > 1) {
        return { ok: false, error: 'find: fingerprint matched more than one element - refine it', matchCount: candidates.length, matches: candidates };
      }
      return { ok: true, match: candidates[0] };
    }

    case 'click': {
      const loc = buildLocator(cmd);
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await loc.click({ force: true });
      await waitForLoad();
      const [buttons, fields, errors, modals] = await Promise.all([
        page.evaluate(READ_BUTTONS),
        page.evaluate(READ_FIELDS),
        page.evaluate(READ_ERRORS),
        page.evaluate(READ_MODALS),
      ]);
      return { ok: true, url: page.url(), buttons, fields, errors, modals };
    }

    case 'fill': {
      const loc = buildLocator(cmd);
      await loc.fill(String(cmd.value));
      await page.waitForTimeout(300);
      const errors = await page.evaluate(READ_ERRORS);
      return { ok: true, errors };
    }

    case 'select': {
      // cmd.label matches by visible option text (portable - doesn't require knowing an
      // opaque option value attribute); cmd.value matches by the option's value attribute.
      const sel = cmd.id ? `[id="${cmd.id}"]` : cmd.selector;
      await page.selectOption(sel, cmd.label !== undefined ? { label: String(cmd.label) } : String(cmd.value));
      await page.waitForTimeout(400);
      const [fields, errors] = await Promise.all([
        page.evaluate(READ_FIELDS),
        page.evaluate(READ_ERRORS),
      ]);
      return { ok: true, fields, errors };
    }

    case 'check': {
      const loc = page.locator(`[id="${cmd.id}"]`).first();
      await loc.check();
      await page.waitForTimeout(300);
      return { ok: true, errors: await page.evaluate(READ_ERRORS) };
    }

    case 'press': {
      await page.keyboard.press(cmd.key || 'Tab');
      await page.waitForTimeout(300);
      return { ok: true };
    }

    case 'type': {
      if (cmd.id || cmd.selector) {
        const loc = buildLocator(cmd);
        await loc.scrollIntoViewIfNeeded().catch(() => {});
        await loc.click();
        await page.waitForTimeout(100);
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Delete');
        await page.waitForTimeout(100);
      }
      await page.keyboard.type(String(cmd.value), { delay: 40 });
      await page.waitForTimeout(300);
      if (cmd.blur !== false) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(400);
      }
      const errors = await page.evaluate(READ_ERRORS);
      return { ok: true, errors };
    }

    case 'scroll': {
      if (cmd.direction === 'bottom') {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          document.querySelectorAll('*').forEach(el => {
            const s = window.getComputedStyle(el);
            if (s.overflowY === 'auto' || s.overflowY === 'scroll') el.scrollTop = el.scrollHeight;
          });
        });
      } else {
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      await page.waitForTimeout(300);
      return { ok: true };
    }

    case 'wait': {
      await page.waitForTimeout(cmd.ms || 1000);
      return { ok: true };
    }

    case 'mouse-click': {
      await page.mouse.click(cmd.x, cmd.y);
      await waitForLoad();
      const [buttons, fields, errors, modals] = await Promise.all([
        page.evaluate(READ_BUTTONS),
        page.evaluate(READ_FIELDS),
        page.evaluate(READ_ERRORS),
        page.evaluate(READ_MODALS),
      ]);
      return { ok: true, url: page.url(), buttons, fields, errors, modals };
    }

    case 'goto': {
      await page.goto(cmd.url, { waitUntil: 'domcontentloaded' });
      await waitForLoad();
      return { ok: true, url: page.url() };
    }

    case 'back': {
      await page.goBack();
      await waitForLoad();
      return { ok: true, url: page.url() };
    }

    case 'calcmask': {
      // Reliable entry for masked numeric fields (Sum Insured, Monthly Benefit, Annual
      // Income). Select-all + one Backspace clears in one action (12x individual
      // Backspace presses can leave a mask's separator characters behind on some masks -
      // confirmed live against Asteron's Sum Insured field, which mangled to ".5.0.0..."
      // under the old backspace-loop approach); then verifies the digits actually landed
      // instead of trusting a blind Tab - the same self-verifying-interaction discipline
      // documented in .kiro/steering/test-expansion-process.md, now enforced here too.
      // Usage: { action: "calcmask", id: "field-id", value: "250000" }
      const loc = buildLocator(cmd);
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await loc.click();
      await page.waitForTimeout(150);
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      const digits = String(cmd.value).replace(/[^0-9]/g, '');
      await page.keyboard.type(digits, { delay: 20 });
      await page.keyboard.press('Tab');
      await waitForLoad();

      const deadline = Date.now() + 5000;
      let landed = false;
      while (Date.now() < deadline) {
        const current = await loc.inputValue().catch(() => '');
        if (current.replace(/[^0-9]/g, '') === digits) {
          landed = true;
          break;
        }
        await page.waitForTimeout(100);
      }
      const errors = await page.evaluate(READ_ERRORS);
      return { ok: landed, errors, ...(landed ? {} : { error: 'calcmask: typed digits did not land in the field - check the selector matched the right element' }) };
    }

    case 'eval': {
      const result = await page.evaluate(new Function(cmd.code));
      return { ok: true, result };
    }

    default:
      return { ok: false, error: `Unknown action: ${cmd.action}` };
  }
}

// ── HTTP server ───────────────────────────────────────────────────────────────

async function main() {
  await setup();

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST') { res.writeHead(405); res.end('POST only'); return; }
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const cmd = JSON.parse(body);
        const label = [cmd.action, cmd.selector || (cmd.id ? `#${cmd.id}` : ''), cmd.value !== undefined ? `= "${cmd.value}"` : ''].filter(Boolean).join(' ');
        console.log(`→ ${label}`);
        const result = await handle(cmd);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        console.error('Error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
  });

  server.listen(PORT);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

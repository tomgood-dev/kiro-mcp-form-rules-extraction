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
 *   { action: "eval", code: "..." } — run arbitrary JS in page, return result
 *
 * WRITE commands (perform interaction):
 *   { action: "click",  selector: "text=Apply" }
 *   { action: "click",  id: "abc123" }
 *   { action: "fill",   selector: "...", value: "John" }
 *   { action: "fill",   id: "...",       value: "John" }
 *   { action: "select", selector: "...", value: "option-value" }
 *   { action: "select", id: "...",       value: "option-value" }
 *   { action: "check",  id: "..." }
 *   { action: "press",  key: "Tab" }
 *   { action: "scroll", direction: "bottom" | "top" }
 *   { action: "wait",   ms: 1000 }
 *   { action: "back" }
 */

const { chromium } = require('@playwright/test');
const http = require('http');

const PORT = 3333;

// URL to open — pass as first CLI arg, or defaults to the DemoQA practice form
const START_URL = process.argv[2] || 'https://demoqa.com/automation-practice-form';

let page;

// ── Browser setup ─────────────────────────────────────────────────────────────

async function setup() {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext();
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
      const sel = cmd.id ? `[id="${cmd.id}"]` : cmd.selector;
      await page.selectOption(sel, String(cmd.value));
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
      // Reliable entry for right-to-left calc-mask fields (Sum Insured, Monthly Benefit)
      // Usage: { action: "calcmask", id: "field-id", value: "250000" }
      const loc = buildLocator(cmd);
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await loc.click();
      await page.waitForTimeout(200);
      // Clear the field with backspaces
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(200);
      // Type each digit individually
      const digits = String(cmd.value).replace(/[^0-9]/g, '');
      for (const d of digits) {
        await page.keyboard.press(d);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(200);
      // Tab out to trigger blur/commit
      await page.keyboard.press('Tab');
      await waitForLoad();
      const errors = await page.evaluate(READ_ERRORS);
      return { ok: true, errors };
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

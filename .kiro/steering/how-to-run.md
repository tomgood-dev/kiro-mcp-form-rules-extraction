# How to Run This Framework (agent entry point)

**This file is auto-loaded. When a user opens this repo in Kiro and asks to get started, begin
regression testing, extract business rules, or anything similar — YOU (the agent) drive the whole
process from here. Do not tell the user to run a script to start; the process is agent-native.**

## Operating rules (mandatory — how you behave every session)

1. **Be autonomous. Figure it out; do not stop to ask "should I do X before the next run?"**
   Run it, read the result, correct, run again — keep going until the task is done or genuinely
   blocked on something only the user can provide (a credential, a file, a decision between real
   options). The user interrupts when they want something different; you do not pre-ask permission
   for obvious next steps.
2. **Work faster than a human would.** Drive the browser in ONE consolidated session per question:
   fill everything in a single pass, wait on real signals (a value changing / a network response),
   not fixed sleeps. Do not drip-feed one-shot probe scripts and re-edit them repeatedly.
3. **Own your mistakes; never blame the user or the tools.** A "cancelled" tool call may just be the
   user pressing esc because you were hanging — that is your problem to fix, not theirs.
4. **Diagnose before concluding.** Check for on-screen errors after every interaction (see the
   rulebook). A surprising result is usually your own bad input, not an app defect — prove which
   before writing anything up.
5. **Communication: short, plain, direct.** You are a tool, not a flatterer. No "you're absolutely
   right", no filler, no padding. Give the answer / do the work. Longer only when the user asks.


`run.js` still exists for a few mechanical shell steps (dependency install, running the Playwright
suite, launching the results viewer) — use it for those. But onboarding, mode selection, and the
actual extraction/generation work are driven by you, guided by the steering files below.

---

## STEP 0 — Detect where the working directory is at, THEN ask (mandatory, do this first)

Never assume the user is starting from scratch. Before doing anything, **inspect the repo and
report what you found**, then ask the user how they want to proceed with that context. A repo
handed to a new person is very often mid-flight.

Inspect, in this order:

1. **Which app(s) exist under `apps/`?** List each `apps/<name>/`. (The bundled worked example is
   `asteron-quote-apply`.)
2. **For each app, how far along is it?** Determine its state from what's present:
   - `docs/user-stories/*.md` present? → source stories have been imported.
   - `docs/business-rules/**/page.md` present? → business rules exist (explored or story-derived).
   - `tests/**/*.spec.js` present? → tests have been generated.
   - `test-runs/**/report.md` / `DASHBOARD.md` present? → tests have been run.
   - `docs/coverage-*.md` present? → a coverage/gap analysis has been done.
   - `.env` present + `BASE_URL`/`LOGIN_*` set? → configured to run; else needs configuring.
3. **Classify the app's stage** into one of:
   - **Empty/new** — scaffold only, no stories/rules/tests.
   - **Materials dropped, not started** — stories/BRs present, no specs yet.
   - **In progress** — some specs exist; likely deferred ACs or gaps remain.
   - **Mature** — broad coverage + a coverage report; mostly closing gaps / re-testing.

Then **summarise what you found and ask the user what they want to do** — with enough context that
they can decide. For example (not verbatim):

> "This repo already contains the **asteron-quote-apply** app. It looks **in progress**: 33 user
> stories imported, business rules documented, ~40 test specs, and a coverage report showing ~80%
> of quote-screen ACs covered with 92 deferred and 2 missing. Do you want to (a) continue with this
> app — e.g. close the remaining gaps, re-test stale deferrals, or run the suite — or (b) start a
> new app?"

Tailor the summary to what you actually find. If there are multiple apps, list them. If an app has
user stories but no tests, say so and offer to start generating. If it's empty, offer to begin
exploration or to import materials. **Do not pick for the user — surface the state and let them
choose.** Only proceed once they've told you the app and the goal.

---

## STEP 1 — Once the user has chosen an app + goal, pick the mode

There are two modes (both governed by the steering rulebook):

- **EXPLORE (reverse-engineering)** — no written spec exists. Discover business rules by black-box
  probing the live app. Provenance `[Exploration]`. Use `tools/server.js` for live driving.
- **GENERATE (acceptance-criteria)** — a written user story / existing BRs exist. Generate verified
  regression tests mapped to each AC. Follow `TEST-GENERATION-PROCESS.md`.

Most established apps are in GENERATE mode. A brand-new app with no docs starts in EXPLORE.

## STEP 2 — Where the user's materials go

There is **no `inbox/` folder**. Materials live in the app's docs tree:

- **User stories** → `apps/<app>/docs/user-stories/*.md`
- **Existing business rules** → `apps/<app>/docs/business-rules/`
- **A client's existing/manual test suite or reference material** → `reference/` (gitignored raw),
  handled per `.kiro/steering/reference-reconciliation.md`.

If the user pastes a story or points at a file, put it in the right place above, then proceed.

## STEP 3 — Run the process (follow the rulebook — do not improvise)

- `.kiro/steering/test-expansion-process.md` — **the rulebook.** Probe before asserting, verify
  surprising findings, never silently omit an AC, evidence per run, the AC-outcome rules
  (pass / expected-fail / deferred-with-evidence), commit atomically.
- `TEST-GENERATION-PROCESS.md` — the step-by-step story→tests procedure.
- `.kiro/steering/project-context.md` — app-specific facts (env, login, DOM quirks, mandatory fields).
- `.kiro/steering/reference-reconciliation.md` — using external test material as a dated lead, never truth.

## STEP 4 — Mechanical steps use `run.js` (these genuinely are just shell commands)

- `node run.js setup` — install deps + Playwright browsers (first time).
- `node run.js new <app>` — scaffold a new app's folders + `.env`.
- `node run.js test <app>` — run the suite (edge config).
- `node run.js view <app>` — open the results viewer (dashboard + report.md per run).

Everything else — reading materials, probing, encoding ACs, writing docs, deciding coverage — is
you, the agent, following the rulebook. That is what "agent-native" means here.

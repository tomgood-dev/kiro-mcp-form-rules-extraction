# Meeting Run-Sheet — Update + Discussion

**For:** me (presenter). Audience: PM + testers. ~15 min.
**Framing:** this is an **update / show-and-tell**, not a sell. Walk them through what's been
done so far, then open a discussion with the testers about how they work.

> **Legend:**
> 🗣️ = say this (paraphrase, don't read)
> 🖥️ = show this (open in the docs viewer, point at the thing)
> 💬 = likely question / my answer

---

## Before the meeting — setup

- [ ] Start the docs viewer: double-click **`start-docs-viewer.cmd`** in the repo root, leave the
      window open, then open **http://localhost:4400** in the browser. (Images/screenshots now
      render inline — restart the viewer window if it was open before this fix.)
- [ ] Have these pages ready to navigate to from the sidebar:
  - **Rulebook hub (the map):** `business-rules/page.md`
  - **Disability Covers page** (rule `DC-15`)
  - **An auto-generated run report:** `test-runs/select-default-commission-category-v1/2026-08-27T10-47-56/report.md`
  - **The test documentation (AC traceability):** `test-documentation/select-default-commission-category-v1.md`
  - **A bug report:** `bug-reports/occupation-cover-gating-universally-not-enforced.md`
  - **The big picture:** `docs/exhaustive-analysis.md`

---

## 1. The rulebook — the map so far (~3 min)

🖥️ **Show the business-rules hub page** (`business-rules/page.md`). Point at the index of areas
(Personal Details, Lump Sum Covers, Disability Covers, Premium & Bundling, etc.) and the
**stable rule IDs** (`LSC-`, `DC-`, `PREM-`…).

🗣️ "Where I've got to is a documented map of how the Quote & Apply form behaves, broken down by
area. Every rule has a stable ID — so we can refer to `LSC-07` in a ticket rather than
re-describing it each time. It gives us a common reference for the form's logic."

🖥️ **Drill into the Disability Covers page**, scroll to **`DC-15`**. Point at:
- the **formula + $7,500 cap**,
- the **income values** it was confirmed at ($150k → $5,625; $200k → $7,500),
- the **verbatim error text** the app produces,
- the **dated correction** noting what changed and when.

🗣️ "Each rule is backed by what the app actually did when tested — the specific values, the exact
error text. If our understanding of a rule changes, the entry records what it was and what it is
now, with a date."

💬 *"How many rules is this?"* → "Hundreds mapped across the Quote screen." 🖥️ *(flash
`exhaustive-analysis.md` to show the scale.)*

---

## 2. It's documented and tested (~4 min)

🖥️ **Show the auto-generated run report**
(`test-runs/select-default-commission-category-v1/2026-08-27T10-47-56/report.md`). Point at:
- the **results table** at the top — pass/fail at a glance,
- a **failure detail** section — the full verbatim AC text from the user story, steps to
  reproduce, expected vs actual, and a screenshot — all generated automatically from one test run.

🗣️ "Every time the tests run, this report generates itself. The full acceptance criterion is
quoted directly from the user story so a reader doesn't need to go anywhere else. If it fails,
you get the requirement, the steps, what happened, and a screenshot — all in one file."

🖥️ **Show the test documentation with AC traceability**
(`test-documentation/select-default-commission-category-v1.md`). Point at the AC column
and the Deferred table.

🗣️ "For the commission-category feature we took the Jira story ACB-13175 and generated test
scripts mapped to its acceptance criteria — each AC becomes a check tagged with its ID. Where
an AC can't be tested yet, it's listed as deferred with the reason, not silently skipped. So
the suite tracks directly against the story."

🗣️ "There are also tested rule matrices for the five core areas we reverse-engineered — age
boundaries, lump sum caps, disability formulas, premium bundling, and policy/kids-cover rules."

💬 *"How long to run?"* → "About 8 minutes for all 8 checks in this file — they run in parallel
against the live app."

---

## 3. Issues the tests have surfaced (~4 min)

🗣️ "The tests have already turned up some real issues in the app. Here's one."

🖥️ **Show the bug report** (`occupation-cover-gating-universally-not-enforced.md`). Point at:
- the **header** — severity, component, environment — written so it could be filed as a ticket,
- the **summary** — an occupation-based eligibility control (`LSC-02`/`LSC-03`) that isn't firing
  for *any* occupation code,
- the **exact reproduction steps** — followable without reading any test code,
- that it was **confirmed across two independent sessions six days apart**.

🗣️ "There's a second one written up too — an Apply step that doesn't complete under a specific
employment-status condition. Both came out of the acceptance-criteria testing against the
commission-category story and the cover rules."

🗣️ *(Testers, briefly:)* "One thing I'm careful about — a surprising result has to reproduce on
two independent clean runs before I write it up. A couple of early 'findings' turned out to be
caused by my own test scripts, and I caught and dropped those rather than raise a false alarm. So
when something like this gets written up, it's been checked."

---

## 4. Over to the testers — how do you work? (~4 min, discussion)

🗣️ "That's the update from my side. What I'd really like is to understand how you all test today,
so this fits in rather than sits beside it." Ask, and take notes:

- **Methods & tools** — "What does your testing process look like now? Manual, automated, a mix?
  What tooling are you using?"
- **Standards** — "Are there test standards or conventions I should be lining up with — naming,
  how test cases are documented, how bugs get raised and tracked?"
- **Coverage expectations** — "What level of coverage do you normally expect for a feature — happy
  path, boundaries, negative cases? Is there a definition of 'done' for testing?"
- **Where this is useful to you** — "Would a tested rule-map like this actually help your work,
  and where? What would make it more useful — format, location, level of detail?"
- **Bug reports** — "Does the format of that bug report work for you, or should it match a
  template you already use?"
- **Fit** — "Where would this sit relative to what you already do — does it replace anything,
  complement it, feed into it?"
- **AC wording & test interpretation** — "One thing I've noticed is that how an AC is worded
  directly affects how the test gets generated. For example, AC08 says 'when the user exits and
  later reopens the Adviser Use function' — that wording led to generating a test that signs out
  and signs back in with a completely fresh session, when maybe the intended behaviour is just
  navigating away and coming back. Are there conventions around how ACs should be worded to avoid
  ambiguity? Would it help to flag these back to the story author when they come up?"
- **Session conflict / environment constraints** — "The dev environment only allows one active
  session per account. When a test does a sign-out/sign-in flow (like AC06/07/08 requires), it
  can leave a stale server-side session that blocks the *next* test from authenticating. This
  makes tests that exercise logout flows fragile and can cascade failures into subsequent tests.
  Is this a known constraint you work around already? Is there a way to get a dedicated test
  account that doesn't have this single-session limit, or should we design tests to avoid
  logout/re-login flows entirely?"

🗣️ *(Note for me: this half is listening, not presenting. Let the testers talk — capture actions.)*

---

## 5. Only if asked

💬 *"Can we run it in our own CI?"* → "Today it runs from an approved internal workspace — the
test environment is IP-whitelisted and the client's runner isn't allowed through yet. Access
decision, not a limitation of the approach."

💬 *"Is the coverage complete?"* → "Quote screen is covered thoroughly. The Application flow after
it has had one light pass — that's next, not claimed as done."

💬 *"How is this built?"* → *(only now go into method)* "A real browser is driven against the live
app to read back its actual behavior — it's an OutSystems app so we can't read the compiled
source. Each rule found becomes a test. There's a full write-up in `METHOD.md` if useful." 🖥️
*(open METHOD.md only if they want it.)*

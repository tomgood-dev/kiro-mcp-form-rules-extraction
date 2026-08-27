# Roadmap — AI-Assisted Business Rule Extraction & Test Generation

**Purpose:** Track the pipeline of work for this engagement and show where it's heading.
**Audience:** Delivery (me + testers) and stakeholders (testing chapter + executive team).
**Status key:** ✅ Done · 🔄 In progress · ⏳ Planned · 🔍 Needs a decision

---

## Where this fits (the one-paragraph version)

This engagement builds a **tested, self-checking map of how a live application behaves** —
starting with the Asteron Quote & Apply form — and uses it to generate automated tests that
verify the app against its business rules and written user stories. It is an **interim,
experimental capability** that complements (not duplicates) the enterprise AI-led quality
engineering programme: it focuses on system/behavioural coverage and a reusable method, and is
designed to hand off cleanly to the enterprise agent workflow as that spins up.

---

## Phase 1 — Complete AC coverage on the current user story  🔄

**Goal:** Take the "Select Default Commission Category" story (ACB-13175) to a full set of tests
covering every acceptance criterion, so it stands as a complete worked example.

**Why it matters:** This is the reference implementation everything else learns from — a
fully-covered story proves the method end to end and gives the automation in Phase 2 a known-good
target to reproduce.

**Current state:** 12 of 27 ACs tested (3 passing, 5 confirmed-failing regressions, rest matching).
15 ACs deferred, in three tiers:

| Tier | ACs | What's needed | Status |
|---|---|---|---|
| Testable now | AC09, AC12, AC13, AC16 | More scenarios on existing infrastructure | ⏳ Planned |
| Needs saved quotes | AC17, AC18, AC19, AC22, AC23, AC24, AC25 | Decision on saving real data in shared dev env | 🔍 Needs a decision |
| Needs pre-existing data / backend | AC20, AC21, AC26, AC27 | Historic quotes or LIFE400/STP payload inspection | 🔍 Likely not black-box testable |

**Done when:** every AC is either an encoded test (passing or expected-to-fail) or explicitly
deferred with a documented reason — no silent gaps.

---

## Phase 2 — Generate tests straight from a user story  ⏳

**Goal:** Get the app to a point where it can produce a working, self-verifying test suite from a
user story with little to no human intervention.

**Why it matters:** This is the capability leap. Today the flow is manual — a human reads the
story, probes the app, and writes the spec. Automating it is what turns this from "a worked
example" into "a reusable engine," and it maps directly to the enterprise vision's
test-case-creation agent.

**What the agent needs to do, from a story alone:**
1. Parse ACs into discrete, testable assertions.
2. Probe the live app to discover the real DOM/selectors for each (the exploration server already
   enables this).
3. Generate the spec file using the standard structure (parallel independent tests + serial
   state-mutating tests) with verbatim AC annotations.
4. Self-verify — run it, and apply the "disprove before reporting" discipline so findings are real.

**Key sub-item — AC wording feedback loop  🔍**
Ambiguous AC language leads the agent to over-literal interpretations (e.g. AC08's "exits and
reopens" produced a full sign-out/sign-in flow that may not be the intended behaviour). The engine
should **flag ambiguous or risky ACs back to the story author** rather than silently guessing.

**Prerequisites / open questions:**
- Reliable selector discovery without a human in the loop.
- A rule for when an AC is genuinely untestable vs. just hard (so deferrals are honest).
- The AC-wording feedback loop above.

**Done when:** pointing the engine at a new user story produces a runnable, annotated, self-verified
spec file and report with minimal manual correction.

---

## Phase 3 — Delta-only test building when requirements change  ⏳

**Goal:** When a user story or its ACs change, update only the affected tests — build the delta,
not the whole suite again.

**Why it matters:** This is the maturity layer, and it directly answers the question raised in the
27 Aug stakeholder session — the commission-defaults story was changing daily, and testers asked
how the approach copes. It mirrors the enterprise programme's planned "delta agent" (identify what
changed, sync it, produce only the new tests + the regression around them).

**The workflow:**
1. Detect what changed between story versions (diff the AC text).
2. Classify each change: AC **added** / **modified** / **removed** / **unchanged**.
3. Touch only affected tests — add new `test()` blocks, update changed annotations + assertions,
   remove or skip deleted ACs.
4. Leave unchanged tests alone; bump the version; record the delta.

**Prerequisites / open questions:**
- The user story must be **version-controlled or diffable** — either versioned copies in
  `docs/user-stories/`, or a Jira/MCP integration that exposes change history.
- A clear record of "what changed and when" so a reviewer can trust the suite kept up.

**Done when:** a changed story results in a minimal, correct test update (only the delta) with a
recorded change trail — no full regeneration.

---

## Dependencies & decisions needed

| Item | Blocks | Owner / next step |
|---|---|---|
| Approval to save real quotes in the shared dev env | Phase 1 (saved-quote ACs) | Confirm with BA/PM |
| Backend / LIFE400 / STP payload access | Phase 1 (AC26/AC27) | Likely out of black-box scope — flag to dev team |
| User-story version history (Jira/MCP or versioned files) | Phase 3 | Decide source of truth for story versions |
| How this stream fits vs. the enterprise agent programme | All phases | Catch-up with Lewis when back (~29 Aug) |

---

## Sequencing

Phase 1 → 2 → 3 build on each other: a complete worked example (1) is the target the generation
engine (2) reproduces, and once generation works, generating *only the delta* (3) is the efficient
evolution. Phase 1's deferred-but-testable items can proceed in parallel with early Phase 2 work.

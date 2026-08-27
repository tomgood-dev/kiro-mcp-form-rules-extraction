# Process — Handling a Changing User Story (Delta Update)

**Purpose:** A repeatable, source-agnostic process for updating a test suite when a user story
or its acceptance criteria change — building only the delta, not regenerating everything.

**Status:** Design + process definition. Being validated against a real change (ACB-13175
"Select Default Commission Category", v1 → v2).

**Why this exists:** Requirements change — often daily during active development (raised directly
by testers in the 2026-08-27 stakeholder session). Re-testing the whole story on every change is
wasteful and error-prone. This process identifies what actually changed and touches only the
affected tests, with a recorded trail so a reviewer can trust the suite kept up. It mirrors the
enterprise programme's planned "delta agent".

---

## Core design principle: normalize, then diff on intent

We do **not** diff the raw story documents. Raw diffs are brittle — the next story may be
structured completely differently (numbered ACs, Gherkin, prose tables, a Jira export), and even
the *same* story can be reworded, renumbered, split, or merged between versions. A line-by-line
text diff turns a renumbering into false "removed + added" noise.

Instead, two layers:

```
Source story (ANY shape, any/no IDs)
        │  ── Layer 1: EXTRACT → canonical ACs (intent-structured)
        ▼
Canonical ACs (v_old)          Canonical ACs (v_new)
        │                              │
        └──── Layer 2: MATCH by INTENT (source IDs are a hint, never the key) ──┐
                                                                                ▼
                     Delta: added / removed / modified / unchanged
                            (each mapped to OUR OWN stable internal AC id)
                                                                                │
                     ── Layer 3: MAP to affected test() blocks ─────────────────┘
                                                                                │
                     ── Layer 4: APPLY delta, bump version, record ─────────────┘
```

### Key decisions (and why)

1. **Anchor on intent, not source AC IDs.** We can't control how stories are written, so source
   IDs may be absent, inconsistent, or renumbered between versions. IDs are used as a *hint* to
   confirm a match, never as the identity key.

2. **We assign our own stable internal AC identifiers.** Our test suite references *our* IDs,
   decoupled from the source's numbering. The extraction layer maintains a mapping from our ID ↔
   whatever the source called it this version. So if the source renumbers, our tests don't churn.

3. **The fuzzy step is isolated and human/agent-reviewed.** Layer 2 (matching an old requirement
   to a new one by intent) is the only judgment-heavy step — it's where an LLM genuinely helps, and
   it must be reviewable. Everything downstream (classification, test-mapping, applying) is
   mechanical once the matches are confirmed.

4. **Future-proof by source.** If stories later come from Jira via MCP instead of a markdown file,
   only **Layer 1 (extraction)** changes. The canonical form, the diff, and the test-mapping are
   untouched.

---

## The canonical AC record

Whatever the source shape, each acceptance criterion is extracted into this normalized structure:

```
{
  internalId,     // OUR stable id, e.g. "COMM-AC-004" — assigned once, persists across versions
  sourceId,       // what the source called it this version, e.g. "AC04" (may be null / may change)
  title,          // short intent label, e.g. "Update button disabled by default"
  given,          // condition
  when,           // trigger
  then,           // expected outcome (may include multiple And clauses)
  rawText,        // verbatim source text, for the audit trail and test annotations
  sourceRef       // where in the source it came from (table row, scenario name, etc.)
}
```

Worked examples / scenario tables that expand on an AC are captured as additional canonical
records too (they are testable requirements), cross-referenced to the AC they elaborate.

---

## The process (step by step)

### Step 0 — Preserve the baseline
Before the story is updated, save the current version as a versioned file
(`docs/user-stories/<slug>-vN.md`). This is the "before". (Our existing test annotations are also
a semi-structured record of the old ACs and can seed the v_old extraction.)

### Step 1 — Extract both versions to canonical form (Layer 1)
Produce the canonical AC list for v_old and v_new. Source-shape-aware; LLM-assisted for messy
prose. Output is reviewable structured records.

### Step 2 — Match ACs across versions by intent (Layer 2)  ← human/agent review point
For each v_new AC, find its corresponding v_old AC by intent. Confirm matches explicitly. Use
source IDs as a hint only. Assign/carry our internal IDs. Output a match table.

### Step 3 — Classify the delta
For each matched pair (or unmatched record), classify:
- **unchanged** — intent and detail identical → no action
- **modified** — same intent, changed detail (values, wording, expected result) → update the test
- **added** — new requirement with no v_old match → add a new test
- **removed** — v_old requirement absent in v_new → remove or skip the test
- **renamed/renumbered** — same intent, new source ID → no test change, just update the mapping

### Step 4 — Map the delta to tests (Layer 3)
Using our internal AC IDs (which the test annotations reference), locate the affected `test()`
block(s) for each modified/added/removed AC. Unchanged ACs → untouched tests.

### Step 5 — Apply only the delta (Layer 4)
- **modified:** update the assertion(s) + the AC annotation text in that test block.
- **added:** add a new `test()` block with its annotation, in the correct describe (parallel vs.
  serial per the state-mutation rule).
- **removed:** remove or `test.skip()` the block, with a note.
- Leave unchanged tests alone.

### Step 6 — Version, record, verify
- Bump the spec + doc version (`-vN` → `-v(N+1)`), rename in lockstep.
- Record the delta: a short **change record** listing each AC's classification and the action taken
  (this is the trail that proves the suite kept up).
- Run the suite; confirm only the intended tests changed behaviour.

---

## What becomes tooling vs. what stays judgment

| Step | Nature | Becomes |
|---|---|---|
| Extraction (Layer 1) | Fuzzy parse of messy source | LLM-assisted, human-reviewable |
| Matching by intent (Layer 2) | Judgment | LLM-assisted, **explicit review required** |
| Classification (Step 3) | Mechanical (given matches) | Deterministic |
| Test-mapping (Layer 3) | Mechanical (given internal IDs) | Deterministic — a script |
| Applying the delta (Step 5) | Mostly mechanical | Assisted, verified by test run |

The trust boundary: fuzzy/judgment steps are isolated and reviewed; everything downstream is
deterministic. This is what makes the process reproducible rather than "the AI decided".

---

## Feeds into Phase 2 (generate from scratch)

Building this delta process also builds the machinery a from-scratch generator needs: canonical
extraction, the AC↔test mapping convention, and internal stable IDs. Generating a whole suite is
just the special case where v_old is empty and every AC is "added". See `ROADMAP.md`.

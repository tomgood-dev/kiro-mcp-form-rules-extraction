# Reconciling against an existing client / manual test suite

> Steering file. Applies whenever a target app already has an EXISTING body of test material —
> the client's manual test cases, execution results, requirement docs, a QA team's spreadsheets, etc.
> (For `asteron-quote-apply` this lived under `reference/client-manual-test-suite/`.) The point is to
> mine that material to improve OUR generated tests and to show coverage parity — WITHOUT letting
> stale external material corrupt our suite.

## Why this exists

External test material is a gift and a trap. Gift: it encodes real domain knowledge, edge cases, and
requirement history that took the client's testers/BAs months to accumulate. Trap: it is almost always
**dated** — the app moved on, requirements were updated, defects were fixed — so treating it as ground
truth silently injects wrong expectations into our suite.

**Golden rule: external material tells you WHERE to look, never WHAT the answer is.** The live app is
still the only source of truth for current behaviour (see `test-expansion-process.md`, "the app is a
moving target").

## The reconciliation process

### 1. Place it, don't pollute
- Raw exports go under `reference/<source>/`, **gitignored** (they are large and third-party). Commit
  only small derived docs (README, SOURCE/provenance, the audit .md). See `.gitignore`'s `reference/**`
  rules for the pattern (ignore xlsx/docx/pdf/zip + dump folders; re-include `*README*/*SOURCE*/*analysis*/*audit*`).
- Record provenance in a `SOURCE.md`: where from, export date, applications covered, sensitivity.

### 2. Sample, don't drown
- These sets are big. Read 2-3 representative files to learn the client's CONVENTION (their columns,
  their AC style, their verdict scheme), then STOP. Don't token-burn reading everything.
- Harvest structure cheaply: filenames often encode the verdict + test-case id + AC (e.g.
  `Pass - TC_12 …`, `Fail_TC_9 …`). Build a filename-level index as the crosswalk backbone before
  opening any heavy file. (xlsx/docx are zip archives — read `sharedStrings.xml` / `docProps/core.xml`
  via the .NET zip API, no external library needed.)

### 3. Crosswalk to our specs, classify every finding
Produce a per-feature table mapping their test cases (by their ID) to our ACs/tests, and classify each
finding into exactly one bucket — this classification is the whole point:

- **DURABLE** — version-independent, action now. Test-DESIGN ideas (a negative/boundary/absence scenario
  we hadn't covered), coverage DIMENSIONS (e.g. testing by occupation *name* not just code), and
  TRACEABILITY (referencing their test-case IDs). These hold regardless of the app's current state, so
  encode them against the *current app's observed values*.
- **RE-PROBE-GATED** — depends on current behaviour. Anything of the form "they reached X" / "they got
  value Y" / "they found defect Z". Re-probe the LIVE app first; only then un-defer / encode / confirm-
  fixed. Never copy their expected value or their reachability claim directly into an assertion.
- **BA-CONFIRM** — a genuine ambiguity (our result ≠ theirs and it could be app-changed, their-doc-stale,
  our-story-stale, or a real bug). Flag it; don't resolve it unilaterally.
- **BLOCKED** — not reachable/observable by us regardless (backend payloads, PDFs, needs a data fixture).

### 4. Action only DURABLE now; gate the rest
- Close DURABLE gaps immediately (they only make our suite better).
- For RE-PROBE-GATED items, run a targeted probe against the live app; promote to a real test only if
  the probe confirms current reachability + gives the current expected value. If the probe shows it's
  NOT reachable now, our existing deferral stands and theirs was point-in-time — record that.
- Keep the audit doc honest: mark clearly which findings are confirmed-current vs dated-leads.

### 5. Adopt useful conventions (cheap wins)
- **Traceability:** put the external test-case ID (and any Jira/requirement ID) in our spec header + test
  doc, so a BA can line our automated coverage up against their manual suite.
- **Sub-numbering:** if they break an AC into sub-cases (AC02.1, AC03.7), mirror that when we add the
  same finer scenarios — it makes the crosswalk 1:1 and eases their review.
- Do NOT adopt their FORMAT wholesale (manual Excel-per-ticket with pasted screenshots) — our automated
  `report.md`/`summary.json`/dashboard is the richer artifact. Match substance + IDs, not layout.

## Anti-patterns (learned the hard way, 2026-09-09)

- ❌ Treating "the client executed it" as proof it's reachable on the current environment. (It only
  proved reachability at their run date; re-probe.)
- ❌ Encoding a client-recorded defect as a live bug. (Check for a "Defect retest … Passed" sibling —
  many are already fixed. Encode as a normal check that will simply go green.)
- ❌ Copying an expected value/threshold from a dated doc into an assertion. (The Asteron Kids min-SI
  was $10k in the 2017 doc but $50k-default on the current app — the doc was stale.)
- ❌ Reading the entire export. Sample, index by filename, open only what a specific finding needs.

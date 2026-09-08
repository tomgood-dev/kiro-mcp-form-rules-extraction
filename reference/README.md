# Reference materials (external / client-provided)

This folder holds **external reference material** — things the client (or another team) already
produced, that we ingest to learn from and align to. It is **not** our generated output and **not**
code we run.

Keep it clearly separate from:
- `apps/` — the target application(s) we test + our generated Playwright tests
- `archive/` — our own superseded iterations
- `docs/` / `sessions/` — our process notes and working history
- `tools/` — our tooling

## What lives here

| Subfolder | What it is |
|---|---|
| `client-manual-test-suite/` | The client's existing MANUAL test scripts, results, versioning, and conventions for their other applications, exported from SharePoint. Reference only — we read these to (a) align our generated tests to the client's existing standard/format, and (b) see what they already cover manually. |

## How we use this material

1. **Extract the client's conventions** — test-case ID scheme, script/step format, how they record
   expected vs actual, how they version, how they report pass/fail/blocked, any traceability to
   requirements. Distil these into a short comparison against our current standard
   (`TEST-GENERATION-PROCESS.md`, `.kiro/steering/test-expansion-process.md`).
2. **Reconcile the two standards** — where the client's approach is stronger, adopt it into our
   generation standard so future tests match; where ours is stronger (e.g. exhaustive
   boundary-triples, machine-readable evidence), note the delta so we can articulate the value-add.
3. **Gap-check coverage** — compare what they test manually against what we've automated, to find
   coverage we're missing or duplicate.

## Provenance & handling

- Treat everything in here as **read-only reference** — do not edit the client's materials in place;
  if we derive something from them, that derived artifact goes in our own docs with a citation back
  to the source file here.
- Note the source (SharePoint site/path) and the date exported in a `SOURCE.md` alongside the files
  so provenance is clear.
- If any of these files contain credentials, PII, or other sensitive client data, flag it before
  committing — this folder is committed to git by default, so sensitive files should be gitignored
  or redacted first.

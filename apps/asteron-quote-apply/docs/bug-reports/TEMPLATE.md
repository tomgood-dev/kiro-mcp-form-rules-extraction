# [Short, specific title describing the symptom]

> **Before you write this:** these reports get read (and eventually auto-filed into
> Jira) by people with zero context on our test suite's internal helpers or setup
> conventions. Every value you write down must be there because it's *true and
> necessary to reproduce the bug* — never because "that's what the automated test
> happened to do." Concretely:
> - If a value comes from a shared test helper's default (e.g. a setup function that
>   fills Age/Gender/Occupation with generic placeholder values before the real test
>   logic runs), **do not present it as a required precondition.** State plainly which
>   fields must hold a *specific* value for the bug to reproduce, and which just need
>   *any* valid value — don't let the reader infer significance from a number that was
>   actually arbitrary.
> - Test-before-you-write: for each line in Preconditions/Steps, ask "if I changed this,
>   would the bug stop reproducing?" If the honest answer is "I don't know" or "no,"
>   either drop the line or say explicitly that it doesn't matter.
> - If part of what the automated test checks was never actually reached (e.g. it stops
>   at the first failing assertion in a loop), say so explicitly — do not let silence
>   imply the untested part was confirmed either way.
>
> **Status:** Draft · not yet filed in a tracker
> **Severity:** Critical / High / Medium / Low
> **Component:** [Screen › Section, e.g. "Quote › Lump Sum Covers"]
> **Environment:** [base URL / environment name]
> **Found via:** Automated test (Playwright) — `[spec file]:[test name]`
> **Reported:** [YYYY-MM-DD] · [who/what found it]

## Summary

Plain-language explanation of what's happening: what did we expect (per the business-rules
doc / user story), what actually happened, and why it matters. One or two paragraphs — a
reader with no context should understand the problem from this section alone.

## Preconditions

Exact starting state needed to reproduce: URL, account/login, and any setup data
(age, cover, sum insured, etc.) required to reach the point where the steps below begin.
For every value listed, make clear whether it's **specific-and-required** ("must be
exactly this, or the bug won't reproduce") or **just-needs-to-be-valid** ("any value
here works — this one is just what was used"). Never state a value as a precondition
without knowing which of those two it is.

## Steps to reproduce

Numbered, exact values — no vague language. Someone who has never seen this app or our
test suite should be able to follow these verbatim, with no need to go read the
automated test's source code to understand why a step is there. If a step exists only
because of how the automated test happens to be built (not because a human reproducing
by hand would need it), either rewrite it in human terms or drop it.

1. ...
2. ...
3. ...

> ⚠ Call out any subtle/non-obvious timing or ordering detail here (e.g. "must happen
> before the previous request resolves") if one exists.

## Evidence

| | Expected (per doc/spec) | Actual (observed) |
|---|---|---|
| [field/state being compared] | ... | ... |

Embed screenshots directly in this markdown (base64 data URI via
`tools/artifact-helpers.js`'s `embedImage(path, altText)`) rather than linking out to a
separate `.png` file. If this report was produced by an actual `.spec.js` run, save it
inside that run's own folder —
`test-runs/<spec-file-slug>/<run-timestamp>/bug-reports/<slug>.md` (see
`.kiro/steering/test-expansion-process.md`, "Test-run artifact structure") — so it stays
next to the `results.md`/`native/` trace.zip that produced it, and reference those by
relative path rather than the old `test-results/<hashed-folder>/` convention. For a
reverse-engineering probe finding (no accompanying spec run), keep using this feature's
`evidence/` numbered-subfolder convention instead. Never delete these once they've
supported a finding.

## Root cause

Technical explanation if one can be determined from black-box observation (e.g. "the
request appears to short-circuit before X"). If the true cause requires server-side/code
access we don't have, say so plainly — this section is a hypothesis, not a diagnosis,
unless independently confirmed.

## Reproducibility

Confirmed once vs. reproduced N times, and any variance noticed between runs. Per this
project's "verify before writing up" rule (see `.kiro/steering/test-expansion-process.md`),
do not file a report off a single run — re-run with a different minimal script or sample
over time first, and only write this up once 2+ independent runs agree.

## Possible explanations to rule out first

Since developers actively work on this app, an actual/expected mismatch can mean:
- **A real regression** — the app now does something wrong it didn't before.
- **An intentional change** — the business rule was deliberately updated, and our
  documentation (built by reverse-engineering the app at an earlier point in time) is
  now stale, not the app.
- **A test artifact** — our own script did something wrong (see the Probe & Interaction
  Safety rules in the steering doc) — ruled out via the reproducibility check above.

State which of these is most likely and why, but don't guess confidently past what the
evidence actually shows.

## Suggested next step

- **If likely a regression:** flag to the dev team with this report as-is.
- **If likely an intentional change:** confirm with the BA/PM, then update the relevant
  business-rules page (and any tests asserting the old behavior) to match — do not leave
  the doc and the app disagreeing silently.

## Test artifact

Which spec file automates this check, and the exact command to reproduce it locally:

```
npx playwright test [spec file] -g "[test name]" --config=playwright.config.js
```

## Before you consider this done

- [ ] Every value in Preconditions is marked specific-and-required or just-needs-to-be-valid
- [ ] No step exists purely because "that's what the test script does" — each one reads
      as something a human would actually need to do
- [ ] Anything the automated check didn't actually reach (early-exit loops, skipped
      branches) is explicitly called out as unverified, not silently omitted
- [ ] Reproducibility reflects 2+ independent runs, not one
- [ ] A reader with zero context on this codebase could follow Steps to Reproduce without
      needing to open any test file

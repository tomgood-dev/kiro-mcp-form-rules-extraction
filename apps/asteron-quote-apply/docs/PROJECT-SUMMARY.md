# Asteron Life Quote & Apply — How We Got Here

**Last updated:** 2026-08-21

This is the story of this project so far, in plain language, from the beginning to where things stand today.

## The problem we set out to solve

Asteron Life's Quote & Apply form (the tool advisers use to quote and apply for life insurance policies) has a lot of business logic buried in it — age limits, sum-insured caps, formulas, discount thresholds, cover dependencies. Nobody had a reliable, complete, tested map of exactly how it all behaves, and we didn't have access to the underlying source code to just read the answer. The only way to find out for certain was to interact with the live form the way a real adviser would, and watch exactly what it does.

## Phase 1: Exploring the form from scratch

We started by driving a real browser against the live test environment — filling in fields, activating covers, deliberately entering oversized or edge-case values, and reading back the exact error messages and calculated numbers the app returned. This happened in three passes over the first couple of weeks:

- **Iteration 1** covered the whole form end to end once, quote through application.
- **Iteration 2** went back over the Quote screen (the "Illustration" step) much more thoroughly, testing it adversarially — trying to break every rule we could find.
- **Iteration 3** closed the remaining gaps: age-banded limits, cover dependencies, formulas, checkbox interactions, and resolved four places where two different testing sessions had come to conflicting conclusions.

By the end of this phase, we had a real, evidence-based map of the Quote screen's rules — not a guess, not a design document, but what the app actually does — written up so a business analyst can reference any specific rule by a short stable ID instead of re-describing it every time.

## Phase 2: Turning findings into a real test suite

Documentation on its own doesn't catch regressions. So the next step was converting what we'd found into automated Playwright tests that run against the live app and fail if the behavior ever changes unexpectedly. We restructured the whole project into a reusable framework (so this same approach could be pointed at a different form later, not just this one), and built out full test coverage for five core areas: personal details and age limits, lump sum cover caps, disability cover formulas, premium and bundling discounts, and policy/kids-cover rules. Each of those five test files now runs dozens of checks — everything from exact dollar boundaries to whether a rule holds regardless of who the client is — and all of them currently pass.

## Phase 3: Testing something that isn't fully built yet

Then the work took on a different shape. Instead of reverse-engineering an existing feature, we were asked to test a *new* one — a feature letting an agency set a default commission structure — against its written specification, which may or may not be fully deployed yet. This required a different mindset: instead of treating "whatever the app does" as correct, we treated the *specification* as correct, and wrote tests that would only pass once the real feature matched it. That way, if part of the feature isn't finished yet, the test doesn't just find a workaround — it stays red until the real thing is fixed, which is the whole point.

## Phase 4: Finding "bugs" — and proving ourselves wrong first

Along the way, two things looked like real defects in that new feature. Both got written up initially as likely bugs. But rather than stop there, we went back and tried hard to disprove our own findings — rerunning things in cleaner, more isolated ways, sampling behavior over time, checking whether our own test scripts had accidentally caused what we were seeing. Both turned out to be false alarms: one was caused by an accidental mouse-scroll in a throwaway test script that quietly changed a dropdown's value; the other was caused by testing multiple scenarios back-to-back on the same quote, which let an old value leak into the next scenario instead of the app actually computing something wrong. Once retested properly, every part of that feature we've checked is working exactly as specified. We're keeping the full trail of that investigation on record, including the parts where we were initially wrong, because it's the clearest evidence of how carefully this was checked before anything got reported.

## Phase 5: Finding a real problem — with our own process

Testing that same feature also surfaced a genuine, separate issue: to test each scenario cleanly (a lesson from Phase 4), we needed to open several fresh quotes back-to-back in one continuous session. Doing that seven times in a row turned out to put more strain on the shared test environment than anything else in this project ever had, and it caused real instability — a long hang once, and a forced logout another time. Once we recognized the pattern, the fix was simple: split the work into two smaller test runs instead of one long one. Both have run cleanly since.

## Phase 6: Tidying up

With the test suite growing, the project itself was starting to accumulate clutter — orphaned files, unclear names, evidence scattered without organization. We spent time cleaning that up: reorganizing the folder structure, writing down the rules we'd learned the hard way (so the next round of testing doesn't repeat the same mistakes), and renaming every test file from cryptic short codes into names that actually describe what they check.

## Where we are now

- Five core rule areas are fully tested and passing, covering the main Quote screen end to end.
- The new commission-category feature is tested against its written spec, and everything checked so far is confirmed working correctly.
- The application steps that follow a quote (the multi-page application process) have only been explored once, lightly — that's the next big area of untested ground.
- A handful of things are deliberately not yet tested because doing so would require changing a setting shared across the whole agency, or saving real quotes, in the live shared test environment — we've held off pending a decision on that.
- The automated tests currently only run reliably from an approved internal workspace, because the client's own automated test runner isn't yet allowed to reach the test environment over the network.

That's the story so far — from "we don't know exactly how this form behaves" to a tested, documented, and actively-maintained map of it, with a track record of catching our own mistakes before they became someone else's problem.

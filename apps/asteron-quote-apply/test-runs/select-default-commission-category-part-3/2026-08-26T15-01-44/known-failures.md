# Known failure in this run — cross-reference

The single failure in this run's `results.md` (AC06/AC07/AC08) is a **previously-known
regression**, confirmed even before yesterday's investigation — see the "THIS TEST IS
EXPECTED TO FAIL" header comment already in
`apps/asteron-quote-apply/tests/quote-screen/select-default-commission-category-part-3.spec.js`,
and the earlier probes `apps/asteron-quote-apply/probes/probe-update-save-confirm.js` /
`probe-update-verify.js` that originally found it.

Checked against the **literal text of the source user story**
(`docs/user-stories/User Story- Select Default Commission Category.md`):

| Test | AC | User story says (verbatim) | Live app does |
|---|---|---|---|
| AC06/AC07/AC08 | AC07 | *"Given the default commission category has been successfully saved When the save operation completes Then the following confirmation message is displayed: 'Your default commission structure setting has been updated.'"* | Message never appears after clicking Update |

This test also mutates the shared agency-wide Default for Agency setting for its
duration — it reverts to Upfront in a `finally` block regardless of pass/fail, so a
failure here doesn't leave the shared dev environment in a different state.

**Still open:** BA/PM confirmation of regression vs. intentional change. Until then this
stays red on purpose (see `.kiro/steering/test-expansion-process.md`, "Do not silently fix
the test to match new behavior").

# 13 — probe-update-verify

**Purpose:** Independent, more rigorous re-check of the `12-probe-update-save-confirm` findings, per the mandatory "verify before writing up" rule — a different script, polling instead of a single snapshot, and a full sign-out/sign-in to rule out client-side session caching as an alternative explanation for "a new quote in the same session still shows the old default."

**Script:** `apps/asteron-quote-apply/probes/probe-update-verify.js`

**What it did:** login → quote A → Adviser Use → set Level 30 → click Update → polled every 500ms for 6 seconds for (a) the update-button disabled state and (b) any "updated" text anywhere in the page → opened quote B (same session) → **signed out, signed back in** → opened quote C → checked the default → reverted to Upfront with the same poll → quote D (same session) → **signed out, signed back in again** → quote E, confirming the revert.

**Results (raw output in `raw-output.txt`):**
- Confirmation message: **never appeared** across 13 samples over 6 seconds, on both the set-Level-30 click and the revert-to-Upfront click.
- Update button: **stayed enabled** (`disabled:false`) at every single sample, both times — never re-disabled after a "successful" save.
- Quote B (new quote, same session, right after Update): `Upfront` — matches the first probe's finding.
- **Quote C (brand-new login session, after Update supposedly set Level 30): `Upfront`** — this is the critical result. A client-side session cache would not survive a full sign-out/sign-in, so this rules that out as the explanation. The agency default was never actually changed server-side.
- Revert cycle: quote D and quote E (the latter after another full sign-out/sign-in) both correctly show `Upfront` — the environment is back to its known-good baseline, confirmed two ways.

**Conclusion:** Two independent scripts now agree on all three points. This is written up as a confirmed Discrepancy Evidence Record against AC06/AC07/AC08 in `page.md`.

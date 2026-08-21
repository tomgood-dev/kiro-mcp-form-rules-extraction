# Run 04 — `probes/probe-update-button-ac05.js`

**Date:** 2026-08-20
**What it checked:** Full Update-button sequence using only Playwright's real `selectOption()`
API (no raw `dispatchEvent`, no `mouse.wheel()`): disabled by default → enabled after a genuine
change → disabled again after reverting to the saved value.
**Result:** CONFIRMED — the button behaves exactly per AC04/AC05, plus the revert-to-saved-value
behavior. This is the run that closed out the Update-button investigation as a false positive.
**Files:** `ac04-ac05-confirmed-sequence.png`

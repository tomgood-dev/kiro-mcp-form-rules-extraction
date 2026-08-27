# Run 11 — `probes/probe-gender-control-diagnostic.js`

**Date:** 2026-08-21
**What it checked:** After `comm-cat-v2.spec.js` hung for 15 minutes stuck right after setting
Age but before setting Gender, the failure screenshot showed circular radio-style Gender/Smoking
controls, different from the rectangular `.button-group-item` divs every prior probe relied on —
raised a concern the app's DOM had changed overnight.
**Result:** Ruled out — dumped the live DOM and confirmed `.button-group-item` elements are
unchanged (same classes, same "Male"/"Female"/"Yes"/"No" text). The circular appearance in the
failure screenshot was a rendering/capture artifact of the timeout, not a real DOM change. The
actual root cause turned out to be sustained session load (many fresh quotes in one session) —
see the "Environment finding" section on the business-rules page and evidence runs 08-10.
**Files:** `gender-control-diagnostic.png`

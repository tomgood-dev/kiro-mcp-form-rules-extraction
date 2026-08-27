# Run 03 — `probes/probe-update-button-timing.js`

**Date:** 2026-08-20
**What it checked:** Whether the Update button auto-enables over time with zero interaction
after opening Adviser Use (to rule out a timing/async-render explanation for runs 01/02
disagreeing).
**Result:** Sampled every 1-4s for 12s with no interaction — stayed `disabled: true` throughout.
Ruled out "it becomes enabled on its own." Pointed the investigation at run 01's own
`mouse.wheel()` call as the likely contaminant instead.
**Files:** `still-disabled-t12s.png`

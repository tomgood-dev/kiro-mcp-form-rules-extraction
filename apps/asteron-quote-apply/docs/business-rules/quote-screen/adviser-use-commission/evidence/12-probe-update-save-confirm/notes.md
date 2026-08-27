# 12 — probe-update-save-confirm

**Purpose:** Investigate AC06 (save as agency default), AC07 (confirmation message), AC08 (persist across reopen) — the first live check of what actually happens when Update is clicked, now that touching the shared agency default is approved for this dev environment.

**Script:** `apps/asteron-quote-apply/probes/probe-update-save-confirm.js`

**What it did:** fresh quote A → Adviser Use → changed Default for Agency from Upfront to Level 30 → clicked Update → dumped visible page text → reopened Adviser Use in the same quote → opened a brand-new quote B → reverted to Upfront → clicked Update again → opened a third quote C to confirm the revert.

**Key observations (raw output in `raw-output.txt`):**
- No confirmation message text appears anywhere in the ~4000-char body-text dump taken shortly after clicking Update (AC07 expects `"Your default commission structure setting has been updated."`).
- Update button stayed **enabled** (`disabled:false`) immediately after clicking it — AC09's spirit is that it should be disabled once the displayed value matches the saved value.
- Reopening Adviser Use in the **same already-open quote** showed `Level 30` — but that's the same live DOM/component instance, so this doesn't prove a real server-side save.
- A **brand-new quote B**, opened in the same login session right after the Update click, showed `Upfront` — not `Level 30`.
- Revert to Upfront + Update, confirmed via a third fresh quote, showed `Upfront` cleanly.

**Conclusion:** suggestive of a real defect (Update doesn't persist), but per the "verify before writing up" rule, this alone isn't enough — the same-session-only observation could be a client-side cache rather than a true non-save. Follow-up: `13-probe-update-verify`.

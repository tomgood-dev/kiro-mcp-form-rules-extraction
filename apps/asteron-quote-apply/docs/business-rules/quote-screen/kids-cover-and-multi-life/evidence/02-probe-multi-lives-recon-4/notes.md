# Probe run: multi-lives recon-4

- **Date/time:** 2026-09-02 ~15:2x (+10:00)
- **Command:** `node apps/asteron-quote-apply/probes/probe-multi-lives-and-policies-recon-4.js`
- **What it checked:** first attempt at the life-tab delete modal (clicked X on non-active Life 1),
  and MLP-26 via min-premium error state.
- **Key results (superseded by recon-5):**
  - Discovered life-tab buttons render in TWO copies — a `disabled:true` set and a `disabled:false`
    set. This run clicked the disabled copy's icon → no modal. recon-5 fixed this by clicking the
    ENABLED copy.
  - MLP-26 via min-premium-after-Apply: Apply surfaced the $240 min-premium error, but Add life
    afterwards produced no "correct the errors" modal.
- **Screenshots:** `mlp06-delete-life-confirm.png`, `mlp26-correct-errors-modal.png` (from the
  superseded attempt; the definitive MLP-06 evidence is in `03-probe-multi-lives-recon-5/`).

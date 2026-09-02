# Probe run: multi-lives recon-5

- **Date/time:** 2026-09-02 ~15:2x (+10:00)
- **Command:** `node apps/asteron-quote-apply/probes/probe-multi-lives-and-policies-recon-5.js`
- **What it checked:** life-tab delete modal via the ENABLED tab copy's fa-times (MLP-06);
  MLP-26 "correct the errors" modal via over-cap SI and blank-SI error states.
- **Key results:**
  - MLP-06: clicking the enabled Life 1 fa-times raised **"Cannot proceed / Please enter the
    minimum requirement for a quote before proceeding to another life / OK"** — NOT the story's
    "Are you sure you want to delete this life?" + Cancel/Delete. `mlp06-delete-life-confirm.png`.
    → candidate discrepancy for AC06/07/08.
  - MLP-26-A (over-cap $60M SI): no visible error at all; no modal on Add life.
  - MLP-26-B (blank SI): no visible error; no modal on Add life. `mlp26-b-modal.png`.
    → the AC26 trigger error-state was not reproducible from the browser with these paths.

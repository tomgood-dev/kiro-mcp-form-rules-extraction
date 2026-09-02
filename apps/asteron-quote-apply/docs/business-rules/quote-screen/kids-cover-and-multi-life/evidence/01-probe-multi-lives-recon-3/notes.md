# Probe run: multi-lives recon-3

- **Date/time:** 2026-09-02 ~15:2x (+10:00)
- **Command:** `node apps/asteron-quote-apply/probes/probe-multi-lives-and-policies-recon-3.js`
- **What it checked:** exact modal text for MLP-03/26, life+policy tab close controls (MLP-06/16),
  Apply→Client Summary reachability (MLP-10/19).
- **Key results:**
  - MLP-03 modal captured verbatim: "Cannot proceed / Please enter the minimum requirement for a
    quote before proceeding to another life / OK". (Story says "requirements" plural — discrepancy.)
  - MLP-10: `mlp10-apply-no-navigation.png` — after Apply on a valid single-life quote the page
    stays on the Illustration/quote screen (no Client Summary, no errors). Confirms the documented
    Apply-completion issue. This is the evidence that MLP-10/11/12/19/20/21 are browser-unreachable.
  - Policy-tab DOM: Personal/Business tabs are `<div><a>label</a><a><i class="fa fa-times"></i></a></div>`;
    active tab `border-bottom:2px solid blue`, errored tab `background-color: var(--color-error-light)`.

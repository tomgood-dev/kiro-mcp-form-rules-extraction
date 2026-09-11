# Probe run 01 — reachability + Apply-flow re-test (2026-09-11)

- **Date/time:** 2026-09-11 ~10:15 AEST
- **Command:** `BASE_URL=https://outsystems-qa.asteronlife.co.nz PROBE_ACCT=a node apps/asteron-quote-apply/probes/probe-reachability-and-apply-2026-09-11.js`
- **Account:** a (tom.good+good), QA
- **Purpose:** Confirm QA reachable after PC restart + re-test whether the Apply flow now
  navigates (recent helper commits 8fd50ab/87b2478 claim the earlier "Apply does not navigate"
  was actually an unfilled mandatory Adviser Use popup, not a real block).

## Result — DECISIVE

- QA environment reachable (HTTP 200, dashboard hydrates to 944 chars).
- Auth state from 09-09 was stale (bounced to login); refreshed account `a` via global-setup
  (`login OK on attempt 1`) — login pipeline confirmed working.
- **Apply flow WORKS end-to-end:**
  - `reachApplicationFlow` (Life $500k, Upfront) → **Client Summary = true**
  - `proceedThroughClientSummary` → **Duty of Disclosure = true**

## Implication for deferred ACs

The "Apply does not navigate to Client Summary" reachability claim underpinning multiple defers
is **STALE / disproven**. Client Summary and Duty of Disclosure are reachable from the browser.
Re-test and encode (bucket A):
- multi-lives-and-policies-v1 — the 5 "Client Summary unreachable" defers (AC34/38/etc.)
- navigation-behaviour-v1 — URE panel (past DoD)
- occupation-apply-flow-v1 — Occupation Apply screen (past DoD)
- select-default-commission-category-v1 AC16 (behind Apply gate)

Still genuinely gated (NOT disproven by this probe): full application SUBMISSION past Client
Summary (payment/STP), which some multi-lives ACs require.

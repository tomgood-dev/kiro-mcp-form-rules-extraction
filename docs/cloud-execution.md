# Cloud / CI Execution — Decision Doc

> Purpose: options for running the Asteron Quote & Apply test suite off the local machine (scheduled,
> unattended, with a hosted dashboard for dev/BA), and the constraints that shape the choice. Written
> 2026-09-09. This is a decision aid to take to whoever owns the AWS account + the QA IP allowlist —
> not a committed implementation.

## TL;DR recommendation

**One always-on, IP-whitelisted VM acting as a self-hosted GitHub Actions runner, publishing the
dashboard to GitHub Pages.** This gets the run off the laptop, is effectively free on the software side
(self-hosted runner minutes + Pages are free), reuses everything already built (`tools/parallel-run.js`,
the reporter, `accounts.json`), and produces the *identical* reports/dashboard — just hosted at a URL.

## The two hard constraints (these dictate everything)

1. **Whitelisted IP.** The QA app (`outsystems-qa.asteronlife.co.nz`) is only reachable from a
   whitelisted IP (see `docs/network-access-issue.md`). Cloud runners have dynamic egress IPs, so **any**
   cloud option must send traffic from an allowed IP: a NAT Gateway + Elastic IP, a fixed VPN/proxy, or a
   runner hosted *inside* an already-whitelisted network. **This is the gating question — confirm it
   before building anything.** GitHub's *hosted* runners cannot reach the app out of the box; a
   **self-hosted** runner on a whitelisted box is the realistic path.
2. **One session per account.** The platform allows one active session per account, so max concurrency =
   number of accounts (currently 10). Cloud lets you scale *machines*, but you **cannot exceed 10
   concurrent streams** until more accounts exist. So cloud's near-term value is reliability +
   unattended scheduling + more RAM-per-stream, **not** more parallelism than 10.

## Do the outputs stay the same? — Yes, identical

The reports are produced by the Playwright reporter *as part of the test command*, not by anything
local. Wherever `node tools/parallel-run.js` runs, it still writes, per spec:
`test-runs/<spec>/<timestamp>/report.md` + `summary.json`, and rebuilds `test-runs/DASHBOARD.md` +
`dashboard.html` at the end. Same files, same format. Nothing is local-specific.

## Visibility — where the files go (the real CI difference)

CI runners are **ephemeral** — the VM is destroyed after the job, so results must be pushed somewhere.
Three standard options, increasing niceness:

| Option | How | Visibility | Effort |
|---|---|---|---|
| (a) Artifacts | Upload `test-runs/` as a build artifact | Download a zip from the Actions run page, open `dashboard.html` | lowest |
| (b) Commit-back | CI commits updated `test-runs/` to a branch | Same as today — a file in the repo, auto-updated by cloud | low (mind commit-loop hygiene) |
| (c) **GitHub Pages** | CI publishes `dashboard.html` to Pages | **A live URL** dev/BA bookmark — no download, no repo access | low, **recommended** |

`dashboard.html` is self-contained (no server needed), so (c) is a clean fit and directly delivers the
"high-level view for dev/BA" as a hosted link.

## Is it free?

- **Self-hosted runner minutes:** FREE (GitHub only bills *their* hosted compute).
- **GitHub Pages:** FREE.
- **GitHub-hosted runner minutes (if used instead):** free tier 2,000 min/month (private repos). But
  parallel jobs each burn their own minutes, and our suite is ~15h cumulative browser time — a full run
  is hundreds–1,000+ billed minutes, so regular hosted runs would exceed the free tier (~$0.008/min
  overage). Combined with the IP problem, hosted runners are the wrong fit here.
- **The real cost:** the **always-on VM** hosting the self-hosted runner (e.g. a small EC2, or an existing
  in-network server). This is the same VM you'd want anyway to move the run off the laptop.

**Net:** given a whitelisted always-on VM, the GitHub layer (Actions + Pages) is effectively free; the
only cost is the VM.

## Options considered

1. **Self-hosted GitHub runner on a whitelisted VM + Pages** — *recommended.* Off the laptop, free GH
   layer, identical outputs, hosted dashboard, scheduled or on-demand. Reuses all existing tooling.
2. **One big always-on VM, run the launcher directly (cron)** — simplest "not my laptop". No CI, no
   Pages; results via commit-back or an S3 static-site sync. Good if you don't want GitHub in the loop.
3. **Multi-VM fan-out (sharding)** — split specs across N whitelisted VMs, merge summaries to a shared
   store, rebuild the dashboard from all shards. Only worth it once wall-clock hurts AND there are >10
   accounts; until then it adds orchestration for no extra concurrency. (`parallel-run.js --shard i/n`
   support can be added when needed.)
4. **Managed Playwright cloud (MS Playwright Testing / BrowserStack / etc.)** — fastest to scale browsers,
   but their egress IPs make the whitelist harder to control, plus recurring per-minute cost. Poor fit
   for a locked-down internal app unless the provider offers a fixed outbound IP/tunnel.

## Recommended architecture (concrete)

```
[ always-on VM, egress IP whitelisted for QA ]
        │  registered as a GitHub self-hosted runner (label: asteron-qa)
        ▼
GitHub Actions workflow (.github/workflows/nightly-suite.yml):
  - checkout, npm ci, npx playwright install --with-deps msedge (or chromium)
  - write accounts.json from a GitHub Secret (ACCOUNTS_JSON) — never commit creds
  - node tools/parallel-run.js --all   (or a shard/grep)
  - upload test-runs/ as an artifact  (option a, always)
  - publish test-runs/dashboard.html to GitHub Pages  (option c)
Triggers: schedule (nightly) + workflow_dispatch (manual button)
```

Credentials: `accounts.json` stays gitignored; in CI it's materialised from an encrypted **GitHub
Secret** (`ACCOUNTS_JSON`) at run time. State files (`.auth/state-qa-*.json`) are regenerated by
`global-setup` each run, so nothing sensitive is stored.

## Open questions to resolve before implementing

1. **Can a cloud egress IP be added to the QA allowlist?** (If yes → any option. If no → the runner must
   live inside an already-whitelisted network.) — **gates everything.**
2. Who owns the AWS account / where does the VM live?
3. Is the repo private (2,000-min cap relevant only if hosted runners are ever used) or can Pages be
   public? If the dashboard URL must be access-controlled, Pages may need the repo private + SSO, or an
   S3 site behind auth instead.
4. Edge vs Chromium in CI: local uses Edge (`playwright.edge.config.js`) because Chromium was blocked by
   local security tooling. A clean Linux VM can likely use Chromium (`playwright.config.js`) — confirm
   the app renders identically, or install Edge on the runner.

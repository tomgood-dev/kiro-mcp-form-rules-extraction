// Session hygiene for the single-session dev environment.
//
// WHY THIS EXISTS: the Asteron dev environment allows ONE active login per account. Every
// browser we launch (test run, exploration server, probe) logs in and holds a session. If a
// launch is cancelled or crashes, its browser is orphaned and the session stays held server-side
// — so the NEXT login is silently rejected ("still on login page", empty error). Retrying just
// creates more orphans. The fix is discipline, not retries:
//   1) preflight: before any login, kill stray Edge + Kiro-node processes and clear stale
//      Playwright profiles, so we always start from ZERO active sessions.
//   2) guaranteed teardown: every session-using script must sign out / close in a finally block.
//
// Windows-only process handling (this repo runs on Windows; Chromium is blocked, we use Edge).
//
// Usage (preflight, from any script or the CLI):
//   const { preflightCleanup } = require('../../tools/session-cleanup');  // adjust path
//   await preflightCleanup();
// Or standalone:  node tools/session-cleanup.js

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function run(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); }
  catch (_) { return ''; }
}

/**
 * Kills stray msedge processes and Kiro-Cli node processes that may be holding a session,
 * and removes stale Playwright Edge profile temp dirs. Safe to call before any login.
 * Does NOT touch the current node process.
 */
function preflightCleanup({ verbose = true } = {}) {
  const log = (m) => { if (verbose) console.log(`[session-cleanup] ${m}`); };

  // 1) Kill all Edge (browser sessions). Playwright launches its own Edge instances; killing
  //    them releases any held login. (This also closes a user's manual Edge windows — acceptable
  //    in this automation context; the dev environment is what matters.)
  log('killing stray msedge processes...');
  run('taskkill /F /IM msedge.exe /T');

  // 2) Kill Kiro-Cli node processes EXCEPT ourself (orphaned servers/probes).
  const myPid = process.pid;
  log(`killing orphaned Kiro node processes (keeping self pid=${myPid})...`);
  // Use PowerShell to be precise about the Kiro-Cli path and to exclude our own pid.
  run(`powershell -NoProfile -Command "Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*Kiro-Cli*' -and $_.Id -ne ${myPid} } | Stop-Process -Force -ErrorAction SilentlyContinue"`);

  // 3) Clear stale Playwright Edge profile temp dirs.
  log('clearing stale Playwright profiles...');
  const tmp = os.tmpdir();
  try {
    for (const entry of fs.readdirSync(tmp)) {
      if (entry.startsWith('playwright_')) {
        try { fs.rmSync(path.join(tmp, entry), { recursive: true, force: true }); } catch (_) {}
      }
    }
  } catch (_) {}

  log('done — no active sessions should remain.');
}

module.exports = { preflightCleanup };

// CLI entry
if (require.main === module) {
  preflightCleanup();
}

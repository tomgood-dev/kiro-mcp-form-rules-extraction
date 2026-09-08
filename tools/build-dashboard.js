#!/usr/bin/env node
/**
 * build-dashboard.js — suite-level test dashboard for dev/BA.
 *
 * Aggregates the LATEST run per spec from every test-runs/<spec>/<timestamp>/summary.json
 * (falling back to parsing report.md's header for older runs that predate summary.json) and
 * writes two self-updating artifacts at the app's test-runs/ root:
 *
 *   test-runs/DASHBOARD.md    — scannable Markdown (good for repo / Confluence / a BA)
 *   test-runs/dashboard.html  — self-contained, sortable, filterable HTML (good for a dev)
 *
 * It's called automatically at the end of every run by the run-folder reporter, so it stays
 * current as tests run. It can also be run standalone to rebuild from existing runs:
 *
 *   node tools/build-dashboard.js                 # rebuild for the default app
 *   node tools/build-dashboard.js <appRoot>       # rebuild for a specific apps/<name> dir
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_APP = path.join(REPO_ROOT, 'apps', 'asteron-quote-apply');

function parseReportHeader(reportPath, specSlug, runTimestamp) {
  // Fallback for runs that only have report.md (pre-summary.json). Parse the header lines.
  const txt = fs.readFileSync(reportPath, 'utf8');
  const get = (re) => { const m = txt.match(re); return m ? m[1].trim() : null; };
  const specFile = get(/\*\*Test file:\*\*\s*`([^`]+)`/);
  const env = get(/\*\*Environment:\*\*\s*(.+)/);
  const durTxt = get(/\*\*Run:\*\*[^·]*·[^·]*·\s*([\d.]+)\s*min/);
  const resultLine = get(/\*\*Result:\*\*\s*(.+)/) || '';
  const num = (re) => { const m = resultLine.match(re); return m ? Number(m[1]) : 0; };
  const passed = num(/(\d+)\s*passed/);
  const failed = num(/(\d+)\s*failed/);
  const skipped = num(/(\d+)\s*skipped/);
  return {
    specSlug, specFile: specFile || specSlug, runTimestamp,
    environment: env || 'unknown',
    durationMs: durTxt ? Math.round(Number(durTxt) * 60000) : 0,
    total: passed + failed + skipped, passed, failed, skipped, other: 0,
    tests: [], _fromReport: true,
  };
}

function loadLatestPerSpec(appRoot) {
  const runsRoot = path.join(appRoot, 'test-runs');
  if (!fs.existsSync(runsRoot)) return [];
  const bySpec = new Map();
  for (const specSlug of fs.readdirSync(runsRoot)) {
    const specDir = path.join(runsRoot, specSlug);
    if (!fs.statSync(specDir).isDirectory()) continue;
    // run subfolders are timestamp-named; lexical sort works (zero-padded ISO-ish).
    const runs = fs.readdirSync(specDir).filter((d) => {
      const p = path.join(specDir, d);
      return fs.statSync(p).isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(d);
    }).sort();
    if (!runs.length) continue;

    // Prefer the latest NON-filtered (full) run so a `-g` single-test re-run doesn't get shown as
    // the whole spec's state. Walk newest-first: take the first full run; if all are filtered or
    // legacy (no summary.json to tell), fall back to the newest run.
    let rec = null;
    for (let i = runs.length - 1; i >= 0; i--) {
      const runDir = path.join(specDir, runs[i]);
      const jsonPath = path.join(runDir, 'summary.json');
      if (fs.existsSync(jsonPath)) {
        let j = null;
        try { j = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (_) { j = null; }
        if (j && !j.filtered) { rec = j; rec.runTimestamp = runs[i]; break; }
        // filtered run — skip it and keep looking for a full one
        continue;
      }
      // legacy run without summary.json: parse report.md as the fallback candidate, but keep
      // looking for a newer proper full run first is impossible (this IS older) — accept it only
      // if we haven't found anything and it's the newest legacy option.
      const reportPath = path.join(runDir, 'report.md');
      if (fs.existsSync(reportPath) && !rec) {
        try { rec = parseReportHeader(reportPath, specSlug, runs[i]); } catch (_) { rec = null; }
        if (rec) break; // newest legacy run is the best we can do for a legacy-only spec
      }
    }
    // If every run was filtered (no full run found), fall back to the newest run of any kind.
    if (!rec) {
      const latest = runs[runs.length - 1];
      const runDir = path.join(specDir, latest);
      const jsonPath = path.join(runDir, 'summary.json');
      const reportPath = path.join(runDir, 'report.md');
      if (fs.existsSync(jsonPath)) { try { rec = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); rec.runTimestamp = latest; } catch (_) {} }
      if (!rec && fs.existsSync(reportPath)) { try { rec = parseReportHeader(reportPath, specSlug, latest); } catch (_) {} }
    }
    if (rec) { rec.runCount = runs.length; bySpec.set(specSlug, rec); }
  }
  return [...bySpec.values()].sort((a, b) => a.specSlug.localeCompare(b.specSlug));
}

function fmtDuration(ms) {
  if (!ms) return '—';
  const min = ms / 60000;
  return min >= 1 ? `${min.toFixed(1)} min` : `${Math.round(ms / 1000)}s`;
}
function fmtWhen(ts) {
  // "2026-09-08T10-30-32" -> "2026-09-08 10:30"
  const m = ts.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})/);
  return m ? `${m[1]} ${m[2]}:${m[3]}` : ts;
}

function aggregate(specs) {
  return specs.reduce((a, s) => ({
    specs: a.specs + 1,
    tests: a.tests + s.total,
    passed: a.passed + s.passed,
    failed: a.failed + s.failed,
    skipped: a.skipped + s.skipped,
    specsWithFailures: a.specsWithFailures + (s.failed > 0 ? 1 : 0),
  }), { specs: 0, tests: 0, passed: 0, failed: 0, skipped: 0, specsWithFailures: 0 });
}

function buildMarkdown(specs, agg, generatedAt) {
  const L = [];
  L.push('# Asteron Quote & Apply — Test Suite Dashboard', '');
  L.push(`_Auto-generated ${generatedAt}. Shows the latest run of each spec. Rebuilds automatically after every test run._`, '');
  L.push('## Suite totals', '');
  L.push('| Specs | Tests | ✅ Passed | ❌ Failed | ⏭️ Skipped | Specs with failures |');
  L.push('|---|---|---|---|---|---|');
  L.push(`| ${agg.specs} | ${agg.tests} | ${agg.passed} | ${agg.failed} | ${agg.skipped} | ${agg.specsWithFailures} |`);
  L.push('');
  const passRate = agg.tests ? Math.round((agg.passed / agg.tests) * 100) : 0;
  L.push(`**Pass rate:** ${passRate}% of ${agg.tests} tests (skipped = deferred/blocked ACs, documented per spec).`, '');
  L.push('## Specs (latest run each)', '');
  L.push('| Spec | ✅ | ❌ | ⏭️ | Result | Last run | Duration | Env |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const s of specs) {
    const result = s.failed > 0 ? '❌ FAIL' : (s.passed > 0 ? '✅ PASS' : '⏭️ all skipped');
    const env = (s.environment || '').replace(/^https?:\/\//, '');
    L.push(`| ${s.specSlug} | ${s.passed} | ${s.failed} | ${s.skipped} | ${result} | ${fmtWhen(s.runTimestamp)} | ${fmtDuration(s.durationMs)} | ${env} |`);
  }
  L.push('');
  // Failing specs called out for quick BA/dev triage.
  const failing = specs.filter((s) => s.failed > 0);
  if (failing.length) {
    L.push('## ❌ Specs with failing tests', '');
    L.push('| Spec | Failing tests |', '|---|---|');
    for (const s of failing) {
      const names = (s.tests || []).filter((t) => t.status === 'failed').map((t) => t.title).join('; ') || `${s.failed} failing`;
      L.push(`| ${s.specSlug} | ${names.replace(/\|/g, '\\|')} |`);
    }
    L.push('');
  }
  L.push('---', '', '_Skipped tests are deferred/blocked acceptance criteria (e.g. require seeded data, a submitted application, or the Apply flow) — each spec\'s test doc lists the reason. A skipped test is not a failure._', '');
  return L.join('\n');
}

function buildHtml(specs, agg, generatedAt) {
  const rows = specs.map((s) => {
    const state = s.failed > 0 ? 'fail' : (s.passed > 0 ? 'pass' : 'skip');
    const result = s.failed > 0 ? 'FAIL' : (s.passed > 0 ? 'PASS' : 'ALL SKIPPED');
    const failNames = (s.tests || []).filter((t) => t.status === 'failed').map((t) => t.title).join(' • ');
    return { ...s, state, result, failNames, env: (s.environment || '').replace(/^https?:\/\//, '') };
  });
  const passRate = agg.tests ? Math.round((agg.passed / agg.tests) * 100) : 0;
  const data = JSON.stringify(rows);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Asteron Q&A — Test Suite Dashboard</title>
<style>
  :root { --pass:#1a7f37; --fail:#cf222e; --skip:#9a6700; --bg:#f6f8fa; --border:#d0d7de; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin:0; color:#1f2328; background:#fff; }
  header { padding:20px 24px; border-bottom:1px solid var(--border); background:var(--bg); }
  h1 { margin:0 0 4px; font-size:20px; } .sub { color:#656d76; font-size:13px; }
  .cards { display:flex; gap:12px; flex-wrap:wrap; padding:16px 24px; }
  .card { border:1px solid var(--border); border-radius:8px; padding:12px 16px; min-width:96px; }
  .card .n { font-size:24px; font-weight:600; } .card .l { font-size:12px; color:#656d76; }
  .card.pass .n { color:var(--pass); } .card.fail .n { color:var(--fail); } .card.skip .n { color:var(--skip); }
  .controls { padding:0 24px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  input[type=search] { padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:14px; width:260px; }
  button.filt { padding:6px 10px; border:1px solid var(--border); border-radius:6px; background:#fff; cursor:pointer; font-size:13px; }
  button.filt.active { background:#0969da; color:#fff; border-color:#0969da; }
  table { border-collapse:collapse; width:calc(100% - 48px); margin:0 24px 32px; font-size:14px; }
  th,td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--border); }
  th { cursor:pointer; user-select:none; background:var(--bg); position:sticky; top:0; }
  th:hover { background:#eaeef2; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:600; }
  .badge.pass { background:#dafbe1; color:var(--pass); } .badge.fail { background:#ffebe9; color:var(--fail); } .badge.skip { background:#fff8c5; color:var(--skip); }
  .failnames { color:var(--fail); font-size:12px; }
  tr.hidden { display:none; }
  footer { padding:16px 24px; color:#656d76; font-size:12px; border-top:1px solid var(--border); }
</style></head>
<body>
<header>
  <h1>Asteron Quote &amp; Apply — Test Suite Dashboard</h1>
  <div class="sub">Latest run of each spec · generated ${generatedAt} · rebuilds automatically after every test run</div>
</header>
<div class="cards">
  <div class="card"><div class="n">${agg.specs}</div><div class="l">Specs</div></div>
  <div class="card"><div class="n">${agg.tests}</div><div class="l">Tests</div></div>
  <div class="card pass"><div class="n">${agg.passed}</div><div class="l">Passed</div></div>
  <div class="card fail"><div class="n">${agg.failed}</div><div class="l">Failed</div></div>
  <div class="card skip"><div class="n">${agg.skipped}</div><div class="l">Skipped</div></div>
  <div class="card"><div class="n">${passRate}%</div><div class="l">Pass rate</div></div>
</div>
<div class="controls">
  <input type="search" id="q" placeholder="Filter specs…" oninput="render()">
  <button class="filt active" data-f="all" onclick="setF('all')">All</button>
  <button class="filt" data-f="fail" onclick="setF('fail')">Failing</button>
  <button class="filt" data-f="pass" onclick="setF('pass')">Passing</button>
  <button class="filt" data-f="skip" onclick="setF('skip')">All-skipped</button>
</div>
<table id="t">
  <thead><tr>
    <th onclick="sortBy('specSlug')">Spec</th>
    <th onclick="sortBy('result')">Result</th>
    <th class="num" onclick="sortBy('passed')">✅</th>
    <th class="num" onclick="sortBy('failed')">❌</th>
    <th class="num" onclick="sortBy('skipped')">⏭️</th>
    <th onclick="sortBy('runTimestamp')">Last run</th>
    <th class="num" onclick="sortBy('durationMs')">Duration</th>
    <th onclick="sortBy('env')">Env</th>
  </tr></thead>
  <tbody id="tb"></tbody>
</table>
<footer>Skipped tests are deferred/blocked acceptance criteria (require seeded data, a submitted application, or the Apply flow) — each spec's test doc lists the reason. A skipped test is not a failure.</footer>
<script>
  var DATA = ${data};
  var filter = 'all', sortKey = 'specSlug', sortDir = 1;
  function setF(f){ filter=f; document.querySelectorAll('button.filt').forEach(function(b){b.classList.toggle('active', b.dataset.f===f);}); render(); }
  function sortBy(k){ if(sortKey===k){sortDir=-sortDir;}else{sortKey=k;sortDir=1;} render(); }
  function fmtDur(ms){ if(!ms)return '—'; var m=ms/60000; return m>=1?m.toFixed(1)+' min':Math.round(ms/1000)+'s'; }
  function fmtWhen(ts){ var m=ts.match(/^(\\d{4}-\\d{2}-\\d{2})T(\\d{2})-(\\d{2})/); return m?m[1]+' '+m[2]+':'+m[3]:ts; }
  function render(){
    var q=(document.getElementById('q').value||'').toLowerCase();
    var rows=DATA.filter(function(r){
      if(filter!=='all' && r.state!==filter) return false;
      if(q && r.specSlug.toLowerCase().indexOf(q)<0) return false;
      return true;
    });
    rows.sort(function(a,b){ var x=a[sortKey],y=b[sortKey]; if(typeof x==='string'){return x.localeCompare(y)*sortDir;} return (x-y)*sortDir; });
    var tb=document.getElementById('tb'); tb.innerHTML='';
    rows.forEach(function(r){
      var tr=document.createElement('tr');
      tr.innerHTML='<td><strong>'+r.specSlug+'</strong>'+(r.failNames?'<div class="failnames">'+r.failNames+'</div>':'')+'</td>'+
        '<td><span class="badge '+r.state+'">'+r.result+'</span></td>'+
        '<td class="num">'+r.passed+'</td><td class="num">'+r.failed+'</td><td class="num">'+r.skipped+'</td>'+
        '<td>'+fmtWhen(r.runTimestamp)+'</td><td class="num">'+fmtDur(r.durationMs)+'</td><td>'+r.env+'</td>';
      tb.appendChild(tr);
    });
  }
  render();
</script>
</body></html>`;
}

function buildDashboard(appRoot = DEFAULT_APP) {
  const specs = loadLatestPerSpec(appRoot);
  const agg = aggregate(specs);
  const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const runsRoot = path.join(appRoot, 'test-runs');
  fs.mkdirSync(runsRoot, { recursive: true });
  fs.writeFileSync(path.join(runsRoot, 'DASHBOARD.md'), buildMarkdown(specs, agg, generatedAt));
  fs.writeFileSync(path.join(runsRoot, 'dashboard.html'), buildHtml(specs, agg, generatedAt));
  return { specs: specs.length, agg, runsRoot };
}

module.exports = { buildDashboard, loadLatestPerSpec, aggregate };

if (require.main === module) {
  const appArg = process.argv[2];
  const appRoot = appArg ? path.resolve(appArg) : DEFAULT_APP;
  const r = buildDashboard(appRoot);
  console.log(`[dashboard] ${r.specs} specs → ${path.join(r.runsRoot, 'DASHBOARD.md')} + dashboard.html`);
  console.log(`[dashboard] totals: ${r.agg.passed} passed, ${r.agg.failed} failed, ${r.agg.skipped} skipped across ${r.agg.tests} tests`);
}

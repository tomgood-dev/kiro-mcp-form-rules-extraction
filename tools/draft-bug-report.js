// Turns a `confirmed` verdict from tools/verify-finding.js into a TEMPLATE.md-shaped
// draft bug report - mechanically fills the parts that don't need judgment (header
// block, Preconditions from claim.steps, Steps to reproduce, Evidence table, embedded
// screenshots) and leaves Summary/Root cause/Suggested next step as explicit TODOs.
// The regression-vs-intentional-vs-artifact call stays human/LLM-authored on purpose -
// this tool never auto-fills that judgment, and Status always starts as Draft.
//
// CLI: node tools/draft-bug-report.js <verdict.json> --out <path.md> [--screenshot <path>]
//        [--found-via "<free text>"]

const fs = require('fs');
const path = require('path');
const { embedImage } = require('./artifact-helpers');

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function stepToHuman(step, n) {
  const prefix = n === null ? '' : `${n}. `;
  const target = step.selector || (step.id ? `id="${step.id}"` : '(unspecified target)');
  switch (step.action) {
    case 'goto':
      return `${prefix}Navigate to \`${step.url}\`.`;
    case 'click':
      return `${prefix}Click ${target}.`;
    case 'select':
      return `${prefix}Set ${target} to \`${step.label !== undefined ? step.label : step.value}\`.`;
    case 'fill':
    case 'type':
      return `${prefix}Enter \`${step.value}\` into ${target}.`;
    case 'calcmask':
      return `${prefix}Enter \`${step.value}\` into the masked numeric field ${target}.`;
    case 'wait':
      return `${prefix}Wait ${step.ms || 1000}ms.`;
    default:
      return `${prefix}\`${JSON.stringify(step)}\`.`;
  }
}

function draftBugReport(verdict, opts = {}) {
  if (verdict.status !== 'confirmed') {
    throw new Error(`Refusing to draft a bug report from a non-confirmed verdict (status: ${verdict.status}). Only "confirmed" verdicts represent an actual finding.`);
  }
  const claim = verdict.claim;
  const lastReading = [...verdict.evidence].reverse().find((e) => e.match);
  const actualValue = lastReading ? lastReading.match[claim.expectedField] : undefined;
  const expected = 'expectedValue' in claim ? claim.expectedValue : `not ${claim.expectedValueNot}`;

  const lines = [];
  lines.push(`# ${claim.description}`);
  lines.push('');
  lines.push('> **Status:** Draft · not yet filed in a tracker');
  lines.push('> **Severity:** <!-- TODO: fill in -->');
  lines.push('> **Component:** <!-- TODO: fill in -->');
  lines.push(`> **Environment:** \`${claim.url || opts.url || '<!-- TODO -->'}\``);
  lines.push(`> **Found via:** tools/verify-finding.js (claim \`${claim.id}\`)${opts.foundVia ? ' · ' + opts.foundVia : ''}`);
  lines.push(`> **Reported:** ${today()} · automated independent-reverification (confidence: ${verdict.confidence})`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('<!-- TODO: fill in - what did we expect per the business rule, what actually');
  lines.push('     happened, and why it matters. A reader with no context should understand');
  lines.push('     the problem from this section alone. -->');
  lines.push('');
  lines.push(`Mechanically generated fact: ${verdict.reasoning}`);
  lines.push('');
  lines.push('## Preconditions');
  lines.push('');
  lines.push('<!-- TODO: mark each value below as specific-and-required vs. just-needs-to-be-valid -->');
  lines.push('');
  (claim.steps || []).forEach((step, i) => {
    if (i < (claim.preconditionStepCount || 0)) lines.push(`- ${stepToHuman(step, null)}`);
  });
  lines.push('');
  lines.push('## Steps to reproduce');
  lines.push('');
  let reproStepNum = 0;
  (claim.steps || []).forEach((step, i) => {
    if (i >= (claim.preconditionStepCount || 0)) lines.push(stepToHuman(step, ++reproStepNum));
  });
  lines.push('');
  lines.push('## Evidence');
  lines.push('');
  lines.push('| | Expected (per claim) | Actual (observed) |');
  lines.push('|---|---|---|');
  lines.push(`| \`${claim.expectedField}\` | ${expected} | ${JSON.stringify(actualValue)} |`);
  lines.push('');
  lines.push(`Verified via ${verdict.evidence.length} independent reading(s) (confidence: ${verdict.confidence}) - full raw evidence:`);
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(verdict.evidence, null, 2));
  lines.push('```');
  if (opts.screenshot && fs.existsSync(opts.screenshot)) {
    lines.push('');
    lines.push(embedImage(opts.screenshot, claim.description));
  }
  lines.push('');
  lines.push('## Root cause');
  lines.push('');
  lines.push('<!-- TODO: fill in - hypothesis only unless independently confirmed -->');
  lines.push('');
  lines.push('## Reproducibility');
  lines.push('');
  lines.push(
    `Confirmed via ${verdict.evidence.length} independent reading(s) through tools/verify-finding.js` +
      (verdict.confidence === 'high' ? ' (dual-path or externally-supplied second reading).' : ' (same generic path, fresh session each time - consider also re-checking via an app-specific probe for dual-path confidence).')
  );
  lines.push('');
  lines.push('## Possible explanations to rule out first');
  lines.push('');
  lines.push('- **A real regression** — <!-- TODO -->');
  lines.push('- **An intentional change** — <!-- TODO, check with a BA/PM -->');
  lines.push('- **A test artifact** — unlikely: this finding survived tools/probe-safety-lint.js (no banned interaction pattern) and 2+ independent readings.');
  lines.push('');
  lines.push('## Suggested next step');
  lines.push('');
  lines.push('<!-- TODO: fill in -->');
  lines.push('');
  lines.push('## Test artifact');
  lines.push('');
  lines.push('```');
  lines.push(`node tools/verify-finding.js <claim-for-${claim.id}.json>`);
  lines.push('```');

  return lines.join('\n') + '\n';
}

module.exports = { draftBugReport };

if (require.main === module) {
  const args = process.argv.slice(2);
  const verdictPath = args.find((a) => !a.startsWith('--'));
  const flag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i !== -1 ? args[i + 1] : undefined;
  };
  if (!verdictPath || !flag('out')) {
    console.error('Usage: node tools/draft-bug-report.js <verdict.json> --out <path.md> [--screenshot <path>] [--found-via "<text>"]');
    process.exit(2);
  }
  const verdict = JSON.parse(fs.readFileSync(verdictPath, 'utf8'));
  const content = draftBugReport(verdict, { screenshot: flag('screenshot'), foundVia: flag('found-via') });
  const outPath = flag('out');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
  console.log('Wrote ' + outPath);
}

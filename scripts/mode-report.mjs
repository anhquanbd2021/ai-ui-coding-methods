// Side-by-side CLI report: every generation mode scored on every
// fixture, plus the verify loop and the diff regression check.
// Hard assertions at the end — exit 1 if the taxonomy doesn't hold.

import { REQUESTS, APPROVED_BASELINE } from '../public/examples.mjs';
import { runMode, diffCheck, MODES } from '../public/modes.mjs';

const pad = (s, n) => String(s).padEnd(n);
const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

console.log('Prompt-Mode Lab — input-mode fidelity report\n');

for (const request of REQUESTS) {
  console.log(`== ${request.title} (${request.id}) ==`);
  console.log(pad('mode', 22) + pad('tokens', 8) + pad('a11y', 8) + pad('layout', 8) + 'overall');
  const scores = {};
  for (const mode of MODES.filter((m) => m.kind === 'generate')) {
    const { scores: s } = runMode(request, mode.id, { seed: 7 });
    scores[mode.id] = s;
    console.log(pad(mode.name, 22) + pad(s.compliance, 8) + pad(s.a11y, 8) + pad(s.layout, 8) + s.overall);
  }

  const { history, fixes, scores: final } = runMode(request, 'verify', { seed: 7 });
  console.log(`\nverify loop: ${history.map((h) => `r${h.round}=${h.overall}`).join(' → ')}`);
  console.log(`  fixes: ${fixes.map((f) => `${f.axis}`).join(', ') || 'none needed'}`);

  // The frozen baseline artifact exists for settings-page; other fixtures
  // diff against a freshly regenerated components spec.
  const baseline = request.id === APPROVED_BASELINE.request ? APPROVED_BASELINE : undefined;
  const { drifts } = diffCheck(request, { baseline, drift: 2 });
  console.log(`diff check: ${drifts.length} drifted properties vs approved baseline`);
  for (const d of drifts.slice(0, 4)) console.log(`  ${d.id}.${d.prop}: ${d.before} → ${d.after}`);

  // Assertions: the taxonomy claims.
  check(scores.components.compliance === 1, `${request.id}: components must be 100% on-token`);
  check(scores.tokens.compliance === 1, `${request.id}: tokens mode must be 100% on-token`);
  check(scores.text.compliance < scores.tokens.compliance,
    `${request.id}: tokens must beat text on compliance`);
  check(scores.components.a11y === 1, `${request.id}: components must pass all a11y checks`);
  check(scores.screenshot.layout > scores.text.layout,
    `${request.id}: screenshot must beat text on layout`);
  check(scores.screenshot.compliance < scores.tokens.compliance,
    `${request.id}: screenshot imitation must lose the system`);
  check(final.overall >= 0.9, `${request.id}: verify loop must reach ≥0.9`);
  check(history[0].overall < history.at(-1).overall,
    `${request.id}: verify must improve the score`);
  check(drifts.length >= 2, `${request.id}: diff must catch injected drift`);
  console.log('');
}

if (failures.length) {
  console.error('FAIL:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('All mode assertions hold.');

import test from 'node:test';
import assert from 'node:assert/strict';
import { runMode, generateVerified, diffCheck, MODES } from '../public/modes.mjs';
import { REQUESTS, APPROVED_BASELINE } from '../public/examples.mjs';

const [settings, checkout] = REQUESTS;

test('mode registry exposes five generators and two process modes', () => {
  assert.equal(MODES.length, 7);
  assert.equal(MODES.filter((m) => m.kind === 'generate').length, 5);
  assert.equal(MODES.filter((m) => m.kind === 'process').length, 2);
});

test('verify loop improves the score and reaches the target', () => {
  for (const req of REQUESTS) {
    const { history, fixes, ui } = generateVerified(req, { seed: 7 });
    assert.ok(history.length >= 2, `${req.id}: at least one fix round`);
    assert.ok(history.at(-1).overall > history[0].overall, `${req.id}: score improves`);
    assert.ok(history.at(-1).overall >= 0.9, `${req.id}: reaches ≥0.9`);
    assert.ok(fixes.length >= 1);
    assert.equal(ui.request, req.id);
  }
});

test('verify history is non-decreasing per axis it fixes', () => {
  const { history } = generateVerified(settings, { seed: 7 });
  const first = history[0], last = history.at(-1);
  assert.ok(last.compliance >= first.compliance);
  assert.ok(last.a11y >= first.a11y);
  assert.ok(last.layout >= first.layout);
});

test('diff check catches injected drift against the approved baseline', () => {
  const { drifts, baseline } = diffCheck(settings, { baseline: APPROVED_BASELINE, drift: 2 });
  assert.equal(baseline, APPROVED_BASELINE);
  assert.ok(drifts.length >= 2);
  assert.ok(drifts.every((d) => d.id && d.prop && 'before' in d && 'after' in d));
});

test('diff check is clean when nothing drifted', () => {
  const { drifts } = diffCheck(settings, { baseline: APPROVED_BASELINE, drift: 0 });
  assert.equal(drifts.length, 0);
});

test('runMode returns scores for every registry entry', () => {
  for (const mode of MODES) {
    const r = runMode(checkout, mode.id, { seed: 7, baseline: APPROVED_BASELINE, drift: 1 });
    assert.ok(r.scores && typeof r.scores.overall === 'number', mode.id);
  }
});

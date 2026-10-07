import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../public/generator.mjs';
import { tokenCompliance, layoutMatch } from '../public/score.mjs';
import { TOKENS } from '../public/tokens.mjs';
import { REQUESTS } from '../public/examples.mjs';

const [settings, checkout] = REQUESTS;

test('generation is deterministic per seed', () => {
  const a = generate(settings, 'text', { seed: 7 });
  const b = generate(settings, 'text', { seed: 7 });
  assert.deepEqual(a, b);
  const c = generate(settings, 'text', { seed: 8 });
  assert.notDeepEqual(a, c);
});

test('tokens mode emits only token values', () => {
  const ui = generate(settings, 'tokens', { seed: 3 });
  assert.equal(tokenCompliance(ui), 1);
  for (const el of ui.elements) {
    assert.ok(TOKENS.color.includes(el.fg));
    assert.ok(TOKENS.color.includes(el.bg));
    assert.ok(TOKENS.fontPx.includes(el.fontPx));
    assert.ok(TOKENS.spacingPx.includes(el.padPx));
    assert.ok(TOKENS.radiusPx.includes(el.radiusPx));
  }
});

test('components mode is fully on-system on every fixture', () => {
  for (const req of REQUESTS) {
    const ui = generate(req, 'components');
    assert.equal(tokenCompliance(ui), 1, req.id);
    assert.equal(layoutMatch(ui, req), 1, req.id);
  }
});

test('screenshot mode copies layout but loses the system', () => {
  const ui = generate(checkout, 'screenshot', { seed: 7 });
  assert.equal(layoutMatch(ui, checkout), 1);
  assert.ok(tokenCompliance(ui) < 0.5, 'perturbed colors are off-token');
});

test('text mode is the weakest on compliance and layout', () => {
  const ui = generate(settings, 'text', { seed: 7 });
  assert.ok(tokenCompliance(ui) < 0.4);
  assert.ok(layoutMatch(ui, settings) < 1);
});

test('unknown mode throws', () => {
  assert.throws(() => generate(settings, 'nonsense'), /unknown generation mode/);
});

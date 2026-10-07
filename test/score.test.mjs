import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, relLuminance } from '../public/tokens.mjs';
import { tokenCompliance, a11yScore, layoutMatch, diffUi, scoreUi } from '../public/score.mjs';
import { REQUESTS, APPROVED_BASELINE } from '../public/examples.mjs';

const [settings] = REQUESTS;

test('contrast math matches WCAG reference values', () => {
  assert.equal(Math.round(contrastRatio('#FFFFFF', '#000000')), 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
  assert.ok(relLuminance('#FFFFFF') > relLuminance('#000000'));
  assert.ok(contrastRatio('#1E2A32', '#FFFFFF') >= 4.5, 'ink on white passes AA');
});

test('a11yScore flags low contrast, small fonts, small targets', () => {
  const ui = { elements: [
    { id: 'bad', type: 'text', fg: '#CCCCCC', bg: '#FFFFFF', fontPx: 16, padPx: 8 },
    { id: 'tiny', type: 'text', fg: '#1E2A32', bg: '#FFFFFF', fontPx: 10, padPx: 8 },
    { id: 'small-target', type: 'button', fg: '#FFFFFF', bg: '#245B78', fontPx: 14, padPx: 2 },
    { id: 'good', type: 'button', fg: '#FFFFFF', bg: '#245B78', fontPx: 14, padPx: 12 },
  ] };
  const { score, failures } = a11yScore(ui);
  assert.ok(score < 1);
  assert.equal(failures.length, 3);
  assert.ok(failures.some((f) => f.startsWith('bad: contrast')));
  assert.ok(failures.some((f) => f.startsWith('tiny: font')));
  assert.ok(failures.some((f) => f.startsWith('small-target: target')));
});

test('a11yScore passes an all-valid spec', () => {
  const { score, failures } = a11yScore(APPROVED_BASELINE);
  assert.equal(score, 1);
  assert.equal(failures.length, 0);
});

test('layoutMatch rewards correct order and coverage', () => {
  const perfect = { elements: settings.elements.map((e) => ({ ...e })) };
  assert.equal(layoutMatch(perfect, settings), 1);
  const reversed = { elements: [...settings.elements].reverse() };
  assert.ok(layoutMatch(reversed, settings) < 1);
});

test('tokenCompliance counts off-token values', () => {
  const on = { elements: [{ id: 'a', type: 'text', fg: '#1E2A32', bg: '#FFFFFF', fontPx: 16, padPx: 8, radiusPx: 4 }] };
  const off = { elements: [{ id: 'a', type: 'text', fg: '#123456', bg: '#FFFFFF', fontPx: 16, padPx: 8, radiusPx: 4 }] };
  assert.equal(tokenCompliance(on), 1);
  assert.equal(tokenCompliance(off), 0.8);
});

test('diffUi reports drifted properties and added/missing elements', () => {
  const mutated = JSON.parse(JSON.stringify(APPROVED_BASELINE));
  mutated.elements[2].bg = '#FF00FF';
  mutated.elements[4].padPx = 99;
  mutated.elements.push({ id: 'extra', type: 'text', slot: 'main' });
  mutated.elements = mutated.elements.filter((e) => e.id !== 'digest');
  const drifts = diffUi(APPROVED_BASELINE, mutated);
  assert.ok(drifts.some((d) => d.id === 'save' && d.prop === 'bg' && d.after === '#FF00FF'));
  assert.ok(drifts.some((d) => d.id === 'danger-note' && d.prop === 'padPx' && d.after === 99));
  assert.ok(drifts.some((d) => d.id === 'extra' && d.after === 'added'));
  assert.ok(drifts.some((d) => d.id === 'digest' && d.after === 'missing'));
});

test('scoreUi combines axes into a weighted overall', () => {
  const s = scoreUi(APPROVED_BASELINE, settings);
  assert.equal(s.overall, 1);
  assert.equal(s.compliance, 1);
  assert.equal(s.a11y, 1);
  assert.equal(s.layout, 1);
});

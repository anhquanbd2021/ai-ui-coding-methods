// Mechanical scoring for generated UI specs — the checks a screenshot
// glance cannot do: token compliance, accessibility, layout fidelity,
// and regression diffing.

import { TOKENS, A11Y, INTERACTIVE, TEXT_BEARING, contrastRatio } from './tokens.mjs';

const round2 = (n) => Math.round(n * 100) / 100;

// Fraction of style values that are real tokens (color, spacing, radius,
// type scale). Off-system values are what make AI output look "almost".
export function tokenCompliance(ui) {
  const checks = [];
  for (const el of ui.elements) {
    checks.push(TOKENS.color.includes(el.fg), TOKENS.color.includes(el.bg),
      TOKENS.fontPx.includes(el.fontPx), TOKENS.spacingPx.includes(el.padPx),
      TOKENS.radiusPx.includes(el.radiusPx));
  }
  const pass = checks.filter(Boolean).length;
  return checks.length ? round2(pass / checks.length) : 0;
}

// Per-element accessibility: AA contrast on text-bearing elements,
// minimum font size, minimum hit-target height for interactive ones.
export function a11yScore(ui) {
  const failures = [];
  let checks = 0, pass = 0;
  for (const el of ui.elements) {
    if (TEXT_BEARING.has(el.type)) {
      checks++;
      const ratio = contrastRatio(el.fg, el.bg);
      if (ratio >= A11Y.minContrast) pass++;
      else failures.push(`${el.id}: contrast ${round2(ratio)}:1 < ${A11Y.minContrast}:1`);
      checks++;
      if (el.fontPx >= A11Y.minFontPx) pass++;
      else failures.push(`${el.id}: font ${el.fontPx}px < ${A11Y.minFontPx}px`);
    }
    if (INTERACTIVE.has(el.type)) {
      checks++;
      const target = el.fontPx + 2 * el.padPx;
      if (target >= A11Y.minTargetPx) pass++;
      else failures.push(`${el.id}: target ${target}px < ${A11Y.minTargetPx}px`);
    }
  }
  return { score: checks ? round2(pass / checks) : 1, failures };
}

// Did the generator keep the requested structure? Position-wise match of
// each element id against the request order.
export function layoutMatch(ui, request) {
  const want = request.elements.map((e) => e.id);
  const got = ui.elements.map((e) => e.id);
  let samePosition = 0;
  for (let i = 0; i < want.length; i++) if (got[i] === want[i]) samePosition++;
  const coverage = got.filter((id) => want.includes(id)).length / want.length;
  return round2((samePosition / want.length) * 0.6 + coverage * 0.4);
}

export function scoreUi(ui, request) {
  const compliance = tokenCompliance(ui);
  const { score: a11y, failures } = a11yScore(ui);
  const layout = layoutMatch(ui, request);
  const overall = round2(0.4 * compliance + 0.3 * a11y + 0.3 * layout);
  return { compliance, a11y, layout, overall, failures };
}

// Regression diff: every property that moved between an approved baseline
// and a re-generated spec, element by element.
export function diffUi(baseline, current) {
  const drifts = [];
  const base = new Map(baseline.elements.map((e) => [e.id, e]));
  for (const el of current.elements) {
    const before = base.get(el.id);
    if (!before) { drifts.push({ id: el.id, prop: 'element', before: 'missing', after: 'added' }); continue; }
    for (const prop of ['fg', 'bg', 'fontPx', 'padPx', 'radiusPx', 'slot', 'type']) {
      if (before[prop] !== el[prop]) {
        drifts.push({ id: el.id, prop, before: before[prop], after: el[prop] });
      }
    }
  }
  for (const el of baseline.elements) {
    if (!current.elements.some((e) => e.id === el.id)) {
      drifts.push({ id: el.id, prop: 'element', before: 'present', after: 'missing' });
    }
  }
  return drifts;
}

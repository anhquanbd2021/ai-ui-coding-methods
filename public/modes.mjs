// Mode registry + the two "process" modes: the browser-verify loop and
// the screenshot-diff regression check.

import { TOKENS, A11Y, INTERACTIVE, TEXT_BEARING, contrastRatio, relLuminance } from './tokens.mjs';
import { generate } from './generator.mjs';
import { scoreUi, diffUi } from './score.mjs';

export const MODES = [
  { id: 'text', name: 'Text-describe', kind: 'generate',
    blurb: 'One-line brief. The model invents layout and every value.' },
  { id: 'screenshot', name: 'Screenshot imitation', kind: 'generate',
    blurb: 'Reference image copies the structure; the system is guessed.' },
  { id: 'tokens', name: 'Design tokens', kind: 'generate',
    blurb: 'Palette, spacing scale, type scale pasted into the prompt.' },
  { id: 'components', name: 'Component library', kind: 'generate',
    blurb: 'Only library variants may appear — off-system pieces do not exist.' },
  { id: 'spec', name: 'Spec-first wireframe', kind: 'generate',
    blurb: 'A layout contract (slots, order, hierarchy) before pixels.' },
  { id: 'verify', name: 'Browser-verify loop', kind: 'process',
    blurb: 'Generate → score mechanically → fix the worst axis → repeat.' },
  { id: 'diff', name: 'Screenshot-diff check', kind: 'process',
    blurb: 'Re-render after changes; any drift from the approved UI is flagged.' },
];

const nearest = (value, set) =>
  set.reduce((best, v) => Math.abs(v - value) < Math.abs(best - value) ? v : best, set[0]);

function nearestColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  let best = TOKENS.color[0], bestD = Infinity;
  for (const c of TOKENS.color) {
    const m = parseInt(c.slice(1), 16);
    const d = (v[0] - ((m >> 16) & 255)) ** 2 + (v[1] - ((m >> 8) & 255)) ** 2 + (v[2] - (m & 255)) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// Fixers the verify loop applies — the same corrections an agent makes
// when it renders its own output and checks it mechanically.
const FIXERS = {
  layout(ui, request) {
    const rank = new Map(request.elements.map((e, i) => [e.id, i]));
    ui.elements.sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99));
    return 're-ordered elements to match the requested layout';
  },
  compliance(ui) {
    for (const el of ui.elements) {
      el.fg = nearestColor(el.fg); el.bg = nearestColor(el.bg);
      el.fontPx = nearest(el.fontPx, TOKENS.fontPx);
      el.padPx = nearest(el.padPx, TOKENS.spacingPx);
      el.radiusPx = nearest(el.radiusPx, TOKENS.radiusPx);
    }
    return 'snapped every value to the nearest design token';
  },
  a11y(ui) {
    for (const el of ui.elements) {
      if (TEXT_BEARING.has(el.type)) {
        if (el.fontPx < A11Y.minFontPx) el.fontPx = A11Y.minFontPx;
        if (contrastRatio(el.fg, el.bg) < A11Y.minContrast) {
          // Pick the token that passes: darkest or lightest by luminance.
          const dark = '#1E2A32', light = '#FFFFFF';
          el.fg = relLuminance(el.bg) > 0.4 ? dark : light;
          if (contrastRatio(el.fg, el.bg) < A11Y.minContrast) {
            el.bg = relLuminance(el.fg) > 0.4 ? '#FAFBFC' : '#245B78';
          }
        }
      }
      if (INTERACTIVE.has(el.type)) {
        const need = Math.ceil((A11Y.minTargetPx - el.fontPx) / 2);
        const fit = TOKENS.spacingPx.find((s) => s >= need);
        if (fit !== undefined && el.padPx < fit) el.padPx = fit;
      }
    }
    return 'fixed contrast pairs, minimum font size, and hit targets';
  },
};

// Generate → score → fix worst axis → re-score, until the spec passes or
// the round budget runs out. Returns the final UI plus the full history.
export function generateVerified(request, { seed = 7, maxRounds = 5, target = 0.95 } = {}) {
  const ui = generate(request, 'text', { seed });
  const history = [];
  const fixes = [];
  for (let round = 0; round <= maxRounds; round++) {
    const scores = scoreUi(ui, request);
    history.push({ round, ...scores });
    if (scores.overall >= target || round === maxRounds) break;
    const axes = [['compliance', scores.compliance], ['a11y', scores.a11y], ['layout', scores.layout]];
    const [worst] = axes.sort((a, b) => a[1] - b[1])[0];
    fixes.push({ round, axis: worst, action: FIXERS[worst](ui, request) });
  }
  return { ui, history, fixes };
}

// Regression check: an approved baseline vs a re-generated spec. `drift`
// simulates a "model update" that silently changes properties.
export function diffCheck(request, { baseline, drift = 0, seed = 7 } = {}) {
  const approved = baseline || generate(request, 'components', { seed });
  const current = generate(request, 'components', { seed });
  const drifty = JSON.parse(JSON.stringify(current));
  const targets = drifty.elements.filter((e) => e.type === 'button' || e.type === 'card');
  for (let i = 0; i < drift && i < targets.length; i++) {
    targets[i].bg = '#7C3AED'; // off-token purple — a silent redesign
    targets[i].padPx = targets[i].padPx + 7;
  }
  return { baseline: approved, current: drifty, drifts: diffUi(approved, drifty) };
}

export function runMode(request, modeId, opts = {}) {
  const mode = MODES.find((m) => m.id === modeId);
  if (!mode) throw new Error(`unknown mode: ${modeId}`);
  if (modeId === 'verify') {
    const { ui, history, fixes } = generateVerified(request, opts);
    return { mode, ui, scores: history.at(-1), history, fixes };
  }
  if (modeId === 'diff') {
    const result = diffCheck(request, opts);
    return { mode, ...result, scores: scoreUi(result.current, request) };
  }
  const ui = generate(request, modeId, opts);
  return { mode, ui, scores: scoreUi(ui, request) };
}

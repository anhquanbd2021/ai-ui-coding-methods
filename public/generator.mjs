// Seeded mock "AI UI generator". Each input mode models a real prompting
// style: what it sees, what it is free to invent, and where it drifts.
// Deterministic (mulberry32) so scores are reproducible in tests.

import { TOKENS, componentStyle } from './tokens.mjs';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

function randomHex(rand) {
  const c = () => randInt(rand, 0, 255).toString(16).padStart(2, '0');
  return `#${c()}${c()}${c()}`.toUpperCase();
}

// Screenshot mode "sees" the reference palette but approximates it —
// real vision-guided generation lands near, not on, the token.
function perturbHex(rand, hex) {
  const n = parseInt(hex.slice(1), 16);
  const j = (v) => Math.max(0, Math.min(255, v + randInt(rand, -32, 32)));
  const to = (v) => j(v).toString(16).padStart(2, '0');
  return `#${to((n >> 16) & 255)}${to((n >> 8) & 255)}${to(n & 255)}`.toUpperCase();
}

function shuffled(rand, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function baseElement(el, style) {
  return {
    id: el.id, type: el.type, slot: el.slot, label: el.label,
    intent: el.intent || null, ...style,
  };
}

// Mode: a vague one-line brief. Layout order and every value are invented.
function genText(request, rand) {
  const elements = shuffled(rand, request.elements).map((el) =>
    baseElement(el, {
      fg: randomHex(rand), bg: randomHex(rand),
      fontPx: randInt(rand, 9, 26), padPx: randInt(rand, 0, 26),
      radiusPx: randInt(rand, 0, 24),
    }));
  return { request: request.id, mode: 'text', elements };
}

// Mode: a reference screenshot. Structure copies cleanly; the system
// (tokens, hierarchy) is guessed — near-right colors, arbitrary metrics.
function genScreenshot(request, rand) {
  const plausible = ['#245B78', '#FFFFFF', '#1E2A32', '#FAFBFC', '#8AA0AE'];
  const elements = request.elements.map((el) =>
    baseElement(el, {
      fg: perturbHex(rand, el.type === 'card' ? '#FFFFFF' : pick(rand, plausible)),
      bg: perturbHex(rand, pick(rand, ['#FFFFFF', '#FAFBFC', '#245B78'])),
      fontPx: randInt(rand, 11, 22), padPx: randInt(rand, 4, 22),
      radiusPx: randInt(rand, 0, 20),
    }));
  return { request: request.id, mode: 'screenshot', elements };
}

// Mode: design tokens pasted into the prompt. Every value is on-system,
// but fg/bg pairs are still picked independently — contrast can miss.
function genTokens(request, rand) {
  const elements = request.elements.map((el) =>
    baseElement(el, {
      fg: pick(rand, TOKENS.color), bg: pick(rand, TOKENS.color),
      fontPx: pick(rand, TOKENS.fontPx), padPx: pick(rand, TOKENS.spacingPx),
      radiusPx: pick(rand, TOKENS.radiusPx),
    }));
  return { request: request.id, mode: 'tokens', elements };
}

// Mode: spec-first wireframe. The layout contract fixes slot order and
// type hierarchy (heading > body > caption); values stay on tokens.
const TYPE_FONT = { heading: 24, text: 14, button: 14, field: 14, card: 14 };

function genSpec(request, rand) {
  const order = request.wireframe?.slotOrder || [];
  const rank = (el) => {
    const i = order.indexOf(el.slot);
    return i === -1 ? order.length : i;
  };
  const elements = [...request.elements]
    .sort((a, b) => rank(a) - rank(b))
    .map((el) => baseElement(el, {
      fg: el.intent === 'danger' ? '#8C2B36' : '#1E2A32',
      bg: el.type === 'card' ? '#FFFFFF' : '#FAFBFC',
      fontPx: TYPE_FONT[el.type] || 14,
      padPx: pick(rand, TOKENS.spacingPx), radiusPx: pick(rand, TOKENS.radiusPx),
    }));
  return { request: request.id, mode: 'spec', elements };
}

// Mode: component-library constrained. The generator can only assemble
// library variants — every value is a token and every pair is valid.
function genComponents(request) {
  const elements = request.elements.map((el) =>
    baseElement(el, componentStyle(el) || {
      fg: '#1E2A32', bg: '#FFFFFF', fontPx: 14, padPx: 8, radiusPx: 4,
    }));
  return { request: request.id, mode: 'components', elements };
}

export function generate(request, mode, { seed = 7 } = {}) {
  const rand = mulberry32(seed);
  switch (mode) {
    case 'text': return genText(request, rand);
    case 'screenshot': return genScreenshot(request, rand);
    case 'tokens': return genTokens(request, rand);
    case 'spec': return genSpec(request, rand);
    case 'components': return genComponents(request);
    default: throw new Error(`unknown generation mode: ${mode}`);
  }
}

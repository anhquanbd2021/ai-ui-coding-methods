// Design tokens, component library, and WCAG contrast math.
// Shared by the browser UI, the CLI report, and the test suite.

export const TOKENS = {
  // The on-system palette. Anything outside this list is off-system.
  color: ['#FAFBFC', '#FFFFFF', '#245B78', '#48A080', '#EBB042', '#8C2B36', '#1E2A32', '#8AA0AE'],
  spacingPx: [4, 8, 12, 16, 24, 32],
  radiusPx: [0, 4, 8, 16],
  fontPx: [12, 14, 16, 20, 24, 32],
};

export const NAMES = {
  '#FAFBFC': 'page bg', '#FFFFFF': 'surface', '#245B78': 'primary teal',
  '#48A080': 'success green', '#EBB042': 'warning amber', '#8C2B36': 'danger red',
  '#1E2A32': 'ink text', '#8AA0AE': 'dim label',
};

// Component library: each variant ships pre-validated token values, so a
// constrained generator cannot leave the system or fail basic contrast.
export const COMPONENTS = {
  heading: {
    page: { fontPx: 24, fg: '#1E2A32', bg: '#FAFBFC', padPx: 16, radiusPx: 0 },
    section: { fontPx: 20, fg: '#1E2A32', bg: '#FFFFFF', padPx: 12, radiusPx: 0 },
  },
  text: {
    body: { fontPx: 16, fg: '#1E2A32', bg: '#FFFFFF', padPx: 8, radiusPx: 0 },
    onPage: { fontPx: 14, fg: '#1E2A32', bg: '#FAFBFC', padPx: 8, radiusPx: 0 },
  },
  card: {
    surface: { fontPx: 14, fg: '#1E2A32', bg: '#FFFFFF', padPx: 24, radiusPx: 8 },
  },
  button: {
    primary: { fontPx: 14, fg: '#FFFFFF', bg: '#245B78', padPx: 12, radiusPx: 8 },
    danger: { fontPx: 14, fg: '#FFFFFF', bg: '#8C2B36', padPx: 12, radiusPx: 8 },
    quiet: { fontPx: 14, fg: '#245B78', bg: '#FFFFFF', padPx: 12, radiusPx: 8 },
  },
  field: {
    labeled: { fontPx: 14, fg: '#1E2A32', bg: '#FFFFFF', padPx: 12, radiusPx: 4 },
  },
};

// Which component variant an element gets in component-constrained mode.
export function variantFor(element) {
  if (element.type === 'button') return element.intent === 'danger' ? 'danger' : 'primary';
  if (element.type === 'heading') return element.slot === 'header' ? 'page' : 'section';
  if (element.type === 'text') return element.slot === 'footer' || element.slot === 'aside' ? 'onPage' : 'body';
  if (element.type === 'card') return 'surface';
  if (element.type === 'field') return 'labeled';
  return Object.keys(COMPONENTS[element.type] || { default: 1 })[0];
}

export function componentStyle(element) {
  const variants = COMPONENTS[element.type];
  if (!variants) return null;
  return variants[variantFor(element)] || null;
}

// ---- WCAG contrast -------------------------------------------------------

function channel(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const [hi, lo] = [relLuminance(hexA), relLuminance(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// Interactive/text checks a real UI must pass regardless of generation mode.
export const A11Y = { minContrast: 4.5, minFontPx: 12, minTargetPx: 24 };

export const INTERACTIVE = new Set(['button', 'field']);
export const TEXT_BEARING = new Set(['heading', 'text', 'button', 'field']);

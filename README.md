# Prompt-Mode Lab — ai-ui-coding-methods demo

A zero-dependency Node 20+ lab that proves the input mode — not the model —
decides the fidelity of AI-generated UI. A deterministic, seeded mock
"generator" produces a UI spec (an element tree with color, spacing, radius,
and type values) for the same request under different input modes, and a
mechanical scorer measures what a screenshot glance cannot: token
compliance, per-element accessibility, layout fidelity, and regression drift.

## The seven modes

| Mode | Kind | What it models |
|---|---|---|
| Text-describe | generate | One-line brief; layout and every value invented |
| Screenshot imitation | generate | Reference image; structure copies, system guessed |
| Design tokens | generate | Palette/spacing/type scales pasted into the prompt |
| Component library | generate | Only pre-validated variants can appear |
| Spec-first wireframe | generate | A slot/order contract before any pixels |
| Browser-verify loop | process | Generate → score → fix worst axis → repeat |
| Screenshot-diff check | process | Re-generated spec diffed against an approved baseline |

## Run it

```
npm test        # determinism, scoring axes, verify loop, diff, server
npm run report  # side-by-side scores across all modes + hard assertions
npm run check   # both (used as the Render build command)
npm start       # serve the lab on :3000 (set PORT to change)
```

Open `/` for the interactive lab (mode picker, rendered spec, score table,
verify-loop history, drift report) and `/guide.html` for the mode-by-mode
guide. `GET /health` returns `ok`; `GET /version` returns name/version/commit.

## Layout

```
app/server.js            zero-dep static host + /health + /version (allowlist only)
public/tokens.mjs        design tokens, component variants, WCAG contrast math
public/generator.mjs     seeded mock generator — one function per input mode
public/score.mjs         tokenCompliance, a11yScore, layoutMatch, diffUi
public/modes.mjs         mode registry + generateVerified + diffCheck
public/examples.mjs      fixtures embedded for browser/CLI/tests
public/index.html        lab UI; public/guide.html mode guide
public/app.js            lab wiring
scripts/mode-report.mjs  CLI side-by-side report with assertions (exit 1 on fail)
test/                    node:test suites — `node --test "test/*.test.mjs"`
examples/                settings-page.json, checkout-modal.json, baseline-ui.json
```

## Honest limits

- **Simulated generator.** The modes are modeled by a deterministic mock
  (mulberry32), not a real model — chosen so scores are reproducible in
  tests. The failure patterns (off-system values, contrast misses, layout
  scramble) are real; the exact numbers are illustrative.
- **Scores are proxies.** Token compliance is not visual quality; the a11y
  axis covers contrast, minimum font size, and hit-target height only — not
  keyboard flow, focus order, or screen-reader semantics.
- **Layout match is structural.** It compares element order and coverage,
  not pixel geometry, breakpoints, or overflow.
- **Verify-loop fixers are deterministic.** A real agent's fix can
  introduce new defects — bound the loop and re-score every round.
- **Diff is spec-level.** It diffs the element spec, not rendered pixels;
  a real screenshot-diff pipeline compares rendered output.

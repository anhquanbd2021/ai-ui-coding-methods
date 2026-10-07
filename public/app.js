// Prompt-Mode Lab UI. CSP is 'self' only (no inline styles), so color
// swatches and score bars render through canvas.

import { REQUESTS, APPROVED_BASELINE } from './examples.mjs';
import { MODES, runMode, generateVerified, diffCheck } from './modes.mjs';
import { scoreUi } from './score.mjs';
import { contrastRatio, NAMES } from './tokens.mjs';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toFixed(2);
let selectedMode = 'text';
let selectedFixture = REQUESTS[0];

function swatch(hex) {
  const c = document.createElement('canvas');
  c.className = 'swatch';
  c.width = c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 16, 16);
  c.title = hex;
  return c;
}

function bar(score) {
  const c = document.createElement('canvas');
  c.width = 240; c.height = 14;
  c.style.width = '100%'; // layout only; drawing buffer is fixed
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d151b';
  ctx.fillRect(0, 0, 240, 14);
  ctx.fillStyle = score >= 0.9 ? '#48A080' : score >= 0.6 ? '#EBB042' : '#c0504d';
  ctx.fillRect(0, 0, Math.round(240 * Math.max(0, Math.min(1, score))), 14);
  return c;
}

function renderScores(scores) {
  $('overall').textContent = `overall ${fmt(scores.overall)}`;
  $('overall').className = `badge ${scores.overall >= 0.9 ? 'pass' : scores.overall >= 0.6 ? 'warn' : 'fail'}`;
  const wrap = $('scorebars');
  wrap.replaceChildren();
  for (const [label, val] of [['tokens', scores.compliance], ['a11y', scores.a11y], ['layout', scores.layout], ['overall', scores.overall]]) {
    const l = document.createElement('span'); l.className = 'lbl'; l.textContent = label;
    const b = bar(val);
    const v = document.createElement('span'); v.className = 'val'; v.textContent = fmt(val);
    wrap.append(l, b, v);
  }
}

function renderSpec(ui) {
  const list = $('spec');
  list.replaceChildren();
  for (const el of ui.elements) {
    const li = document.createElement('li');
    li.className = 'spec-el';
    const row = document.createElement('div');
    row.className = 'row';
    const id = document.createElement('span'); id.className = 'eid'; id.textContent = el.id;
    const type = document.createElement('span'); type.className = 'etype'; type.textContent = `${el.type} · ${el.slot}`;
    row.append(id, type, swatch(el.fg), swatch(el.bg));
    for (const [k, v] of [['font', `${el.fontPx}px`], ['pad', `${el.padPx}px`], ['radius', `${el.radiusPx}px`]]) {
      const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = `${k} ${v}`;
      row.append(chip);
    }
    const name = document.createElement('span'); name.className = 'chip';
    const fgName = NAMES[el.fg], bgName = NAMES[el.bg];
    name.textContent = fgName && bgName ? `${fgName} on ${bgName}` : 'off-token';
    row.append(name);
    li.append(row);
    const ratio = document.createElement('div');
    ratio.className = 'muted';
    ratio.textContent = `contrast ${contrastRatio(el.fg, el.bg).toFixed(2)}:1 — "${el.label}"`;
    li.append(ratio);
    list.append(li);
  }
}

function renderFailures(failures) {
  const box = $('failures');
  box.replaceChildren();
  if (!failures || !failures.length) return;
  const head = document.createElement('div');
  head.innerHTML = `<strong>${failures.length} mechanical check${failures.length === 1 ? '' : 's'} failed</strong>`;
  box.append(head);
  for (const f of failures) {
    const d = document.createElement('div');
    d.textContent = `✕ ${f}`;
    box.append(d);
  }
}

function runOne() {
  const result = runMode(selectedFixture, selectedMode, { seed: 7, baseline: APPROVED_BASELINE, drift: 2 });
  if (result.ui) {
    renderSpec(result.ui);
    renderScores(result.scores);
    renderFailures(result.scores.failures);
  } else if (result.history) {
    renderHistory(result);
  } else {
    renderDrifts(result.drifts);
  }
}

function renderHistory(result) {
  const list = $('history');
  list.replaceChildren();
  for (const h of result.history) {
    const li = document.createElement('li');
    const fix = result.fixes.find((f) => f.round === h.round);
    li.textContent = `round ${h.round}: overall ${fmt(h.overall)} (tokens ${fmt(h.compliance)} · a11y ${fmt(h.a11y)} · layout ${fmt(h.layout)})`;
    if (fix) {
      const note = document.createElement('div');
      note.className = 'fix-note';
      note.textContent = `→ ${fix.action}`;
      li.append(note);
    }
    list.append(li);
  }
  renderSpec(result.ui);
  renderScores(result.scores);
  renderFailures(result.scores.failures);
}

function renderDrifts(drifts) {
  const list = $('drifts');
  list.replaceChildren();
  if (!drifts.length) {
    const li = document.createElement('li');
    li.textContent = 'no drift — regeneration matches the approved baseline';
    li.style.borderLeftColor = '#48A080';
    list.append(li);
    return;
  }
  for (const d of drifts) {
    const li = document.createElement('li');
    li.textContent = `${d.id}.${d.prop}: ${d.before} → ${d.after}`;
    list.append(li);
  }
}

function runAll() {
  const tbody = document.querySelector('#side-table tbody');
  tbody.replaceChildren();
  const rows = [];
  for (const mode of MODES.filter((m) => m.kind === 'generate')) {
    const { scores } = runMode(selectedFixture, mode.id, { seed: 7 });
    rows.push([mode.name, scores]);
  }
  const verified = generateVerified(selectedFixture, { seed: 7 });
  rows.push(['verify (final round)', verified.history.at(-1)]);
  const best = Math.max(...rows.map(([, s]) => s.overall));
  for (const [name, s] of rows) {
    const tr = document.createElement('tr');
    if (s.overall === best) tr.className = 'best';
    for (const cell of [name, s.compliance, s.a11y, s.layout, s.overall]) {
      const td = document.createElement('td');
      if (typeof cell === 'number') { td.className = 'num'; td.textContent = fmt(cell); }
      else td.textContent = cell;
      tr.append(td);
    }
    tbody.append(tr);
  }
}

function init() {
  const sel = $('fixture');
  for (const req of REQUESTS) {
    const o = document.createElement('option');
    o.value = req.id; o.textContent = req.title;
    sel.append(o);
  }
  sel.addEventListener('change', () => {
    selectedFixture = REQUESTS.find((r) => r.id === sel.value) || REQUESTS[0];
  });

  const box = $('modes');
  for (const mode of MODES.filter((m) => m.kind === 'generate')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-btn' + (mode.id === selectedMode ? ' active' : '');
    b.dataset.mode = mode.id;
    const name = document.createElement('span'); name.textContent = mode.name;
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = mode.id;
    b.append(name, tag);
    b.title = mode.blurb;
    b.addEventListener('click', () => {
      selectedMode = mode.id;
      for (const el of box.querySelectorAll('.mode-btn')) {
        el.classList.toggle('active', el.dataset.mode === mode.id);
      }
    });
    box.append(b);
  }

  $('run').addEventListener('click', runOne);
  $('run-all').addEventListener('click', runAll);
  $('run-verify').addEventListener('click', () => renderHistory(runMode(selectedFixture, 'verify', { seed: 7 })));
  $('run-diff').addEventListener('click', () => {
    const { drifts } = diffCheck(REQUESTS[0], { baseline: APPROVED_BASELINE, drift: 2 });
    renderDrifts(drifts);
  });

  runOne();
  runAll();
}

init();

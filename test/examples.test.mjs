import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { RAW, REQUESTS, APPROVED_BASELINE } from '../public/examples.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('embedded examples match files on disk', async () => {
  const norm = (s) => s.replace(/\r\n/g, '\n').trim();
  for (const [file, raw] of Object.entries(RAW)) {
    const disk = await readFile(`${root}examples/${file}`, 'utf8');
    assert.equal(norm(raw), norm(disk), file);
  }
});

test('requests are well-formed and reference a wireframe', () => {
  for (const req of REQUESTS) {
    assert.ok(req.id && req.title && req.brief);
    assert.ok(req.elements.length >= 4);
    assert.ok(Array.isArray(req.wireframe.slotOrder));
    for (const el of req.elements) {
      assert.ok(el.id && el.type && el.slot && el.label, el.id);
    }
  }
});

test('approved baseline is a components-mode spec of the settings page', () => {
  assert.equal(APPROVED_BASELINE.request, 'settings-page');
  assert.equal(APPROVED_BASELINE.mode, 'components');
  assert.equal(APPROVED_BASELINE.elements.length, REQUESTS[0].elements.length);
});

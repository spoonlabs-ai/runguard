import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { validateEvent } from '../lib/trace-validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bin = resolve(__dirname, '..', 'bin', 'runguard.js');

test('run_start + run_end trace events emitted and schema-valid', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'runguard-trace-'));
  const trace = resolve(dir, 'trace.jsonl');
  const cfg = resolve(dir, '.runguard.yaml');
  writeFileSync(cfg, JSON.stringify({ version: 1, limits: { wallClockSec: 2 }, execution: { cwd: dir } }, null, 2));

  const r = spawnSync('node', [bin, 'exec', '--config', cfg, '--trace-file', trace, '--', 'node', '-e', "console.log('ok')"], { encoding: 'utf-8' });
  assert.equal(r.status, 0);

  const lines = readFileSync(trace, 'utf-8').trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 2);

  const events = lines.map((l) => JSON.parse(l));
  assert.equal(events[0].event, 'run_start');
  assert.equal(events[1].event, 'run_end');
  assert.equal(events[0].seq, 1);
  assert.equal(events[1].seq, 2);
  assert.equal(events[0].run_id, events[1].run_id);
  assert.equal(events[1].data.summary.total_tokens, 0);
  assert.equal(events[1].data.summary.total_cost_usd, 0);

  for (const evt of events) {
    const v = validateEvent(evt);
    assert.equal(v.ok, true, `event invalid: ${v.errors.join('; ')}`);
  }
});

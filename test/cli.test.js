import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bin = resolve(__dirname, '..', 'bin', 'runguard.js');

function readEvents(tracePath) {
  return readFileSync(tracePath, 'utf-8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('help runs', () => {
  const r = spawnSync('node', [bin, '--help'], { encoding: 'utf-8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /RunGuard/);
});

test('exec runs command', () => {
  const r = spawnSync('node', [bin, 'exec', '--', 'node', '-e', "console.log('ok')"], { encoding: 'utf-8' });
  assert.equal(r.status, 0);
});

test('exec propagates exit code', () => {
  const r = spawnSync('node', [bin, 'exec', '--', 'node', '-e', 'process.exit(7)'], { encoding: 'utf-8' });
  assert.equal(r.status, 7);
});

test('invalid config fails fast', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'runguard-test-'));
  const cfg = resolve(dir, '.runguard.yaml');
  writeFileSync(cfg, 'version: 1\n');
  const r = spawnSync('node', [bin, 'exec', '--config', cfg, '--', 'node', '-e', "console.log('ok')"], { encoding: 'utf-8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Invalid config/);
});

test('budget warnings emit at 80% and 90% thresholds', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'runguard-budget-warn-'));
  const cfg = resolve(dir, '.runguard.yaml');
  const trace = resolve(dir, 'trace.jsonl');
  writeFileSync(cfg, JSON.stringify({ version: 1, limits: { tokenMax: 1000 } }, null, 2));

  const mockCalls = JSON.stringify([
    { model: 'openai/gpt-5.2', prompt_tokens: 500, completion_tokens: 300, total_tokens: 800 },
    { model: 'openai/gpt-5.2', prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 },
  ]);

  const r = spawnSync('node', [bin, 'exec', '--config', cfg, '--trace-file', trace, '--', 'node', '-e', 'process.exit(0)'], {
    encoding: 'utf-8',
    env: { ...process.env, RUNGUARD_LLM_CALLS_JSON: mockCalls },
  });

  assert.equal(r.status, 0);
  const events = readEvents(trace);
  const warns = events.filter((e) => e.event === 'budget_warn');
  assert.equal(warns.length, 2);
  assert.deepEqual(warns.map((w) => w.data.threshold), [0.8, 0.9]);

  const runEnd = events.find((e) => e.event === 'run_end');
  assert.equal(runEnd.data.status, 'success');
  assert.equal(runEnd.data.summary.total_tokens, 900);
});

test('hard kill triggers on token budget cap with budget_kill event and run_end reason', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'runguard-budget-kill-token-'));
  const cfg = resolve(dir, '.runguard.yaml');
  const trace = resolve(dir, 'trace.jsonl');
  const sentinel = resolve(dir, 'should-not-exist.txt');
  writeFileSync(cfg, JSON.stringify({ version: 1, limits: { tokenMax: 1000 } }, null, 2));

  const mockCalls = JSON.stringify([
    { model: 'openai/gpt-5.2', prompt_tokens: 1000, completion_tokens: 0, total_tokens: 1000 },
  ]);

  const r = spawnSync('node', [
    bin, 'exec', '--config', cfg, '--trace-file', trace, '--',
    'node', '-e', `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'ran')`,
  ], {
    encoding: 'utf-8',
    env: { ...process.env, RUNGUARD_LLM_CALLS_JSON: mockCalls },
  });

  assert.equal(r.status, 137);
  assert.equal(existsSync(sentinel), false);

  const events = readEvents(trace);
  assert.ok(events.some((e) => e.event === 'budget_kill'));
  const killEvent = events.find((e) => e.event === 'budget_kill');
  assert.equal(killEvent.data.budget_type, 'tokens');

  const runEnd = events.find((e) => e.event === 'run_end');
  assert.equal(runEnd.data.status, 'killed');
  assert.equal(runEnd.data.kill.reason, 'token budget exceeded');
});

test('hard kill triggers on cost budget cap', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'runguard-budget-kill-cost-'));
  const cfg = resolve(dir, '.runguard.yaml');
  const trace = resolve(dir, 'trace.jsonl');
  writeFileSync(cfg, JSON.stringify({ version: 1, limits: { costUsdMax: 0.01 } }, null, 2));

  const mockCalls = JSON.stringify([
    { model: 'openai/gpt-5.2', prompt_tokens: 1000, completion_tokens: 500 },
  ]);

  const r = spawnSync('node', [bin, 'exec', '--config', cfg, '--trace-file', trace, '--', 'node', '-e', 'process.exit(0)'], {
    encoding: 'utf-8',
    env: { ...process.env, RUNGUARD_LLM_CALLS_JSON: mockCalls },
  });

  assert.equal(r.status, 137);

  const events = readEvents(trace);
  const killEvent = events.find((e) => e.event === 'budget_kill');
  assert.equal(killEvent.data.budget_type, 'cost_usd');

  const runEnd = events.find((e) => e.event === 'run_end');
  assert.equal(runEnd.data.status, 'killed');
  assert.equal(runEnd.data.kill.reason, 'cost budget exceeded');
});

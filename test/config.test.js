import test from 'node:test';
import assert from 'node:assert/strict';
import { parseConfigText } from '../lib/config.js';

test('valid config parses', () => {
  const cfg = parseConfigText(JSON.stringify({
    version: 1,
    limits: { wallClockSec: 10, tokenMax: 1000, costUsdMax: 1.5 },
    execution: { cwd: '.' },
  }));

  assert.equal(cfg.version, 1);
  assert.equal(cfg.limits.wallClockSec, 10);
  assert.equal(cfg.execution.cwd, '.');
});

test('unknown keys rejected', () => {
  assert.throws(() => parseConfigText(JSON.stringify({ version: 1, foo: true })), /unknown top-level key/);
});

test('non json-compatible yaml rejected for v0.1', () => {
  assert.throws(() => parseConfigText('version: 1\nlimits:\n  wallClockSec: 10\n'), /JSON-compatible YAML/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bin = resolve(__dirname, '..', 'bin', 'runguard.js');

test('help runs', () => {
  const r = spawnSync('node', [bin, '--help'], { encoding: 'utf-8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /RunGuard/);
});

test('exec runs command', () => {
  const r = spawnSync('node', [bin, 'exec', '--', 'node', '-e', "console.log('ok')"], { encoding: 'utf-8' });
  assert.equal(r.status, 0);
});

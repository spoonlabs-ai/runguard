import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const CONFIG_VERSION = 1;

function fail(msg) {
  const err = new Error(`Invalid config: ${msg}`);
  err.code = 'RG_CONFIG_INVALID';
  return err;
}

function toNumber(v, path, { integer = false, min } = {}) {
  if (v == null) return undefined;
  if (typeof v !== 'number' || Number.isNaN(v)) throw fail(`${path} must be a number`);
  if (integer && !Number.isInteger(v)) throw fail(`${path} must be an integer`);
  if (min != null && v < min) throw fail(`${path} must be >= ${min}`);
  return v;
}

export function parseConfigText(text, source = '.runguard.yaml') {
  // YAML 1.2 is a superset of JSON. For v0.1 we lock schema and accept
  // JSON-compatible YAML to keep parser deterministic with zero deps.
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw fail(`${source} must be JSON-compatible YAML for v0.1`);
  }

  if (typeof raw !== 'object' || raw == null || Array.isArray(raw)) {
    throw fail('root must be an object');
  }

  const allowedRoot = new Set(['version', 'limits', 'execution']);
  for (const k of Object.keys(raw)) {
    if (!allowedRoot.has(k)) throw fail(`unknown top-level key: ${k}`);
  }

  const version = raw.version ?? CONFIG_VERSION;
  if (version !== CONFIG_VERSION) throw fail(`version must be ${CONFIG_VERSION}`);

  const limits = raw.limits ?? {};
  if (typeof limits !== 'object' || limits == null || Array.isArray(limits)) {
    throw fail('limits must be an object');
  }
  const allowedLimits = new Set(['wallClockSec', 'stepMax', 'tokenMax', 'costUsdMax']);
  for (const k of Object.keys(limits)) {
    if (!allowedLimits.has(k)) throw fail(`unknown limits key: ${k}`);
  }

  const execution = raw.execution ?? {};
  if (typeof execution !== 'object' || execution == null || Array.isArray(execution)) {
    throw fail('execution must be an object');
  }
  const allowedExecution = new Set(['cwd']);
  for (const k of Object.keys(execution)) {
    if (!allowedExecution.has(k)) throw fail(`unknown execution key: ${k}`);
  }
  if (execution.cwd != null && typeof execution.cwd !== 'string') {
    throw fail('execution.cwd must be a string');
  }

  return {
    version,
    limits: {
      wallClockSec: toNumber(limits.wallClockSec, 'limits.wallClockSec', { integer: true, min: 1 }),
      stepMax: toNumber(limits.stepMax, 'limits.stepMax', { integer: true, min: 1 }),
      tokenMax: toNumber(limits.tokenMax, 'limits.tokenMax', { integer: true, min: 1 }),
      costUsdMax: toNumber(limits.costUsdMax, 'limits.costUsdMax', { min: 0 }),
    },
    execution: {
      cwd: execution.cwd,
    },
  };
}

export function loadConfig(configPath = '.runguard.yaml') {
  const abs = resolve(configPath);
  if (!existsSync(abs)) return { path: abs, config: null };
  const text = readFileSync(abs, 'utf8');
  return { path: abs, config: parseConfigText(text, configPath) };
}

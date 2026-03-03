#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../lib/config.js';
import { validateEvent } from '../lib/trace-validate.js';
import { initRunReceipt } from '../lib/token-accounting.js';

function usage(exitCode = 0) {
  const msg = `RunGuard — runtime safety wrapper for agents.

Usage:
  runguard --help
  runguard exec -- <cmd> [args...]

Options:
  --cwd <dir>          Working directory
  --timeout <sec>      Wall-clock timeout (seconds)
  --config <path>      Config file (default: .runguard.yaml)
  --trace-file <path>  JSONL trace output path (default: .runguard-trace.jsonl)
`;
  process.stdout.write(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {
    cmd: null,
    cmdArgs: [],
    cwd: undefined,
    timeout: undefined,
    configPath: '.runguard.yaml',
    traceFile: '.runguard-trace.jsonl',
  };
  const args = [...argv];

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return { kind: 'help' };
  }

  const sub = args.shift();
  if (sub !== 'exec') {
    return { kind: 'error', message: `Unknown command: ${sub}` };
  }

  while (args.length) {
    const a = args.shift();
    if (a === '--') break;
    if (a === '--cwd') { out.cwd = args.shift(); continue; }
    if (a === '--timeout') { const v = args.shift(); out.timeout = v ? Number(v) : undefined; continue; }
    if (a === '--config') { const v = args.shift(); out.configPath = v || '.runguard.yaml'; continue; }
    if (a === '--trace-file') { const v = args.shift(); out.traceFile = v || '.runguard-trace.jsonl'; continue; }
    return { kind: 'error', message: `Unknown option: ${a}` };
  }

  out.cmd = args.shift();
  out.cmdArgs = args;
  if (!out.cmd) return { kind: 'error', message: 'No command provided. Use: runguard exec -- <cmd>' };

  return { kind: 'exec', ...out };
}

function nowIso() { return new Date().toISOString(); }

function emitTrace(tracePath, evt) {
  const checked = validateEvent(evt);
  if (!checked.ok) {
    process.stderr.write(`runguard: invalid trace event: ${checked.errors.join('; ')}\n`);
    return;
  }
  appendFileSync(tracePath, `${JSON.stringify(evt)}\n`, 'utf8');
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.kind === 'help') usage(0);
if (parsed.kind === 'error') {
  process.stderr.write(`runguard: ${parsed.message}\n`);
  usage(2);
}

let fileConfig = null;
try {
  fileConfig = loadConfig(parsed.configPath).config;
} catch (e) {
  process.stderr.write(`runguard: ${e.message}\n`);
  process.exit(2);
}

const effectiveTimeoutSec = parsed.timeout ?? fileConfig?.limits?.wallClockSec;
const effectiveCwd = parsed.cwd ?? fileConfig?.execution?.cwd;
const tracePath = resolve(parsed.traceFile);
const runId = `rg_${randomUUID()}`;
let seq = 0;
const receipt = initRunReceipt();
const cmdAll = [parsed.cmd, ...parsed.cmdArgs];

emitTrace(tracePath, {
  v: '0.1', event: 'run_start', ts: nowIso(), run_id: runId, seq: ++seq,
  data: { cmd: cmdAll, timeout_s: effectiveTimeoutSec ?? null, limits: fileConfig?.limits ?? {} },
});

const timeoutMs = effectiveTimeoutSec != null && !Number.isNaN(effectiveTimeoutSec)
  ? Math.round(effectiveTimeoutSec * 1000)
  : undefined;

const started = Date.now();
const res = spawnSync(parsed.cmd, parsed.cmdArgs, { stdio: 'inherit', cwd: effectiveCwd, timeout: timeoutMs });
const duration = Date.now() - started;

let status = 'success';
let exitCode = res.status ?? 1;
if (res.error && res.error.code === 'ETIMEDOUT') { status = 'timeout'; exitCode = 124; }
else if (res.error) { status = 'error'; exitCode = 1; }
else if (exitCode !== 0) { status = 'error'; }

emitTrace(tracePath, {
  v: '0.1', event: 'run_end', ts: nowIso(), run_id: runId, seq: ++seq,
  data: { status, exit_code: exitCode, duration_ms: duration, summary: receipt },
});

if (res.error) {
  if (res.error.code === 'ETIMEDOUT') {
    process.stderr.write('runguard: timeout\n');
    process.exit(124);
  }
  process.stderr.write(`runguard: ${res.error.message}\n`);
  process.exit(1);
}

process.exit(exitCode);

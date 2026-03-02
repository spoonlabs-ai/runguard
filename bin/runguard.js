#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function usage(exitCode = 0) {
  const msg = `RunGuard — runtime safety wrapper for agents.

Usage:
  runguard --help
  runguard exec -- <cmd> [args...]

Options:
  --cwd <dir>       Working directory
  --timeout <sec>   Wall-clock timeout (seconds)

Gate A: CLI skeleton only. Enforcement features ship in follow-up milestones.
`;
  process.stdout.write(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = { cmd: null, cmdArgs: [], cwd: undefined, timeout: undefined };
  const args = [...argv];

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return { kind: 'help' };
  }

  const sub = args.shift();
  if (sub !== 'exec') {
    return { kind: 'error', message: `Unknown command: ${sub}` };
  }

  // Parse flags until we hit '--'
  while (args.length) {
    const a = args.shift();
    if (a === '--') break;
    if (a === '--cwd') {
      out.cwd = args.shift();
      continue;
    }
    if (a === '--timeout') {
      const v = args.shift();
      out.timeout = v ? Number(v) : undefined;
      continue;
    }
    return { kind: 'error', message: `Unknown option: ${a}` };
  }

  out.cmd = args.shift();
  out.cmdArgs = args;
  if (!out.cmd) return { kind: 'error', message: 'No command provided. Use: runguard exec -- <cmd>' };

  return { kind: 'exec', ...out };
}

const parsed = parseArgs(process.argv.slice(2));

if (parsed.kind === 'help') usage(0);
if (parsed.kind === 'error') {
  process.stderr.write(`runguard: ${parsed.message}\n`);
  usage(2);
}

const timeoutMs = parsed.timeout != null && !Number.isNaN(parsed.timeout)
  ? Math.round(parsed.timeout * 1000)
  : undefined;

const res = spawnSync(parsed.cmd, parsed.cmdArgs, {
  stdio: 'inherit',
  cwd: parsed.cwd,
  timeout: timeoutMs,
});

if (res.error) {
  // Node uses ETIMEDOUT when timeout triggers
  if (res.error.code === 'ETIMEDOUT') {
    process.stderr.write('runguard: timeout\n');
    process.exit(124);
  }
  process.stderr.write(`runguard: ${res.error.message}\n`);
  process.exit(1);
}

process.exit(res.status ?? 1);

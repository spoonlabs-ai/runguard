import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent } from '../lib/trace-validate.js';

function base(event) {
  return {
    v: '0.1',
    event,
    ts: '2026-03-02T22:40:00.000Z',
    run_id: 'rg_01HT_TEST',
    seq: 1,
    data: {}
  };
}

test('valid required events pass', () => {
  for (const ev of ['run_start','llm_call','tool_call','budget_warn','budget_kill','run_end']) {
    const r = validateEvent(base(ev));
    assert.equal(r.ok, true, `${ev} should pass`);
  }
});

test('malformed events fail', () => {
  const r1 = validateEvent(null);
  assert.equal(r1.ok, false);

  const r2 = validateEvent({});
  assert.equal(r2.ok, false);

  const r3 = validateEvent({ ...base('run_start'), v: '0.2' });
  assert.equal(r3.ok, false);

  const r4 = validateEvent({ ...base('run_start'), ts: 'not-a-date' });
  assert.equal(r4.ok, false);

  const r5 = validateEvent({ ...base('run_start'), seq: 0 });
  assert.equal(r5.ok, false);

  const r6 = validateEvent({ ...base('nope') });
  assert.equal(r6.ok, false);
});

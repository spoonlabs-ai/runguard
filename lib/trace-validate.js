// Trace validator for RunGuard Trace Schema v0.1
// See: docs/trace-schema-v0.1.md

const REQUIRED_EVENTS = new Set([
  'run_start',
  'llm_call',
  'tool_call',
  'budget_warn',
  'budget_kill',
  'run_end'
]);

function isPlainObject(x) {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}

function isIsoZ(ts) {
  if (typeof ts !== 'string') return false;
  // minimal check + Date parse
  if (!ts.endsWith('Z')) return false;
  const d = new Date(ts);
  return !Number.isNaN(d.getTime());
}

function validateEvent(evt) {
  const errors = [];

  if (!isPlainObject(evt)) {
    return { ok: false, errors: ['event must be an object'] };
  }

  if (evt.v !== '0.1') errors.push('v must be "0.1"');
  if (typeof evt.event !== 'string') errors.push('event must be a string');
  if (!isIsoZ(evt.ts)) errors.push('ts must be an ISO timestamp ending in Z');
  if (typeof evt.run_id !== 'string' || evt.run_id.length < 3) errors.push('run_id must be a non-empty string');
  if (!Number.isInteger(evt.seq) || evt.seq < 1) errors.push('seq must be an integer >= 1');
  if (!isPlainObject(evt.data)) errors.push('data must be an object');

  if (typeof evt.event === 'string' && !REQUIRED_EVENTS.has(evt.event)) {
    errors.push(`event must be one of: ${Array.from(REQUIRED_EVENTS).join(', ')}`);
  }

  // Minimal per-event checks (v0.1 recommended fields are optional; keep permissive)
  if (evt.event === 'tool_call' && isPlainObject(evt.data)) {
    if (evt.data.tool != null && typeof evt.data.tool !== 'string') errors.push('tool_call.data.tool must be a string if provided');
    if (evt.data.ok != null && typeof evt.data.ok !== 'boolean') errors.push('tool_call.data.ok must be boolean if provided');
  }

  if ((evt.event === 'budget_warn' || evt.event === 'budget_kill') && isPlainObject(evt.data)) {
    if (evt.data.budget_type != null && !['tokens', 'cost_usd'].includes(evt.data.budget_type)) {
      errors.push('budget_*.data.budget_type must be tokens|cost_usd if provided');
    }
  }

  if (evt.event === 'run_end' && isPlainObject(evt.data)) {
    if (evt.data.status != null && !['success', 'error', 'killed', 'timeout'].includes(evt.data.status)) {
      errors.push('run_end.data.status must be success|error|killed|timeout if provided');
    }
  }

  return { ok: errors.length === 0, errors };
}

export { validateEvent, REQUIRED_EVENTS };

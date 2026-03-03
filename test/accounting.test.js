import test from 'node:test';
import assert from 'node:assert/strict';
import { initRunReceipt, ingestLlmCall, initBudgetState, evaluateBudget } from '../lib/token-accounting.js';
import { estimateUsd } from '../lib/pricing.js';

test('estimateUsd uses model table', () => {
  const c = estimateUsd('openai/gpt-5.2', 1000, 500);
  assert.equal(c, 0.0125);
});

test('token accounting ingests llm_call event', () => {
  const receipt = initRunReceipt();
  ingestLlmCall(receipt, {
    event: 'llm_call',
    data: { model: 'openai-codex/gpt-5.3-codex', prompt_tokens: 2000, completion_tokens: 500, total_tokens: 2500 },
  });
  assert.equal(receipt.llm_calls, 1);
  assert.equal(receipt.prompt_tokens, 2000);
  assert.equal(receipt.completion_tokens, 500);
  assert.equal(receipt.total_tokens, 2500);
  assert.equal(receipt.total_cost_usd, 0.014);
});

test('provider-reported cost overrides estimate', () => {
  const receipt = initRunReceipt();
  ingestLlmCall(receipt, {
    event: 'llm_call',
    data: { model: 'unknown/model', prompt_tokens: 100, completion_tokens: 100, total_tokens: 200, cost_usd: 0.123456 },
  });
  assert.equal(receipt.total_cost_usd, 0.123456);
});

test('budget warnings trigger at 80/90 and hard kill at cap', () => {
  const receipt = initRunReceipt();
  const budgetState = initBudgetState();

  ingestLlmCall(receipt, { event: 'llm_call', data: { total_tokens: 800 } });
  const b1 = evaluateBudget(receipt, { tokenMax: 1000 }, budgetState);
  assert.deepEqual(b1.warnings.map((w) => w.threshold), [0.8]);
  assert.equal(b1.kill, null);

  ingestLlmCall(receipt, { event: 'llm_call', data: { total_tokens: 100 } });
  const b2 = evaluateBudget(receipt, { tokenMax: 1000 }, budgetState);
  assert.deepEqual(b2.warnings.map((w) => w.threshold), [0.9]);
  assert.equal(b2.kill, null);

  ingestLlmCall(receipt, { event: 'llm_call', data: { total_tokens: 100 } });
  const b3 = evaluateBudget(receipt, { tokenMax: 1000 }, budgetState);
  assert.equal(b3.warnings.length, 0);
  assert.equal(b3.kill?.budget_type, 'tokens');
  assert.equal(b3.kill?.reason, 'token budget exceeded');
});

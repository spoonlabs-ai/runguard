import test from 'node:test';
import assert from 'node:assert/strict';
import { initRunReceipt, ingestLlmCall } from '../lib/token-accounting.js';
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

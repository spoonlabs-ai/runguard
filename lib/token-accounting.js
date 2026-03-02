import { estimateUsd } from './pricing.js';

export function initRunReceipt() {
  return {
    llm_calls: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    total_cost_usd: 0,
  };
}

export function ingestLlmCall(receipt, evt) {
  const data = evt?.data ?? {};
  const prompt = Number(data.prompt_tokens ?? 0) || 0;
  const completion = Number(data.completion_tokens ?? 0) || 0;
  const total = Number(data.total_tokens ?? (prompt + completion)) || 0;

  // Prefer provider-reported cost, else estimate from model table.
  const reportedCost = data.cost_usd;
  const cost = (typeof reportedCost === 'number' && !Number.isNaN(reportedCost))
    ? reportedCost
    : estimateUsd(data.model, prompt, completion);

  receipt.llm_calls += 1;
  receipt.prompt_tokens += prompt;
  receipt.completion_tokens += completion;
  receipt.total_tokens += total;
  receipt.total_cost_usd = Number((receipt.total_cost_usd + cost).toFixed(6));

  return receipt;
}

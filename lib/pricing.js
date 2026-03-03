// Minimal model pricing table (USD per 1K tokens) for Gate A cost accounting.
// Unknown models default to 0 cost until explicitly configured.

export const MODEL_PRICING_PER_1K = {
  'openai/gpt-5.2': { input: 0.005, output: 0.015 },
  'openai-codex/gpt-5.3-codex': { input: 0.004, output: 0.012 },
  'anthropic/claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'anthropic/claude-opus-4-5': { input: 0.015, output: 0.075 },
};

export function estimateUsd(model, promptTokens = 0, completionTokens = 0) {
  const m = MODEL_PRICING_PER_1K[model];
  if (!m) return 0;
  const inCost = (Math.max(0, promptTokens) / 1000) * m.input;
  const outCost = (Math.max(0, completionTokens) / 1000) * m.output;
  return Number((inCost + outCost).toFixed(6));
}

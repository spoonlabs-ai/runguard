import { estimateUsd } from './pricing.js';

const DEFAULT_WARN_THRESHOLDS = [0.8, 0.9];

export function initRunReceipt() {
  return {
    llm_calls: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    total_cost_usd: 0,
  };
}

export function initBudgetState() {
  return {
    warned: {
      tokens: new Set(),
      cost_usd: new Set(),
    },
    killed: false,
    kill: null,
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

function evaluateDimension({
  budgetType,
  used,
  limit,
  warnedSet,
  warnThresholds,
}) {
  const warnings = [];
  if (typeof limit !== 'number' || Number.isNaN(limit) || limit <= 0) {
    return { warnings, kill: null };
  }

  const ratio = used / limit;
  for (const threshold of warnThresholds) {
    if (ratio >= threshold && !warnedSet.has(threshold)) {
      warnings.push({ budget_type: budgetType, threshold, used, limit });
      warnedSet.add(threshold);
    }
  }

  if (used >= limit) {
    const reason = budgetType === 'tokens' ? 'token budget exceeded' : 'cost budget exceeded';
    return {
      warnings,
      kill: { budget_type: budgetType, used, limit, reason },
    };
  }

  return { warnings, kill: null };
}

export function evaluateBudget(receipt, limits = {}, budgetState = initBudgetState(), warnThresholds = DEFAULT_WARN_THRESHOLDS) {
  if (budgetState.killed) {
    return { warnings: [], kill: budgetState.kill };
  }

  const outWarnings = [];

  const tokenEval = evaluateDimension({
    budgetType: 'tokens',
    used: receipt.total_tokens,
    limit: limits?.tokenMax,
    warnedSet: budgetState.warned.tokens,
    warnThresholds,
  });
  outWarnings.push(...tokenEval.warnings);

  const costEval = evaluateDimension({
    budgetType: 'cost_usd',
    used: receipt.total_cost_usd,
    limit: limits?.costUsdMax,
    warnedSet: budgetState.warned.cost_usd,
    warnThresholds,
  });
  outWarnings.push(...costEval.warnings);

  const kill = tokenEval.kill ?? costEval.kill;
  if (kill) {
    budgetState.killed = true;
    budgetState.kill = kill;
  }

  return { warnings: outWarnings, kill };
}

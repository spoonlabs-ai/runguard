# RunGuard theCompany Execution Loop
Last updated: 2026-03-02

## Purpose
Define exactly how theCompany agents divide work, cycle execution, and report progress for Gate A.

## Agent Ownership (Gate A)
- **Forge (primary builder):** implement core code for all Gate A issues
- **Nova (runtime tester):** run smoke tests, edge-case checks, reproducible failure cases
- **Ledger (evidence + QA):** verify acceptance evidence, CI status, gate packet completeness
- **Echo (comms):** concise checkpoint updates + blocker summaries

## WIP Policy
- Max **1 active issue per agent** at a time
- No agent starts a second issue until first is closed or explicitly blocked
- No work outside milestone **Gate A**

## Issue Cycle (mandatory)
1. Claim one `status:ready` Gate A issue in GitHub
2. Implement only that issue scope
3. Attach artifact + acceptance proof (logs/tests/screenshots/commit)
4. If pass: close issue and move to next
5. If blocked: label `status:blocked`, post blocker + dependency

## Daily Cadence (lightweight)
- Start: sync with GitHub issue board
- Work: single-issue focus by each agent
- End: one concise update containing:
  - closed issues
  - active blocked issues
  - next issue by owner

## Gate Boundary Rule
At Gate A completion:
- Do not start Gate B issues
- Complete **Gate A Exit Review Packet** in GitHub
- Wait for Daniel sign-off

## Escalation Rule
Escalate immediately if:
- provider/tool access missing
- CI failing for >4 hours on P0 work
- acceptance criteria unclear/conflicting

## Non-negotiables
- Product source of truth: GitHub repo
- CLI/API-native architecture (no MCP-first additions)
- Strict stage gates, no auto-advance

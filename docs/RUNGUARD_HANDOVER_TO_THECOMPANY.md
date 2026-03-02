# RunGuard Handover Plan to theCompany
Last updated: 2026-03-02

## Purpose
Define exactly how execution moves from planning to theCompany build execution.

## Source of Truth
- GitHub repo: https://github.com/spoonlabs-ai/runguard
- GitHub milestones = stage gates (A-D)
- GitHub issues = atomic execution tasks

## Handover Steps
1. Freeze planning docs (no new planning unless gate requires)
2. theCompany pulls latest from GitHub repo
3. Execute only Gate A issues labeled `status:ready`
4. Close issues only with acceptance evidence
5. Stop at Gate A completion and prepare Gate A Exit Review Packet issue
6. Await Daniel sign-off before any Gate B work

## Guardrails
- Strict stage gates, no auto-advance
- No MCP-first architecture; CLI/API-native only
- Product code in GitHub repo, not workspace-only
- Report cadence: gate checkpoints (CEO review)

## Required References
- `docs/RUNGUARD_PROGRAM_OPERATING_RULES.md`
- `docs/RUNGUARD_STAGE_GATE_SCORECARD.md`
- `docs/RUNGUARD_DEMAND_SIGNAL_SEGMENT_CHOICE.md`
- `docs/RUNGUARD_REPLAYLAB_OPUS_PLAN_2026-03-02.md`

## Current Status
- Planning execution board created in GitHub
- Ready for theCompany to begin Gate A implementation

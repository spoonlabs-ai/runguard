# RunGuard Program Operating Rules
Last updated: 2026-03-02

## Mission
Single focus program: ship RunGuard Core, then Replay Lab (stage-gated).

## Priority Override
- This program is the only active build focus.
- Any non-program task is deferred unless Daniel explicitly overrides.

## Build Location Rule
- Product source of truth lives in a new GitHub repo.
- Local/theCompany checkouts are execution mirrors only.

## Stage-Gate Rule (Strict)
Do not proceed to the next stage without explicit sign-off.

### Stage A — Foundation
- Repo created
- CLI scaffold works
- Trace schema v0.1 locked
- Config schema locked

### Stage B — Core Safety
- Runtime wrapper
- Token/$/step budget enforcement
- Timeout watchdogs
- Circuit breaker v1
- Trace emission + tests

### Stage C — Pilot Validation
- 3 active pilot users
- Run receipts + alerting stable
- At least one paid pilot/commitment

### Stage D — Replay Lab Kickoff
- Replay scope approved
- Parser + deterministic replay plan accepted

## Task Quality Standard
Every task must include:
1. Owner
2. Deliverable artifact
3. Acceptance test
4. Dependency tag
5. Timebox (<= 2 days preferred)

## Reporting Cadence
- End-of-day: shipped/not shipped + blocker + next task
- Stage gate review: pass/fail evidence + recommendation

# RunGuard Stage Gate Scorecard
Last updated: 2026-03-02

## Rule
Strict gates. No advancement without explicit Daniel sign-off.

## Gate A — Foundation Complete
**Pass criteria (all required):**
- Repo created and buildable (`spoonlabs-ai/runguard`)
- CLI scaffold works (`runguard --help`, `runguard exec -- <cmd>`)
- Trace schema v0.1 locked and documented
- Config schema locked (`.runguard.yaml`)
- Core tests passing in CI for schema + wrapper lifecycle

**Evidence artifacts:**
- Repo link + commit hash
- `docs/trace-schema-v0.1.md`
- `docs/config-schema-v0.1.md`
- CI run URL/screenshot

---

## Gate B — Beta Usable (Raised Standard)
**Pass criteria (all required):**
- 5 unique active pilot customers (weekly active)
- Runtime controls working in real use: timeout + token/$/step kill paths verified
- Webhook alerts stable (no critical missed-alert bug for 7 days)
- At least 100 protected runs total across pilots

**Evidence artifacts:**
- Pilot roster (5 logos/teams)
- Usage export (run counts, kill reasons)
- Incident log for alert reliability

---

## Gate C — Paid Validation
**Pass criteria (one of):**
- 3 paying customers
- OR 5 signed paid pilots with start date + terms

**And all of:**
- Gross margin estimate at current usage >= 45%
- No P0 reliability bug unresolved >72h

**Evidence artifacts:**
- Billing/contracts snapshot
- COGS model sheet v1 with assumptions
- Reliability issue tracker snapshot

---

## Gate D — Replay Lab Kickoff Authorization
**Pass criteria (all required):**
- Gate C passed
- Top 5 failure modes identified from RunGuard traces
- Replay Lab scope approved (v1 in/out)
- Deterministic replay success target and test harness defined

**Evidence artifacts:**
- Failure taxonomy report
- Replay Lab v1 spec
- Test plan and sample trace corpus

---

## Fail policy
If a gate fails:
1. Stop stage advancement
2. Publish fail report with root cause
3. Propose 2-3 recovery options with expected time/cost
4. Await Daniel decision

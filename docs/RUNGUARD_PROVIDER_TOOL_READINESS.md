# RunGuard Provider & Tool Readiness
Last updated: 2026-03-02

## Objective
Confirm theCompany has required providers/tools to execute Gate A without surprises.

## Required for Gate A

### Providers
- OpenAI Codex access for primary coding runs (`openai-codex/gpt-5.3-codex`)
- Backup model access (`openai/gpt-5.2`) for docs/research if needed

### Tools
- openclaw CLI (status/agent/session)
- git + GitHub repo access (`spoonlabs-ai/runguard`)
- python3
- node runtime
- shell execution capability

### Access/Env
- Read/write access to `~/.openclaw/workspace`
- Ability to run preflight script and produce reports

## Preflight Procedure (before Gate A start)
Run:
```bash
bash ~/.openclaw/workspace/scripts/runguard_preflight_check.sh
```

Expected:
- PASS report written to `~/.openclaw/workspace/reports/`
- If FAIL, resolve blockers before starting any Gate A issue

## Blocker Policy
Any preflight failure is a hard blocker for Gate A execution.
- Log issue in GitHub with `status:blocked`
- Include preflight report path and failing checks
- Wait for unblock decision

## Notes
No new custom skills required for Gate A at this time.
If repeated manual steps emerge, create small scripts/utilities (repo-scoped) rather than new broad skills.

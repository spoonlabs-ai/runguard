# RunGuard Trace Schema v0.1
Last updated: 2026-03-02

Purpose: define the **minimum stable, machine-readable event format** emitted by RunGuard during a run.

This is a **schema-by-convention** spec (v0.1) intended to stay backwards compatible during Gate A.

---

## Envelope (all events)

All emitted events MUST be JSON objects with the following top-level fields:

```json
{
  "v": "0.1",
  "event": "run_start",
  "ts": "2026-03-02T22:40:00.000Z",
  "run_id": "rg_01H...",
  "seq": 1,
  "data": {}
}
```

### Required fields
- `v` (string): schema version. MUST be `"0.1"`.
- `event` (string): event type (see below).
- `ts` (string): RFC3339/ISO timestamp in UTC (`...Z`).
- `run_id` (string): globally unique identifier for a single guarded execution.
- `seq` (int): monotonically increasing sequence number per `run_id`.
- `data` (object): event payload; structure depends on `event`.

### Optional fields (recommended)
- `parent_run_id` (string): for nested runs.
- `agent_id` (string): which agent initiated the run.
- `host` (string): machine identifier.
- `cwd` (string): working directory.

---

## Event types (required in v0.1)

### 1) `run_start`
Emitted once at the beginning of a run.

**`data` fields (recommended):**
- `cmd` (array of strings): the command executed.
- `timeout_s` (number|null): wall-clock timeout.
- `limits` (object): any configured limits (steps, budget).

**Example**
```json
{
  "v":"0.1",
  "event":"run_start",
  "ts":"2026-03-02T22:40:00.000Z",
  "run_id":"rg_01HT...",
  "seq":1,
  "data":{
    "cmd":["node","-e","console.log('hi')"],
    "timeout_s":300,
    "limits":{"max_steps":50,"max_cost_usd":2.00}
  }
}
```

### 2) `llm_call`
Emitted for each model invocation.

**`data` fields (recommended):**
- `provider` (string): e.g. `openai`, `anthropic`.
- `model` (string)
- `prompt_tokens` (int)
- `completion_tokens` (int)
- `total_tokens` (int)
- `cost_usd` (number)
- `latency_ms` (int)

**Example**
```json
{
  "v":"0.1",
  "event":"llm_call",
  "ts":"2026-03-02T22:40:02.100Z",
  "run_id":"rg_01HT...",
  "seq":5,
  "data":{
    "provider":"openai",
    "model":"gpt-5.2",
    "prompt_tokens":1200,
    "completion_tokens":300,
    "total_tokens":1500,
    "cost_usd":0.012,
    "latency_ms":820
  }
}
```

### 3) `tool_call`
Emitted for each tool invocation.

**`data` fields (recommended):**
- `tool` (string): tool name
- `ok` (boolean)
- `latency_ms` (int)
- `error` (string|null)

**Example**
```json
{
  "v":"0.1",
  "event":"tool_call",
  "ts":"2026-03-02T22:40:03.250Z",
  "run_id":"rg_01HT...",
  "seq":9,
  "data":{
    "tool":"web_fetch",
    "ok":true,
    "latency_ms":340,
    "error":null
  }
}
```

### 4) `budget_warn`
Emitted when the run crosses a budget warning threshold (e.g. 80% / 90%).

**`data` fields (recommended):**
- `budget_type` (string): `tokens` | `cost_usd`
- `threshold` (number): 0–1
- `used` (number)
- `limit` (number)

**Example**
```json
{
  "v":"0.1",
  "event":"budget_warn",
  "ts":"2026-03-02T22:40:05.000Z",
  "run_id":"rg_01HT...",
  "seq":14,
  "data":{
    "budget_type":"cost_usd",
    "threshold":0.8,
    "used":1.60,
    "limit":2.00
  }
}
```

### 5) `budget_kill`
Emitted when RunGuard terminates the run due to budget exhaustion.

**`data` fields (recommended):**
- `budget_type` (string): `tokens` | `cost_usd`
- `used` (number)
- `limit` (number)
- `reason` (string): human-readable reason

**Example**
```json
{
  "v":"0.1",
  "event":"budget_kill",
  "ts":"2026-03-02T22:40:06.000Z",
  "run_id":"rg_01HT...",
  "seq":15,
  "data":{
    "budget_type":"tokens",
    "used":100100,
    "limit":100000,
    "reason":"token budget exceeded"
  }
}
```

### 6) `run_end`
Emitted once at the end of a run (success, failure, or killed).

**`data` fields (recommended):**
- `status` (string): `success` | `error` | `killed` | `timeout`
- `exit_code` (int|null)
- `duration_ms` (int)
- `summary` (object): totals (tokens, cost, tool_calls)

**Example**
```json
{
  "v":"0.1",
  "event":"run_end",
  "ts":"2026-03-02T22:40:06.250Z",
  "run_id":"rg_01HT...",
  "seq":16,
  "data":{
    "status":"success",
    "exit_code":0,
    "duration_ms":6250,
    "summary":{"total_tokens":1500,"total_cost_usd":0.012,"tool_calls":3}
  }
}
```

---

## Backwards-compat rules (v0.1)
- New event types MAY be added.
- New fields MAY be added to `data` objects.
- Existing required fields MUST NOT be removed or renamed.
- Consumers MUST ignore unknown fields.

## File format / transport
- v0.1 is transport-agnostic (stdout JSONL, file JSONL, or HTTP streaming).
- Recommended: **one JSON object per line** (JSONL) for easy tailing.

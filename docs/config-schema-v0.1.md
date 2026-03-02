# RunGuard Config Schema v0.1 (`.runguard.yaml`)

Status: **locked** for Gate A.

> For v0.1, parser accepts **JSON-compatible YAML** only (YAML 1.2 superset of JSON).

## Shape

```yaml
{
  "version": 1,
  "limits": {
    "wallClockSec": 300,
    "stepMax": 500,
    "tokenMax": 200000,
    "costUsdMax": 10.0
  },
  "execution": {
    "cwd": "/absolute/or/relative/path"
  }
}
```

## Fields

- `version` (number, required if present)
  - Must be exactly `1`.
- `limits` (object, optional)
  - `wallClockSec` (integer >= 1)
  - `stepMax` (integer >= 1)
  - `tokenMax` (integer >= 1)
  - `costUsdMax` (number >= 0)
- `execution` (object, optional)
  - `cwd` (string)

## Unknown Keys

Unknown keys at any level are rejected.

## Precedence

CLI flags override config values:

- `--timeout` overrides `limits.wallClockSec`
- `--cwd` overrides `execution.cwd`

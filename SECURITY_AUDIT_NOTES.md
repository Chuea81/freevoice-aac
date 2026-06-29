# Security Audit Notes

The **Security Audit** workflow (`.github/workflows/security.yml`) runs
`npm audit --audit-level=high --omit=dev` and fails on any high/critical
vulnerability in production dependencies. **No allowlist** — the gate is clean.

## Resolved (2026-06-29)

Previously-allowlisted transitive advisories are now patched via `overrides`
in `package.json`:

| Package | Was | Now | Advisory | Pulled in by |
|---|---|---|---|---|
| `protobufjs` | 7.5.4 | **7.6.4** | critical (code execution) | `kokoro-js` → `@huggingface/transformers` → `onnxruntime-web` |
| `@xmldom/xmldom` | 0.8.11 | **0.8.13** | high (XML injection / DoS) | `@capacitor/cli` |

Both overrides stay within the ranges their parents accept (`onnxruntime-web`
wants `protobufjs@^7.2.4`; Capacitor uses the `0.8.x` line), and `npm run build`
passes with them applied.

- `react-router-dom` (high) — removed earlier (was a direct dep imported nowhere).

## Remaining (informational, does NOT fail the gate)

`npm audit --omit=dev` still reports **2 moderate** advisories (e.g. `node-tar`
PAX header parsing). These are below the `--audit-level=high` threshold. If you
want to clear them too, check whether bumping the parent package or adding an
override resolves it without breaking the build — but it's not required for the
audit to pass.

## How to maintain

- The `overrides` are pins. Periodically run `npm audit --omit=dev` and, when the
  upstream packages ship their own fixes, you can drop the override and let the
  normal dependency resolve to a patched version.

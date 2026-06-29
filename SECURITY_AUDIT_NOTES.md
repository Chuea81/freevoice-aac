# Security Audit — Allowlist TODO

The **Security Audit** workflow (`.github/workflows/security.yml`) runs
`npm audit` on production dependencies and fails on any **new** high/critical
vulnerability. Two unavoidable **transitive** advisories are currently
allowlisted (they have no upstream fix yet and are outside the web app's
runtime).

## Allowlisted advisories (added 2026-06-29)

| Package | Severity | Pulled in by | Why allowlisted |
|---|---|---|---|
| `protobufjs` | **critical** | `@huggingface/transformers` → `onnxruntime-web` | Kokoro TTS engine — runs only in the native app, never in the web build. No patched `onnxruntime` available. |
| `@xmldom/xmldom` | **high** | `@capacitor/cli` | Android build tooling only; not shipped to users. |

## TODO — revisit and remove the allowlist when fixes land

1. Periodically run: `npm audit --omit=dev`
2. When `onnxruntime` / `@huggingface/transformers` or `@capacitor/cli` publish
   patched versions, bump them: `npm update @huggingface/transformers @capacitor/cli`
   (or `npm audit fix`), then **verify the build + AI voice still work**
   (`npm run build`, and test Kokoro on the Android app).
3. Remove the corresponding entry from the `ALLOW` set in
   `.github/workflows/security.yml`. The goal is an **empty** allowlist.

## Already resolved

- `react-router-dom` (high) — was a direct dependency imported in zero files
  (the app uses state-based routing). Removed in commit `360159a`.

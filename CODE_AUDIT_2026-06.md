# FreeVoice AAC — Final Improvement Report

**Auditor:** Lead audit synthesis across 10 specialist dimensions
**App root:** `C:/Users/msciu/OneDrive/Desktop/ShellCraft Labs/FreeVoice/freevoice`
**Context:** Free, open-source charity AAC app. Android = thin Capacitor TWA loading the **live** site (`capacitor.config.ts:8-9`), so the web payload is exactly what every user downloads and re-fetches, on metered low-end Android. Correctness, latency, accessibility, and offline availability are life-impacting.

All findings below are grounded in the real files and reflect the verification verdicts (rejected/over-stated items dropped or downgraded; refined recommendations preferred).

---

## 1. Executive Summary

The app functions, but it ships ~221 MB to every user and has a handful of defects that can leave a non-verbal user **without a voice**. The good news: almost none of this requires a rewrite.

- **Payload is ~90% avoidable.** A one-line PWA change stops force-downloading ~148 MB of optional character art on first load; converting images to WebP removes ~159 MB; deleting build-only art removes ~33 MB. Target: **~221 MB → ~25 MB**.
- **Offline is broken** in two compounding ways — the app tears down its own service worker every load, and fetches the vocabulary file in a way that bypasses the offline cache. An offline user can open the app to an **empty board** (no symbols = no speech).
- **The core speak action is inaccessible to switch/keyboard users** — symbol cards only respond to pointer events. This is the most severe possible failure for an AAC device.
- **A false privacy claim ships:** the live site loads third-party analytics while the About page promises "zero data collection, no tracking, no analytics."
- **Correctness papercuts on the voice itself:** changing the speed slider doesn't affect already-cached core words; editing/deleting a built-in symbol silently does nothing.
- **i18n is wired but disconnected:** ~94% of the caregiver UI stays English even in "fully translated" locales, and the on-device neural voice is English-only (foreign text is read in an American accent).

The codebase is small, readable, and idiomatic React 19 + Zustand. The fixes are mostly hours-to-days, with a clear roadmap in Section 4.

---

## 2. THE HEADLINE — Payload Reduction Plan (221 MB → ~25 MB)

The payload is dominated by **`characters/` (181 MB)** and **`symbols/` (17 MB)**, almost all unoptimized 500×500 RGBA PNGs, plus 33 MB of build-time source sheets that should never ship, plus the 21.6 MB ONNX WASM. Ordered by **MB-saved-per-effort**:

| # | Lever | MB saved | Effort | What to do |
|---|-------|----------|--------|------------|
| **1** | **Stop precaching character art** | **148 MB off first load** | Trivial | Exclude `characters/**` from Workbox precache + serve on demand |
| **2** | **Delete build-only source sheets** | **33 MB** | Trivial | Move source sprite sheets out of `public/`, or prune in assemble step |
| **3** | **WebP-encode all symbol/character PNGs** | **~159 MB** | Small | Emit `.webp` q80 in slice scripts; update 3 hardcoded `.png` consumers |
| **4** | **Kokoro opt-in + single-threaded WASM** | **~21.6 MB WASM (+~80 MB model deferred)** | Medium | Default to Web Speech; ship `ort-wasm-simd.jsep` (~11 MB) when not isolated |
| **5** | **Split JS bundle / de-dupe `defaultBoards`** | **~0.2 MB + parse cost** | Medium | `manualChunks`, `React.lazy`, dynamic-import legacy seed data |

> **Important de-dup note:** Levers 1 and 3 overlap on the same 148 MB of character art. Lever 1 stops it being *force-downloaded on install*; Lever 3 shrinks each file ~35×. **Do both** — the end state is that a character's emotion set is only ~4–5 MB total and is fetched lazily, only by the rare user who selects a character. The 17 MB top-level symbol sprite JPGs are *not* precached today (glob omits `jpg`), so they are not a per-user first-load cost but should still be WebP'd.

### Lever 1 — Exclude `characters/**` from precache (CRITICAL, trivial, ~148 MB)
**Evidence:** `vite.config.ts:25` `globPatterns` includes `png` at a 5 MB cap (`:27`); `globIgnores` (`:26`) excludes only worker chunks/wasm/onnx — **not** `characters/`. The generated `dist/app/sw.js` precache manifest lists exactly **336 emotion PNGs** (14 chars × 24 emotions, ~470–532 KB each) totaling ~147 MB, plus 14 previews — all hard precache entries fetched during SW *install* on first visit. Characters are opt-in: `characterStore.ts:18` defaults `selectedCharacterId: null`, and `useCharacterImage.ts:21` returns null when none is selected, so most users never display any of this art.

**Fix:**
- Add `'characters/**'` (or at minimum `characters/symbols/**` + `characters/preview/**`) to `globIgnores`.
- Add a `runtimeCaching` rule: `CacheFirst` matching `/\/app\/characters\/symbols\/.*\.(png|webp)$/`, with `ExpirationPlugin` (`maxEntries ~400`, sane `maxAgeSeconds`, `purgeOnQuotaError: true`) and `cacheableResponse {statuses:[0,200]}`.
- Keep `characters/manifest.json` precached (tiny, needed for the picker).
- **Verify:** rebuild, re-grep `dist/app/sw.js` for `characters/symbols` → should be 0 precache entries.

This also prevents large precache from triggering Android quota eviction of the assets the user *actually* needs to speak.

### Lever 2 — Delete build-only source sheets (medium, trivial, ~33 MB)
**Evidence:** `public/characters/sprites/` = 31 MB (14 sheet JPGs, inputs to `scripts/slice-sprites.mjs:51-54`) + `public/symbols/drinks_sheet.jpg` = 2.3 MB. Zero runtime references in `src`, bundle, HTML, or `sw.js`. Vite copies all of `public/` into `dist/app/`, so they ship; `assemble-dist.mjs:74-77` even copies `drinks_sheet.jpg` a *second* time to `dist/` root.

**Fix:** Move source sheets to a non-published dir (e.g. `assets-src/`) and update `slice-sprites.mjs:11` / `slice-drinks.mjs:13` to read from there; or add an explicit prune step. *Note:* these are `.jpg`, excluded from the precache glob, so this is shipped/CDN/repo weight — not per-user mobile data (hence medium, not the headline per-user hit that Lever 1 is).

### Lever 3 — WebP-encode symbol/character PNGs (CRITICAL, small, ~159 MB)
**Evidence:** `scripts/slice-sprites.mjs:84-88` writes bare `.png()` of 500×500 8-bit RGBA. Measured on real files: `happy.png` 535.6 KB → **15.1 KB** WebP q80 (35×); `african.png` 192 KB → 11.5 KB. The 147 MB emotion set collapses to ~4.2 MB at q80. The defect is *format* (lossless RGBA-with-alpha PNG), not a missing compression flag.

**Fix:**
- `slice-sprites.mjs:87,107` and `slice-drinks.mjs:68`: replace `.png()` with `.webp({ quality: 80, effort: 6 })`, write `.webp`.
- Update hardcoded consumers: `useCharacterImage.ts:28`, `src/utils/characterUtils.ts:15`, `generate-symbols-json.mjs:27`, and `/symbols/custom/*.png` literals in `defaultBoards.ts`. Regenerate `symbols.json`.
- Delete old PNGs so they don't linger in `dist`. Use **lossy q80** (not lossless WebP at 161 KB) — flat illustrations are visually fine and that's the source of the 35× win.

### Lever 4 — Kokoro opt-in + single-threaded WASM (HIGH, medium, ~21.6 MB + ~80 MB deferred)
**Evidence:** `dist/app/assets/ort-wasm-simd-threaded.jsep` = 21,596,019 bytes; only the **threaded** variant ships (no single-threaded fallback). `useTTS.ts:226-245` auto-`LOAD`s on mount unconditionally (comment: "now we auto-download unconditionally") and even *resets* a prior `kokoroDeclined` flag (`:233-235`). `useTTS()` is invoked in `Board.tsx:44` and 7 other always-present components, so it runs on every cold start. WebViews lacking `SharedArrayBuffer` fall back to Web Speech (`useTTS.ts:52-53`) **after** paying the download. The ~80 MB model is fetched from the HF CDN at runtime, not bundled.

**Fix:** Default `activeTier` to `'webspeech'` (`ttsStore.ts:70`); remove the unconditional auto-`LOAD`; trigger `loadModel` only from an explicit "Download high-quality voice (~100 MB, Wi-Fi recommended)" button; honor `kokoroDeclined`; gate any auto-download on `navigator.connection?.saveData`. Ship `ort-wasm-simd.jsep` (~11 MB, `numThreads:1`) and select it when `crossOriginIsolated` is false — halving the WASM AND fixing WebViews that currently download 21.6 MB only to fail and fall back.

### Lever 5 — Split bundle / de-dupe dataset (medium, ~0.2 MB + parse cost)
**Evidence:** No `manualChunks` (`vite.config.ts:82-86`); no `React.lazy`/`Suspense` anywhere in `src`. The ~1911-line `defaultBoards.ts` (`123,707 B`) is pulled into the main chunk by `db/index.ts:2` (legacy v4–v8 Dexie migrations only) and `boardStore.ts:3` (`cardColor`), yet the same dataset is also served as `api/symbols.json` — the catalogue ships twice.

**Fix:** Extract `cardColor` into a tiny standalone util; dynamic-`import('../data/defaultBoards')` *inside* the v4–v8 upgrade callbacks; `React.lazy` `ParentMode`/`Settings`. *Note:* 604 KB is the uncompressed bundle; over-the-wire gzip impact is tens of KB, dwarfed by Levers 1–4 — treat as startup-cleanliness, not the metered-data headline.

---

## 3. All Other Findings (by area)

### 3.1 TTS / Audio Pipeline

**[CORRECTNESS — HIGH] TTS cache key omits speech speed**
After the parent/therapist slows the speed slider, the most important precached core words (`I, want, help, yes, no, stop, pain, hurt`) keep playing at the original rate. Cache keys are `voice:text` only at all three sites: `tts.worker.ts:289` (precache), `:380` (SPEAK), `:402` (SPEAK_AND_CACHE). The worker *receives* the new speed (`useTTS.ts:288`) but ignores it on a cache hit; `setSpeechRate` (`ttsStore.ts:90`) does no invalidation and `CLEAR_CACHE` is never posted. Result is *inconsistent* speech (old-rate cached words mixed with new-rate fresh ones).
**Fix:** Key on `${voice}:${speed.toFixed(2)}:${text}` at all three sites (preferable to clearing — preserves per-speed audio). Pitch/volume don't affect Kokoro synthesis, so only speed matters.

**[CORRECTNESS — HIGH] Desktop users cannot opt out of the neural voice**
`activeTier` defaults to `'kokoro'` (`ttsStore.ts:70`) and is only ever set to `'webspeech'` programmatically on Kokoro/worker error (`useTTS.ts:53,61`). `VoiceSelector.tsx` exposes only the 9 Kokoro voices + speed/pitch/volume; `classifyWebSpeechVoices()` (`voiceDetection.ts:43`) is implemented but never rendered. So if Kokoro loads successfully but sounds bad, the user is stuck.
**Fix:** Add a "Voice source" toggle (AI voice vs Device/system voice) in `VoiceSelector` wired to `setActiveTier` (currently no UI can select `webspeech`); render `classifyWebSpeechVoices()`; persist via existing `setWebSpeechVoiceURI`. Guard the `LOAD_COMPLETE` handler (`useTTS.ts:46`) so it doesn't override a deliberate user choice.

**[CORRECTNESS — MEDIUM] 24 kHz WAV resampled by a 48 kHz AudioContext (downgraded from "critical/muffled")**
`useTTS.ts:86` creates `new AudioContext()` with no `sampleRate`, so on desktop (48 kHz) `decodeAudioData` (`:131`) resamples Kokoro's 24 kHz output. The code path is real and worth fixing, **but** 24→48 kHz is *upsampling* (a 2× ratio that is normally transparent), so the "every desktop user hears muffled speech" framing is unverified — any residual dullness is more likely inherent to the 24 kHz source. Treat as a robustness cleanup, not a critical regression, unless an A/B recording proves otherwise.
**Fix:** `new AudioContext({ sampleRate: 24000 })` inside try/catch (matches transformers' own `read_audio` pattern); recreate the context when `sampleRate !== 24000`.

**[MEMORY — MEDIUM] `audioCache` grows unbounded in the worker**
`tts.worker.ts:253` `new Map<string, ArrayBuffer>()` is only cleared on full `CLEAR_CACHE`/`DELETE_MODEL`. Every SPEAK (`:391`), SPEAK_AND_CACHE (`:407`), and precache word (`:295`) adds a full WAV (~290 KB per 3 s utterance); switching among voices multiplies keys. Long AAC sessions on 2 GB devices can accumulate tens of MB → worker killed mid-session.
**Fix:** LRU with a cap (200–400 entries or a byte budget), pin `PRECACHE_LIST` entries.

**[CPU/BATTERY — MEDIUM] Per-word re-synthesis flood + serial worker blocking**
After every SPEAK, `useTTS.ts:292-301` posts a `SPEAK_AND_CACHE` for *every word*, each a full ONNX inference. The worker handler is a single serial `async` switch (`tts.worker.ts:346`) with blocking `await`; `precachePaused` only guards the precache loop, **not** SPEAK_AND_CACHE. So after sentence A, the next real tap (sentence B) queues *behind* A's per-word backlog — adding ~1–5 s latency on low-end WASM, plus battery/heat.
**Fix:** Give live SPEAK strict priority (drop queued SPEAK_AND_CACHE on a new SPEAK); eliminate the per-word fan-out (cache whole phrases, rely on `PRECACHE_LIST`); add a CANCEL/FLUSH message; consider lowering the 15 s fallback timeout (see below).

**[RELIABILITY — MEDIUM] First-launch offline / metered model download has weak recovery**
`from_pretrained` fetches the model + 21.6 MB WASM at first use (not precached). On failure → `webspeech`, but there's no retry/backoff, no "tap to retry download" affordance, no size warning. (`tts.worker.ts:181`, `useTTS.ts:304-309`.)
**Fix:** Add explicit retry-on-error + "Download voice / Retry" surfaced from `kokoroStatus==='error'`; show approximate download size; bridge to Web Speech immediately on first tap rather than after a 15 s timeout.

**[RELIABILITY — MEDIUM] Cache↔IndexedDB model-persistence has correctness gaps**
`tts.worker.ts:67-144`: finds the transformers cache by substring `n.includes('transformers')` (fragile); writes the `__kokoro_cached` marker after copying (partial restore can report success on incomplete model); restores into a *guessed* cache name that may not match what transformers reads → re-download anyway; backups are fire-and-forget (`:242`). On eviction-prone Android the safety net can silently fail, re-incurring the ~25–30 MB fetch. The voice `.bin` files live in a *separate* `kokoro-voices` cache that the IDB backup doesn't cover at all.
**Fix:** Resolve/store the real cache name; verify expected key count before trusting the marker; validate all URLs on restore; extend backup to the voices cache; surface failures.

**[TUNING — LOW] WebGPU path forces fp32; no device-class dtype tuning**
`tts.worker.ts:218-237`: WebGPU loads `fp32`; WASM uses hardcoded `q8` (`useTTS.ts:244`) with no q4 downgrade for very weak devices.
**Fix:** Pass a measured dtype from the main thread by device capability.

---

### 3.2 Accessibility (AAC-critical)

**[CRITICAL] Symbol cards cannot be activated by keyboard or switch**
`SymbolCard.tsx:212-220` renders a `<button>` but binds activation only to `onPointerDown/Up/Leave`; `handlePointerUp` early-returns unless `e.type === 'pointerup'` (`:180`). There is **no `onClick`/`onKeyDown`**. Keyboard Enter/Space and switch hardware dispatch a synthetic `click` — which nothing handles — so `onTap` never fires. The `role="button"` + aria-label make AT *announce* it as activatable, so it lies to assistive tech. Dwell mode is also pointer-only and off by default (`settingsStore.ts:55`).
**Fix:** Add `onClick={() => onTap(symbol)}` as the canonical activation; demote pointer handlers to affordance-only (ripple/preview/scroll-guard); suppress the synthetic click after a real pointer sequence to avoid double-speak. **Release blocker.**

**[CRITICAL] No switch-access scanning anywhere**
No global key listener, no scan-highlight loop, no scan settings (`Settings.tsx` Accessibility section exposes only Auditory Touch + Dwell Time; `settingsStore.ts` has no scan fields). Single/two-switch users — a primary access method for severe motor impairment / cerebral palsy — cannot navigate or select.
**Fix (large):** Implement single-switch automatic scanning + two-switch step scanning with a visible highlight, row/column scanning for large grids, configurable speed/mode/key. **Interim:** the per-card `onKeyDown` from the finding above already unlocks hardware-keyboard access.

**[HIGH] Modals: no focus trap, no Escape, no focus return, no `role=dialog`/`aria-modal`**
Every modal is a plain `<div className="modal-overlay">`: `CustomWordModal.tsx:88-89`, `SymbolSearch.tsx:52-53`, `PinModal.tsx:85-86`, `BoardPicker.tsx:30-31`, `SymbolContextMenu.tsx:22-23`, `TabBar.tsx:81-82`, `SymbolGrid.tsx:263-264`, `OnboardingWizard.tsx:30`. No Escape handling anywhere; no `inert`/`aria-hidden` on the background; focus falls to `<body>` on close. PIN entry, add-symbol, and search become confusing/unusable for AT users.
**Fix:** A shared `useModalA11y` hook adding `role=dialog` + `aria-modal` + `aria-labelledby`, Escape-to-close, focus trap, capture/restore `activeElement`, and `inert` background. Ship Escape + focus-restore first (cheap).

**[HIGH] Edit/move/delete only via 500 ms long-press — no keyboard/AT path**
`SymbolGrid.tsx:64-79`: the context menu opens only via a `setTimeout` on mousedown/touchstart (the only `setContextOpen(true)` call). No `onContextMenu`, no key handler, no button. Switch/keyboard users and users with tremor cannot fix/remove a wrong or offensive symbol.
**Fix:** A focusable "⋮" options button per card in edit/parent mode (calls the same path); plus `onContextMenu` for right-click / ContextMenu-key.

**[MEDIUM] Many touch targets / labels below the 44–48 px minimum (scoped)**
Real offenders that *speak on tap*: coreword chips (~23 px effective, 5 px gaps — `index.css:283,290-308`), quickfire chips (~28 px, `:250-273`), breadcrumb crumbs (~22 px, `:333-346`); labels drop to **7 px** under 400 px (`:471`). *Corrections from verification:* tab buttons are ~50 px tall (the issue is per-tab *width*); the parent-tap-zone is intentionally hidden (not a child target); and the **symbol cards themselves are compliant** (~77 px on a 360 px phone) — so the framing is "secondary bars," not "the whole app."
**Fix:** `min-height: 44px` on `.coreword-btn`/`.quickfire-btn`/`.crumb`; raise inter-chip gap to ≥8 px; `.symbol-label` floor of `clamp(11px,1.8vw,14px)` and remove the <400 px 7 px override; per-tab `min-width`.

**[HIGH] Accessible names are hardcoded English in all 10 locales (incl. Arabic RTL)**
`SymbolCard.tsx:218` `Speak ${phrase}` / `${label} category`; `CoreWordsBar.tsx:36`, `FastPhrasesStrip.tsx:24`, `SpeechBar.tsx:83/90/125/148/155`, `Board.tsx:113`. Visible text on the *same* buttons is translated via `t()`, so a blind Arabic user hears English while the UI shows Arabic and RTL.
**Fix:** Route all aria-labels through `t()` with interpolation; add `a11y.*` keys to all locales; lint-ban string-literal aria-labels.

**[MEDIUM] Live region announces full message state, not what was spoken**
`SpeechBar.tsx:84-91`: `role="status"` with a changing **aria-label** = the whole message, re-announced on every token; no confirmation of what SPEAK actually produced. SRs announce text content, not aria-label, for live regions.
**Fix:** A dedicated visually-hidden `aria-live` region whose *text content* updates only with the phrase actually spoken.

**[MEDIUM] No visible focus on inline-styled buttons; native `confirm()`/`alert()` for destructive actions; no undo**
`CharacterPicker.tsx` builds buttons with inline styles (can't express `:focus-visible`); destructive flows use `window.confirm/alert` (`SymbolGrid.tsx:130`, `Settings.tsx:47,108-113`, `Board.tsx:74`) with no in-app undo. An accidental activation permanently loses a child's vocabulary.
**Fix:** Classed `:focus-visible` rings; in-app accessible confirm dialog; toast-with-Undo for deletion/clear.

**[MEDIUM] Low contrast on default dark theme** — `--text-secondary` 0.55, `--text-tertiary` 0.30 (`index.css:33-34`); inactive tabs 0.28, crumbs 0.30 → ~2:1, below WCAG 4.5:1. High-contrast theme is opt-in and doesn't fix chrome text. **Fix:** Raise functional-text contrast to ≥4.5:1.

**[MEDIUM] Text scaling capped / tablist not keyboard-scrollable** — `text-size-adjust:100%` lock (`index.css:76-79`), hard `clamp()` caps, fixed-height bars clip enlarged text; `role=tablist` has only `onClick`, no arrow-key roving tabindex (`TabBar.tsx:49-62`). **Fix:** Honor font scaling (rem, wrap), implement ARIA tablist arrow-key pattern.

**[LOW] Redundant `alt` + ambiguous category semantics** — `SymbolCard.tsx:233/242/252` use `alt={label}` while the button is already labelled; category cards announce "X category" but navigate. **Fix:** `alt=""` on inner imgs; explicit "Open {label} board" + `aria-haspopup`.

---

### 3.3 Data / Offline / PWA / Service Worker

**[CRITICAL] App unregisters ALL service workers on every load (verification downgraded to HIGH, but treat as release-critical for offline)**
`Board.tsx:33-41` unconditionally `unregister()`s every SW on every mount while VitePWA (`vite.config.ts:21-22`) + `UpdatePrompt`'s `useRegisterSW` register one. Nuance: `unregister()` doesn't purge CacheStorage and the SW re-registers, so it's an *intermittent* race — but on every cold start there's a window with **no controlling SW**, so an offline cold-launch can hit a blank/failed shell. The "Update available" banner also becomes unreliable.
**Fix:** Delete the loop. If a legacy SW must be flushed, do it **once**, gated by a `localStorage` flag, scoped by `scriptURL`. Verify exactly one Workbox SW controls the page; add an airplane-mode cold-start smoke test.

**[CRITICAL] `symbols.json` fetched with a cache-buster that misses the precache → empty boards offline**
`symbolsApi.ts:18` fetches `/app/api/symbols.json?t=${now}`. The SW precaches the key `/app/api/symbols.json` (no query); Workbox strips only `utm_/fbclid`, so `?t=` is **not** stripped and the lookup misses. Offline, the fetch throws; `boardStore.seedDatabase` sets `isSeeded:true` *before* the unawaited, uncaught `loadSymbols` (`boardStore.ts:170-171`), so the app believes it's seeded and renders **zero symbols** — masquerading as a normal empty state. Since v9 (`db/index.ts:176-182`) defaults live *only* in `symbols.json`, there's no IDB fallback. **This is the app's single most important data dependency, fetched in the one way guaranteed to bypass the offline cache.**
**Fix:** Remove `?t=${now}` (rely on the Workbox revision hash; version with a build hash if needed); on fetch failure fall back to `caches.match('/app/api/symbols.json')`; make `seedDatabase` await + catch and show a "Couldn't load symbols — Retry" UI; persist last-good payload to IDB. Add a regression test asserting the request URL has no non-ignored query params.

**[HIGH] Neural model not bundled — downloads from HuggingFace CDN at runtime**
`tts.worker.ts:5` `MODEL_ID='onnx-community/Kokoro-82M-v1.0-ONNX'` via `from_pretrained`; transformers default `remoteHost` is `huggingface.co` (never overridden). The voice `.bin` files use a **hardcoded** `huggingface.co/.../voices/${e}.bin` URL inside kokoro-js (not even env-configurable, ~522 KB each). First launch needs tens-to-hundreds of MB; offline first-launch yields only Web Speech. `index.html:20` markets "works offline" unconditionally.
**Fix (large):** Self-host model **and** voices same-origin (set `env.remoteHost = location.origin`; the voice URL needs a kokoro-js patch / SW intercept / pre-populated `kokoro-voices` cache); durably cache; until then, gate UX with a one-time download warning, surface Web Speech as the guaranteed-offline tier, and make `index.html:20` accurate ("offline after first setup").

**[HIGH] COOP/COEP set only for the WebView, not the web host; `require-corp` can block the model fetch**
`capacitor.config.ts:12-15` sets COOP/COEP only for the TWA. No host-level header config exists; the deploy target is **GitHub Pages** (`public/CNAME`, `.github/workflows/build-deploy.yml`), which *cannot* serve custom COOP/COEP. The repo's own `SHAREDARRAYBUFFER_FIX.md` confirms `SharedArrayBuffer: ✗ Blocked`. So on the web/PWA path, threaded ONNX silently degrades to Web Speech; and if a host *did* send `require-corp`, the cross-origin HF model + Google Fonts fetches would be blocked.
**Fix:** Pick one isolation strategy on a host that can set headers (Cloudflare/Netlify/Vercel, or a coi-serviceworker shim). Under `require-corp`: self-host the model (or use COEP `credentialless`); add `crossorigin` to the Google Fonts `<link>` (`index.html:26-29`). Add a runtime `crossOriginIsolated` check surfaced to the app, not just the debug panel.

**[HIGH] Backup/restore silently omits the `symbolHidden` table (and language/character)**
`backup.ts:31-54` exports only boards/symbols/settings. The `symbolHidden` table (`db/index.ts:54,176`; written by `boardStore.toggleSymbolHidden:251-268`) records which **default** symbols a caregiver hid — and since v9 it's the *only* persistent store of that curation. On device migration, the new device's table is empty and the backup never carried it, so every previously-hidden symbol **reappears** for the child. Language (`fv_language`) and character (`freevoice-character`) are also omitted.
**Fix:** Add `db.symbolHidden` to export and to the import transaction (guard legacy backups); also persist language + selected character. Add a hide→export→clear→import→assert-still-hidden regression test.

**[HIGH] Workbox precaches ~148 MB character PNGs on first load** — *duplicate of Lever 1; see §2.*

**[MEDIUM] Factory reset deletes EVERY IndexedDB DB on the origin**
`Settings.tsx:158-166` enumerates `indexedDB.databases()` and deletes all — broader than the dialog says, including the Kokoro model backup (forcing re-download), and inconsistent where `databases()` is unsupported. The pre-restore auto-backup (`backup.ts:81`) triggers a download via `<a>.click()` that doesn't throw if blocked — so the user may believe they have a safety backup when they don't.
**Fix:** Delete only `FreeVoiceDB`/`FreeVoiceModelCache` by name; make the pre-restore backup verifiable.

**[MEDIUM] `autoUpdate` + `skipWaiting` + `clientsClaim` can swap the SW mid-use** — `vite.config.ts:22,73-74`. With remote-URL TWA, a deploy can reload assets while a non-verbal user is mid-sentence. **Fix:** `registerType:'prompt'` (or `skipWaiting:false`) and apply updates only from the explicit Update button.

**[MEDIUM] ARASAAC pictograms are CacheFirst from a cross-origin host** — `vite.config.ts:48-55`. Any default symbol image not yet viewed online shows nothing offline; 2000-entry cap can silently evict; COEP `require-corp` can block these cross-origin images. **Fix:** Pre-warm the default vocabulary's pictograms after first online load, or self-host; confirm CORP compatibility; justify the cap vs ~1145 defaults.

**[LOW] `btoa(String.fromCharCode(...compressed))` can stack-overflow on large shared boards** — `backup.ts:166`. **Fix:** chunked base64 (0x8000-byte windows).

**[LOW] `navigateFallbackDenylist` targets `/api`,`/terms` at root but app is under `/app/`** — `vite.config.ts:71-72`. Latent (symbols.json is a fetch, not navigation), but indicates offline routing wasn't validated against the real base. **Fix:** Align regexes to `/app/`.

**[LOW] Dexie v5–v8 migrations depend on `defaultBoards.ts` that v9 made redundant** — forward-looking fragility if that file is removed. **Fix:** Once users are past v9, neutralize v5–v8 bodies; add a v1→head migration test asserting user rows survive.

---

### 3.4 Security & Privacy

**[HIGH] Third-party analytics contradicts the in-app "zero data collection" promise**
GoatCounter loads on **both** `index.html:34-35` (SPA shell) and `public/index.html:2078-2079` (landing page) — the live root the APK opens. Meanwhile `About.tsx:69-76` shows a green "Zero data collection" pill and "No accounts, no tracking, no analytics." No privacy policy exists; no consent. For a children's charity app this is a COPPA / GDPR-K and charitable-integrity problem.
**Fix:** Remove the snippet from **both** source files (the claim only flagged the landing page; the SPA shell loads it too). If analytics is ever wanted, rewrite the About copy, add a privacy policy documenting GoatCounter + ARASAAC + Google Fonts, and use cookieless mode — but for this audience, removal is correct. Rebuild so the live site matches.

**[HIGH] Parent PIN trivially bypassable: remote WebView debugging on + in-memory gate**
`capacitor.config.ts:28` `webContentsDebuggingEnabled:true` (also baked into `android/app/src/main/assets/capacitor.config.json`) → the release WebView is attachable via `chrome://inspect`. The PIN hash is in IndexedDB (`parentStore.ts:47`) using a single SHA-256 with a **hardcoded** salt `'freevoice-salt'` (`:21`) over a 4-digit space; the unlock flag is in-memory only (`:27,57`); no native enforcement. Anyone with DevTools can read/clear the PIN or flip the store.
**Fix:** `webContentsDebuggingEnabled:false` for release (gate on a dev flag, re-run `cap sync`, verify the bundled JSON). Document the PIN as a child speed-bump, not security; use a per-install random salt; allow longer PINs.

**[MEDIUM] PIN has no rate-limiting/lockout** — `PinModal.tsx:44-57` auto-verifies and lets instant retry over 10,000 combinations; static public salt → trivial rainbow table. **Fix:** Attempt counter with exponential backoff persisted in IDB; 6-digit option; per-install salt.

**[MEDIUM] `allowMixedContent:true` + `webContentsDebuggingEnabled:true` are production-inappropriate** — `capacitor.config.ts:27-28`. App is HTTPS-only (`cleartext:false`), so mixed content is never needed and opens a MITM vector on public/school Wi-Fi. **Fix:** Both `false` for release.

**[MEDIUM] Admin dev server: no auth, wildcard CORS, file-deletion + shell exec** — `admin/server.mjs:14` `cors()`, destructive unauthenticated endpoints, `execSync('npx tsx ...')`, binds `0.0.0.0:3333`. Dev-only (not shipped), so end users unaffected, but any site in the maintainer's browser can delete custom symbols or burn the Gemini key (CSRF/DNS-rebinding). **Fix:** Bind `127.0.0.1`, add a shared-secret/origin check, restrict CORS, replace writeFile+execSync with in-process import.

**[LOW] Live Gemini API key in plaintext `admin/.env`** — correctly gitignored and absent from history/`dist`, but spendable by the unauthenticated admin endpoints. **Fix:** Rotate once; add admin-server auth.

**[LOW] Keystore password fallbacks default to `'password'`; docs leak the real password** — `capacitor.config.ts:33,35` `|| 'password'`. *Verification correction:* the `.jks` is **not** committed (gitignored, absent from 219 commits), and `'password'` is a dead default (`build.gradle` reads env with no fallback and CI doesn't sign). The real issue is the actual password `freevoice123` committed in plaintext in tracked docs (`APK_BUILD_QUICK_REFERENCE.md`, `BUILDING_APK.md`). **Fix:** Treat `freevoice123` as compromised → rotate / enroll in Play App Signing; scrub from docs + git history; remove the `|| 'password'` and `?: 'freevoice'` fallbacks so missing secrets fail loudly.

**[LOW] No Content-Security-Policy** — defense-in-depth gap; React escaping means no current sink, but a future XSS or compromised third-party script would have free rein. **Fix:** Strict CSP allowing self + known endpoints (pairs with removing GoatCounter).

**[LOW] Undisclosed external requests (ARASAAC, Google Fonts)** — each ARASAAC search leaks the symbol keyword (can reveal what a non-verbal user is trying to say) + IP; Google Fonts leaks IP/UA. Contradicts the "private/offline" framing. **Fix:** Document in a privacy policy; self-host fonts (woff2 already precached).

---

### 3.5 Dependencies / Licensing / Build & CI

**[CRITICAL — CI/supply-chain] `protobufjs` advisory fails CI**
Installed `protobufjs@7.5.4` (advisory GHSA-xq3m-2v4x-88gg, range `<=7.5.7`) via `kokoro-js → @huggingface/transformers → onnxruntime-web@1.22.0-dev → protobufjs`. `security.yml:22-23` `npm audit --audit-level=high` exits 1, blocking CI. *Correction:* the nightly onnxruntime is incidental — stable 1.26.0 also pulls `protobufjs ^7.2.4`. End-user RCE risk is low (protobufjs JS isn't in shipped `dist`; onnxruntime uses prebuilt WASM), so this is a CI/hygiene gate, not an active exploit path.
**Fix:** Add `"protobufjs": ">=7.5.8"` to the existing `overrides` block (`package.json:64-66`); `npm install`; re-audit. **Also** address the `@xmldom/xmldom` high advisory, which independently fails the same gate.

**[HIGH] ARASAAC symbols are CC BY-NC-SA 4.0 vs the project's blanket MIT (verification downgraded from critical)**
`LICENSE` is MIT with no scoping; `arasaac.ts:3` confirms NC; 35 hardcoded `arasaacId`s in `defaultBoards.ts` (whole Feelings board) resolve to live CC BY-NC-SA pictograms, SW-cached. Attribution *already exists* (`About.tsx:50-58`), so the gap is license **scoping**, not missing credit, and "app-store takedown" is speculative. The sharper conflicts: MIT literally grants "sell" + GitHub Sponsors vs the NC term, and ShareAlike on derivatives.
**Fix:** Scope licenses explicitly (code = MIT; ARASAAC = CC BY-NC-SA 4.0; Kokoro = Apache-2.0) in `LICENSE`/`README`/a `NOTICE`. Lowest-risk option: replace the 35 ARASAAC pictograms with the project's own emoji/custom symbols to drop the NC dependency from the payload.

**[MEDIUM — was HIGH] `license-audit` script fails red**
`package.json:18` `--onlyAllow` list fails on `BlueOak-1.0.0` (13 transitive deps), `0BSD`, plus MPL-2.0/Python-2.0/Zlib/`(MIT AND Zlib)` pako and `Apache-2.0 AND LGPL-3.0-or-later` sharp, and the root package's own `UNLICENSED`. *Correction:* the proposed one-line allowlist fix is insufficient — multiple licenses block, and it's not purely false positives. **Fix:** Add the genuinely permissive ones (BlueOak, 0BSD, Python-2.0, Zlib, AFL-2.1) via SPDX/allowlist; consciously document the weak-copyleft build-only deps (MPL/LGPL, not bundled); set the root `license` field / `--excludePrivate`; add `--production`. Not a runtime/license-violation defect.

**[LOW — was HIGH] Gemini-generated character art lacks an asset-local license**
*Corrections:* `slice-sprites.mjs:113-122` deletes stray `Gemini_`-prefixed PNGs from the *output* dir, **not** the source sheets (all 14 sheets intact). And rights *are* claimed in `terms.html:91` ("original works by Shellcraft Labs LLC, generated with AI assistance"). The narrow gap is a missing machine-readable license beside the PNGs. **Fix:** Add `public/characters/LICENSE.md` choosing a concrete license (e.g. CC BY 4.0 / CC0) so forks know their rights; align `MASTER_PLAN.md:300`.

**[MEDIUM] `serialize-javascript` override `^7` vs Workbox `^6`** — `package.json:64-66`. Major bump risks breaking SW precache; the CVE only needs `>=6.0.2`. **Fix:** Lower to `^6.0.2`.

**[MEDIUM] CI license grep misses runtime ARASAAC NC** — `security.yml:24-31` greps `npm ls` only; ARASAAC is a runtime asset (`arasaac.ts:8`). **Fix:** Add a source/asset scan; wire `license-audit` into CI.

**[LOW] Source sheets + sliced PNGs both committed** — 148 MB duplicate art bloats VCS. **Fix:** one source of truth (regenerate from sheets, or commit outputs only).

**[LOW] Carets on new majors** — `vite ^8.0.1` (3 high dev advisories), `@capacitor/* ^8.3.0`. **Fix:** `npm audit fix`, tilde-pin, add Dependabot.

---

### 3.6 React Architecture & Runtime Performance

**[MEDIUM — was HIGH] No code-splitting; Settings/ParentMode + 1900-line dataset in initial bundle**
`App.tsx:3-4` static-imports `ParentMode`; no `React.lazy`/`Suspense` anywhere. `defaultBoards.ts` (1911 lines) is dragged into the main chunk by `db/index.ts:2` (legacy migrations only) and `boardStore.ts:3` (`cardColor`). *Verification note:* 604 KB is uncompressed; gzipped real-world delta is tens of KB — solid architecture finding, modest byte impact vs the image payload. **Fix:** Extract `cardColor`; dynamic-import `defaultBoards` inside migration callbacks (or gut v4–v8 bodies post-v9); `React.lazy` the PIN-gated `ParentMode`/`Settings`.

**[HIGH] `boardStore` async actions have no error handling**
`loadSymbols`/`seedDatabase` (`boardStore.ts:127-150,168-175`) don't catch. *Verification correction:* the symptom is **not** an infinite "Loading…" (`isSeeded` is set true synchronously at `:170`) — it's a **silently empty board** that renders the normal-looking empty state, which is worse. **Fix:** Await loaders in try/catch; show a "Couldn't load symbols — Retry" screen; remove the cache-buster; persist last-good payload. (Pairs with §3.3 cache-buster fix.)

**[HIGH] TTS worker has no priority for live SPEAK over background caching** — *see §3.1 per-word flood / serial blocking.*

**[HIGH] Symbol grid not virtualized + `SymbolCard` not memoized**
`SymbolGrid.tsx:175-187` maps the full board (corewords=51, animals=42); `SymbolCard.tsx:43` is not `React.memo`, and each card independently subscribes to `settingsStore` (`:46-49`), `useCharacterImage` (`:58`), and `useTTS()` (`:50`, which does an unselected `useTTSStore()` at `useTTS.ts:197`). So any setting toggle or parent re-render fans out O(N) re-renders + N store notifications + N duplicate bootstrap effects. *Verification corrections:* images already use `loading="lazy"` (no decode burst), and boards cap at ~51 — so the impact is a bounded re-render/commit cost, not the catastrophic scroll-jank originally claimed (virtualization itself = medium).
**Fix:** Wrap `SymbolCard` in `React.memo` (props are stable); hoist the 4 per-card settings reads to the grid as props; move `useTTS()` out of `SymbolCard` (or give it a selector + dedupe the singleton effects); add `content-visibility:auto; contain-intrinsic-size` to `.symbol-card` (cheap, no library) instead of a virtualization dependency.

**[MEDIUM] Every navigation re-filters all 1222 symbols + 2 IndexedDB reads before paint**
`boardStore.loadSymbols` runs on every tab/board change, doing `defaultSymbols.filter()` over 1222 items + `symbolHidden.toArray()` + a `db.symbols.where()` synchronously. *Verification correction:* the in-memory 5-min cache means symbols.json is **not** re-fetched per navigation (only per cold start), so the title's "every navigation re-fetches" is false. **Fix:** Build a `boardId→symbols` Map once after fetch; cache the hidden-ids Set, invalidating only on hide-toggle.

**[MEDIUM] ARASAAC images requested at 500px, displayed at ~42–110px (verification downgraded from HIGH)** — `arasaac.ts:51,71` always build `_500.png`. *Verification correction:* the layout-shift/CLS claim is **wrong** here (`.symbol-card aspect-ratio:1/1` + CSS-sized containers already reserve space), so drop that framing. The real, bounded cost is wasted cross-origin bytes/decode. **Fix:** Request `_300` variant; pre-downscale on-device character PNGs to ~128px WebP (covered by Lever 3).

**[MEDIUM] `useCharacterImage` runs `Array.find` per card per render** — `useCharacterImage.ts:14-29`, called by every card even though only the feelings board needs it. **Fix:** Short-circuit when `boardToCategory` is null; add a `selectedCharacter` store selector; subscribe to `selectedCharacterId` only.

**[MEDIUM] 15 s worst-case fallback timeout** — `useTTS.ts:303-309`. A stalled neural model = up to 15 s of silence for the core action. **Fix:** Lower to ~1.5–2.5 s (speak via Web Speech immediately if Kokoro hasn't produced audio).

**[MEDIUM] `devicePerformance` heuristics unsound and gate nothing** — `devicePerformance.ts:43` `/android\s+(?:[789]|10|11)/` flags essentially every Android 7–11 device as low-power, yet Kokoro auto-downloads regardless (`useTTS.ts:226-245`). **Fix:** Tighten to `deviceMemory`/`hardwareConcurrency`; actually gate the Kokoro download on `isLowPower`.

**[MEDIUM] Settings subscribes to whole stores + reads `getState()` in render** — `Settings.tsx:24-26` (no selectors), `:203-204` (`getState()` in JSX → stale "Currently using" label). **Fix:** Atomic selectors; proper `useCharacterStore` subscription.

**[MEDIUM] `react-router-dom` declared but never imported; routing is one `useState`** — `App.tsx:10`. Dead dep confuses contributors and blocks deep-linking/back-button. **Fix:** Remove it (or adopt it to enable route-splitting).

**[MEDIUM] Polish locale `pl.json` shipped but unwired** (architecture view) — *see §3.7.*

**[MEDIUM] Module-level worker callback map + shared `currentAudioSource` interrupt races** — `useTTS.ts:15-17,73,140`. Rapid tapping (common for this population) can clip/double-speak. **Fix:** Track active SPEAK id, ignore superseded `AUDIO_READY`, send explicit CANCEL; encapsulate worker+callbacks+source in one module.

**[LOW] `CapacitorDebugPanel` (270 lines) dead code** + ~15 churn `*_SUMMARY/_FIX/_GUIDE.md` files. **Fix:** Delete; consolidate docs.

**[LOW] ESLint at bare recommended; hooks rule disabled; `exhaustive-deps` suppressed in `SymbolCard`** — `eslint.config.js:13-24`, `SymbolCard.tsx:121`. For an AI-generated, volunteer-maintained codebase this is exactly where effect bugs hide. **Fix:** `recommendedTypeChecked`, keep `set-state-in-effect` on, fix offenders.

**[LOW] App injects CJK font `<link>` per language change without cleanup; split bootstrap** — `App.tsx:33-43` never removes `#cjk-font` when switching away; no-op `useArasaac()` still called (`Board.tsx:45`). **Fix:** Effect cleanup; delete no-op hook; consolidate bootstrap.

**[LOW] PIN architecture note** — `parentStore.ts:19-24` single-round SHA-256 + constant salt; document as child-lock, not security.

---

### 3.7 Internationalization

**[CRITICAL] Components hardcode English; ~151 of 160 translation keys never used**
Only 4 files import `useTranslation`, and only ~9 `t()` keys ever resolve (`SpeechBar`, `Settings`, `TabBar`). Every page/modal — `Settings`, `About` (100% hardcoded despite `settings.about*` keys), `OnboardingWizard`, `VoiceSelector`, `SymbolSearch`, `PinModal`, `CustomWordModal`, `FastPhrasesStrip`, `CoreWordsBar`, `UpdatePrompt`, install prompts, `SymbolContextMenu`, `BoardPicker`, `Board` — hardcodes English. `fr`/`de`/`pt` are *fully* translated (160/160) yet **dead**: a French caregiver still sees ~94% English, making the config UI (voice, accessibility, board management) effectively unusable.
**Fix (large):** Wire every user-facing string through `t()` using the existing keys; fix the latent `nav` mismatch (below); add an `about.*` namespace; add `eslint-plugin-i18next no-literal-string` + a CI check failing on unused keys.

**[CRITICAL] Kokoro TTS has only English voices and no per-language mapping**
`ttsStore.ts:6-16` defines only `af_*/am_*/bf_*/bm_*`, default `af_heart`; the worker hardcodes `af_heart` (`tts.worker.ts:353`); `i18n.language` is never passed to the worker; no language→voice table exists. *Verification strengthens this:* the Web Speech fallback also never sets `utterance.lang` (`useTTS.ts:154-190`), so **neither** tier routes to the content language. A Spanish/Arabic/Chinese/Japanese child's text is read aloud in an American accent — garbled/unintelligible. **This is the user's voice.**
**Fix (large):** Minimum viable — when `i18n.language` is non-English, force `webspeech` and set `utterance.lang` (BCP-47) + prefer a matching `getVoices()` entry. Better — language→voice routing table; gate the picker for locales Kokoro can't pronounce (badge "UI translation only — English voice"). Long term — multilingual on-device voice packs.

**[MEDIUM — was HIGH] it/nl/ar/zh/ja only 15% translated (24/160) yet selectable**
`Settings.tsx:395` lists all `SUPPORTED_LANGUAGES`, badging the 5 partials "BETA" — but the badge conveys nothing about coverage, and `fallbackLng:'en'` silently fills the other 85% with English. *Verification nuance:* the 24 translated keys happen to cover the safety-critical end-user surfaces (speech bar, nav tabs, fast phrases); the 136 missing are caregiver/admin screens (hence medium). **Fix:** Hide partial locales until complete, or relabel honestly ("Partial — caregiver screens in English"); add a build-time completeness check failing CI below a threshold; complete the 5 missing `es` keys.

**[HIGH] All `confirm()`/`alert()` destructive prompts are hardcoded English**
`Settings.tsx:47,109,112,182`, `SymbolGrid.tsx:130` (`Remove "${label}"?` — core UI, not behind PIN), `Board.tsx:75`. A non-English caregiver may not understand they're about to wipe a child's entire board. (Verification noted Factory Reset/Import are PIN-gated + auto-backed-up, hence the *symbol-delete* confirm is the sharpest unguarded one.)
**Fix:** Replace native dialogs with a translated in-app modal (also fixes RTL — native dialogs ignore app `dir`); add the missing keys; prioritize the irreversible paths.

**[MEDIUM] TabBar `nav.<id>` key mismatch** — `TabBar.tsx:60`; `en.json` defines `nav.home/feelings/food/play/myWords` but tab ids are `home,feelings,food,activities,social,body,school,places,routines,custom`. So 7 of 10 tabs (Social, Body, School, Places, Routines, My Words, Play) stay English even in complete locales. **Fix:** Align keys to ids (add `nav.activities/social/body/...`).

**[MEDIUM] RTL minimal + initial render hardcoded LTR/English** — `index.html:2` `lang="en"`; dir/lang set only post-mount (`App.tsx:29-30`); RTL CSS flips flex on 7 containers only (`index.css:1558-1564`), no logical properties, no directional-glyph audit (`← Back` at `Settings.tsx:189`). **Fix:** Set lang/dir from persisted `fv_language` before first paint (inline script); use logical CSS properties; finish Arabic before promoting past beta.

**[MEDIUM] CJK/Latin fonts loaded from remote Google Fonts at runtime** — `App.tsx:33-43`, `index.html:24-29`; not precached (cross-origin); Arabic has no declared font at all. Fails offline / wastes metered data for non-Latin locales. **Fix:** Self-host + precache Noto subsets for ar/zh/ja.

**[LOW] Polish `pl.json` shipped (byte-identical to en) but never registered** — not imported, not in `SUPPORTED_LANGUAGES`. Unreachable dead ~6 KB. **Fix:** Remove (or translate + register); add a test asserting every locale file is wired and not 100% identical to en.

**[LOW] Detector lacks `supportedLngs`/`load:'languageOnly'`** — `i18n/index.ts:34-38`; `pt-BR`/`zh-CN`/`zh-TW` may silently fall to English. **Fix:** Add `supportedLngs`, `load:'languageOnly'`, `nonExplicitSupportedLngs:true`, a dev `missingKeyHandler`.

**[LOW] Interpolation keys defined but bypassed; zero pluralization** — `Settings.tsx:204`, `OnboardingWizard.tsx:68/106`, `SymbolSearch.tsx:68` hand-build strings; `Settings.tsx:69` "Merged {n} symbols" has no plural handling (wrong for Polish/Arabic). **Fix:** Use the existing interpolation keys; add i18next plural keys; `Intl.NumberFormat`.

---

### 3.8 General Correctness

**[HIGH] Editing/deleting a DEFAULT symbol in Parent Mode silently does nothing**
The context menu offers Edit/Delete for any symbol (`SymbolContextMenu.tsx:30-38`, gated by `allowEdit`). But `updateCustomSymbol`/`deleteCustomSymbol` (`boardStore.ts:202-217`) call `db.symbols.update/delete` without checking for `default-` ids — and **all 1222 default symbols** live in `symbols.json`, not `db.symbols` (v9 deleted them from IDB). Dexie update/delete on a non-existent key resolves with 0 rows and no throw; the UI just closes the dialog → **false success**. A parent correcting a wrong/unsafe phrase sees it "work" but the child keeps tapping the wrong word. (Defaults *can* still be hidden via `toggleSymbolHidden`, softening delete but not edit.)
**Fix:** Branch on `default-` ids → apply via a `symbolOverride` table read in `loadSymbols` (mirroring the existing hidden-override pattern); set `deleted:true` for default deletes; check `db.symbols.update`'s return-row-count and surface 0-row failures. Minimum: hide/disable Edit/Delete for default ids so no action silently fails.

**[HIGH] TTS audio cache key omits speed** — *see §3.1 (top correctness finding).*

---

## 4. Phased Roadmap

### Phase 1 — Quick Wins (hours → a few days)
*Highest impact-per-effort. Most are 1–20 lines.*

| Item | Effort | Impact |
|------|--------|--------|
| Exclude `characters/**` from precache + add CacheFirst runtime rule (`vite.config.ts`) | Trivial | **Critical** — removes 148 MB from first-load download |
| Remove SW-unregister loop (`Board.tsx:33-41`) | Trivial | **Critical** — restores offline SW lifecycle |
| Remove `?t=${now}` cache-buster + `caches.match` fallback (`symbolsApi.ts:18`) | Small | **Critical** — fixes empty-board-offline; saves 314 KB/cold-start |
| Add `onClick`/`onKeyDown` to `SymbolCard` (keyboard/switch activation) | Small | **Critical** — unblocks switch/keyboard users |
| Add `speed` to TTS cache key (3 sites in `tts.worker.ts`) | Trivial | **High** — correct speed for core words |
| Remove GoatCounter from both `index.html` + `public/index.html` | Trivial | **High** — removes false privacy claim |
| Delete 33 MB build-only source sheets from shipped output | Trivial | **Medium** — 33 MB shipped weight |
| `webContentsDebuggingEnabled:false`, `allowMixedContent:false` (`capacitor.config.ts`); rotate `freevoice123`, scrub from docs | Trivial | **High** — closes PIN bypass / MITM / leaked signing pw |
| `protobufjs >=7.5.8` override + address `@xmldom/xmldom` | Trivial | **Critical (CI)** — unblocks the security gate |
| Wrap `SymbolCard` in `React.memo`; `content-visibility:auto` on `.symbol-card` | Small | **High** — kills O(N) re-render fan-out |
| Lower TTS fallback timeout to ~2 s; remove per-word fan-out | Small | **Medium** — worst-case 15 s → ~2 s |
| Branch `update/deleteCustomSymbol` on `default-` ids (or disable for defaults) | Small | **High** — no silent false-success edits |
| `serialize-javascript` override → `^6.0.2`; remove `react-router-dom` | Trivial | Medium — build stability / dead dep |

### Phase 2 — High-Impact (1–2 weeks)

| Item | Effort | Impact |
|------|--------|--------|
| **WebP-encode all symbol/character images** (slice scripts + 3 consumers + regenerate `symbols.json`) | Small–Medium | **Critical** — ~159 MB payload |
| Add `db.symbolHidden` (+ language/character) to backup/restore | Small | **High** — prevents vocabulary loss on migration |
| Modal a11y: shared `useModalA11y` (focus trap, Escape, focus return, `role=dialog`) | Medium | **High** — usable modals for AT users |
| Localize aria-labels + all `confirm()`/`alert()` via in-app translated dialogs | Medium | **High** — non-English AT + destructive-action safety |
| Make Kokoro opt-in (default Web Speech) + ship single-threaded WASM (~11 MB) | Medium | **High** — ~21.6 MB + ~80 MB deferred; fixes non-isolated WebViews |
| Wire existing translations into the UI (Settings, About, modals, onboarding) | Large | **Critical** — usable non-English caregiver UI |
| Route non-English locales to language-correct Web Speech (`utterance.lang`) | Medium | **Critical** — intelligible speech for ~half the locales |
| Build a `boardId→symbols` Map + cached hidden-set; `boardStore` error UI + retry | Medium | High — faster, resilient navigation |
| `React.lazy` ParentMode/Settings; dynamic-import `defaultBoards` in migrations | Medium | Medium — startup cleanliness |
| Touch-target/contrast fixes on chrome bars (coreword/quickfire/crumb/labels) | Medium | Medium — fewer mis-taps / readable text |
| Switch to `prompt`-style PWA updates (no mid-sentence reload) | Small | Medium — safe updates |

### Phase 3 — Bigger Bets (weeks)

| Item | Effort | Impact |
|------|--------|--------|
| Self-host Kokoro model **and** voices same-origin + durable cache (+ host COOP/COEP) | Large | **High** — true offline premium voice; fixes web-path isolation |
| Implement switch-access scanning (single/two-switch, row/column, configurable) | Large | **Critical access method** for severe motor impairment |
| Multilingual on-device voice packs / language→voice selection | Large | High — premium voice for non-English users |
| Complete + gate the 5 partial locales; build-time completeness CI; finish RTL (logical CSS, pre-paint dir, self-hosted Noto subsets) | Medium–Large | High — honest, fully-localized non-English experience |
| Harden admin server (auth, 127.0.0.1, CORS, no execSync); add CSP; self-host fonts; document third-party endpoints in a privacy policy | Medium | Medium — privacy/security hygiene |
| ESLint `recommendedTypeChecked` + i18n lint + offline/migration tests in CI; consolidate churn docs; delete dead code | Medium | Medium — maintainability for volunteers |

---

## 5. Honest Severity Calibration (what the verification changed)

- **Down-graded:** the "muffled desktop speech" bug (critical → **medium**: 2× upsampling is normally transparent); SW-unregister and the broken-offline-cold-start (critical → **high**: intermittent race, cache survives `unregister`); no-virtualization & full-res-PNG performance (high → **medium/low**: bounded item counts, images already lazy, no real CLS); build-source-sheets (high → **medium**: not per-user data); ARASAAC license (critical → **high**: scoping gap, attribution already present); license-audit & Gemini-art (high → **medium/low**); 5-partial-locales (high → **medium**: critical surfaces are translated). The keystore "committed" claim was **factually wrong** (gitignored, never in history) — the real issue is the leaked `freevoice123` in docs.
- **Held at critical:** precache of 148 MB; symbols.json cache-buster (empty board offline); keyboard/switch inoperability; no switch scanning; protobufjs CI gate; i18n disconnection; English-only neural voice.

The throughline: **payload and offline reliability are the dominant, cheapest wins, and a handful of accessibility/correctness defects can silently leave a real user without a voice.** Almost all of it is fixable in the Phase 1–2 window.
# FreeVoice AAC — Master Bug List & Phased Sprint Plan

> ## ✅ Implementation status (updated 2026-06-01)
> **Verified after every batch:** `tsc -b` ✓ · `eslint src` ✓ · `npm run build` ✓ · `npm audit` **0 vulnerabilities** ✓.
> **Payload result: dist/app 221MB → 30MB · first-load PWA precache 177MB → 2.43MB.**
>
> **Sprint 1 — COMPLETE:** A11Y-01 keyboard/switch activation · OFF-01 SW-unregister removed · OFF-02 cache-buster removed + offline fallback · OFF-03 boardStore retry UI · PAY-01 character art out of precache · TTS-01 speed in cache key · COR-01 default-symbol edit/delete → honest "Hide" · SEC-01 GoatCounter removed (both HTML) · SEC-02/04 Capacitor debug+mixed-content off · BLD-01 protobufjs/@xmldom overrides + audit fix · BLD-04 serialize-javascript kept at ^7.0.5 (audit's ^6 was stale — would re-open an RCE) · PERF-07 dead react-router-dom removed.
>
> **Sprint 2 — mostly complete:** PAY-01 ✓ · **PAY-02 WebP** (character art 148→3.4MB, symbols 27→1.3MB; slice scripts now emit WebP) ✓ · **PAY-03** sprite/drink source sheets pruned from shipped output ✓ · PERF-01 SymbolCard memoized + `content-visibility` ✓ · TTS-03 AudioContext→24kHz (muffled-desktop fix) ✓ · TTS-04 worker cache bounded (LRU, core pinned) ✓ · TTS-05 per-word synthesis flood removed ✓ · TTS-06 timeout 15s→2.5s ✓ · PERF-03 ARASAAC 500→300px ✓. *Remaining:* PAY-04 single-threaded WASM (already deferred-download, not in first load), PAY-05 code-split, TTS-10 interrupt-race refactor.
>
> **Sprint 3 — core done:** **I18N-02** non-English routed to language-correct Web Speech (`utterance.lang` + voice match) ✓ · **I18N-05** all 10 tab keys added across every locale ✓ · I18N-09 detector `supportedLngs`/`load:languageOnly` ✓. *Remaining (large):* I18N-01 wire `t()` across all components, I18N-03/A11Y-07 in-app translated dialog, I18N-04 locale gating, I18N-06 RTL pre-paint, I18N-07 self-host fonts.
>
> **Sprint 5 — started:** **OFF-04** backup/restore now includes `symbolHidden` + language + character ✓ · OFF-10 chunked base64 ✓ · OFF-11 SW denylist aligned to /app/ ✓. *Remaining:* OFF-05/06 self-host model (needs hosting decision), OFF-07 scoped factory reset, OFF-08 prompt-style updates, OFF-09 ARASAAC pre-warm, TTS-07/08, SEC-03/05/06/08.
>
> **Also fixed:** pre-existing **`ItemDef` type error** that broke `npm run build` (the real `tsc -b` never ran clean; root `tsconfig.json` made `npm run type-check` a no-op).
>
> **Not yet started:** Sprint 4 (accessibility hardening beyond A11Y-01) · Sprint 6 (switch scanning, multilingual voice packs, licensing/CI). **Your actions:** rotate keystore password `freevoice123` + scrub docs (SEC-07); pick a header-capable host for COOP/COEP (OFF-06); ARASAAC relicense-vs-replace (BLD-02).



> Source: full multi-agent code audit (`CODE_AUDIT_2026-06.md`). 88 findings → deduplicated here into **57 actionable items**, all grounded in real `file:line` evidence and adversarially verified.
> Severity: 🔴 Critical (leaves a user without a voice / breaks the core) · 🟠 High · 🟡 Medium · 🟢 Low.
> Effort: T = trivial (≤1 line / minutes) · S = small (hours) · M = medium (1–3 days) · L = large (week+).

---

## Part 1 — Master Bug List

### A. Accessibility (the app's entire purpose)

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| A11Y-01 | 🔴 | Symbol cards can't be activated by keyboard or switch (only pointer events; synthetic `click` is unhandled) — AT *announces* them as buttons, so it lies | `SymbolCard.tsx:180,212-220` | Add `onClick={() => onTap(symbol)}`; demote pointer handlers to affordance-only; suppress synthetic click after a real pointer sequence |
| A11Y-02 | 🔴 | No switch-access scanning anywhere (no scan loop, no settings) — single/two-switch users can't navigate or select | `Settings.tsx` a11y section, `settingsStore.ts` | Implement single-switch auto + two-switch step scanning, visible highlight, row/column, configurable speed/mode/key (L) |
| A11Y-03 | 🟠 | Modals have no focus trap, no Escape, no focus return, no `role=dialog`/`aria-modal` | `CustomWordModal.tsx:88`, `SymbolSearch.tsx:52`, `PinModal.tsx:85`, `BoardPicker.tsx:30`, `SymbolContextMenu.tsx:22`, `OnboardingWizard.tsx:30` | Shared `useModalA11y` hook (role/aria, Escape, trap, capture+restore `activeElement`, `inert` background) |
| A11Y-04 | 🟠 | Edit/move/delete reachable only via 500 ms long-press — no keyboard/AT path | `SymbolGrid.tsx:64-79` | Focusable "⋮" options button per card (same code path) + `onContextMenu` |
| A11Y-05 | 🟠 | Accessible names hardcoded English in all 10 locales (incl. Arabic RTL) while visible text is translated | `SymbolCard.tsx:218`, `CoreWordsBar.tsx:36`, `FastPhrasesStrip.tsx:24`, `SpeechBar.tsx:83-155`, `Board.tsx:113` | Route aria-labels through `t()`; add `a11y.*` keys; lint-ban literal aria-labels |
| A11Y-06 | 🟡 | Secondary-bar touch targets/labels below 44–48 px (corewords ~23 px, quickfire ~28 px, crumbs ~22 px; labels drop to 7 px <400 px). *Symbol cards themselves are compliant* | `index.css:283,290-308,250-273,333-346,471` | `min-height:44px` on chips; gaps ≥8 px; label floor `clamp(11px,1.8vw,14px)`; per-tab `min-width` |
| A11Y-07 | 🟡 | Destructive actions use native `confirm()`/`alert()` (not translated, ignore RTL, no undo) → accidental loss of a child's vocabulary | `SymbolGrid.tsx:130`, `Settings.tsx:47,108-113`, `Board.tsx:74` | In-app accessible, translated confirm dialog + toast-with-Undo (shared with I18N-04) |
| A11Y-08 | 🟡 | Live region announces whole message state via changing `aria-label` (SRs read text content, not aria-label) — not what was actually spoken | `SpeechBar.tsx:84-91` | Dedicated visually-hidden `aria-live` whose *text content* updates only with the spoken phrase |
| A11Y-09 | 🟡 | Low contrast on default dark theme (~2:1, below WCAG 4.5:1): `--text-secondary` .55, `--text-tertiary` .30, inactive tabs/crumbs | `index.css:33-34` | Raise functional-text contrast to ≥4.5:1 |
| A11Y-10 | 🟡 | No visible focus on inline-styled buttons; text scaling capped (`text-size-adjust:100%`); tablist has no arrow-key roving tabindex | `CharacterPicker.tsx`, `index.css:76-79`, `TabBar.tsx:49-62` | Classed `:focus-visible` rings; honor font scaling (rem/wrap); ARIA tablist arrow-key pattern |
| A11Y-11 | 🟢 | Redundant `alt` on inner imgs; category cards announce "X category" but navigate | `SymbolCard.tsx:233-252` | `alt=""` on inner imgs; "Open {label} board" + `aria-haspopup` |

### B. TTS / Voice

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| TTS-01 | 🟠 | Audio cache key omits speed → after slowing the slider, precached core words (`I, help, pain, stop`) still play at old rate (inconsistent speech) | `tts.worker.ts:289,380,402` | Key on `${voice}:${speed.toFixed(2)}:${text}` at all 3 sites |
| TTS-02 | 🟠 | Desktop users can't opt out of the neural voice (no UI selects `webspeech`; `classifyWebSpeechVoices()` implemented but never rendered) | `ttsStore.ts:70`, `useTTS.ts:46,53,61`, `voiceDetection.ts:43` | "Voice source" toggle (AI vs device) in `VoiceSelector` → `setActiveTier`; render device voices; don't override deliberate choice on `LOAD_COMPLETE` |
| TTS-03 | 🟡 | 24 kHz WAV resampled by 48 kHz `AudioContext` on desktop (the "muffled" report — **downgraded**: 2× upsample is normally transparent, but still worth fixing) | `useTTS.ts:86,131` | `new AudioContext({ sampleRate: 24000 })` in try/catch; recreate if `sampleRate !== 24000` |
| TTS-04 | 🟡 | `audioCache` grows unbounded in the worker (~290 KB/utterance) → worker killed mid-session on 2 GB devices | `tts.worker.ts:253` | LRU cap (200–400 entries or byte budget); pin `PRECACHE_LIST` |
| TTS-05 | 🟡 | Per-word re-synthesis flood + serial worker blocking → next real tap queues behind backlog (+1–5 s latency, battery/heat) | `useTTS.ts:292-301`, `tts.worker.ts:346` | Live SPEAK strict priority (drop queued SPEAK_AND_CACHE on new SPEAK); kill per-word fan-out; add CANCEL/FLUSH |
| TTS-06 | 🟡 | Worst-case 15 s fallback timeout = up to 15 s of silence on a stalled model | `useTTS.ts:303-309` | Lower to ~1.5–2.5 s; speak via Web Speech immediately if Kokoro hasn't produced audio |
| TTS-07 | 🟡 | First-launch offline/metered model download has weak recovery (no retry/backoff, no size warning, no "tap to retry") | `tts.worker.ts:181`, `useTTS.ts:304-309` | Retry-on-error + "Download voice / Retry" surfaced from `kokoroStatus==='error'`; show size; bridge to Web Speech on first tap |
| TTS-08 | 🟡 | Cache↔IndexedDB model persistence is fragile (substring cache match; marker written before verify; restores to guessed cache name; voices cache not backed up) | `tts.worker.ts:67-144,242` | Resolve/store real cache name; verify key count before trusting marker; back up the `kokoro-voices` cache; surface failures |
| TTS-09 | 🟢 | WebGPU forced fp32; WASM hardcoded q8; no q4 downgrade for very weak devices | `tts.worker.ts:218-237`, `useTTS.ts:244` | Pass measured dtype by device capability |
| TTS-10 | 🟠 | Interrupt races: module-level worker callback map + shared `currentAudioSource` → rapid tapping clips/double-speaks | `useTTS.ts:15-17,73,140` | Track active SPEAK id, ignore superseded `AUDIO_READY`, send explicit CANCEL; encapsulate worker+callbacks+source |

### C. Payload & Performance

| ID | Sev | Bug | Where | Fix / Savings |
|----|-----|-----|-------|---------------|
| PAY-01 | 🔴 | Workbox precaches ~148 MB of character PNGs on first load (metered-data catastrophe) | `vite.config.ts:25-26` | Exclude `characters/**` from precache + CacheFirst runtime rule → **−148 MB first load** (T) |
| PAY-02 | 🔴 | Symbol/character images are unoptimized 500×500 PNGs | slice scripts + 3 `.png` consumers + `symbols.json` | Emit WebP q80; update consumers; regenerate → **~−159 MB** (S) |
| PAY-03 | 🟡 | 33 MB of build-only source sprite sheets ship to users (also committed twice) | `public/`, `assemble-dist.mjs`, `slice-sprites.mjs` | Move source sheets out of shipped output → **−33 MB** (T) |
| PAY-04 | 🟠 | 21.6 MB ONNX WASM + ~80 MB model load even for users who won't use AI voice; threaded build needs isolation many WebViews lack | `vite.config.ts`, `tts.worker.ts` | Make Kokoro opt-in (default Web Speech); ship single-threaded WASM (~11 MB) → **~−21.6 MB + ~80 MB deferred** (M) |
| PAY-05 | 🟡 | No code-splitting; `ParentMode`/`Settings` + 1911-line `defaultBoards` in the initial bundle | `App.tsx:3-4`, `db/index.ts:2`, `boardStore.ts:3` | `React.lazy` PIN-gated routes; extract `cardColor`; dynamic-import `defaultBoards` in migrations (M) |
| PERF-01 | 🟠 | Symbol grid not virtualized + `SymbolCard` not memoized; each card independently subscribes to `settingsStore`, `useCharacterImage`, `useTTS()` → O(N) re-renders + N store notifications + N duplicate effects on any toggle | `SymbolGrid.tsx:175-187`, `SymbolCard.tsx:43-58` | `React.memo`; hoist the 4 settings reads to grid props; move `useTTS()` out of the card; `content-visibility:auto`+`contain-intrinsic-size` on `.symbol-card` (no library) |
| PERF-02 | 🟡 | Every navigation re-filters 1222 symbols + 2 IndexedDB reads before paint | `boardStore.loadSymbols` | Build a `boardId→symbols` Map once after fetch; cache hidden-ids Set, invalidate on hide-toggle |
| PERF-03 | 🟡 | ARASAAC images fetched at `_500` but displayed ~42–110 px | `arasaac.ts:51,71` | Request `_300`; downscale on-device PNGs to ~128 px WebP (with PAY-02) |
| PERF-04 | 🟡 | `useCharacterImage` runs `Array.find` per card per render even on non-feelings boards | `useCharacterImage.ts:14-29` | Short-circuit when `boardToCategory` null; subscribe to `selectedCharacterId` only |
| PERF-05 | 🟡 | `devicePerformance` heuristics flag ~every Android 7–11 device as low-power yet gate nothing (Kokoro downloads anyway) | `devicePerformance.ts:43`, `useTTS.ts:226-245` | Use `deviceMemory`/`hardwareConcurrency`; actually gate the Kokoro download on `isLowPower` |
| PERF-06 | 🟡 | `Settings` subscribes to whole stores; `getState()` read in JSX → stale "Currently using" label | `Settings.tsx:24-26,203-204` | Atomic selectors; proper `useCharacterStore` subscription |
| PERF-07 | 🟢 | `react-router-dom` declared but never imported (routing is one `useState`) — dead dep, blocks deep-linking/back-button | `App.tsx:10`, `package.json` | Remove it (or adopt to enable route-splitting) |
| PERF-08 | 🟢 | CJK font `<link>` injected per language change, never cleaned up | `App.tsx:33-43` | Effect cleanup; remove no-op `useArasaac()` call (`Board.tsx:45`) |

### D. Offline, Data & PWA

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| OFF-01 | 🔴 | App unregisters its own service worker on load → offline lifecycle torn down | `Board.tsx:33-41` | Remove the SW-unregister loop |
| OFF-02 | 🔴 | `symbols.json` fetched with `?t=${now}` cache-buster → bypasses SW cache → **empty board offline** (no symbols = no voice) | `symbolsApi.ts:18` | Drop cache-buster (rely on Workbox revision hash); on failure `caches.match('/app/api/symbols.json')`; persist last-good to IDB |
| OFF-03 | 🟠 | `boardStore` loaders have no error handling → silently empty board rendered as a normal empty state | `boardStore.ts:127-150,168-175` | Await in try/catch; "Couldn't load symbols — Retry" screen; persist last-good payload |
| OFF-04 | 🟠 | Backup/restore omits the `symbolHidden` table (+ language + character) → hidden default symbols reappear for the child after device migration | `backup.ts:31-54`, `db/index.ts:54,176`, `boardStore.ts:251-268` | Add `db.symbolHidden` + language + character to export/import (guard legacy backups) |
| OFF-05 | 🟠 | Neural model + voices download from `huggingface.co` at runtime (voice URL hardcoded in kokoro-js); first launch needs tens–hundreds of MB; `index.html:20` claims unconditional offline | `tts.worker.ts:5`, `index.html:20` | Self-host model + voices same-origin (`env.remoteHost=origin` + voices patch/SW-intercept); until then gate UX + make the offline claim accurate (L) |
| OFF-06 | 🟠 | COOP/COEP set only for the WebView, not the host (deploy = GitHub Pages, can't send headers) → threaded ONNX silently degrades; `require-corp` would block model/font fetches | `capacitor.config.ts:12-15`, `.github/workflows/build-deploy.yml` | Pick one isolation strategy on a header-capable host (or coi-serviceworker); `crossorigin` on font link; runtime `crossOriginIsolated` check |
| OFF-07 | 🟡 | Factory reset deletes **every** IndexedDB on the origin (incl. the Kokoro model backup → re-download); pre-restore "safety backup" can fail silently | `Settings.tsx:158-166`, `backup.ts:81` | Delete only `FreeVoiceDB`/`FreeVoiceModelCache` by name; make the pre-restore backup verifiable |
| OFF-08 | 🟡 | `autoUpdate` + `skipWaiting` + `clientsClaim` can swap the SW and reload mid-sentence | `vite.config.ts:22,73-74` | `registerType:'prompt'`; apply updates only via the explicit Update button |
| OFF-09 | 🟡 | ARASAAC pictograms are CacheFirst from a cross-origin host → default symbols not yet viewed online show nothing offline; 2000-cap can evict | `vite.config.ts:48-55` | Pre-warm the default vocabulary's pictograms after first online load (or self-host); confirm CORP compat |
| OFF-10 | 🟢 | `btoa(String.fromCharCode(...))` can stack-overflow on large shared boards | `backup.ts:166` | Chunked base64 (0x8000-byte windows) |
| OFF-11 | 🟢 | `navigateFallbackDenylist` targets `/api`,`/terms` at root but app is under `/app/` | `vite.config.ts:71-72` | Align regexes to `/app/` |
| OFF-12 | 🟢 | Dexie v5–v8 migrations depend on `defaultBoards.ts` that v9 made redundant (fragile if removed) | `db/index.ts` | Once users are past v9, neutralize v5–v8 bodies; add a v1→head migration test |

### E. Security & Privacy

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| SEC-01 | 🟠 | GoatCounter analytics loads on the live root the APK opens, contradicting the in-app "Zero data collection / no tracking" promise — COPPA/GDPR-K exposure on a children's app | `index.html:34-35`, `public/index.html:2078-2079`, `About.tsx:69-76` | Remove the snippet from **both** files; rebuild so the live site matches; add a privacy policy if analytics ever returns |
| SEC-02 | 🟠 | Parent PIN trivially bypassable: release WebView debuggable via `chrome://inspect`; PIN hash is single SHA-256 with hardcoded salt `'freevoice-salt'`; unlock flag in-memory only | `capacitor.config.ts:28`, `parentStore.ts:21,27,47,57` | `webContentsDebuggingEnabled:false` for release; per-install random salt; document PIN as a child speed-bump |
| SEC-03 | 🟡 | PIN has no rate-limiting/lockout (auto-verifies, instant retry over 10 000 combos; static salt → rainbow table) | `PinModal.tsx:44-57` | Attempt counter + exponential backoff persisted in IDB; 6-digit option; per-install salt |
| SEC-04 | 🟡 | `allowMixedContent:true` + `webContentsDebuggingEnabled:true` are production-inappropriate (app is HTTPS-only; opens MITM on public/school Wi-Fi) | `capacitor.config.ts:27-28` | Both `false` for release |
| SEC-05 | 🟡 | Admin dev server: wildcard CORS, unauthenticated file-deletion + `execSync`, binds `0.0.0.0:3333` (CSRF/DNS-rebind) — dev-only, end users unaffected | `admin/server.mjs:14` | Bind `127.0.0.1`; shared-secret/origin check; restrict CORS; replace `writeFile`+`execSync` with in-process import |
| SEC-06 | 🟢 | Live Gemini API key in plaintext `admin/.env` (gitignored, but spendable by the unauthenticated admin endpoints) | `admin/.env` | Rotate once; add admin-server auth |
| SEC-07 | 🟢 | Real keystore password `freevoice123` committed in plaintext in tracked docs; `\|\| 'password'` / `?: 'freevoice'` dead fallbacks (the `.jks` itself is correctly gitignored) | `APK_BUILD_QUICK_REFERENCE.md`, `BUILDING_APK.md`, `capacitor.config.ts:33,35` | Treat `freevoice123` as compromised → rotate / Play App Signing; scrub from docs + git history; remove fallbacks so missing secrets fail loudly |
| SEC-08 | 🟢 | No Content-Security-Policy (defense-in-depth gap) | host headers | Strict CSP allowing self + known endpoints (pairs with SEC-01) |
| SEC-09 | 🟢 | Undisclosed external requests leak data: each ARASAAC search sends the symbol keyword (reveals what a non-verbal user is trying to say) + IP; Google Fonts leaks IP/UA | `arasaac.ts:8`, `index.html:24-29` | Document in a privacy policy; self-host fonts (overlaps I18N-07) |

### F. Internationalization

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| I18N-01 | 🔴 | Components hardcode English; ~151/160 translation keys never used → a French caregiver sees ~94% English even though `fr` is 160/160 translated; config UI effectively unusable | only 4 files import `useTranslation`; `Settings`, `About`, `OnboardingWizard`, `VoiceSelector`, modals, etc. | Wire every user-facing string through `t()` using existing keys; add `about.*` namespace; CI check for unused keys (L) |
| I18N-02 | 🔴 | Kokoro has only English voices and no per-language mapping; Web Speech fallback never sets `utterance.lang` → Spanish/Arabic/Chinese/Japanese text read in an American accent | `ttsStore.ts:6-16`, `tts.worker.ts:353`, `useTTS.ts:154-190` | When `i18n.language`≠en, force `webspeech` + set `utterance.lang` (BCP-47) + prefer matching `getVoices()`; language→voice table; badge locales Kokoro can't pronounce (L) |
| I18N-03 | 🟠 | All `confirm()`/`alert()` destructive prompts hardcoded English — a non-English caregiver may not know they're wiping a child's board | `Settings.tsx:47,109,112,182`, `SymbolGrid.tsx:130`, `Board.tsx:75` | Translated in-app modal (shared with A11Y-07) |
| I18N-04 | 🟡 | `it/nl/ar/zh/ja` only 15% translated (24/160) yet selectable; "BETA" badge conveys nothing; `fallbackLng:'en'` silently fills 85% | `Settings.tsx:395` | Hide partial locales until complete or relabel honestly; build-time completeness gate; finish the 5 missing `es` keys |
| I18N-05 | 🟡 | TabBar `nav.<id>` key mismatch → 7 of 10 tabs stay English even in complete locales | `TabBar.tsx:60` vs `en.json` | Add `nav.activities/social/body/school/places/routines/custom` keys |
| I18N-06 | 🟡 | RTL minimal + initial render hardcoded LTR/English (`lang="en"`, dir set only post-mount; RTL flips 7 containers only) | `index.html:2`, `App.tsx:29-30`, `index.css:1558-1564` | Set lang/dir from persisted `fv_language` before first paint; logical CSS properties; finish Arabic before promoting |
| I18N-07 | 🟡 | CJK/Latin fonts loaded from remote Google Fonts at runtime (cross-origin, not precached); Arabic has no declared font | `App.tsx:33-43`, `index.html:24-29` | Self-host + precache Noto subsets for ar/zh/ja (overlaps SEC-09) |
| I18N-08 | 🟢 | Polish `pl.json` shipped (byte-identical to en) but never registered — dead ~6 KB | `i18n/index.ts` | Remove (or translate + register); test asserting every locale is wired & ≠ en |
| I18N-09 | 🟢 | Detector lacks `supportedLngs`/`load:'languageOnly'` → `pt-BR`/`zh-CN` may silently fall to English; interpolation keys bypassed; zero pluralization | `i18n/index.ts:34-38`, `Settings.tsx:69,204` | Add `supportedLngs`, `load:'languageOnly'`, `missingKeyHandler`; use interpolation/plural keys; `Intl.NumberFormat` |

### G. Build, Dependencies & Licensing

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| BLD-01 | 🔴(CI) | `protobufjs@7.5.4` advisory (GHSA-xq3m-2v4x-88gg) + `@xmldom/xmldom` high advisory fail `npm audit --audit-level=high` → CI blocked (end-user RCE risk low; JS not in `dist`) | `security.yml:22-23`, `package.json:64-66` | Add `"protobufjs": ">=7.5.8"` to `overrides`; address `@xmldom/xmldom`; re-audit |
| BLD-02 | 🟠 | ARASAAC pictograms are CC BY-NC-SA 4.0 but `LICENSE` is blanket MIT (which grants "sell" + GitHub Sponsors vs the NC term; ShareAlike on derivatives). Attribution already exists | `LICENSE`, `arasaac.ts:3`, `defaultBoards.ts` (35 ids) | Scope licenses (code=MIT, ARASAAC=CC BY-NC-SA, Kokoro=Apache-2.0) in `LICENSE`/`README`/`NOTICE`; or replace the 35 ARASAAC pictograms with own symbols |
| BLD-03 | 🟡 | `license-audit` script fails red (BlueOak-1.0.0×13, 0BSD, MPL/LGPL build deps, root `UNLICENSED`) | `package.json:18` | Allowlist the genuinely permissive ones; document weak-copyleft build-only deps; set root `license`; add `--production` |
| BLD-04 | 🟡 | `serialize-javascript` override `^7` vs Workbox's `^6` (major bump risks breaking SW precache; CVE only needs `>=6.0.2`) | `package.json:64-66` | Lower to `^6.0.2` |
| BLD-05 | 🟡 | CI license grep only scans `npm ls`, misses the runtime ARASAAC NC asset | `security.yml:24-31` | Add a source/asset scan; wire `license-audit` into CI |
| BLD-06 | 🟢 | Source sheets + sliced PNGs both committed (148 MB duplicate art in VCS) | repo | One source of truth (regenerate from sheets, or commit outputs only) |
| BLD-07 | 🟢 | Gemini-generated character art lacks a machine-readable asset-local license (rights *are* claimed in `terms.html:91`) | `public/characters/` | Add `public/characters/LICENSE.md` with a concrete license (CC BY 4.0 / CC0) |
| BLD-08 | 🟢 | Carets on new majors: `vite ^8.0.1` (3 high dev advisories), `@capacitor/* ^8.3.0` | `package.json` | `npm audit fix`; tilde-pin; add Dependabot |

### H. Correctness & Code Quality

| ID | Sev | Bug | Where | Fix |
|----|-----|-----|-------|-----|
| COR-01 | 🟠 | Editing/deleting a **default** symbol in Parent Mode silently does nothing (all 1222 defaults live in `symbols.json`, not `db.symbols`; Dexie update/delete on missing key resolves 0 rows, no throw) → false success; a parent "fixes" an unsafe phrase but the child keeps tapping it | `SymbolContextMenu.tsx:30-38`, `boardStore.ts:202-217` | Branch on `default-` ids → `symbolOverride` table read in `loadSymbols`; set `deleted:true` for default deletes; check returned row-count. Minimum: disable Edit/Delete for default ids |
| COR-02 | 🟢 | `CapacitorDebugPanel` (270 lines) is dead code; ~15 churn `*_SUMMARY/_FIX/_GUIDE.md` docs | `CapacitorDebugPanel.tsx` | Delete; consolidate docs |
| COR-03 | 🟢 | ESLint at bare recommended; `react-hooks` rule disabled; `exhaustive-deps` suppressed in `SymbolCard` — exactly where effect bugs hide in AI-generated code | `eslint.config.js:13-24`, `SymbolCard.tsx:121` | `recommendedTypeChecked`; keep hooks rules on; fix offenders |

---

## Part 2 — Phased Sprint Plan

**Assumptions** (adjust to taste): 1–2 developers, **~1-week sprints**. Sprints are ordered so that *nobody is left unable to speak or load the app* first, the *90% payload cut* lands immediately after, then language/AT/data-safety. Within a sprint, do items top-to-bottom. Each sprint ends with the listed **Definition of Done**.

> If you only ship one sprint, ship **Sprint 1** — it removes every "user can't use the app at all" defect and cuts ~90% of the download with near-zero risk.

### 🚑 Sprint 1 — "Restore the voice & stop the bleeding" (1 wk, mostly trivial)
*Goal: every user — including keyboard/switch — can speak; offline works again; first-load download drops ~90%; CI unblocked.*

- **A11Y-01** keyboard/switch activation on symbol cards 🔴 *(release blocker)*
- **OFF-01** remove SW-unregister loop 🔴
- **OFF-02** + **OFF-03** remove `symbols.json` cache-buster, add cache fallback + boardStore retry UI 🔴
- **PAY-01** exclude `characters/**` from precache 🔴 *(−148 MB)*
- **PAY-03** stop shipping the 33 MB source sheets 🟡 *(−33 MB)*
- **TTS-01** add speed to the audio cache key 🟠
- **COR-01** stop silent false-success on default-symbol edit/delete 🟠
- **SEC-01** remove GoatCounter from both HTML files 🟠
- **SEC-02 / SEC-04** `webContentsDebuggingEnabled:false`, `allowMixedContent:false`; rotate `freevoice123`, scrub docs (**SEC-07**) 🟠
- **BLD-01** `protobufjs`/`@xmldom/xmldom` overrides; **BLD-04** `serialize-javascript ^6`; **PERF-07** drop dead `react-router-dom` 🟡

**DoD:** a switch/keyboard user can build & speak a sentence; airplane-mode cold start shows a full board; Lighthouse/precache manifest < ~30 MB; `npm audit --audit-level=high` and CI pass; the About "no analytics" claim is true on the live site.

### 📦 Sprint 2 — "Cut the payload & smooth the grid" (1–1.5 wk)
*Goal: payload → ~25 MB; the grid stops re-rendering the world; taps feel instant.*

- **PAY-02** WebP-encode all symbol/character images (slice scripts + 3 consumers + regenerate `symbols.json`) *(~−159 MB)*
- **PAY-04** Kokoro opt-in + single-threaded WASM *(~−21.6 MB + ~80 MB deferred)*
- **PERF-01** `React.memo` SymbolCard + `content-visibility` + hoist settings reads + move `useTTS()` out of the card
- **TTS-05 / TTS-10** live-SPEAK priority, kill per-word fan-out, CANCEL message, fix interrupt races
- **TTS-06** drop fallback timeout to ~2 s; **TTS-04** LRU cap on `audioCache`
- **PERF-03** request ARASAAC `_300`; **PAY-05** lazy-load ParentMode/Settings + dynamic-import `defaultBoards`

**DoD:** `dist/app` ≤ ~25 MB; toggling a setting re-renders ≤1 card; rapid tapping never double-speaks; first tap speaks within ~2 s even if the model stalls.

### 🌍 Sprint 3 — "Usable in every language" (1.5–2 wk)
*Goal: non-English caregivers get a real UI; non-English users get intelligible speech.*

- **I18N-01** wire existing translations into all components (the big one)
- **I18N-05** fix TabBar `nav.*` key mismatch
- **I18N-02** route non-English locales to language-correct Web Speech (`utterance.lang`); **TTS-02** add the AI-vs-device "Voice source" toggle
- **I18N-03 / A11Y-07** replace native `confirm()`/`alert()` with a shared in-app, translated, undoable dialog + toast
- **I18N-04 / I18N-08 / I18N-09** hide or honestly relabel partial locales; remove `pl.json`; detector `supportedLngs`
- **I18N-07 / SEC-09** self-host + precache fonts (also fixes offline + a privacy leak)

**DoD:** switching to French/Spanish translates the whole UI incl. tabs and dialogs; a Spanish sentence is read in a Spanish voice; partial locales are either complete or clearly labeled; no runtime Google Fonts request.

### ♿ Sprint 4 — "Accessibility hardening" (1.5 wk)
*Goal: AT-usable modals, targets, contrast, and reversible mistakes.*

- **A11Y-03** shared `useModalA11y` (focus trap, Escape, role/aria, focus return) across all modals
- **A11Y-04** focusable "⋮" options button per card (replaces long-press-only)
- **A11Y-05** localize all aria-labels (`a11y.*` keys)
- **A11Y-06 / A11Y-09 / A11Y-10** touch-target/spacing/label-size, contrast ≥4.5:1, visible focus, text scaling, tablist arrow keys
- **A11Y-08** live region announces the spoken phrase; **A11Y-11** alt cleanup
- **A11Y-07** toast-with-Undo for destructive actions (builds on Sprint 3's dialog)

**DoD:** every modal traps focus, closes on Escape, and returns focus; all interactive chrome meets 44 px / 4.5:1; a screen reader announces what was spoken; deletions are undoable.

### 🛟 Sprint 5 — "Data safety, durable offline & privacy" (1.5–2 wk)
*Goal: never lose a child's vocabulary; truly work offline; honest privacy posture.*

- **OFF-04** backup/restore includes `symbolHidden` + language + character
- **OFF-07** factory reset deletes only named DBs; verifiable pre-restore backup
- **OFF-05 / OFF-06** self-host Kokoro model + voices same-origin with durable cache; resolve host COOP/COEP isolation strategy
- **TTS-07 / TTS-08** model-download retry + size warning; fix cache↔IDB persistence correctness
- **OFF-08** prompt-style PWA updates (no mid-sentence reload); **OFF-09** pre-warm default ARASAAC pictograms
- **SEC-03 / SEC-05 / SEC-06 / SEC-08** PIN lockout; admin-server hardening; rotate Gemini key; CSP
- **OFF-10 / OFF-11** base64 chunking; `/app/` fallback regexes

**DoD:** export→wipe→import round-trips hidden symbols, language, and character; a once-installed device speaks fully offline incl. the neural voice; no destructive reset beyond the app's own DBs; CSP + privacy policy live.

### 🔌 Sprint 6 — "Switch scanning, multilingual voice & maintainability" (2–3 wk)
*Goal: the last major access method, premium multilingual voice, and a codebase volunteers can maintain.*

- **A11Y-02** switch-access scanning (single/two-switch, row/column, configurable)
- **I18N-02 (extended)** multilingual on-device voice packs / language→voice selection
- **I18N-06** finish RTL (logical CSS, pre-paint dir) + complete the partial locales + build-time completeness CI
- **BLD-02 / BLD-03 / BLD-05 / BLD-07** license scoping (NOTICE), character-art license, license-audit in CI
- **COR-03 / COR-02** ESLint `recommendedTypeChecked` + i18n lint + offline/migration tests; delete dead code; consolidate churn docs
- **PERF-02 / PERF-04 / PERF-05 / PERF-06 / PERF-08 / TTS-09 / TTS-03** remaining perf & tuning cleanups (symbol Map cache, device heuristics, dtype, 24 kHz context, font cleanup)
- **BLD-06 / BLD-08 / OFF-12** VCS de-dupe, Dependabot, migration neutralization

**DoD:** a two-switch user can scan and select; non-English users can opt into a matching premium voice; CI enforces licenses, i18n completeness, and offline/migration tests; no dead code.

---

### Quick reference — severity counts
- 🔴 Critical: **8** (A11Y-01, A11Y-02, PAY-01, PAY-02, OFF-01, OFF-02, I18N-01, I18N-02) + BLD-01 (CI blocker)
- 🟠 High: **15** · 🟡 Medium: **24** · 🟢 Low: **10**

*Full evidence, impact, and verification notes for every item: see `CODE_AUDIT_2026-06.md`.*

# FreeVoice AAC — Master Plan
## Shellcraft Labs LLC · Last updated March 28, 2026

---

## Mission

Give every nonverbal child a voice — free, forever, on any device.

---

## What's Built (v1.0 — LIVE at freevoiceaac.app)

### Core AAC System
- [x] 570+ symbols across 35 boards (Home, Feelings, Food, Activities, Social, Body, School, Bedtime, Animals, Places, Clothing, Colors, Weather, Numbers, etc.)
- [x] 5-tab navigation (Home, Feelings, Food, Play, My Words)
- [x] Breadcrumb navigation for nested board hierarchy
- [x] Speech bar — tap symbols to build sentences, tap SPEAK to say them
- [x] Fast Phrases strip — 12 one-tap social phrases (Help, Wait, Done, More, Stop, etc.)
- [x] Core Words bar — 50 high-frequency words always visible
- [x] Symbol search — full-text search across all 570+ symbols
- [x] Custom symbols — add emoji, photo, or label to any board
- [x] Move symbols between boards (long-press → Move to Board)
- [x] Add symbols inside category cards (long-press category → Add inside)
- [x] Board creation and management in Parent Mode
- [x] Alphabetical sort per board

### Voice System (3-Tier TTS)
- [x] Tier 1: Kokoro AI — 80MB on-device model, 9 voices, WebGPU/WASM
- [x] Tier 2: Apple Personal Voice detection (iOS 17+)
- [x] Tier 3: Web Speech API fallback (always available)
- [x] Audio cache — second tap of any word is instant
- [x] Pre-cache — 30 most common AAC words cached on model load
- [x] Web Speech bridge — instant response on cache miss (plays Web Speech while Kokoro synthesizes)
- [x] Pronunciation dictionary — override how specific words are spoken
- [x] Auto-reload on return (browser caches model files)
- [x] Download prompt with "Not Now" persistence

### Character System
- [x] 14 diverse characters with 24 emotions each (336 total images)
  - Alex (white boy), Jordan (African American girl), Sofia (white girl), Miguel (Latino boy), Amara (African American girl), Wei (Asian boy), Aiko (Asian girl), Isabella (Latina girl), Kai (gender-neutral), Leila (medium-dark girl), Tariq (medium-dark boy), Sasha (Eastern European girl), Elijah (dark boy), Lucas (Mediterranean boy)
- [x] Character picker in onboarding (Step 2) with gender + skin tone filters
- [x] Character picker in Settings (change anytime)
- [x] Sprite sheet slicer tooling (npm run slice-sprites)
- [x] Graceful fallback to emoji if no character selected

### Custom Symbol Art
- [x] 40 custom drink icons (sliced from sprite sheet)
- [x] Custom symbol image pipeline (ARASAAC_IDS → CUSTOM_SYMBOL_IMAGES)
- [x] Sprite sheet slicer for drinks (npm run slice-drinks)

### Multilingual (10 Languages)
- [x] i18next + react-i18next + browser language detection
- [x] Full translations: English, Spanish, French, German, Portuguese
- [x] Beta translations: Italian, Dutch, Arabic, Chinese, Japanese
- [x] RTL layout support (Arabic)
- [x] CJK font dynamic loading (Chinese, Japanese)
- [x] Language selector in Settings with flags and BETA badges
- [x] Auto-detects browser language on first load

### Accessibility
- [x] Fitzgerald Key color coding (verb=green, noun=orange, pronoun=yellow, descriptor=blue, social=indigo)
- [x] Auditory Touch mode (first tap previews label, second tap activates)
- [x] Touch dwell time (0-2000ms hold-to-activate for motor tremors)
- [x] Label position (below/above/hidden)
- [x] Symbol size (small/medium/large)
- [x] Card style (colors/pastel/high-contrast)
- [x] Grid column override (auto/3-8 columns)
- [x] Reduced motion support

### Parent Mode
- [x] PIN-locked access (SHA-256 hashed, triple-tap top-right corner)
- [x] Full settings control
- [x] Add/edit/delete symbols on any board
- [x] Move symbols between boards
- [x] Create custom boards
- [x] Sort boards A-Z
- [x] Share boards via compressed URL
- [x] Vocabulary filter (hide/show symbols)

### Data & Backup
- [x] Export all data as JSON (boards, symbols, settings)
- [x] Import (replace all) with auto-backup
- [x] Import (merge) — add boards alongside existing
- [x] Board sharing via pako-compressed URL
- [x] Board import from shared URL (auto-detected on load)
- [x] Reset Symbol Images button

### PWA & Deployment
- [x] Progressive Web App (installable on any device)
- [x] Service worker with Workbox (offline-capable)
- [x] GitHub Actions CI/CD (build, lint, type-check, deploy)
- [x] GitHub Pages deployment (freevoiceaac.app)
- [x] Landing page at domain root, React app at /app/
- [x] Terms of use page
- [x] Help/guide page
- [x] OG image + SEO meta tags
- [x] PWA manifest with icons (72-512px + maskable)
- [x] iOS install prompt
- [x] Service worker update notification

### Design System
- [x] Dark premium navy theme (5-layer background system)
- [x] Amber accent system
- [x] Nunito + Baloo 2 typography
- [x] 3px colored top stripe on cards (deterministic per-symbol color)
- [x] ARASAAC symbol window (white rounded inset for pictograms)
- [x] Character images with clip-path artifact removal
- [x] Responsive grid (4-10 columns based on viewport)
- [x] Safe area support (iPhone notch/home indicator)

---

## What's In Progress

### Character Art
- [ ] Medium-light girl character (Priya — South Asian)
- [ ] More neutral/non-binary characters
- [ ] Expand character art beyond emotions (body, social, school categories)

### Symbol Art
- [ ] Custom icons for Food category (meals, snacks, fruits, vegetables, desserts)
- [ ] Custom icons for Activities category
- [ ] Custom icons for Animals category
- [ ] Custom icons for School category

### i18n Completion
- [ ] Wire remaining components with t() calls (OnboardingWizard, VoiceDownloadPrompt, ParentMode, About, etc.)
- [ ] ARASAAC API language-aware search
- [ ] TTS voice auto-selection based on language
- [ ] Community translation contributions (TRANSLATING.md)

---

## Planned (v1.1)

### Communication Features
- [ ] Sentence prediction — suggest next word based on context
- [ ] Communication history — log of sentences spoken (for SLP review)
- [ ] Quick-reply suggestions after hearing a phrase
- [ ] Visual scene displays (photo-based communication boards)
- [ ] Social stories integration

### Voice Improvements
- [ ] Per-symbol recorded voice (parent/sibling can record their voice for specific symbols)
- [ ] Voice preview in symbol search results
- [ ] Speed/pitch per-symbol override
- [ ] Kokoro multi-language support (when available)

### Board Features
- [ ] Drag-and-drop symbol reordering
- [ ] Board templates (restaurant, doctor visit, birthday party, etc.)
- [ ] Community board library (import from GitHub)
- [ ] Board scheduling (time-of-day boards — morning routine, bedtime)
- [ ] Symbol frequency tracking (most-used symbols rise to top)

### Accessibility
- [ ] Switch scanning support (for physical switch users)
- [ ] Eye gaze integration (WebGazer.js)
- [ ] Head tracking input
- [ ] Keyboard-only navigation improvements
- [ ] Screen reader optimization

---

## Planned (v2.0)

### AI Features
- [ ] AI-powered symbol suggestions based on context
- [ ] Auto-generate boards from a description ("create a board for a doctor visit")
- [ ] Image-to-symbol — take a photo, AI identifies objects and creates symbols
- [ ] Natural language generation — expand symbols into full sentences

### Platform
- [ ] Native iOS app (React Native or Capacitor wrapper)
- [ ] Native Android app
- [ ] Desktop app (Electron or Tauri)
- [ ] Offline-first sync between devices (CRDTs)

### Professional Features
- [ ] SLP dashboard — track client progress, manage multiple profiles
- [ ] Data export for clinical reporting
- [ ] IEP goal tracking integration
- [ ] Multi-user profiles on shared devices (classroom iPad)

---

## Architecture

```
freevoiceaac.app/           → Landing page (static HTML)
freevoiceaac.app/app/       → React AAC app (Vite SPA)
freevoiceaac.app/guide.html → Help guide (static HTML)
freevoiceaac.app/terms.html → Terms of use (static HTML)
```

### Tech Stack
- React 19 + TypeScript + Vite 8
- Zustand (state management with persist middleware)
- Dexie / IndexedDB (local database, 4 tables)
- Kokoro TTS via Web Worker (on-device AI voice)
- i18next (multilingual)
- pako (board sharing compression)
- ARASAAC API (symbol pictograms, CC BY-NC-SA 4.0)
- Workbox (PWA service worker)
- GitHub Actions (CI/CD)
- GitHub Pages (hosting)
- sharp (image processing scripts)

### Database (Dexie v4)
- `boards` — id, name, emoji, parentId, order
- `symbols` — id, boardId, emoji, label, phrase, imageUrl, arasaacId, color, order, isCategory, targetBoardId, hidden, wordType
- `settings` — key/value pairs
- `symbolCache` — keyword → ARASAAC image URL cache (90-day TTL)

### Key Files
- `src/data/defaultBoards.ts` — 570+ symbols, 35 boards
- `src/data/arasaacIds.ts` — Static symbol image lookup (ARASAAC IDs + custom paths)
- `src/store/boardStore.ts` — Board/symbol CRUD, navigation, search
- `src/store/ttsStore.ts` — Voice preferences (persisted)
- `src/store/characterStore.ts` — Character selection (persisted)
- `src/hooks/useTTS.ts` — 3-tier voice system with Web Speech bridge
- `src/workers/tts.worker.ts` — Kokoro inference + audio cache
- `public/characters/` — Character art (14 characters × 24 emotions)
- `public/symbols/` — Custom category icons (drinks, etc.)

---

## Metrics (Target)

| Metric | Target | Current |
|---|---|---|
| Symbols | 1000+ | 570+ |
| Characters | 20+ | 14 |
| Languages | 10 | 10 (5 full, 5 beta) |
| Custom icon categories | 10+ | 1 (drinks) |
| First load time | <3s | ~2s |
| Offline capable | Yes | Yes |
| Monthly active users | Track after launch | Not tracked (zero analytics) |

---

## Business Model

**None.** FreeVoice is free forever. No subscription, no ads, no data collection, no accounts, no premium tier. The cost of hosting is essentially zero (GitHub Pages). The code is MIT licensed. If Shellcraft Labs disappears, the app lives on.

---

## Manual Tasks Remaining

1. 🧑 Create more character sprite sheets (medium-light girl, more neutral options)
2. 🧑 Create custom icon sprite sheets for remaining categories (food, animals, school, etc.)
3. 🧑 Domain DNS configuration (freevoiceaac.app → GitHub Pages)
4. 🧑 App Store listings (when native apps are built)
5. 🧑 Outreach to SLP communities, autism parent groups, school districts
6. 🧑 Submit to AAC resource directories

---

*FreeVoice AAC · Shellcraft Labs LLC · Roswell, Georgia*
*Every child deserves a voice.*

# FreeVoice AAC — Master Plan
## Shellcraft Labs LLC · Last updated March 29, 2026

---

## Mission

Give every nonverbal child a voice — free, forever, on any device.

---

## What's Built (v1.0 — LIVE at freevoiceaac.app)

### Core AAC System
- [x] 1145 symbols across 66 boards (Home, Feelings, Food, Activities, Social, Body, School, Places, Routines, plus culturally diverse food boards, nature, transportation, technology, etc.)
- [x] 10-tab navigation (Home, Feelings, Food, Play, Social, Body, School, Places, Routines, My Words)
- [x] Breadcrumb navigation for nested board hierarchy
- [x] Speech bar — tap symbols to build sentences, tap SPEAK to say them
- [x] Fast Phrases strip — 12 one-tap social phrases (Help, Wait, Done, More, Stop, etc.)
- [x] Core Words bar — 50 high-frequency words always visible
- [x] Symbol search — full-text search across all 1145 symbols
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

### Symbol System
- [x] Emoji as primary symbol source — all 991 labels set to ID=0 (force emoji)
- [x] All emoji verified compatible with Emoji 12.0 (2019) — no white squares on any device
- [x] 28 newer emoji (Emoji 13-15) replaced with universally supported alternatives
- [x] ARASAAC keyword search DISABLED (useArasaac hook is a no-op)
- [x] Static ARASAAC IDs only for genuinely ambiguous words (nails, bath, brush teeth, etc.)
- [x] 40 custom drink icons (sliced from sprite sheet)
- [x] Custom symbol image pipeline (ARASAAC_IDS → CUSTOM_SYMBOL_IMAGES)
- [x] Sprite sheet slicer for drinks (npm run slice-drinks)
- [x] SLP-recommended verb+noun phrase patterns ("Eat hamburger", "Drink water", "Play soccer")
- [x] Culturally diverse food boards (American, Mexican & Latin, African American, East Asian, South Asian, Middle Eastern, African, Caribbean, European)

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

### Admin Tool (Local Only)
- [x] Express server on port 3333 with board browser
- [x] Gemini API symbol generation (gemini-2.5-flash-image)
- [x] Style reference image support for consistent generation
- [x] Category-specific style hints (food, emotions, people, etc.)
- [x] Bulk generation pipeline

### Design System
- [x] Dark premium navy theme (5-layer background system)
- [x] Amber accent system
- [x] Nunito + Baloo 2 typography
- [x] 3px colored top stripe on cards (deterministic per-symbol color)
- [x] ARASAAC symbol window (white rounded inset for pictograms)
- [x] Character images with clip-path artifact removal
- [x] Responsive grid (4-10 columns based on viewport)
- [x] Responsive symbol cards — labels never cut off on mobile (flex-shrink priority system)
- [x] Safe area support (iPhone notch/home indicator)

---

## What's In Progress

### Symbol Expansion Sprint (BUILT & LIVE)
- [x] 1145 symbols, 66 boards — built and tested locally
- [x] Dexie migration v6 auto-syncs all defaults on upgrade
- [x] Dexie migration v7 fixes unsupported emoji (re-syncs all defaults)
- [x] Culturally diverse food boards (9 cuisine categories)
- [x] SLP verb+noun phrase patterns across all food boards
- [x] Routines, Transportation, Technology, Nature boards
- [x] Emoji compatibility audit — all 1145 symbols render on Android 10+, iOS 13+, Windows 10+

### UX & Accessibility Fixes (March 29, 2026)
- [x] **Sentence bar overflow** — max-height 80px, horizontal scroll, grid fills remaining space
- [x] **Scroll-tap conflict** — 10px movement threshold guard, prevents accidental tile activation
- [x] **Settings debug display** — URL and version now visible in About section
- [x] **Bottom emoji** — changed from 🙏 to 🩳 (shorts) for clarity
- [x] **System overlay interference** — fixed WebView fullscreen conflicts
- [x] **Voice persistence** — settings now survive force close (Zustand hydration)

### Character Art
- [ ] Medium-light girl character (Priya — South Asian)
- [ ] 4 more neutral/non-binary characters
- [ ] Expand character art beyond emotions (body, social, school categories)

### Symbol Art
- [ ] Custom icons for Activities category
- [ ] Custom icons for Animals category
- [ ] Custom icons for School category

### i18n Completion
- [ ] Wire remaining components with t() calls (OnboardingWizard, VoiceDownloadPrompt, ParentMode, About, etc.)
- [ ] TTS voice auto-selection based on language
- [ ] Community translation contributions (TRANSLATING.md)
- [ ] French translation (autism center volunteer, in progress)
- [ ] Danish translation (AKemist onboarded)
- [ ] Polish translation (interest expressed)

### Polish
- [ ] Replace landing page mockup designs with real app screenshots
- [x] Fix mobile label cutoff on phone view (flex-shrink priority system)
- [x] Fix white square emoji on older devices (28 emoji replaced, Dexie migration v7)

---

## Planned (v1.1)

### Adult Boards (Community-Driven)
- [ ] Work (job, office, colleague, task, break, salary, etc.)
- [ ] Medical (doctor, pharmacy, appointment, symptom, medication, etc.)
- [ ] Money (bank, credit card, payment, bill, loan, budget, etc.)
- [ ] Relationships (friend, family, dating, partner, boundaries, etc.)
- [ ] Transportation (car, bus, train, taxi, directions, gas station, etc.)
- [ ] Mental Health (anxiety, depression, therapy, counselor, support, etc.)
- [ ] Self-Advocacy (accommodation, accessibility need, boundary, right, etc.)

### Adult Character Set
- [ ] Same art style as children characters
- [ ] Adult-presenting diverse options
- [ ] 24 emotion states per character

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
- ARASAAC API (static IDs only for ambiguous words; keyword search disabled)
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
- `src/data/defaultBoards.ts` — 1145 symbols, 66 boards
- `src/data/arasaacIds.ts` — 991 labels all ID=0 (emoji), static ARASAAC IDs for ambiguous words only
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
| Symbols | 1000+ | 1145 ✅ |
| Characters | 20+ | 14 |
| Languages | 10 | 10 (5 full, 5 beta) |
| Custom icon categories | 10+ | 1 (drinks) |
| First load time | <3s | ~2s |
| Offline capable | Yes | Yes |
| Monthly active users | Track after launch | Not tracked (zero analytics) |
| Reddit community response | Strong | 320+ upvotes, 104 comments, 213 shares |
| Play Store status | Approved | Identity verification pending |
| International contributors | Growing | Danish, Polish, French onboarded |

---

## Business Model

**None.** FreeVoice is free forever. No subscription, no ads, no data collection, no accounts, no premium tier. The cost of hosting is essentially zero (GitHub Pages). The code is MIT licensed. If Shellcraft Labs disappears, the app lives on.

---

## Manual Tasks Remaining

1. **Play Store identity verification** — submitted, awaiting Google approval (~2-3 days)
2. **APK rebuild** — for shorts emoji fix (local only, Mike's keystore)
3. **Adult character sprites** — diverse adult-presenting options
4. **Create custom icon sprite sheets** — for remaining categories (animals, school, etc.)
5. **Take real app screenshots** — for landing page (replace mockup designs)
6. **Community translation review** — French (autism center), Danish (AKemist), Polish (pending)
7. **Outreach to SLP communities** — autism parent groups, school districts
8. **Submit to AAC resource directories** — after Play Store approval

---

*FreeVoice AAC · Shellcraft Labs LLC · Roswell, Georgia*
*Every child deserves a voice.*

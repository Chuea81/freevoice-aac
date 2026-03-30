# FreeVoice AAC — Sprint Report
## March 29, 2026 · Shellcraft Labs LLC

---

## Launch & Community Response

### Social Media
- **Reddit** — r/SpicyAutism post hit 320+ upvotes, 104 comments, 213 shares
- **International contributors inbound** — Danish (native), Polish (interest), French (autism center volunteer)
- **Adult AAC gap identified** — community feedback added adult boards to roadmap
- **Pricing confusion identified and fixed** — landing page clarity improved

### Community Engagement
- Samsung S24 FE reset button reply sent
- APK roadmap reply to run_boy93 (55 upvotes)
- Adult AAC co-design invitation sent
- KittenTTS declined gracefully
- French translation + autism center volunteer reply sent
- Danish contributor (AKemist) onboarded
- v1.1.0 and v1.2.0 Reddit update posts published

---

## Landing Page Improvements

- [x] Hero badge consolidated into single pill
- [x] "Always free. No credit card. No subscription. Ever." line added
- [x] $0 stat made visually dominant
- [x] Pricing comparison section header clarified
- [x] $299 struck through, order swapped for clarity
- [x] APK download button added to Getting Started section

---

## Voice System Fixes

- [x] Bug 1: Voice settings now persist after force close (Zustand hydration flag)
- [x] Bug 2: AI voice latency reduced (45+ phrases pre-cached, pointerdown, eager AudioContext resume)
- [x] Bug 3: British voice 70+ pronunciation overrides added
- [x] Rapid tap echo bug fixed — interrupt mode, last tap wins
- [x] SPEAK/STOP toggle button added
- [x] Sentence bar accumulates words, persists until CLEAR
- [ ] 1.5 second TTS delay still present on some interactions (investigating)

---

## Sentence Bar UX (TODAY)

- [x] Sentence bar now horizontally scrollable with max-height cap (80px, ~2 lines)
- [x] Board no longer squished when many words accumulated
- [x] Scroll vs tap disambiguation guard added (10px movement threshold)
- [x] Words persist in bar until CLEAR is tapped
- [x] Backspace button added for word-by-word deletion
- [x] Fix deployed and pushed to main

**Critical for physical/touch users (Star).**

---

## Android WebView & APK

### WebView Fixes
- [x] System overlay interference fixed (Suno, screen recorder, etc.)
- [x] Edge-to-edge layout with safe-area insets
- [x] FLAG_FULLSCREEN enabled
- [x] Accidental tile activation while scrolling fixed (scroll detection guard, 10px threshold)

### Version/Cache System
- [x] Data version display added to Settings → About
- [x] URL debug line added to Settings → About (temporary, for debugging production deploys)
- [x] Version-based cache invalidation implemented (data v9)
- [x] Bundled assets removed from APK — confirmed 3MB remote URL wrapper
- [x] APK confirmed loading freevoiceaac.app live

### APK Build Process
- [x] Established: APK builds are **LOCAL ONLY** (keystore on Mike's machine)
- [x] Claude Code handles **web deploys only** (GitHub Actions automated)
- [x] GitHub Actions handles web build/deploy automatically
- [x] APK build commands documented for repeatability
- [x] 64-bit ABI (arm64-v8a) added for Play Store compliance
- [x] v1.0 → v1.1.0 → v1.2.0 → v1.2.1 released

---

## Play Store

- [x] Shellcraft Labs developer account created
- [ ] Identity verification submitted — awaiting Google approval (~2-3 days)
- [x] Store listing metadata prepared

---

## Onboarding

- [x] Adult/child fork designed ("Who is FreeVoice for?")
- [x] Feature flagged, on feature branch, not yet merged

---

## Bugs Fixed Today

| Bug | Status | Details |
|---|---|---|
| Sentence bar overflow | ✅ FIXED | Max-height 80px, horizontal scroll, grid fills space |
| Scroll activating tiles | ✅ FIXED | Pointer movement > 10px cancels tap, ripple still shows |
| Bottom emoji (peach) | ✅ FIXED | Changed to 🩳 (shorts) to represent child's bottom |
| Settings debug display | ✅ ADDED | URL + version now show in About section |

---

## Bugs Still Open

| Bug | Status | Notes |
|---|---|---|
| Peach emoji on Bottom | 🔄 IN REVIEW | Changed to shorts 🩳, live on web, APK needs rebuild |
| Duplicate symbols (Transportation) | ⏳ PENDING | Data seeding investigation |
| 1.5s TTS delay | ⏳ INVESTIGATING | Some interactions slower than expected |

---

## Roadmap Items Added From Community

### Adult Boards (v1.1)
- [ ] Work board (job, office, colleague, task, break, etc.)
- [ ] Medical board (doctor, pharmacy, appointment, pain, symptom, etc.)
- [ ] Money board (bank, credit card, payment, bill, etc.)
- [ ] Relationships board (friend, family, dating, partner, etc.)
- [ ] Transportation board (car, bus, train, taxi, directions, etc.)
- [ ] Mental Health board (anxiety, depression, therapy, support, etc.)
- [ ] Self-Advocacy board (accommodation, accessibility need, boundary, etc.)

### Adult Character Set
- [ ] Same art style as children characters
- [ ] Adult-presenting options
- [ ] Same 24 emotion states per character

### Translation
- [ ] French landing page (autism center volunteer)
- [ ] Full French translation (community contributed)
- [ ] Danish translation (AKemist onboarded)
- [ ] Polish translation (interest expressed)

### Play Store
- [ ] APK on Google Play Store (identity verification pending)
- [ ] Listing optimization for AAC/autism keywords

---

## Deployment Status

| Environment | Status | Details |
|---|---|---|
| Web (freevoiceaac.app) | ✅ LIVE | All fixes deployed, live now |
| APK (v1.2.1) | ⚠️ LOCAL | Needs rebuild for peach→shorts change, awaiting Mike |
| Play Store | ⏳ PENDING | Identity verification in progress |

---

## Today's Commits

```
commit 61d6a4b — Add URL debug to Settings
commit a783467 — Fix sentence bar overflow + scroll-tap conflict
commit dc8b445 — Replace Bottom emoji from praying hands to eggplant
commit cc87f0b — Replace Bottom emoji with baby (represents child's bottom)
commit 6aec83e — Replace Bottom emoji with shorts
```

---

## Key Metrics

| Metric | Value |
|---|---|
| Total symbols | 1145 |
| Total boards | 66 |
| Languages supported | 10 (5 full, 5 beta) |
| Characters | 14 (+ adult set planned) |
| Lines of code | ~12,000 |
| Size (bundled APK) | 3.2 MB |
| Size (web SPA) | ~2.1 MB (gzipped) |
| First load time | ~2s |
| Offline capable | Yes |
| Reddit upvotes | 320+ |
| Comments | 104 |
| Shares | 213+ |

---

## Next Steps

1. **Play Store identity verification** (awaiting Google, ~2-3 days)
2. **APK rebuild** for shorts emoji fix (Mike's machine)
3. **Adult boards sprint** (Work, Medical, Money, Relationships, etc.)
4. **Adult character art** (diverse adult-presenting options)
5. **Duplicate symbols investigation** (Transportation board)
6. **TTS latency** (1.5s delay investigation)
7. **Food & drinks emoji fill-in** (backlog)

---

## Shoutouts

- **Community** — 320+ upvotes, 104 comments, 213 shares on Reddit. Massive momentum.
- **International contributors** — Danish, Polish, French volunteers stepping up.
- **Mike** — APK build & deployment architecture, identity verification submission.
- **Claude Code** — Sentence bar fix, scroll detection guard, emoji debugging sprint.

---

**Insane day. 🚀**

*FreeVoice AAC · Shellcraft Labs LLC · Free, forever, for every nonverbal child.*

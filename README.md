# FreeVoice AAC

**Free, open-source AAC communication app for nonverbal children.**

No subscription. No account. No ads. No data collection. Works offline. Forever free.

[Open FreeVoice](https://freevoiceaac.app/app/)

---

## If this helps your family, please star the repo so other families can find it

Every star helps FreeVoice appear in GitHub search results. Many parents of nonverbal children search GitHub for free AAC alternatives. Your star is how they find us.

[![GitHub stars](https://img.shields.io/github/stars/Chuea81/freevoice-aac?style=social)](https://github.com/Chuea81/freevoice-aac)

---

## What is FreeVoice?

FreeVoice is a symbol-based AAC (Augmentative and Alternative Communication) app that runs entirely in the browser. It's designed for nonverbal and minimally verbal children, but works for anyone who communicates with symbols.

- **570+ symbols** across 35 boards (Home, Feelings, Food, Activities, Social, Body, School, and more)
- **AI voices** via Kokoro TTS — natural, warm, human-sounding speech running 100% on-device
- **Works offline** — once loaded, no internet needed
- **Installable PWA** — add to home screen on iPad, Android, Chromebook, or any device
- **Zero cost** — no subscription, no in-app purchases, no locked features, no account required
- **Zero tracking** — no analytics, no data collection, no cookies, no ads

## Why?

Commercial AAC apps cost $100-$400/year. Communication is a human right, not a subscription service.

FreeVoice was built by a parent of a nonverbal child.

## Quick Start

Open [freevoiceaac.app/app/](https://freevoiceaac.app/app/) on any device with a browser. That's it.

For the best experience on iPad: tap Share > Add to Home Screen.

## Tech Stack

- React 19 + TypeScript + Vite
- Zustand (state management)
- Dexie / IndexedDB (local database)
- Kokoro TTS (on-device AI voice synthesis)
- ARASAAC symbols (CC BY-NC-SA 4.0)
- PWA with Workbox (offline support)

## Development

```bash
npm install
npm run dev          # Start dev server at localhost:5174
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

## License

MIT License. Free to use, modify, and distribute.

## Attribution

- Symbols: [ARASAAC](https://arasaac.org) (CC BY-NC-SA 4.0) — Government of Aragon, Spain
- AI Voice: [Kokoro TTS](https://github.com/hexgrad/kokoro) (Apache 2.0)

---

*Built with love by Shellcraft Labs LLC — Roswell, Georgia*

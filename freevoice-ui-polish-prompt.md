# FreeVoice AAC — UI Polish Sprint
## Claude Code Prompt — Fix Everything in the Screenshot

---

A screenshot of the current app has been reviewed. This prompt fixes every
visual issue identified. Do not change any logic, stores, hooks, or TTS code.
This is CSS, layout, and component styling only.

Read `freevoice-design-system-prompt.md` before making any changes.
Every color, radius, font weight, and spacing value in this prompt comes
from that design system. Do not invent new values.

---

## Issue 1 — Grid Layout is Broken (HIGHEST PRIORITY)

The symbol grid has irregular gaps and uneven card sizes. Some cards appear
isolated with empty columns next to them. The bottom half of the screen
is empty — the grid is not filling available vertical space.

### Root cause to find and fix:
- The grid container likely lacks `flex: 1` or `min-height: 0` — it is not
  expanding to fill the remaining viewport height between the nav strips and
  the tab bar
- The grid itself may have `grid-template-columns` set incorrectly, or cards
  have variable `width`/`flex` values causing uneven sizing
- Cards must all be identical square aspect ratios with no exceptions

### Required fix:

```css
/* Grid CONTAINER — must fill all remaining vertical space */
.symbol-grid-container {
  flex: 1;
  min-height: 0;          /* CRITICAL — without this, flex children don't shrink */
  overflow-y: auto;
  overflow-x: hidden;
  background: #111827;    /* --bg-surface */
  padding: 10px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* Grid itself */
.symbol-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);   /* portrait default */
  gap: 10px;
  width: 100%;
  align-content: start;    /* pack cards to top, no stretching */
}

/* Every card — strict 1:1 square, no exceptions */
.symbol-card {
  aspect-ratio: 1 / 1;
  width: 100%;             /* fill its grid cell */
  min-width: 0;            /* prevent overflow */
}
```

Apply responsive column counts:
```css
@media (min-width: 600px) and (orientation: landscape) {
  .symbol-grid { grid-template-columns: repeat(5, 1fr); }
}
@media (min-width: 900px) {
  .symbol-grid { grid-template-columns: repeat(6, 1fr); }
}
```

Also verify the app root layout:
```css
/* App wrapper — must be a flex column filling the full viewport */
#root, .app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100dvh;           /* dvh not vh — respects iOS keyboard */
  overflow: hidden;
  background: #0C1428;
}
```

The layout stack from top to bottom must be:
1. SpeechBar — fixed height, flex-shrink: 0
2. FastPhrasesStrip / QuickFires — fixed height, flex-shrink: 0
3. CoreWordBar — fixed height, flex-shrink: 0
4. BreadcrumbNav — fixed height, flex-shrink: 0
5. SymbolGrid container — flex: 1, min-height: 0 (THIS IS THE ONE THAT MUST GROW)
6. TabBar — fixed height, flex-shrink: 0

Every item except #5 must have `flex-shrink: 0`. Only #5 has `flex: 1`.

---

## Issue 2 — Symbol Cards Look Flat and Generic

Cards have plain flat colored backgrounds with white-background ARASAAC images
creating jarring white boxes. No top stripe. No depth. Wrong font weight.

### Required card styles:

```css
.symbol-card {
  /* Base */
  background: #1B2845;           /* --bg-card */
  border-radius: 20px;           /* --radius-xl */
  border: 1px solid rgba(255,255,255,0.09);
  position: relative;
  overflow: hidden;

  /* Layout */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 6px 8px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  /* Press state — scale only, NO translateY, NO box-shadow */
  transition: transform 120ms ease-out, filter 120ms ease-out;
}

.symbol-card:active {
  transform: scale(0.93);
  filter: brightness(0.82);
}

/* 3px colored top stripe — category identity color */
.symbol-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--card-color);   /* set via inline style on each card */
  border-radius: 20px 20px 0 0;
}

/* Category navigation cards get a chevron */
.symbol-card[data-is-category="true"]::after {
  content: '▶';
  position: absolute;
  bottom: 5px;
  right: 7px;
  font-size: 8px;
  color: rgba(255,255,255,0.25);
}

/* ARASAAC image — white background problem fix */
/* Wrap the image in a small white-rounded container ("symbol window") */
/* This makes the white bg look intentional rather than broken */
.symbol-image-container {
  width: 56px;
  height: 56px;
  background: rgba(255,255,255,0.92);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  flex-shrink: 0;
}

.symbol-image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Emoji fallback — no container needed */
.symbol-emoji {
  font-size: clamp(28px, 7vw, 44px);
  line-height: 1;
  display: block;
}

/* Card label */
.symbol-label {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(9px, 1.8vw, 12px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: rgba(255,255,255,0.85);
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;
  max-width: 100%;
}
```

### Card color assignment — deterministic, not random:

The color is assigned based on the symbol's ID so it never changes between
renders. Pass it as a CSS custom property on the card element:

```tsx
// In SymbolCard.tsx
const CARD_COLORS = [
  '#F59E0B', '#4FC3F7', '#81C784', '#CE93D8', '#80CBC4',
  '#F48FB1', '#FFCC80', '#AED581', '#90CAF9', '#FF8A65',
];

function getCardColor(id: string): string {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CARD_COLORS[hash % CARD_COLORS.length];
}

// In JSX:
<div
  className="symbol-card"
  style={{ '--card-color': getCardColor(symbol.id) } as React.CSSProperties}
  data-is-category={symbol.isCategory}
>
```

---

## Issue 3 — Speech Bar / Token Area Needs Cleanup

The token area is cramped. SPEAK/TYPE/UNDO/CLEAR buttons are inconsistently
styled. The whole bar needs to feel like a unified command strip.

### Required speech bar styles:

```css
.speech-bar {
  background: #060C1A;             /* --bg-base, deepest */
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 8px 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 68px;
  flex-shrink: 0;
}

.speech-output-area {
  flex: 1;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 8px 12px;
  min-height: 52px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  cursor: pointer;
  overflow: hidden;
}

.speech-output-area:empty::after {
  content: 'Tap symbols to speak…';
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-style: italic;
  font-weight: 700;
  color: rgba(255,255,255,0.2);
}

/* Token chip */
.speech-token {
  background: #1B2845;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  animation: tokenPop 150ms ease-out both;
}

@keyframes tokenPop {
  from { transform: scale(0.65); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

/* Action buttons — all same size, all same shape */
.speech-action-btn {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out, filter 100ms ease-out;
}
.speech-action-btn:active {
  transform: scale(0.91);
  filter: brightness(0.82);
}
.speech-action-btn .btn-icon { font-size: 20px; line-height: 1; }

.btn-speak { background: #27AE60; color: white; }
.btn-type  { background: #1B2845; color: rgba(255,255,255,0.6);
             border: 1px solid rgba(255,255,255,0.12); }
.btn-undo  { background: #D97706; color: white; }
.btn-clear { background: #E11D48; color: white; }

/* SPEAK button pulses while audio is playing */
.btn-speak.is-speaking {
  animation: speakGlow 1.2s ease-in-out infinite;
}
@keyframes speakGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(39,174,96,0); }
  50%       { box-shadow: 0 0 0 8px rgba(39,174,96,0.2); }
}
```

---

## Issue 4 — Fast Phrases Strip Needs Polish

The QuickFires/FastPhrases row uses dark ovals with inconsistent emoji sizing.
It should feel like a polished amber-tinted strip.

```css
.fast-phrases-strip {
  background: #060C1A;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 7px 10px;
  display: flex;
  gap: 7px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
}
.fast-phrases-strip::-webkit-scrollbar { display: none; }

.fast-phrase-btn {
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.22);
  border-radius: 100px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out, background 100ms ease-out;
}
.fast-phrase-btn:active {
  transform: scale(0.94);
  background: rgba(245,158,11,0.18);
}

.fast-phrase-btn .fp-emoji {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}
.fast-phrase-btn .fp-label {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: #FCD34D;
  letter-spacing: 0.2px;
}
```

---

## Issue 5 — Core Word Bar Needs Fitzgerald Color Coding

Currently every core word is the same dark pill. Apply Fitzgerald Key colors:
pronouns = yellow/amber, verbs = green, descriptors/adjectives = blue,
social/misc = indigo. This is a universal SLP convention and it's currently
completely absent.

```css
.core-word-bar {
  background: #060C1A;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 6px 10px;
  display: flex;
  gap: 5px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  flex-shrink: 0;
}
.core-word-bar::-webkit-scrollbar { display: none; }

.core-word {
  border-radius: 8px;
  padding: 5px 11px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out;
}
.core-word:active { transform: scale(0.91); }

/* Fitzgerald Key — apply these classes based on word type */
.cw-pronoun    { background: rgba(251,211,77,0.12); color: #FCD34D; border: 1px solid rgba(251,211,77,0.25); }
.cw-verb       { background: rgba(134,239,172,0.10); color: #86EFAC; border: 1px solid rgba(134,239,172,0.22); }
.cw-descriptor { background: rgba(147,197,253,0.10); color: #93C5FD; border: 1px solid rgba(147,197,253,0.22); }
.cw-social     { background: rgba(165,180,252,0.10); color: #A5B4FC; border: 1px solid rgba(165,180,252,0.22); }
.cw-noun       { background: rgba(253,186,116,0.10); color: #FDBA74; border: 1px solid rgba(253,186,116,0.22); }
```

### Word type mapping — update the CoreWordBar component:

```typescript
// In CoreWordBar.tsx or defaultBoards.ts — add fitzgeraldClass to each word

const CORE_WORDS = [
  // Pronouns — yellow
  { text: 'I',    class: 'cw-pronoun' },
  { text: 'YOU',  class: 'cw-pronoun' },
  { text: 'HE',   class: 'cw-pronoun' },
  { text: 'SHE',  class: 'cw-pronoun' },
  { text: 'WE',   class: 'cw-pronoun' },
  { text: 'THEY', class: 'cw-pronoun' },
  { text: 'MY',   class: 'cw-pronoun' },
  { text: 'IT',   class: 'cw-pronoun' },
  // Verbs — green
  { text: 'WANT', class: 'cw-verb' },
  { text: 'GO',   class: 'cw-verb' },
  { text: 'GET',  class: 'cw-verb' },
  { text: 'MAKE', class: 'cw-verb' },
  { text: 'PUT',  class: 'cw-verb' },
  { text: 'SEE',  class: 'cw-verb' },
  { text: 'EAT',  class: 'cw-verb' },
  { text: 'DRINK',class: 'cw-verb' },
  { text: 'PLAY', class: 'cw-verb' },
  { text: 'READ', class: 'cw-verb' },
  { text: 'SAY',  class: 'cw-verb' },
  { text: 'LISTEN',class:'cw-verb' },
  { text: 'RUN',  class: 'cw-verb' },
  { text: 'LIKE', class: 'cw-verb' },
  { text: 'KNOW', class: 'cw-verb' },
  { text: 'FEEL', class: 'cw-verb' },
  { text: 'NEED', class: 'cw-verb' },
  { text: 'CAN',  class: 'cw-verb' },
  { text: 'THINK',class: 'cw-verb' },
  // Descriptors — blue
  { text: 'THAT', class: 'cw-descriptor' },
  { text: 'THIS', class: 'cw-descriptor' },
  // Social / misc — indigo
  { text: 'SHARE', class: 'cw-social' },
  { text: 'TURN',  class: 'cw-social' },
  { text: 'OPEN',  class: 'cw-social' },
  { text: 'CLOSE', class: 'cw-social' },
  { text: 'GIVE',  class: 'cw-social' },
];
```

---

## Issue 6 — Breadcrumb Navigation Needs More Presence

The current "Feelings" chip is a single small amber chip that looks like an
afterthought. It should be a proper navigation row with a "Home" ancestor.

```css
.breadcrumb-nav {
  background: #111827;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.breadcrumb-nav::-webkit-scrollbar { display: none; }

.breadcrumb-crumb {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: background 120ms ease-out;
}

/* Inactive crumb (ancestors) */
.breadcrumb-crumb {
  background: transparent;
  color: rgba(255,255,255,0.3);
}
.breadcrumb-crumb:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.5);
}

/* Active crumb (current location) */
.breadcrumb-crumb.active {
  background: rgba(245,158,11,0.14);
  color: #F59E0B;
  border: 1px solid rgba(245,158,11,0.28);
}

.breadcrumb-sep {
  color: rgba(255,255,255,0.18);
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
  padding: 0 2px;
}
```

The breadcrumb should always show the full path. On the Feelings page:
`Home  ›  Feelings` — not just `Feelings`.

---

## Issue 7 — Tab Bar Active State Looks Muddy

The active tab (FEELINGS) has a dull brownish-amber background. Make it crisp.

```css
.tab-bar {
  background: #060C1A;
  border-top: 1px solid rgba(255,255,255,0.07);
  padding: 6px 8px;
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Safe area support for iPhone home indicator */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .tab-bar {
    padding-bottom: calc(6px + env(safe-area-inset-bottom));
  }
}

.tab-item {
  flex: 1;
  border-radius: 12px;
  padding: 8px 4px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border: none;
  cursor: pointer;
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: background 150ms ease-out;
}

.tab-item .tab-icon { font-size: 22px; line-height: 1; }
.tab-item .tab-label {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.28);
}

/* Active tab — clean amber, not muddy */
.tab-item.active {
  background: rgba(245,158,11,0.14);
  border: 1px solid rgba(245,158,11,0.28);
}
.tab-item.active .tab-label { color: #F59E0B; }

/* Press state for inactive tabs */
.tab-item:not(.active):active {
  background: rgba(255,255,255,0.05);
}
```

---

## Issue 8 — Fonts Must Be Loaded

Verify that `index.html` has these fonts loading in `<head>`. If missing, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;700;800;900&display=swap"
  rel="stylesheet"
>
```

And in `index.css` global reset, ensure touch-action is set:
```css
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;  /* prevents double-tap zoom on all elements */
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #0C1428;
}
```

---

## Issue 9 — ARASAAC Image White Background Fix

Every ARASAAC image currently appears as a white square on the dark card.
Wrap each image in a "symbol window" container:

```tsx
// In SymbolCard.tsx — replace the image render:

{symbol.imageUrl ? (
  <div className="symbol-image-container">
    <img
      src={symbol.imageUrl}
      alt={symbol.label}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        // Hide broken image, show emoji fallback
        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
        const fallback = e.currentTarget.parentElement?.nextElementSibling;
        if (fallback) (fallback as HTMLElement).style.display = 'block';
      }}
    />
  </div>
) : null}

<span
  className="symbol-emoji"
  style={{ display: symbol.imageUrl ? 'none' : 'block' }}
>
  {symbol.emoji}
</span>
```

---

## What NOT to Change

- Do not change tts.worker.ts, useTTS.ts, or any TTS files
- Do not change ttsStore.ts, boardStore.ts, settingsStore.ts
- Do not change defaultBoards.ts symbol data
- Do not change Dexie schema
- Do not change routing or navigation logic
- Do not add new dependencies

---

## Files to Modify

```
index.html                          — Font loading (if missing)
src/index.css                       — Global reset, CSS custom properties
src/components/SpeechBar/           — Speech bar + token + button styles
src/components/FastPhrasesStrip/    — Fast phrases strip styles
src/components/CoreWordBar/         — Fitzgerald color coding
src/components/BreadcrumbNav/       — Full path breadcrumb styles
src/components/SymbolCard/          — Card styles + ARASAAC image window
src/components/SymbolGrid/          — Grid container layout (flex: 1 fix)
src/components/TabBar/              — Active tab color fix
src/App.tsx or layout component     — Root flex column layout (100dvh)
```

---

## Verification — How It Should Look After

- [ ] Grid fills the full screen top-to-bottom — no empty space at the bottom
- [ ] All cards are the same size, perfectly uniform squares in clean columns
- [ ] ARASAAC images appear in a small white rounded container, not as jarring white squares
- [ ] Cards have a 3px colored stripe at the top (different color per card, deterministic)
- [ ] Core words are color-coded: yellow pronouns, green verbs, blue descriptors
- [ ] Fast phrases strip is amber-tinted pills that scroll horizontally
- [ ] Speech bar tokens pop in with a subtle scale animation
- [ ] SPEAK/UNDO/CLEAR buttons are uniform 52×52px squares with consistent styling
- [ ] Breadcrumb shows "Home › Feelings" not just "Feelings"
- [ ] Active tab has crisp amber tint, not muddy brown
- [ ] Card press is scale(0.93) only — no translateY, no box-shadow flash
- [ ] No white flash on load
- [ ] No double-tap zoom anywhere (touch-action: manipulation)
- [ ] Bottom of grid is flush with tab bar — zero empty space

---

*FreeVoice AAC · Design Polish Sprint · Shellcraft Labs LLC*

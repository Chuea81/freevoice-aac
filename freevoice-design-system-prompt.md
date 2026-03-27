# FreeVoice AAC — Design System & Premium UI Prompt
## Claude Code Prompt — Read This Entire File Before Writing Any CSS

---

## The Core Aesthetic Direction

**Dark, premium, purposeful.** Think: Spotify meets a medical device. Deep navy backgrounds, amber accent, clean white typography, emoji that pop against dark cards. NOT the colorful-cards-on-white look of our original prototype — that was a starting point, not the final design.

The reference is **TD Snap** and **Proloquo2Go** — both have a clean, near-clinical UI that parents and SLPs take seriously. But FreeVoice should feel warmer and more alive than either. The dark theme also has a functional reason: AAC apps are used in bright rooms, classrooms, and outdoors. A white UI washes out in sunlight. Dark doesn't.

**The one thing someone should remember about FreeVoice's UI:** It feels like a premium tool that takes the child's communication seriously — not a toy, not a school worksheet, not a budget app.

---

## Design Tokens — Use These Exact Values

### CSS Custom Properties (add to :root in your global CSS / Tailwind config)

```css
:root {
  /* ── BACKGROUND LAYERS (darkest → lightest) ── */
  --bg-base:     #060C1A;  /* deepest — speech bar, tab bar, modals */
  --bg-app:      #0C1428;  /* app background */
  --bg-surface:  #111827;  /* grid area, settings panels */
  --bg-card:     #1B2845;  /* symbol cards, nav items */
  --bg-raised:   #243356;  /* active/pressed state, selected items */

  /* ── ACCENT COLORS ── */
  --amber:       #F59E0B;  /* primary accent — active tab, highlights */
  --amber-dark:  #D97706;  /* pressed state of amber elements */
  --amber-glow:  rgba(245,158,11,0.15); /* amber tinted bg */
  --green:       #27AE60;  /* SPEAK button */
  --green-glow:  rgba(39,174,96,0.2);   /* speak animation ring */
  --sky:         #4FC3F7;  /* info, secondary nav */
  --rose:        #E11D48;  /* CLEAR button, danger */
  --gold:        #FCD34D;  /* Fitzgerald pronoun */
  --mint:        #86EFAC;  /* Fitzgerald verb */
  --indigo:      #A5B4FC;  /* Fitzgerald social */
  --orange-fitz: #FDBA74;  /* Fitzgerald noun */

  /* ── TEXT ── */
  --text-primary:   rgba(255,255,255,0.92);
  --text-secondary: rgba(255,255,255,0.55);
  --text-tertiary:  rgba(255,255,255,0.30);
  --text-label:     rgba(255,255,255,0.85); /* card labels */

  /* ── BORDERS ── */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-card:    rgba(255,255,255,0.09);
  --border-raised:  rgba(255,255,255,0.14);
  --border-accent:  rgba(245,158,11,0.30);

  /* ── RADII ── */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-full: 100px;

  /* ── TYPOGRAPHY ── */
  --font-display: 'Baloo 2', cursive;     /* app title only */
  --font-body:    'Nunito', sans-serif;   /* everything else */

  /* ── TIMING ── */
  --tap-duration: 120ms;     /* card press feedback */
  --appear-duration: 150ms;  /* token appear animation */
  --fade-duration: 200ms;    /* page transitions */
}
```

### Tailwind Config Extensions (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#060C1A',
          app:     '#0C1428',
          surface: '#111827',
          card:    '#1B2845',
          raised:  '#243356',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dark:    '#D97706',
          glow:    'rgba(245,158,11,0.15)',
        },
        speak:  '#27AE60',
        clear:  '#E11D48',
        sky:    '#4FC3F7',
        fitz: {
          pronoun: '#FCD34D',
          verb:    '#86EFAC',
          social:  '#A5B4FC',
          noun:    '#FDBA74',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body:    ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        full: '100px',
      },
    },
  },
};

export default config;
```

---

## Component Specifications

### 1. Symbol Card

The most-seen component. Must be perfect.

```tsx
// SymbolCard.tsx

const CARD_COLORS = [
  '#F59E0B', // amber
  '#4FC3F7', // sky
  '#81C784', // green
  '#CE93D8', // lavender
  '#80CBC4', // teal
  '#F48FB1', // rose
  '#FFCC80', // peach
  '#AED581', // lime
  '#90CAF9', // light blue
  '#FF8A65', // coral
] as const;

// Assign deterministically so cards don't shift color on re-renders
function getCardColor(symbolId: string): string {
  const hash = symbolId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CARD_COLORS[hash % CARD_COLORS.length];
}
```

**CSS for card:**
```css
.symbol-card {
  background: var(--bg-card);            /* #1B2845 */
  border-radius: var(--radius-xl);       /* 20px */
  border: 1px solid var(--border-card);  /* subtle */
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  aspect-ratio: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: transform var(--tap-duration) ease-out,
              filter var(--tap-duration) ease-out;
}

/* 3px colored top stripe — category identity */
.symbol-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--card-accent-color); /* set via inline style */
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

/* Category cards get a chevron indicator */
.symbol-card.is-category::after {
  content: '▶';
  position: absolute;
  bottom: 6px; right: 8px;
  font-size: 8px;
  color: var(--text-tertiary);
}

/* Press state — scale only, no translateY */
.symbol-card:active {
  transform: scale(0.93);
  filter: brightness(0.82);
}

.symbol-card__emoji {
  font-size: clamp(28px, 7vw, 44px);
  line-height: 1;
  /* Will be replaced by ARASAAC <img> when available */
}

.symbol-card__label {
  font-family: var(--font-body);
  font-size: clamp(9px, 2vw, 13px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-label);
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;
}
```

**Token appear animation:**
```css
@keyframes tokenPop {
  from { transform: scale(0.65); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
.speech-token-enter {
  animation: tokenPop var(--appear-duration) ease-out both;
}
```

---

### 2. Speech Bar

The persistent strip at the top. Should feel like a command bar, not an afterthought.

```css
.speech-bar {
  background: var(--bg-base);        /* deepest navy */
  border-bottom: 1px solid var(--border-subtle);
  padding: 10px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 72px;
  flex-shrink: 0;
}

.speech-output {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border-raised);
  border-radius: var(--radius-lg);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 52px;
  cursor: pointer;
}

.speech-output:empty::after {
  content: 'Tap symbols to speak…';
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
  font-weight: 700;
  color: var(--text-tertiary);
}

.speech-token {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Speech bar action buttons */
.speech-btn {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out, filter 100ms ease-out;
}

.speech-btn:active { transform: scale(0.92); filter: brightness(0.85); }
.speech-btn__icon  { font-size: 20px; line-height: 1; }

.btn-speak { background: var(--green); color: white; }
.btn-undo  { background: var(--amber-dark); color: white; }
.btn-clear { background: var(--rose); color: white; }

/* SPEAK button playing state */
.btn-speak.is-speaking {
  animation: speakPulse 1.2s ease-in-out infinite;
}

@keyframes speakPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--green-glow); }
  50%       { box-shadow: 0 0 0 10px transparent; }
}
```

---

### 3. Core Word Bar

```css
.core-word-bar {
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-subtle);
  padding: 7px 10px;
  display: flex;
  gap: 5px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.core-word-bar::-webkit-scrollbar { display: none; }

.core-word {
  border-radius: var(--radius-sm);
  padding: 5px 12px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out;
}
.core-word:active { transform: scale(0.91); }

/* Fitzgerald Key colors */
.cw-pronoun  { background: rgba(251,211,77,0.12); color: var(--gold);   border: 1px solid rgba(251,211,77,0.25); }
.cw-verb     { background: rgba(134,239,172,0.1);  color: var(--mint);   border: 1px solid rgba(134,239,172,0.2); }
.cw-social   { background: rgba(165,180,252,0.1);  color: var(--indigo); border: 1px solid rgba(165,180,252,0.2); }
.cw-noun     { background: rgba(253,186,116,0.1);  color: var(--orange-fitz); border: 1px solid rgba(253,186,116,0.2); }
```

---

### 4. QuickFires Rail

```css
.quickfires-rail {
  background: var(--bg-base);
  border-top: 1px solid var(--border-subtle);
  padding: 7px 10px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.quickfires-rail::-webkit-scrollbar { display: none; }

.quickfire-btn {
  background: var(--amber-glow);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-full);
  padding: 6px 16px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 800;
  color: var(--gold);
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease-out, background 100ms ease-out;
}
.quickfire-btn:active {
  transform: scale(0.94);
  background: rgba(245,158,11,0.25);
}
```

---

### 5. Tab Bar

```css
.tab-bar {
  background: var(--bg-base);
  border-top: 1px solid var(--border-subtle);
  padding: 6px 8px 8px;  /* extra bottom for home indicator */
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Add padding-bottom: env(safe-area-inset-bottom) for iPhone notch support */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .tab-bar {
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
  }
}

.tab-item {
  flex: 1;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 150ms ease-out;
}

.tab-item__icon { font-size: 22px; line-height: 1; }

/* Inactive */
.tab-item {
  background: transparent;
  color: var(--text-tertiary);
}
/* Active */
.tab-item.active {
  background: var(--amber-glow);
  color: var(--amber);
  border: 1px solid var(--border-accent);
}
.tab-item:not(.active):active {
  background: rgba(255,255,255,0.05);
}
```

---

### 6. Breadcrumb Navigation

```css
.breadcrumb-bar {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.breadcrumb-bar::-webkit-scrollbar { display: none; }

.breadcrumb-crumb {
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.breadcrumb-crumb { color: var(--text-tertiary); background: transparent; border: none; }
.breadcrumb-crumb.active { background: var(--amber-glow); color: var(--amber); border: 1px solid var(--border-accent); }

.breadcrumb-sep {
  color: var(--text-tertiary);
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
}
```

---

### 7. Symbol Grid

```css
.symbol-grid {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  background: var(--bg-surface);  /* #111827 — 1 level up from bg-app */
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;

  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* default portrait iPad */
  gap: 10px;
  align-content: start;
}

/* Landscape and larger screens */
@media (min-width: 600px) and (orientation: landscape) {
  .symbol-grid { grid-template-columns: repeat(5, 1fr); }
}
@media (min-width: 900px) {
  .symbol-grid { grid-template-columns: repeat(6, 1fr); }
}
```

---

### 8. Parent Mode / Edit State Indicator

```css
/* When in Parent Mode, the entire app gets an amber tinted top border */
.app-wrapper.edit-mode {
  border-top: 3px solid var(--amber);
}

/* Edit mode label badge */
.edit-mode-badge {
  position: fixed;
  top: 0; left: 50%;
  transform: translateX(-50%);
  background: var(--amber);
  color: #1C1400;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 3px 14px 3px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  z-index: 1000;
}
```

---

### 9. Modal / Sheet

```css
/* Bottom sheet for add/edit symbol, voice selector, settings */
.bottom-sheet-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  background: var(--bg-card);  /* #1B2845 */
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-top: 1px solid var(--border-raised);
  padding: 20px 20px 32px;
  width: 100%;
  max-height: 85dvh;
  overflow-y: auto;

  /* Animate up */
  animation: sheetUp 220ms ease-out both;
}
@keyframes sheetUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* Drag handle */
.sheet-handle {
  width: 40px; height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  margin: 0 auto 20px;
}

.sheet-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 20px;
}
```

---

### 10. Form Elements (in Parent Mode)

```css
.form-label {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 6px;
  display: block;
}

.form-input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-raised);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-family: var(--font-body);
  font-size: 16px;  /* 16px prevents iOS zoom on focus */
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
  -webkit-appearance: none;
}
.form-input:focus {
  border-color: var(--amber);
  box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
}

.btn-primary {
  background: var(--amber);
  color: #1C1400;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 900;
  padding: 14px 28px;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
}
.btn-primary:active { filter: brightness(0.88); transform: scale(0.98); }

.btn-secondary {
  background: var(--bg-surface);
  border: 1px solid var(--border-raised);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 800;
  padding: 13px 28px;
  border-radius: var(--radius-full);
  cursor: pointer;
  width: 100%;
}
```

---

## Layout Architecture

The app is a flex column that fills the full viewport height. No scrolling at the page level — only the grid scrolls internally.

```tsx
// App.tsx layout structure
<div className="app-wrapper" style={{
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',          // dvh not vh — respects iOS keyboard
  background: 'var(--bg-app)',
  overflow: 'hidden',
}}>
  <SpeechBar />              {/* fixed height ~72px */}
  <CoreWordBar />            {/* fixed height ~44px */}
  <BreadcrumbNav />          {/* fixed height ~40px */}
  <SymbolGrid />             {/* flex: 1, scrolls internally */}
  <QuickFiresRail />         {/* fixed height ~44px */}
  <TabBar />                 {/* fixed height ~64px + safe area */}
</div>
```

---

## Typography Rules

**Fonts to load (in index.html `<head>`):**
```html
<link
  href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;700;800;900&display=swap"
  rel="stylesheet"
>
```

**Font usage rules — follow these exactly:**
- `Baloo 2 800` — App title ("FreeVoice") and modal headers only
- `Nunito 900` — Symbol card labels, tab labels, button text, breadcrumbs, all caps UI text
- `Nunito 800` — Section labels, eyebrows, badge text
- `Nunito 700` — Speech tokens, body text, descriptions
- `Nunito 400` — Long-form text (rare in an AAC app)
- **Never use Arial, Roboto, Inter, or system-ui** as the primary font

---

## Global Resets (add to index.css)

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

html, body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;  /* prevent pull-to-refresh */
  background: #0C1428;
}

/* Prevent iOS text size adjustment on rotation */
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* Prevent double-tap zoom — critical for AAC */
* {
  touch-action: manipulation;
}

/* Only symbol grid scrolls */
.symbol-grid {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

---

## ARASAAC Symbol Images

When an ARASAAC image is available, replace the emoji with:

```tsx
<img
  src={`https://static.arasaac.org/pictograms/${id}/${id}_500.png`}
  alt={label}
  width={48}
  height={48}
  loading="lazy"
  decoding="async"
  style={{
    objectFit: 'contain',
    borderRadius: '4px',
    // Apply skin tone via URL param, not CSS:
    // ?skin=1 (white) through ?skin=5 (hispanic)
  }}
  onError={(e) => {
    // Fallback: hide img, show emoji
    e.currentTarget.style.display = 'none';
    e.currentTarget.nextSibling.style.display = 'block';
  }}
/>
<span style={{ display: 'none' }}>{emoji}</span>
```

On the dark background, ARASAAC images with white backgrounds create jarring white squares. Fix this with CSS:

```css
.symbol-card img {
  /* Remove white background from ARASAAC PNGs */
  mix-blend-mode: multiply;
  /* OR for dark theme: */
  filter: invert(1) hue-rotate(180deg);
  /* TEST BOTH — multiply works on light cards, invert on dark */
}
```

**Actually the cleanest solution:** Use ARASAAC's built-in dark-bg option. Some pictograms have this. For those that don't, render on a small white rounded-rect inset within the dark card — like a "symbol window":

```css
.symbol-image-container {
  width: 52px;
  height: 52px;
  background: rgba(255,255,255,0.92);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}
```

This looks intentional and polished — the white inset becomes part of the design.

---

## What TD Snap Gets Right (and We Should Match)

After reviewing their UI:

1. **Consistent grid density** — every card the same size, no orphaned single cards
2. **Clear visual hierarchy** — speech bar > core words > grid > tabs, never ambiguous what level you're on
3. **Label always visible** — even on tiny cards the text is readable
4. **Breadcrumb as real navigation** — not just decorative
5. **Pressed state is immediate** — zero delay, the feedback is tactile

## What TD Snap Gets Wrong (and We Do Better)

1. **Their dark mode is actually ugly** — muddy grays with no real system. Ours is a proper navy palette.
2. **Their toolbar is cramped** — 5 functions in a tiny strip. We give SPEAK/UNDO/CLEAR proper button real estate.
3. **Their cards are flat and boring** — same gray for everything. Our accent-stripe system gives category identity without chaos.
4. **No design personality** — it looks like enterprise software. FreeVoice has warmth.

---

## Testing the UI

After implementing the design system, test these specifically:

- [ ] Cards feel premium on a real iPad — not pixelated, not too small
- [ ] Speech bar SPEAK button glow animation plays while audio is playing
- [ ] Token pop-in animation feels snappy, not sluggish
- [ ] CLEAR button requires 500ms hold — doesn't fire on accidental tap
- [ ] Core word bar scrolls smoothly horizontally on small screens
- [ ] QuickFires rail scrolls smoothly horizontally
- [ ] Tab bar active state is immediately obvious
- [ ] Breadcrumb active crumb stands out clearly
- [ ] No white flash on page load (body background is set before React hydrates)
- [ ] Emoji renders at correct size on both iOS and Android
- [ ] ARASAAC images don't create jarring white boxes on dark cards
- [ ] Modal sheet animates up smoothly with no jank
- [ ] Form inputs don't trigger iOS zoom (font-size must be ≥ 16px)
- [ ] Pull-to-refresh is disabled (overscroll-behavior: none)
- [ ] App feels full-bleed in standalone/PWA mode (no browser chrome)

---

*FreeVoice AAC · Design System v1.0 · Shellcraft Labs LLC*

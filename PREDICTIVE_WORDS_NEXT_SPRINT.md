# Predictive Word Bar — Next Sprint (Future Enhancements)

## Shipped (current state)
The Core Words bar is predictive: it shows next-word suggestions based on the
**last word** in the sentence, like a phone keyboard. Static, instant, on-device
(no network / no AI).

- Data: `src/data/wordPredictions.ts` (`NEXT_WORD_PREDICTIONS`, `getPredictions`)
- Wiring: `src/components/CoreWordsBar/CoreWordsBar.tsx`
- Works for both tapped suggestions and typed words committed via the TYPE field.

The items below are explicitly **out of scope for that sprint** and planned for
a future one.

---

## Guiding principles (do not break these)
- **Zero latency.** AAC users need instant predictions — keep it a synchronous
  in-memory lookup. No network calls, no LLM/model inference on the hot path.
- **Privacy-first.** Anything learned about a user stays **on device** (IndexedDB),
  never sent anywhere — consistent with the app's "zero data collection" promise.
- **Graceful fallback.** Every enhancement must degrade to the current single-word
  map if its data is missing.

---

## 1. Two-word (bigram) context
**What:** Predict from the last *two* words, not just one
(e.g. "I want" → food/water/to-go; "go to" → school/home/bathroom).

**Why:** Sharply better suggestions for the most common sentence frames.

**Approach:**
- Add an optional bigram map keyed by `"word1 word2"`; fall back to the single-word
  map, then to `DEFAULT_PREDICTIONS`.
- `getPredictions(lastWord, prevWord?)` — try bigram key first, then unigram.
- Source bigrams from common AAC sentence frames; keep the table small/curated.

**Effort:** M · **Risk:** Low (purely additive, same lookup model).

---

## 2. Personalized / adaptive predictions
**What:** Learn which words *this* user picks after each word and reorder their
suggestions toward the front over time.

**Why:** Real communication speed comes from each user's own high-frequency
patterns, which differ per person.

**Approach:**
- Track per-(prevWord → chosenWord) counts in **IndexedDB** (Dexie), on-device only.
- At render time, merge learned frequencies with the static map (learned picks
  float up; static map fills the rest).
- Cap table size; add a "reset learned words" control in Settings; gate behind a
  toggle so it's optional.

**Effort:** M–L · **Risk:** Medium — privacy + storage hygiene must be careful;
keep it strictly local and resettable.

---

## 3. Multilingual prediction maps
**What:** Separate prediction maps per supported language (the app already has 10).

**Why:** Predictions are English-only today; non-English users get the default
fallback, losing the feature's value.

**Approach:**
- `wordPredictions.<lang>.ts` (or a map keyed by language), selected from the
  current i18n language.
- Start with the highest-usage languages; fall back to English/DEFAULT if a
  language map is absent.
- Mind RTL (Arabic) and CJK rendering in the bar.

**Effort:** L (mostly content/translation) · **Risk:** Low (code), High (content volume).

---

## 4. Symbols/emoji on predicted chips (optional polish)
**What:** Predicted chips are currently word-only (like phone predictive text).
Optionally show a small symbol/emoji per word.

**Why:** Emerging/pre-literate AAC users rely on symbols, not just text.

**Approach:**
- Map common prediction words to an emoji/symbol (reuse existing symbol data where
  the word matches a board item).
- Make it a Settings toggle (text-only vs symbol+text) — some users prefer the
  cleaner text-only strip.

**Effort:** S–M · **Risk:** Low.

---

## Suggested order
**1 (bigrams)** → **4 (symbols toggle)** → **2 (personalization)** → **3 (multilingual)**.
Bigrams give the biggest speed win for the least risk; multilingual is the largest
effort and is mostly content.

---

*FreeVoice AAC · Shellcraft Labs LLC · Faster sentences mean more communication.*

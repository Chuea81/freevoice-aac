/**
 * ARASAAC background fetcher — DISABLED.
 *
 * Emoji are the primary symbol system. ARASAAC keyword search produced
 * inconsistent, low-quality results that looked terrible next to emoji.
 *
 * The only ARASAAC symbols used are the 8 hardcoded IDs in arasaacIds.ts
 * for genuinely ambiguous words (nails, bath, brush teeth, etc.).
 * Those are resolved directly by SymbolCard via getArasaacImageUrl().
 *
 * This hook is kept as a no-op so imports don't break.
 */
export function useArasaac() {
  // Intentionally empty — emoji are better than ARASAAC keyword search
}

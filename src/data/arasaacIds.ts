/**
 * Static label → ARASAAC pictogram ID lookup.
 * SymbolCard checks this FIRST before any DB lookup.
 *
 * EMOTIONS are intentionally NOT listed here — ARASAAC has no
 * consistent emotion art style (mixed artists over 15 years).
 * Emotions use emoji fallback instead, which are consistent,
 * colorful, and recognizable on every device.
 *
 * Verified at: https://static.arasaac.org/pictograms/{id}/{id}_500.png
 */
export const ARASAAC_IDS: Record<string, number> = {
  // ── Ambiguous words only (correct meanings) ──
  'NAILS': 2783,           // fingernails (anatomy, not hardware)
  'BATH': 2272,            // bathtub
  'WASH HANDS': 8975,      // handwashing
  'WASH FACE': 8975,       // handwashing
  'BRUSH TEETH': 2694,     // toothbrush
  'HAIR': 2695,            // hairbrush
  'NUTS': 2674,            // peanuts (food, not hardware)
  'RULER': 2815,           // measuring ruler (not king)
};

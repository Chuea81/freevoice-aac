/**
 * Static label → ARASAAC pictogram ID lookup.
 * Bypasses Dexie entirely — cannot fail due to migration or seeding issues.
 * SymbolCard checks this FIRST before any DB lookup.
 *
 * Keys are UPPERCASE labels. Values are verified ARASAAC pictogram IDs
 * that return COLOR images at:
 *   https://static.arasaac.org/pictograms/{id}/{id}_500.png
 */
export const ARASAAC_IDS: Record<string, number> = {
  // ── Emotions ──
  'HAPPY': 35533,
  'SAD': 35545,
  'ANGRY': 35539,
  'SCARED': 35535,
  'TIRED': 35537,
  'SICK': 3308,
  'BORED': 35531,
  'LOVE': 6898,
  'FRUSTRATED': 35539,
  'GOOD': 13630,
  'WORRIED': 36341,
  'EXCITED': 39090,
  'NERVOUS': 38929,
  'CALM': 31310,
  'CONFUSED': 35541,
  'SURPRISED': 35529,
  'PROUD': 31408,
  'LONELY': 7253,
  'EMBARRASSED': 11953,
  'HURT FEELINGS': 2367,
  'SHY': 37767,
  'SILLY': 15483,
  'GRATEFUL': 37233,
  'DISAPPOINTED': 11959,

  // ── Ambiguous words ──
  'NAILS': 2783,
  'BATH': 2272,
  'WASH HANDS': 8975,
  'WASH FACE': 8975,
  'BRUSH TEETH': 2694,
  'HAIR': 2695,
  'NUTS': 2674,
  'RULER': 2815,
};

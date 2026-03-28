/**
 * Static label → ARASAAC pictogram ID lookup.
 * SymbolCard checks this FIRST before any DB lookup.
 *
 * ID = 0 means "use emoji fallback, skip all ARASAAC lookups."
 * This is used for emotions where ARASAAC has no consistent art style.
 *
 * Verified at: https://static.arasaac.org/pictograms/{id}/{id}_500.png
 */
export const ARASAAC_IDS: Record<string, number> = {
  // ── Emotions: use emoji (ID=0 = skip ARASAAC) ──
  'HAPPY': 0,
  'SAD': 0,
  'ANGRY': 0,
  'SCARED': 0,
  'TIRED': 0,
  'SICK': 0,
  'BORED': 0,
  'LOVE': 0,
  'FRUSTRATED': 0,
  'GOOD': 0,
  'WORRIED': 0,
  'EXCITED': 0,
  'NERVOUS': 0,
  'CALM': 0,
  'CONFUSED': 0,
  'SURPRISED': 0,
  'PROUD': 0,
  'LONELY': 0,
  'EMBARRASSED': 0,
  'HURT FEELINGS': 0,
  'SHY': 0,
  'SILLY': 0,
  'GRATEFUL': 0,
  'DISAPPOINTED': 0,

  // ── Ambiguous words (correct ARASAAC pictograms) ──
  'NAILS': 2783,
  'BATH': 2272,
  'WASH HANDS': 8975,
  'WASH FACE': 8975,
  'BRUSH TEETH': 2694,
  'HAIR': 2695,
  'NUTS': 2674,
  'RULER': 2815,
};

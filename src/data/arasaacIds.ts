/**
 * Static label → ARASAAC pictogram ID lookup.
 * These are the COLOR versions — yellow hair, skin-toned faces, colored clothing.
 * NOT the 35xxx "schematic" B&W line-art versions.
 *
 * SymbolCard checks this FIRST before any DB lookup.
 * Verified at: https://static.arasaac.org/pictograms/{id}/{id}_500.png
 */
export const ARASAAC_IDS: Record<string, number> = {
  // ── Emotions (color pictograms) ──
  'HAPPY': 10192,          // girl face, yellow hair, smiling
  'SAD': 11959,            // girl face, yellow hair, frowning
  'ANGRY': 21820,          // person orange shirt, arms crossed, angry
  'SCARED': 11951,         // girl face, yellow hair, scared
  'TIRED': 2314,           // face closed eyes, skin-toned
  'SICK': 3308,            // person in bed, thermometer, green blanket
  'BORED': 8513,           // face yawning, hand over mouth
  'LOVE': 11536,           // two faces kissing, red hearts
  'FRUSTRATED': 26985,     // person orange shirt, hand on face, !?
  'GOOD': 31849,           // boy face, brown hair, smiling
  'WORRIED': 28713,        // yellow hair, red shirt, hand on forehead, !?
  'EXCITED': 9907,         // person orange shirt, arms up waving
  'NERVOUS': 11312,        // brown hair, orange shirt, biting nails
  'CALM': 31310,           // closed eyes, flat mouth (best available)
  'CONFUSED': 2352,        // face with question mark
  'SURPRISED': 2574,       // face raised eyebrows, open mouth
  'PROUD': 31408,          // pointing at self with rays (best available)
  'LONELY': 7253,          // colored person separated from gray group
  'EMBARRASSED': 11953,    // girl face, yellow hair, pink blush
  'HURT FEELINGS': 3239,   // face crying, blue tears
  'SHY': 37767,            // girl face, yellow hair, pink blush
  'SILLY': 8593,           // person orange shirt, laughing
  'GRATEFUL': 8128,        // boy brown hair, red shirt, hand on heart
  'DISAPPOINTED': 31939,   // boy face, brown hair, frowning

  // ── Ambiguous words (correct meanings) ──
  'NAILS': 2783,           // fingernails (anatomy)
  'BATH': 2272,            // bathtub
  'WASH HANDS': 8975,      // handwashing
  'WASH FACE': 8975,       // handwashing
  'BRUSH TEETH': 2694,     // toothbrush
  'HAIR': 2695,            // hairbrush
  'NUTS': 2674,            // peanuts (food)
  'RULER': 2815,           // measuring ruler
};

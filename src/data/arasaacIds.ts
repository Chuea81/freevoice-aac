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

  // ── Drinks: use custom icons (ID=-1 = custom image path) ──
  'WATER': -1,
  'MILK': -1,
  'JUICE': -1,
  'ORANGE JUICE': -1,
  'TEA': -1,
  'SODA': -1,
  'CHOCOLATE MILK': -1,
  'SMOOTHIE': -1,
  'LEMONADE': -1,
  'COCONUT WATER': -1,
};

/**
 * Custom symbol image paths — for symbols with custom art (not ARASAAC).
 * ID = -1 in ARASAAC_IDS means "look up in CUSTOM_SYMBOL_IMAGES instead."
 */
const BASE = import.meta.env.BASE_URL || '/';

function customPath(category: string, filename: string): string {
  return `${BASE}symbols/${category}/${filename}.png`;
}

export const CUSTOM_SYMBOL_IMAGES: Record<string, string> = {
  'WATER': customPath('drinks', 'water'),
  'MILK': customPath('drinks', 'milk'),
  'JUICE': customPath('drinks', 'juice'),
  'ORANGE JUICE': customPath('drinks', 'orange_juice'),
  'TEA': customPath('drinks', 'tea'),
  'SODA': customPath('drinks', 'soda'),
  'CHOCOLATE MILK': customPath('drinks', 'chocolate_milk'),
  'SMOOTHIE': customPath('drinks', 'smoothie'),
  'LEMONADE': customPath('drinks', 'lemonade'),
  'COCONUT WATER': customPath('drinks', 'coconut_water'),
};

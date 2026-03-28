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
  'WATER': -1, 'MILK': -1, 'JUICE': -1, 'ORANGE JUICE': -1, 'TEA': -1,
  'SODA': -1, 'CHOCOLATE MILK': -1, 'SMOOTHIE': -1, 'LEMONADE': -1, 'COCONUT WATER': -1,
  'ICED COFFEE': -1, 'MILKSHAKE': -1, 'BOBA TEA': -1, 'HOT COFFEE': -1, 'HOT CHOCOLATE': -1,
  'MILK COFFEE': -1, 'KOMBUCHA': -1, 'ENERGY DRINK': -1, 'CRANBERRY JUICE': -1,
  'APPLE JUICE': -1, 'FRAPPUCCINO': -1, 'SPARKLING WATER': -1, 'ROOT BEER': -1,
  'ICED TEA': -1, 'HOT CIDER': -1, 'MANGO LASSI': -1, 'AGUA FRESCA': -1, 'SPORTS DRINK': -1,
  'GRAPE JUICE': -1, 'PINEAPPLE JUICE': -1, 'PEACH JUICE': -1, 'FRUIT PUNCH': -1,
  'TOMATO JUICE': -1, 'VEGETABLE JUICE': -1, 'MILK CARTON': -1, 'WATER BOTTLE': -1,
  'HELP': -1,
  'WAIT': -1,
  'FEELINGS': -1,
  'PLAY': -1,
  'SOCIAL': -1,
  'BODY': -1,
  'SCHOOL': -1,
  'BEDTIME': -1,
  'ANIMALS': -1,
  'PLACES': -1,
  'CLOTHING': -1,
  'YES': -1,
  'NO': -1,
  'PLEASE': -1,
  'THANK YOU': -1,
  'HURTS': -1,
  'STOP': -1,
  'MORE': -1,
  'HI': -1,
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
  // Row 1
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
  // Row 2
  'ICED COFFEE': customPath('drinks', 'iced_coffee'),
  'MILKSHAKE': customPath('drinks', 'milkshake'),
  'BOBA TEA': customPath('drinks', 'boba_tea'),
  'HOT COFFEE': customPath('drinks', 'hot_coffee'),
  'HOT CHOCOLATE': customPath('drinks', 'hot_chocolate'),
  'MILK COFFEE': customPath('drinks', 'milk_coffee'),
  'KOMBUCHA': customPath('drinks', 'kombucha'),
  'ENERGY DRINK': customPath('drinks', 'energy_drink'),
  'CRANBERRY JUICE': customPath('drinks', 'cranberry_juice'),
  // Row 3
  'APPLE JUICE': customPath('drinks', 'apple_juice'),
  'FRAPPUCCINO': customPath('drinks', 'frappuccino'),
  'SPARKLING WATER': customPath('drinks', 'sparkling_water'),
  'ROOT BEER': customPath('drinks', 'root_beer'),
  'ICED TEA': customPath('drinks', 'iced_tea'),
  'HOT CIDER': customPath('drinks', 'hot_cider'),
  'MANGO LASSI': customPath('drinks', 'mango_lassi'),
  'AGUA FRESCA': customPath('drinks', 'agua_fresca'),
  'SPORTS DRINK': customPath('drinks', 'sports_drink'),
  // Row 4
  'GRAPE JUICE': customPath('drinks', 'grape_juice'),
  'PINEAPPLE JUICE': customPath('drinks', 'pineapple_juice'),
  'PEACH JUICE': customPath('drinks', 'peach_juice'),
  'FRUIT PUNCH': customPath('drinks', 'fruit_punch'),
  'TOMATO JUICE': customPath('drinks', 'tomato_juice'),
  'VEGETABLE JUICE': customPath('drinks', 'vegetable_juice'),
  'MILK CARTON': customPath('drinks', 'milk_carton'),
  'WATER BOTTLE': customPath('drinks', 'water_bottle'),
  'HELP': customPath('custom', 'help'),
  'WAIT': customPath('custom', 'wait'),
  'FEELINGS': customPath('custom', 'feelings'),
  'PLAY': customPath('custom', 'play'),
  'SOCIAL': customPath('custom', 'social'),
  'BODY': customPath('custom', 'body'),
  'SCHOOL': customPath('custom', 'school'),
  'BEDTIME': customPath('custom', 'bedtime'),
  'ANIMALS': customPath('custom', 'animals'),
  'PLACES': customPath('custom', 'places'),
  'CLOTHING': customPath('custom', 'clothing'),
  'YES': customPath('custom', 'yes'),
  'NO': customPath('custom', 'no'),
  'PLEASE': customPath('custom', 'please'),
  'THANK YOU': customPath('custom', 'thank_you'),
  'HURTS': customPath('custom', 'hurts'),
  'STOP': customPath('custom', 'stop'),
  'MORE': customPath('custom', 'more'),
  'HI': customPath('custom', 'hi'),
};
/**
 * Static label → ARASAAC pictogram ID lookup.
 * SymbolCard checks this FIRST before any DB lookup.
 *
 * ID = 0 means "use emoji fallback, skip all ARASAAC lookups."
 * Emotions use character system or emoji — never ARASAAC.
 * Everything else uses emoji from defaultBoards.ts.
 */
export const ARASAAC_IDS: Record<string, number> = {
  // ── Emotions: use character system or emoji (ID=0) ──
  'HAPPY': 0, 'SAD': 0, 'ANGRY': 0, 'SCARED': 0, 'TIRED': 0,
  'SICK': 0, 'BORED': 0, 'LOVE': 0, 'FRUSTRATED': 0, 'GOOD': 0,
  'WORRIED': 0, 'EXCITED': 0, 'NERVOUS': 0, 'CALM': 0, 'CONFUSED': 0,
  'SURPRISED': 0, 'PROUD': 0, 'LONELY': 0, 'EMBARRASSED': 0,
  'HURT FEELINGS': 0, 'SHY': 0, 'SILLY': 0, 'GRATEFUL': 0, 'DISAPPOINTED': 0,

  // ── ALL common symbols: force emoji, skip ARASAAC search ──
  // Without this, useArasaac.ts does keyword searches and finds
  // random inconsistent ARASAAC pictograms that look terrible.
  // Emoji are better for everything except truly ambiguous words.
  'FOOD': 0, 'DRINKS': 0, 'MEALS': 0, 'SNACKS': 0, 'FRUITS': 0,
  'VEGETABLES': 0, 'DESSERTS': 0, 'PLAY': 0, 'SOCIAL': 0, 'BODY': 0,
  'SCHOOL': 0, 'BEDTIME': 0, 'ANIMALS': 0, 'PLACES': 0, 'CLOTHING': 0,
  'YES': 0, 'NO': 0, 'PLEASE': 0, 'THANK YOU': 0, 'HURTS': 0,
  'HELP': 0, 'STOP': 0, 'MORE': 0, 'HI': 0, 'WAIT': 0, 'HELLO': 0,
  'GOODBYE': 0, 'HUG': 0, 'FRIEND': 0, 'MOM': 0, 'DAD': 0,
  'APPLE': 0, 'BANANA': 0, 'SANDWICH': 0, 'PIZZA': 0, 'CHICKEN': 0,
  'CARROTS': 0, 'CHEESE': 0, 'MILK': 0, 'COOKIE': 0, 'STRAWBERRY': 0,
  'BREAD': 0, 'EGG': 0, 'CAKE': 0, 'WATER': 0, 'JUICE': 0, 'SODA': 0,
  'CHOCOLATE MILK': 0, 'LEMONADE': 0, 'SMOOTHIE': 0, 'HOT CHOCOLATE': 0,
  'MILKSHAKE': 0, 'FRUIT PUNCH': 0, 'ICED TEA': 0, 'ORANGE JUICE': 0,
  'APPLE JUICE': 0, 'GRAPE JUICE': 0, 'CEREAL': 0, 'PANCAKES': 0,
  'PASTA': 0, 'SOUP': 0, 'TACO': 0, 'BURGER': 0, 'SALAD': 0,
  'POPCORN': 0, 'ICE CREAM': 0, 'DONUT': 0, 'CHOCOLATE': 0,
  'DOG': 0, 'CAT': 0, 'FISH': 0, 'BIRD': 0, 'BUNNY': 0, 'HORSE': 0,
  'LION': 0, 'ELEPHANT': 0, 'BEAR': 0, 'MONKEY': 0, 'BUTTERFLY': 0,
  'SOCCER': 0, 'BASKETBALL': 0, 'SWIMMING': 0, 'RUNNING': 0, 'DANCE': 0,
  'BOOK': 0, 'MUSIC': 0, 'DRAW': 0, 'TV': 0, 'MOVIE': 0,
  'DOCTOR': 0, 'TEACHER': 0, 'BATHROOM': 0, 'SLEEP': 0, 'HOME': 0,
  'OUTSIDE': 0, 'PARK': 0, 'STORE': 0, 'HOSPITAL': 0,

  // ── Ambiguous words only (correct ARASAAC pictograms) ──
  'NAILS': 2783,
  'BATH': 2272,
  'WASH HANDS': 8975,
  'WASH FACE': 8975,
  'BRUSH TEETH': 2694,
  'HAIR': 2695,
  'NUTS': 2674,
  'RULER': 2815,
};

// No custom symbol images — everything uses emoji from defaultBoards.ts
export const CUSTOM_SYMBOL_IMAGES: Record<string, string> = {};

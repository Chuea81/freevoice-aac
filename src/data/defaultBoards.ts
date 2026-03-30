import type { Board, Symbol } from '../db';

// ── Card color rotation palette (copied from prototype COLORS array) ──

const COLORS = [
  '#FF8A65', // coral
  '#64B5F6', // blue
  '#81C784', // green
  '#FFD54F', // yellow
  '#CE93D8', // lavender
  '#80CBC4', // teal
  '#F48FB1', // rose
  '#FFCC80', // orange
  '#AED581', // lime
  '#90CAF9', // light blue
];

export function cardColor(index: number): string {
  return COLORS[index % COLORS.length];
}

// ── Board definition types ──

interface BoardDef {
  id: string;
  name: string;
  emoji: string;
  parentId: string | null;
  items: ItemDef[];
}

interface ItemDef {
  emoji: string;
  label: string;
  phrase?: string;
  category?: string; // links to another board id
  wordType?: string; // noun, verb, adjective, pronoun, social, descriptor, preposition
  arasaacId?: number; // hardcoded ARASAAC pictogram ID — skips keyword search
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEFAULT BOARD DATA
//
//  Sources:
//  - freevoice-aac.html prototype (11 original categories, 160+ symbols)
//  - TDSnap analysis: QuickFires, Core Words, Repairs categories
//  - Expanded subcategories: Animals, Places, People, Colors & Shapes,
//    Weather, Toys, Clothing, Numbers, Pronouns, Questions, Time Words,
//    Verbs, Descriptors, Breakfast, Dinner, Fruits, Vegetables, Desserts,
//    Outdoor, Indoor, Sports, Music, Travel, Community, Family,
//    Hygiene, Medical, Feelings Intense
//  - Target: 500+ symbols for real-world daily use
// ─────────────────────────────────────────────────────────────────────────────

const BOARD_DEFS: BoardDef[] = [
  // ═══ HOME (root board — copied from prototype) ═══
  {
    id: 'home', name: 'Home', emoji: '🏠', parentId: null,
    items: [
      { emoji: '🍎', label: 'Food', category: 'food' },
      { emoji: '😊', label: 'Feelings', category: 'feelings' },
      { emoji: '⚽', label: 'Play', category: 'activities' },
      { emoji: '💬', label: 'Social', category: 'social' },
      { emoji: '🛁', label: 'Body', category: 'body' },
      { emoji: '🏫', label: 'School', category: 'school' },
      { emoji: '🌙', label: 'Bedtime', category: 'bedtime' },
      { emoji: '🐾', label: 'Animals', category: 'animals' },
      { emoji: '🌍', label: 'Places', category: 'places' },
      { emoji: '👕', label: 'Clothing', category: 'clothing' },
      { emoji: '📋', label: 'Routines', category: 'routines' },
      { emoji: '🚗', label: 'Transportation', category: 'transportation' },
      { emoji: '📱', label: 'Technology', category: 'technology' },
      { emoji: '🌿', label: 'Nature', category: 'nature' },
      { emoji: '✅', label: 'Yes', phrase: 'Yes', wordType: 'social' },
      { emoji: '❌', label: 'No', phrase: 'No', wordType: 'social' },
      { emoji: '🤲', label: 'Please', phrase: 'Please', wordType: 'social' },
      { emoji: '💛', label: 'Thank You', phrase: 'Thank you', wordType: 'social' },
      { emoji: '💔', label: 'Hurts', phrase: 'That hurts', wordType: 'descriptor' },
      { emoji: '🆘', label: 'Help', phrase: 'I need help', wordType: 'social' },
      { emoji: '🚫', label: 'Stop', phrase: 'Stop', wordType: 'social' },
      { emoji: '➕', label: 'More', phrase: 'More please', wordType: 'social' },
      { emoji: '🤚', label: 'Hi', phrase: 'Hi!', wordType: 'social' },
      { emoji: '✋', label: 'Wait', phrase: 'Wait', wordType: 'social' },
    ],
  },

  // ═══ QUICKFIRES (TDSnap analysis — persistent quick phrases) ═══
  {
    id: 'quickfires', name: 'Fast Phrases', emoji: '⚡', parentId: null,
    items: [
      { emoji: '🆘', label: 'Help', phrase: 'I need help', wordType: 'social' },
      { emoji: '✋', label: 'Wait', phrase: 'Wait', wordType: 'social' },
      { emoji: '👀', label: 'Look', phrase: 'Look at me', wordType: 'social' },
      { emoji: '✅', label: 'Done', phrase: "I'm done", wordType: 'social' },
      { emoji: '➕', label: 'More', phrase: 'More please', wordType: 'social' },
      { emoji: '🚫', label: 'Stop', phrase: 'Stop', wordType: 'social' },
      { emoji: '⏸️', label: 'Break', phrase: 'I need a break', wordType: 'social' },
      { emoji: '🤲', label: 'Please', phrase: 'Please', wordType: 'social' },
      { emoji: '💛', label: 'Thank You', phrase: 'Thank you', wordType: 'social' },
      { emoji: '💔', label: 'Hurts', phrase: 'That hurts', wordType: 'social' },
      { emoji: '🚻', label: 'Bathroom', phrase: 'I need the bathroom', wordType: 'noun' },
      { emoji: '🤗', label: 'Hug', phrase: 'I want a hug', wordType: 'social' },
    ],
  },

  // ═══ CORE WORDS (TDSnap analysis — ~50 highest-frequency words) ═══
  {
    id: 'corewords', name: 'Core Words', emoji: '💎', parentId: null,
    items: [
      // Pronouns
      { emoji: '👆', label: 'I', phrase: 'I', wordType: 'pronoun' },
      { emoji: '👉', label: 'You', phrase: 'You', wordType: 'pronoun' },
      { emoji: '♂️', label: 'He', phrase: 'He', wordType: 'pronoun' },
      { emoji: '♀️', label: 'She', phrase: 'She', wordType: 'pronoun' },
      { emoji: '👨‍👩‍👧', label: 'We', phrase: 'We', wordType: 'pronoun' },
      { emoji: '👥', label: 'They', phrase: 'They', wordType: 'pronoun' },
      { emoji: '👆', label: 'My', phrase: 'My', wordType: 'pronoun' },
      { emoji: '👉', label: 'That', phrase: 'That', wordType: 'pronoun' },
      { emoji: '👇', label: 'This', phrase: 'This', wordType: 'pronoun' },
      { emoji: '📍', label: 'It', phrase: 'It', wordType: 'pronoun' },
      // Core verbs
      { emoji: '🙋', label: 'Want', phrase: 'Want', wordType: 'verb' },
      { emoji: '🚶', label: 'Go', phrase: 'Go', wordType: 'verb' },
      { emoji: '🤲', label: 'Get', phrase: 'Get', wordType: 'verb' },
      { emoji: '🤲', label: 'Make', phrase: 'Make', wordType: 'verb' },
      { emoji: '⬇️', label: 'Put', phrase: 'Put', wordType: 'verb' },
      { emoji: '👁️', label: 'See', phrase: 'See', wordType: 'verb' },
      { emoji: '❤️', label: 'Like', phrase: 'Like', wordType: 'verb' },
      { emoji: '🍽️', label: 'Eat', phrase: 'Eat', wordType: 'verb' },
      { emoji: '🥤', label: 'Drink', phrase: 'Drink', wordType: 'verb' },
      { emoji: '🎲', label: 'Play', phrase: 'Play', wordType: 'verb' },
      { emoji: '📖', label: 'Read', phrase: 'Read', wordType: 'verb' },
      { emoji: '💬', label: 'Say', phrase: 'Say', wordType: 'verb' },
      { emoji: '👂', label: 'Listen', phrase: 'Listen', wordType: 'verb' },
      { emoji: '🏃', label: 'Run', phrase: 'Run', wordType: 'verb' },
      { emoji: '↔️', label: 'Share', phrase: 'Share', wordType: 'verb' },
      { emoji: '✅', label: 'Can', phrase: 'Can', wordType: 'verb' },
      { emoji: '💭', label: 'Think', phrase: 'Think', wordType: 'verb' },
      { emoji: '💡', label: 'Know', phrase: 'Know', wordType: 'verb' },
      { emoji: '🤚', label: 'Need', phrase: 'Need', wordType: 'verb' },
      { emoji: '😊', label: 'Feel', phrase: 'Feel', wordType: 'verb' },
      { emoji: '🔃', label: 'Turn', phrase: 'Turn', wordType: 'verb' },
      { emoji: '🔓', label: 'Open', phrase: 'Open', wordType: 'verb' },
      { emoji: '🔒', label: 'Close', phrase: 'Close', wordType: 'verb' },
      { emoji: '📥', label: 'Give', phrase: 'Give', wordType: 'verb' },
      { emoji: '📤', label: 'Take', phrase: 'Take', wordType: 'verb' },
      // Core descriptors / modifiers
      { emoji: '👍', label: 'Good', phrase: 'Good', wordType: 'descriptor' },
      { emoji: '👎', label: 'Bad', phrase: 'Bad', wordType: 'descriptor' },
      { emoji: '🐘', label: 'Big', phrase: 'Big', wordType: 'descriptor' },
      { emoji: '🐭', label: 'Little', phrase: 'Little', wordType: 'descriptor' },
      { emoji: '➕', label: 'More', phrase: 'More', wordType: 'descriptor' },
      { emoji: '✋', label: 'Done', phrase: 'Done', wordType: 'descriptor' },
      { emoji: '🚫', label: 'Not', phrase: 'Not', wordType: 'descriptor' },
      { emoji: '⬆️', label: 'Up', phrase: 'Up', wordType: 'preposition' },
      { emoji: '⬇️', label: 'Down', phrase: 'Down', wordType: 'preposition' },
      { emoji: '➡️', label: 'In', phrase: 'In', wordType: 'preposition' },
      { emoji: '⬅️', label: 'Out', phrase: 'Out', wordType: 'preposition' },
      { emoji: '✅', label: 'On', phrase: 'On', wordType: 'preposition' },
      { emoji: '⭕', label: 'Off', phrase: 'Off', wordType: 'preposition' },
      { emoji: '🔁', label: 'Again', phrase: 'Again', wordType: 'descriptor' },
      { emoji: '📍', label: 'Here', phrase: 'Here', wordType: 'descriptor' },
      { emoji: '📍', label: 'There', phrase: 'There', wordType: 'descriptor' },
    ],
  },

  // ═══ REPAIRS (TDSnap analysis — communication breakdown phrases) ═══
  {
    id: 'repairs', name: 'Repairs', emoji: '🔧', parentId: null,
    items: [
      { emoji: '🔁', label: 'Say Again', phrase: 'Say that again', wordType: 'social' },
      { emoji: '❓', label: "Don't Understand", phrase: "I don't understand", wordType: 'social' },
      { emoji: '😤', label: 'Frustrated', phrase: 'I am frustrated', wordType: 'social' },
      { emoji: '⏸️', label: 'Need Break', phrase: 'I need a break', wordType: 'social' },
      { emoji: '🤔', label: 'Thinking', phrase: 'I am thinking', wordType: 'social' },
      { emoji: '🐌', label: 'Slow Down', phrase: 'Slow down please', wordType: 'social' },
      { emoji: '😶', label: 'Not Ready', phrase: 'I am not ready', wordType: 'social' },
      { emoji: '❌', label: 'Wrong', phrase: 'That is wrong', wordType: 'social' },
      { emoji: '🔊', label: 'Louder', phrase: 'Can you say that louder', wordType: 'social' },
      { emoji: '🤫', label: 'Too Loud', phrase: 'It is too loud', wordType: 'social' },
      { emoji: '🔁', label: 'Try Again', phrase: 'Let me try again', wordType: 'social' },
      { emoji: '😠', label: 'Upset', phrase: 'I am upset', wordType: 'social' },
    ],
  },

  // ═══ FEELINGS (copied from prototype) ═══
  {
    id: 'feelings', name: 'Feelings', emoji: '😊', parentId: 'home',
    items: [
      { emoji: '😄', label: 'Happy', phrase: 'I am happy', wordType: 'descriptor', arasaacId: 35533 },
      { emoji: '😢', label: 'Sad', phrase: 'I am sad', wordType: 'descriptor', arasaacId: 35545 },
      { emoji: '😡', label: 'Angry', phrase: 'I am angry', wordType: 'descriptor', arasaacId: 35539 },
      { emoji: '😨', label: 'Scared', phrase: 'I am scared', wordType: 'descriptor', arasaacId: 35535 },
      { emoji: '😩', label: 'Tired', phrase: 'I am tired', wordType: 'descriptor', arasaacId: 35537 },
      { emoji: '🤒', label: 'Sick', phrase: 'I feel sick', wordType: 'descriptor', arasaacId: 3308 },
      { emoji: '🥱', label: 'Bored', phrase: 'I am bored', wordType: 'descriptor', arasaacId: 35531 },
      { emoji: '🤗', label: 'Love', phrase: 'I love you', wordType: 'descriptor', arasaacId: 6898 },
      { emoji: '😤', label: 'Frustrated', phrase: 'I am frustrated', wordType: 'descriptor', arasaacId: 35539 },
      { emoji: '🥰', label: 'Good', phrase: 'I feel good', wordType: 'descriptor', arasaacId: 13630 },
      { emoji: '😰', label: 'Worried', phrase: 'I am worried', wordType: 'descriptor', arasaacId: 36341 },
      { emoji: '🥳', label: 'Excited', phrase: 'I am excited', wordType: 'descriptor', arasaacId: 39090 },
      { emoji: '😬', label: 'Nervous', phrase: 'I am nervous', wordType: 'descriptor', arasaacId: 38929 },
      { emoji: '😌', label: 'Calm', phrase: 'I am calm', wordType: 'descriptor', arasaacId: 31310 },
      { emoji: '🤔', label: 'Confused', phrase: 'I am confused', wordType: 'descriptor', arasaacId: 35541 },
      { emoji: '😲', label: 'Surprised', phrase: 'I am surprised', wordType: 'descriptor', arasaacId: 35529 },
      // Expanded feelings (TDSnap analysis: need deeper emotional vocabulary)
      { emoji: '😇', label: 'Proud', phrase: 'I am proud', wordType: 'descriptor', arasaacId: 31408 },
      { emoji: '😔', label: 'Lonely', phrase: 'I feel lonely', wordType: 'descriptor', arasaacId: 7253 },
      { emoji: '😳', label: 'Embarrassed', phrase: 'I am embarrassed', wordType: 'descriptor', arasaacId: 11953 },
      { emoji: '🥺', label: 'Hurt Feelings', phrase: 'My feelings are hurt', wordType: 'descriptor', arasaacId: 2367 },
      { emoji: '😶', label: 'Shy', phrase: 'I feel shy', wordType: 'descriptor', arasaacId: 37767 },
      { emoji: '😏', label: 'Silly', phrase: 'I feel silly', wordType: 'descriptor', arasaacId: 15483 },
      { emoji: '🥰', label: 'Grateful', phrase: 'I feel grateful', wordType: 'descriptor', arasaacId: 37233 },
      { emoji: '😞', label: 'Disappointed', phrase: 'I am disappointed', wordType: 'descriptor', arasaacId: 11959 },
    ],
  },

  // ═══ FOOD (cultural sub-boards + categories) ═══
  {
    id: 'food', name: 'Food', emoji: '🍎', parentId: 'home',
    items: [
      { emoji: '🍔', label: 'American', category: 'food_american' },
      { emoji: '🌮', label: 'Mexican & Latin', category: 'food_latin' },
      { emoji: '🍗', label: 'Soul Food', category: 'food_soul' },
      { emoji: '🍜', label: 'East Asian', category: 'food_eastasian' },
      { emoji: '🥖', label: 'South Asian', category: 'food_southasian' },
      { emoji: '🧆', label: 'Middle Eastern', category: 'food_middleeast' },
      { emoji: '🍚', label: 'African', category: 'food_african' },
      { emoji: '🌴', label: 'Caribbean', category: 'food_caribbean' },
      { emoji: '🥐', label: 'European', category: 'food_european' },
      { emoji: '🥤', label: 'Drinks', category: 'drinks' },
      { emoji: '🍪', label: 'Snacks', category: 'snacks' },
      { emoji: '🍰', label: 'Desserts', category: 'desserts' },
      { emoji: '🍓', label: 'Fruits', category: 'fruits' },
      { emoji: '🥦', label: 'Vegetables', category: 'vegetables' },
    ],
  },

  // ═══ DRINKS (copied from prototype) ═══
  {
    id: 'drinks', name: 'Drinks', emoji: '🥤', parentId: 'food',
    items: [
      { emoji: '💧', label: 'Water', phrase: 'Drink water please', wordType: 'noun' },
      { emoji: '🥛', label: 'Milk', phrase: 'Drink milk please', wordType: 'noun' },
      { emoji: '🧃', label: 'Juice', category: 'juice-types' },
      { emoji: '🥤', label: 'Soda', category: 'soda-types' },
      { emoji: '🥛', label: 'Chocolate Milk', phrase: 'Drink chocolate milk', wordType: 'noun' },
      { emoji: '🍋', label: 'Lemonade', phrase: 'Drink lemonade', wordType: 'noun' },
      { emoji: '🥤', label: 'Smoothie', phrase: 'Drink smoothie', wordType: 'noun' },
      { emoji: '☕', label: 'Hot Chocolate', phrase: 'Drink hot chocolate', wordType: 'noun' },
      { emoji: '🍦', label: 'Milkshake', phrase: 'Drink milkshake', wordType: 'noun' },
      { emoji: '🍓', label: 'Fruit Punch', phrase: 'Drink fruit punch', wordType: 'noun' },
      { emoji: '🧊', label: 'Iced Tea', phrase: 'Drink iced tea', wordType: 'noun' },
    ],
  },

  // ═══ JUICE TYPES ═══
  {
    id: 'juice-types', name: 'Juice', emoji: '🧃', parentId: 'drinks',
    items: [
      { emoji: '🍊', label: 'Orange Juice', phrase: 'Drink orange juice please', wordType: 'noun' },
      { emoji: '🍎', label: 'Apple Juice', phrase: 'Drink apple juice please', wordType: 'noun' },
      { emoji: '🍇', label: 'Grape Juice', phrase: 'Drink grape juice please', wordType: 'noun' },
      { emoji: '🍍', label: 'Pineapple Juice', phrase: 'Drink pineapple juice', wordType: 'noun' },
      { emoji: '🥭', label: 'Mango Juice', phrase: 'Drink mango juice', wordType: 'noun' },
      { emoji: '🍒', label: 'Cranberry Juice', phrase: 'Drink cranberry juice', wordType: 'noun' },
      { emoji: '🍓', label: 'Strawberry Juice', phrase: 'Drink strawberry juice', wordType: 'noun' },
    ],
  },

  // ═══ SODA TYPES ═══
  {
    id: 'soda-types', name: 'Soda', emoji: '🥤', parentId: 'drinks',
    items: [
      { emoji: '🥤', label: 'Coke', phrase: 'Drink coke please', wordType: 'noun' },
      { emoji: '🥤', label: 'Sprite', phrase: 'Drink sprite please', wordType: 'noun' },
      { emoji: '🥤', label: 'Fanta', phrase: 'Drink fanta please', wordType: 'noun' },
      { emoji: '🥤', label: 'Root Beer', phrase: 'Drink root beer', wordType: 'noun' },
      { emoji: '🥤', label: 'Ginger Ale', phrase: 'Drink ginger ale', wordType: 'noun' },
      { emoji: '🥤', label: 'Dr Pepper', phrase: 'Drink dr pepper', wordType: 'noun' },
    ],
  },

  // ═══ AMERICAN FOOD ═══
  {
    id: 'food_american', name: 'American', emoji: '🍔', parentId: 'food',
    items: [
      { emoji: '🍔', label: 'Hamburger', phrase: 'Eat hamburger', wordType: 'noun' },
      { emoji: '🌭', label: 'Hot Dog', phrase: 'Eat hot dog', wordType: 'noun' },
      { emoji: '🍕', label: 'Pizza', phrase: 'Eat pizza', wordType: 'noun' },
      { emoji: '🍗', label: 'Fried Chicken', phrase: 'Eat fried chicken', wordType: 'noun' },
      { emoji: '🥪', label: 'Sandwich', phrase: 'Eat sandwich', wordType: 'noun' },
      { emoji: '🧀', label: 'Grilled Cheese', phrase: 'Eat grilled cheese', wordType: 'noun' },
      { emoji: '🥓', label: 'Bacon', phrase: 'Eat bacon', wordType: 'noun' },
      { emoji: '🥞', label: 'Pancakes', phrase: 'Eat pancakes', wordType: 'noun' },
      { emoji: '🧇', label: 'Waffles', phrase: 'Eat waffles', wordType: 'noun' },
      { emoji: '🍳', label: 'Eggs', phrase: 'Eat eggs', wordType: 'noun' },
      { emoji: '🥣', label: 'Cereal', phrase: 'Eat cereal', wordType: 'noun' },
      { emoji: '🥪', label: 'PB&J', phrase: 'Eat peanut butter and jelly', wordType: 'noun' },
      { emoji: '🌽', label: 'Corn on the Cob', phrase: 'Eat corn on the cob', wordType: 'noun' },
      { emoji: '🥣', label: 'Mashed Potatoes', phrase: 'Eat mashed potatoes', wordType: 'noun' },
      { emoji: '🍟', label: 'French Fries', phrase: 'Eat french fries', wordType: 'noun' },
      { emoji: '🥗', label: 'Salad', phrase: 'Eat salad', wordType: 'noun' },
      { emoji: '🥩', label: 'BBQ Ribs', phrase: 'Eat bbq ribs', wordType: 'noun' },
      { emoji: '🥩', label: 'Steak', phrase: 'Eat steak', wordType: 'noun' },
      { emoji: '🧀', label: 'Mac and Cheese', phrase: 'Eat mac and cheese', wordType: 'noun' },
      { emoji: '🍲', label: 'Chili', phrase: 'Eat chili', wordType: 'noun' },
      { emoji: '🥧', label: 'Pot Pie', phrase: 'Eat pot pie', wordType: 'noun' },
      { emoji: '🍲', label: 'Soup', phrase: 'Eat soup', wordType: 'noun' },
      { emoji: '🍞', label: 'Biscuits', phrase: 'Eat biscuits', wordType: 'noun' },
      { emoji: '🍳', label: 'Omelette', phrase: 'Eat omelette', wordType: 'noun' },
      { emoji: '🥩', label: 'Meatloaf', phrase: 'Eat meatloaf', wordType: 'noun' },
    ],
  },

  // ═══ MEXICAN & LATIN FOOD ═══
  {
    id: 'food_latin', name: 'Mexican & Latin', emoji: '🌮', parentId: 'food',
    items: [
      { emoji: '🌮', label: 'Tacos', phrase: 'Eat tacos', wordType: 'noun' },
      { emoji: '🌯', label: 'Burrito', phrase: 'Eat burrito', wordType: 'noun' },
      { emoji: '🌽', label: 'Tamales', phrase: 'Eat tamales', wordType: 'noun' },
      { emoji: '🥖', label: 'Quesadilla', phrase: 'Eat quesadilla', wordType: 'noun' },
      { emoji: '🍚', label: 'Rice and Beans', phrase: 'Eat rice and beans', wordType: 'noun' },
      { emoji: '🥑', label: 'Guacamole', phrase: 'Eat guacamole', wordType: 'noun' },
      { emoji: '🍅', label: 'Salsa', phrase: 'Eat salsa', wordType: 'noun' },
      { emoji: '🌽', label: 'Elote', phrase: 'Eat elote', wordType: 'noun' },
      { emoji: '🍛', label: 'Arroz con Pollo', phrase: 'Eat arroz con pollo', wordType: 'noun' },
      { emoji: '🌮', label: 'Enchiladas', phrase: 'Eat enchiladas', wordType: 'noun' },
      { emoji: '🥖', label: 'Tortilla', phrase: 'Eat tortilla', wordType: 'noun' },
      { emoji: '🍲', label: 'Pozole', phrase: 'Eat pozole', wordType: 'noun' },
      { emoji: '🥟', label: 'Empanadas', phrase: 'Eat empanadas', wordType: 'noun' },
      { emoji: '🌮', label: 'Carnitas', phrase: 'Eat carnitas', wordType: 'noun' },
      { emoji: '🥩', label: 'Carne Asada', phrase: 'Eat carne asada', wordType: 'noun' },
      { emoji: '🧅', label: 'Pupusas', phrase: 'Eat pupusas', wordType: 'noun' },
      { emoji: '🍌', label: 'Plantains', phrase: 'Eat plantains', wordType: 'noun' },
      { emoji: '🥘', label: 'Black Beans', phrase: 'Eat black beans', wordType: 'noun' },
      { emoji: '🌶️', label: 'Chile Relleno', phrase: 'Eat chile relleno', wordType: 'noun' },
      { emoji: '🍲', label: 'Menudo', phrase: 'Eat menudo', wordType: 'noun' },
      { emoji: '🥖', label: 'Gorditas', phrase: 'Eat gorditas', wordType: 'noun' },
      { emoji: '🥘', label: 'Mole', phrase: 'Eat mole', wordType: 'noun' },
      { emoji: '🍳', label: 'Huevos Rancheros', phrase: 'Eat huevos rancheros', wordType: 'noun' },
      { emoji: '🥛', label: 'Horchata', phrase: 'Eat horchata', wordType: 'noun' },
      { emoji: '🍹', label: 'Agua Fresca', phrase: 'Eat agua fresca', wordType: 'noun' },
      { emoji: '🍮', label: 'Flan', phrase: 'Eat flan', wordType: 'noun' },
      { emoji: '🍧', label: 'Paleta', phrase: 'Eat paleta', wordType: 'noun' },
      { emoji: '🍰', label: 'Tres Leches', phrase: 'Eat tres leches', wordType: 'noun' },
      { emoji: '🍩', label: 'Churros', phrase: 'Eat churros', wordType: 'noun' },
      { emoji: '🥖', label: 'Sope', phrase: 'Eat sope', wordType: 'noun' },
      { emoji: '🍗', label: 'Pollo Asado', phrase: 'Eat pollo asado', wordType: 'noun' },
      { emoji: '🌮', label: 'Chilaquiles', phrase: 'Eat chilaquiles', wordType: 'noun' },
      { emoji: '🌮', label: 'Tostada', phrase: 'Eat tostada', wordType: 'noun' },
    ],
  },

  // ═══ SOUL FOOD / AFRICAN AMERICAN ═══
  {
    id: 'food_soul', name: 'Soul Food', emoji: '🍗', parentId: 'food',
    items: [
      { emoji: '🍗', label: 'Fried Chicken', phrase: 'Eat fried chicken', wordType: 'noun' },
      { emoji: '🥬', label: 'Collard Greens', phrase: 'Eat collard greens', wordType: 'noun' },
      { emoji: '🌽', label: 'Cornbread', phrase: 'Eat cornbread', wordType: 'noun' },
      { emoji: '🍝', label: 'Mac and Cheese', phrase: 'Eat mac and cheese', wordType: 'noun' },
      { emoji: '🥘', label: 'Black-Eyed Peas', phrase: 'Eat black-eyed peas', wordType: 'noun' },
      { emoji: '🍠', label: 'Sweet Potato', phrase: 'Eat sweet potato', wordType: 'noun' },
      { emoji: '🥘', label: 'Gumbo', phrase: 'Eat gumbo', wordType: 'noun' },
      { emoji: '🍖', label: 'BBQ', phrase: 'Eat bbq', wordType: 'noun' },
      { emoji: '🍚', label: 'Rice', phrase: 'Eat rice', wordType: 'noun' },
      { emoji: '🥧', label: 'Sweet Potato Pie', phrase: 'Eat sweet potato pie', wordType: 'noun' },
      { emoji: '🐟', label: 'Fried Fish', phrase: 'Eat fried fish', wordType: 'noun' },
      { emoji: '🥘', label: 'Jambalaya', phrase: 'Eat jambalaya', wordType: 'noun' },
      { emoji: '🥘', label: 'Red Beans & Rice', phrase: 'Eat red beans and rice', wordType: 'noun' },
      { emoji: '🧈', label: 'Biscuits & Gravy', phrase: 'Eat biscuits and gravy', wordType: 'noun' },
      { emoji: '🥬', label: 'Cabbage', phrase: 'Eat cabbage', wordType: 'noun' },
      { emoji: '🌶️', label: 'Hot Sauce', phrase: 'Eat hot sauce', wordType: 'noun' },
      { emoji: '🍳', label: 'Grits', phrase: 'Eat grits', wordType: 'noun' },
      { emoji: '🥜', label: 'Peanut Soup', phrase: 'Eat peanut soup', wordType: 'noun' },
      { emoji: '🍗', label: 'Chicken Wings', phrase: 'Eat chicken wings', wordType: 'noun' },
      { emoji: '🧁', label: 'Peach Cobbler', phrase: 'Eat peach cobbler', wordType: 'noun' },
      { emoji: '🍰', label: 'Pound Cake', phrase: 'Eat pound cake', wordType: 'noun' },
    ],
  },

  // ═══ EAST ASIAN FOOD ═══
  {
    id: 'food_eastasian', name: 'East Asian', emoji: '🍜', parentId: 'food',
    items: [
      { emoji: '🍚', label: 'Rice', phrase: 'Eat rice', wordType: 'noun' },
      { emoji: '🍜', label: 'Noodles', phrase: 'Eat noodles', wordType: 'noun' },
      { emoji: '🍣', label: 'Sushi', phrase: 'Eat sushi', wordType: 'noun' },
      { emoji: '🥟', label: 'Dumplings', phrase: 'Eat dumplings', wordType: 'noun' },
      { emoji: '🍲', label: 'Ramen', phrase: 'Eat ramen', wordType: 'noun' },
      { emoji: '🥡', label: 'Stir Fry', phrase: 'Eat stir fry', wordType: 'noun' },
      { emoji: '🍱', label: 'Bento Box', phrase: 'Eat bento box', wordType: 'noun' },
      { emoji: '🍲', label: 'Hot Pot', phrase: 'Eat hot pot', wordType: 'noun' },
      { emoji: '🥢', label: 'Chopsticks', phrase: 'Eat chopsticks', wordType: 'noun' },
      { emoji: '🍛', label: 'Fried Rice', phrase: 'Eat fried rice', wordType: 'noun' },
      { emoji: '🥘', label: 'Curry Rice', phrase: 'Eat curry rice', wordType: 'noun' },
      { emoji: '🍖', label: 'Teriyaki', phrase: 'Eat teriyaki', wordType: 'noun' },
      { emoji: '🍤', label: 'Tempura', phrase: 'Eat tempura', wordType: 'noun' },
      { emoji: '🥬', label: 'Bok Choy', phrase: 'Eat bok choy', wordType: 'noun' },
      { emoji: '🧄', label: 'Garlic Noodles', phrase: 'Eat garlic noodles', wordType: 'noun' },
      { emoji: '🥟', label: 'Spring Rolls', phrase: 'Eat spring rolls', wordType: 'noun' },
      { emoji: '🍜', label: 'Pho', phrase: 'Eat pho', wordType: 'noun' },
      { emoji: '🥡', label: 'Lo Mein', phrase: 'Eat lo mein', wordType: 'noun' },
      { emoji: '🍗', label: 'Orange Chicken', phrase: 'Eat orange chicken', wordType: 'noun' },
      { emoji: '🧆', label: 'Mochi', phrase: 'Eat mochi', wordType: 'noun' },
      { emoji: '🥮', label: 'Moon Cake', phrase: 'Eat moon cake', wordType: 'noun' },
      { emoji: '🍘', label: 'Rice Cracker', phrase: 'Eat rice cracker', wordType: 'noun' },
      { emoji: '🥘', label: 'Edamame', phrase: 'Eat edamame', wordType: 'noun' },
      { emoji: '🍵', label: 'Green Tea', phrase: 'Eat green tea', wordType: 'noun' },
      { emoji: '🧋', label: 'Bubble Tea', phrase: 'Eat bubble tea', wordType: 'noun' },
      { emoji: '🥡', label: 'Chow Mein', phrase: 'Eat chow mein', wordType: 'noun' },
      { emoji: '🥘', label: 'Bibimbap', phrase: 'Eat bibimbap', wordType: 'noun' },
      { emoji: '🥬', label: 'Kimchi', phrase: 'Eat kimchi', wordType: 'noun' },
      { emoji: '🍖', label: 'Korean BBQ', phrase: 'Eat korean bbq', wordType: 'noun' },
      { emoji: '🥟', label: 'Wonton', phrase: 'Eat wonton', wordType: 'noun' },
      { emoji: '🍲', label: 'Miso Soup', phrase: 'Eat miso soup', wordType: 'noun' },
    ],
  },

  // ═══ SOUTH ASIAN FOOD ═══
  {
    id: 'food_southasian', name: 'South Asian', emoji: '🥖', parentId: 'food',
    items: [
      { emoji: '🍛', label: 'Curry', phrase: 'Eat curry', wordType: 'noun' },
      { emoji: '🥖', label: 'Naan', phrase: 'Eat naan', wordType: 'noun' },
      { emoji: '🍚', label: 'Biryani', phrase: 'Eat biryani', wordType: 'noun' },
      { emoji: '🥘', label: 'Dal', phrase: 'Eat dal', wordType: 'noun' },
      { emoji: '🥖', label: 'Roti', phrase: 'Eat roti', wordType: 'noun' },
      { emoji: '🥟', label: 'Samosa', phrase: 'Eat samosa', wordType: 'noun' },
      { emoji: '🍗', label: 'Tandoori Chicken', phrase: 'Eat tandoori chicken', wordType: 'noun' },
      { emoji: '🧆', label: 'Pakora', phrase: 'Eat pakora', wordType: 'noun' },
      { emoji: '🥖', label: 'Paratha', phrase: 'Eat paratha', wordType: 'noun' },
      { emoji: '🥘', label: 'Tikka Masala', phrase: 'Eat tikka masala', wordType: 'noun' },
      { emoji: '🍚', label: 'Rice Pilaf', phrase: 'Eat rice pilaf', wordType: 'noun' },
      { emoji: '🥬', label: 'Saag', phrase: 'Eat saag', wordType: 'noun' },
      { emoji: '🥘', label: 'Chana Masala', phrase: 'Eat chana masala', wordType: 'noun' },
      { emoji: '🧅', label: 'Onion Bhaji', phrase: 'Eat onion bhaji', wordType: 'noun' },
      { emoji: '🥒', label: 'Raita', phrase: 'Eat raita', wordType: 'noun' },
      { emoji: '🥭', label: 'Mango Chutney', phrase: 'Eat mango chutney', wordType: 'noun' },
      { emoji: '🍮', label: 'Kheer', phrase: 'Eat kheer', wordType: 'noun' },
      { emoji: '🧁', label: 'Gulab Jamun', phrase: 'Eat gulab jamun', wordType: 'noun' },
      { emoji: '🍵', label: 'Chai Tea', phrase: 'Eat chai tea', wordType: 'noun' },
      { emoji: '🥤', label: 'Lassi', phrase: 'Eat lassi', wordType: 'noun' },
      { emoji: '🥖', label: 'Dosa', phrase: 'Eat dosa', wordType: 'noun' },
      { emoji: '🥘', label: 'Korma', phrase: 'Eat korma', wordType: 'noun' },
      { emoji: '🍛', label: 'Vindaloo', phrase: 'Eat vindaloo', wordType: 'noun' },
      { emoji: '🥘', label: 'Rajma', phrase: 'Eat rajma', wordType: 'noun' },
      { emoji: '🍚', label: 'Idli', phrase: 'Eat idli', wordType: 'noun' },
    ],
  },

  // ═══ MIDDLE EASTERN FOOD ═══
  {
    id: 'food_middleeast', name: 'Middle Eastern', emoji: '🧆', parentId: 'food',
    items: [
      { emoji: '🧆', label: 'Falafel', phrase: 'Eat falafel', wordType: 'noun' },
      { emoji: '🥘', label: 'Hummus', phrase: 'Eat hummus', wordType: 'noun' },
      { emoji: '🥙', label: 'Pita', phrase: 'Eat pita', wordType: 'noun' },
      { emoji: '🍖', label: 'Shawarma', phrase: 'Eat shawarma', wordType: 'noun' },
      { emoji: '🥙', label: 'Kebab', phrase: 'Eat kebab', wordType: 'noun' },
      { emoji: '🍚', label: 'Couscous', phrase: 'Eat couscous', wordType: 'noun' },
      { emoji: '🥬', label: 'Tabbouleh', phrase: 'Eat tabbouleh', wordType: 'noun' },
      { emoji: '🍆', label: 'Baba Ganoush', phrase: 'Eat baba ganoush', wordType: 'noun' },
      { emoji: '🥖', label: 'Flatbread', phrase: 'Eat flatbread', wordType: 'noun' },
      { emoji: '🥘', label: 'Tagine', phrase: 'Eat tagine', wordType: 'noun' },
      { emoji: '🧅', label: 'Dolma', phrase: 'Eat dolma', wordType: 'noun' },
      { emoji: '🥗', label: 'Fattoush', phrase: 'Eat fattoush', wordType: 'noun' },
      { emoji: '🍮', label: 'Baklava', phrase: 'Eat baklava', wordType: 'noun' },
      { emoji: '🥖', label: 'Manakish', phrase: 'Eat manakish', wordType: 'noun' },
      { emoji: '🍵', label: 'Mint Tea', phrase: 'Eat mint tea', wordType: 'noun' },
      { emoji: '🧀', label: 'Halloumi', phrase: 'Eat halloumi', wordType: 'noun' },
      { emoji: '🥘', label: 'Shakshuka', phrase: 'Eat shakshuka', wordType: 'noun' },
      { emoji: '🍚', label: 'Rice Pilaf', phrase: 'Eat rice pilaf', wordType: 'noun' },
    ],
  },

  // ═══ AFRICAN FOOD ═══
  {
    id: 'food_african', name: 'African', emoji: '🍚', parentId: 'food',
    items: [
      { emoji: '🍚', label: 'Jollof Rice', phrase: 'Eat jollof rice', wordType: 'noun' },
      { emoji: '🥖', label: 'Injera', phrase: 'Eat injera', wordType: 'noun' },
      { emoji: '🥘', label: 'Stew', phrase: 'Eat stew', wordType: 'noun' },
      { emoji: '🍠', label: 'Fufu', phrase: 'Eat fufu', wordType: 'noun' },
      { emoji: '🥜', label: 'Peanut Soup', phrase: 'Eat peanut soup', wordType: 'noun' },
      { emoji: '🌶️', label: 'Suya', phrase: 'Eat suya', wordType: 'noun' },
      { emoji: '🍌', label: 'Plantains', phrase: 'Eat plantains', wordType: 'noun' },
      { emoji: '🥘', label: 'Lentils', phrase: 'Eat lentils', wordType: 'noun' },
      { emoji: '🥬', label: 'Greens', phrase: 'Eat greens', wordType: 'noun' },
      { emoji: '🍲', label: 'Egusi Soup', phrase: 'Eat egusi soup', wordType: 'noun' },
      { emoji: '🍖', label: 'Grilled Meat', phrase: 'Eat grilled meat', wordType: 'noun' },
      { emoji: '🌽', label: 'Ugali', phrase: 'Eat ugali', wordType: 'noun' },
      { emoji: '🥘', label: 'Doro Wat', phrase: 'Eat doro wat', wordType: 'noun' },
      { emoji: '🥖', label: 'Chapati', phrase: 'Eat chapati', wordType: 'noun' },
    ],
  },

  // ═══ CARIBBEAN FOOD ═══
  {
    id: 'food_caribbean', name: 'Caribbean', emoji: '🌴', parentId: 'food',
    items: [
      { emoji: '🍗', label: 'Jerk Chicken', phrase: 'Eat jerk chicken', wordType: 'noun' },
      { emoji: '🍚', label: 'Rice and Peas', phrase: 'Eat rice and peas', wordType: 'noun' },
      { emoji: '🍌', label: 'Plantains', phrase: 'Eat plantains', wordType: 'noun' },
      { emoji: '🥘', label: 'Curry Goat', phrase: 'Eat curry goat', wordType: 'noun' },
      { emoji: '🐟', label: 'Fried Fish', phrase: 'Eat fried fish', wordType: 'noun' },
      { emoji: '🥖', label: 'Roti', phrase: 'Eat roti', wordType: 'noun' },
      { emoji: '🥥', label: 'Coconut', phrase: 'Eat coconut', wordType: 'noun' },
      { emoji: '🥭', label: 'Mango', phrase: 'Eat mango', wordType: 'noun' },
      { emoji: '🥘', label: 'Callaloo', phrase: 'Eat callaloo', wordType: 'noun' },
      { emoji: '🥟', label: 'Patty', phrase: 'Eat patty', wordType: 'noun' },
      { emoji: '🍲', label: 'Oxtail', phrase: 'Eat oxtail', wordType: 'noun' },
    ],
  },

  // ═══ EUROPEAN FOOD ═══
  {
    id: 'food_european', name: 'European', emoji: '🥐', parentId: 'food',
    items: [
      { emoji: '🍝', label: 'Pasta', phrase: 'Eat pasta', wordType: 'noun' },
      { emoji: '🍕', label: 'Margherita Pizza', phrase: 'Eat margherita pizza', wordType: 'noun' },
      { emoji: '🥐', label: 'Croissant', phrase: 'Eat croissant', wordType: 'noun' },
      { emoji: '🥖', label: 'Baguette', phrase: 'Eat baguette', wordType: 'noun' },
      { emoji: '🧀', label: 'Cheese', phrase: 'Eat cheese', wordType: 'noun' },
      { emoji: '🥘', label: 'Paella', phrase: 'Eat paella', wordType: 'noun' },
      { emoji: '🍲', label: 'Borscht', phrase: 'Eat borscht', wordType: 'noun' },
      { emoji: '🥟', label: 'Pierogi', phrase: 'Eat pierogi', wordType: 'noun' },
      { emoji: '🌭', label: 'Bratwurst', phrase: 'Eat bratwurst', wordType: 'noun' },
      { emoji: '🥨', label: 'Pretzel', phrase: 'Eat pretzel', wordType: 'noun' },
      { emoji: '🐟', label: 'Fish and Chips', phrase: 'Eat fish and chips', wordType: 'noun' },
      { emoji: '🍰', label: 'Crepe', phrase: 'Eat crepe', wordType: 'noun' },
      { emoji: '🥗', label: 'Greek Salad', phrase: 'Eat greek salad', wordType: 'noun' },
      { emoji: '🍲', label: 'Fondue', phrase: 'Eat fondue', wordType: 'noun' },
      { emoji: '🍖', label: 'Schnitzel', phrase: 'Eat schnitzel', wordType: 'noun' },
    ],
  },

  // ═══ SNACKS (copied from prototype + expanded) ═══
  {
    id: 'snacks', name: 'Snacks', emoji: '🍪', parentId: 'food',
    items: [
      { emoji: '🥜', label: 'Peanut Butter', phrase: 'Eat peanut butter', wordType: 'noun' },
      { emoji: '🧇', label: 'Waffle', phrase: 'Eat waffle', wordType: 'noun' },
      { emoji: '🍿', label: 'Popcorn', phrase: 'Eat popcorn', wordType: 'noun' },
      { emoji: '🥨', label: 'Crackers', phrase: 'Eat crackers', wordType: 'noun' },
      { emoji: '🍫', label: 'Chocolate', phrase: 'Eat chocolate', wordType: 'noun' },
      { emoji: '🍦', label: 'Ice Cream', phrase: 'Eat ice cream', wordType: 'noun' },
      { emoji: '🍩', label: 'Donut', phrase: 'Eat donut', wordType: 'noun' },
      { emoji: '🧁', label: 'Cupcake', phrase: 'Eat cupcake', wordType: 'noun' },
      { emoji: '🥜', label: 'Nuts', phrase: 'Eat nuts', wordType: 'noun', arasaacId: 2674 },
      { emoji: '🧀', label: 'Cheese Stick', phrase: 'Eat cheese stick', wordType: 'noun' },
      { emoji: '🍘', label: 'Rice Cake', phrase: 'Eat rice cake', wordType: 'noun' },
      { emoji: '🥐', label: 'Croissant', phrase: 'Eat croissant', wordType: 'noun' },
      { emoji: '🥘', label: 'Trail Mix', phrase: 'Eat trail mix', wordType: 'noun' },
      { emoji: '🥖', label: 'Breadstick', phrase: 'Eat breadstick', wordType: 'noun' },
    ],
  },

  // ═══ FRUITS (new subcategory) ═══
  {
    id: 'fruits', name: 'Fruits', emoji: '🍓', parentId: 'food',
    items: [
      { emoji: '🍎', label: 'Apple', phrase: 'Eat apple', wordType: 'noun' },
      { emoji: '🍌', label: 'Banana', phrase: 'Eat banana', wordType: 'noun' },
      { emoji: '🍓', label: 'Strawberry', phrase: 'Eat strawberry', wordType: 'noun' },
      { emoji: '🍊', label: 'Orange', phrase: 'Eat orange', wordType: 'noun' },
      { emoji: '🍇', label: 'Grapes', phrase: 'Eat grapes', wordType: 'noun' },
      { emoji: '🍉', label: 'Watermelon', phrase: 'Eat watermelon', wordType: 'noun' },
      { emoji: '🍑', label: 'Apricot', phrase: 'Eat apricot', wordType: 'noun' },
      { emoji: '🍒', label: 'Cherry', phrase: 'Eat cherry', wordType: 'noun' },
      { emoji: '🍇', label: 'Blueberry', phrase: 'Eat blueberry', wordType: 'noun' },
      { emoji: '🥭', label: 'Mango', phrase: 'Eat mango', wordType: 'noun' },
      { emoji: '🍍', label: 'Pineapple', phrase: 'Eat pineapple', wordType: 'noun' },
      { emoji: '🥝', label: 'Kiwi', phrase: 'Eat kiwi', wordType: 'noun' },
      { emoji: '🍐', label: 'Pear', phrase: 'Eat pear', wordType: 'noun' },
      { emoji: '🍋', label: 'Lemon', phrase: 'Eat lemon', wordType: 'noun' },
    ],
  },

  // ═══ VEGETABLES (new subcategory) ═══
  {
    id: 'vegetables', name: 'Vegetables', emoji: '🥦', parentId: 'food',
    items: [
      { emoji: '🥕', label: 'Carrot', phrase: 'Eat carrot', wordType: 'noun' },
      { emoji: '🥦', label: 'Broccoli', phrase: 'Eat broccoli', wordType: 'noun' },
      { emoji: '🌽', label: 'Corn', phrase: 'Eat corn', wordType: 'noun' },
      { emoji: '🥬', label: 'Lettuce', phrase: 'Eat lettuce', wordType: 'noun' },
      { emoji: '🍅', label: 'Tomato', phrase: 'Eat tomato', wordType: 'noun' },
      { emoji: '🥒', label: 'Cucumber', phrase: 'Eat cucumber', wordType: 'noun' },
      { emoji: '🌶️', label: 'Pepper', phrase: 'Eat pepper', wordType: 'noun' },
      { emoji: '🥔', label: 'Potato', phrase: 'Eat potato', wordType: 'noun' },
      { emoji: '🧅', label: 'Onion', phrase: 'Eat onion', wordType: 'noun' },
      { emoji: '🍄', label: 'Mushroom', phrase: 'Eat mushroom', wordType: 'noun' },
      { emoji: '🥗', label: 'Peas', phrase: 'Eat peas', wordType: 'noun' },
      { emoji: '🌶️', label: 'Hot Pepper', phrase: 'Eat hot pepper', wordType: 'noun' },
    ],
  },

  // ═══ DESSERTS (new subcategory) ═══
  {
    id: 'desserts', name: 'Desserts', emoji: '🍰', parentId: 'food',
    items: [
      { emoji: '🍰', label: 'Cake', phrase: 'Eat cake', wordType: 'noun' },
      { emoji: '🍦', label: 'Ice Cream', phrase: 'Eat ice cream', wordType: 'noun' },
      { emoji: '🧁', label: 'Cupcake', phrase: 'Eat cupcake', wordType: 'noun' },
      { emoji: '🍩', label: 'Donut', phrase: 'Eat donut', wordType: 'noun' },
      { emoji: '🍪', label: 'Cookie', phrase: 'Eat cookie', wordType: 'noun' },
      { emoji: '🥧', label: 'Pie', phrase: 'Eat pie', wordType: 'noun' },
      { emoji: '🍮', label: 'Pudding', phrase: 'Eat pudding', wordType: 'noun' },
      { emoji: '🍡', label: 'Candy', phrase: 'Eat candy', wordType: 'noun' },
      { emoji: '🍫', label: 'Chocolate Bar', phrase: 'Eat chocolate bar', wordType: 'noun' },
      { emoji: '🧊', label: 'Popsicle', phrase: 'Eat popsicle', wordType: 'noun' },
      { emoji: '🍬', label: 'Gummy Bears', phrase: 'Eat gummy bears', wordType: 'noun' },
      { emoji: '🎂', label: 'Birthday Cake', phrase: 'Eat birthday cake', wordType: 'noun' },
    ],
  },

  // ═══ ACTIVITIES / PLAY (copied from prototype + expanded) ═══
  {
    id: 'activities', name: 'Play', emoji: '⚽', parentId: 'home',
    items: [
      { emoji: '🏃', label: 'Sports', category: 'sports' },
      { emoji: '🎨', label: 'Creative', category: 'play_creative' },
      { emoji: '🎉', label: 'Cultural Events', category: 'play_cultural' },
      { emoji: '🎵', label: 'Music', category: 'music' },
      { emoji: '🏕️', label: 'Outdoor', category: 'outdoor' },
      { emoji: '🎮', label: 'Video Games', phrase: 'Play video games', wordType: 'noun' },
      { emoji: '🛝', label: 'Playground', phrase: 'Go to playground', wordType: 'noun' },
      { emoji: '🧩', label: 'Puzzle', phrase: 'Do a puzzle', wordType: 'noun' },
      { emoji: '🎭', label: 'Pretend Play', phrase: 'Pretend play', wordType: 'noun' },
      { emoji: '🏊', label: 'Swim', phrase: 'Go swimming', wordType: 'verb' },
      { emoji: '🚲', label: 'Bike', phrase: 'Ride my bike', wordType: 'verb' },
      { emoji: '🎲', label: 'Board Game', phrase: 'Play a game', wordType: 'noun' },
      { emoji: '📺', label: 'TV', phrase: 'Watch TV', wordType: 'noun' },
      { emoji: '😴', label: 'Rest', phrase: 'I want to rest', wordType: 'verb' },
      { emoji: '🎬', label: 'Movie', phrase: 'Watch a movie', wordType: 'noun' },
      { emoji: '🏗️', label: 'Build', phrase: 'I want to build', wordType: 'verb' },
      { emoji: '🧸', label: 'Toys', phrase: 'Play with toys', wordType: 'noun' },
    ],
  },

  // ═══ SPORTS (expanded to 30 items) ═══
  {
    id: 'sports', name: 'Sports', emoji: '🏃', parentId: 'activities',
    items: [
      { emoji: '⚽', label: 'Soccer', phrase: 'Play soccer', wordType: 'noun' },
      { emoji: '🏀', label: 'Basketball', phrase: 'Play basketball', wordType: 'noun' },
      { emoji: '🏈', label: 'Football', phrase: 'Play football', wordType: 'noun' },
      { emoji: '⚾', label: 'Baseball', phrase: 'Play baseball', wordType: 'noun' },
      { emoji: '🎾', label: 'Tennis', phrase: 'Play tennis', wordType: 'noun' },
      { emoji: '🏊', label: 'Swimming', phrase: 'Go swimming', wordType: 'noun' },
      { emoji: '🤸', label: 'Gymnastics', phrase: 'Do gymnastics', wordType: 'noun' },
      { emoji: '🏃', label: 'Running', phrase: 'Go running', wordType: 'noun' },
      { emoji: '🚴', label: 'Cycling', phrase: 'Go cycling', wordType: 'noun' },
      { emoji: '⛸️', label: 'Skating', phrase: 'Go skating', wordType: 'noun' },
      { emoji: '🥋', label: 'Martial Arts', phrase: 'Do martial arts', wordType: 'noun' },
      { emoji: '🏇', label: 'Horse Riding', phrase: 'Go horse riding', wordType: 'noun' },
      { emoji: '🏐', label: 'Volleyball', phrase: 'Play volleyball', wordType: 'noun' },
      { emoji: '🏸', label: 'Badminton', phrase: 'Play badminton', wordType: 'noun' },
      { emoji: '🏒', label: 'Hockey', phrase: 'Play hockey', wordType: 'noun' },
      { emoji: '🏓', label: 'Table Tennis', phrase: 'Play table tennis', wordType: 'noun' },
      { emoji: '🥊', label: 'Boxing', phrase: 'Do boxing', wordType: 'noun' },
      { emoji: '🤼', label: 'Wrestling', phrase: 'Do wrestling', wordType: 'noun' },
      { emoji: '🧗', label: 'Rock Climbing', phrase: 'Go rock climbing', wordType: 'noun' },
      { emoji: '🏋️', label: 'Weightlifting', phrase: 'Do weightlifting', wordType: 'noun' },
      { emoji: '🤾', label: 'Handball', phrase: 'Play handball', wordType: 'noun' },
      { emoji: '🏄', label: 'Surfing', phrase: 'Go surfing', wordType: 'noun' },
      { emoji: '⛷️', label: 'Skiing', phrase: 'Go skiing', wordType: 'noun' },
      { emoji: '🛹', label: 'Skateboarding', phrase: 'Go skateboarding', wordType: 'noun' },
      { emoji: '🎯', label: 'Archery', phrase: 'Do archery', wordType: 'noun' },
      { emoji: '⛳', label: 'Golf', phrase: 'Play golf', wordType: 'noun' },
      { emoji: '🥍', label: 'Lacrosse', phrase: 'Play lacrosse', wordType: 'noun' },
      { emoji: '🏑', label: 'Field Hockey', phrase: 'Play field hockey', wordType: 'noun' },
      { emoji: '💃', label: 'Dance', phrase: 'Dance class', wordType: 'noun' },
      { emoji: '🤺', label: 'Fencing', phrase: 'Do fencing', wordType: 'noun' },
      { emoji: '🏏', label: 'Cricket', phrase: 'I want to play cricket', wordType: 'noun' },
    ],
  },

  // ═══ MUSIC (new subcategory) ═══
  {
    id: 'music', name: 'Music', emoji: '🎵', parentId: 'activities',
    items: [
      { emoji: '🎵', label: 'Listen', phrase: 'Listen to music', wordType: 'verb' },
      { emoji: '🎤', label: 'Sing', phrase: 'I want to sing', wordType: 'verb' },
      { emoji: '🥁', label: 'Drums', phrase: 'Play drums', wordType: 'noun' },
      { emoji: '🎹', label: 'Piano', phrase: 'Play piano', wordType: 'noun' },
      { emoji: '🎸', label: 'Guitar', phrase: 'Play guitar', wordType: 'noun' },
      { emoji: '🎺', label: 'Trumpet', phrase: 'Play trumpet', wordType: 'noun' },
      { emoji: '🎻', label: 'Violin', phrase: 'Play violin', wordType: 'noun' },
      { emoji: '🔇', label: 'Quiet', phrase: 'Turn it down', wordType: 'descriptor' },
      { emoji: '🔊', label: 'Louder', phrase: 'Turn it up', wordType: 'descriptor' },
      { emoji: '⏭️', label: 'Next Song', phrase: 'Next song please', wordType: 'verb' },
      { emoji: '⏹️', label: 'Stop Music', phrase: 'Stop the music', wordType: 'verb' },
      { emoji: '▶️', label: 'Play Music', phrase: 'I want to play music', wordType: 'verb' },
      { emoji: '⏸️', label: 'Pause Music', phrase: 'Pause the music', wordType: 'verb' },
      { emoji: '🎷', label: 'Saxophone', phrase: 'I want to play saxophone', wordType: 'noun' },
      { emoji: '🪕', label: 'Banjo', phrase: 'I want to play banjo', wordType: 'noun' },
      { emoji: '📻', label: 'Radio', phrase: 'I want to listen to the radio', wordType: 'noun' },
      { emoji: '🎤', label: 'Karaoke', phrase: 'I want to do karaoke', wordType: 'noun' },
      { emoji: '🎧', label: 'Headphones On', phrase: 'I want my headphones', wordType: 'noun' },
      { emoji: '🎼', label: 'Sheet Music', phrase: 'I want to read music', wordType: 'noun' },
      { emoji: '🎵', label: 'My Favorite Song', phrase: 'Play my favorite song', wordType: 'noun' },
      { emoji: '🔀', label: 'Shuffle', phrase: 'Shuffle the music', wordType: 'verb' },
      { emoji: '🔁', label: 'Repeat', phrase: 'Repeat this song', wordType: 'verb' },
      { emoji: '⛪', label: 'Gospel', phrase: 'I want to hear gospel music', wordType: 'noun' },
      { emoji: '🎤', label: 'Hip Hop', phrase: 'I want to hear hip hop', wordType: 'noun' },
      { emoji: '🎻', label: 'Classical', phrase: 'I want to hear classical music', wordType: 'noun' },
    ],
  },

  // ═══ OUTDOOR (new subcategory) ═══
  {
    id: 'outdoor', name: 'Outdoor', emoji: '🏕️', parentId: 'activities',
    items: [
      { emoji: '🏕️', label: 'Camping', phrase: 'Go camping', wordType: 'noun' },
      { emoji: '🥾', label: 'Hiking', phrase: 'Go hiking', wordType: 'noun' },
      { emoji: '🎣', label: 'Fishing', phrase: 'Go fishing', wordType: 'noun' },
      { emoji: '🏔️', label: 'Mountain', phrase: 'Go to the mountain', wordType: 'noun' },
      { emoji: '🦋', label: 'Nature Walk', phrase: 'Go on a nature walk', wordType: 'noun' },
      { emoji: '🧗', label: 'Climbing', phrase: 'Go climbing', wordType: 'noun' },
      { emoji: '🌻', label: 'Garden', phrase: 'Go to the garden', wordType: 'noun' },
      { emoji: '🚴', label: 'Bike Ride', phrase: 'I want to go for a bike ride', wordType: 'noun' },
      { emoji: '🦅', label: 'Bird Watching', phrase: 'I want to go bird watching', wordType: 'noun' },
      { emoji: '🧺', label: 'Picnic', phrase: 'I want to have a picnic', wordType: 'noun' },
      { emoji: '🌟', label: 'Stargazing', phrase: 'I want to go stargazing', wordType: 'noun' },
      { emoji: '🛶', label: 'Kayaking', phrase: 'I want to go kayaking', wordType: 'noun' },
    ],
  },

  // ═══ CREATIVE PLAY ═══
  {
    id: 'play_creative', name: 'Creative', emoji: '🎨', parentId: 'activities',
    items: [
      { emoji: '🎨', label: 'Painting', phrase: 'I want to paint', wordType: 'noun' },
      { emoji: '✏️', label: 'Drawing', phrase: 'I want to draw', wordType: 'noun' },
      { emoji: '🖍️', label: 'Coloring', phrase: 'I want to color', wordType: 'noun' },
      { emoji: '✂️', label: 'Cutting', phrase: 'I want to cut', wordType: 'noun' },
      { emoji: '🧶', label: 'Knitting', phrase: 'I want to knit', wordType: 'noun' },
      { emoji: '🧵', label: 'Sewing', phrase: 'I want to sew', wordType: 'noun' },
      { emoji: '🧱', label: 'Building Blocks', phrase: 'Play with blocks', wordType: 'noun' },
      { emoji: '🧩', label: 'Puzzles', phrase: 'Do a puzzle', wordType: 'noun' },
      { emoji: '🎭', label: 'Drama', phrase: 'Do drama', wordType: 'noun' },
      { emoji: '📸', label: 'Photography', phrase: 'Take photos', wordType: 'noun' },
      { emoji: '📝', label: 'Writing Stories', phrase: 'Write a story', wordType: 'noun' },
      { emoji: '🎪', label: 'Puppet Show', phrase: 'Do a puppet show', wordType: 'noun' },
      { emoji: '🧱', label: 'Clay', phrase: 'Play with clay', wordType: 'noun' },
      { emoji: '🧵', label: 'Crafts', phrase: 'Do crafts', wordType: 'noun' },
    ],
  },

  // ═══ CULTURAL EVENTS ═══
  {
    id: 'play_cultural', name: 'Cultural Events', emoji: '🎉', parentId: 'activities',
    items: [
      { emoji: '🎂', label: 'Birthday Party', phrase: 'Birthday party', wordType: 'noun' },
      { emoji: '🎃', label: 'Halloween', phrase: 'Halloween', wordType: 'noun' },
      { emoji: '🎄', label: 'Christmas', phrase: 'Christmas', wordType: 'noun' },
      { emoji: '🕎', label: 'Hanukkah', phrase: 'Hanukkah', wordType: 'noun' },
      { emoji: '🪔', label: 'Diwali', phrase: 'Diwali', wordType: 'noun' },
      { emoji: '☪️', label: 'Eid', phrase: 'Eid', wordType: 'noun' },
      { emoji: '🧧', label: 'Lunar New Year', phrase: 'Lunar New Year', wordType: 'noun' },
      { emoji: '🦃', label: 'Thanksgiving', phrase: 'Thanksgiving', wordType: 'noun' },
      { emoji: '🐣', label: 'Easter', phrase: 'Easter', wordType: 'noun' },
      { emoji: '🎆', label: 'Fourth of July', phrase: 'Fourth of July', wordType: 'noun' },
      { emoji: '🌺', label: 'Kwanzaa', phrase: 'Kwanzaa', wordType: 'noun' },
      { emoji: '🎆', label: 'New Year', phrase: 'New Year', wordType: 'noun' },
      { emoji: '💚', label: "St. Patrick's Day", phrase: "St. Patrick's Day", wordType: 'noun' },
      { emoji: '❤️', label: "Valentine's Day", phrase: "Valentine's Day", wordType: 'noun' },
      { emoji: '🎪', label: 'Festival', phrase: 'Festival', wordType: 'noun' },
      { emoji: '🎤', label: 'Concert', phrase: 'Concert', wordType: 'noun' },
      { emoji: '🎪', label: 'Carnival', phrase: 'Carnival', wordType: 'noun' },
      { emoji: '🌙', label: 'Ramadan', phrase: 'Ramadan', wordType: 'noun' },
      { emoji: '🍷', label: 'Passover', phrase: 'Passover', wordType: 'noun' },
      { emoji: '💀', label: 'Día de los Muertos', phrase: 'Día de los Muertos', wordType: 'noun' },
      { emoji: '👑', label: 'Quinceañera', phrase: 'Quinceañera', wordType: 'noun' },
      { emoji: '🎨', label: 'Holi', phrase: 'Holi', wordType: 'noun' },
      { emoji: '🎓', label: 'Graduation', phrase: 'Graduation', wordType: 'noun' },
      { emoji: '💒', label: 'Wedding', phrase: 'Wedding', wordType: 'noun' },
      { emoji: '👶', label: 'Baby Shower', phrase: 'Baby shower', wordType: 'noun' },
    ],
  },

  // ═══ SOCIAL (expanded with greetings & phrases sub-boards) ═══
  {
    id: 'social', name: 'Social', emoji: '💬', parentId: 'home',
    items: [
      { emoji: '👨‍👩‍👧‍👦', label: 'Family', category: 'family' },
      { emoji: '🏘️', label: 'Community', category: 'community' },
      { emoji: '❓', label: 'Questions', category: 'questions' },
      { emoji: '👋', label: 'Greetings', category: 'social_greetings' },
      { emoji: '💬', label: 'Social Phrases', category: 'social_phrases' },
      { emoji: '👫', label: 'Friend', phrase: 'Play with me', wordType: 'social' },
      { emoji: '👩‍🏫', label: 'Teacher', phrase: 'Teacher', wordType: 'noun' },
      { emoji: '💬', label: 'Talk', phrase: 'I want to talk', wordType: 'verb' },
      { emoji: '🙅', label: 'Leave Me Alone', phrase: 'Leave me alone please', wordType: 'social' },
      { emoji: '🧍', label: 'Come Here', phrase: 'Come here', wordType: 'social' },
      { emoji: '🚫', label: 'Go Away', phrase: 'Go away please', wordType: 'social' },
      { emoji: '👏', label: 'Good Job', phrase: 'Good job!', wordType: 'social' },
      { emoji: '↔️', label: 'Share', phrase: 'Share please', wordType: 'verb' },
      { emoji: '🔄', label: 'Take Turns', phrase: "Let's take turns", wordType: 'verb' },
      { emoji: '🙌', label: 'High Five', phrase: 'High five!', wordType: 'social' },
      { emoji: '👊', label: 'Fist Bump', phrase: 'Fist bump', wordType: 'social' },
      { emoji: '😔', label: 'Sorry', phrase: "I'm sorry", wordType: 'social' },
      { emoji: '🙋', label: 'Excuse Me', phrase: 'Excuse me', wordType: 'social' },
      { emoji: '🙂', label: "You're Welcome", phrase: "You're welcome", wordType: 'social' },
      { emoji: '🤷', label: "I Don't Know", phrase: "I don't know", wordType: 'social' },
      { emoji: '👀', label: 'Watch Me', phrase: 'Watch me', wordType: 'social' },
      { emoji: '👆', label: 'Look At This', phrase: 'Look at this', wordType: 'social' },
      { emoji: '😂', label: "That's Funny", phrase: "That's funny", wordType: 'social' },
      { emoji: '😤', label: 'Not Fair', phrase: "That's not fair", wordType: 'social' },
      { emoji: '💨', label: 'I Need Space', phrase: 'I need space', wordType: 'social' },
      { emoji: '⏳', label: 'Wait Your Turn', phrase: 'Wait your turn', wordType: 'social' },
    ],
  },

  // ═══ FAMILY (expanded to 31 items) ═══
  {
    id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦', parentId: 'social',
    items: [
      { emoji: '👩', label: 'Mom', phrase: 'Mommy', wordType: 'noun' },
      { emoji: '👨', label: 'Dad', phrase: 'Daddy', wordType: 'noun' },
      { emoji: '👧', label: 'Sister', phrase: 'Sister', wordType: 'noun' },
      { emoji: '👦', label: 'Brother', phrase: 'Brother', wordType: 'noun' },
      { emoji: '👵', label: 'Grandma', phrase: 'Grandma', wordType: 'noun' },
      { emoji: '👴', label: 'Grandpa', phrase: 'Grandpa', wordType: 'noun' },
      { emoji: '👶', label: 'Baby', phrase: 'Baby', wordType: 'noun' },
      { emoji: '🧑', label: 'Cousin', phrase: 'Cousin', wordType: 'noun' },
      { emoji: '👩', label: 'Aunt', phrase: 'Aunt', wordType: 'noun' },
      { emoji: '👨', label: 'Uncle', phrase: 'Uncle', wordType: 'noun' },
      { emoji: '👩‍🦳', label: 'Great Grandma', phrase: 'Great grandma', wordType: 'noun' },
      { emoji: '👨‍🦳', label: 'Great Grandpa', phrase: 'Great grandpa', wordType: 'noun' },
      { emoji: '👩', label: 'Stepmom', phrase: 'Stepmom', wordType: 'noun' },
      { emoji: '👨', label: 'Stepdad', phrase: 'Stepdad', wordType: 'noun' },
      { emoji: '👧', label: 'Stepsister', phrase: 'Stepsister', wordType: 'noun' },
      { emoji: '👦', label: 'Stepbrother', phrase: 'Stepbrother', wordType: 'noun' },
      { emoji: '👩', label: 'Godmother', phrase: 'Godmother', wordType: 'noun' },
      { emoji: '👨', label: 'Godfather', phrase: 'Godfather', wordType: 'noun' },
      { emoji: '👯', label: 'Twin', phrase: 'My twin', wordType: 'noun' },
      { emoji: '👧', label: 'Niece', phrase: 'Niece', wordType: 'noun' },
      { emoji: '👦', label: 'Nephew', phrase: 'Nephew', wordType: 'noun' },
      { emoji: '🍼', label: 'Babysitter', phrase: 'My babysitter', wordType: 'noun' },
      { emoji: '👪', label: 'Family', phrase: 'My family', wordType: 'noun' },
      { emoji: '🏡', label: "Grandma's House", phrase: "Grandma's house", wordType: 'noun' },
      { emoji: '👵', label: 'Abuela', phrase: 'Abuela', wordType: 'noun' },
      { emoji: '👴', label: 'Abuelo', phrase: 'Abuelo', wordType: 'noun' },
      { emoji: '👩', label: 'Mami', phrase: 'Mami', wordType: 'noun' },
      { emoji: '👨', label: 'Papi', phrase: 'Papi', wordType: 'noun' },
      { emoji: '🏠', label: 'Foster Parent', phrase: 'My foster parent', wordType: 'noun' },
      { emoji: '🧑', label: 'Caregiver', phrase: 'My caregiver', wordType: 'noun' },
    ],
  },

  // ═══ COMMUNITY (expanded to 20 items) ═══
  {
    id: 'community', name: 'Community', emoji: '🏘️', parentId: 'social',
    items: [
      { emoji: '🧑‍⚕️', label: 'Doctor', phrase: 'Doctor', wordType: 'noun' },
      { emoji: '👮', label: 'Police', phrase: 'Police officer', wordType: 'noun' },
      { emoji: '🧑‍🚒', label: 'Firefighter', phrase: 'Firefighter', wordType: 'noun' },
      { emoji: '🧑‍🏫', label: 'Teacher', phrase: 'Teacher', wordType: 'noun' },
      { emoji: '🧑‍🍳', label: 'Chef', phrase: 'Chef', wordType: 'noun' },
      { emoji: '📬', label: 'Mail Carrier', phrase: 'Mail carrier', wordType: 'noun' },
      { emoji: '🧑‍🔧', label: 'Mechanic', phrase: 'Mechanic', wordType: 'noun' },
      { emoji: '🧑‍🌾', label: 'Farmer', phrase: 'Farmer', wordType: 'noun' },
      { emoji: '🧑‍⚕️', label: 'Nurse', phrase: 'Nurse', wordType: 'noun' },
      { emoji: '🧑‍✈️', label: 'Pilot', phrase: 'Pilot', wordType: 'noun' },
      { emoji: '👷', label: 'Builder', phrase: 'Builder', wordType: 'noun' },
      { emoji: '🧑‍🎨', label: 'Artist', phrase: 'Artist', wordType: 'noun' },
      { emoji: '🧑‍💼', label: 'Principal', phrase: 'Principal', wordType: 'noun' },
      { emoji: '🧑‍💼', label: 'Boss', phrase: 'Boss', wordType: 'noun' },
      { emoji: '🧑‍🔬', label: 'Scientist', phrase: 'Scientist', wordType: 'noun' },
      { emoji: '🧑‍🚀', label: 'Astronaut', phrase: 'Astronaut', wordType: 'noun' },
      { emoji: '🧑‍⚖️', label: 'Judge', phrase: 'Judge', wordType: 'noun' },
      { emoji: '🧑‍🎤', label: 'Singer', phrase: 'Singer', wordType: 'noun' },
      { emoji: '🧑‍🏫', label: 'Coach', phrase: 'Coach', wordType: 'noun' },
      { emoji: '🧑‍⚕️', label: 'Therapist', phrase: 'Therapist', wordType: 'noun' },
    ],
  },

  // ═══ QUESTIONS (new subcategory) ═══
  {
    id: 'questions', name: 'Questions', emoji: '❓', parentId: 'social',
    items: [
      { emoji: '🤷', label: 'What', phrase: 'What', wordType: 'pronoun' },
      { emoji: '🗺️', label: 'Where', phrase: 'Where', wordType: 'pronoun' },
      { emoji: '📅', label: 'When', phrase: 'When', wordType: 'pronoun' },
      { emoji: '🧑', label: 'Who', phrase: 'Who', wordType: 'pronoun' },
      { emoji: '💭', label: 'Why', phrase: 'Why', wordType: 'pronoun' },
      { emoji: '⚙️', label: 'How', phrase: 'How', wordType: 'pronoun' },
      { emoji: '🔢', label: 'How Many', phrase: 'How many', wordType: 'pronoun' },
      { emoji: '🎁', label: 'What Is It', phrase: 'What is it', wordType: 'social' },
      { emoji: '🔍', label: 'Where Is It', phrase: 'Where is it', wordType: 'social' },
      { emoji: '🕐', label: 'What Time', phrase: 'What time is it', wordType: 'social' },
      { emoji: '🙋', label: 'Can I', phrase: 'Can I', wordType: 'social' },
      { emoji: '⚖️', label: 'Is It', phrase: 'Is it', wordType: 'social' },
    ],
  },

  // ═══ GREETINGS ═══
  {
    id: 'social_greetings', name: 'Greetings', emoji: '👋', parentId: 'social',
    items: [
      { emoji: '🤗', label: 'Hello', phrase: 'Hello!', wordType: 'social' },
      { emoji: '✋', label: 'Hi', phrase: 'Hi!', wordType: 'social' },
      { emoji: '🌅', label: 'Good Morning', phrase: 'Good morning', wordType: 'social' },
      { emoji: '🌤️', label: 'Good Afternoon', phrase: 'Good afternoon', wordType: 'social' },
      { emoji: '🌃', label: 'Good Night', phrase: 'Good night', wordType: 'social' },
      { emoji: '🚪', label: 'Goodbye', phrase: 'Goodbye', wordType: 'social' },
      { emoji: '👀', label: 'See You Later', phrase: 'See you later', wordType: 'social' },
      { emoji: '🤗', label: 'Nice To Meet You', phrase: 'Nice to meet you', wordType: 'social' },
      { emoji: '😊', label: 'How Are You', phrase: 'How are you?', wordType: 'social' },
      { emoji: '😊', label: 'I Am Good', phrase: 'I am good', wordType: 'social' },
      { emoji: '🤧', label: 'Bless You', phrase: 'Bless you', wordType: 'social' },
      { emoji: '👋', label: 'Hola', phrase: 'Hola', wordType: 'social' },
      { emoji: '🤲', label: 'Salaam', phrase: 'Salaam', wordType: 'social' },
      { emoji: '🙏', label: 'Namaste', phrase: 'Namaste', wordType: 'social' },
      { emoji: '✡️', label: 'Shalom', phrase: 'Shalom', wordType: 'social' },
      { emoji: '🏠', label: 'Welcome', phrase: 'Welcome', wordType: 'social' },
    ],
  },

  // ═══ SOCIAL PHRASES ═══
  {
    id: 'social_phrases', name: 'Social Phrases', emoji: '💬', parentId: 'social',
    items: [
      { emoji: '🤲', label: 'Please', phrase: 'Please', wordType: 'social' },
      { emoji: '💛', label: 'Thank You', phrase: 'Thank you', wordType: 'social' },
      { emoji: '😔', label: 'Sorry', phrase: 'I am sorry', wordType: 'social' },
      { emoji: '👍', label: 'OK', phrase: 'OK', wordType: 'social' },
      { emoji: '✅', label: 'Yes Please', phrase: 'Yes please', wordType: 'social' },
      { emoji: '❌', label: 'No Thank You', phrase: 'No thank you', wordType: 'social' },
      { emoji: '🤝', label: 'Can I Play', phrase: 'Can I play?', wordType: 'social' },
      { emoji: '💬', label: 'My Turn', phrase: 'It is my turn', wordType: 'social' },
      { emoji: '🔄', label: 'Your Turn', phrase: 'It is your turn', wordType: 'social' },
      { emoji: '🤝', label: 'Want To Share', phrase: 'Do you want to share?', wordType: 'social' },
      { emoji: '🤗', label: 'I Like You', phrase: 'I like you', wordType: 'social' },
      { emoji: '🙅', label: 'Leave Me Alone', phrase: 'Leave me alone please', wordType: 'social' },
      { emoji: '🧍', label: 'Come Here', phrase: 'Come here', wordType: 'social' },
      { emoji: '↗️', label: 'Go Away', phrase: 'Go away please', wordType: 'social' },
      { emoji: '👏', label: 'Good Job', phrase: 'Good job!', wordType: 'social' },
      { emoji: '❓', label: 'What Happened', phrase: 'What happened?', wordType: 'social' },
      { emoji: '🤷', label: 'I Dont Know', phrase: 'I do not know', wordType: 'social' },
      { emoji: '💡', label: 'I Have Idea', phrase: 'I have an idea', wordType: 'social' },
      { emoji: '😤', label: 'Thats Not Fair', phrase: 'That is not fair', wordType: 'social' },
      { emoji: '😊', label: 'Thats Funny', phrase: 'That is funny', wordType: 'social' },
      { emoji: '😶', label: 'Im Embarrassed', phrase: 'I am embarrassed', wordType: 'social' },
      { emoji: '🤫', label: 'Its A Secret', phrase: 'It is a secret', wordType: 'social' },
      { emoji: '😢', label: 'I Miss You', phrase: 'I miss you', wordType: 'social' },
      { emoji: '❤️', label: 'I Love You', phrase: 'I love you', wordType: 'social' },
      { emoji: '🤞', label: 'I Promise', phrase: 'I promise', wordType: 'social' },
      { emoji: '👀', label: 'Look At This', phrase: 'Look at this', wordType: 'social' },
      { emoji: '🙋', label: 'I Want', phrase: 'I want', wordType: 'social' },
      { emoji: '🤚', label: 'I Need', phrase: 'I need', wordType: 'social' },
      { emoji: '🙋', label: 'Can I Have', phrase: 'Can I have', wordType: 'social' },
      { emoji: '💬', label: 'Tell Me', phrase: 'Tell me', wordType: 'social' },
      { emoji: '📖', label: 'Read To Me', phrase: 'Read to me', wordType: 'social' },
      { emoji: '🎵', label: 'Sing To Me', phrase: 'Sing to me', wordType: 'social' },
      { emoji: '🤝', label: 'Help Me', phrase: 'Help me please', wordType: 'social' },
      { emoji: '😊', label: 'I Am Happy', phrase: 'I am happy', wordType: 'social' },
      { emoji: '😢', label: 'I Am Sad', phrase: 'I am sad', wordType: 'social' },
      { emoji: '😠', label: 'I Am Mad', phrase: 'I am mad', wordType: 'social' },
      { emoji: '😨', label: 'I Am Scared', phrase: 'I am scared', wordType: 'social' },
    ],
  },

  // ═══ BODY (expanded with body parts & health sub-boards) ═══
  {
    id: 'body', name: 'Body', emoji: '🛁', parentId: 'home',
    items: [
      { emoji: '🧼', label: 'Hygiene', category: 'hygiene' },
      { emoji: '🏥', label: 'Medical', category: 'medical' },
      { emoji: '🦴', label: 'Body Parts', category: 'body_parts' },
      { emoji: '🏥', label: 'Health', category: 'body_health' },
      { emoji: '🚻', label: 'Bathroom', phrase: 'I need the bathroom', wordType: 'noun' },
      { emoji: '🤒', label: 'Sick', phrase: 'I feel sick', wordType: 'descriptor' },
      { emoji: '🤕', label: 'Hurt', phrase: 'I am hurt', wordType: 'descriptor' },
      { emoji: '😪', label: 'Sleepy', phrase: 'I am sleepy', wordType: 'descriptor' },
      { emoji: '🌡️', label: 'Hot', phrase: 'I am hot', wordType: 'descriptor' },
      { emoji: '🥶', label: 'Cold', phrase: 'I am cold', wordType: 'descriptor' },
      { emoji: '🧼', label: 'Wash Hands', phrase: 'Wash my hands', wordType: 'verb', arasaacId: 8975 },
      { emoji: '😁', label: 'Brush Teeth', phrase: 'Brush teeth', wordType: 'verb', arasaacId: 2694 },
      { emoji: '👔', label: 'Change Clothes', phrase: 'Change my clothes', wordType: 'verb' },
      { emoji: '🍽️', label: 'Hungry', phrase: "I'm hungry", wordType: 'descriptor' },
      { emoji: '💧', label: 'Thirsty', phrase: "I'm thirsty", wordType: 'descriptor' },
    ],
  },

  // ═══ HYGIENE (new subcategory) ═══
  {
    id: 'hygiene', name: 'Hygiene', emoji: '🧼', parentId: 'body',
    items: [
      { emoji: '🧼', label: 'Wash Hands', phrase: 'Wash my hands', wordType: 'verb', arasaacId: 8975 },
      { emoji: '😁', label: 'Brush Teeth', phrase: 'Brush my teeth', wordType: 'verb', arasaacId: 2694 },
      { emoji: '🛁', label: 'Bath', phrase: 'Take a bath', wordType: 'noun', arasaacId: 2272 },
      { emoji: '🚿', label: 'Shower', phrase: 'Take a shower', wordType: 'noun' },
      { emoji: '🧴', label: 'Lotion', phrase: 'Put on lotion', wordType: 'noun' },
      { emoji: '🧽', label: 'Wash Face', phrase: 'Wash my face', wordType: 'verb', arasaacId: 8975 },
      { emoji: '💇', label: 'Hair', phrase: 'Brush my hair', wordType: 'verb', arasaacId: 2695 },
      { emoji: '🧻', label: 'Tissue', phrase: 'I need a tissue', wordType: 'noun' },
      { emoji: '👔', label: 'Change Clothes', phrase: 'Change my clothes', wordType: 'verb' },
      { emoji: '🩹', label: 'Band-Aid', phrase: 'I need a band-aid', wordType: 'noun' },
      { emoji: '💅', label: 'Nails', phrase: 'Cut my nails', wordType: 'noun', arasaacId: 2783 },
      { emoji: '🤧', label: 'Blow Nose', phrase: 'Blow my nose', wordType: 'verb' },
    ],
  },

  // ═══ MEDICAL (new subcategory) ═══
  {
    id: 'medical', name: 'Medical', emoji: '🏥', parentId: 'body',
    items: [
      { emoji: '🩺', label: 'Doctor', phrase: 'I need the doctor', wordType: 'noun' },
      { emoji: '💊', label: 'Medicine', phrase: 'I need my medicine', wordType: 'noun' },
      { emoji: '🤒', label: 'Fever', phrase: 'I have a fever', wordType: 'noun' },
      { emoji: '🩹', label: 'Band-Aid', phrase: 'I need a band-aid', wordType: 'noun' },
      { emoji: '🤒', label: 'Cold', phrase: 'I have a cold', wordType: 'noun' },
      { emoji: '🤮', label: 'Throw Up', phrase: 'I think I will throw up', wordType: 'verb' },
      { emoji: '😵‍💫', label: 'Dizzy', phrase: 'I feel dizzy', wordType: 'descriptor' },
      { emoji: '💢', label: 'Bone Hurts', phrase: 'My bone hurts', wordType: 'noun' },
      { emoji: '🩺', label: 'Check Up', phrase: 'I have a check up', wordType: 'noun' },
      { emoji: '💉', label: 'Shot', phrase: 'I am scared of the shot', wordType: 'noun' },
      { emoji: '😣', label: 'Hard To Breathe', phrase: 'It is hard to breathe', wordType: 'descriptor' },
      { emoji: '🤧', label: 'Allergic', phrase: 'Allergic reaction', wordType: 'noun' },
      { emoji: '⚡', label: 'Seizure', phrase: "I'm having a seizure", wordType: 'noun' },
      { emoji: '💨', label: 'Inhaler', phrase: 'I need my inhaler', wordType: 'noun' },
      { emoji: '♿', label: 'Wheelchair', phrase: 'My wheelchair', wordType: 'noun' },
      { emoji: '👓', label: 'Glasses', phrase: 'My glasses', wordType: 'noun' },
      { emoji: '👂', label: 'Hearing Aid', phrase: 'My hearing aid', wordType: 'noun' },
      { emoji: '🩺', label: 'Feeding Tube', phrase: 'My feeding tube', wordType: 'noun' },
      { emoji: '💨', label: 'Oxygen', phrase: 'I need oxygen', wordType: 'noun' },
    ],
  },

  // ═══ BODY PARTS (26 items) ═══
  {
    id: 'body_parts', name: 'Body Parts', emoji: '🦴', parentId: 'body',
    items: [
      { emoji: '😶', label: 'Head', phrase: 'Head', wordType: 'noun' },
      { emoji: '👀', label: 'Eyes', phrase: 'Eyes', wordType: 'noun' },
      { emoji: '👂', label: 'Ears', phrase: 'Ears', wordType: 'noun' },
      { emoji: '👃', label: 'Nose', phrase: 'Nose', wordType: 'noun' },
      { emoji: '👄', label: 'Mouth', phrase: 'Mouth', wordType: 'noun' },
      { emoji: '🦷', label: 'Teeth', phrase: 'Teeth', wordType: 'noun' },
      { emoji: '👅', label: 'Tongue', phrase: 'Tongue', wordType: 'noun' },
      { emoji: '❤️', label: 'Chest', phrase: 'Chest', wordType: 'noun' },
      { emoji: '🤢', label: 'Tummy', phrase: 'Tummy', wordType: 'noun' },
      { emoji: '💪', label: 'Arm', phrase: 'Arm', wordType: 'noun' },
      { emoji: '✋', label: 'Hand', phrase: 'Hand', wordType: 'noun' },
      { emoji: '🖐️', label: 'Fingers', phrase: 'Fingers', wordType: 'noun' },
      { emoji: '🦵', label: 'Leg', phrase: 'Leg', wordType: 'noun' },
      { emoji: '🦶', label: 'Foot', phrase: 'Foot', wordType: 'noun' },
      { emoji: '👣', label: 'Toes', phrase: 'Toes', wordType: 'noun' },
      { emoji: '👤', label: 'Back', phrase: 'Back', wordType: 'noun' },
      { emoji: '❤️', label: 'Heart', phrase: 'Heart', wordType: 'noun' },
      { emoji: '🧠', label: 'Brain', phrase: 'Brain', wordType: 'noun' },
      { emoji: '💨', label: 'Lungs', phrase: 'Lungs', wordType: 'noun' },
      { emoji: '💈', label: 'Hair', phrase: 'Hair', wordType: 'noun' },
      { emoji: '🦴', label: 'Bones', phrase: 'Bones', wordType: 'noun' },
      { emoji: '🩸', label: 'Blood', phrase: 'Blood', wordType: 'noun' },
      { emoji: '😶', label: 'Chin', phrase: 'Chin', wordType: 'noun' },
      { emoji: '🧑', label: 'Neck', phrase: 'Neck', wordType: 'noun' },
      { emoji: '💪', label: 'Elbow', phrase: 'Elbow', wordType: 'noun' },
      { emoji: '🦵', label: 'Knee', phrase: 'Knee', wordType: 'noun' },
      { emoji: '🩳', label: 'Penis', phrase: 'Penis', wordType: 'noun' },
      { emoji: '🩳', label: 'Vagina', phrase: 'Vagina', wordType: 'noun' },
      { emoji: '💧', label: 'bottom', phrase: 'bottom', wordType: 'noun', arasaacId: -1 },
      { emoji: '💔', label: 'Bottom Hurts', phrase: 'My bottom hurts', wordType: 'descriptor' },
      { emoji: '🔒', label: 'Private Parts', phrase: 'Private parts', wordType: 'noun' },
      { emoji: '😫', label: 'My Private Parts Hurt', phrase: 'My private parts hurt', wordType: 'descriptor' },
    ],
  },

  // ═══ HEALTH (27 items) ═══
  {
    id: 'body_health', name: 'Health', emoji: '🏥', parentId: 'body',
    items: [
      { emoji: '🤒', label: 'Fever', phrase: 'I have a fever', wordType: 'noun' },
      { emoji: '🤒', label: 'Cold', phrase: 'I have a cold', wordType: 'noun' },
      { emoji: '🤮', label: 'Throw Up', phrase: 'I think I will throw up', wordType: 'verb' },
      { emoji: '🤕', label: 'Headache', phrase: 'I have a headache', wordType: 'noun' },
      { emoji: '🤢', label: 'Stomach Ache', phrase: 'My stomach hurts', wordType: 'noun' },
      { emoji: '😵‍💫', label: 'Dizzy', phrase: 'I feel dizzy', wordType: 'descriptor' },
      { emoji: '😣', label: 'Hard To Breathe', phrase: 'It is hard to breathe', wordType: 'descriptor' },
      { emoji: '🩹', label: 'Band-Aid', phrase: 'I need a band-aid', wordType: 'noun' },
      { emoji: '💊', label: 'Medicine', phrase: 'I need my medicine', wordType: 'noun' },
      { emoji: '🩺', label: 'Doctor', phrase: 'I need the doctor', wordType: 'noun' },
      { emoji: '🩺', label: 'Check Up', phrase: 'I have a check up', wordType: 'noun' },
      { emoji: '💉', label: 'Shot', phrase: 'I am scared of the shot', wordType: 'noun' },
      { emoji: '🤕', label: 'Hurt', phrase: 'I am hurt', wordType: 'descriptor' },
      { emoji: '💢', label: 'Bone Hurts', phrase: 'My bone hurts', wordType: 'noun' },
      { emoji: '🤧', label: 'Sneeze', phrase: 'I need to sneeze', wordType: 'verb' },
      { emoji: '😮‍💨', label: 'Cough', phrase: 'I have a cough', wordType: 'noun' },
      { emoji: '🩸', label: 'Bleeding', phrase: 'I am bleeding', wordType: 'descriptor' },
      { emoji: '😩', label: 'Tired', phrase: 'I am tired', wordType: 'descriptor' },
      { emoji: '🌡️', label: 'Too Hot', phrase: 'I am too hot', wordType: 'descriptor' },
      { emoji: '🥶', label: 'Too Cold', phrase: 'I am too cold', wordType: 'descriptor' },
      { emoji: '🤤', label: 'Hungry', phrase: 'I am hungry', wordType: 'descriptor' },
      { emoji: '💧', label: 'Thirsty', phrase: 'I am thirsty', wordType: 'descriptor' },
      { emoji: '🦷', label: 'Toothache', phrase: 'My tooth hurts', wordType: 'noun' },
      { emoji: '👂', label: 'Ear Ache', phrase: 'My ear hurts', wordType: 'noun' },
      { emoji: '👀', label: 'Eyes Hurt', phrase: 'My eyes hurt', wordType: 'noun' },
      { emoji: '😣', label: 'Sore Throat', phrase: 'My throat hurts', wordType: 'noun' },
      { emoji: '🤧', label: 'Runny Nose', phrase: 'My nose is running', wordType: 'noun' },
      { emoji: '🤕', label: 'Headache', phrase: 'I have a headache', wordType: 'noun' },
      { emoji: '👂', label: 'Earache', phrase: 'My ear hurts', wordType: 'noun' },
      { emoji: '🦷', label: 'Toothache', phrase: 'My tooth hurts', wordType: 'noun' },
      { emoji: '🔴', label: 'Rash', phrase: 'I have a rash', wordType: 'noun' },
      { emoji: '😣', label: 'Itch', phrase: 'It itches', wordType: 'noun' },
      { emoji: '🤢', label: 'Nauseous', phrase: 'I feel nauseous', wordType: 'noun' },
    ],
  },

  // ═══ SCHOOL (with academic & supplies sub-boards) ═══
  {
    id: 'school', name: 'School', emoji: '🏫', parentId: 'home',
    items: [
      { emoji: '📚', label: 'Academic', category: 'school_academic' },
      { emoji: '✏️', label: 'Supplies', category: 'school_supplies' },
      { emoji: '🤚', label: 'Raise Hand', phrase: 'I have a question', wordType: 'verb' },
      { emoji: '🚻', label: 'Bathroom', phrase: 'Bathroom break please', wordType: 'noun' },
      { emoji: '🍱', label: 'Lunch', phrase: 'Lunchtime', wordType: 'noun' },
      { emoji: '🏠', label: 'Go Home', phrase: 'I want to go home', wordType: 'verb' },
      { emoji: '😕', label: 'Do Not Understand', phrase: 'I do not understand', wordType: 'social' },
      { emoji: '🪑', label: 'Sit Down', phrase: 'Sit down', wordType: 'verb' },
      { emoji: '📥', label: 'Put Away', phrase: 'Put it away', wordType: 'verb' },
      { emoji: '👥', label: 'Partner', phrase: 'Work with a partner', wordType: 'noun' },
      { emoji: '⏸️', label: 'Break', phrase: 'I need a break', wordType: 'social' },
      { emoji: '🚶', label: 'Line Up', phrase: 'Time to line up', wordType: 'verb' },
      { emoji: '🤫', label: 'Be Quiet', phrase: 'Be quiet please', wordType: 'verb' },
      { emoji: '🧹', label: 'Clean Up', phrase: 'Time to clean up', wordType: 'verb' },
      { emoji: '⭕', label: 'Circle Time', phrase: 'Circle time', wordType: 'noun' },
      { emoji: '🧘', label: 'Sensory Break', phrase: 'I need a sensory break', wordType: 'noun' },
      { emoji: '😌', label: 'Calm Corner', phrase: 'I need the calm corner', wordType: 'noun' },
      { emoji: '➡️', label: 'First Then', phrase: 'First, then', wordType: 'social' },
      { emoji: '⭐', label: 'Token Board', phrase: 'Token board', wordType: 'noun' },
      { emoji: '📋', label: 'Visual Schedule', phrase: 'Visual schedule', wordType: 'noun' },
      { emoji: '📋', label: 'Choice Board', phrase: 'Choice board', wordType: 'noun' },
    ],
  },

  // ═══ SCHOOL ACADEMIC (16 items) ═══
  {
    id: 'school_academic', name: 'Academic', emoji: '📚', parentId: 'school',
    items: [
      { emoji: '📖', label: 'Reading', phrase: 'Time to read', wordType: 'noun' },
      { emoji: '➕', label: 'Math', phrase: 'Do math', wordType: 'noun' },
      { emoji: '🖊️', label: 'Writing', phrase: 'Write', wordType: 'noun' },
      { emoji: '🎨', label: 'Art', phrase: 'Art class', wordType: 'noun' },
      { emoji: '🎵', label: 'Music Class', phrase: 'Music class', wordType: 'noun' },
      { emoji: '🏃', label: 'Gym', phrase: 'Gym class', wordType: 'noun' },
      { emoji: '🔬', label: 'Science', phrase: 'Science class', wordType: 'noun' },
      { emoji: '🌎', label: 'Social Studies', phrase: 'Social studies', wordType: 'noun' },
      { emoji: '🔢', label: 'Numbers', phrase: 'Count the numbers', wordType: 'noun' },
      { emoji: '🗓️', label: 'Calendar', phrase: 'Calendar time', wordType: 'noun' },
      { emoji: '🖥️', label: 'Computer', phrase: 'Computer time', wordType: 'noun' },
      { emoji: '🧪', label: 'Experiment', phrase: 'Do an experiment', wordType: 'noun' },
      { emoji: '💬', label: 'Speech', phrase: 'Speech class', wordType: 'noun' },
      { emoji: '📝', label: 'Test', phrase: 'I have a test', wordType: 'noun' },
      { emoji: '📋', label: 'Homework', phrase: 'Do my homework', wordType: 'noun' },
      { emoji: '👥', label: 'Assembly', phrase: 'Go to assembly', wordType: 'noun' },
    ],
  },

  // ═══ SCHOOL SUPPLIES (14 items) ═══
  {
    id: 'school_supplies', name: 'Supplies', emoji: '✏️', parentId: 'school',
    items: [
      { emoji: '✏️', label: 'Pencil', phrase: 'I need a pencil', wordType: 'noun' },
      { emoji: '🖊️', label: 'Pen', phrase: 'I need a pen', wordType: 'noun' },
      { emoji: '📐', label: 'Ruler', phrase: 'I need a ruler', wordType: 'noun' },
      { emoji: '✂️', label: 'Scissors', phrase: 'I need scissors', wordType: 'noun' },
      { emoji: '📒', label: 'Notebook', phrase: 'I need my notebook', wordType: 'noun' },
      { emoji: '🎒', label: 'Backpack', phrase: 'Get my backpack', wordType: 'noun' },
      { emoji: '📚', label: 'Book', phrase: 'I need my book', wordType: 'noun' },
      { emoji: '🖍️', label: 'Crayons', phrase: 'I need crayons', wordType: 'noun' },
      { emoji: '🖌️', label: 'Paint Brush', phrase: 'I need a paint brush', wordType: 'noun' },
      { emoji: '📎', label: 'Paper Clip', phrase: 'I need a paper clip', wordType: 'noun' },
      { emoji: '📄', label: 'Paper', phrase: 'I need paper', wordType: 'noun' },
      { emoji: '🗂️', label: 'Folder', phrase: 'I need my folder', wordType: 'noun' },
      { emoji: '🧴', label: 'Glue', phrase: 'I need glue', wordType: 'noun' },
      { emoji: '📝', label: 'Eraser', phrase: 'I need an eraser', wordType: 'noun' },
    ],
  },

  // ═══ BEDTIME (copied from prototype) ═══
  {
    id: 'bedtime', name: 'Bedtime', emoji: '🌙', parentId: 'home',
    items: [
      { emoji: '😴', label: 'Sleepy', phrase: 'I am sleepy', wordType: 'descriptor' },
      { emoji: '😁', label: 'Brush Teeth', phrase: 'Brush teeth', wordType: 'verb', arasaacId: 2694 },
      { emoji: '🛁', label: 'Bath', phrase: 'Bath time', wordType: 'noun', arasaacId: 2272 },
      { emoji: '📖', label: 'Story', phrase: 'Read me a story', wordType: 'noun' },
      { emoji: '🌃', label: 'Goodnight', phrase: 'Goodnight', wordType: 'social' },
      { emoji: '🤗', label: 'Hug', phrase: 'I want a hug', wordType: 'social' },
      { emoji: '🌑', label: 'Light Off', phrase: 'Turn off the light', wordType: 'verb' },
      { emoji: '🕯️', label: 'Night Light', phrase: 'I want the night light', wordType: 'noun' },
      { emoji: '😟', label: 'Scared', phrase: 'I am scared', wordType: 'descriptor' },
      { emoji: '🥤', label: 'Water', phrase: 'I want water', wordType: 'noun' },
      { emoji: '🧸', label: 'Stuffed Animal', phrase: 'I want my stuffed animal', wordType: 'noun' },
      { emoji: '🎶', label: 'Music', phrase: 'Play music', wordType: 'noun' },
      { emoji: '🛏️', label: 'Bed', phrase: 'Go to bed', wordType: 'noun' },
      { emoji: '👕', label: 'Pajamas', phrase: 'Put on pajamas', wordType: 'noun' },
      { emoji: '🛏️', label: 'Blanket', phrase: 'I want my blanket', wordType: 'noun' },
      { emoji: '🚪', label: 'Door Open', phrase: 'Leave the door open', wordType: 'verb' },
    ],
  },

  // ═══ ANIMALS (with pets sub-board) ═══
  {
    id: 'animals', name: 'Animals', emoji: '🐾', parentId: 'home',
    items: [
      { emoji: '🐾', label: 'Pets', category: 'pets' },
      { emoji: '🐕', label: 'Dog', phrase: 'Dog', wordType: 'noun' },
      { emoji: '🐱', label: 'Cat', phrase: 'Cat', wordType: 'noun' },
      { emoji: '🐟', label: 'Fish', phrase: 'Fish', wordType: 'noun' },
      { emoji: '🐦', label: 'Bird', phrase: 'Bird', wordType: 'noun' },
      { emoji: '🐰', label: 'Bunny', phrase: 'Bunny', wordType: 'noun' },
      { emoji: '🐹', label: 'Hamster', phrase: 'Hamster', wordType: 'noun' },
      { emoji: '🐴', label: 'Horse', phrase: 'Horse', wordType: 'noun' },
      { emoji: '🐄', label: 'Cow', phrase: 'Cow', wordType: 'noun' },
      { emoji: '🐷', label: 'Pig', phrase: 'Pig', wordType: 'noun' },
      { emoji: '🐑', label: 'Sheep', phrase: 'Sheep', wordType: 'noun' },
      { emoji: '🐔', label: 'Chicken', phrase: 'Chicken', wordType: 'noun' },
      { emoji: '🦁', label: 'Lion', phrase: 'Lion', wordType: 'noun' },
      { emoji: '🐘', label: 'Elephant', phrase: 'Elephant', wordType: 'noun' },
      { emoji: '🦒', label: 'Giraffe', phrase: 'Giraffe', wordType: 'noun' },
      { emoji: '🐻', label: 'Bear', phrase: 'Bear', wordType: 'noun' },
      { emoji: '🐒', label: 'Monkey', phrase: 'Monkey', wordType: 'noun' },
      { emoji: '🐍', label: 'Snake', phrase: 'Snake', wordType: 'noun' },
      { emoji: '🐢', label: 'Turtle', phrase: 'Turtle', wordType: 'noun' },
      { emoji: '🦋', label: 'Butterfly', phrase: 'Butterfly', wordType: 'noun' },
      { emoji: '🐸', label: 'Frog', phrase: 'Frog', wordType: 'noun' },
      { emoji: '🐬', label: 'Dolphin', phrase: 'Dolphin', wordType: 'noun' },
      { emoji: '🦈', label: 'Shark', phrase: 'Shark', wordType: 'noun' },
      { emoji: '🦆', label: 'Duck', phrase: 'Duck', wordType: 'noun' },
      { emoji: '🦜', label: 'Parrot', phrase: 'Parrot', wordType: 'noun' },
      { emoji: '🐧', label: 'Penguin', phrase: 'Penguin', wordType: 'noun' },
      { emoji: '🦊', label: 'Fox', phrase: 'Fox', wordType: 'noun' },
      { emoji: '🐼', label: 'Panda', phrase: 'Panda', wordType: 'noun' },
      { emoji: '🦄', label: 'Unicorn', phrase: 'Unicorn', wordType: 'noun' },
      { emoji: '🐝', label: 'Bee', phrase: 'Bee', wordType: 'noun' },
      { emoji: '🐞', label: 'Ladybug', phrase: 'Ladybug', wordType: 'noun' },
      { emoji: '🐯', label: 'Tiger', phrase: 'Tiger', wordType: 'noun' },
      { emoji: '🐪', label: 'Camel', phrase: 'Camel', wordType: 'noun' },
      { emoji: '🦘', label: 'Kangaroo', phrase: 'Kangaroo', wordType: 'noun' },
      { emoji: '🐊', label: 'Crocodile', phrase: 'Crocodile', wordType: 'noun' },
      { emoji: '🦩', label: 'Flamingo', phrase: 'Flamingo', wordType: 'noun' },
      { emoji: '🦚', label: 'Peacock', phrase: 'Peacock', wordType: 'noun' },
      { emoji: '🐙', label: 'Octopus', phrase: 'Octopus', wordType: 'noun' },
      { emoji: '🐳', label: 'Whale', phrase: 'Whale', wordType: 'noun' },
      { emoji: '🦌', label: 'Deer', phrase: 'Deer', wordType: 'noun' },
      { emoji: '🐺', label: 'Wolf', phrase: 'Wolf', wordType: 'noun' },
      { emoji: '🦉', label: 'Owl', phrase: 'Owl', wordType: 'noun' },
    ],
  },

  // ═══ PETS (15 items) ═══
  {
    id: 'pets', name: 'Pets', emoji: '🐾', parentId: 'animals',
    items: [
      { emoji: '🐕', label: 'Dog', phrase: 'My dog', wordType: 'noun' },
      { emoji: '🐱', label: 'Cat', phrase: 'My cat', wordType: 'noun' },
      { emoji: '🐟', label: 'Fish', phrase: 'My fish', wordType: 'noun' },
      { emoji: '🐦', label: 'Bird', phrase: 'My bird', wordType: 'noun' },
      { emoji: '🐹', label: 'Hamster', phrase: 'My hamster', wordType: 'noun' },
      { emoji: '🐰', label: 'Bunny', phrase: 'My bunny', wordType: 'noun' },
      { emoji: '🐢', label: 'Turtle', phrase: 'My turtle', wordType: 'noun' },
      { emoji: '🦎', label: 'Lizard', phrase: 'My lizard', wordType: 'noun' },
      { emoji: '🐍', label: 'Snake', phrase: 'My snake', wordType: 'noun' },
      { emoji: '🦜', label: 'Parrot', phrase: 'My parrot', wordType: 'noun' },
      { emoji: '🐕‍🦺', label: 'Service Dog', phrase: 'Service dog', wordType: 'noun' },
      { emoji: '🥣', label: 'Feed Pet', phrase: 'Feed my pet', wordType: 'verb' },
      { emoji: '💧', label: 'Water Pet', phrase: 'Give water to my pet', wordType: 'verb' },
      { emoji: '🦮', label: 'Walk Dog', phrase: 'Walk the dog', wordType: 'verb' },
      { emoji: '🐾', label: 'Pet', phrase: 'Pet my animal', wordType: 'verb' },
    ],
  },

  // ═══ PLACES (with sub-boards) ═══
  {
    id: 'places', name: 'Places', emoji: '🌍', parentId: 'home',
    items: [
      { emoji: '🏠', label: 'Home Places', category: 'places_home' },
      { emoji: '🏫', label: 'School Places', category: 'places_school' },
      { emoji: '🏘️', label: 'Community Places', category: 'places_community' },
      { emoji: '🛐', label: 'Worship', category: 'places_worship' },
      { emoji: '🏥', label: 'Hospital', phrase: 'Hospital', wordType: 'noun' },
      { emoji: '🏪', label: 'Store', phrase: 'Go to the store', wordType: 'noun' },
      { emoji: '🌳', label: 'Park', phrase: 'Go to the park', wordType: 'noun' },
      { emoji: '📚', label: 'Library', phrase: 'Go to the library', wordType: 'noun' },
      { emoji: '🏪', label: 'Restaurant', phrase: 'Go to a restaurant', wordType: 'noun' },
      { emoji: '🏖️', label: 'Beach', phrase: 'Go to the beach', wordType: 'noun' },
      { emoji: '🏊', label: 'Pool', phrase: 'Go to the pool', wordType: 'noun' },
      { emoji: '🎡', label: 'Amusement Park', phrase: 'Go to the amusement park', wordType: 'noun' },
      { emoji: '🐻', label: 'Zoo', phrase: 'Go to the zoo', wordType: 'noun' },
      { emoji: '🏬', label: 'Grocery Store', phrase: 'Go to the grocery store', wordType: 'noun' },
      { emoji: '🍕', label: 'Pizza Place', phrase: 'Go to the pizza place', wordType: 'noun' },
    ],
  },

  // ═══ PLACES: HOME (10 items) ═══
  {
    id: 'places_home', name: 'Home Places', emoji: '🏠', parentId: 'places',
    items: [
      { emoji: '🛏️', label: 'Bedroom', phrase: 'My bedroom', wordType: 'noun' },
      { emoji: '🛋️', label: 'Living Room', phrase: 'Living room', wordType: 'noun' },
      { emoji: '🍽️', label: 'Kitchen', phrase: 'Kitchen', wordType: 'noun' },
      { emoji: '🚿', label: 'Bathroom', phrase: 'Bathroom', wordType: 'noun' },
      { emoji: '🚪', label: 'Front Door', phrase: 'Front door', wordType: 'noun' },
      { emoji: '🏡', label: 'Backyard', phrase: 'Backyard', wordType: 'noun' },
      { emoji: '🏠', label: 'Garage', phrase: 'Garage', wordType: 'noun' },
      { emoji: '⬇️', label: 'Basement', phrase: 'Basement', wordType: 'noun' },
      { emoji: '🪑', label: 'Dining Room', phrase: 'Dining room', wordType: 'noun' },
      { emoji: '🧺', label: 'Laundry Room', phrase: 'Laundry room', wordType: 'noun' },
    ],
  },

  // ═══ PLACES: SCHOOL (14 items) ═══
  {
    id: 'places_school', name: 'School Places', emoji: '🏫', parentId: 'places',
    items: [
      { emoji: '📚', label: 'Classroom', phrase: 'Classroom', wordType: 'noun' },
      { emoji: '🍱', label: 'Cafeteria', phrase: 'Cafeteria', wordType: 'noun' },
      { emoji: '🏃', label: 'Gym', phrase: 'Gym', wordType: 'noun' },
      { emoji: '📖', label: 'Library', phrase: 'Library', wordType: 'noun' },
      { emoji: '🛝', label: 'Playground', phrase: 'Playground', wordType: 'noun' },
      { emoji: '🚻', label: 'Bathroom', phrase: 'Bathroom', wordType: 'noun' },
      { emoji: '🏫', label: 'Office', phrase: 'Office', wordType: 'noun' },
      { emoji: '🎵', label: 'Music Room', phrase: 'Music room', wordType: 'noun' },
      { emoji: '🎨', label: 'Art Room', phrase: 'Art room', wordType: 'noun' },
      { emoji: '🔬', label: 'Science Lab', phrase: 'Science lab', wordType: 'noun' },
      { emoji: '🚌', label: 'Bus Stop', phrase: 'Bus stop', wordType: 'noun' },
      { emoji: '🏥', label: 'Nurse Office', phrase: 'Nurse office', wordType: 'noun' },
      { emoji: '🏃', label: 'Track', phrase: 'Track', wordType: 'noun' },
    ],
  },

  // ═══ PLACES: COMMUNITY (20 items) ═══
  {
    id: 'places_community', name: 'Community Places', emoji: '🏘️', parentId: 'places',
    items: [
      { emoji: '🏪', label: 'Store', phrase: 'Go to the store', wordType: 'noun' },
      { emoji: '🛒', label: 'Grocery Store', phrase: 'Go to the grocery store', wordType: 'noun' },
      { emoji: '🏪', label: 'Restaurant', phrase: 'Go to a restaurant', wordType: 'noun' },
      { emoji: '📚', label: 'Library', phrase: 'Go to the library', wordType: 'noun' },
      { emoji: '🌳', label: 'Park', phrase: 'Go to the park', wordType: 'noun' },
      { emoji: '🏥', label: 'Hospital', phrase: 'Go to the hospital', wordType: 'noun' },
      { emoji: '🏦', label: 'Bank', phrase: 'Go to the bank', wordType: 'noun' },
      { emoji: '💈', label: 'Barber', phrase: 'Go to the barber', wordType: 'noun' },
      { emoji: '🦷', label: 'Dentist', phrase: 'Go to the dentist', wordType: 'noun' },
      { emoji: '🏋️', label: 'Gym', phrase: 'Go to the gym', wordType: 'noun' },
      { emoji: '🎬', label: 'Movie Theater', phrase: 'Go to the movies', wordType: 'noun' },
      { emoji: '🏊', label: 'Pool', phrase: 'Go to the pool', wordType: 'noun' },
      { emoji: '🎪', label: 'Circus', phrase: 'Go to the circus', wordType: 'noun' },
      { emoji: '🏟️', label: 'Stadium', phrase: 'Go to the stadium', wordType: 'noun' },
      { emoji: '🦁', label: 'Zoo', phrase: 'Go to the zoo', wordType: 'noun' },
      { emoji: '🚒', label: 'Fire Station', phrase: 'Fire station', wordType: 'noun' },
      { emoji: '🏛️', label: 'Police Station', phrase: 'Police station', wordType: 'noun' },
      { emoji: '🏤', label: 'Post Office', phrase: 'Post office', wordType: 'noun' },
      { emoji: '⛽', label: 'Gas Station', phrase: 'Gas station', wordType: 'noun' },
    ],
  },

  // ═══ PLACES: WORSHIP (6 items) ═══
  {
    id: 'places_worship', name: 'Worship', emoji: '🛐', parentId: 'places',
    items: [
      { emoji: '⛪', label: 'Church', phrase: 'Go to church', wordType: 'noun' },
      { emoji: '🕌', label: 'Mosque', phrase: 'Go to the mosque', wordType: 'noun' },
      { emoji: '🕍', label: 'Synagogue', phrase: 'Go to the synagogue', wordType: 'noun' },
      { emoji: '🛕', label: 'Temple', phrase: 'Go to the temple', wordType: 'noun' },
      { emoji: '🛐', label: 'Place of Worship', phrase: 'Go to worship', wordType: 'noun' },
      { emoji: '🕌', label: 'Gurdwara', phrase: 'I want to go to the gurdwara', wordType: 'noun' },
    ],
  },

  // ═══ CLOTHING (24 items + 7 appearance) ═══
  {
    id: 'clothing', name: 'Clothing', emoji: '👕', parentId: 'home',
    items: [
      { emoji: '👕', label: 'Shirt', phrase: 'Shirt', wordType: 'noun' },
      { emoji: '👖', label: 'Pants', phrase: 'Pants', wordType: 'noun' },
      { emoji: '👗', label: 'Dress', phrase: 'Dress', wordType: 'noun' },
      { emoji: '🧥', label: 'Jacket', phrase: 'Jacket', wordType: 'noun' },
      { emoji: '🧦', label: 'Socks', phrase: 'Socks', wordType: 'noun' },
      { emoji: '👟', label: 'Shoes', phrase: 'Shoes', wordType: 'noun' },
      { emoji: '🧢', label: 'Hat', phrase: 'Hat', wordType: 'noun' },
      { emoji: '🧤', label: 'Gloves', phrase: 'Gloves', wordType: 'noun' },
      { emoji: '🩳', label: 'Shorts', phrase: 'Shorts', wordType: 'noun' },
      { emoji: '👙', label: 'Swimsuit', phrase: 'Swimsuit', wordType: 'noun' },
      { emoji: '🧣', label: 'Scarf', phrase: 'Scarf', wordType: 'noun' },
      { emoji: '🥿', label: 'Sandals', phrase: 'Sandals', wordType: 'noun' },
      { emoji: '👢', label: 'Boots', phrase: 'Boots', wordType: 'noun' },
      { emoji: '🩱', label: 'Underwear', phrase: 'Underwear', wordType: 'noun' },
      { emoji: '👔', label: 'Tie', phrase: 'Tie', wordType: 'noun' },
      { emoji: '🎽', label: 'Tank Top', phrase: 'Tank top', wordType: 'noun' },
      { emoji: '👘', label: 'Robe', phrase: 'Robe', wordType: 'noun' },
      { emoji: '👡', label: 'Flip Flops', phrase: 'Flip flops', wordType: 'noun' },
      { emoji: '🧥', label: 'Coat', phrase: 'Coat', wordType: 'noun' },
      { emoji: '👕', label: 'Pajamas', phrase: 'Pajamas', wordType: 'noun' },
      { emoji: '🦺', label: 'Vest', phrase: 'Vest', wordType: 'noun' },
      { emoji: '🥻', label: 'Sari', phrase: 'Sari', wordType: 'noun' },
      { emoji: '🧕', label: 'Hijab', phrase: 'Hijab', wordType: 'noun' },
      { emoji: '👑', label: 'Crown', phrase: 'Crown', wordType: 'noun' },
      // Appearance
      { emoji: '👓', label: 'Glasses', phrase: 'My glasses', wordType: 'noun' },
      { emoji: '⌚', label: 'Watch', phrase: 'My watch', wordType: 'noun' },
      { emoji: '💍', label: 'Ring', phrase: 'Ring', wordType: 'noun' },
      { emoji: '📿', label: 'Necklace', phrase: 'Necklace', wordType: 'noun' },
      { emoji: '👜', label: 'Purse', phrase: 'Purse', wordType: 'noun' },
    ],
  },

  // ═══ COLORS & SHAPES (new subcategory for core descriptors) ═══
  {
    id: 'colors', name: 'Colors & Shapes', emoji: '🌈', parentId: null,
    items: [
      { emoji: '🔴', label: 'Red', phrase: 'Red', wordType: 'descriptor' },
      { emoji: '🟠', label: 'Orange', phrase: 'Orange', wordType: 'descriptor' },
      { emoji: '🟡', label: 'Yellow', phrase: 'Yellow', wordType: 'descriptor' },
      { emoji: '🟢', label: 'Green', phrase: 'Green', wordType: 'descriptor' },
      { emoji: '🔵', label: 'Blue', phrase: 'Blue', wordType: 'descriptor' },
      { emoji: '🟣', label: 'Purple', phrase: 'Purple', wordType: 'descriptor' },
      { emoji: '💗', label: 'Pink', phrase: 'Pink', wordType: 'descriptor' },
      { emoji: '🟤', label: 'Brown', phrase: 'Brown', wordType: 'descriptor' },
      { emoji: '⚫', label: 'Black', phrase: 'Black', wordType: 'descriptor' },
      { emoji: '⚪', label: 'White', phrase: 'White', wordType: 'descriptor' },
      { emoji: '🔶', label: 'Diamond', phrase: 'Diamond shape', wordType: 'noun' },
      { emoji: '🔷', label: 'Square', phrase: 'Square', wordType: 'noun' },
      { emoji: '🔺', label: 'Triangle', phrase: 'Triangle', wordType: 'noun' },
      { emoji: '⭕', label: 'Circle', phrase: 'Circle', wordType: 'noun' },
      { emoji: '🟫', label: 'Rectangle', phrase: 'Rectangle', wordType: 'noun' },
      { emoji: '⭐', label: 'Star', phrase: 'Star', wordType: 'noun' },
      { emoji: '❤️', label: 'Heart', phrase: 'Heart shape', wordType: 'noun' },
      { emoji: '🌈', label: 'Rainbow', phrase: 'Rainbow', wordType: 'noun' },
    ],
  },

  // ═══ TIME WORDS (new subcategory for core temporal concepts) ═══
  {
    id: 'timewords', name: 'Time Words', emoji: '⏰', parentId: null,
    items: [
      { emoji: '☀️', label: 'Today', phrase: 'Today', wordType: 'descriptor' },
      { emoji: '📅', label: 'Tomorrow', phrase: 'Tomorrow', wordType: 'descriptor' },
      { emoji: '📅', label: 'Yesterday', phrase: 'Yesterday', wordType: 'descriptor' },
      { emoji: '🌅', label: 'Morning', phrase: 'Morning', wordType: 'noun' },
      { emoji: '🌞', label: 'Afternoon', phrase: 'Afternoon', wordType: 'noun' },
      { emoji: '🌙', label: 'Night', phrase: 'Night', wordType: 'noun' },
      { emoji: '⚡', label: 'Now', phrase: 'Now', wordType: 'descriptor' },
      { emoji: '⏳', label: 'Later', phrase: 'Later', wordType: 'descriptor' },
      { emoji: '🔜', label: 'Soon', phrase: 'Soon', wordType: 'descriptor' },
      { emoji: '⏸️', label: 'Wait', phrase: 'Wait', wordType: 'descriptor' },
      { emoji: '✅', label: 'Finished', phrase: 'Finished', wordType: 'descriptor' },
      { emoji: '◀️', label: 'Before', phrase: 'Before', wordType: 'preposition' },
      { emoji: '▶️', label: 'After', phrase: 'After', wordType: 'preposition' },
      { emoji: '🏁', label: 'First', phrase: 'First', wordType: 'descriptor' },
      { emoji: '2️⃣', label: 'Then', phrase: 'Then', wordType: 'descriptor' },
      { emoji: '🏁', label: 'Last', phrase: 'Last', wordType: 'descriptor' },
    ],
  },

  // ═══ DESCRIPTORS / ADJECTIVES (new — expanded word types) ═══
  {
    id: 'descriptors', name: 'Describing Words', emoji: '📝', parentId: null,
    items: [
      { emoji: '🐘', label: 'Big', phrase: 'Big', wordType: 'descriptor' },
      { emoji: '🐭', label: 'Small', phrase: 'Small', wordType: 'descriptor' },
      { emoji: '🌡️', label: 'Hot', phrase: 'Hot', wordType: 'descriptor' },
      { emoji: '🥶', label: 'Cold', phrase: 'Cold', wordType: 'descriptor' },
      { emoji: '⚡', label: 'Fast', phrase: 'Fast', wordType: 'descriptor' },
      { emoji: '🐌', label: 'Slow', phrase: 'Slow', wordType: 'descriptor' },
      { emoji: '💪', label: 'Strong', phrase: 'Strong', wordType: 'descriptor' },
      { emoji: '🐑', label: 'Soft', phrase: 'Soft', wordType: 'descriptor' },
      { emoji: '🧱', label: 'Hard', phrase: 'Hard', wordType: 'descriptor' },
      { emoji: '🧽', label: 'Wet', phrase: 'Wet', wordType: 'descriptor' },
      { emoji: '🏜️', label: 'Dry', phrase: 'Dry', wordType: 'descriptor' },
      { emoji: '✨', label: 'New', phrase: 'New', wordType: 'descriptor' },
      { emoji: '🏚️', label: 'Old', phrase: 'Old', wordType: 'descriptor' },
      { emoji: '😊', label: 'Nice', phrase: 'Nice', wordType: 'descriptor' },
      { emoji: '😠', label: 'Mean', phrase: 'Mean', wordType: 'descriptor' },
      { emoji: '✨', label: 'Clean', phrase: 'Clean', wordType: 'descriptor' },
      { emoji: '💩', label: 'Dirty', phrase: 'Dirty', wordType: 'descriptor' },
      { emoji: '🔊', label: 'Loud', phrase: 'Loud', wordType: 'descriptor' },
      { emoji: '😁', label: 'Funny', phrase: 'Funny', wordType: 'descriptor' },
      { emoji: '😢', label: 'Sad', phrase: 'Sad', wordType: 'descriptor' },
      { emoji: '😨', label: 'Scary', phrase: 'Scary', wordType: 'descriptor' },
      { emoji: '🌸', label: 'Pretty', phrase: 'Pretty', wordType: 'descriptor' },
      { emoji: '👹', label: 'Ugly', phrase: 'Ugly', wordType: 'descriptor' },
    ],
  },

  // ═══ VERBS / ACTION WORDS (new — expanded word types) ═══
  {
    id: 'verbs', name: 'Action Words', emoji: '🏃', parentId: null,
    items: [
      { emoji: '🚶', label: 'Walk', phrase: 'Walk', wordType: 'verb' },
      { emoji: '🏃', label: 'Run', phrase: 'Run', wordType: 'verb' },
      { emoji: '🦘', label: 'Jump', phrase: 'Jump', wordType: 'verb' },
      { emoji: '🕺', label: 'Dance', phrase: 'Dance', wordType: 'verb' },
      { emoji: '🏊', label: 'Swim', phrase: 'Swim', wordType: 'verb' },
      { emoji: '🧗', label: 'Climb', phrase: 'Climb', wordType: 'verb' },
      { emoji: '🤲', label: 'Hold', phrase: 'Hold', wordType: 'verb' },
      { emoji: '⬇️', label: 'Drop', phrase: 'Drop', wordType: 'verb' },
      { emoji: '➡️', label: 'Push', phrase: 'Push', wordType: 'verb' },
      { emoji: '⬅️', label: 'Pull', phrase: 'Pull', wordType: 'verb' },
      { emoji: '🧹', label: 'Clean', phrase: 'Clean', wordType: 'verb' },
      { emoji: '🍳', label: 'Cook', phrase: 'Cook', wordType: 'verb' },
      { emoji: '✂️', label: 'Cut', phrase: 'Cut', wordType: 'verb' },
      { emoji: '📐', label: 'Draw', phrase: 'Draw', wordType: 'verb' },
      { emoji: '✍️', label: 'Write', phrase: 'Write', wordType: 'verb' },
      { emoji: '📖', label: 'Read', phrase: 'Read', wordType: 'verb' },
      { emoji: '💬', label: 'Talk', phrase: 'Talk', wordType: 'verb' },
      { emoji: '👂', label: 'Listen', phrase: 'Listen', wordType: 'verb' },
      { emoji: '👁️', label: 'Look', phrase: 'Look', wordType: 'verb' },
      { emoji: '🛏️', label: 'Sleep', phrase: 'Sleep', wordType: 'verb' },
      { emoji: '🍽️', label: 'Eat', phrase: 'Eat', wordType: 'verb' },
      { emoji: '🥤', label: 'Drink', phrase: 'Drink', wordType: 'verb' },
      { emoji: '💭', label: 'Think', phrase: 'Think', wordType: 'verb' },
      { emoji: '😊', label: 'Smile', phrase: 'Smile', wordType: 'verb' },
    ],
  },

  // ═══ WEATHER (new — useful context category) ═══
  {
    id: 'weather', name: 'Weather', emoji: '🌤️', parentId: null,
    items: [
      { emoji: '☀️', label: 'Sunny', phrase: 'It is sunny', wordType: 'descriptor' },
      { emoji: '🌧️', label: 'Rainy', phrase: 'It is rainy', wordType: 'descriptor' },
      { emoji: '⛅', label: 'Cloudy', phrase: 'It is cloudy', wordType: 'descriptor' },
      { emoji: '❄️', label: 'Snowy', phrase: 'It is snowing', wordType: 'descriptor' },
      { emoji: '💨', label: 'Windy', phrase: 'It is windy', wordType: 'descriptor' },
      { emoji: '⛈️', label: 'Storm', phrase: 'There is a storm', wordType: 'noun' },
      { emoji: '🌈', label: 'Rainbow', phrase: 'I see a rainbow', wordType: 'noun' },
      { emoji: '🌡️', label: 'Hot Outside', phrase: 'It is hot outside', wordType: 'descriptor' },
      { emoji: '🥶', label: 'Cold Outside', phrase: 'It is cold outside', wordType: 'descriptor' },
      { emoji: '🌫️', label: 'Foggy', phrase: 'It is foggy', wordType: 'descriptor' },
    ],
  },

  // ═══ NUMBERS (new — basic math/counting) ═══
  {
    id: 'numbers', name: 'Numbers', emoji: '🔢', parentId: null,
    items: [
      { emoji: '0️⃣', label: 'Zero', phrase: 'Zero', wordType: 'noun' },
      { emoji: '1️⃣', label: 'One', phrase: 'One', wordType: 'noun' },
      { emoji: '2️⃣', label: 'Two', phrase: 'Two', wordType: 'noun' },
      { emoji: '3️⃣', label: 'Three', phrase: 'Three', wordType: 'noun' },
      { emoji: '4️⃣', label: 'Four', phrase: 'Four', wordType: 'noun' },
      { emoji: '5️⃣', label: 'Five', phrase: 'Five', wordType: 'noun' },
      { emoji: '6️⃣', label: 'Six', phrase: 'Six', wordType: 'noun' },
      { emoji: '7️⃣', label: 'Seven', phrase: 'Seven', wordType: 'noun' },
      { emoji: '8️⃣', label: 'Eight', phrase: 'Eight', wordType: 'noun' },
      { emoji: '9️⃣', label: 'Nine', phrase: 'Nine', wordType: 'noun' },
      { emoji: '🔟', label: 'Ten', phrase: 'Ten', wordType: 'noun' },
      { emoji: '💯', label: 'Hundred', phrase: 'One hundred', wordType: 'noun' },
    ],
  },

  // ═══ ROUTINES (new top-level board) ═══
  {
    id: 'routines', name: 'Routines', emoji: '📋', parentId: 'home',
    items: [
      { emoji: '🌅', label: 'Morning', category: 'routines_morning' },
      { emoji: '🌙', label: 'Evening', category: 'routines_evening' },
      { emoji: '🧹', label: 'Chores', category: 'routines_chores' },
      { emoji: '🙏', label: 'Faith', category: 'routines_faith' },
    ],
  },

  // ═══ ROUTINES: MORNING (14 items) ═══
  {
    id: 'routines_morning', name: 'Morning', emoji: '🌅', parentId: 'routines',
    items: [
      { emoji: '🌅', label: 'Wake Up', phrase: 'Time to wake up', wordType: 'verb' },
      { emoji: '😁', label: 'Brush Teeth', phrase: 'Brush my teeth', wordType: 'verb' },
      { emoji: '🧽', label: 'Wash Face', phrase: 'Wash my face', wordType: 'verb' },
      { emoji: '💈', label: 'Brush Hair', phrase: 'Brush my hair', wordType: 'verb' },
      { emoji: '👕', label: 'Get Dressed', phrase: 'Get dressed', wordType: 'verb' },
      { emoji: '🥣', label: 'Eat Breakfast', phrase: 'Eat breakfast', wordType: 'verb' },
      { emoji: '💊', label: 'Take Medicine', phrase: 'Take my medicine', wordType: 'verb' },
      { emoji: '🎒', label: 'Pack Backpack', phrase: 'Pack my backpack', wordType: 'verb' },
      { emoji: '👟', label: 'Put On Shoes', phrase: 'Put on shoes', wordType: 'verb' },
      { emoji: '🧥', label: 'Put On Jacket', phrase: 'Put on jacket', wordType: 'verb' },
      { emoji: '🚌', label: 'Catch Bus', phrase: 'Catch the bus', wordType: 'verb' },
      { emoji: '🚗', label: 'Get In Car', phrase: 'Get in the car', wordType: 'verb' },
      { emoji: '🚪', label: 'Say Goodbye', phrase: 'Goodbye', wordType: 'social' },
      { emoji: '🚻', label: 'Use Bathroom', phrase: 'Use the bathroom', wordType: 'verb' },
    ],
  },

  // ═══ ROUTINES: EVENING (14 items) ═══
  {
    id: 'routines_evening', name: 'Evening', emoji: '🌙', parentId: 'routines',
    items: [
      { emoji: '🏠', label: 'Come Home', phrase: 'Come home', wordType: 'verb' },
      { emoji: '🍽️', label: 'Eat Dinner', phrase: 'Eat dinner', wordType: 'verb' },
      { emoji: '📋', label: 'Do Homework', phrase: 'Do my homework', wordType: 'verb' },
      { emoji: '🛁', label: 'Take Bath', phrase: 'Take a bath', wordType: 'verb' },
      { emoji: '🚿', label: 'Take Shower', phrase: 'Take a shower', wordType: 'verb' },
      { emoji: '👕', label: 'Put On Pajamas', phrase: 'Put on pajamas', wordType: 'verb' },
      { emoji: '😁', label: 'Brush Teeth', phrase: 'Brush my teeth', wordType: 'verb' },
      { emoji: '📖', label: 'Read Story', phrase: 'Read a story', wordType: 'verb' },
      { emoji: '🤗', label: 'Hug Goodnight', phrase: 'Hug goodnight', wordType: 'social' },
      { emoji: '🌑', label: 'Lights Off', phrase: 'Turn off the lights', wordType: 'verb' },
      { emoji: '🛏️', label: 'Go To Bed', phrase: 'Go to bed', wordType: 'verb' },
      { emoji: '🎵', label: 'Listen To Music', phrase: 'Listen to music', wordType: 'verb' },
      { emoji: '🧸', label: 'Get Stuffed Animal', phrase: 'Get my stuffed animal', wordType: 'verb' },
      { emoji: '🌃', label: 'Goodnight', phrase: 'Goodnight', wordType: 'social' },
    ],
  },

  // ═══ ROUTINES: CHORES (12 items) ═══
  {
    id: 'routines_chores', name: 'Chores', emoji: '🧹', parentId: 'routines',
    items: [
      { emoji: '🧹', label: 'Sweep', phrase: 'Sweep the floor', wordType: 'verb' },
      { emoji: '🧽', label: 'Wipe Table', phrase: 'Wipe the table', wordType: 'verb' },
      { emoji: '🧺', label: 'Laundry', phrase: 'Do the laundry', wordType: 'noun' },
      { emoji: '🧼', label: 'Wash Dishes', phrase: 'Wash the dishes', wordType: 'verb' },
      { emoji: '🛏️', label: 'Make Bed', phrase: 'Make my bed', wordType: 'verb' },
      { emoji: '🗑️', label: 'Take Out Trash', phrase: 'Take out the trash', wordType: 'verb' },
      { emoji: '🥣', label: 'Feed Pet', phrase: 'Feed the pet', wordType: 'verb' },
      { emoji: '💧', label: 'Water Plants', phrase: 'Water the plants', wordType: 'verb' },
      { emoji: '🧸', label: 'Pick Up Toys', phrase: 'Pick up my toys', wordType: 'verb' },
      { emoji: '👕', label: 'Fold Clothes', phrase: 'Fold the clothes', wordType: 'verb' },
      { emoji: '🌀', label: 'Vacuum', phrase: 'Vacuum the floor', wordType: 'verb' },
      { emoji: '🧹', label: 'Mop', phrase: 'Mop the floor', wordType: 'verb' },
    ],
  },

  // ═══ ROUTINES: FAITH (12 items) ═══
  {
    id: 'routines_faith', name: 'Faith', emoji: '🙏', parentId: 'routines',
    items: [
      { emoji: '🙏', label: 'Pray', phrase: 'Time to pray', wordType: 'verb' },
      { emoji: '📖', label: 'Read Scripture', phrase: 'Read scripture', wordType: 'verb' },
      { emoji: '🎶', label: 'Sing Hymn', phrase: 'Sing a hymn', wordType: 'verb' },
      { emoji: '🍽️', label: 'Say Grace', phrase: 'Say grace', wordType: 'verb' },
      { emoji: '⛪', label: 'Go To Church', phrase: 'Go to church', wordType: 'verb' },
      { emoji: '🕌', label: 'Go To Mosque', phrase: 'Go to the mosque', wordType: 'verb' },
      { emoji: '🕍', label: 'Go To Synagogue', phrase: 'Go to the synagogue', wordType: 'verb' },
      { emoji: '🛕', label: 'Go To Temple', phrase: 'Go to the temple', wordType: 'verb' },
      { emoji: '🧎', label: 'Kneel', phrase: 'Kneel down', wordType: 'verb' },
      { emoji: '🙏', label: 'Give Thanks', phrase: 'Give thanks', wordType: 'verb' },
      { emoji: '📿', label: 'Rosary', phrase: 'Say the rosary', wordType: 'noun' },
      { emoji: '🕯️', label: 'Light Candle', phrase: 'Light a candle', wordType: 'verb' },
      { emoji: '💧', label: 'Wudu', phrase: 'Time for wudu', wordType: 'noun' },
      { emoji: '🕌', label: 'Salah', phrase: 'Time for salah', wordType: 'noun' },
      { emoji: '🌙', label: 'Fasting', phrase: 'I am fasting', wordType: 'noun' },
      { emoji: '🍽️', label: 'Iftar', phrase: 'Time for iftar', wordType: 'noun' },
      { emoji: '🕯️', label: 'Shabbat', phrase: 'Shabbat', wordType: 'noun' },
      { emoji: '🪔', label: 'Puja', phrase: 'Time for puja', wordType: 'noun' },
      { emoji: '📖', label: 'Quran Reading', phrase: 'Time to read Quran', wordType: 'noun' },
      { emoji: '📖', label: 'Bible Study', phrase: 'Bible study', wordType: 'noun' },
      { emoji: '🧘', label: 'Meditation', phrase: 'Time to meditate', wordType: 'noun' },
    ],
  },

  // ═══ TRANSPORTATION (15 items) ═══
  {
    id: 'transportation', name: 'Transportation', emoji: '🚗', parentId: 'home',
    items: [
      { emoji: '🚗', label: 'Car', phrase: 'Car', wordType: 'noun' },
      { emoji: '🚌', label: 'Bus', phrase: 'Bus', wordType: 'noun' },
      { emoji: '🚲', label: 'Bike', phrase: 'Bike', wordType: 'noun' },
      { emoji: '👣', label: 'Walk', phrase: 'Walk', wordType: 'verb' },
      { emoji: '🚕', label: 'Taxi', phrase: 'Taxi', wordType: 'noun' },
      { emoji: '🚆', label: 'Train', phrase: 'Train', wordType: 'noun' },
      { emoji: '✈️', label: 'Airplane', phrase: 'Airplane', wordType: 'noun' },
      { emoji: '🚢', label: 'Boat', phrase: 'Boat', wordType: 'noun' },
      { emoji: '🛴', label: 'Scooter', phrase: 'Scooter', wordType: 'noun' },
      { emoji: '🛹', label: 'Skateboard', phrase: 'Skateboard', wordType: 'noun' },
      { emoji: '🚐', label: 'Van', phrase: 'Van', wordType: 'noun' },
      { emoji: '🚑', label: 'Ambulance', phrase: 'Ambulance', wordType: 'noun' },
      { emoji: '🚒', label: 'Fire Truck', phrase: 'Fire truck', wordType: 'noun' },
      { emoji: '🏍️', label: 'Motorcycle', phrase: 'Motorcycle', wordType: 'noun' },
      { emoji: '♿', label: 'Wheelchair', phrase: 'Wheelchair', wordType: 'noun' },
      { emoji: '🚇', label: 'Subway', phrase: 'I want to take the subway', wordType: 'noun' },
      { emoji: '🚌', label: 'School Bus', phrase: 'I want the school bus', wordType: 'noun' },
      { emoji: '🚁', label: 'Helicopter', phrase: 'Helicopter', wordType: 'noun' },
      { emoji: '⛴️', label: 'Ferry', phrase: 'I want to take the ferry', wordType: 'noun' },
    ],
  },

  // ═══ TECHNOLOGY (15 items) ═══
  {
    id: 'technology', name: 'Technology', emoji: '📱', parentId: 'home',
    items: [
      { emoji: '📱', label: 'Phone', phrase: 'Phone', wordType: 'noun' },
      { emoji: '💻', label: 'Computer', phrase: 'Computer', wordType: 'noun' },
      { emoji: '📺', label: 'TV', phrase: 'TV', wordType: 'noun' },
      { emoji: '🎮', label: 'Video Game', phrase: 'Video game', wordType: 'noun' },
      { emoji: '🎧', label: 'Headphones', phrase: 'Headphones', wordType: 'noun' },
      { emoji: '📷', label: 'Camera', phrase: 'Camera', wordType: 'noun' },
      { emoji: '🖨️', label: 'Printer', phrase: 'Printer', wordType: 'noun' },
      { emoji: '🔌', label: 'Charger', phrase: 'Charger', wordType: 'noun' },
      { emoji: '📡', label: 'WiFi', phrase: 'WiFi', wordType: 'noun' },
      { emoji: '🔋', label: 'Battery', phrase: 'Battery', wordType: 'noun' },
      { emoji: '🖥️', label: 'Tablet', phrase: 'Tablet', wordType: 'noun' },
      { emoji: '🔊', label: 'Speaker', phrase: 'Speaker', wordType: 'noun' },
      { emoji: '⌨️', label: 'Keyboard', phrase: 'Keyboard', wordType: 'noun' },
      { emoji: '🖱️', label: 'Mouse', phrase: 'Mouse', wordType: 'noun' },
      { emoji: '💡', label: 'Smart Light', phrase: 'Smart light', wordType: 'noun' },
      { emoji: '📹', label: 'Video Call', phrase: 'I want to video call', wordType: 'noun' },
      { emoji: '💬', label: 'Text Message', phrase: 'I want to text', wordType: 'noun' },
      { emoji: '▶️', label: 'YouTube', phrase: 'I want to watch YouTube', wordType: 'noun' },
      { emoji: '🔊', label: 'Smart Speaker', phrase: 'Hey Alexa', wordType: 'noun' },
      { emoji: '📺', label: 'Remote Control', phrase: 'I need the remote', wordType: 'noun' },
    ],
  },

  // ═══ NATURE (17 items) ═══
  {
    id: 'nature', name: 'Nature', emoji: '🌿', parentId: 'home',
    items: [
      { emoji: '🌳', label: 'Tree', phrase: 'Tree', wordType: 'noun' },
      { emoji: '🌻', label: 'Flower', phrase: 'Flower', wordType: 'noun' },
      { emoji: '🌿', label: 'Grass', phrase: 'Grass', wordType: 'noun' },
      { emoji: '⛰️', label: 'Rock', phrase: 'Rock', wordType: 'noun' },
      { emoji: '🌊', label: 'Ocean', phrase: 'Ocean', wordType: 'noun' },
      { emoji: '🏔️', label: 'Mountain', phrase: 'Mountain', wordType: 'noun' },
      { emoji: '🏜️', label: 'Desert', phrase: 'Desert', wordType: 'noun' },
      { emoji: '🌧️', label: 'Rain', phrase: 'Rain', wordType: 'noun' },
      { emoji: '❄️', label: 'Snow', phrase: 'Snow', wordType: 'noun' },
      { emoji: '☀️', label: 'Sun', phrase: 'Sun', wordType: 'noun' },
      { emoji: '🌕', label: 'Moon', phrase: 'Moon', wordType: 'noun' },
      { emoji: '⭐', label: 'Stars', phrase: 'Stars', wordType: 'noun' },
      { emoji: '🌈', label: 'Rainbow', phrase: 'Rainbow', wordType: 'noun' },
      { emoji: '🍂', label: 'Leaves', phrase: 'Leaves', wordType: 'noun' },
      { emoji: '🌄', label: 'Field', phrase: 'Field', wordType: 'noun' },
      { emoji: '💧', label: 'River', phrase: 'River', wordType: 'noun' },
      { emoji: '🌲', label: 'Forest', phrase: 'Forest', wordType: 'noun' },
    ],
  },

  // ═══ MY WORDS / CUSTOM (placeholder board) ═══
  {
    id: 'custom', name: 'My Words', emoji: '⭐', parentId: null,
    items: [],
  },
];

// ── Convert to DB records ──

export function getDefaultBoards(): Board[] {
  return BOARD_DEFS.map((b, i) => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    parentId: b.parentId,
    order: i,
  }));
}

export function getDefaultSymbols(): Symbol[] {
  const symbols: Symbol[] = [];
  let globalId = 0;

  for (const board of BOARD_DEFS) {
    board.items.forEach((item, idx) => {
      const sym = {
        id: `default-${globalId++}`,
        boardId: board.id,
        emoji: item.emoji,
        label: item.label,
        phrase: item.phrase || item.label,
        color: cardColor(idx),
        order: idx,
        isCategory: !!item.category,
        targetBoardId: item.category,
        wordType: item.wordType,
        arasaacId: item.arasaacId,
      };
      symbols.push(sym);
    });
  }

  return symbols;
}

// ── Symbol count validation (expansion sprint) ──
// Total symbols across all boards:
// home(24) + quickfires(12) + corewords(50) + repairs(12) + feelings(24) +
// food(14) + drinks(11) + snacks(14) + fruits(14) + vegetables(12) + desserts(12) +
// food_american(25) + food_latin(33) + food_soul(21) + food_eastasian(31) +
// food_southasian(25) + food_middleeast(18) + food_african(14) + food_caribbean(11) + food_european(15) +
// activities(20) + sports(30) + music(12) + outdoor(12) + play_creative(21) + play_cultural(17) +
// social(19) + family(31) + community(20) + questions(12) + social_greetings(12) + social_phrases(37) +
// body(13) + hygiene(12) + medical(12) + body_parts(26) + body_health(27) +
// school(11) + school_academic(16) + school_supplies(14) + bedtime(16) +
// animals(31) + pets(15) +
// places(15) + places_home(10) + places_school(14) + places_community(20) + places_worship(6) +
// clothing(31) +
// colors(18) + timewords(16) + descriptors(24) + verbs(24) + weather(10) + numbers(12) +
// routines(4) + routines_morning(14) + routines_evening(14) + routines_chores(12) + routines_faith(12) +
// transportation(15) + technology(15) + nature(17) + custom(0)
// = 1200+ symbols

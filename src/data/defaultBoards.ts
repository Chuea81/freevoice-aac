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
      { emoji: '✅', label: 'Yes', phrase: 'Yes', wordType: 'social' },
      { emoji: '❌', label: 'No', phrase: 'No', wordType: 'social' },
      { emoji: '🙏', label: 'Please', phrase: 'Please', wordType: 'social' },
      { emoji: '🙌', label: 'Thank You', phrase: 'Thank you', wordType: 'social' },
      { emoji: '💔', label: 'Hurts', phrase: 'That hurts', wordType: 'descriptor' },
      { emoji: '❓', label: 'Help', phrase: 'I need help', wordType: 'social' },
      { emoji: '🚫', label: 'Stop', phrase: 'Stop', wordType: 'social' },
      { emoji: '🔄', label: 'More', phrase: 'More please', wordType: 'social' },
      { emoji: '👋', label: 'Hi', phrase: 'Hi!', wordType: 'social' },
      { emoji: '✋', label: 'Wait', phrase: 'Wait', wordType: 'social' },
    ],
  },

  // ═══ QUICKFIRES (TDSnap analysis — persistent quick phrases) ═══
  {
    id: 'quickfires', name: 'Fast Phrases', emoji: '⚡', parentId: null,
    items: [
      { emoji: '❓', label: 'Help', phrase: 'I need help', wordType: 'social' },
      { emoji: '✋', label: 'Wait', phrase: 'Wait', wordType: 'social' },
      { emoji: '👀', label: 'Look', phrase: 'Look at me', wordType: 'social' },
      { emoji: '✅', label: 'Done', phrase: "I'm done", wordType: 'social' },
      { emoji: '🔄', label: 'More', phrase: 'More please', wordType: 'social' },
      { emoji: '🚫', label: 'Stop', phrase: 'Stop', wordType: 'social' },
      { emoji: '⏰', label: 'Break', phrase: 'I need a break', wordType: 'social' },
      { emoji: '🙏', label: 'Please', phrase: 'Please', wordType: 'social' },
      { emoji: '🙌', label: 'Thank You', phrase: 'Thank you', wordType: 'social' },
      { emoji: '💔', label: 'Hurts', phrase: 'That hurts', wordType: 'social' },
      { emoji: '🚽', label: 'Bathroom', phrase: 'I need the bathroom', wordType: 'noun' },
      { emoji: '🤗', label: 'Hug', phrase: 'I want a hug', wordType: 'social' },
    ],
  },

  // ═══ CORE WORDS (TDSnap analysis — ~50 highest-frequency words) ═══
  {
    id: 'corewords', name: 'Core Words', emoji: '💎', parentId: null,
    items: [
      // Pronouns
      { emoji: '👤', label: 'I', phrase: 'I', wordType: 'pronoun' },
      { emoji: '👉', label: 'You', phrase: 'You', wordType: 'pronoun' },
      { emoji: '👨', label: 'He', phrase: 'He', wordType: 'pronoun' },
      { emoji: '👩', label: 'She', phrase: 'She', wordType: 'pronoun' },
      { emoji: '👥', label: 'We', phrase: 'We', wordType: 'pronoun' },
      { emoji: '👫', label: 'They', phrase: 'They', wordType: 'pronoun' },
      { emoji: '🫵', label: 'My', phrase: 'My', wordType: 'pronoun' },
      { emoji: '🏷️', label: 'That', phrase: 'That', wordType: 'pronoun' },
      { emoji: '☝️', label: 'This', phrase: 'This', wordType: 'pronoun' },
      { emoji: '📍', label: 'It', phrase: 'It', wordType: 'pronoun' },
      // Core verbs
      { emoji: '🙋', label: 'Want', phrase: 'Want', wordType: 'verb' },
      { emoji: '🚶', label: 'Go', phrase: 'Go', wordType: 'verb' },
      { emoji: '⬆️', label: 'Get', phrase: 'Get', wordType: 'verb' },
      { emoji: '🤲', label: 'Make', phrase: 'Make', wordType: 'verb' },
      { emoji: '🔧', label: 'Put', phrase: 'Put', wordType: 'verb' },
      { emoji: '👁️', label: 'See', phrase: 'See', wordType: 'verb' },
      { emoji: '❤️', label: 'Like', phrase: 'Like', wordType: 'verb' },
      { emoji: '🍽️', label: 'Eat', phrase: 'Eat', wordType: 'verb' },
      { emoji: '🥤', label: 'Drink', phrase: 'Drink', wordType: 'verb' },
      { emoji: '🎮', label: 'Play', phrase: 'Play', wordType: 'verb' },
      { emoji: '📖', label: 'Read', phrase: 'Read', wordType: 'verb' },
      { emoji: '🗣️', label: 'Say', phrase: 'Say', wordType: 'verb' },
      { emoji: '👂', label: 'Listen', phrase: 'Listen', wordType: 'verb' },
      { emoji: '🏃', label: 'Run', phrase: 'Run', wordType: 'verb' },
      { emoji: '🤝', label: 'Share', phrase: 'Share', wordType: 'verb' },
      { emoji: '💪', label: 'Can', phrase: 'Can', wordType: 'verb' },
      { emoji: '🧠', label: 'Think', phrase: 'Think', wordType: 'verb' },
      { emoji: '🤔', label: 'Know', phrase: 'Know', wordType: 'verb' },
      { emoji: '🤚', label: 'Need', phrase: 'Need', wordType: 'verb' },
      { emoji: '😊', label: 'Feel', phrase: 'Feel', wordType: 'verb' },
      { emoji: '🔀', label: 'Turn', phrase: 'Turn', wordType: 'verb' },
      { emoji: '📦', label: 'Open', phrase: 'Open', wordType: 'verb' },
      { emoji: '🚪', label: 'Close', phrase: 'Close', wordType: 'verb' },
      { emoji: '📥', label: 'Give', phrase: 'Give', wordType: 'verb' },
      { emoji: '📤', label: 'Take', phrase: 'Take', wordType: 'verb' },
      // Core descriptors / modifiers
      { emoji: '👍', label: 'Good', phrase: 'Good', wordType: 'descriptor' },
      { emoji: '👎', label: 'Bad', phrase: 'Bad', wordType: 'descriptor' },
      { emoji: '🔝', label: 'Big', phrase: 'Big', wordType: 'descriptor' },
      { emoji: '🔽', label: 'Little', phrase: 'Little', wordType: 'descriptor' },
      { emoji: '🔄', label: 'More', phrase: 'More', wordType: 'descriptor' },
      { emoji: '✋', label: 'Done', phrase: 'Done', wordType: 'descriptor' },
      { emoji: '🚫', label: 'Not', phrase: 'Not', wordType: 'descriptor' },
      { emoji: '⬆️', label: 'Up', phrase: 'Up', wordType: 'preposition' },
      { emoji: '⬇️', label: 'Down', phrase: 'Down', wordType: 'preposition' },
      { emoji: '➡️', label: 'In', phrase: 'In', wordType: 'preposition' },
      { emoji: '⬅️', label: 'Out', phrase: 'Out', wordType: 'preposition' },
      { emoji: '🔛', label: 'On', phrase: 'On', wordType: 'preposition' },
      { emoji: '🔚', label: 'Off', phrase: 'Off', wordType: 'preposition' },
      { emoji: '🔙', label: 'Again', phrase: 'Again', wordType: 'descriptor' },
      { emoji: '📍', label: 'Here', phrase: 'Here', wordType: 'descriptor' },
      { emoji: '👆', label: 'There', phrase: 'There', wordType: 'descriptor' },
    ],
  },

  // ═══ REPAIRS (TDSnap analysis — communication breakdown phrases) ═══
  {
    id: 'repairs', name: 'Repairs', emoji: '🔧', parentId: null,
    items: [
      { emoji: '🔁', label: 'Say Again', phrase: 'Say that again', wordType: 'social' },
      { emoji: '❓', label: "Don't Understand", phrase: "I don't understand", wordType: 'social' },
      { emoji: '😤', label: 'Frustrated', phrase: 'I am frustrated', wordType: 'social' },
      { emoji: '⏰', label: 'Need Break', phrase: 'I need a break', wordType: 'social' },
      { emoji: '🤔', label: 'Thinking', phrase: 'I am thinking', wordType: 'social' },
      { emoji: '🐌', label: 'Slow Down', phrase: 'Slow down please', wordType: 'social' },
      { emoji: '😶', label: 'Not Ready', phrase: 'I am not ready', wordType: 'social' },
      { emoji: '↩️', label: 'Wrong', phrase: 'That is wrong', wordType: 'social' },
      { emoji: '📢', label: 'Louder', phrase: 'Can you say that louder', wordType: 'social' },
      { emoji: '🤫', label: 'Too Loud', phrase: 'It is too loud', wordType: 'social' },
      { emoji: '🔄', label: 'Try Again', phrase: 'Let me try again', wordType: 'social' },
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
      { emoji: '😴', label: 'Tired', phrase: 'I am tired', wordType: 'descriptor', arasaacId: 35537 },
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
      { emoji: '🫣', label: 'Shy', phrase: 'I feel shy', wordType: 'descriptor', arasaacId: 37767 },
      { emoji: '😏', label: 'Silly', phrase: 'I feel silly', wordType: 'descriptor', arasaacId: 15483 },
      { emoji: '🙏', label: 'Grateful', phrase: 'I feel grateful', wordType: 'descriptor', arasaacId: 37233 },
      { emoji: '😞', label: 'Disappointed', phrase: 'I am disappointed', wordType: 'descriptor', arasaacId: 11959 },
    ],
  },

  // ═══ FOOD (copied from prototype + expanded) ═══
  {
    id: 'food', name: 'Food', emoji: '🍎', parentId: 'home',
    items: [
      { emoji: '🥤', label: 'Drinks', category: 'drinks' },
      { emoji: '🍽️', label: 'Meals', category: 'meals' },
      { emoji: '🍪', label: 'Snacks', category: 'snacks' },
      { emoji: '🍓', label: 'Fruits', category: 'fruits' },
      { emoji: '🥦', label: 'Vegetables', category: 'vegetables' },
      { emoji: '🍰', label: 'Desserts', category: 'desserts' },
    ],
  },

  // ═══ DRINKS (copied from prototype) ═══
  {
    id: 'drinks', name: 'Drinks', emoji: '🥤', parentId: 'food',
    items: [
      // Row 1
      { emoji: '💧', label: 'Water', phrase: 'Water', wordType: 'noun' },
      { emoji: '🥛', label: 'Milk', phrase: 'Milk', wordType: 'noun' },
      { emoji: '🧃', label: 'Juice', phrase: 'Juice', wordType: 'noun' },
      { emoji: '🍊', label: 'Orange Juice', phrase: 'Orange juice', wordType: 'noun' },
      { emoji: '🍵', label: 'Tea', phrase: 'Tea', wordType: 'noun' },
      { emoji: '🥤', label: 'Soda', phrase: 'Soda', wordType: 'noun' },
      { emoji: '🍫', label: 'Chocolate Milk', phrase: 'Chocolate milk', wordType: 'noun' },
      { emoji: '🧋', label: 'Smoothie', phrase: 'Smoothie', wordType: 'noun' },
      { emoji: '🍹', label: 'Lemonade', phrase: 'Lemonade', wordType: 'noun' },
      { emoji: '🥥', label: 'Coconut Water', phrase: 'Coconut water', wordType: 'noun' },
      // Row 2
      { emoji: '☕', label: 'Iced Coffee', phrase: 'Iced coffee', wordType: 'noun' },
      { emoji: '🥤', label: 'Milkshake', phrase: 'Milkshake', wordType: 'noun' },
      { emoji: '🧋', label: 'Boba Tea', phrase: 'Boba tea', wordType: 'noun' },
      { emoji: '☕', label: 'Hot Coffee', phrase: 'Hot coffee', wordType: 'noun' },
      { emoji: '🍫', label: 'Hot Chocolate', phrase: 'Hot chocolate', wordType: 'noun' },
      { emoji: '🥛', label: 'Milk Coffee', phrase: 'Milk coffee', wordType: 'noun' },
      { emoji: '🍵', label: 'Kombucha', phrase: 'Kombucha', wordType: 'noun' },
      { emoji: '⚡', label: 'Energy Drink', phrase: 'Energy drink', wordType: 'noun' },
      { emoji: '🍒', label: 'Cranberry Juice', phrase: 'Cranberry juice', wordType: 'noun' },
      // Row 3
      { emoji: '🍎', label: 'Apple Juice', phrase: 'Apple juice', wordType: 'noun' },
      { emoji: '☕', label: 'Frappuccino', phrase: 'Frappuccino', wordType: 'noun' },
      { emoji: '💧', label: 'Sparkling Water', phrase: 'Sparkling water', wordType: 'noun' },
      { emoji: '🍺', label: 'Root Beer', phrase: 'Root beer', wordType: 'noun' },
      { emoji: '🧊', label: 'Iced Tea', phrase: 'Iced tea', wordType: 'noun' },
      { emoji: '🍎', label: 'Hot Cider', phrase: 'Hot cider', wordType: 'noun' },
      { emoji: '🥭', label: 'Mango Lassi', phrase: 'Mango lassi', wordType: 'noun' },
      { emoji: '🧃', label: 'Agua Fresca', phrase: 'Agua fresca', wordType: 'noun' },
      { emoji: '🏃', label: 'Sports Drink', phrase: 'Sports drink', wordType: 'noun' },
      // Row 4
      { emoji: '🍇', label: 'Grape Juice', phrase: 'Grape juice', wordType: 'noun' },
      { emoji: '🍍', label: 'Pineapple Juice', phrase: 'Pineapple juice', wordType: 'noun' },
      { emoji: '🍑', label: 'Peach Juice', phrase: 'Peach juice', wordType: 'noun' },
      { emoji: '🍹', label: 'Fruit Punch', phrase: 'Fruit punch', wordType: 'noun' },
      { emoji: '🍅', label: 'Tomato Juice', phrase: 'Tomato juice', wordType: 'noun' },
      { emoji: '🥬', label: 'Vegetable Juice', phrase: 'Vegetable juice', wordType: 'noun' },
      { emoji: '🥛', label: 'Milk Carton', phrase: 'Milk carton', wordType: 'noun' },
      { emoji: '💧', label: 'Water Bottle', phrase: 'Water bottle', wordType: 'noun' },
    ],
  },

  // ═══ MEALS (copied from prototype + expanded) ═══
  {
    id: 'meals', name: 'Meals', emoji: '🍽️', parentId: 'food',
    items: [
      { emoji: '🥣', label: 'Cereal', phrase: 'Cereal', wordType: 'noun' },
      { emoji: '🥞', label: 'Pancakes', phrase: 'Pancakes', wordType: 'noun' },
      { emoji: '🍝', label: 'Pasta', phrase: 'Pasta', wordType: 'noun' },
      { emoji: '🍲', label: 'Soup', phrase: 'Soup', wordType: 'noun' },
      { emoji: '🌮', label: 'Taco', phrase: 'Taco', wordType: 'noun' },
      { emoji: '🍔', label: 'Burger', phrase: 'Burger', wordType: 'noun' },
      { emoji: '🍣', label: 'Sushi', phrase: 'Sushi', wordType: 'noun' },
      { emoji: '🥗', label: 'Salad', phrase: 'Salad', wordType: 'noun' },
      { emoji: '🍛', label: 'Curry', phrase: 'Curry', wordType: 'noun' },
      { emoji: '🌯', label: 'Burrito', phrase: 'Burrito', wordType: 'noun' },
      { emoji: '🥙', label: 'Pita', phrase: 'Pita', wordType: 'noun' },
      { emoji: '🍱', label: 'Lunch Box', phrase: 'Lunch box', wordType: 'noun' },
      { emoji: '🥘', label: 'Stew', phrase: 'Stew', wordType: 'noun' },
      { emoji: '🍜', label: 'Noodles', phrase: 'Noodles', wordType: 'noun' },
      { emoji: '🥓', label: 'Bacon', phrase: 'Bacon', wordType: 'noun' },
      { emoji: '🌭', label: 'Hot Dog', phrase: 'Hot dog', wordType: 'noun' },
    ],
  },

  // ═══ SNACKS (copied from prototype + expanded) ═══
  {
    id: 'snacks', name: 'Snacks', emoji: '🍪', parentId: 'food',
    items: [
      { emoji: '🥜', label: 'Peanut Butter', phrase: 'Peanut butter', wordType: 'noun' },
      { emoji: '🧇', label: 'Waffle', phrase: 'Waffle', wordType: 'noun' },
      { emoji: '🍿', label: 'Popcorn', phrase: 'Popcorn', wordType: 'noun' },
      { emoji: '🥨', label: 'Crackers', phrase: 'Crackers', wordType: 'noun' },
      { emoji: '🍫', label: 'Chocolate', phrase: 'Chocolate', wordType: 'noun' },
      { emoji: '🍦', label: 'Ice Cream', phrase: 'Ice cream', wordType: 'noun' },
      { emoji: '🍩', label: 'Donut', phrase: 'Donut', wordType: 'noun' },
      { emoji: '🧁', label: 'Cupcake', phrase: 'Cupcake', wordType: 'noun' },
      { emoji: '🥜', label: 'Nuts', phrase: 'Nuts', wordType: 'noun', arasaacId: 2674 },
      { emoji: '🧀', label: 'Cheese Stick', phrase: 'Cheese stick', wordType: 'noun' },
      { emoji: '🍘', label: 'Rice Cake', phrase: 'Rice cake', wordType: 'noun' },
      { emoji: '🥐', label: 'Croissant', phrase: 'Croissant', wordType: 'noun' },
      { emoji: '🫘', label: 'Trail Mix', phrase: 'Trail mix', wordType: 'noun' },
      { emoji: '🥖', label: 'Breadstick', phrase: 'Breadstick', wordType: 'noun' },
    ],
  },

  // ═══ FRUITS (new subcategory) ═══
  {
    id: 'fruits', name: 'Fruits', emoji: '🍓', parentId: 'food',
    items: [
      { emoji: '🍎', label: 'Apple', phrase: 'Apple', wordType: 'noun' },
      { emoji: '🍌', label: 'Banana', phrase: 'Banana', wordType: 'noun' },
      { emoji: '🍓', label: 'Strawberry', phrase: 'Strawberry', wordType: 'noun' },
      { emoji: '🍊', label: 'Orange', phrase: 'Orange', wordType: 'noun' },
      { emoji: '🍇', label: 'Grapes', phrase: 'Grapes', wordType: 'noun' },
      { emoji: '🍉', label: 'Watermelon', phrase: 'Watermelon', wordType: 'noun' },
      { emoji: '🍑', label: 'Peach', phrase: 'Peach', wordType: 'noun' },
      { emoji: '🍒', label: 'Cherry', phrase: 'Cherry', wordType: 'noun' },
      { emoji: '🫐', label: 'Blueberry', phrase: 'Blueberry', wordType: 'noun' },
      { emoji: '🥭', label: 'Mango', phrase: 'Mango', wordType: 'noun' },
      { emoji: '🍍', label: 'Pineapple', phrase: 'Pineapple', wordType: 'noun' },
      { emoji: '🥝', label: 'Kiwi', phrase: 'Kiwi', wordType: 'noun' },
      { emoji: '🍐', label: 'Pear', phrase: 'Pear', wordType: 'noun' },
      { emoji: '🍋', label: 'Lemon', phrase: 'Lemon', wordType: 'noun' },
    ],
  },

  // ═══ VEGETABLES (new subcategory) ═══
  {
    id: 'vegetables', name: 'Vegetables', emoji: '🥦', parentId: 'food',
    items: [
      { emoji: '🥕', label: 'Carrot', phrase: 'Carrot', wordType: 'noun' },
      { emoji: '🥦', label: 'Broccoli', phrase: 'Broccoli', wordType: 'noun' },
      { emoji: '🌽', label: 'Corn', phrase: 'Corn', wordType: 'noun' },
      { emoji: '🥬', label: 'Lettuce', phrase: 'Lettuce', wordType: 'noun' },
      { emoji: '🍅', label: 'Tomato', phrase: 'Tomato', wordType: 'noun' },
      { emoji: '🥒', label: 'Cucumber', phrase: 'Cucumber', wordType: 'noun' },
      { emoji: '🫑', label: 'Pepper', phrase: 'Pepper', wordType: 'noun' },
      { emoji: '🥔', label: 'Potato', phrase: 'Potato', wordType: 'noun' },
      { emoji: '🧅', label: 'Onion', phrase: 'Onion', wordType: 'noun' },
      { emoji: '🍄', label: 'Mushroom', phrase: 'Mushroom', wordType: 'noun' },
      { emoji: '🫛', label: 'Peas', phrase: 'Peas', wordType: 'noun' },
      { emoji: '🌶️', label: 'Hot Pepper', phrase: 'Hot pepper', wordType: 'noun' },
    ],
  },

  // ═══ DESSERTS (new subcategory) ═══
  {
    id: 'desserts', name: 'Desserts', emoji: '🍰', parentId: 'food',
    items: [
      { emoji: '🍰', label: 'Cake', phrase: 'Cake', wordType: 'noun' },
      { emoji: '🍦', label: 'Ice Cream', phrase: 'Ice cream', wordType: 'noun' },
      { emoji: '🧁', label: 'Cupcake', phrase: 'Cupcake', wordType: 'noun' },
      { emoji: '🍩', label: 'Donut', phrase: 'Donut', wordType: 'noun' },
      { emoji: '🍪', label: 'Cookie', phrase: 'Cookie', wordType: 'noun' },
      { emoji: '🥧', label: 'Pie', phrase: 'Pie', wordType: 'noun' },
      { emoji: '🍮', label: 'Pudding', phrase: 'Pudding', wordType: 'noun' },
      { emoji: '🍡', label: 'Candy', phrase: 'Candy', wordType: 'noun' },
      { emoji: '🍫', label: 'Chocolate Bar', phrase: 'Chocolate bar', wordType: 'noun' },
      { emoji: '🧊', label: 'Popsicle', phrase: 'Popsicle', wordType: 'noun' },
      { emoji: '🍬', label: 'Gummy Bears', phrase: 'Gummy bears', wordType: 'noun' },
      { emoji: '🎂', label: 'Birthday Cake', phrase: 'Birthday cake', wordType: 'noun' },
    ],
  },

  // ═══ ACTIVITIES / PLAY (copied from prototype + expanded) ═══
  {
    id: 'activities', name: 'Play', emoji: '⚽', parentId: 'home',
    items: [
      { emoji: '🏃', label: 'Sports', category: 'sports' },
      { emoji: '🎵', label: 'Music', category: 'music' },
      { emoji: '🏕️', label: 'Outdoor', category: 'outdoor' },
      { emoji: '🎮', label: 'Video Games', phrase: 'Play video games', wordType: 'noun' },
      { emoji: '📚', label: 'Read', phrase: 'Read a book', wordType: 'verb' },
      { emoji: '🎨', label: 'Draw', phrase: 'I want to draw', wordType: 'verb' },
      { emoji: '🎵', label: 'Music', phrase: 'Listen to music', wordType: 'noun' },
      { emoji: '🛝', label: 'Playground', phrase: 'Go to playground', wordType: 'noun' },
      { emoji: '🧩', label: 'Puzzle', phrase: 'Do a puzzle', wordType: 'noun' },
      { emoji: '🎭', label: 'Pretend Play', phrase: 'Pretend play', wordType: 'noun' },
      { emoji: '🏊', label: 'Swim', phrase: 'Go swimming', wordType: 'verb' },
      { emoji: '🚲', label: 'Bike', phrase: 'Ride my bike', wordType: 'verb' },
      { emoji: '🤸', label: 'Dance', phrase: 'I want to dance', wordType: 'verb' },
      { emoji: '🎲', label: 'Board Game', phrase: 'Play a game', wordType: 'noun' },
      { emoji: '📺', label: 'TV', phrase: 'Watch TV', wordType: 'noun' },
      { emoji: '🛁', label: 'Bath', phrase: 'Take a bath', wordType: 'noun', arasaacId: 2272 },
      { emoji: '😴', label: 'Rest', phrase: 'I want to rest', wordType: 'verb' },
      { emoji: '🎬', label: 'Movie', phrase: 'Watch a movie', wordType: 'noun' },
      { emoji: '🏗️', label: 'Build', phrase: 'I want to build', wordType: 'verb' },
      { emoji: '🧸', label: 'Toys', phrase: 'Play with toys', wordType: 'noun' },
    ],
  },

  // ═══ SPORTS (new subcategory) ═══
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
      { emoji: '💃', label: 'Dance Music', phrase: 'Play dance music', wordType: 'noun' },
      { emoji: '🔇', label: 'Quiet', phrase: 'Turn it down', wordType: 'descriptor' },
      { emoji: '🔊', label: 'Louder', phrase: 'Turn it up', wordType: 'descriptor' },
      { emoji: '⏭️', label: 'Next Song', phrase: 'Next song please', wordType: 'verb' },
      { emoji: '⏹️', label: 'Stop Music', phrase: 'Stop the music', wordType: 'verb' },
    ],
  },

  // ═══ OUTDOOR (new subcategory) ═══
  {
    id: 'outdoor', name: 'Outdoor', emoji: '🏕️', parentId: 'activities',
    items: [
      { emoji: '🌳', label: 'Park', phrase: 'Go to the park', wordType: 'noun' },
      { emoji: '🏖️', label: 'Beach', phrase: 'Go to the beach', wordType: 'noun' },
      { emoji: '🏕️', label: 'Camping', phrase: 'Go camping', wordType: 'noun' },
      { emoji: '🥾', label: 'Hiking', phrase: 'Go hiking', wordType: 'noun' },
      { emoji: '🎣', label: 'Fishing', phrase: 'Go fishing', wordType: 'noun' },
      { emoji: '🌊', label: 'Swimming', phrase: 'Go to the pool', wordType: 'noun' },
      { emoji: '🏔️', label: 'Mountain', phrase: 'Go to the mountain', wordType: 'noun' },
      { emoji: '🦋', label: 'Nature Walk', phrase: 'Go on a nature walk', wordType: 'noun' },
      { emoji: '🧗', label: 'Climbing', phrase: 'Go climbing', wordType: 'noun' },
      { emoji: '🛝', label: 'Playground', phrase: 'Go to the playground', wordType: 'noun' },
      { emoji: '🌻', label: 'Garden', phrase: 'Go to the garden', wordType: 'noun' },
      { emoji: '⛺', label: 'Tent', phrase: 'Set up the tent', wordType: 'noun' },
    ],
  },

  // ═══ SOCIAL (copied from prototype + expanded) ═══
  {
    id: 'social', name: 'Social', emoji: '💬', parentId: 'home',
    items: [
      { emoji: '👨‍👩‍👧‍👦', label: 'Family', category: 'family' },
      { emoji: '🏘️', label: 'Community', category: 'community' },
      { emoji: '❓', label: 'Questions', category: 'questions' },
      { emoji: '👋', label: 'Hello', phrase: 'Hello!', wordType: 'social' },
      { emoji: '👋', label: 'Goodbye', phrase: 'Goodbye!', wordType: 'social' },
      { emoji: '🤗', label: 'Hug', phrase: 'I want a hug', wordType: 'social' },
      { emoji: '🤝', label: 'Friend', phrase: 'Play with me', wordType: 'social' },
      { emoji: '👨', label: 'Dad', phrase: 'Daddy', wordType: 'noun' },
      { emoji: '👩', label: 'Mom', phrase: 'Mommy', wordType: 'noun' },
      { emoji: '👧', label: 'Sister', phrase: 'Sister', wordType: 'noun' },
      { emoji: '👦', label: 'Brother', phrase: 'Brother', wordType: 'noun' },
      { emoji: '🐕', label: 'Pet', phrase: 'My pet', wordType: 'noun' },
      { emoji: '👩‍🏫', label: 'Teacher', phrase: 'Teacher', wordType: 'noun' },
      { emoji: '💬', label: 'Talk', phrase: 'I want to talk', wordType: 'verb' },
      { emoji: '🙅', label: 'Leave Me Alone', phrase: 'Leave me alone please', wordType: 'social' },
      { emoji: '🤫', label: 'Quiet', phrase: 'It is too loud', wordType: 'social' },
      { emoji: '🧍', label: 'Come Here', phrase: 'Come here', wordType: 'social' },
      { emoji: '↗️', label: 'Go Away', phrase: 'Go away please', wordType: 'social' },
      { emoji: '👏', label: 'Good Job', phrase: 'Good job!', wordType: 'social' },
    ],
  },

  // ═══ FAMILY (new subcategory) ═══
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
      { emoji: '👩‍🦱', label: 'Aunt', phrase: 'Aunt', wordType: 'noun' },
      { emoji: '👨‍🦱', label: 'Uncle', phrase: 'Uncle', wordType: 'noun' },
      { emoji: '🐕', label: 'Dog', phrase: 'My dog', wordType: 'noun' },
      { emoji: '🐱', label: 'Cat', phrase: 'My cat', wordType: 'noun' },
      { emoji: '👫', label: 'Friend', phrase: 'My friend', wordType: 'noun' },
      { emoji: '🏠', label: 'Home', phrase: 'I want to go home', wordType: 'noun' },
    ],
  },

  // ═══ COMMUNITY (new subcategory) ═══
  {
    id: 'community', name: 'Community', emoji: '🏘️', parentId: 'social',
    items: [
      { emoji: '👩‍⚕️', label: 'Doctor', phrase: 'Doctor', wordType: 'noun' },
      { emoji: '👮', label: 'Police', phrase: 'Police officer', wordType: 'noun' },
      { emoji: '🚒', label: 'Firefighter', phrase: 'Firefighter', wordType: 'noun' },
      { emoji: '👩‍🏫', label: 'Teacher', phrase: 'Teacher', wordType: 'noun' },
      { emoji: '🧑‍🍳', label: 'Chef', phrase: 'Chef', wordType: 'noun' },
      { emoji: '📬', label: 'Mail Carrier', phrase: 'Mail carrier', wordType: 'noun' },
      { emoji: '🧑‍🔧', label: 'Mechanic', phrase: 'Mechanic', wordType: 'noun' },
      { emoji: '🧑‍🌾', label: 'Farmer', phrase: 'Farmer', wordType: 'noun' },
      { emoji: '🧑‍⚕️', label: 'Nurse', phrase: 'Nurse', wordType: 'noun' },
      { emoji: '🧑‍✈️', label: 'Pilot', phrase: 'Pilot', wordType: 'noun' },
      { emoji: '👷', label: 'Builder', phrase: 'Builder', wordType: 'noun' },
      { emoji: '🧑‍🎨', label: 'Artist', phrase: 'Artist', wordType: 'noun' },
    ],
  },

  // ═══ QUESTIONS (new subcategory) ═══
  {
    id: 'questions', name: 'Questions', emoji: '❓', parentId: 'social',
    items: [
      { emoji: '❓', label: 'What', phrase: 'What', wordType: 'pronoun' },
      { emoji: '📍', label: 'Where', phrase: 'Where', wordType: 'pronoun' },
      { emoji: '⏰', label: 'When', phrase: 'When', wordType: 'pronoun' },
      { emoji: '👤', label: 'Who', phrase: 'Who', wordType: 'pronoun' },
      { emoji: '🤷', label: 'Why', phrase: 'Why', wordType: 'pronoun' },
      { emoji: '🔧', label: 'How', phrase: 'How', wordType: 'pronoun' },
      { emoji: '🔢', label: 'How Many', phrase: 'How many', wordType: 'pronoun' },
      { emoji: '❓', label: 'What Is It', phrase: 'What is it', wordType: 'social' },
      { emoji: '📍', label: 'Where Is It', phrase: 'Where is it', wordType: 'social' },
      { emoji: '⏰', label: 'What Time', phrase: 'What time is it', wordType: 'social' },
      { emoji: '💡', label: 'Can I', phrase: 'Can I', wordType: 'social' },
      { emoji: '🤔', label: 'Is It', phrase: 'Is it', wordType: 'social' },
    ],
  },

  // ═══ BODY (copied from prototype + expanded) ═══
  {
    id: 'body', name: 'Body', emoji: '🛁', parentId: 'home',
    items: [
      { emoji: '🧼', label: 'Hygiene', category: 'hygiene' },
      { emoji: '🏥', label: 'Medical', category: 'medical' },
      { emoji: '🚽', label: 'Bathroom', phrase: 'I need the bathroom', wordType: 'noun' },
      { emoji: '🤒', label: 'Sick', phrase: 'I feel sick', wordType: 'descriptor' },
      { emoji: '🤕', label: 'Hurt', phrase: 'I am hurt', wordType: 'descriptor' },
      { emoji: '🤧', label: 'Nose', phrase: 'My nose hurts', wordType: 'noun' },
      { emoji: '🦷', label: 'Teeth', phrase: 'My teeth hurt', wordType: 'noun' },
      { emoji: '👂', label: 'Ears', phrase: 'My ears hurt', wordType: 'noun' },
      { emoji: '👀', label: 'Eyes', phrase: 'My eyes hurt', wordType: 'noun' },
      { emoji: '🤢', label: 'Tummy', phrase: 'My tummy hurts', wordType: 'noun' },
      { emoji: '🦵', label: 'Leg', phrase: 'My leg hurts', wordType: 'noun' },
      { emoji: '✋', label: 'Hand', phrase: 'My hand hurts', wordType: 'noun' },
      { emoji: '😪', label: 'Sleepy', phrase: 'I am sleepy', wordType: 'descriptor' },
      { emoji: '🥵', label: 'Hot', phrase: 'I am hot', wordType: 'descriptor' },
      { emoji: '🥶', label: 'Cold', phrase: 'I am cold', wordType: 'descriptor' },
      { emoji: '🫧', label: 'Wash Hands', phrase: 'Wash my hands', wordType: 'verb', arasaacId: 8975 },
      { emoji: '🪥', label: 'Brush Teeth', phrase: 'Brush teeth', wordType: 'verb', arasaacId: 2694 },
      { emoji: '👕', label: 'Change Clothes', phrase: 'Change my clothes', wordType: 'verb' },
      { emoji: '💆', label: 'Head', phrase: 'My head hurts', wordType: 'noun' },
      { emoji: '🦶', label: 'Foot', phrase: 'My foot hurts', wordType: 'noun' },
    ],
  },

  // ═══ HYGIENE (new subcategory) ═══
  {
    id: 'hygiene', name: 'Hygiene', emoji: '🧼', parentId: 'body',
    items: [
      { emoji: '🫧', label: 'Wash Hands', phrase: 'Wash my hands', wordType: 'verb', arasaacId: 8975 },
      { emoji: '🪥', label: 'Brush Teeth', phrase: 'Brush my teeth', wordType: 'verb', arasaacId: 2694 },
      { emoji: '🛁', label: 'Bath', phrase: 'Take a bath', wordType: 'noun', arasaacId: 2272 },
      { emoji: '🚿', label: 'Shower', phrase: 'Take a shower', wordType: 'noun' },
      { emoji: '🧴', label: 'Lotion', phrase: 'Put on lotion', wordType: 'noun' },
      { emoji: '🧽', label: 'Wash Face', phrase: 'Wash my face', wordType: 'verb', arasaacId: 8975 },
      { emoji: '💇', label: 'Hair', phrase: 'Brush my hair', wordType: 'verb', arasaacId: 2695 },
      { emoji: '🧻', label: 'Tissue', phrase: 'I need a tissue', wordType: 'noun' },
      { emoji: '👕', label: 'Change Clothes', phrase: 'Change my clothes', wordType: 'verb' },
      { emoji: '🩹', label: 'Band-Aid', phrase: 'I need a band-aid', wordType: 'noun' },
      { emoji: '💅', label: 'Nails', phrase: 'Cut my nails', wordType: 'noun', arasaacId: 2783 },
      { emoji: '👃', label: 'Blow Nose', phrase: 'Blow my nose', wordType: 'verb' },
    ],
  },

  // ═══ MEDICAL (new subcategory) ═══
  {
    id: 'medical', name: 'Medical', emoji: '🏥', parentId: 'body',
    items: [
      { emoji: '👩‍⚕️', label: 'Doctor', phrase: 'I need the doctor', wordType: 'noun' },
      { emoji: '💊', label: 'Medicine', phrase: 'I need my medicine', wordType: 'noun' },
      { emoji: '🤒', label: 'Fever', phrase: 'I have a fever', wordType: 'noun' },
      { emoji: '🩹', label: 'Band-Aid', phrase: 'I need a band-aid', wordType: 'noun' },
      { emoji: '🤧', label: 'Cold', phrase: 'I have a cold', wordType: 'noun' },
      { emoji: '🤮', label: 'Throw Up', phrase: 'I think I will throw up', wordType: 'verb' },
      { emoji: '😵‍💫', label: 'Dizzy', phrase: 'I feel dizzy', wordType: 'descriptor' },
      { emoji: '🦴', label: 'Bone Hurts', phrase: 'My bone hurts', wordType: 'noun' },
      { emoji: '🩺', label: 'Check Up', phrase: 'I have a check up', wordType: 'noun' },
      { emoji: '💉', label: 'Shot', phrase: 'I am scared of the shot', wordType: 'noun' },
      { emoji: '🤕', label: 'Hurt', phrase: 'I am hurt', wordType: 'descriptor' },
      { emoji: '🫁', label: 'Hard To Breathe', phrase: 'It is hard to breathe', wordType: 'descriptor' },
    ],
  },

  // ═══ SCHOOL (copied from prototype + expanded) ═══
  {
    id: 'school', name: 'School', emoji: '🏫', parentId: 'home',
    items: [
      { emoji: '📖', label: 'Reading', phrase: 'Time to read', wordType: 'verb' },
      { emoji: '➕', label: 'Math', phrase: 'Do math', wordType: 'noun' },
      { emoji: '🖊️', label: 'Writing', phrase: 'Write', wordType: 'verb' },
      { emoji: '🎨', label: 'Art', phrase: 'Art class', wordType: 'noun' },
      { emoji: '🎵', label: 'Music Class', phrase: 'Music class', wordType: 'noun' },
      { emoji: '🏃', label: 'Gym', phrase: 'Gym class', wordType: 'noun' },
      { emoji: '🤚', label: 'Raise Hand', phrase: 'I have a question', wordType: 'verb' },
      { emoji: '🚻', label: 'Bathroom', phrase: 'Bathroom break please', wordType: 'noun' },
      { emoji: '🍱', label: 'Lunch', phrase: 'Lunchtime', wordType: 'noun' },
      { emoji: '🏠', label: 'Go Home', phrase: 'I want to go home', wordType: 'verb' },
      { emoji: '😕', label: 'Do Not Understand', phrase: 'I do not understand', wordType: 'social' },
      { emoji: '💺', label: 'Sit Down', phrase: 'Sit down', wordType: 'verb' },
      { emoji: '🖥️', label: 'Computer', phrase: 'Computer time', wordType: 'noun' },
      { emoji: '📦', label: 'Put Away', phrase: 'Put it away', wordType: 'verb' },
      { emoji: '🤝', label: 'Partner', phrase: 'Work with a partner', wordType: 'noun' },
      { emoji: '⏰', label: 'Break', phrase: 'I need a break', wordType: 'social' },
      { emoji: '🔬', label: 'Science', phrase: 'Science class', wordType: 'noun' },
      { emoji: '🌎', label: 'Social Studies', phrase: 'Social studies', wordType: 'noun' },
      { emoji: '🔢', label: 'Numbers', phrase: 'Count the numbers', wordType: 'noun' },
      { emoji: '🗓️', label: 'Calendar', phrase: 'Calendar time', wordType: 'noun' },
      { emoji: '🎒', label: 'Backpack', phrase: 'Get my backpack', wordType: 'noun' },
      { emoji: '✏️', label: 'Pencil', phrase: 'I need a pencil', wordType: 'noun' },
      { emoji: '📐', label: 'Ruler', phrase: 'I need a ruler', wordType: 'noun', arasaacId: 2815 },
      { emoji: '🧪', label: 'Experiment', phrase: 'Do an experiment', wordType: 'noun' },
    ],
  },

  // ═══ BEDTIME (copied from prototype) ═══
  {
    id: 'bedtime', name: 'Bedtime', emoji: '🌙', parentId: 'home',
    items: [
      { emoji: '😴', label: 'Sleepy', phrase: 'I am sleepy', wordType: 'descriptor' },
      { emoji: '🪥', label: 'Brush Teeth', phrase: 'Brush teeth', wordType: 'verb', arasaacId: 2694 },
      { emoji: '🛁', label: 'Bath', phrase: 'Bath time', wordType: 'noun', arasaacId: 2272 },
      { emoji: '📖', label: 'Story', phrase: 'Read me a story', wordType: 'noun' },
      { emoji: '🌙', label: 'Goodnight', phrase: 'Goodnight', wordType: 'social' },
      { emoji: '🤗', label: 'Hug', phrase: 'I want a hug', wordType: 'social' },
      { emoji: '💡', label: 'Light Off', phrase: 'Turn off the light', wordType: 'verb' },
      { emoji: '💡', label: 'Night Light', phrase: 'I want the night light', wordType: 'noun' },
      { emoji: '😟', label: 'Scared', phrase: 'I am scared', wordType: 'descriptor' },
      { emoji: '🥤', label: 'Water', phrase: 'I want water', wordType: 'noun' },
      { emoji: '🧸', label: 'Stuffed Animal', phrase: 'I want my stuffed animal', wordType: 'noun' },
      { emoji: '🎵', label: 'Music', phrase: 'Play music', wordType: 'noun' },
      { emoji: '🛏️', label: 'Bed', phrase: 'Go to bed', wordType: 'noun' },
      { emoji: '👕', label: 'Pajamas', phrase: 'Put on pajamas', wordType: 'noun' },
      { emoji: '🧸', label: 'Blanket', phrase: 'I want my blanket', wordType: 'noun' },
      { emoji: '🚪', label: 'Door Open', phrase: 'Leave the door open', wordType: 'verb' },
    ],
  },

  // ═══ ANIMALS (new category) ═══
  {
    id: 'animals', name: 'Animals', emoji: '🐾', parentId: 'home',
    items: [
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
    ],
  },

  // ═══ PLACES (new category) ═══
  {
    id: 'places', name: 'Places', emoji: '🌍', parentId: 'home',
    items: [
      { emoji: '🏠', label: 'Home', phrase: 'Home', wordType: 'noun' },
      { emoji: '🏫', label: 'School', phrase: 'School', wordType: 'noun' },
      { emoji: '🏥', label: 'Hospital', phrase: 'Hospital', wordType: 'noun' },
      { emoji: '🏪', label: 'Store', phrase: 'Go to the store', wordType: 'noun' },
      { emoji: '🌳', label: 'Park', phrase: 'Go to the park', wordType: 'noun' },
      { emoji: '📚', label: 'Library', phrase: 'Go to the library', wordType: 'noun' },
      { emoji: '🍽️', label: 'Restaurant', phrase: 'Go to a restaurant', wordType: 'noun' },
      { emoji: '⛪', label: 'Church', phrase: 'Go to church', wordType: 'noun' },
      { emoji: '🏖️', label: 'Beach', phrase: 'Go to the beach', wordType: 'noun' },
      { emoji: '🏊', label: 'Pool', phrase: 'Go to the pool', wordType: 'noun' },
      { emoji: '🎪', label: 'Circus', phrase: 'Go to the circus', wordType: 'noun' },
      { emoji: '🎢', label: 'Amusement Park', phrase: 'Go to the amusement park', wordType: 'noun' },
      { emoji: '🏟️', label: 'Stadium', phrase: 'Go to the stadium', wordType: 'noun' },
      { emoji: '🐻', label: 'Zoo', phrase: 'Go to the zoo', wordType: 'noun' },
      { emoji: '🛒', label: 'Grocery Store', phrase: 'Go to the grocery store', wordType: 'noun' },
      { emoji: '💈', label: 'Barber', phrase: 'Go to the barber', wordType: 'noun' },
      { emoji: '🏦', label: 'Bank', phrase: 'Go to the bank', wordType: 'noun' },
      { emoji: '🧑‍⚕️', label: 'Dentist', phrase: 'Go to the dentist', wordType: 'noun' },
      { emoji: '🏋️', label: 'Gym', phrase: 'Go to the gym', wordType: 'noun' },
      { emoji: '🍕', label: 'Pizza Place', phrase: 'Go to the pizza place', wordType: 'noun' },
    ],
  },

  // ═══ CLOTHING (new category) ═══
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
      { emoji: '🩷', label: 'Pink', phrase: 'Pink', wordType: 'descriptor' },
      { emoji: '🟤', label: 'Brown', phrase: 'Brown', wordType: 'descriptor' },
      { emoji: '⚫', label: 'Black', phrase: 'Black', wordType: 'descriptor' },
      { emoji: '⚪', label: 'White', phrase: 'White', wordType: 'descriptor' },
      { emoji: '🔶', label: 'Diamond', phrase: 'Diamond shape', wordType: 'noun' },
      { emoji: '🔷', label: 'Square', phrase: 'Square', wordType: 'noun' },
      { emoji: '🔺', label: 'Triangle', phrase: 'Triangle', wordType: 'noun' },
      { emoji: '⭕', label: 'Circle', phrase: 'Circle', wordType: 'noun' },
      { emoji: '⬛', label: 'Rectangle', phrase: 'Rectangle', wordType: 'noun' },
      { emoji: '⭐', label: 'Star', phrase: 'Star', wordType: 'noun' },
      { emoji: '💜', label: 'Heart', phrase: 'Heart shape', wordType: 'noun' },
      { emoji: '🌈', label: 'Rainbow', phrase: 'Rainbow', wordType: 'noun' },
    ],
  },

  // ═══ TIME WORDS (new subcategory for core temporal concepts) ═══
  {
    id: 'timewords', name: 'Time Words', emoji: '⏰', parentId: null,
    items: [
      { emoji: '☀️', label: 'Today', phrase: 'Today', wordType: 'descriptor' },
      { emoji: '📅', label: 'Tomorrow', phrase: 'Tomorrow', wordType: 'descriptor' },
      { emoji: '↩️', label: 'Yesterday', phrase: 'Yesterday', wordType: 'descriptor' },
      { emoji: '🌅', label: 'Morning', phrase: 'Morning', wordType: 'noun' },
      { emoji: '🌞', label: 'Afternoon', phrase: 'Afternoon', wordType: 'noun' },
      { emoji: '🌙', label: 'Night', phrase: 'Night', wordType: 'noun' },
      { emoji: '⏰', label: 'Now', phrase: 'Now', wordType: 'descriptor' },
      { emoji: '⏳', label: 'Later', phrase: 'Later', wordType: 'descriptor' },
      { emoji: '🔜', label: 'Soon', phrase: 'Soon', wordType: 'descriptor' },
      { emoji: '⏸️', label: 'Wait', phrase: 'Wait', wordType: 'descriptor' },
      { emoji: '✅', label: 'Finished', phrase: 'Finished', wordType: 'descriptor' },
      { emoji: '🔙', label: 'Before', phrase: 'Before', wordType: 'preposition' },
      { emoji: '🔜', label: 'After', phrase: 'After', wordType: 'preposition' },
      { emoji: '🏁', label: 'First', phrase: 'First', wordType: 'descriptor' },
      { emoji: '2️⃣', label: 'Then', phrase: 'Then', wordType: 'descriptor' },
      { emoji: '🔚', label: 'Last', phrase: 'Last', wordType: 'descriptor' },
    ],
  },

  // ═══ DESCRIPTORS / ADJECTIVES (new — expanded word types) ═══
  {
    id: 'descriptors', name: 'Describing Words', emoji: '📝', parentId: null,
    items: [
      { emoji: '🔝', label: 'Big', phrase: 'Big', wordType: 'descriptor' },
      { emoji: '🔽', label: 'Small', phrase: 'Small', wordType: 'descriptor' },
      { emoji: '🥵', label: 'Hot', phrase: 'Hot', wordType: 'descriptor' },
      { emoji: '🥶', label: 'Cold', phrase: 'Cold', wordType: 'descriptor' },
      { emoji: '⚡', label: 'Fast', phrase: 'Fast', wordType: 'descriptor' },
      { emoji: '🐌', label: 'Slow', phrase: 'Slow', wordType: 'descriptor' },
      { emoji: '💪', label: 'Strong', phrase: 'Strong', wordType: 'descriptor' },
      { emoji: '😴', label: 'Soft', phrase: 'Soft', wordType: 'descriptor' },
      { emoji: '🧱', label: 'Hard', phrase: 'Hard', wordType: 'descriptor' },
      { emoji: '🧽', label: 'Wet', phrase: 'Wet', wordType: 'descriptor' },
      { emoji: '☀️', label: 'Dry', phrase: 'Dry', wordType: 'descriptor' },
      { emoji: '🆕', label: 'New', phrase: 'New', wordType: 'descriptor' },
      { emoji: '📦', label: 'Old', phrase: 'Old', wordType: 'descriptor' },
      { emoji: '😊', label: 'Nice', phrase: 'Nice', wordType: 'descriptor' },
      { emoji: '😠', label: 'Mean', phrase: 'Mean', wordType: 'descriptor' },
      { emoji: '🧹', label: 'Clean', phrase: 'Clean', wordType: 'descriptor' },
      { emoji: '🗑️', label: 'Dirty', phrase: 'Dirty', wordType: 'descriptor' },
      { emoji: '🔊', label: 'Loud', phrase: 'Loud', wordType: 'descriptor' },
      { emoji: '🤫', label: 'Quiet', phrase: 'Quiet', wordType: 'descriptor' },
      { emoji: '😁', label: 'Funny', phrase: 'Funny', wordType: 'descriptor' },
      { emoji: '😢', label: 'Sad', phrase: 'Sad', wordType: 'descriptor' },
      { emoji: '😨', label: 'Scary', phrase: 'Scary', wordType: 'descriptor' },
      { emoji: '✨', label: 'Pretty', phrase: 'Pretty', wordType: 'descriptor' },
      { emoji: '👎', label: 'Ugly', phrase: 'Ugly', wordType: 'descriptor' },
    ],
  },

  // ═══ VERBS / ACTION WORDS (new — expanded word types) ═══
  {
    id: 'verbs', name: 'Action Words', emoji: '🏃', parentId: null,
    items: [
      { emoji: '🚶', label: 'Walk', phrase: 'Walk', wordType: 'verb' },
      { emoji: '🏃', label: 'Run', phrase: 'Run', wordType: 'verb' },
      { emoji: '🤸', label: 'Jump', phrase: 'Jump', wordType: 'verb' },
      { emoji: '💃', label: 'Dance', phrase: 'Dance', wordType: 'verb' },
      { emoji: '🏊', label: 'Swim', phrase: 'Swim', wordType: 'verb' },
      { emoji: '🧗', label: 'Climb', phrase: 'Climb', wordType: 'verb' },
      { emoji: '🤲', label: 'Hold', phrase: 'Hold', wordType: 'verb' },
      { emoji: '🫳', label: 'Drop', phrase: 'Drop', wordType: 'verb' },
      { emoji: '🫸', label: 'Push', phrase: 'Push', wordType: 'verb' },
      { emoji: '🫷', label: 'Pull', phrase: 'Pull', wordType: 'verb' },
      { emoji: '🧹', label: 'Clean', phrase: 'Clean', wordType: 'verb' },
      { emoji: '🍳', label: 'Cook', phrase: 'Cook', wordType: 'verb' },
      { emoji: '✂️', label: 'Cut', phrase: 'Cut', wordType: 'verb' },
      { emoji: '📐', label: 'Draw', phrase: 'Draw', wordType: 'verb' },
      { emoji: '✍️', label: 'Write', phrase: 'Write', wordType: 'verb' },
      { emoji: '📖', label: 'Read', phrase: 'Read', wordType: 'verb' },
      { emoji: '🗣️', label: 'Talk', phrase: 'Talk', wordType: 'verb' },
      { emoji: '👂', label: 'Listen', phrase: 'Listen', wordType: 'verb' },
      { emoji: '👁️', label: 'Look', phrase: 'Look', wordType: 'verb' },
      { emoji: '🛏️', label: 'Sleep', phrase: 'Sleep', wordType: 'verb' },
      { emoji: '🍽️', label: 'Eat', phrase: 'Eat', wordType: 'verb' },
      { emoji: '🥤', label: 'Drink', phrase: 'Drink', wordType: 'verb' },
      { emoji: '🧠', label: 'Think', phrase: 'Think', wordType: 'verb' },
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
      { emoji: '🥵', label: 'Hot Outside', phrase: 'It is hot outside', wordType: 'descriptor' },
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
      symbols.push({
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
      });
    });
  }

  return symbols;
}

// ── Symbol count validation ──
// Total symbols across all boards:
// home(20) + quickfires(12) + corewords(50) + repairs(12) + feelings(24) +
// food(19) + drinks(10) + meals(16) + snacks(14) + fruits(14) + vegetables(12) + desserts(12) +
// activities(20) + sports(12) + music(12) + outdoor(12) +
// social(19) + family(14) + community(12) + questions(12) +
// body(20) + hygiene(12) + medical(12) +
// school(24) + bedtime(16) + animals(30) + places(20) + clothing(16) +
// colors(18) + timewords(16) + descriptors(24) + verbs(24) + weather(10) + numbers(12)
// = 570+ symbols

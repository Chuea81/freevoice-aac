// src/data/wordPredictions.ts

export const NEXT_WORD_PREDICTIONS: Record<string, string[]> = {
  // Sentence starters (used when sentence is empty)
  __start__: ['I', 'You', 'We', "Let's", 'Can', 'The', 'My',
              'It', 'This', 'What', 'Help', 'More'],

  // Pronouns
  'i': ['want', 'am', 'need', 'like', 'have', 'can', 'see',
        'feel', 'will', "don't", 'love', 'go'],
  'you': ['are', 'want', 'can', 'have', 'need', 'like', 'will',
          'should', 'must', 'do'],
  'he': ['is', 'wants', 'has', 'can', 'will', 'needs', 'likes',
         'said', 'does', 'went'],
  'she': ['is', 'wants', 'has', 'can', 'will', 'needs', 'likes',
          'said', 'does', 'went'],
  'we': ['are', 'can', 'want', 'have', 'need', 'will', 'should',
         'go', 'like', 'must'],
  'they': ['are', 'want', 'have', 'can', 'will', 'need', 'like',
           'go', 'said', 'do'],
  'it': ['is', 'was', 'will', 'can', 'hurts', 'looks', 'feels',
         'works', 'tastes', 'smells'],

  // Common verbs
  'want': ['to', 'more', 'that', 'it', 'the', 'a', 'some',
           'this', 'food', 'water', 'help'],
  'need': ['to', 'help', 'more', 'a', 'the', 'water', 'food',
           'it', 'that', 'this', 'break'],
  'like': ['to', 'it', 'that', 'this', 'the', 'a', 'you',
           'them', 'more', 'playing'],
  'go': ['to', 'home', 'outside', 'there', 'now', 'away',
         'back', 'up', 'down', 'play'],
  'have': ['to', 'a', 'it', 'more', 'some', 'the', 'fun',
           'that', 'this', 'one'],
  'can': ['I', 'you', 'we', 'have', 'go', 'play', 'see',
          'help', 'do', 'get'],
  'am': ['happy', 'sad', 'hungry', 'tired', 'done', 'okay',
         'good', 'mad', 'scared', 'ready'],
  'is': ['it', 'this', 'that', 'good', 'bad', 'fun', 'here',
         'there', 'mine', 'yours'],
  'are': ['you', 'we', 'they', 'happy', 'done', 'okay', 'here',
          'there', 'ready', 'good'],
  'feel': ['happy', 'sad', 'sick', 'tired', 'good', 'bad',
           'scared', 'mad', 'hungry', 'okay'],
  'see': ['you', 'it', 'that', 'the', 'a', 'them', 'more',
          'this', 'something', 'me'],
  'play': ['with', 'outside', 'the', 'a', 'game', 'now',
           'together', 'more', 'here', 'ball'],
  'eat': ['food', 'lunch', 'dinner', 'breakfast', 'it', 'more',
          'now', 'a', 'the', 'snack'],
  'drink': ['water', 'milk', 'juice', 'it', 'more', 'a', 'the',
            'something', 'now', 'please'],
  'let\'s': ['go', 'play', 'eat', 'do', 'make', 'see', 'try',
             'read', 'watch', 'have'],

  // Articles & prepositions
  'to': ['the', 'go', 'play', 'eat', 'see', 'do', 'be', 'have',
         'my', 'school', 'home', 'bed'],
  'the': ['bathroom', 'door', 'food', 'water', 'park', 'car',
          'house', 'dog', 'cat', 'ball', 'book'],
  'a': ['little', 'lot', 'drink', 'snack', 'break', 'hug',
        'book', 'toy', 'ball', 'turn'],
  'my': ['turn', 'mom', 'dad', 'food', 'water', 'toy', 'book',
         'friend', 'home', 'tummy', 'head'],
  'more': ['please', 'food', 'water', 'time', 'juice', 'milk',
           'help', 'of', 'it', 'that'],
  'with': ['you', 'me', 'them', 'my', 'the', 'a', 'mom', 'dad',
           'friend', 'toys'],

  // Question words
  'what': ['is', 'do', 'are', 'time', 'happened', 'can', 'will',
           'about', 'now', "you're"],
  'where': ['is', 'are', 'do', 'did', 'can', 'will', 'we',
            'you', 'the', 'my'],
  'when': ['is', 'are', 'do', 'can', 'will', 'we', 'you',
           'did', 'the', 'can'],
  'who': ['is', 'are', 'wants', 'did', 'can', 'will', 'has',
          'said', 'took', 'made'],
  'why': ['is', 'are', 'do', 'did', 'not', 'can', 'will',
          'would', 'would', "can't"],

  // Social
  'help': ['me', 'please', 'with', 'now', 'you', 'us', 'them',
           'me please', 'with this', 'finding'],
  'thank': ['you', 'you so much', 'you very much'],
  'i\'m': ['happy', 'sad', 'hungry', 'tired', 'done', 'okay',
           'sorry', 'good', 'scared', 'ready', 'mad'],
  'please': ['help', 'stop', 'more', 'give', 'can', 'and thank you',
             'wait', 'come', 'go', 'now'],
};

// Default fallback when a word has no specific predictions
export const DEFAULT_PREDICTIONS: string[] = [
  'and', 'the', 'to', 'a', 'is', 'it', 'please', 'more',
  'I', 'you', 'want', 'help'
];

// Get predictions for the last word in the sentence
export function getPredictions(lastWord: string | null): string[] {
  if (!lastWord) {
    return NEXT_WORD_PREDICTIONS['__start__'];
  }
  const key = lastWord.toLowerCase().trim();
  return NEXT_WORD_PREDICTIONS[key] || DEFAULT_PREDICTIONS;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dir, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load reference style image for consistency
const REFERENCE_PATH = join(__dir, 'reference.png');
let referenceImage = null;

if (existsSync(REFERENCE_PATH)) {
  const data = readFileSync(REFERENCE_PATH);
  referenceImage = {
    inlineData: {
      data: data.toString('base64'),
      mimeType: 'image/png',
    },
  };
  console.log('✅ Style reference image loaded:', REFERENCE_PATH);
} else {
  console.log('⚠️  No reference.png found — generating without style reference');
}

const BASE_STYLE_PROMPT = `
Generate a 500x500 pixel image that FILLS THE ENTIRE CANVAS edge to edge.
AAC (Augmentative and Alternative Communication) pictogram symbol.
Style: ARASAAC-inspired — simple, clear, bold black outlines, flat bright colors.
The subject must be LARGE and fill at least 80% of the canvas.
Background: solid dark navy blue (#0C1428) filling the entire image.
DO NOT add a white background. DO NOT add borders or frames.
DO NOT make the symbol small in the center — it must be BIG.
No text, no labels, no letters, no watermarks, no borders.
Single centered subject drawn large and clear.
Thick consistent black outlines. Flat vivid color fills.
Must be recognizable at 60x60 pixels by a 3-year-old child.
`.trim();

const CATEGORY_STYLE_HINTS = {
  food: 'Simple food pictogram. Clear recognizable shape. Bright flat colors. Like an ARASAAC food symbol but cleaner.',
  drinks: 'Simple drink pictogram. Clear vessel shape with visible liquid. Flat colors, bold outlines.',
  emotions: 'Simple face showing emotion clearly. Round face, minimal features, big clear expression. ARASAAC emotion style.',
  people: 'Simple person pictogram. Clear role identifier (uniform, tool, etc). ARASAAC person style.',
  places: 'Simple building/location pictogram. Recognizable shape, minimal detail. ARASAAC style.',
  activities: 'Simple action pictogram. Clear pose or equipment. ARASAAC activity style.',
  body: 'Simple body part or health pictogram. Clear, clinical but friendly. ARASAAC body style.',
  school: 'Simple school object pictogram. Recognizable shape. ARASAAC school supply style.',
  social: 'Simple social interaction pictogram. Clear gesture or scene. ARASAAC style.',
  nature: 'Simple nature pictogram. Clear shape, bright colors. ARASAAC style.',
  animals: 'Simple animal pictogram. Recognizable species, friendly. Bold outlines, flat colors. ARASAAC animal style.',
  default: 'Simple clear pictogram. Bold outlines, flat colors. ARASAAC style.',
};

// Food subcategory type hints for disambiguation
const FOOD_TYPE_HINTS = {
  'american': 'hamburger, hot dog, or french fries',
  'mexican & latin': 'taco, burrito, or tortilla',
  'food_american': 'hamburger, hot dog, or french fries',
  'food_latin': 'taco, burrito, or enchilada',
  'food_eastasian': 'noodles, rice bowl, or dumpling',
  'food_southasian': 'curry bowl or rice dish',
  'food_middleeastern': 'flatbread, hummus, or kebab',
  'food_african': 'african stew or grain bowl',
  'food_caribbean': 'tropical fruit or rice and beans',
  'food_soul': 'fried chicken, collard greens, or cornbread',
};

export async function generateSymbol({ label, category = 'default', subcategory = '', extraPrompt = '' }) {
  const categoryHint = CATEGORY_STYLE_HINTS[category.toLowerCase()] || CATEGORY_STYLE_HINTS.default;

  // Build full context string
  let fullContext = label;
  if (subcategory && subcategory !== category) {
    fullContext = `${subcategory} (${label})`;
  } else if (category && category !== 'default') {
    fullContext = `${category} - ${label}`;
  }

  // Add category-specific clarification with food type hints
  let clarification = '';
  if (category === 'food') {
    const foodHint = FOOD_TYPE_HINTS[subcategory?.toLowerCase()] || FOOD_TYPE_HINTS[label?.toLowerCase()];
    clarification = `
CRITICAL: This is FOOD, not patriotism, emotion, flags, or unrelated concepts.
Generate an actual food item (dish, ingredient, or meal).${foodHint ? `\nSpecifically: ${foodHint}` : ''}
NOT: flags, eagles, patriotic symbols, faces, or anything non-food.`;
  } else if (category === 'drinks') {
    clarification = `
CRITICAL: This is a DRINK/BEVERAGE.
Generate a drinkable item in a cup, glass, or bottle.
Examples: cup of coffee, glass of juice, soda can, water bottle, milk carton.
NOT: food items, patriotic symbols, or non-beverage objects.`;
  }

  const prompt = `
${BASE_STYLE_PROMPT}

Category context: ${categoryHint}

Subject: ${fullContext}${clarification}

${extraPrompt ? `Additional detail: ${extraPrompt}` : ''}

Create a single clear AAC communication symbol for "${label}".
The image should be immediately recognizable to a child.
  `.trim();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

  // Include reference image if available
  const parts = [];
  if (referenceImage) {
    parts.push(referenceImage);
    parts.push({ text: 'Match this style EXACTLY — same bold outlines, same vivid colors, same level of detail. Generate a new symbol:\n\n' + prompt });
  } else {
    parts.push({ text: prompt });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['image', 'text'] },
  });

  const response = result.response;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType, prompt };
    }
  }

  // Fallback without reference
  try {
    const fbResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['image', 'text'] },
    });
    for (const part of fbResult.response.candidates[0].content.parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType, prompt };
      }
    }
  } catch (fbErr) {
    console.error('Fallback also failed:', fbErr.message);
  }

  throw new Error('No image returned from any model');
}

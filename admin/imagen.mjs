import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dir, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

export async function generateSymbol({ label, category = 'default', extraPrompt = '' }) {
  const categoryHint = CATEGORY_STYLE_HINTS[category.toLowerCase()] || CATEGORY_STYLE_HINTS.default;

  const prompt = `
${BASE_STYLE_PROMPT}

Category context: ${categoryHint}

Subject: ${label}

${extraPrompt ? `Additional detail: ${extraPrompt}` : ''}

Create a single clear AAC communication symbol for "${label}".
The image should be immediately recognizable to a child.
  `.trim();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['image'],
    },
  });

  const response = result.response;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType, prompt };
    }
  }

  // Fallback: try gemini-2.5-flash-image for image generation
  try {
    const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    const fbResult = await fallbackModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['image', 'text'] },
    });
    for (const part of fbResult.response.candidates[0].content.parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType, prompt };
      }
    }
  } catch (fbErr) {
    console.error('Fallback model also failed:', fbErr.message);
  }

  throw new Error('No image returned from any model');
}

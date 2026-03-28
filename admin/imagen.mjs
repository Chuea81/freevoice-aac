import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dir, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BASE_STYLE_PROMPT = `
Generate an AAC pictogram symbol in the ARASAAC style.
ARASAAC is the clinical standard used by speech therapists worldwide.

STYLE RULES — follow these exactly:
- Simple clear line drawing with BOLD BLACK OUTLINES
- FLAT bright colors — no gradients, no shadows, no 3D effects
- White or very light background for the symbol area
- Simple shapes, minimal detail — a child must understand it instantly
- Looks hand-drawn but clean and professional
- Similar to symbols at arasaac.org — the international AAC standard
- Subject fills most of the frame, centered
- Thick consistent black outlines around every shape
- Flat solid color fills inside the outlines
- Skin-toned people when showing humans (light peachy skin tone)
- NO text, NO labels, NO letters in the image
- NO 3D effects, NO gradients, NO shine, NO glow
- NO realistic rendering — keep it simple and flat

The image should look like it belongs in an ARASAAC symbol set.
Clean. Simple. Bold outlines. Flat colors. Instantly recognizable.
A 3-year-old nonverbal child needs to understand this symbol.
`.trim();

const CATEGORY_STYLE_HINTS = {
  food: 'ARASAAC-style food pictogram. Simple recognizable food shape. Bold outlines, flat colors.',
  drinks: 'ARASAAC-style drink pictogram. Simple cup or glass shape. Bold outlines, flat colors.',
  emotions: 'ARASAAC-style emotion face. Simple round face, bold expression. Flat colors.',
  people: 'ARASAAC-style person pictogram. Simple body, clear role identifier. Flat colors.',
  places: 'ARASAAC-style building pictogram. Simple recognizable shape. Flat colors.',
  activities: 'ARASAAC-style action pictogram. Simple figure doing the action. Flat colors.',
  body: 'ARASAAC-style body pictogram. Simple, clear, medical-friendly. Flat colors.',
  school: 'ARASAAC-style school supply pictogram. Simple object. Flat colors.',
  social: 'ARASAAC-style social pictogram. Simple gesture or interaction. Flat colors.',
  nature: 'ARASAAC-style nature pictogram. Simple plant or animal shape. Flat colors.',
  animals: 'ARASAAC-style animal pictogram. Simple friendly animal. Bold outlines, flat colors.',
  default: 'ARASAAC-style pictogram. Bold black outlines, flat bright colors, simple and clear.',
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

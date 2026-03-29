import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dir, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load reference style image — pick your best symbol and save it as admin/reference.png
// Every generation will use this as a style reference for consistency
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
  console.log('⚠️  No reference.png found in admin/ — generating without style reference');
  console.log('   To improve consistency, save your best symbol as admin/reference.png');
}

const BASE_STYLE_PROMPT = `
You are generating AAC pictogram symbols for a communication app used by nonverbal children.

CRITICAL — MATCH THIS EXACT STYLE:
- Transparent or white background. Isolated object, nothing behind it.
- Bold thick colorful outlines matching the object's color. Rich vibrant saturated colors. No thin lines. No sketchy style. Bold chunky cartoon style like a children's app icon.
- FLAT bright colors — absolutely no gradients, no shadows, no 3D
- Minimal detail — only what's needed to recognize the subject
- Consistent line weight throughout the entire image
- Skin-toned people (light peachy tone) when showing humans
- Simple round heads, dot eyes, minimal facial features
- Objects drawn from a straight-on or slight 3/4 angle
- NO text, NO labels, NO letters anywhere in the image
- Must be recognizable by a 3-year-old at 60x60 pixels
- Professional clinical quality — used by speech therapists

MATCH THE REFERENCE IMAGE STYLE EXACTLY.
Every symbol must look like it was drawn by the same artist.
Same line weight. Same color saturation. Same level of detail.
Same perspective. Same proportions.
`.trim();

const CATEGORY_STYLE_HINTS = {
  food: 'Simple food drawing. Recognizable shape, flat colors, bold outlines. Front-facing view.',
  drinks: 'Simple drink in a clear cup/glass. Bold outlines, flat liquid color.',
  emotions: 'Simple round face with clear expression. Bold outlines, minimal features.',
  people: 'Simple person figure. Clear role (uniform/tool). Bold outlines, flat colors.',
  places: 'Simple building front view. Recognizable features, bold outlines.',
  activities: 'Simple figure doing the action. Clear pose, bold outlines.',
  body: 'Simple body part or health symbol. Clear, friendly, bold outlines.',
  school: 'Simple school object. Recognizable shape, bold outlines.',
  social: 'Simple interaction scene. Clear gesture, bold outlines.',
  nature: 'Simple nature element. Clear shape, bold outlines.',
  animals: 'Simple animal drawing. Recognizable species, friendly face, bold outlines.',
  default: 'Simple pictogram. Bold black outlines, flat bright colors.',
};

export async function generateSymbol({ label, category = 'default', extraPrompt = '' }) {
  const categoryHint = CATEGORY_STYLE_HINTS[category.toLowerCase()] || CATEGORY_STYLE_HINTS.default;

  const prompt = `
${BASE_STYLE_PROMPT}

Category: ${categoryHint}

Generate a single AAC symbol for: "${label}"
${extraPrompt ? `Additional detail: ${extraPrompt}` : ''}

The symbol must match the reference style exactly — same line weight, same colors, same simplicity.
  `.trim();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

  // Build content parts — include reference image if available
  const parts = [];
  if (referenceImage) {
    parts.push(referenceImage);
    parts.push({ text: 'This is the reference style. Generate a new symbol in EXACTLY this style for the subject described below.\n\n' + prompt });
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

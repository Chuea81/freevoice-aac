import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dir, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BASE_STYLE_PROMPT = `
Detailed realistic illustration of the actual object, person, or scene.
NOT an emoji. NOT a flat icon. NOT a simple glyph.
Rendered with depth, lighting, and texture like a high-quality children's book illustration.
Vibrant saturated colors with soft shading and highlights.
Centered subject filling most of the frame.
Dark navy blue background (#0C1428) with subtle gradient.
No text, no labels, no letters, no watermarks in the image.
Square composition. Single clear subject.
Style reference: Pixar-quality illustration, warm and inviting.
Appropriate for children ages 3-12.
`.trim();

const CATEGORY_STYLE_HINTS = {
  food: 'Photorealistic food illustration. Show the actual dish/item with appetizing detail — texture of bread, shine of sauce, steam rising from hot food. Warm lighting.',
  drinks: 'Realistic drink in a clear glass or cup. Show the actual liquid color, ice cubes, condensation droplets, garnish. Photographic quality.',
  emotions: 'Expressive child character showing this emotion clearly. Full face with big eyes, detailed expression. Pixar/Disney style character, not emoji.',
  people: 'Realistic illustrated person. Clear features, natural pose, recognizable role or relationship.',
  places: 'Realistic illustration of the actual place. Show architectural details, environment, atmosphere.',
  activities: 'Realistic illustration of the activity in progress. Show equipment, movement, environment.',
  body: 'Medical-grade but friendly illustration. Accurate anatomy, soft colors, not scary.',
  school: 'Realistic school supply or classroom scene. Actual objects with texture and detail.',
  social: 'Realistic scene showing social interaction. Clear body language and facial expressions.',
  nature: 'Beautiful realistic nature illustration. Rich colors, detailed flora/fauna.',
  animals: 'Realistic but friendly animal portrait. Detailed fur/feathers, expressive eyes, natural pose.',
  default: 'Detailed realistic illustration. Rich colors, clear subject, child-friendly.',
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

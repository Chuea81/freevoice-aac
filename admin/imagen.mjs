import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BASE_STYLE_PROMPT = `
Flat cartoon illustration style.
Thick black outlines.
Vibrant saturated colors.
Simple and iconic — readable at 80x80 pixels.
Centered subject, no background clutter.
Dark navy blue background (#0C1428).
Rounded square composition.
Same style as a children's AAC communication app symbol.
No text, no labels, no letters in the image.
Child-friendly, expressive, clear.
`.trim();

const CATEGORY_STYLE_HINTS = {
  food: 'Delicious-looking food illustration. Warm inviting colors. Steam if hot.',
  drinks: 'Drink illustration with clear vessel. Show the liquid color. Condensation if cold.',
  emotions: 'Expressive cartoon face. Big clear emotion. Simple round face, large eyes.',
  people: 'Cartoon character. Friendly expression. Simple clothing.',
  places: 'Simple building or location icon. Recognizable silhouette.',
  activities: 'Action in progress. Dynamic pose or movement suggested.',
  body: 'Clear body part or health symbol. Medical-friendly but not scary.',
  school: 'School supply or education symbol. Colorful and approachable.',
  social: 'Clear communication action. Gesture or social scenario.',
  nature: 'Nature element. Bright and colorful.',
  default: 'Clear iconic symbol. Colorful. Child-friendly.',
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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image-generation',
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['image', 'text'] },
  });

  const response = result.response;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType, prompt };
    }
  }

  throw new Error('No image returned from Gemini');
}

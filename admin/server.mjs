import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateSymbol } from './imagen.mjs';
import { approveSymbol, getExistingSymbols, getCategories } from './writer.mjs';
import { config } from 'dotenv';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
config({ path: join(__dir, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(__dir));

app.get('/', (req, res) => res.sendFile(join(__dir, 'index.html')));
app.get('/emoji', (req, res) => res.sendFile(join(__dir, 'emoji-audit.html')));
app.use('/symbols', express.static(join(ROOT, 'public', 'symbols')));
app.use('/characters', express.static(join(ROOT, 'public', 'characters')));

app.get('/api/categories', async (req, res) => {
  try { res.json(await getCategories()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/symbols', async (req, res) => {
  try { res.json(await getExistingSymbols()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/boards — returns all boards with their symbols from defaultBoards.ts
app.get('/api/boards', async (req, res) => {
  try {
    const { getBoardsWithSymbols } = await import('./writer.mjs');
    res.json(await getBoardsWithSymbols());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/boards-full — returns complete board data (all symbol fields)
app.get('/api/boards-full', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const { writeFileSync, unlinkSync } = await import('fs');
    const tmpFile = join(ROOT, '_dump_boards.ts');
    writeFileSync(tmpFile, `
      import { getDefaultBoards, getDefaultSymbols } from './src/data/defaultBoards.ts';
      const boards = getDefaultBoards();
      const symbols = getDefaultSymbols();
      // Group symbols by boardId
      const byBoard = {};
      for (const s of symbols) {
        if (!byBoard[s.boardId]) byBoard[s.boardId] = [];
        byBoard[s.boardId].push(s);
      }
      const result = boards.map(b => ({...b, symbols: byBoard[b.id] || []}));
      process.stdout.write(JSON.stringify(result));
    `);
    const cmd = 'npx tsx "' + tmpFile + '"';
    const json = execSync(cmd, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }).toString();
    try { unlinkSync(tmpFile); } catch {}
    res.json(JSON.parse(json));
  } catch (e) {
    console.error('boards-full error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Pre-written Gemini prompts from emoji audit Section 3
app.get('/api/gemini-prompts', (_req, res) => {
  res.json({
    // Community board
    'Doctor': 'Friendly cartoon doctor in white coat with stethoscope, warm smile, diverse appearance',
    'Police': 'Friendly cartoon police officer in uniform with badge, neutral expression, professional',
    'Firefighter': 'Cartoon firefighter in full yellow gear and helmet, holding fire hose, confident',
    'Teacher': 'Cartoon teacher at chalkboard with ABC written, holding chalk, warm smile',
    'Chef': 'Cartoon chef in white uniform and tall hat, holding a spoon, kitchen context',
    'Mail Carrier': 'Cartoon mail carrier in uniform with mail bag, holding letters',
    'Mechanic': 'Cartoon mechanic in overalls with wrench, grease on hands, garage context',
    'Farmer': 'Cartoon farmer in overalls and straw hat, holding pitchfork, field background',
    'Nurse': 'Cartoon nurse in scrubs with stethoscope, clipboard, warm smile',
    'Pilot': 'Cartoon pilot in uniform with cap and wings badge, cockpit context',
    'Builder': 'Cartoon builder in hard hat and safety vest, holding blueprints',
    'Artist': 'Cartoon artist with beret, holding palette and brush, paint on hands',
    'Principal': 'Cartoon principal in suit at school doorway, welcoming expression',
    'Boss': 'Cartoon person in business attire at desk, professional setting',
    'Scientist': 'Cartoon scientist in lab coat with safety goggles, holding beaker',
    'Astronaut': 'Cartoon astronaut in space suit with helmet under arm, stars visible',
    'Judge': 'Cartoon judge in black robe with gavel, courtroom context',
    'Singer': 'Cartoon singer at microphone on stage, spotlight visible',
    'Coach': 'Cartoon coach with whistle and clipboard, athletic wear',
    'Therapist': 'Cartoon therapist in comfortable office setting, notepad in hand',
    'SLP': 'Cartoon speech therapist with AAC device, working with child',
    // Questions board
    'What': 'Cartoon hand pointing at mystery object with large question mark floating above',
    'Where': 'Cartoon map with red location pin and question mark, simple and clear',
    'When': 'Cartoon calendar page with question mark, friendly style',
    'Who': 'Friendly cartoon silhouette figure with question mark above head',
    'Why': 'Cartoon thought bubble containing question mark, colorful',
    'How': 'Cartoon gears with question mark, shows process/mechanism',
    'How Many': 'Colorful numbers 1 2 3 stacked with question mark',
    'What Is It': 'Cartoon mystery box or wrapped gift with question mark',
    'Where Is It': 'Cartoon magnifying glass searching with question mark',
    'What Time': 'Cartoon clock face with question mark in center',
    'Can I': 'Cartoon hand raised asking permission with question mark',
    'Is It': 'Cartoon yes/no balance scale with question mark above',
    // American food
    'PB&J': 'Peanut butter and jelly sandwich cut diagonally, both fillings visible, golden bread',
    'Mashed Potatoes': 'Bowl of creamy white mashed potatoes with yellow butter melting on top, steam rising',
    'BBQ Ribs': 'Rack of BBQ ribs with grill marks and dark red sauce, rustic plate presentation',
    'Mac and Cheese': 'Elbow macaroni in thick orange cheese sauce, creamy and rich looking, bowl presentation',
    'Chili': 'Bowl of beef chili with visible beans, thick red-brown sauce, steam rising, rustic bowl',
    'Biscuits': 'Two fluffy golden biscuits stacked, flaky layers clearly visible, warm and inviting',
    'Omelette': 'Folded yellow omelette with filling peeking out, on a white plate, herbs visible',
    'Meatloaf': 'Sliced meatloaf on a plate, ketchup glaze on top, homestyle presentation',
    // Mexican & Latin food
    'Carnitas': 'Shredded golden-brown pork carnitas in a bowl, crispy edges visible, lime wedge garnish',
    'Carne Asada': 'Grilled beef strips with clear grill marks on cutting board, vibrant green garnish',
    'Pupusas': 'Thick round corn flatbread pupusas on a plate, slightly golden, with curtido slaw',
    'Agua Fresca': 'Tall glass of bright colored fruit water with visible fruit slices and ice',
    'Churros': 'Ridged fried dough churros with cinnamon sugar coating in a paper cone',
    'Sope': 'Thick round corn sope base topped with beans, cheese, and colorful toppings',
    'Tamales': 'Corn husk wrapped tamale with masa and filling peeking out at one end, steam rising',
    'Quesadilla': 'Folded flour tortilla with melted yellow cheese clearly oozing from the edge',
    'Rice and Beans': 'White rice and dark beans side by side in a colorful bowl, distinct and separate',
    'Guacamole': 'Bowl of chunky bright green guacamole with visible onion and cilantro, tortilla chip',
    'Salsa': 'Bowl of chunky red tomato salsa with visible diced tomato, onion, and cilantro',
    'Elote': 'Corn on cob covered in white mayo, cotija cheese, chili powder, lime — vibrant colors',
    'Arroz con Pollo': 'Yellow saffron rice bowl with visible chicken pieces and colorful vegetables',
    'Enchiladas': 'Rolled corn tortillas covered in red sauce in baking dish, cheese melted on top',
    'Tortilla': 'Flat round flour tortilla, plain white disc on wooden surface',
    'Menudo': 'Bowl of red broth soup with visible hominy and garnish of onion and oregano',
    'Gorditas': 'Thick stuffed corn pocket with visible filling of beans and cheese at opening',
    'Mole': 'Dark brown mole sauce poured over chicken pieces on a plate, rich and glossy',
    'Huevos Rancheros': 'Fried egg on corn tortilla with red salsa sauce and black beans on the side',
    'Horchata': 'Tall glass of creamy white rice drink with cinnamon powder on top, condensation',
    'Chilaquiles': 'Tortilla chips in red sauce with visible cheese, crema, and cilantro toppings',
    // Home places
    'Kitchen': 'Cartoon kitchen room with stove, counter and cabinets visible, warm colors',
    'Garage': 'Cartoon garage with large garage door open, car partially visible inside',
    'Basement': 'Cartoon basement stairs leading down into darker lower level room',
    'Dining Room': 'Cartoon dining table with chairs around it, place settings visible',
    'Laundry Room': 'Cartoon washing machine with clothes and bubbles, laundry basket nearby',
    // Community places
    'Restaurant': 'Cartoon restaurant storefront with sign and menu in window, welcoming entrance',
    'Dentist': 'Cartoon dental chair with overhead light, dental tools, clean friendly office',
    'Gym': 'Cartoon gym building exterior with weights or dumbbells visible in window',
    'Zoo': 'Cartoon zoo entrance gate with animal paw prints and colorful animal silhouettes',
    'Fire Station': 'Cartoon fire station building with red garage doors, fire truck visible inside',
    'Police Station': 'Cartoon police station building with blue/white exterior and badge symbol',
    'Post Office': 'Cartoon post office building with mail/envelope sign on front exterior',
    // Hygiene
    'Brush Teeth': 'Cartoon toothbrush with blue handle and white toothpaste on bristles, clean fresh style',
    'Nails': 'Cartoon hand with painted colorful fingernails, nail polish bottle visible beside it',
    'Blow Nose': 'Cartoon face blowing nose into white tissue, simple and clear',
    'Hair': 'Cartoon hairbrush or comb with colorful handle, hair strands visible, gender neutral',
    'Change Clothes': 'Two cartoon clothing items with a swap arrow between them',
    'Hot': 'Cartoon thermometer showing high temperature with heat waves rising',
    // Body parts
    'Head': 'Simple cartoon outline of human head, gender neutral, friendly',
    'Chest': 'Cartoon torso/chest outline with heart visible inside, anatomical style',
    'Toes': 'Cartoon foot with toes spread and highlighted, distinct from whole foot',
    'Back': 'Cartoon back/spine outline seen from behind, simple anatomical',
    'Lungs': 'Cartoon lungs in pink/red, clearly lung shaped, child friendly',
    'Chin': 'Cartoon face with chin area highlighted with arrow',
    // Bedtime
    'Goodnight': 'Dark blue night sky with white crescent moon and small stars, peaceful',
    'Light Off': 'Cartoon light bulb that is dark/off, grey colored, switch in off position',
    'Night Light': 'Small cartoon plug-in night light glowing softly in dark room, warm amber glow',
    'Blanket': 'Cartoon soft folded blanket or comforter, cozy warm colors',
    'Door Open': 'Cartoon door slightly ajar with warm light coming through the opening',
    // Medical/Health
    'Bone Hurts': 'Cartoon arm bone with red lightning bolt pain indicators, clearly medical not dog toy',
    'Shot': 'Cartoon arm with small bandage, friendly syringe nearby, soft colors, non-threatening',
    'Hard To Breathe': 'Cartoon person with hand on chest, lungs visible with distress lines',
    'Sore Throat': 'Cartoon neck/throat with red pain indicator, person pointing to throat',
    // Greetings
    'Good Night': 'Dark blue night sky with white crescent moon and twinkling stars, peaceful',
    // Numbers
    'Hundred': 'Blue square with white bold number 100, same style as all other number symbols',
    // Colors & Shapes
    'Pink': 'Solid pink circle on dark navy background, same style as all other color circles',
    'Rectangle': 'Light grey or white rectangle with clear visible border, distinguishable from background',
    'Heart': 'Classic red heart shape on dark navy background, clean and simple',
    // School places
    'Classroom': 'Cartoon classroom with desks in rows, chalkboard at front with ABC, bright school room',
    // Cultural events
    'Lunar New Year': 'Red envelope with gold coins and Chinese characters, festive red and gold colors',
    'Easter': 'Colorful decorated Easter egg with bright patterns, pastel colors',
    'Festival': 'Colorful festival scene with streamers and decorations, generic celebration',
    'Concert': 'Cartoon singer performing on stage with spotlight, microphone, crowd silhouette',
    // Action words
    'Jump': 'Cartoon figure jumping straight up in air with bent knees, arms raised, clearly airborne',
    'Push': 'Cartoon hands pressing against a box pushing it away, force and direction clearly shown',
    'Pull': 'Cartoon hands gripping rope or object pulling it toward them, effort clearly shown',
    'Dance': 'Gender neutral cartoon figure dancing with arms raised, joyful, no specific gender',
    'Talk': 'Cartoon mouth with speech bubble containing sound waves, clearly talking',
  });
});

// Emoji audit — export all symbols as JSON via tsx
app.get('/api/symbols-json', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const { writeFileSync, unlinkSync } = await import('fs');
    const tmpFile = join(ROOT, '_dump_symbols.ts');
    writeFileSync(tmpFile, `
      import { getDefaultBoards, getDefaultSymbols } from './src/data/defaultBoards.ts';
      process.stdout.write(JSON.stringify({ boards: getDefaultBoards(), symbols: getDefaultSymbols() }));
    `);
    const json = execSync(`npx tsx "${tmpFile}"`, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }).toString();
    try { unlinkSync(tmpFile); } catch {}
    res.json(JSON.parse(json));
  } catch (e) {
    console.error('symbols-json error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { label, category, style, phrase, extraPrompt } = req.body;
    if (!label) return res.status(400).json({ error: 'Label required' });
    const result = await generateSymbol({ label, category, style, extraPrompt });
    res.json({ imageBase64: result.imageBase64, prompt: result.prompt });
  } catch (e) {
    console.error('Generate error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/approve', async (req, res) => {
  try {
    const { label, category, subcategory, phrase, imageBase64, arasaacFallbackId } = req.body;
    const result = await approveSymbol({ label, category, subcategory, phrase, imageBase64, arasaacFallbackId });
    res.json(result);
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bulk', async (req, res) => {
  const { symbols } = req.body;
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  for (const sym of symbols) {
    try {
      const result = await generateSymbol({ label: sym.label, category: sym.category });
      res.write(JSON.stringify({ status: 'ok', label: sym.label, imageBase64: result.imageBase64 }) + '\n');
    } catch (e) {
      res.write(JSON.stringify({ status: 'error', label: sym.label, error: e.message }) + '\n');
    }
    await new Promise(r => setTimeout(r, 800));
  }
  res.end();
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`\n🎨 FreeVoice Admin Tool`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n   Ctrl+C to stop\n`);
});

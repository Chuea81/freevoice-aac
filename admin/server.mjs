import express, { Router } from 'express';
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
app.use((req, res, next) => {
  console.log(`[ALL] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => res.sendFile(join(__dir, 'index.html')));
app.get('/emoji', (req, res) => res.sendFile(join(__dir, 'emoji-audit.html')));

app.get('/api/categories', async (req, res) => {
  try { res.json(await getCategories()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/symbols', async (req, res) => {
  // Handle clear all request
  if (req.query.clearAll === '1') {
    try {
      const { readdir, unlink } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const customDir = join(ROOT, 'public', 'symbols', 'custom');

      if (!existsSync(customDir)) {
        return res.json({ ok: true, deleted: 0 });
      }

      const files = await readdir(customDir);
      let deleted = 0;
      for (const file of files) {
        try {
          await unlink(join(customDir, file));
          deleted++;
        } catch (e) {
          console.warn('Delete failed:', file);
        }
      }

      return res.json({ ok: true, deleted });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Normal list request
  try { res.json(await getExistingSymbols()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/clear-symbols — delete all approved symbols
app.post('/api/clear-symbols', async (req, res) => {
  try {
    const { readdir, unlink } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const customDir = join(ROOT, 'public', 'symbols', 'custom');

    if (!existsSync(customDir)) {
      return res.json({ ok: true, deleted: 0, message: 'No symbols to delete' });
    }

    const files = await readdir(customDir);
    let deleted = 0;

    for (const file of files) {
      try {
        const filePath = join(customDir, file);
        await unlink(filePath);
        deleted++;
      } catch (e) {
        console.warn('Failed to delete:', file, e.message);
      }
    }

    res.json({ ok: true, deleted, message: `Deleted ${deleted} files` });
  } catch (e) {
    console.error('Clear symbols error:', e);
    res.status(500).json({ error: e.message });
  }
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
    // Community board — improved for higher quality
    'Doctor': 'Warm, friendly diverse cartoon doctor in crisp white coat with stethoscope around neck, genuine smile, confident pose, medical office background with subtle blue tones',
    'Police': 'Professional cartoon police officer in well-fitted blue uniform with visible badge and nameplate, calm helpful expression, community-focused not intimidating, bright colors',
    'Firefighter': 'Courageous cartoon firefighter in full yellow turnout gear with helmet, holding fire hose confidently, action pose, bright safety colors, fire station background',
    'Teacher': 'Warm encouraging cartoon teacher at chalkboard with bright ABC letters, holding pointer or chalk, engaging smile, classroom with books and student work visible',
    'Chef': 'Happy cartoon chef in pristine white chef coat and tall chef hat, holding wooden spoon over steaming pot, warm kitchen lights, colorful fresh ingredients visible',
    'Mail Carrier': 'Cheerful cartoon mail carrier in official postal uniform carrying full mailbag, friendly wave, sunny neighborhood setting with houses in background',
    'Mechanic': 'Confident cartoon mechanic in blue work uniform holding wrench, smudged with grease, garage with tools visible, strong capable presence',
    'Farmer': 'Kind cartoon farmer in denim overalls and wide-brimmed straw hat holding pitchfork, standing in bright green field with crops or animals visible',
    'Nurse': 'Caring cartoon nurse in medical scrubs with stethoscope, holding clipboard, warm compassionate expression, hospital setting with soft healing colors',
    'Pilot': 'Professional cartoon pilot in crisp blue uniform with captain hat and wings pin, confident expression, cockpit visible in background with controls',
    'Builder': 'Hardworking cartoon builder in orange safety vest and hard hat, holding blueprints, construction site with building frame visible, skilled and capable',
    'Artist': 'Creative cartoon artist wearing colorful smock with beret, palette in hand, paintbrush behind ear, bright art studio with colorful paintings visible',
    'Principal': 'Welcoming cartoon school principal in professional suit at school entrance, warm smile, school hallway with bulletin boards visible in background',
    'Boss': 'Professional cartoon leader at modern desk with computer, confident expression, modern office with windows showing cityscape, approachable not stern',
    'Scientist': 'Enthusiastic cartoon scientist in white lab coat with safety goggles, holding test tube or beaker with glowing liquid, bright lab equipment visible',
    'Astronaut': 'Adventurous cartoon astronaut in detailed space suit with helmet under arm, confident smile, stars and planets visible in background',
    'Judge': 'Dignified cartoon judge in black robe at bench with gavel, fair and composed expression, courtroom background with law books',
    'Singer': 'Joyful cartoon performer at microphone on stage with spotlight, expressive happy face, stage lights and musical notes visible',
    'Coach': 'Enthusiastic cartoon coach in athletic wear with whistle around neck and clipboard, encouraging expression, sports field or gym in background',
    'Therapist': 'Calm professional cartoon therapist in comfortable office setting, notepad visible, warm welcoming colors, bookshelf with resource books',
    'SLP': 'Dedicated cartoon speech-language pathologist with AAC device, working with diverse child, colorful communication symbols visible, bright therapeutic setting',
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
    // American & Soul Food — photorealistic delicious looking
    'PB&J': 'Mouthwatering peanut butter and jelly sandwich with white bread cut diagonally, creamy peanut butter and vibrant purple jelly filling clearly visible, on white plate',
    'Mashed Potatoes': 'Creamy fluffy mashed potatoes in ceramic bowl with golden melting butter on top, steam wisps rising, comfort food style',
    'BBQ Ribs': 'Glazed BBQ ribs on wooden cutting board with clear grill marks, dark caramelized sauce, smoky appetizing presentation',
    'Mac and Cheese': 'Creamy elbow macaroni covered in rich orange cheese sauce in white bowl, comfort food classic, cheese strings visible',
    'Chili': 'Hearty beef chili in rustic bowl with visible red beans, thick dark red sauce, steam rising, topped with cheese and onions',
    'Biscuits': 'Two golden fluffy biscuits stacked, flaky layers visible, warm butter melting on top, homemade bakery style',
    'Omelette': 'Fluffy folded yellow omelette on white plate with cheese melting out of fold, herbs garnished, restaurant quality',
    'Meatloaf': 'Slice of homestyle meatloaf on plate with shiny ketchup glaze on top, warm comfort food presentation',
    'Fried Chicken': 'Golden crispy fried chicken drumsticks with dark brown crispy coating, juicy and appetizing, on white plate with lemon wedge',
    'Collard Greens': 'Hearty bowl of dark green collard greens with visible bacon bits and seasoning, steaming hot, comfort food presentation',
    'Cornbread': 'Golden square of moist cornbread with slightly crispy edges, buttery and inviting, on small plate with honey drizzle',
    'Sweet Potato Pie': 'Slice of creamy orange sweet potato pie with flaky golden crust, warm spices visible, classic dessert presentation',
    'Gumbo': 'Rich dark brown gumbo in rustic bowl with visible okra, sausage, and rice, steaming aromatic, traditional Creole style',
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
    // Body parts — anatomical and age-appropriate
    'Head': 'Simple friendly cartoon human head in profile, oval shape, basic features, gender neutral, soft colors',
    'Chest': 'Cartoon torso showing chest area with heart icon visible inside, child-friendly anatomical style, warm colors',
    'Toes': 'Cartoon foot viewed from above with individual toes clearly separated and highlighted, simple friendly style',
    'Back': 'Cartoon back view of shoulders and spine, simple outline style, helpful arrow pointing to back area',
    'Lungs': 'Cartoon lungs in soft pink with clear lung shape, gentle curves, child-friendly healthy organ style',
    'Chin': 'Cartoon face with chin area clearly highlighted by arrow, simple profile or front view, friendly expression',
    'Bottom': 'Cartoon bottom/buttocks illustrated as simple rounded shape in light blue or neutral color, child-friendly non-clinical style, respectful presentation',
    'Elbow': 'Cartoon arm showing elbow joint clearly bent at 90 degrees, joint area highlighted, simple line style, light yellow or skin tone',
    'Knee': 'Cartoon leg showing knee joint clearly visible and highlighted with circular marking, simple friendly style, light yellow or skin tone',
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
    const { label, category, subcategory, style, phrase, extraPrompt } = req.body;
    if (!label) return res.status(400).json({ error: 'Label required' });
    const result = await generateSymbol({ label, category, subcategory, style, extraPrompt });
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

    // Check if ARASAAC was updated
    result.arasaacUpdated = result.arasaacMessage && (result.arasaacMessage.includes('✅') || result.arasaacMessage.includes('Added'));

    // Regenerate symbols.json from scratch to pick up all custom PNGs
    result.jsonRegenerated = false;
    try {
      const { execSync } = await import('child_process');
      const out = execSync('npm run generate-symbols', { cwd: ROOT, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
      console.log(`✅ Regenerated symbols.json:`, out.trim());
      result.jsonRegenerated = true;
    } catch (e) {
      console.error(`⚠️ generate-symbols FAILED:`, e.stderr || e.message);
    }

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

// Static file serving (MUST come after ALL API routes)
app.use(express.static(__dir));
app.use('/symbols', express.static(join(ROOT, 'public', 'symbols')));
app.use('/characters', express.static(join(ROOT, 'public', 'characters')));

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`\n🎨 FreeVoice Admin Tool`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n   Ctrl+C to stop\n`);
});

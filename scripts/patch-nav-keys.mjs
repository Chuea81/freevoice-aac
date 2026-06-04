// I18N-05: TabBar looks up nav.<tabId> (home/feelings/food/activities/social/
// body/school/places/routines/custom) but locales only had home/feelings/food/
// play/myWords, so 7 of 10 tabs showed English even in complete locales. Add the
// missing keys to every locale (activities = the existing "play" word, custom =
// the existing "myWords" word, plus translations for the rest).
// Run: node scripts/patch-nav-keys.mjs

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const LOCALES = join(__dir, '..', 'src', 'i18n', 'locales');

const T = {
  en: { social: 'SOCIAL', body: 'BODY', school: 'SCHOOL', places: 'PLACES', routines: 'ROUTINES' },
  es: { social: 'SOCIAL', body: 'CUERPO', school: 'ESCUELA', places: 'LUGARES', routines: 'RUTINAS' },
  fr: { social: 'SOCIAL', body: 'CORPS', school: 'ÉCOLE', places: 'LIEUX', routines: 'ROUTINES' },
  de: { social: 'SOZIALES', body: 'KÖRPER', school: 'SCHULE', places: 'ORTE', routines: 'ROUTINEN' },
  pt: { social: 'SOCIAL', body: 'CORPO', school: 'ESCOLA', places: 'LUGARES', routines: 'ROTINAS' },
  it: { social: 'SOCIALE', body: 'CORPO', school: 'SCUOLA', places: 'LUOGHI', routines: 'ROUTINE' },
  nl: { social: 'SOCIAAL', body: 'LICHAAM', school: 'SCHOOL', places: 'PLAATSEN', routines: 'ROUTINES' },
  ar: { social: 'اجتماعي', body: 'الجسم', school: 'المدرسة', places: 'أماكن', routines: 'الروتين' },
  zh: { social: '社交', body: '身体', school: '学校', places: '地点', routines: '日常' },
  ja: { social: 'ソーシャル', body: 'からだ', school: 'がっこう', places: 'ばしょ', routines: 'にっか' },
};

for (const file of readdirSync(LOCALES).filter((f) => f.endsWith('.json'))) {
  const code = file.replace('.json', '');
  const path = join(LOCALES, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!data.nav) continue;
  const tr = T[code] || T.en;
  const play = data.nav.play ?? 'PLAY';
  const myWords = data.nav.myWords ?? 'MY WORDS';
  data.nav = {
    home: data.nav.home, feelings: data.nav.feelings, food: data.nav.food,
    activities: play, social: tr.social, body: tr.body, school: tr.school,
    places: tr.places, routines: tr.routines, custom: myWords,
    play, myWords,
  };
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✓ ${file}`);
}
console.log('✅ nav keys patched');

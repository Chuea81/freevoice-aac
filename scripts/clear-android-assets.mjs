// Post-sync: Clear bundled web assets from Android
// When server.url is set in capacitor.config.ts, the APK should load from the remote URL
// NOT from bundled assets. This script ensures the assets folder is empty so Capacitor
// is forced to use the remote URL (https://freevoiceaac.app)

import { rmSync } from 'fs';
import { join } from 'path';

const assetsPath = join(process.cwd(), 'android/app/src/main/assets/public/app');

try {
  rmSync(assetsPath, { recursive: true, force: true });
  console.log('✓ Cleared bundled assets — APK will load from remote URL');
} catch (err) {
  console.error('Error clearing assets:', err.message);
  process.exit(1);
}

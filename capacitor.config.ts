import type { CapacitorConfig } from '@capacitor/cli';

// Use environment variable to switch between remote and local modes
// LOCAL_MODE=true enables embedded web files (SharedArrayBuffer works)
// LOCAL_MODE=false uses remote URL (instant updates, but needs server headers)
const useLocalMode = process.env.LOCAL_MODE === 'true';

const config: CapacitorConfig = {
  appId: 'app.freevoiceaac.twa',
  appName: 'FreeVoice AAC',
  webDir: useLocalMode ? 'dist' : undefined,
  // Local mode: APK includes web files (enables SharedArrayBuffer)
  // Remote mode: APK loads live app from freevoiceaac.app (instant updates)
  ...(useLocalMode ? {} : {
    server: {
      url: 'https://freevoiceaac.app',
      cleartext: false,
      androidScheme: 'https',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#0a1628',
      showSpinner: false,
      androidScaleType: 'centerInside',
      androidSpinnerStyle: 'large',
    },
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    buildOptions: {
      keystorePath: './.keystore/freevoice.jks',
      keystorePassword: process.env.KEYSTORE_PASSWORD || 'password',
      keyAlias: 'freevoice',
      keyPassword: process.env.KEY_PASSWORD || 'password',
    },
  },
};

export default config;

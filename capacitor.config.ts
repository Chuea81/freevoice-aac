import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.freevoiceaac.twa',
  appName: 'FreeVoice AAC',
  // Remote URL mode — APK loads live app from freevoiceaac.app
  // Gets instant updates without Play Store resubmission
  server: {
    url: 'https://freevoiceaac.app',
    cleartext: false,
    androidScheme: 'https',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
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

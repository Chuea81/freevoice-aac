# Building FreeVoice AAC APK

Complete guide to building Android APK from source.

## Prerequisites

1. **Node.js 18+** — https://nodejs.org/
2. **Java Development Kit (JDK) 11+** — https://www.oracle.com/java/technologies/downloads/
3. **Android SDK** — Via Android Studio (https://developer.android.com/studio) or standalone tools
4. **Android NDK** (optional, for WebGPU support)
5. **Git** — https://git-scm.com/

### Verify Prerequisites

```bash
node --version  # Should be v18.0.0+
java -version   # Should be 11+
keytool -help   # Part of JDK, verifies Java installation
```

### Android SDK Setup

If using Android Studio:
1. Install Android Studio
2. Open SDK Manager (Tools → SDK Manager)
3. Install:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools 34.0.0+
   - Android Emulator (optional)
   - Android SDK Platform-Tools

If using standalone SDK tools:
```bash
# Set ANDROID_SDK_ROOT environment variable
export ANDROID_SDK_ROOT=~/Android/Sdk  # macOS/Linux
# or on Windows (Command Prompt):
set ANDROID_SDK_ROOT=C:\Android\Sdk
```

Verify SDK setup:
```bash
ls $ANDROID_SDK_ROOT/platforms  # Should show android-34, android-33, etc.
```

## Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/Chuea81/freevoice-aac.git
cd freevoice
npm install
```

## Step 2: Set Up APK Signing

### Generate Keystore (First Time Only)

```bash
npm run apk:generate-keystore
```

This script will:
1. Prompt for keystore password (use a strong password)
2. Generate keystore at `.keystore/freevoice.jks`
3. Display the passwords you need to save

**Important:** You will be asked for:
- **Keystore password** — used to protect the keystore file
- **Key password** — used to protect the private key (usually same as keystore password)

Save these passwords securely — you'll need them every time you build.

### Create .env.apk Configuration

```bash
cp .env.apk.example .env.apk
```

Edit `.env.apk` and fill in the passwords from the keystore generation step:

```bash
KEYSTORE_PASSWORD=your_actual_password
KEY_PASSWORD=your_actual_password
KEYSTORE_PATH=.keystore/freevoice.jks
KEY_ALIAS=freevoice
```

**⚠️ CRITICAL:** Never commit `.env.apk` or `.keystore/` to git. They're already in `.gitignore`.

To verify setup without exposing passwords:
```bash
ls -la .keystore/freevoice.jks  # File should exist
grep KEYSTORE_PASSWORD .env.apk  # Should show password in asterisks
```

## Step 3: Build the Web App

```bash
npm run build
```

This builds the web app at `dist/` which gets packaged into the APK.

## Step 4: Sync Capacitor

```bash
npm run cap:sync
```

This copies config and web assets to the Android project.

## Step 5: Build APK

### Debug APK (Fast, for testing)

```bash
npm run build:apk:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk` (~50MB)

**Use for:** Testing on emulator or development device

### Release APK (For distribution)

```bash
npm run build:apk:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (~50MB)

**Use for:** Publishing to Play Store

### App Bundle (For Play Store)

```bash
npm run build:bundle:release
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Use for:** Uploading to Google Play Console (Play Store handles device-specific splits)

## Step 6: Install and Test

### On Android Device

```bash
# Connect device via USB, enable Developer Mode and USB Debugging
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### On Android Emulator

```bash
# Start emulator first
emulator -avd Pixel_6_API_34  # or your configured device

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Launch App

```bash
adb shell am start -n app.freevoiceaac.twa/.MainActivity
```

## Full Build Command (One Shot)

```bash
npm run build:apk:release
```

This runs:
1. `npm run build` — Build React web app
2. `npx cap sync` — Copy to Android project
3. `./gradlew assembleRelease` — Compile and sign APK

Takes ~3-5 minutes depending on system.

## Troubleshooting

### "keytool: command not found"
→ Java SDK not installed or PATH not set
```bash
# Set JAVA_HOME
export JAVA_HOME=/path/to/jdk11+
export PATH=$JAVA_HOME/bin:$PATH
```

### "Keystore password was incorrect"
→ Password in `.env.apk` doesn't match keystore
- Delete `.keystore/freevoice.jks` and run `npm run apk:generate-keystore` again
- Double-check `.env.apk` for typos

### "Android SDK not found"
```bash
export ANDROID_SDK_ROOT=~/Android/Sdk  # Adjust path
export PATH=$ANDROID_SDK_ROOT/tools/bin:$PATH
```

### Build takes forever or gets stuck
→ Gradle caching issue
```bash
cd android
./gradlew clean
cd ..
npm run build:apk:release
```

### "remoteUrl could not be resolved"
→ Network issue accessing freevoiceaac.app
- Verify internet connection
- Check capacitor.config.ts has correct URL
- For offline testing, change to local webDir:

```typescript
// In capacitor.config.ts temporarily
webDir: 'dist'  // Use local assets instead
```

## Building Without Signing (Debug Only)

If you just want to test locally without signing setup:

```bash
cd android
./gradlew assembleDebug
```

Creates unsigned debug APK at `app/build/outputs/apk/debug/app-debug.apk`

**Note:** Unsigned APKs can only be installed on devices where the app isn't already installed with a different signature.

## Version Management

To update APK version for Play Store releases:

1. Edit `android/app/build.gradle`:
```gradle
versionCode 2     // Increment by 1 each release
versionName "1.1" // Use semver
```

2. Rebuild:
```bash
npm run build:apk:release
```

## Environment Variables

Reference for all APK-related env vars:

| Variable | Purpose | Example |
|----------|---------|---------|
| KEYSTORE_PASSWORD | Protects keystore file | `MySecurePass123!` |
| KEY_PASSWORD | Protects private key | `MySecurePass123!` |
| KEYSTORE_PATH | Path to .jks file | `.keystore/freevoice.jks` |
| KEY_ALIAS | Key identifier | `freevoice` |
| ANDROID_SDK_ROOT | SDK location | `~/Android/Sdk` |
| JAVA_HOME | JDK location | `/usr/libexec/java_home` |

## Next Steps

Once APK is built:
- See [RELEASING_APK.md](./RELEASING_APK.md) for GitHub Releases and Play Store submission
- Verify app loads https://freevoiceaac.app (remote URL mode)
- Test offline functionality (Service Worker caches app)
- Submit Release APK to Google Play Console

## Support

For issues:
1. Check Android logcat: `adb logcat | grep freevoice`
2. Review Gradle output for detailed errors
3. See Capacitor docs: https://capacitorjs.com/docs/android

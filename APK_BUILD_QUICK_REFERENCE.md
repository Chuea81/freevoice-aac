# APK Build — Quick Reference

## One-Time Setup

### Create Keystore
```bash
npm run apk:generate-keystore
```

Follow the prompts. You'll get:
- Keystore password: `freevoice123`
- Key password: `freevoice123`
- Keystore location: `.keystore/freevoice2.jks`

### Verify Keystore
```bash
keytool -list -v -keystore .keystore/freevoice2.jks -storepass freevoice123
```

---

## Build Commands

### Set Environment Variables (Current Session)
```bash
export KEYSTORE_PASSWORD="freevoice123"
export KEY_PASSWORD="freevoice123"
export KEYSTORE_PATH=".keystore/freevoice2.jks"
export KEY_ALIAS="freevoice"
```

### Build Debug APK
```bash
npm run build:apk:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk` (4–5MB)

### Build Release APK
```bash
npm run build:apk:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (4–5MB)

### Build App Bundle (For Play Store)
```bash
npm run build:bundle:release
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Install & Test

### Install on Device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Launch App
```bash
adb shell am start -n app.freevoiceaac.twa/.MainActivity
```

### View Logs
```bash
adb logcat | grep freevoice
```

---

## Full Build Script (One Command)

```bash
#!/bin/bash

# Set environment variables
export KEYSTORE_PASSWORD="freevoice123"
export KEY_PASSWORD="freevoice123"
export KEYSTORE_PATH=".keystore/freevoice2.jks"
export KEY_ALIAS="freevoice"

# Build web app
npm run build

# Sync to Android
npx cap sync

# Build APK
cd android
./gradlew assembleDebug
cd ..

echo "✅ Debug APK ready: android/app/build/outputs/apk/debug/app-debug.apk"
```

Save as `build-apk.sh` and run:
```bash
bash build-apk.sh
```

---

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| KEYSTORE_PASSWORD | freevoice123 | Protects .jks file |
| KEY_PASSWORD | freevoice123 | Protects private key |
| KEYSTORE_PATH | .keystore/freevoice2.jks | Location of signing key |
| KEY_ALIAS | freevoice | Identifier in keystore |

---

## Security Notes

✅ **DO:**
- Set env vars before building
- Keep keystore backup in secure location (encrypted)
- Use unique passwords in production
- Rotate passwords every 6 months

❌ **DON'T:**
- Hardcode passwords in build.gradle
- Commit .keystore/ to git
- Share keystore file publicly
- Use weak passwords

---

## Troubleshooting

### "Keystore password was incorrect"
```bash
# Verify the password
keytool -list -keystore .keystore/freevoice2.jks -storepass freevoice123
```

### "Build failed: KEYSTORE_PASSWORD not set"
```bash
# Make sure env vars are exported
export KEYSTORE_PASSWORD="freevoice123"
export KEY_PASSWORD="freevoice123"
export KEYSTORE_PATH=".keystore/freevoice2.jks"
export KEY_ALIAS="freevoice"

# Then try again
npm run build:apk:debug
```

### "Android SDK not found"
```bash
export ANDROID_SDK_ROOT=~/Android/Sdk
export PATH=$ANDROID_SDK_ROOT/tools/bin:$PATH
```

---

**Status:** ✅ Keystore created, APK builds successfully
**Last Build:** March 29, 2026 — Debug APK (4.0MB)

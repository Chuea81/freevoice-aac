# Audio Debugging Guide — Capacitor Android WebView

This guide helps troubleshoot audio issues in the FreeVoice APK using Chrome DevTools remote debugging.

## Quick Check: Audio is Working

1. Install the APK on your Android device
2. Open the app and tap any symbol
3. You should hear sound (either Kokoro AI or device TTS)

If you hear nothing, follow the debugging steps below.

---

## Step 1: Enable Chrome DevTools Remote Debugging

### On Android Device:
1. **Tap Settings** → **Developer Options** (may need to tap "Build Number" 7x in About)
2. Enable **USB Debugging**
3. Connect device to computer via USB cable
4. Allow USB debugging when prompted

### On Computer:
1. Open **Chrome** (or Edge)
2. Navigate to `chrome://inspect/#devices`
3. Wait for your device to appear in the list
4. You should see "FreeVoice AAC" under the connected device
5. Click **Inspect** next to the app

A Chrome DevTools window will open showing the live WebView console.

---

## Step 2: Check for SharedArrayBuffer Errors

In the Chrome DevTools **Console** tab, look for these messages:

### ✅ Success (Kokoro Loaded):
```
[TTS Worker] Model loaded successfully via WebGPU
[TTS Worker] Model loaded successfully via WASM
```
→ Kokoro is working, AI voice will be used

### ⚠️ Warning (Fallback to Device Voice):
```
[TTS Worker Error] Security context has thrown a SecurityError
[TTS Worker Error] Cannot create a SharedArrayBuffer in the current context
```
→ SharedArrayBuffer not available (normal in some WebViews)
→ App automatically falls back to device TTS (still works!)

### ❌ Error (Silent Failure):
```
Uncaught TypeError: Worker failed to initialize
```
→ Indicates a critical worker issue (should not happen in v1.1.0)

---

## Step 3: Test Audio Playback

1. In the app, tap different symbols and listen
2. In DevTools console, observe for errors

### Test Cases:
- **Tap a single word** (e.g., "Hi", "Bye") → Should speak immediately
- **Speak a sentence** (e.g., "I want water") → Should play multi-word phrase
- **Change voice settings** (Settings → Voice) → Should use new voice
- **Test offline** (close WiFi) → Should still speak (cached)

---

## Step 4: Verify COOP/COEP Headers

In Chrome DevTools **Network** tab, click any request to `freevoiceaac.app`:

Look for response headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**If present:** ✅ SharedArrayBuffer is enabled
**If missing:** ⚠️ Kokoro may not load, but device TTS fallback will work

---

## Step 5: Check Worker Messages

In the DevTools console, type this command to see worker diagnostics:

```javascript
fetch('chrome://inspect')
  .then(() => console.log('DevTools connected'))
  .catch(() => console.log('Worker status: See logs above'))
```

### Common Worker Messages:
- `LOAD_PROGRESS: 25%` → Kokoro model downloading
- `LOAD_COMPLETE: device=WebGPU` → Kokoro ready (GPU acceleration)
- `LOAD_COMPLETE: device=WASM` → Kokoro ready (slower, CPU fallback)
- `LOAD_ERROR: SharedArrayBuffer not available` → Using device TTS

---

## Step 6: Performance Metrics

In DevTools **Performance** tab:
1. Click **Record**
2. Tap a symbol to speak
3. Click **Stop**
4. Look at the timeline:

- **Good:** Audio plays within 500ms of tap
- **Acceptable:** Audio plays within 1-2s (Kokoro downloading on first use)
- **Poor:** Audio plays after 3+ seconds (model issue)

---

## Common Issues & Solutions

### Issue 1: Silent Audio (No Sound at All)

**Check:**
1. Device volume is ON (check speaker icon)
2. App has permission to use device audio
3. Console shows no errors (or shows fallback message)

**Solution:**
- Restart app
- If using Kokoro, wait for model to download (can take 30-60 seconds on first load)
- If console shows `LOAD_ERROR`, fallback to device voice is working (this is OK)

### Issue 2: Kokoro Not Loading

**Check:**
- Internet connection is stable
- Device has 100+ MB free storage (for model cache)
- Console shows `LOAD_PROGRESS` messages

**Solution:**
- Wait 60+ seconds for first-time model download
- Check Settings → Voice to see if Kokoro is selected
- Restart app after model download completes

### Issue 3: Device Voice Works, But Kokoro Doesn't

**This is expected** in some WebView environments where SharedArrayBuffer is restricted.

- Device voice will always work as fallback
- Kokoro will load on devices that support it
- Both are acceptable for AAC users

---

## Reporting Audio Issues

If audio doesn't work even after fallback:

1. **Collect debugging info:**
   - Screenshot of Chrome DevTools console
   - Android version (Settings → About)
   - Device model
   - Steps to reproduce

2. **Report at:** https://github.com/Chuea81/freevoice-aac/issues
   - Include console output
   - Mention if device TTS works in other apps
   - Check if it's a WebView restriction vs. actual bug

---

## Technical Details

### Why SharedArrayBuffer is Needed

Kokoro TTS uses ONNX Runtime with multi-threaded execution:
- Main thread: Receives speech requests, plays audio
- Worker thread: Runs neural network inference in parallel
- SharedArrayBuffer: Shares memory between threads (faster than postMessage)

Without COOP/COEP headers, WebView disables SharedArrayBuffer.

### COOP/COEP Headers (Added in v1.1.0)

```java
// MainActivity.java
response.getResponseHeaders().put("Cross-Origin-Opener-Policy", "same-origin");
response.getResponseHeaders().put("Cross-Origin-Embedder-Policy", "require-corp");
```

These headers tell the browser:
- `COOP`: Only allow requests from same origin (security boundary)
- `COEP`: Only load cross-origin resources that opt into sharing

Result: SharedArrayBuffer is enabled for Kokoro's worker threads.

### Fallback Chain

If Kokoro fails:
1. **Try:** Kokoro TTS (requires SharedArrayBuffer)
2. **Fallback:** Device Web Speech API (always available)
3. **Fallback:** Silence with error log (should not happen in v1.1.0)

---

## Support

For more help:
- Visit: https://freevoiceaac.app
- Issues: https://github.com/Chuea81/freevoice-aac/issues
- Docs: See [BUILDING_APK.md](BUILDING_APK.md) and [APK_BUILD_QUICK_REFERENCE.md](APK_BUILD_QUICK_REFERENCE.md)

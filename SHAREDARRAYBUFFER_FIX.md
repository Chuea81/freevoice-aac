# SharedArrayBuffer Blocked — Server-Side Fix Required

**Status:** ⚠️ Issue identified — requires server configuration change

---

## The Problem

When running the APK, the debug panel shows:
```
SharedArrayBuffer: ✗ Blocked
```

This happens because Kokoro TTS requires `SharedArrayBuffer` for multi-threaded execution, but the browser security model requires specific HTTP headers to enable it.

## Why It's Blocked

FreeVoice APK uses **remote URL mode** — it loads from `https://freevoiceaac.app`. However:

1. **Capacitor WebView** can't inject response headers on remote servers
2. **Only the origin server** (`freevoiceaac.app`) can send COOP/COEP headers
3. Without these headers, browsers block `SharedArrayBuffer` as a security measure

This is by design (Spectre/Meltdown mitigations).

## The Solution

The **freevoiceaac.app server** needs to send these headers on all responses:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### For Nginx
```nginx
add_header 'Cross-Origin-Opener-Policy' 'same-origin' always;
add_header 'Cross-Origin-Embedder-Policy' 'require-corp' always;
```

### For Apache
```apache
Header always set "Cross-Origin-Opener-Policy" "same-origin"
Header always set "Cross-Origin-Embedder-Policy" "require-corp"
```

### For Node.js/Express
```javascript
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
```

### For Other Servers
Consult your server documentation for adding HTTP response headers.

## What Happens Without SharedArrayBuffer

✓ **Good news:** The app will still work!

1. Kokoro TTS **fails to load** (requires SharedArrayBuffer)
2. **Automatic fallback** to device Web Speech API
3. User **always hears sound** (just not AI voice, but device voice instead)
4. Audio works perfectly with the fallback

The fallback chain:
```
Try Kokoro TTS (requires SharedArrayBuffer)
  ↓ (if blocked)
Use Device Web Speech API (always available)
  ↓
User hears sound ✓
```

## Current Status in APK

- ✗ SharedArrayBuffer: Blocked (server headers missing)
- ✅ Web Audio API: Available
- ✅ Worker: Ready
- ✅ Fallback: Working (device voice plays)

## How to Fix

**Option 1: Add headers to freevoiceaac.app server** (Recommended)
- Deploy server config changes
- Kokoro TTS will work perfectly in APK
- No code changes needed

**Option 2: Wait for fallback** (Current)
- Device voice works fine
- No Kokoro AI voice in APK (yet)
- Works immediately

## Testing After Server Fix

Once `freevoiceaac.app` sends the headers:

1. Rebuild APK: `npm run build:apk:debug`
2. Install on device
3. Open debug panel (🐛 button)
4. Check: `SharedArrayBuffer: ✓ Available`
5. Kokoro will load automatically next time

## Notes

- This is a browser security feature, not a bug
- Same issue affects any web app using SharedArrayBuffer in WebView
- Device TTS fallback is solid for AAC (works for many users)
- Kokoro is an enhancement, not required for functionality

---

## Action Items

1. **Server admin:** Add COOP/COEP headers to freevoiceaac.app
2. **Testing:** Verify headers are sent: `curl -I https://freevoiceaac.app`
   - Should show: `Cross-Origin-Opener-Policy: same-origin`
   - Should show: `Cross-Origin-Embedder-Policy: require-corp`
3. **Rebuild:** `npm run build:apk:debug` after server is updated
4. **Test:** Device voice works now, Kokoro will work after server fix

---

**Related Documentation:**
- [AUDIO_FIX_SUMMARY.md](AUDIO_FIX_SUMMARY.md) — SharedArrayBuffer technical details
- [CAPACITOR_DEBUG_PANEL_GUIDE.md](CAPACITOR_DEBUG_PANEL_GUIDE.md) — Debug panel usage

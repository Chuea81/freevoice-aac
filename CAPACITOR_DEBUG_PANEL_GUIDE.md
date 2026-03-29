# Capacitor Debug Panel — Complete Guide

**Status:** ✅ Implemented and tested in v1.1.0
**Location:** `src/components/CapacitorDebugPanel.tsx` and `.css`
**Integration:** `src/App.tsx` (imported and rendered)

---

## Overview

The Capacitor debug panel is a floating diagnostic UI that appears **only when running inside the Capacitor WebView** (when `window.Capacitor` is defined). It shows real-time TTS/audio diagnostics without requiring Chrome DevTools.

## What It Shows

### Status Indicators

| Indicator | Meaning | Color |
|-----------|---------|-------|
| ✓ Available / ✓ Ready | Working normally | Green |
| ✗ Missing / ✗ Error | Problem detected | Red |
| ? Unknown | Not yet checked | Gray |
| ⟳ Downloading | In progress | Blue (pulsing) |

### Diagnostics Displayed

**1. Web Audio API**
- Shows if browser supports Web Audio API
- Required for audio playback
- ✓ Available = OK to play sound
- ✗ Missing = Major issue (very rare)

**2. SharedArrayBuffer**
- Shows if SharedArrayBuffer is available
- Required by Kokoro TTS for multi-threading
- ✓ Available = Kokoro can initialize
- ✗ Blocked = Fallback to device voice (normal in some WebViews)

**3. Worker Status**
- Shows if TTS worker initialized successfully
- ✓ Ready = Worker running without issues
- ✗ Error = Worker encountered an error
- ? Unknown = Worker hasn't been tested yet

**4. Kokoro TTS Status**
- ✓ Ready (WebGPU) = Kokoro loaded on GPU (fastest)
- ✓ Ready (WASM) = Kokoro loaded on CPU (slower)
- ⟳ Downloading = Model downloading (first time)
- ✗ Error = Kokoro failed to load
- ? Idle = Kokoro hasn't been loaded yet

**5. Active Voice Tier**
- 🎤 Kokoro = Using AI voice (high quality)
- 📱 Device = Using device/Web Speech API (fallback)

**6. Recent Errors**
- Shows last 5 error messages
- Automatically scrolls
- Includes timestamps if available

---

## How to Use

### Opening the Debug Panel

1. **Install the v1.1.0 APK** on your Android device
2. **Open the app** — look for the 🐛 bug icon in the **bottom-right corner**
3. **Tap the bug icon** to toggle the debug panel on/off
4. **Panel appears** with status indicators

### Reading the Status

```
🔧 TTS Debug                          ← Panel header

Web Audio:        ✓ Available         ← Web Audio API working
SharedArrayBuffer: ✓ Available        ← COOP/COEP headers applied
Worker:           ✓ Ready             ← TTS worker running
Kokoro:           ✓ Ready (WebGPU)    ← Kokoro model loaded on GPU
Active Tier:      🎤 Kokoro           ← Using AI voice

Recent Errors:                        ← Error section (if any)
[... error messages ...]

[Chrome DevTools at chrome://inspect] ← Footer link
```

### Testing Audio

1. Open debug panel
2. Verify:
   - Web Audio = ✓ Available
   - SharedArrayBuffer = ✓ Available
   - Kokoro = ✓ Ready (or ⟳ Downloading)
3. Tap any symbol to speak
4. Monitor "Active Tier" to see which voice is used:
   - 🎤 Kokoro = AI voice
   - 📱 Device = Device/fallback voice
5. Listen for audio

### Troubleshooting with Panel

**Audio is Silent:**
- Check "Web Audio" = should be ✓ Available
- Check "Active Tier" = should be 🎤 or 📱
- If SharedArrayBuffer = ✗ Blocked, Kokoro won't work, but device voice should still work
- Check "Recent Errors" for specific error messages

**Kokoro Not Loading:**
- Check "Kokoro" status:
  - ⟳ Downloading = Wait, model is downloading (30-60 seconds)
  - ✗ Error = Check "Recent Errors" section
  - ? Idle = You haven't triggered Kokoro load yet (tap symbol)
- Check "SharedArrayBuffer":
  - ✗ Blocked = Kokoro can't initialize (but device voice will work as fallback)

**Device Voice Not Working:**
- Check "Web Audio" = should be ✓ Available
- Check "Active Tier" = should be 📱 Device
- If Web Audio = ✗ Missing (very rare), this is a device issue
- Check "Recent Errors" for specific error messages

---

## Technical Details

### Detection Logic

```typescript
// Only shows if running in Capacitor
const isCapacitor = (window as any).Capacitor !== undefined;

// If not Capacitor, component returns null (hidden)
if (!isCapacitor) return null;
```

### Monitoring

The panel monitors:
- `useTTSStore()` for TTS state (Kokoro status, error messages)
- `window.AudioContext` for Web Audio API
- `SharedArrayBuffer` type for SharedArrayBuffer support
- Global error handler for worker errors

### Styling

- **Position:** Fixed bottom-right corner, z-index 10000 (always on top)
- **Colors:** Brand colors (amber #f59e0b, navy #0a1628)
- **Responsive:** Adjusts for mobile screens (width: 180px on small screens)
- **Non-intrusive:** Small bug button, expandable panel doesn't cover main UI

---

## Debug Panel Architecture

### Component: `CapacitorDebugPanel.tsx`

**Key Methods:**
- `useEffect()` — Detects Capacitor and checks capabilities
- Subscribes to `useTTSStore()` for real-time status updates
- Listens to global `error` events for worker crashes
- Updates error log automatically

**Props:** None (reads directly from `useTTSStore`)

**Returns:**
- `null` if not in Capacitor (hidden in browser)
- Debug panel UI if in Capacitor

### Styles: `CapacitorDebugPanel.css`

**Classes:**
- `.capacitor-debug-panel` — Container
- `.debug-toggle` — Bug button
- `.debug-content` — Panel content
- `.status-ok` / `.status-error` / `.status-loading` — Status indicators
- `.debug-errors` — Error log section

**Animations:**
- `pulse` — Loading animation for Kokoro downloading status

---

## Before Production Release

**⚠️ IMPORTANT:** Remove debug panel before Play Store submission.

### Quick Removal

1. Delete `src/components/CapacitorDebugPanel.tsx`
2. Delete `src/components/CapacitorDebugPanel.css`
3. Remove import from `src/App.tsx`
4. Remove `<CapacitorDebugPanel />` components from render

**See:** [DEBUG_PANEL_REMOVAL.md](DEBUG_PANEL_REMOVAL.md) for detailed steps

### Why Remove?

- ✓ Production apps shouldn't have debugging UI
- ✓ Google Play Store prefers clean UX
- ✓ Bug button and debug panel might confuse end users
- ✓ Removes small performance overhead

---

## Alternative: Keep in Development Only

If you want debug panel in dev builds:

```typescript
// In CapacitorDebugPanel.tsx
const isDevelopment = process.env.NODE_ENV === 'development';
const isCapacitor = (window as any).Capacitor !== undefined;

if (!isCapacitor || !isDevelopment) {
  return null;
}
```

Then:
- Production builds (NODE_ENV=production) won't show panel
- Development builds will show it for testing
- No need to delete files

---

## User Experience

### For Testers

✓ **Pros:**
- See TTS status without Chrome DevTools
- Identify audio issues instantly
- Real-time error messages
- Non-intrusive (collapsed by default)

❌ **Cons:**
- Takes up small space (bug button)
- Could confuse casual users about debugging

### For End Users (Production)

**Before Removal:**
- Bug button appears in bottom-right
- May confuse or worry users

**After Removal:**
- Clean UI, no debugging artifacts
- Professional appearance
- Ready for Play Store

---

## Support & Troubleshooting

### If Debug Panel Doesn't Appear

1. Verify you're running inside Capacitor (not Chrome)
2. Check `window.Capacitor` in console (should be defined)
3. Reload app
4. Verify APK is v1.1.0 with debug panel

### If Status is Incorrect

1. Open Chrome DevTools (chrome://inspect)
2. Compare with console output
3. Check [AUDIO_DEBUGGING_GUIDE.md](AUDIO_DEBUGGING_GUIDE.md) for deeper diagnostics

### Reporting Issues

If debug panel shows issues:
1. Screenshot the panel
2. Note Android version and device model
3. Report at: https://github.com/Chuea81/freevoice-aac/issues

---

## Related Documentation

- [AUDIO_DEBUGGING_GUIDE.md](AUDIO_DEBUGGING_GUIDE.md) — Full Chrome DevTools guide
- [AUDIO_FIX_SUMMARY.md](AUDIO_FIX_SUMMARY.md) — SharedArrayBuffer technical details
- [DEBUG_PANEL_REMOVAL.md](DEBUG_PANEL_REMOVAL.md) — How to remove for production
- [CAPACITOR_DEBUG_PANEL_GUIDE.md](CAPACITOR_DEBUG_PANEL_GUIDE.md) — This file

---

## Timeline

- **v1.1.0** (Current) — Debug panel included for testing
- **v1.1.1** (Optional) — Bug fixes if found
- **v2.0.0** (Production) — Debug panel removed, Play Store ready

---

**Status:** Debug panel ready for testing. Production removal steps documented.

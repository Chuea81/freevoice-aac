# Removing Debug Panel Before Release

The Capacitor debug panel is included in v1.1.0 for testing audio issues. **Remove it before production release to Play Store.**

## Quick Removal Steps

### 1. Remove Component Files

```bash
rm src/components/CapacitorDebugPanel.tsx
rm src/components/CapacitorDebugPanel.css
```

### 2. Update App.tsx

Remove the import and component usage:

**From:**
```tsx
import { CapacitorDebugPanel } from './components/CapacitorDebugPanel';

// ... later in render:
return (
  <>
    <Board onOpenParentMode={() => setPage('parent')} />
    <CapacitorDebugPanel />
  </>
);
```

**To:**
```tsx
// (remove the import line)

// ... later in render:
return <Board onOpenParentMode={() => setPage('parent')} />;
```

### 3. Rebuild and Test

```bash
# Set environment variables
export KEYSTORE_PASSWORD="freevoice123"
export KEY_PASSWORD="freevoice123"
export KEYSTORE_PATH=".keystore/freevoice2.jks"
export KEY_ALIAS="freevoice"

# Build release APK
npm run build:apk:release
```

### 4. Verify Debug Panel is Gone

- Install the release APK on a device
- Confirm there is NO bug button (🐛) in the bottom-right corner
- App should function normally without diagnostics

### 5. Commit and Tag Release

```bash
git add -A
git commit -m "Remove Capacitor debug panel for production release"
git tag v1.2.0-release
git push origin main --tags
```

---

## Why Debug Panel?

The debug panel was added because:
- Audio issues in Capacitor WebView require COOP/COEP header fixes
- Chrome DevTools is not always accessible on all devices
- Visible diagnostics help verify the fix worked
- Shows if SharedArrayBuffer is available (critical for Kokoro)

## Why Remove It?

- **User experience:** On-screen UI should be clean, no debugging artifacts
- **Production standards:** Debug tools shouldn't ship to end users
- **Play Store policy:** Google may flag debugging UI as unprofessional
- **Performance:** Removes small overhead from debug monitoring

## Debug Panel Features (For Reference)

The debug panel showed:

```
🐛 Debug Button (bottom-right)
  ├─ Web Audio: ✓ Available / ✗ Missing
  ├─ SharedArrayBuffer: ✓ Available / ✗ Blocked
  ├─ Worker: ✓ Ready / ✗ Error / ? Unknown
  ├─ Kokoro: ✓ Ready / ⟳ Downloading / ✗ Error / ? Idle
  ├─ Active Tier: 🎤 Kokoro / 📱 Device
  └─ Recent Errors: [error log]
```

## Component Code Location

If you need to restore or modify:
- Component: `src/components/CapacitorDebugPanel.tsx`
- Styles: `src/components/CapacitorDebugPanel.css`
- Integration: `src/App.tsx` (import + render)

## Testing Before Removal

Before removing, test that:
1. ✓ Audio works with debug panel visible
2. ✓ Debug panel shows correct status
3. ✓ Web Audio status is "✓ Available"
4. ✓ SharedArrayBuffer shows correct status
5. ✓ Kokoro status updates as model loads
6. ✓ Falls back to device voice if Kokoro fails
7. ✓ No console errors related to TTS

## Alternative: Conditional Debug Panel

If you want to keep debug panel for future testing (advanced):

```tsx
// In CapacitorDebugPanel.tsx, modify the early return:
const isDevelopment = process.env.NODE_ENV === 'development';
const isCapacitor = (window as any).Capacitor !== undefined;

if (!isCapacitor || !isDevelopment) {
  return null;
}
```

Then it only shows in development builds, not production.

---

## Release Timeline

- **v1.1.0** (Current) — Debug panel included, testing phase
- **v1.1.1** (Optional) — Bug fixes if found during testing
- **v1.2.0-release** → **v2.0.0** (Production) — Debug panel removed, Play Store ready

---

**Status:** Debug panel ready for removal when testing is complete.

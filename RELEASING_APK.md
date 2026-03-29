# Releasing FreeVoice AAC APK

Guide to creating GitHub Releases with APK and preparing for Play Store submission.

## Prerequisites

- Built APK/AAB from [BUILDING_APK.md](./BUILDING_APK.md)
- GitHub CLI: `gh` command available
- Write access to repository

## Step 1: Prepare Release

### Update Version Number

Edit `android/app/build.gradle`:

```gradle
versionCode 2      // Increment by 1
versionName "1.1"  // Use semver: major.minor.patch
```

Rebuild APK:
```bash
npm run build:apk:release
```

### Test Release APK

Install on real device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Test:
- ✓ App launches
- ✓ Loads https://freevoiceaac.app
- ✓ Symbols display correctly
- ✓ Voice works (both AI and device)
- ✓ Offline mode works (close wifi, reload)
- ✓ Settings persist
- ✓ No crashes

### Create Release Notes

Create `RELEASE_NOTES_v1.1.md`:

```markdown
# FreeVoice AAC v1.1

## What's New
- Native Android APK wrapper (Capacitor)
- Improved voice persistence across sessions
- British voice pronunciation fixes
- Expanded AAC vocabulary precaching

## Bug Fixes
- Voice settings now persist after app force-close
- AI voice latency reduced through aggressive word caching
- British voice (Emma, George) pronunciation corrections for 70+ words

## Known Issues
- None

## Installation
Download `freevoice-v1.1.apk` and install on Android 8+ device

## Report Issues
Found a bug? Open an issue: https://github.com/Chuea81/freevoice-aac/issues
```

## Step 2: Create GitHub Release

### Via GitHub CLI (Recommended)

```bash
# Create release with APK attached
gh release create v1.1 \
  android/app/build/outputs/apk/release/app-release.apk \
  --title "FreeVoice AAC v1.1 — Android APK" \
  --notes-file RELEASE_NOTES_v1.1.md \
  --target main
```

### Via GitHub Web UI

1. Go to https://github.com/Chuea81/freevoice-aac/releases
2. Click "Draft a new release"
3. Tag: `v1.1`
4. Title: `FreeVoice AAC v1.1 — Android APK`
5. Description: Paste release notes
6. Attach APK: Upload `android/app/build/outputs/apk/release/app-release.apk`
7. Publish

### Verify Release

```bash
gh release view v1.1
```

Should show:
- APK file attached (~50MB)
- Release notes visible
- Download URL working

## Step 3: Promote Release

### Announce on Reddit

Post to r/Android, r/autism, r/SpicyAutism:

> **FreeVoice AAC v1.1 — Native Android App Released**
>
> We've published a native Android APK wrapper for FreeVoice — the free AAC (Augmentative and Alternative Communication) app for nonverbal children.
>
> **Download:** [GitHub Release](https://github.com/Chuea81/freevoice-aac/releases/tag/v1.1)
>
> **What's New:**
> - [Copy relevant features from release notes]
> - [Mention bug fixes users reported]
>
> **Try it:** Just download and install — no Play Store needed yet.
> Report issues or feedback in comments!
>
> FreeVoice is free, open-source, and privacy-respecting. All code on GitHub.

### Announce on GitHub Discussions

1. Go to https://github.com/Chuea81/freevoice-aac/discussions
2. New discussion → Announcements
3. Title: "v1.1 Released: Native Android APK"
4. Link to release and mention new features

### Announcement Channels

- Twitter/X: `@freevoiceaac` (if account exists)
- Email: freevoice mailing list (if any)
- Homepage: Update freevoiceaac.app banner with download link
- README: Update version number and download links

## Step 4: Google Play Store Preparation

**Note:** This is prep only. Don't submit yet unless ready.

### Create Google Play Developer Account

1. Go to https://play.google.com/console
2. Sign in with Google account
3. Accept terms and pay $25 one-time fee
4. Complete business profile

### Create App Listing

1. **App name:** FreeVoice AAC
2. **Default language:** English (US)
3. **App or game?** App
4. **Category:** Productivity
5. **Content rating:** Not required (no ads, tracking, or inappropriate content)

### Prepare Store Listing

In Play Console, fill in:

#### Short Description (80 characters)
```
Free AAC app for nonverbal children. Offline capable. No ads or subscriptions.
```

#### Full Description (4000 characters max)
```
FreeVoice AAC — Free Communication for Every Child

Why FreeVoice?

Most AAC apps cost $200–$300/year in subscriptions. We decided that was wrong.
FreeVoice is completely free — now, and forever.

What is AAC?

Augmentative and Alternative Communication (AAC) gives nonverbal and minimally
verbal children a voice. Our app lets them communicate with 1,100+ symbols,
instantly speak sentences, and record their own voice.

Built for accessibility:

✓ 1,100+ high-quality symbols across 66 boards
✓ 10 languages (English, Spanish, French, German, Portuguese, and more)
✓ Offline-capable (works without internet after first load)
✓ Culturally diverse character avatars
✓ Customizable for each child (add photos, create boards, adjust colors)
✓ Three voice options (AI, device voice, or recorded family voice)

Privacy First:

✓ No tracking or analytics
✓ No advertisements
✓ No login required
✓ All data stays on your device
✓ Open-source code (GitHub)

Features:

- Speech bar: Build sentences symbol-by-symbol, then speak
- Fast Phrases: Common social phrases one-tap away
- Search: Instantly find any symbol
- Customization: Add photos, create custom boards
- Parent Mode: PIN-protected settings for caregivers
- Import/Export: Back up and share boards
- Offline: Fully functional without internet

Designed by parents who understand what families need. Built for children
with autism, apraxia, cerebral palsy, and other speech disabilities.

No subscriptions. No credit card. No BS.

Download now. It's free forever.

Report bugs: https://github.com/Chuea81/freevoice-aac/issues
```

#### Keywords (up to 10)
```
AAC, autism, alternative communication, speech device, nonverbal, assistive
technology, disabled children, free, open-source
```

#### Screenshots (Required for Play Store)

You'll need:
- 2–8 screenshots per device type (phone, tablet)
- Size: 1440×2560px (landscape) or 1080×1920px (portrait)
- Feature highlights:
  1. Speech bar with symbols
  2. Customization (adding photos)
  3. Voice options
  4. Settings/parent mode
  5. Offline capability

Example screenshot text:
```
"Build sentences. Speak instantly."
"1,100+ symbols • 10 languages • Completely free"
"Add photos, create custom boards"
"Works offline • Private • No tracking"
```

### Store Listing Checklist

- [ ] App name finalized
- [ ] Short description (80 chars) ≤80 chars
- [ ] Full description (4000 chars) ≤4000 chars
- [ ] Screenshots prepared (5+ recommended)
- [ ] Keywords filled (up to 10)
- [ ] Category selected (Productivity)
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL: https://freevoiceaac.app/privacy
- [ ] Support email: freevoice@example.com
- [ ] Developer contact: info@shellcraftlabs.com
- [ ] Website: https://freevoiceaac.app
- [ ] Terms of service: https://freevoiceaac.app/terms

### Content Rating Questionnaire

Play Store requires IARC rating.

1. Go to Play Console → Your app → Setup → Content rating
2. Click "Get rating"
3. IARC Questionnaire — for FreeVoice:
   - **Violence:** None
   - **Sexual content:** None
   - **Profanity:** None
   - **Alcohol/tobacco:** None
   - **Gambling:** None
   - **Ads in app?** No
   - **Collects personal data?** No
   - **Child-directed?** Yes (therapeutic use)

Result: Usually E for Everyone (with note about accessibility use)

## Step 5: Testing Before Submission (Optional)

### Internal Testing Track

In Play Console:

1. Go to Testing → Internal testing
2. Create track
3. Upload Release APK (app-release.aab preferred)
4. Add 1–10 internal testers
5. Send them testing link

Testers receive email with install link. This lets you test before production.

## Step 6: Submit to Play Store

**When you're ready to go live:**

1. Go to Play Console → Your app → Releases
2. Click "Create new release" → Production
3. Upload signed APK or AAB
4. Review store listing (should be filled from earlier)
5. Add release notes
6. Review content rating
7. Click "Review and roll out"
8. Confirm submission

⏳ **Google reviews apps in 1–3 days.** You'll get email with approval or rejection.

## Troubleshooting Play Store

### APK Rejected for Signature Mismatch
→ Ensure you use the same keystore for every version
- Keep `.keystore/freevoice.jks` safe
- Back it up securely (encrypted)
- Losing it = can't update the app on Play Store

### APK Rejected for Targeting Outdated API
→ Update target SDK in `android/app/build.gradle`:
```gradle
targetSdkVersion 34  // Update annually
```

### "App not installable on some devices"
→ Ensure minSdkVersion is 26+ (Android 8+)
```gradle
minSdkVersion rootProject.ext.minSdkVersion  // Should be 26+
```

## Post-Release

### Monitor Crashes

Play Console → Analytics → Crashes & ANRs

Fix any issues and push v1.1.1 update with fixes.

### Respond to Reviews

Play Console → User reviews

Respond to negative reviews professionally — offer help and bug fixes.

### Track Downloads

Play Console → Dashboards → Overview

Monitor download growth week-by-week.

## Future Updates

For v1.2, v1.3, etc.:

1. Update `versionCode` and `versionName` in `android/app/build.gradle`
2. `npm run build:apk:release`
3. Create GitHub release and announce
4. (Optional) Upload to Play Store internal testing track first
5. Once tested, push to production

## Version History

| Version | Release Date | Notable Changes |
|---------|--------------|-----------------|
| 1.0 | 2026-03-27 | Initial release, PWA only |
| 1.1 | 2026-03-29 | Native Android APK wrapper |

---

**Last Updated:** March 29, 2026
**Maintained by:** Shellcraft Labs

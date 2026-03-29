# Google Play Store Submission Checklist

Use this checklist before submitting FreeVoice to Google Play.

## Prerequisites

- [ ] APK/AAB built and tested on real Android devices
- [ ] Google Play Developer account created ($25 paid)
- [ ] IARC rating questionnaire completed

## App Information

- [ ] App name: "FreeVoice AAC"
- [ ] Package name: "app.freevoiceaac.twa"
- [ ] Category: Productivity
- [ ] Content rating: Not explicitly needed (answer IARC questionnaire)
- [ ] Target audience: Parents, caregivers, speech-language pathologists, teachers

## Store Listing

### Descriptions
- [ ] Short description filled (max 80 chars)
- [ ] Full description completed (max 4000 chars)
- [ ] Prose is clear and compelling
- [ ] No typos or formatting issues
- [ ] Links to privacy policy and terms work

### Keywords
- [ ] 10 keywords added (see KEYWORDS.txt)
- [ ] Keywords reflect actual app content
- [ ] No spammy or misleading keywords

### Contact Information
- [ ] Support email provided
- [ ] Developer website: https://freevoiceaac.app
- [ ] Support documentation: https://freevoiceaac.app/help

## Privacy & Permissions

- [ ] Privacy policy published at https://freevoiceaac.app/privacy
- [ ] Privacy policy covers:
  - [ ] No personal data collection
  - [ ] No tracking/analytics
  - [ ] No ads
  - [ ] Data stored locally on device
  - [ ] Open-source nature

### Permissions Requested
Review `android/app/src/main/AndroidManifest.xml`:

- [ ] android.permission.INTERNET (required for remote URL mode)
- [ ] android.permission.CAMERA (optional, for photo symbols)
- [ ] android.permission.RECORD_AUDIO (optional, for voice recording)

Justify each permission in Play Console if prompted.

## Graphics & Media

### App Icon
- [ ] Icon created in all required densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Icon is recognizable and professional
- [ ] Icon includes app branding (FreeVoice logo)

### Splash Screen
- [ ] Splash screen configured with brand colors
- [ ] Dark navy background (#0a1628)
- [ ] Logo displays correctly

### Screenshots (5–8 recommended)

Each screenshot should:
- [ ] Be 1440×2560px (portrait) or 1080×1920px (landscape)
- [ ] Be in English (primary) and translated languages (optional)
- [ ] Show key features with captions
- [ ] Include text overlay explaining feature

**Suggested screenshots:**

1. **Speech Bar + Symbols** — "Build sentences with 1,100+ symbols"
2. **Customization** — "Add photos and create custom boards"
3. **Voice Options** — "Choose from AI, device, or recorded voices"
4. **Parent Mode** — "PIN-protected settings for caregivers"
5. **Multi-Language** — "10 languages for global reach"
6. **Offline Capability** — "Works without WiFi"
7. **Accessibility** — "Built for autism, apraxia, and speech disabilities"
8. **Free Forever** — "Completely free. No ads. No tracking."

### Video (Optional)
- [ ] Promotional trailer (30 seconds) showing main features
- [ ] Shows real-world usage by child or caregiver
- [ ] Music is appropriate and accessible
- [ ] No shooting required (can use screenshots + narration)

## Content Rating (IARC)

- [ ] IARC questionnaire completed
- [ ] All sections answered truthfully
- [ ] Should result in "E" (Everyone) or "T" (Teen) rating

Questions to answer "No" on:
- Violence
- Sexual content
- Profanity
- Alcohol/tobacco
- Gambling
- Ads in app
- Collects personal data

**Expected Result:** Everyone (E) or Everyone 10+ (E10+)

## Testing

### Quality Assurance

Test on multiple devices before submission:

- [ ] Tested on Android 8 (minimum SDK)
- [ ] Tested on Android 12+
- [ ] Tested on phone (5.5–6.5")
- [ ] Tested on tablet (7–10")
- [ ] App launches without crashes
- [ ] All buttons and links functional
- [ ] Text readable and layouts responsive
- [ ] Offline mode works (Service Worker caching)
- [ ] Voice plays correctly
- [ ] Symbols display properly
- [ ] Settings persist after restart

### Performance

- [ ] App loads in <5 seconds
- [ ] Navigating between boards is smooth
- [ ] No ANR (Application Not Responding) errors
- [ ] Battery usage is reasonable
- [ ] Data usage is minimal (most features work offline)

### Accessibility

- [ ] Touch targets are at least 48dp
- [ ] Text has sufficient contrast
- [ ] Font sizes are readable (especially for children with vision issues)
- [ ] Color isn't the only way to convey information
- [ ] App works with screen readers (optional but appreciated)

## Technical Requirements

### Signing

- [ ] APK/AAB is signed with valid certificate
- [ ] Certificate is valid until 2026+ (longer is better)
- [ ] Keystore is safely stored and backed up
- [ ] Signature is consistent (same key for all updates)

### APK/AAB Specifications

- [ ] Minimum SDK: 26 (Android 8)
- [ ] Target SDK: 34 (latest or recent)
- [ ] App is 64-bit compatible (required since 2019)
- [ ] APK size is under 100MB (Google Play allows up to 100MB)
- [ ] Bundle size is optimized (use AAB for Play Store)

### Device Compatibility

- [ ] Supports portrait and landscape orientation
- [ ] Works on screens from 4.7" (phone) to 10" (tablet)
- [ ] Handles notches and safe areas (iPhone X+, etc.)
- [ ] Handles navigation gestures vs buttons

## Metadata Files

- [ ] SHORT_DESCRIPTION.txt ≤80 chars
- [ ] FULL_DESCRIPTION.txt ≤4000 chars
- [ ] KEYWORDS.txt (10 keywords)
- [ ] SUBMISSION_CHECKLIST.md (this file)
- [ ] RELEASE_NOTES.txt (what's new in this version)

## Legal & Compliance

- [ ] Privacy Policy published and linked
- [ ] Terms of Use (if any) published and linked
- [ ] Open-source licenses disclosed (ARASAAC CC-BY-NC-SA, Kokoro TTS)
- [ ] No trademark or patent infringement
- [ ] No content that violates Google Play policies (hate speech, violence, explicit content, etc.)

### Content Policy Compliance

Verify the app doesn't violate Play Store policies on:
- [ ] Violence or bullying
- [ ] Hate or discrimination
- [ ] Sexual content
- [ ] Illegal activities
- [ ] Malware or malicious behavior
- [ ] Misinformation
- [ ] Impersonation
- [ ] Deceptive claims

## Final Review

Before uploading to Play Store:

- [ ] Spell-check all copy
- [ ] Review screenshots for quality
- [ ] Test APK/AAB on 3+ devices
- [ ] Verify all links work
- [ ] Ensure privacy policy is up-to-date
- [ ] Check that version code incremented
- [ ] Read Google Play policies once more: https://play.google.com/about/developer-content-policy/

## Submission

- [ ] Log into Play Console
- [ ] Create new release in Production track
- [ ] Upload signed APK or AAB (AAB preferred)
- [ ] Fill in store listing (copy from FULL_DESCRIPTION.txt)
- [ ] Upload screenshots
- [ ] Add release notes
- [ ] Select target audience and content rating
- [ ] Review everything
- [ ] Click "Submit" and wait for review

## After Submission

Expected timeline:
- **1–3 days:** App review
- **1 day:** Approval or rejection notification
- **24 hours after approval:** App appears on Play Store (may vary)

If rejected:
- [ ] Read rejection reason carefully
- [ ] Fix the issue
- [ ] Resubmit (creates new version)

## Ongoing

- [ ] Monitor crash reports in Play Console
- [ ] Respond to user reviews
- [ ] Track download trends
- [ ] Update app for new Android versions (annually)
- [ ] Keep screenshots fresh (update when UI changes)

---

**Status:** Not submitted yet
**Version:** 1.1
**Last checked:** March 29, 2026
**Next check:** Before each Play Store release

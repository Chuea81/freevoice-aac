# Contributing Translations to FreeVoice

Thank you for helping FreeVoice reach more languages and communities! Translation is one of the most impactful ways to contribute.

## Translation Status

| Language | Status | Translator |
|----------|--------|-----------|
| English | ✅ Complete | Shellcraft Labs |
| Polish | ⏳ In Progress | Proterra |
| Spanish | ⏳ In Progress | darkbluedeath |
| German | ⏳ In Progress | Cybergeneric |

## How to Translate

### 1. Find Translation Files

All translation files are in [`src/i18n/locales/`](src/i18n/locales/).

Each language has a JSON file:
- `en.json` — English (complete)
- `pl.json` — Polish (coming soon)
- `es.json` — Spanish (coming soon)
- `de.json` — German (coming soon)

### 2. Start a Translation

If your language isn't listed yet:

1. **Copy the English file** — Start with a copy of `src/i18n/locales/en.json`
2. **Name it correctly** — Use the ISO 639-1 code (e.g., `fr.json` for French, `pt.json` for Portuguese)
3. **Translate each string** — Every `"key": "value"` pair needs a translation

Example:
```json
{
  "speech.speak": "Speak",
  "speech.clear": "Clear",
  "speech.type": "Type"
}
```

### 3. Translation Guidelines

**Tone:** Friendly, clear, accessible to children and caregivers.

**Keep it concise:** Labels and buttons should be short (under 30 characters when possible).

**Context matters:** The key name tells you where the string appears (e.g., `nav.home` = navigation, `speech.speak` = speech bar).

**Don't translate brand names:** "FreeVoice" stays as "FreeVoice" in all languages.

**Handle special characters:** Make sure emoji and special characters are preserved.

### 4. Submit Your Translation

1. **Fork the repository** at https://github.com/Chuea81/freevoice-aac
2. **Create a new branch** for your language: `git checkout -b translate/polish`
3. **Add or update the translation file** in `src/i18n/locales/`
4. **Commit with a clear message:** `Add Polish translation` or `Improve Polish translation`
5. **Push to your fork:** `git push origin translate/polish`
6. **Create a Pull Request** — Describe which language you translated and any notes

### 5. Review Process

- Team will review for accuracy and tone
- May request adjustments for clarity or consistency
- Once approved, your translation goes live in the next release

## Translation Coverage

Your translation covers:

- ✅ All UI labels (buttons, menus, settings)
- ✅ Navigation labels (Home, Food, Feelings, etc.)
- ✅ Speech settings and controls
- ✅ Accessibility labels
- ✅ Error messages and confirmations

## Getting Listed as a Contributor

After your translation is merged:

1. Translator credit will be added to this file
2. You'll be listed in the app's **About → Contributors** page
3. GitHub shows you as a project contributor

## Questions?

See a translation issue? Found a typo? Open an issue on GitHub or submit a PR with corrections.

Thank you for making FreeVoice accessible in your language! 🌍

---

**FreeVoice AAC** — Every child deserves to communicate.

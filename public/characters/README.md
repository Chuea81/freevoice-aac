# Adding New Characters to FreeVoice

## File Requirements

For each new character, you need:
1. A preview image: `preview/char_NNN.png` — 200x200px
2. One image per supported symbol, named exactly as listed below

## Naming Convention

Files must be lowercase with underscores:
- happy.png, sad.png, angry.png, scared.png, tired.png
- sick.png, bored.png, love.png, frustrated.png, good.png
- worried.png, excited.png, nervous.png, calm.png
- confused.png, surprised.png, proud.png, lonely.png
- embarrassed.png, hurt_feelings.png, shy.png
- silly.png, grateful.png, disappointed.png

## Image Specifications

- Format: PNG with transparent background
- Size: 500x500px (displayed at 52-96px)
- Style: Full color, expressive, appropriate for children ages 3-12
- Consistent: Same character, same clothing, same art style across all emotions

## Adding a Character

1. Add image files to `public/characters/symbols/char_NNN/emotions/`
2. Add preview image to `public/characters/preview/char_NNN.png`
3. Add entry to `public/characters/manifest.json`
4. Run the app and test the character picker

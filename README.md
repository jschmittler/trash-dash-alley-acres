# Trash Dash: Alley Acres

A short browser platformer built for ChatGPT Sites. Collect trash, grow into the large raccoon form, unlock the bottle-cap glider, defeat the trash-bag monster, and reach the recycling depot.

## Controls

- Move: `A` / `D` or arrow keys
- Jump / glide: `Space`, `W`, or Up
- Run: `Shift` or `X`
- Tail attack / glider boost: `E` or `Z`
- Pause: `P` or `Escape`
- Restart: `R`
- Mute: `M`

Touch controls appear automatically on mobile devices.

## Local development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Sprite processing

The untouched source atlas lives at `public/assets/raccoon-sprite-source.png`. The game uses `public/assets/raccoon-sprites.png`, which has its connected gray backdrop removed.

To rebuild the transparent derivative, run:

```bash
python3 scripts/process-sprites.py public/assets/raccoon-sprite-source.png public/assets/raccoon-sprites.png
```

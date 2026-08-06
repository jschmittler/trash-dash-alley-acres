# Trash Dash: Alley Acres

A short browser platformer built for ChatGPT Sites. Collect trash, grow into the large raccoon form, unlock the bottle-cap glider, defeat the trash-bag monster, and reach the recycling depot.

[Play Trash Dash: Alley Acres](https://jschmittler.github.io/trash-dash-alley-acres/)

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

## Asset pipeline

Runtime atlases are generated into `public/assets/generated/` from source art
and normalized sheets in `concepts/`. The old single-raccoon backdrop-removal
pipeline is retained only for historical reference; new work should use the
family-specific atlas builders documented in [`docs/asset-manifest.md`](docs/asset-manifest.md).

For a complete project verification, run:

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
```

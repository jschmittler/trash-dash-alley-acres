# GitHub Pages Hosting Design

## Objective

Publish Trash Dash: Alley Acres at `https://jschmittler.github.io/trash-dash-alley-acres/` as the primary link for friend playtesting. Keep the existing ChatGPT Sites deployment as the working preview used during development.

## Scope

This increment changes hosting and build infrastructure only. Game logic, physics, level layout, controls, visuals, scoring, and browser save behavior remain unchanged.

## Chosen Approach

Add a dedicated static Vite entry and GitHub Pages build alongside the existing Vinext/Sites application.

This approach preserves the current deployment architecture while producing the static HTML, JavaScript, CSS, images, and fonts GitHub Pages requires. It avoids converting the entire project away from Vinext and avoids committing generated deployment output to the repository.

## Architecture

### Existing preview build

- `npm run dev` continues to run the Vinext application locally.
- `npm run build` continues to produce the Sites deployment.
- ChatGPT Sites remains available as the development preview.

### GitHub Pages build

- A separate Vite configuration builds a static client-only entry into `dist-pages/`.
- The static entry mounts the existing `TrashDashGame` component and imports the existing global stylesheet.
- The Pages build uses `/trash-dash-alley-acres/` as its production base path.
- A `build:pages` script produces the complete Pages artifact without modifying `dist/`.

### Asset paths

All game image URLs resolve through one base-aware helper. The existing preview resolves assets from `/assets/...`; GitHub Pages resolves them from `/trash-dash-alley-acres/assets/...`.

The helper is the only source of hosting-path differences. Sprite selection, loading order, animation frames, and rendering remain unchanged.

### Fonts and metadata

The static entry includes the existing Bungee and Nunito Sans visual treatment without depending on Next.js server rendering. It supplies the game title, description, favicon, social preview metadata, viewport configuration, and theme color.

## Deployment Workflow

A GitHub Actions workflow runs on pushes to `main` and on manual dispatch:

1. Check out the repository.
2. Install the locked Node dependencies.
3. Run the existing tests and the Pages-specific checks.
4. Build `dist-pages/`.
5. Upload the Pages artifact.
6. Deploy through GitHub Pages.

The workflow uses GitHub's official Pages actions and requires only the standard Pages permissions. It does not store deployment tokens or generated output in the repository.

## Loading and Failure Behavior

- The existing loading state remains visible until all required sprite and background assets load.
- A failed asset request must not leave the start button appearing usable.
- The Pages-specific test verifies that every referenced asset is present under the configured base path.
- Browser console errors during startup are release blockers.

## Testing

### Local checks

- Existing Vinext production build succeeds.
- Existing rendered-shell tests pass.
- Static Pages build succeeds.
- `dist-pages/index.html` exists.
- The Pages artifact contains every game asset used at runtime.
- Generated HTML and JavaScript use the repository subpath rather than root-only asset URLs.

### Browser checks

- Serve `dist-pages/` locally under the repository subpath.
- Confirm the title screen renders.
- Start a run and confirm the HUD, player, enemies, collectibles, backgrounds, and new recycling bins render.
- Pause and resume the run.
- Confirm there are no console errors or missing network assets.

### Hosted checks

- GitHub Actions completes successfully.
- The public Pages URL returns the game.
- A fresh browser session can start a run.
- A direct sprite asset URL returns successfully.
- The existing ChatGPT Sites preview still starts normally.

## Rollback

GitHub Pages is isolated from the existing Sites deployment. If the Pages workflow fails, disable Pages or revert the hosting commit; the current playable Sites URL and `main` baseline remain available.

## Acceptance Criteria

- `https://jschmittler.github.io/trash-dash-alley-acres/` is publicly reachable without authentication.
- The game starts and renders correctly from the repository subpath.
- Pushes to `main` deploy automatically.
- The existing ChatGPT Sites preview remains functional.
- No game behavior or player data format changes in this increment.

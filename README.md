# JamalClips

An interactive map of memorable clips from A Courier's Life streams. The JAMAL CLIPS spreadsheet is the source of truth, and rows with coordinates are shown on a dark, zoomable map with Twitch playback.

## Open the standalone map

Double-click `open-map.cmd`. It opens the standalone map through a small local web address, which Twitch requires for embedded clip playback. Keep the command window open while using it.

Opening `index.html` directly still displays the map and pins, but Twitch rejects clip embeds on `file://` pages.

## Local development

```bash
pnpm install
pnpm dev
```

## Verify local changes

Run `node scripts/generate-standalone.mjs`, `node scripts/validate-standalone.mjs`, `node --test scripts/clip-data.test.mjs`, and `pnpm run build`. The generator uses `data/places.json` and updates the saved fallback data and local MapLibre assets together.

The app uses the saved data if `/api/places` cannot load and offers a retry. LIVE status requires Twitch credentials on the server; failed checks hide the badge. The standalone local server serves only map files and public assets.

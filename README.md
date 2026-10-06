# JamalClips

An interactive map of memorable clips from A Courier's Life streams. The JAMAL CLIPS spreadsheet is the source of truth, and rows with coordinates are shown on a dark, zoomable map with Twitch playback.

## Open the standalone map

Double-click `open-map.cmd`. It opens the standalone map through a small local web address, which Twitch requires for embedded clip playback. Keep the command window open while using it.

Opening `index.html` directly still displays the map and pins, but Twitch rejects clip embeds on `file://` pages.

## Update the static page

`node scripts/generate-standalone.mjs` rebuilds `index.html` from `data/places.json` and copies the map assets next to it. Check the result with `node scripts/validate-standalone.mjs` and `node --test scripts/clip-data.test.mjs`.

To add each clip's Twitch category (used by search), put `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in a local `.env` file (git ignores it), run `node --env-file=.env scripts/fetch-twitch-metadata.mjs`, then rebuild the page. The script saves `data/twitch-meta.json` and writes the categories into `data/places.json`.

The LIVE button needs a hosted copy of `app/api/live/route.ts` with `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`. GitHub Pages cannot run it, so the static page only checks when `LIVE_URL` in `scripts/generate-standalone.mjs` is set to that full URL. When the site moves to its own domain, also update `SITE_URL` there and the allowed origin in `app/api/live/route.ts`.

## Local development

```bash
pnpm install
pnpm dev
```

## Verify local changes

Run `node scripts/generate-standalone.mjs`, `node scripts/validate-standalone.mjs`, `node --test scripts/clip-data.test.mjs`, and `pnpm run build`. The generator uses `data/places.json` and updates the saved fallback data and local MapLibre assets together.

The app uses the saved data if `/api/places` cannot load and offers a retry. LIVE status requires Twitch credentials on the server; failed checks hide the badge. The standalone local server serves only map files and public assets.

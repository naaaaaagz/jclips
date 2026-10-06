import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getClipId } from "../lib/clip-data.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "data", "twitch-meta.json");
const PLACES = resolve(ROOT, "data", "places.json");
const clientId = process.env.TWITCH_CLIENT_ID ?? "";
const clientSecret = process.env.TWITCH_CLIENT_SECRET ?? "";

if (!clientId || !clientSecret) throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required");

// Send the secret in the request body, never in the URL.
const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
  method: "POST",
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
});
if (!tokenResponse.ok) throw new Error(`Twitch token request returned ${tokenResponse.status}`);
const { access_token: token } = await tokenResponse.json();

const places = JSON.parse(readFileSync(PLACES, "utf8"));
const clipIds = [...new Set(places.map((place) => getClipId(String(place.clipUrl))).filter(Boolean))];

const twitchHeaders = { Authorization: `Bearer ${token}`, "Client-Id": clientId };
const clips = [];
for (let offset = 0; offset < clipIds.length; offset += 100) {
  const url = new URL("https://api.twitch.tv/helix/clips");
  for (const id of clipIds.slice(offset, offset + 100)) url.searchParams.append("id", id);
  const response = await fetch(url, { headers: twitchHeaders });
  if (!response.ok) throw new Error(`Twitch clips request returned ${response.status}`);
  const batch = await response.json();
  clips.push(...batch.data);
  console.log(`Twitch clips: ${Math.min(offset + 100, clipIds.length)}/${clipIds.length}`);
}

const gameIds = [...new Set(clips.map((clip) => clip.game_id).filter(Boolean))];
const games = {};
for (let offset = 0; offset < gameIds.length; offset += 100) {
  const url = new URL("https://api.twitch.tv/helix/games");
  for (const id of gameIds.slice(offset, offset + 100)) url.searchParams.append("id", id);
  const response = await fetch(url, { headers: twitchHeaders });
  if (!response.ok) throw new Error(`Twitch games request returned ${response.status}`);
  const batch = await response.json();
  for (const game of batch.data) games[game.id] = game.name;
}

const metadata = Object.fromEntries(clips.map((clip) => [clip.id, {
  category: games[clip.game_id] ?? "",
  language: clip.language ?? "",
  title: clip.title ?? "",
}]));

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Wrote metadata for ${Object.keys(metadata).length} clips to ${OUTPUT}`);

// Copy the Twitch category into the clip data so search can use it.
let updated = 0;
for (const place of places) {
  const twitch = metadata[getClipId(String(place.clipUrl))];
  if (!twitch) continue;
  place.twitchCategory = twitch.category;
  updated += 1;
}
writeFileSync(PLACES, `${JSON.stringify(places, null, 2)}\n`, "utf8");
console.log(`Updated the Twitch category of ${updated}/${places.length} clips in ${PLACES}`);

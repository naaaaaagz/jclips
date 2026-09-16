import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "data", "twitch-meta.json");
const PLACES = resolve(ROOT, "data", "places.json");
const clientId = process.env.TWITCH_CLIENT_ID ?? "";
const clientSecret = process.env.TWITCH_CLIENT_SECRET ?? "";

if (!clientId || !clientSecret) throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required");

const tokenUrl = new URL("https://id.twitch.tv/oauth2/token");
tokenUrl.searchParams.set("client_id", clientId);
tokenUrl.searchParams.set("client_secret", clientSecret);
tokenUrl.searchParams.set("grant_type", "client_credentials");
const tokenResponse = await fetch(tokenUrl, { method: "POST" });
if (!tokenResponse.ok) throw new Error(`Twitch token request returned ${tokenResponse.status}`);
const { access_token: token } = await tokenResponse.json();

const places = JSON.parse(readFileSync(PLACES, "utf8"));
const clipIds = places
  .map((place) => String(place.clipUrl).match(/\/clip\/([^/?#]+)/)?.[1] ?? "")
  .filter(Boolean);

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

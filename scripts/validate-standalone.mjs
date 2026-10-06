import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptStart = html.indexOf('<script type="module">') + '<script type="module">'.length;
const scriptEnd = html.indexOf("</script>", scriptStart);
if (scriptStart < '<script type="module">'.length || scriptEnd < 0) throw new Error("Standalone module script not found");

const code = html.slice(scriptStart, scriptEnd);
const syntax = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: code, encoding: "utf8" });
if (syntax.status !== 0) throw new Error(syntax.stderr || syntax.error?.message || "Standalone syntax check failed");
if (html.includes("unpkg.com/maplibre-gl")) throw new Error("Standalone must use the bundled MapLibre version");
if (/fetch\(["']\/api\//.test(code)) throw new Error("GitHub Pages has no /api routes; use a full URL");

const expectedDescription = "A Courier's Life emlékezetes Twitch-klipjei térképen.";
const requiredText = [
  `content="${expectedDescription}"`,
  "clip-source-keywords",
  "cluster-count",
  "active-cluster",
  "clip-hit-area",
  "title-label-background",
  "list-play-button",
  "vibecoded with love :: powered by",
  'href="https://nagz.space"',
  "title-toggle",
  "country-borders-europe.geojson",
  "list-tab-wiggle",
  "https://www.twitch.tv/acourierslife",
  'sizes="96x96" href="./favicon-96x96.png"',
  '<link rel="modulepreload" href="./maplibre-gl-shared.mjs">',
  'class="map-loading visible"',
  "Twitch-profil",
];
for (const value of requiredText) {
  if (!html.includes(value)) throw new Error(`Missing standalone output: ${value}`);
}
if (html.includes('"icon-offset":[0,-13]')) {
  throw new Error("Title label background must follow the text offset instead of receiving a second offset");
}
if (html.includes("setMissingStyleImageResolver")) {
  throw new Error("Raster-generated cluster icons must not be reintroduced");
}
if (html.includes("Zed streamjéből") || html.includes("zed-toggle") || html.includes("zedSource")) {
  throw new Error("The hidden Zed source filter must not be included");
}
if (!html.includes("autoplay=false&muted=false") || html.includes("autoplay=true&muted=true")) {
  throw new Error("Twitch clips must load unmuted and wait for the user to press Play");
}

console.log("Static HTML syntax and feature checks passed.");

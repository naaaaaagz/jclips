import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptStart = html.indexOf("<script>") + "<script>".length;
const scriptEnd = html.indexOf("</script>", scriptStart);
if (scriptStart < "<script>".length || scriptEnd < 0) throw new Error("Standalone script not found");

const code = html.slice(scriptStart, scriptEnd);
new Function(code);

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
if (html.includes("Zed streamjéből") || html.includes("zed-toggle")) {
  throw new Error("The hidden Zed source filter must not be included");
}

console.log("Static HTML syntax and feature checks passed.");

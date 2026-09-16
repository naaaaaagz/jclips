import places from "../../../data/places.json";

export async function GET() {
  return Response.json(places, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}

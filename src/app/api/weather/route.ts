import { getWeather } from "@/lib/weather";
import { logError } from "@/lib/logging";
export async function GET() {
  try {
    return Response.json(await getWeather(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await logError("weather", error);
    return Response.json(
      { error: "WEATHER_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

import type { WeatherResponse } from "../types/weather";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";
const BASE_URL =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

function formatApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function fetchWeather(
  location: string,
  signal?: AbortSignal,
  weekOffset: number = 0,
): Promise<WeatherResponse> {
  if (!API_KEY) {
    throw new Error("Missing VITE_WEATHER_API_KEY in your .env file");
  }

  const params = new URLSearchParams({
    unitGroup: "us",
    key: API_KEY,
    include: "days,hours",
    elements: [
      "datetime",
      "temp",
      "tempmax",
      "tempmin",
      "humidity",
      "precip",
      "precipprob",
      "preciptype",
      "windspeed",
      "windgust",
      "conditions",
      "icon",
      "description",
    ].join(","),
  });

  const start = new Date();
  start.setDate(start.getDate() + weekOffset * 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 15);

  const url = `${BASE_URL}/${encodeURIComponent(location)}/${formatApiDate(start)}/${formatApiDate(end)}?${params}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    if (res.status === 400) {
      throw new Error("Location not found. Try a city name or zip code.");
    }
    throw new Error(`Weather API error: ${res.status}`);
  }

  return res.json();
}

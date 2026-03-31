import type { DayData, HourData, TimeRange } from "../types/weather";

const EMOJI_SUNNY = "☀️";
const EMOJI_MOON = "🌙";
const EMOJI_PARTLY_CLOUDY = "⛅";
const EMOJI_CLOUDY = "☁️";
const EMOJI_RAIN = "🌧️";
const EMOJI_SHOWERS = "🌦️";
const EMOJI_SNOW = "❄️";
const EMOJI_THUNDER = "⛈️";
const EMOJI_FOG = "🌫️";
const EMOJI_WIND = "💨";
const EMOJI_DEFAULT_WEATHER = "🌤️";
const EMOJI_PIN = "📍";
const EMOJI_CALENDAR = "📅";
const EMOJI_THERMOMETER = "🌡️";
const EMOJI_HEADPHONES = "🎧";
const EMOJI_WARNING = "⚠️";
const DEGREE = "°";
const MIDDOT = "·";
const RSQUO = "\u2019";

export function getWeatherStats(day: DayData, hours?: HourData[]) {
  const temp = hours?.length
    ? hours.reduce((s, h) => s + h.temp, 0) / hours.length
    : day.temp;

  const precipProb = hours?.length
    ? Math.max(...hours.map((h) => h.precipprob))
    : day.precipprob;

  const windSpeed = hours?.length
    ? Math.max(...hours.map((h) => h.windspeed))
    : day.windspeed;

  const humidity = hours?.length
    ? hours.reduce((s, h) => s + h.humidity, 0) / hours.length
    : day.humidity;

  return { temp, precipProb, windSpeed, humidity };
}

export function getWeatherMessage(day: DayData, hours?: HourData[]): string {
  const { temp, precipProb, windSpeed } = getWeatherStats(day, hours);
  const parts: string[] = [];

  if (temp > 85) {
    parts.push("Hot");
  } else if (temp > 75) {
    parts.push("Warm");
  } else if (temp >= 60) {
    parts.push("Nice day");
  } else if (temp >= 45) {
    parts.push("Cool");
  } else {
    parts.push("Cold");
  }

  if (precipProb > 70) {
    parts.push("rainy");
  } else if (precipProb > 30) {
    parts.push("chance of rain");
  }

  if (windSpeed > 20) {
    parts.push("windy");
  } else if (windSpeed > 10) {
    parts.push("breezy");
  }

  if (parts.length === 1) return parts[0];

  const [first, ...rest] = parts;

  if (rest.length === 1) {
    const connector =
      rest[0] === "breezy" || rest[0] === "windy" ? "but" : "with";

    return `${first}, ${connector} ${rest[0]}`;
  }
  return `${first}, ${rest.join(" and ")}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function joinWithOxfordComma(items: string[], conjunction = "and"): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} ${conjunction} ${items[1]}`;
  }

  const allButLast = items.slice(0, -1).join(", ");
  const last = items[items.length - 1];
  return `${allButLast}, ${conjunction} ${last}`;
}

export function getGearTip(day: DayData, hours?: HourData[]): string | null {
  const { temp, precipProb, windSpeed } = getWeatherStats(day, hours);
  const tips: string[] = [];

  if (precipProb > 70) {
    tips.push("bring umbrellas or a canopy");
  } else if (precipProb > 40) {
    tips.push("pack a rain layer just in case");
  }

  if (temp > 85) {
    tips.push("sunscreen and plenty of water");
  } else if (temp < 45) {
    tips.push(`bundle up - hand warmers and hot drinks`);
  } else if (temp < 60) {
    tips.push("bring a jacket");
  }

  if (windSpeed > 20) {
    tips.push("secure anything lightweight");
  } else if (windSpeed > 12) {
    tips.push("a windbreaker wouldn't hurt");
  }

  if (!tips.length) {
    return null;
  }

  const joined = joinWithOxfordComma(tips, "and");

  return capitalizeFirst(joined);
}

export function shouldConsiderCanceling(
  day: DayData,
  hours?: HourData[],
): boolean {
  const { temp, precipProb, windSpeed } = getWeatherStats(day, hours);

  return precipProb > 80 || windSpeed > 25 || temp < 32 || temp > 100;
}

// create arbitray weather score for comparing two days
export function getWeatherScore(day: DayData, hours?: HourData[]): number {
  const { temp, precipProb, windSpeed } = getWeatherStats(day, hours);
  let score = 100;

  const tempDelta = Math.abs(temp - 68);
  score -= tempDelta * 0.8;

  score -= precipProb * 0.5;

  if (windSpeed > 10) {
    score -= (windSpeed - 10) * 1.5;
  }

  return Math.max(0, Math.min(100, score));
}

export function getWeekVerdict(
  thisWeekDay: DayData,
  nextWeekDay: DayData | null,
  thisHours: HourData[],
  nextHours: HourData[],
): {
  winner: "this" | "next" | "tie" | "only-this";
  summary: string;
  thisScore: number;
  nextScore: number;
} {
  const thisScore = getWeatherScore(thisWeekDay, thisHours);

  if (!nextWeekDay) {
    return {
      winner: "only-this",
      summary: `Next week${RSQUO}s forecast isn${RSQUO}t available yet.`,
      thisScore,
      nextScore: 0,
    };
  }

  const nextScore = getWeatherScore(nextWeekDay, nextHours);
  const delta = thisScore - nextScore;

  const thisStats = getWeatherStats(thisWeekDay, thisHours);
  const nextStats = getWeatherStats(nextWeekDay, nextHours);
  const reasons: string[] = [];

  const tempDiff = Math.round(thisStats.temp - nextStats.temp);
  if (Math.abs(tempDiff) >= 5) {
    const direction = tempDiff > 0 ? "warmer" : "cooler";

    reasons.push(`${Math.abs(tempDiff)}${DEGREE}F ${direction}`);
  }

  const rainDiff = Math.round(thisStats.precipProb - nextStats.precipProb);
  if (Math.abs(rainDiff) >= 15) {
    if (rainDiff > 0) {
      reasons.push("more rain expected");
    } else {
      reasons.push("less rain");
    }
  }

  const windDiff = Math.round(thisStats.windSpeed - nextStats.windSpeed);
  if (Math.abs(windDiff) >= 5) {
    if (windDiff > 0) {
      reasons.push("windier");
    } else {
      reasons.push("calmer winds");
    }
  }

  if (Math.abs(delta) < 5) {
    return {
      winner: "tie",
      summary: `Both weeks look pretty similar - pick whichever works for the group.`,
      thisScore,
      nextScore,
    };
  }

  const better = delta > 0 ? "This week" : "Next week";
  const reasonStr = reasons.length ? ` - ${reasons.join(", ")}` : "";

  return {
    winner: delta > 0 ? "this" : "next",
    summary: `${better} looks better for getting outside${reasonStr}.`,
    thisScore,
    nextScore,
  };
}

const ICON_MAP: Record<string, string> = {
  "clear-day": EMOJI_SUNNY,
  "clear-night": EMOJI_MOON,
  "partly-cloudy-day": EMOJI_PARTLY_CLOUDY,
  "partly-cloudy-night": EMOJI_CLOUDY,
  cloudy: EMOJI_CLOUDY,
  rain: EMOJI_RAIN,
  "showers-day": EMOJI_SHOWERS,
  "showers-night": EMOJI_RAIN,
  snow: EMOJI_SNOW,
  "thunder-rain": EMOJI_THUNDER,
  "thunder-showers-day": EMOJI_THUNDER,
  fog: EMOJI_FOG,
  wind: EMOJI_WIND,
};

export function getWeatherEmoji(icon: string): string {
  return ICON_MAP[icon] || EMOJI_DEFAULT_WEATHER;
}

export function generateShareSummary(
  day: DayData,
  hours: HourData[],
  label: string,
  timeRangeLabel: string,
  resolvedAddress: string,
): string {
  const emoji = getWeatherEmoji(day.icon);
  const message = getWeatherMessage(day, hours);
  const gear = getGearTip(day, hours);
  const stats = getWeatherStats(day, hours);
  const cancel = shouldConsiderCanceling(day, hours);
  const newLine = "";

  const lines: string[] = [];
  lines.push(`${emoji} ${label} meetup weather update!`);
  lines.push(newLine);

  lines.push(`${EMOJI_PIN} ${resolvedAddress}`);
  lines.push(`${EMOJI_CALENDAR} ${label} ${MIDDOT} ${timeRangeLabel}`);

  lines.push(newLine);
  lines.push(`Forecast: ${message}`);
  lines.push(
    `${EMOJI_THERMOMETER} ${Math.round(stats.temp)}${DEGREE}F ${MIDDOT} ${EMOJI_RAIN} ${Math.round(stats.precipProb)}% rain ${MIDDOT} ${EMOJI_WIND} ${Math.round(stats.windSpeed)} mph wind`,
  );

  if (gear) {
    lines.push(newLine);
    lines.push(`${EMOJI_HEADPHONES} Gear tip: ${gear}`);
  }

  if (cancel) {
    lines.push(newLine);
    lines.push(
      `${EMOJI_WARNING} Heads up - conditions might be rough. Have a backup plan ready.`,
    );
  }

  return lines.join("\n");
}

const GCAL_BASE_URL = "https://calendar.google.com/calendar/render";

function toGCalDateString(dateStr: string, hour: number): string {
  const [y, m, d] = dateStr.split("-");
  const hh = String(hour).padStart(2, "0");
  return `${y}${m}${d}T${hh}0000`;
}

const WEATHER_FIELDS = [
  {
    field: "temp",
    round: true,
    suffix: DEGREE + "F",
  },
  {
    field: "precipprob",
    round: true,
    suffix: "%rain",
  },
  {
    field: "windspeed",
    round: true,
    suffix: " mph wind",
  },
];

const buildWeatherSummary = (
  stats: ReturnType<typeof getWeatherStats>,
): string => {
  return WEATHER_FIELDS.map((f) => {
    const val = stats[f.field as keyof typeof stats];
    if (val === undefined) {
      return null;
    }
    const displayVal = f.round ? Math.round(val) : String(val);
    return `${displayVal}${f.suffix}`;
  })
    .filter(Boolean)
    .join(` ${MIDDOT} `);
};

export function buildCalendarUrl(
  day: DayData,
  hours: HourData[],
  timeRange: TimeRange,
  resolvedAddress: string,
): string {
  const message = getWeatherMessage(day, hours);
  const gear = getGearTip(day, hours);
  const stats = getWeatherStats(day, hours);

  const title = `Outdoor Meetup ${getWeatherEmoji(day.icon)}`;

  const descriptionLines = [
    `Forecast: ${message}`,
    buildWeatherSummary(stats),
  ].filter(Boolean);

  if (gear) {
    descriptionLines.push(`\nGear tip: ${gear}`);
  }

  const startDate = toGCalDateString(day.datetime, timeRange.startHour);
  const endDate = toGCalDateString(day.datetime, timeRange.endHour);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDate}/${endDate}`,
    details: descriptionLines.join("\n"),
    location: resolvedAddress,
  });

  return `${GCAL_BASE_URL}?${params.toString()}`;
}

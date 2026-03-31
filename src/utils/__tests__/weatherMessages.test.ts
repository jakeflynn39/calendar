import { describe, it, expect } from "vitest";
import type { DayData, HourData } from "../../types/weather";
import {
  getWeatherMessage,
  getWeatherEmoji,
  getGearTip,
  shouldConsiderCanceling,
  getWeatherScore,
  getWeekVerdict,
  buildCalendarUrl,
} from "../weatherMessages";

// ── Factories ──────────────────────────────────────────────────────────

function makeHourData(overrides: Partial<HourData> = {}): HourData {
  return {
    datetime: "12:00:00",
    temp: 70,
    humidity: 50,
    precip: 0,
    precipprob: 0,
    preciptype: null,
    windspeed: 5,
    windgust: 8,
    conditions: "Clear",
    icon: "clear-day",
    ...overrides,
  };
}

function makeDayData(overrides: Partial<DayData> = {}): DayData {
  return {
    datetime: "2025-04-03",
    temp: 70,
    tempmax: 80,
    tempmin: 60,
    humidity: 50,
    precip: 0,
    precipprob: 0,
    preciptype: null,
    windspeed: 5,
    windgust: 8,
    conditions: "Clear",
    icon: "clear-day",
    description: "Clear skies",
    hours: [],
    ...overrides,
  };
}

// ── getWeatherMessage ──────────────────────────────────────────────────

describe("getWeatherMessage", () => {
  describe("temperature buckets (day-level fallback)", () => {
    it('returns "Hot" for temp > 85', () => {
      expect(getWeatherMessage(makeDayData({ temp: 90 }))).toBe("Hot");
    });

    it('returns "Warm" for temp > 75 and <= 85', () => {
      expect(getWeatherMessage(makeDayData({ temp: 80 }))).toBe("Warm");
    });

    it('returns "Nice day" for temp 60-75', () => {
      expect(getWeatherMessage(makeDayData({ temp: 65 }))).toBe("Nice day");
    });

    it('returns "Nice day" at exactly 60', () => {
      expect(getWeatherMessage(makeDayData({ temp: 60 }))).toBe("Nice day");
    });

    it('returns "Cool" for temp 45-59', () => {
      expect(getWeatherMessage(makeDayData({ temp: 50 }))).toBe("Cool");
    });

    it('returns "Cold" for temp < 45', () => {
      expect(getWeatherMessage(makeDayData({ temp: 30 }))).toBe("Cold");
    });
  });

  describe("rain thresholds", () => {
    it('includes "rainy" when precipprob > 70', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, precipprob: 80 }));
      expect(msg).toContain("rainy");
    });

    it('includes "chance of rain" when precipprob > 30 and <= 70', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, precipprob: 50 }));
      expect(msg).toContain("chance of rain");
    });

    it("does not mention rain when precipprob <= 30", () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, precipprob: 20 }));
      expect(msg).not.toContain("rain");
    });
  });

  describe("wind thresholds", () => {
    it('includes "windy" when windspeed > 20', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, windspeed: 25 }));
      expect(msg).toContain("windy");
    });

    it('includes "breezy" when windspeed > 10 and <= 20', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, windspeed: 15 }));
      expect(msg).toContain("breezy");
    });

    it("does not mention wind when windspeed <= 10", () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, windspeed: 5 }));
      expect(msg).not.toContain("breezy");
      expect(msg).not.toContain("windy");
    });
  });

  describe("connector logic", () => {
    it('uses "but" connector for wind terms', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, windspeed: 15 }));
      expect(msg).toBe("Nice day, but breezy");
    });

    it('uses "but" connector for "windy"', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, windspeed: 25 }));
      expect(msg).toBe("Nice day, but windy");
    });

    it('uses "with" connector for rain terms', () => {
      const msg = getWeatherMessage(makeDayData({ temp: 70, precipprob: 80 }));
      expect(msg).toBe("Nice day, with rainy");
    });
  });

  describe("multi-part messages", () => {
    it('joins rain and wind with "and" when both present', () => {
      const msg = getWeatherMessage(
        makeDayData({ temp: 70, precipprob: 80, windspeed: 25 })
      );
      expect(msg).toBe("Nice day, rainy and windy");
    });
  });

  describe("hourly data preference", () => {
    it("uses hourly averages for temperature when hours provided", () => {
      const day = makeDayData({ temp: 30 }); // day-level says Cold
      const hours = [
        makeHourData({ temp: 80, precipprob: 0, windspeed: 5 }),
        makeHourData({ temp: 90, precipprob: 0, windspeed: 5 }),
      ];
      // avg temp = 85, so > 75 → "Warm"
      expect(getWeatherMessage(day, hours)).toBe("Warm");
    });

    it("uses max precipprob from hours", () => {
      const day = makeDayData({ temp: 70, precipprob: 0 });
      const hours = [
        makeHourData({ temp: 70, precipprob: 10, windspeed: 5 }),
        makeHourData({ temp: 70, precipprob: 80, windspeed: 5 }),
      ];
      const msg = getWeatherMessage(day, hours);
      expect(msg).toContain("rainy");
    });

    it("uses max windspeed from hours", () => {
      const day = makeDayData({ temp: 70, windspeed: 5 });
      const hours = [
        makeHourData({ temp: 70, precipprob: 0, windspeed: 5 }),
        makeHourData({ temp: 70, precipprob: 0, windspeed: 25 }),
      ];
      const msg = getWeatherMessage(day, hours);
      expect(msg).toContain("windy");
    });

    it("falls back to day-level data when hours is empty", () => {
      const day = makeDayData({ temp: 90 });
      expect(getWeatherMessage(day, [])).toBe("Hot");
    });
  });
});

// ── getWeatherEmoji ────────────────────────────────────────────────────

describe("getWeatherEmoji", () => {
  it("returns sun emoji for clear-day", () => {
    expect(getWeatherEmoji("clear-day")).toBe("☀️");
  });

  it("returns moon emoji for clear-night", () => {
    expect(getWeatherEmoji("clear-night")).toBe("🌙");
  });

  it("returns cloud emoji for cloudy", () => {
    expect(getWeatherEmoji("cloudy")).toBe("☁️");
  });

  it("returns rain emoji for rain", () => {
    expect(getWeatherEmoji("rain")).toBe("🌧️");
  });

  it("returns snowflake emoji for snow", () => {
    expect(getWeatherEmoji("snow")).toBe("❄️");
  });

  it("returns thunder emoji for thunder-rain", () => {
    expect(getWeatherEmoji("thunder-rain")).toBe("⛈️");
  });

  it("returns fog emoji for fog", () => {
    expect(getWeatherEmoji("fog")).toBe("🌫️");
  });

  it("returns wind emoji for wind", () => {
    expect(getWeatherEmoji("wind")).toBe("💨");
  });

  it("returns default emoji for unknown icon", () => {
    expect(getWeatherEmoji("unknown-icon")).toBe("🌤️");
  });
});

// ── getGearTip ────────────────────────────────────────────────────────

describe("getGearTip", () => {
  it("returns null when conditions are mild", () => {
    expect(getGearTip(makeDayData({ temp: 70, precipprob: 10, windspeed: 5 }))).toBeNull();
  });

  it("suggests umbrella for high rain probability", () => {
    const tip = getGearTip(makeDayData({ precipprob: 80 }));
    expect(tip).toContain("umbrella");
  });

  it("suggests rain layer for moderate rain probability", () => {
    const tip = getGearTip(makeDayData({ precipprob: 50 }));
    expect(tip).toContain("rain layer");
  });

  it("suggests sunscreen for hot weather", () => {
    const tip = getGearTip(makeDayData({ temp: 90 }));
    expect(tip?.toLowerCase()).toContain("sunscreen");
  });

  it("suggests bundling up for cold weather", () => {
    const tip = getGearTip(makeDayData({ temp: 30 }));
    expect(tip?.toLowerCase()).toContain("bundle up");
  });

  it("suggests jacket for cool weather", () => {
    const tip = getGearTip(makeDayData({ temp: 55 }));
    expect(tip?.toLowerCase()).toContain("jacket");
  });

  it("suggests securing items for high wind", () => {
    const tip = getGearTip(makeDayData({ windspeed: 25 }));
    expect(tip?.toLowerCase()).toContain("secure");
  });

  it("suggests windbreaker for moderate wind", () => {
    const tip = getGearTip(makeDayData({ windspeed: 15 }));
    expect(tip).toContain("windbreaker");
  });

  it("capitalizes the first letter", () => {
    const tip = getGearTip(makeDayData({ precipprob: 80 }));
    expect(tip![0]).toBe(tip![0].toUpperCase());
  });

  it("combines multiple tips", () => {
    const tip = getGearTip(makeDayData({ temp: 90, precipprob: 80, windspeed: 25 }));
    expect(tip).toContain("umbrella");
    expect(tip).toContain("sunscreen");
    expect(tip).toContain("secure");
  });
});

// ── shouldConsiderCanceling ───────────────────────────────────────────

describe("shouldConsiderCanceling", () => {
  it("returns false for mild conditions", () => {
    expect(shouldConsiderCanceling(makeDayData({ temp: 70, precipprob: 20, windspeed: 5 }))).toBe(false);
  });

  it("returns true for very high rain probability", () => {
    expect(shouldConsiderCanceling(makeDayData({ precipprob: 90 }))).toBe(true);
  });

  it("returns true for extreme wind", () => {
    expect(shouldConsiderCanceling(makeDayData({ windspeed: 30 }))).toBe(true);
  });

  it("returns true for freezing temps", () => {
    expect(shouldConsiderCanceling(makeDayData({ temp: 25 }))).toBe(true);
  });

  it("returns true for extreme heat", () => {
    expect(shouldConsiderCanceling(makeDayData({ temp: 105 }))).toBe(true);
  });
});

// ── getWeatherScore ──────────────────────────────────────────────────

describe("getWeatherScore", () => {
  it("returns 100 for ideal conditions (68°F, no rain, low wind)", () => {
    expect(getWeatherScore(makeDayData({ temp: 68, precipprob: 0, windspeed: 5 }))).toBe(100);
  });

  it("penalizes temperature deviation from 68°F", () => {
    const ideal = getWeatherScore(makeDayData({ temp: 68, precipprob: 0, windspeed: 5 }));
    const hot = getWeatherScore(makeDayData({ temp: 90, precipprob: 0, windspeed: 5 }));
    expect(hot).toBeLessThan(ideal);
  });

  it("penalizes rain probability", () => {
    const dry = getWeatherScore(makeDayData({ temp: 68, precipprob: 0, windspeed: 5 }));
    const rainy = getWeatherScore(makeDayData({ temp: 68, precipprob: 80, windspeed: 5 }));
    expect(rainy).toBeLessThan(dry);
  });

  it("penalizes wind above 10 mph", () => {
    const calm = getWeatherScore(makeDayData({ temp: 68, precipprob: 0, windspeed: 5 }));
    const windy = getWeatherScore(makeDayData({ temp: 68, precipprob: 0, windspeed: 25 }));
    expect(windy).toBeLessThan(calm);
  });

  it("clamps score between 0 and 100", () => {
    const terrible = getWeatherScore(makeDayData({ temp: 20, precipprob: 100, windspeed: 40 }));
    expect(terrible).toBeGreaterThanOrEqual(0);
    expect(terrible).toBeLessThanOrEqual(100);
  });
});

// ── getWeekVerdict ───────────────────────────────────────────────────

describe("getWeekVerdict", () => {
  it('returns "only-this" when nextWeekDay is null', () => {
    const result = getWeekVerdict(makeDayData(), null, [], []);
    expect(result.winner).toBe("only-this");
    expect(result.nextScore).toBe(0);
  });

  it('returns "this" when this week has better weather', () => {
    const good = makeDayData({ temp: 68, precipprob: 0, windspeed: 5 });
    const bad = makeDayData({ temp: 40, precipprob: 80, windspeed: 25 });
    const result = getWeekVerdict(good, bad, [], []);
    expect(result.winner).toBe("this");
  });

  it('returns "next" when next week has better weather', () => {
    const bad = makeDayData({ temp: 40, precipprob: 80, windspeed: 25 });
    const good = makeDayData({ temp: 68, precipprob: 0, windspeed: 5 });
    const result = getWeekVerdict(bad, good, [], []);
    expect(result.winner).toBe("next");
  });

  it('returns "tie" when scores are within 5 points', () => {
    const dayA = makeDayData({ temp: 68, precipprob: 10, windspeed: 5 });
    const dayB = makeDayData({ temp: 70, precipprob: 10, windspeed: 5 });
    const result = getWeekVerdict(dayA, dayB, [], []);
    expect(result.winner).toBe("tie");
  });

  it("includes temperature reason when difference is significant", () => {
    const good = makeDayData({ temp: 68, precipprob: 0, windspeed: 5 });
    const bad = makeDayData({ temp: 30, precipprob: 80, windspeed: 25 });
    const result = getWeekVerdict(good, bad, [], []);
    expect(result.winner).toBe("this");
    expect(result.summary).toContain("warmer");
  });
});

// ── buildCalendarUrl ─────────────────────────────────────────────────

describe("buildCalendarUrl", () => {
  const timeRange = { label: "Morning (8–11 AM)", startHour: 8, endHour: 11 };
  const address = "New York, NY";

  function decodeUrl(url: string): string {
    const parsed = new URL(url);
    const parts = [parsed.origin + parsed.pathname];
    for (const [key, value] of parsed.searchParams) {
      parts.push(`${key}=${value}`);
    }
    return parts.join(" ");
  }

  it("returns a Google Calendar URL", () => {
    const url = buildCalendarUrl(makeDayData(), [], timeRange, address);
    expect(url).toContain("calendar.google.com/calendar/render");
  });

  it("includes action=TEMPLATE parameter", () => {
    const url = buildCalendarUrl(makeDayData(), [], timeRange, address);
    expect(url).toContain("action=TEMPLATE");
  });

  it("includes the event title with weather emoji", () => {
    const url = buildCalendarUrl(makeDayData({ icon: "clear-day" }), [], timeRange, address);
    const decoded = decodeUrl(url);
    expect(decoded).toContain("Outdoor Meetup");
    expect(decoded).toContain("☀️");
  });

  it("formats dates correctly from day datetime and time range", () => {
    const day = makeDayData({ datetime: "2025-04-03" });
    const url = buildCalendarUrl(day, [], timeRange, address);
    expect(url).toContain("20250403T080000");
    expect(url).toContain("20250403T110000");
  });

  it("includes the location", () => {
    const url = buildCalendarUrl(makeDayData(), [], timeRange, address);
    const decoded = decodeUrl(url);
    expect(decoded).toContain("New York, NY");
  });

  it("includes forecast details in the description", () => {
    const url = buildCalendarUrl(makeDayData({ temp: 70 }), [], timeRange, address);
    const decoded = decodeUrl(url);
    expect(decoded).toContain("Forecast:");
  });

  it("includes gear tip in description when conditions warrant it", () => {
    const day = makeDayData({ temp: 90, precipprob: 80 });
    const url = buildCalendarUrl(day, [], timeRange, address);
    const decoded = decodeUrl(url);
    expect(decoded).toContain("Gear tip:");
  });

  it("omits gear tip from description when conditions are mild", () => {
    const day = makeDayData({ temp: 70, precipprob: 10, windspeed: 5 });
    const url = buildCalendarUrl(day, [], timeRange, address);
    const decoded = decodeUrl(url);
    expect(decoded).not.toContain("Gear tip:");
  });

  it("returns a valid URL that can be parsed", () => {
    const url = buildCalendarUrl(makeDayData(), [], timeRange, address);
    expect(() => new URL(url)).not.toThrow();
  });

  it("uses hourly data when provided", () => {
    const day = makeDayData({ temp: 30 }); // day says cold
    const hours = [
      makeHourData({ temp: 85, precipprob: 0, windspeed: 5 }),
      makeHourData({ temp: 90, precipprob: 0, windspeed: 5 }),
    ];
    const url = buildCalendarUrl(day, hours, timeRange, address);
    const decoded = decodeUrl(url);
    // hourly avg is 87.5, so should reference hot temps not cold
    expect(decoded.toLowerCase()).toContain("sunscreen");
  });
});

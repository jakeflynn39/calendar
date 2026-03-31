import { describe, it, expect } from "vitest";
import type { DayData, HourData, EventSelection, TimeRange } from "../../types/weather";
import {
  DAY_INDEX,
  DAYS_OF_WEEK,
  TIME_RANGES,
  parseLocalDate,
  getWeekPair,
  getWeekLabel,
  filterHours,
  filterHoursWithBuffer,
  formatDate,
  formatHour,
} from "../dateHelpers";

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

// ── Constants ──────────────────────────────────────────────────────────

describe("DAY_INDEX", () => {
  it("maps day names to 0-6", () => {
    expect(DAY_INDEX.SUNDAY).toBe(0);
    expect(DAY_INDEX.MONDAY).toBe(1);
    expect(DAY_INDEX.TUESDAY).toBe(2);
    expect(DAY_INDEX.WEDNESDAY).toBe(3);
    expect(DAY_INDEX.THURSDAY).toBe(4);
    expect(DAY_INDEX.FRIDAY).toBe(5);
    expect(DAY_INDEX.SATURDAY).toBe(6);
  });
});

describe("DAYS_OF_WEEK", () => {
  it("has 7 entries starting with Sunday", () => {
    expect(DAYS_OF_WEEK).toHaveLength(7);
    expect(DAYS_OF_WEEK[0]).toBe("Sunday");
    expect(DAYS_OF_WEEK[6]).toBe("Saturday");
  });

  it("aligns with DAY_INDEX", () => {
    expect(DAYS_OF_WEEK[DAY_INDEX.WEDNESDAY]).toBe("Wednesday");
  });
});

describe("TIME_RANGES", () => {
  it("has 4 ranges with label, startHour, and endHour", () => {
    expect(TIME_RANGES).toHaveLength(4);
    for (const range of TIME_RANGES) {
      expect(range).toHaveProperty("label");
      expect(range).toHaveProperty("startHour");
      expect(range).toHaveProperty("endHour");
      expect(range.endHour).toBeGreaterThan(range.startHour);
    }
  });
});

// ── parseLocalDate ─────────────────────────────────────────────────────

describe("parseLocalDate", () => {
  it("returns a Date with correct year, month, and day", () => {
    const d = parseLocalDate("2025-04-03");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(3); // April = 3
    expect(d.getDate()).toBe(3);
  });

  it("does not shift due to timezone (local midnight)", () => {
    const d = parseLocalDate("2025-01-15");
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("handles single-digit month and day", () => {
    const d = parseLocalDate("2025-1-5");
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });
});

// ── getWeekPair ────────────────────────────────────────────────────────

describe("getWeekPair", () => {
  // 2025-04-03 is a Thursday, 2025-04-10 is next Thursday
  const thursday1 = makeDayData({ datetime: "2025-04-03" });
  const thursday2 = makeDayData({ datetime: "2025-04-10" });
  const friday = makeDayData({ datetime: "2025-04-04" });

  const event: EventSelection = {
    dayOfWeek: DAY_INDEX.THURSDAY,
    timeRange: TIME_RANGES[0],
  };

  it("finds two matching days for the given dayOfWeek", () => {
    const result = getWeekPair([thursday1, friday, thursday2], event);
    expect(result.thisWeek).toBe(thursday1);
    expect(result.nextWeek).toBe(thursday2);
    expect(result.thisWeekDate).toBe("2025-04-03");
    expect(result.nextWeekDate).toBe("2025-04-10");
  });

  it("returns nulls when no days match", () => {
    const result = getWeekPair([friday], event);
    expect(result.thisWeek).toBeNull();
    expect(result.nextWeek).toBeNull();
    expect(result.thisWeekDate).toBe("");
    expect(result.nextWeekDate).toBe("");
  });

  it("handles only one matching day", () => {
    const result = getWeekPair([thursday1, friday], event);
    expect(result.thisWeek).toBe(thursday1);
    expect(result.nextWeek).toBeNull();
    expect(result.nextWeekDate).toBe("");
  });

  it("returns matchCount of all matching days", () => {
    const thursday3 = makeDayData({ datetime: "2025-04-17" });
    const result = getWeekPair(
      [thursday1, friday, thursday2, thursday3],
      event
    );
    expect(result.matchCount).toBe(3);
  });

  it("selects the pair at the given pairOffset", () => {
    const thursday3 = makeDayData({ datetime: "2025-04-17" });
    const result = getWeekPair(
      [thursday1, friday, thursday2, thursday3],
      event,
      1
    );
    expect(result.thisWeek).toBe(thursday2);
    expect(result.nextWeek).toBe(thursday3);
    expect(result.thisWeekDate).toBe("2025-04-10");
    expect(result.nextWeekDate).toBe("2025-04-17");
  });

  it("returns nulls for out-of-range pairOffset", () => {
    const result = getWeekPair([thursday1, friday, thursday2], event, 5);
    expect(result.thisWeek).toBeNull();
    expect(result.nextWeek).toBeNull();
  });
});

// ── getWeekLabel ───────────────────────────────────────────────────────

describe("getWeekLabel", () => {
  it('returns "This Week" for index 0', () => {
    expect(getWeekLabel(0)).toBe("This Week");
  });

  it('returns "Next Week" for index 1', () => {
    expect(getWeekLabel(1)).toBe("Next Week");
  });

  it('returns "In N Weeks" for index >= 2', () => {
    expect(getWeekLabel(2)).toBe("In 2 Weeks");
    expect(getWeekLabel(3)).toBe("In 3 Weeks");
  });

  it('returns "Last Week" for index -1', () => {
    expect(getWeekLabel(-1)).toBe("Last Week");
  });

  it('returns "N Weeks Ago" for index <= -2', () => {
    expect(getWeekLabel(-2)).toBe("2 Weeks Ago");
    expect(getWeekLabel(-3)).toBe("3 Weeks Ago");
  });
});

// ── filterHours ────────────────────────────────────────────────────────

describe("filterHours", () => {
  const range: TimeRange = { label: "Morning", startHour: 8, endHour: 11 };
  const hours = [
    makeHourData({ datetime: "07:00:00" }),
    makeHourData({ datetime: "08:00:00" }),
    makeHourData({ datetime: "10:00:00" }),
    makeHourData({ datetime: "11:00:00" }),
    makeHourData({ datetime: "12:00:00" }),
  ];

  it("includes hours >= startHour and < endHour", () => {
    const result = filterHours(hours, range);
    expect(result).toHaveLength(2);
    expect(result[0].datetime).toBe("08:00:00");
    expect(result[1].datetime).toBe("10:00:00");
  });

  it("returns empty array when no hours match", () => {
    const lateRange: TimeRange = { label: "Night", startHour: 22, endHour: 23 };
    expect(filterHours(hours, lateRange)).toHaveLength(0);
  });
});

// ── filterHoursWithBuffer ──────────────────────────────────────────────

describe("filterHoursWithBuffer", () => {
  const range: TimeRange = { label: "Morning", startHour: 8, endHour: 11 };
  const hours = Array.from({ length: 24 }, (_, i) =>
    makeHourData({ datetime: `${i}:00:00` })
  );

  it("expands the range by the buffer", () => {
    const result = filterHoursWithBuffer(hours, range, 2);
    // start = 8-2=6, end = 11+2=13, inclusive: 6..13 → 8 hours
    expect(result).toHaveLength(8);
    expect(result[0].datetime).toBe("6:00:00");
    expect(result[result.length - 1].datetime).toBe("13:00:00");
  });

  it("clamps start to 0", () => {
    const earlyRange: TimeRange = { label: "Early", startHour: 1, endHour: 3 };
    const result = filterHoursWithBuffer(hours, earlyRange, 5);
    expect(result[0].datetime).toBe("0:00:00");
  });

  it("clamps end to 23", () => {
    const lateRange: TimeRange = { label: "Late", startHour: 20, endHour: 22 };
    const result = filterHoursWithBuffer(hours, lateRange, 5);
    expect(result[result.length - 1].datetime).toBe("23:00:00");
  });

  it("uses inclusive end (<=)", () => {
    // With buffer=0, end=11, so hours at 11 should be included (unlike filterHours)
    const result = filterHoursWithBuffer(hours, range, 0);
    const datetimes = result.map((h) => h.datetime);
    expect(datetimes).toContain("11:00:00");
  });
});

// ── formatDate ─────────────────────────────────────────────────────────

describe("formatDate", () => {
  it('formats "2025-04-03" as "Thu 4/3"', () => {
    expect(formatDate("2025-04-03")).toBe("Thu 4/3");
  });

  it("does not zero-pad month or day", () => {
    // 2025-01-05 is a Sunday
    const result = formatDate("2025-01-05");
    expect(result).toBe("Sun 1/5");
  });
});

// ── formatHour ─────────────────────────────────────────────────────────

describe("formatHour", () => {
  it('converts "14:00:00" to "2 PM"', () => {
    expect(formatHour("14:00:00")).toBe("2 PM");
  });

  it('converts "0:00:00" to "12 AM" (midnight)', () => {
    expect(formatHour("0:00:00")).toBe("12 AM");
  });

  it('converts "12:00:00" to "12 PM" (noon)', () => {
    expect(formatHour("12:00:00")).toBe("12 PM");
  });

  it('converts morning hours correctly ("9:00:00" → "9 AM")', () => {
    expect(formatHour("9:00:00")).toBe("9 AM");
  });

  it('converts evening hours correctly ("23:00:00" → "11 PM")', () => {
    expect(formatHour("23:00:00")).toBe("11 PM");
  });
});

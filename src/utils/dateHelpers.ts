import type {
  DayData,
  EventSelection,
  HourData,
  TimeRange,
  WeekPair,
} from "../types/weather";

export const DAY_INDEX = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const TIME_RANGES: TimeRange[] = [
  { label: "Morning (8–11 AM)", startHour: 8, endHour: 11 },
  { label: "Afternoon (12–3 PM)", startHour: 12, endHour: 15 },
  { label: "Late Afternoon (3–6 PM)", startHour: 15, endHour: 18 },
  { label: "Evening (6–9 PM)", startHour: 18, endHour: 21 },
];

// parse "YYYY-MM-DD" as a local date (avoids timezone shift)
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// format "YYYY-MM-DD" → "Thu 4/3"
export function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const day = date.toLocaleDateString("en-US", { weekday: "short" });

  return `${day} ${date.getMonth() + 1}/${date.getDate()}`;
}

// format "14:00:00" → "2 PM"
export function formatHour(timeStr: string): string {
  const hour = parseInt(timeStr.split(":")[0], 10);

  if (hour === 0) {
    return "12 AM";
  }

  if (hour === 12) {
    return "12 PM";
  }

  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function getWeekPair(
  days: DayData[],
  event: EventSelection,
  pairOffset: number = 0,
): WeekPair {
  const matching: DayData[] = [];
  for (const day of days) {
    const date = parseLocalDate(day.datetime);

    if (date.getDay() === event.dayOfWeek) {
      matching.push(day);
    }
  }

  const i = pairOffset;

  return {
    thisWeek: matching[i] ?? null,
    nextWeek: matching[i + 1] ?? null,
    thisWeekDate: matching[i]?.datetime ?? "",
    nextWeekDate: matching[i + 1]?.datetime ?? "",
    matchCount: matching.length,
  };
}

export function getWeekLabel(matchIndex: number): string {
  if (matchIndex === 0) {
    return "This Week";
  }

  if (matchIndex === 1) {
    return "Next Week";
  }

  if (matchIndex > 1) {
    return `In ${matchIndex} Weeks`;
  }

  if (matchIndex === -1) {
    return "Last Week";
  }

  return `${Math.abs(matchIndex)} Weeks Ago`;
}

export function filterHours(
  hours: HourData[],
  timeRange: TimeRange,
): HourData[] {
  return hours.filter((h) => {
    const hour = parseInt(h.datetime.split(":")[0], 10);
    return hour >= timeRange.startHour && hour < timeRange.endHour;
  });
}

export function filterHoursWithBuffer(
  hours: HourData[],
  timeRange: TimeRange,
  buffer: number,
): HourData[] {
  const start = Math.max(0, timeRange.startHour - buffer);
  const end = Math.min(23, timeRange.endHour + buffer);

  return hours.filter((h) => {
    const hour = parseInt(h.datetime.split(":")[0], 10);

    return hour >= start && hour <= end;
  });
}

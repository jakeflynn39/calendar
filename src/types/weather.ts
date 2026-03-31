export interface HourData {
  datetime: string; // "HH:MM:SS"
  temp: number;
  humidity: number;
  precip: number;
  precipprob: number;
  preciptype: string[] | null;
  windspeed: number;
  windgust: number;
  conditions: string;
  icon: string;
}

export interface DayData {
  datetime: string; // "YYYY-MM-DD"
  temp: number;
  tempmax: number;
  tempmin: number;
  humidity: number;
  precip: number;
  precipprob: number;
  preciptype: string[] | null;
  windspeed: number;
  windgust: number;
  conditions: string;
  icon: string;
  description: string;
  hours: HourData[];
}

export interface WeatherResponse {
  resolvedAddress: string;
  address: string;
  timezone: string;
  days: DayData[];
}

export interface TimeRange {
  label: string;
  startHour: number;
  endHour: number;
}

export interface EventSelection {
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  timeRange: TimeRange;
}

export interface WeekPair {
  thisWeek: DayData | null;
  nextWeek: DayData | null;
  thisWeekDate: string;
  nextWeekDate: string;
  matchCount: number;
}

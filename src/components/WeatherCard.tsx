import type { DayData, HourData } from "../types/weather";
import { formatDate } from "../utils/dateHelpers";
import {
  getWeatherEmoji,
  getGearTip,
  shouldConsiderCanceling,
} from "../utils/weatherMessages";
import WeatherMessage from "./WeatherMessage";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const DEGREE = "°";
const EMOJI_BACKPACK = "🎒";
const EMOJI_WARNING = "⚠️";

interface Props {
  day: DayData;
  filteredHours: HourData[];
  label: string;
}

interface CardContentConfig {
  label: string;
  field: keyof DayData;
  round?: boolean;
  suffix?: string;
}

const cardContents: CardContentConfig[] = [
  {
    label: "High",
    field: "tempmax",
    round: true,
    suffix: `${DEGREE}F`,
  },
  {
    label: "Low",
    field: "tempmin",
    round: true,
    suffix: `${DEGREE}F`,
  },
  { label: "Rain", field: "precipprob", round: true, suffix: "%" },
  {
    label: "Wind",
    field: "windspeed",
    round: true,
    suffix: " mph",
  },
  {
    label: "Humidity",
    field: "humidity",
    round: true,
    suffix: "%",
  },
  { label: "Conditions", field: "conditions" },
];

function getValue(
  day: DayData,
  field: keyof DayData,
  round = false,
  suffix = "",
): string {
  const val = day[field];

  if (val === undefined) {
    return "--";
  }

  if (round && typeof val !== "number") {
    return "--";
  }

  const displayVal = round ? Math.round(val as number) : String(val);

  return `${displayVal}${suffix}`;
}

export default function WeatherCard({ day, filteredHours, label }: Props) {
  const gearTip = getGearTip(day, filteredHours);
  const cancelWarning = shouldConsiderCanceling(day, filteredHours);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-warm dark:text-warm">
              {label}
            </span>
            <h3 className="text-lg font-semibold tracking-tight">
              {formatDate(day.datetime)}
            </h3>
          </div>
          <span className="text-3xl">{getWeatherEmoji(day.icon)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          {cardContents.map(({ label, field, round, suffix }) => (
            <Stat
              key={label}
              label={label}
              value={getValue(day, field, round, suffix)}
            />
          ))}
        </div>

        <WeatherMessage day={day} hours={filteredHours} />

        {gearTip && (
          <p className="text-xs text-earth dark:text-warm/80 leading-relaxed">
            {EMOJI_BACKPACK} {gearTip}
          </p>
        )}

        {cancelWarning && (
          <p className="text-xs font-medium text-destructive leading-relaxed">
            {EMOJI_WARNING} Might be worth having a backup plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

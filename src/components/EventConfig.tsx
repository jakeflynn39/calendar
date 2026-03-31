import type { EventSelection } from "../types/weather";
import { DAYS_OF_WEEK, TIME_RANGES } from "../utils/dateHelpers";
import { classNames } from "@/lib/utils";

interface Props {
  value: EventSelection;
  onChange: (event: EventSelection) => void;
}

export default function EventConfig({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-earth dark:text-earth">
          Day of week
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((day, i) => (
            <button
              key={day}
              onClick={() => onChange({ ...value, dayOfWeek: i })}
              className={classNames(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                value.dayOfWeek === i
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-earth dark:text-earth">
          Time range
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.label}
              onClick={() => onChange({ ...value, timeRange: tr })}
              className={classNames(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                value.timeRange.label === tr.label
                  ? "bg-warm text-warm-foreground border-warm"
                  : "bg-card text-muted-foreground hover:border-warm/40"
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

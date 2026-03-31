import { useMemo, useState, useCallback } from "react";
import type { WeatherResponse, EventSelection } from "../types/weather";
import {
  getWeekPair,
  getWeekLabel,
  filterHours,
  filterHoursWithBuffer,
  formatDate,
} from "../utils/dateHelpers";
import {
  getWeekVerdict,
  generateShareSummary,
  buildCalendarUrl,
} from "../utils/weatherMessages";
import WeatherCard from "./WeatherCard";
import WeatherChart from "./WeatherChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, ArrowRight, Equal, CalendarPlus } from "lucide-react";

const CHART_BUFFER_HOURS = 2;

function roundDown5(n: number) {
  return Math.floor(n / 5) * 5;
}
function roundUp5(n: number) {
  return Math.ceil(n / 5) * 5;
}

interface Props {
  data: WeatherResponse;
  event: EventSelection;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function WeekComparison({
  data,
  event,
  weekOffset,
  onPrev,
  onNext,
}: Props) {
  const { thisWeek, nextWeek } = getWeekPair(data.days, event);
  const [copied, setCopied] = useState(false);

  const globalBounds = useMemo(() => {
    const allTemps: number[] = [];
    const allRain: number[] = [];

    for (const day of data.days) {
      if (!Array.isArray(day.hours)) {
        continue;
      }

      for (const h of day.hours) {
        allTemps.push(h.temp);
        allRain.push(h.precipprob);
      }
    }

    return {
      tempMin: allTemps.length ? roundDown5(Math.min(...allTemps)) - 5 : 0,
      tempMax: allTemps.length ? roundUp5(Math.max(...allTemps)) + 5 : 100,
      rainMax: allRain.length
        ? Math.min(100, roundUp5(Math.max(0, ...allRain)) + 10)
        : 100,
    };
  }, [data]);

  if (!thisWeek) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No matching day found in the forecast for the selected day of week.
      </p>
    );
  }

  const thisHours = filterHours(thisWeek.hours ?? [], event.timeRange);
  const nextHours = nextWeek
    ? filterHours(nextWeek.hours ?? [], event.timeRange)
    : [];

  const thisHoursBuffered = filterHoursWithBuffer(
    thisWeek.hours ?? [],
    event.timeRange,
    CHART_BUFFER_HOURS,
  );

  const nextHoursBuffered = nextWeek
    ? filterHoursWithBuffer(
        nextWeek.hours ?? [],
        event.timeRange,
        CHART_BUFFER_HOURS,
      )
    : [];

  const thisLabel = formatDate(thisWeek.datetime);
  const nextLabel = nextWeek ? formatDate(nextWeek.datetime) : "Next week";

  const leftCardLabel = getWeekLabel(weekOffset);
  const rightCardLabel = getWeekLabel(weekOffset + 1);

  const verdict = getWeekVerdict(thisWeek, nextWeek, thisHours, nextHours);

  const handleCopy = useCallback(() => {
    const betterDay =
      verdict.winner === "next" && nextWeek ? nextWeek : thisWeek;
    const betterHours = verdict.winner === "next" ? nextHours : thisHours;

    const text = generateShareSummary(
      betterDay,
      betterHours,
      formatDate(betterDay.datetime),
      event.timeRange.label,
      data.resolvedAddress,
    );

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((e) => console.error("Failed to copy to clipboard", e));
  }, [
    verdict,
    thisWeek,
    nextWeek,
    thisHours,
    nextHours,
    event.timeRange.label,
    data.resolvedAddress,
  ]);

  const calendarUrl = useMemo(() => {
    const betterDay =
      verdict.winner === "next" && nextWeek ? nextWeek : thisWeek;
    const betterHours = verdict.winner === "next" ? nextHours : thisHours;

    return buildCalendarUrl(
      betterDay,
      betterHours,
      event.timeRange,
      data.resolvedAddress,
    );
  }, [
    verdict,
    thisWeek,
    nextWeek,
    thisHours,
    nextHours,
    event.timeRange,
    data.resolvedAddress,
  ]);

  const verdictIcon =
    verdict.winner === "tie" ? (
      <Equal className="size-4" />
    ) : (
      <ArrowRight className="size-4" />
    );

  const verdictColor =
    verdict.winner === "tie" ? "text-muted-foreground" : "text-primary";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={weekOffset <= 0}
          onClick={onPrev}
          aria-label="Previous week pair"
        >
          &#8592;
        </Button>
        <span className="text-sm font-semibold text-earth dark:text-earth min-w-[180px] text-center">
          {leftCardLabel} vs {rightCardLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNext}
          aria-label="Next week pair"
        >
          &#8594;
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <span className={verdictColor}>{verdictIcon}</span>
            <p className="text-sm font-medium">{verdict.summary}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                <CalendarPlus className="size-3.5" />
                Add to Cal
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        <WeatherCard
          day={thisWeek}
          filteredHours={thisHours}
          label={leftCardLabel}
        />
        {nextWeek ? (
          <WeatherCard
            day={nextWeek}
            filteredHours={nextHours}
            label={rightCardLabel}
          />
        ) : (
          <div className="rounded-xl border border-dashed p-5 flex items-center justify-center text-muted-foreground min-h-[200px] text-sm">
            {rightCardLabel}&apos;s forecast not yet available
          </div>
        )}
      </div>

      {thisHoursBuffered.length > 0 && (
        <WeatherChart
          thisWeekHours={thisHoursBuffered}
          nextWeekHours={nextHoursBuffered}
          thisWeekLabel={thisLabel}
          nextWeekLabel={nextLabel}
          eventStartHour={event.timeRange.startHour}
          eventEndHour={event.timeRange.endHour}
          globalTempMin={globalBounds.tempMin}
          globalTempMax={globalBounds.tempMax}
          globalRainMax={globalBounds.rainMax}
        />
      )}
    </div>
  );
}

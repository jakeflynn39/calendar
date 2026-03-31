import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle } from "lucide-react";
import LocationInput from "./components/LocationInput";
import EventConfig from "./components/EventConfig";
import WeekComparison from "./components/WeekComparison";
import SkeletonLoader from "./components/SkeletonLoader";
import Navbar from "./components/Navbar";
import HelpModal from "./components/HelpModal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useWeather } from "./hooks/useWeather";
import { useTheme } from "./hooks/useTheme";
import type { EventSelection } from "./types/weather";
import { DAY_INDEX, TIME_RANGES } from "./utils/dateHelpers";

function getInitialState(): { location: string; event: EventSelection; weekOffset: number } {
  const params = new URLSearchParams(window.location.search);
  const location = params.get("location") || "";
  const dayParam = params.get("day");
  const timeParam = params.get("time");
  const weekParam = params.get("week");

  const dayOfWeek =
    dayParam !== null && !isNaN(Number(dayParam))
      ? Math.min(Math.max(Number(dayParam), 0), DAY_INDEX.SATURDAY)
      : DAY_INDEX.SATURDAY;
  const timeIndex =
    timeParam !== null && !isNaN(Number(timeParam))
      ? Math.min(Math.max(Number(timeParam), 0), TIME_RANGES.length - 1)
      : 1;
  const weekOffset =
    weekParam !== null && !isNaN(Number(weekParam))
      ? Math.max(Number(weekParam), 0)
      : 0;

  return {
    location,
    event: { dayOfWeek, timeRange: TIME_RANGES[timeIndex] },
    weekOffset,
  };
}

function updateURL(location: string, event: EventSelection, weekOffset: number) {
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  params.set("day", String(event.dayOfWeek));
  params.set("time", String(TIME_RANGES.indexOf(event.timeRange)));
  if (weekOffset > 0) params.set("week", String(weekOffset));
  const url = `${window.location.pathname}?${params}`;
  window.history.replaceState(null, "", url);
}

export default function App() {
  const [initial] = useState(getInitialState);
  const [weekOffset, setWeekOffset] = useState(initial.weekOffset);
  const { data, loading, error, location, setLocation } = useWeather(
    initial.location,
    weekOffset,
  );
  const [event, setEvent] = useState<EventSelection>(initial.event);
  const { theme, toggleTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);

  // Reset weekOffset when day-of-week or location changes
  const prevDayRef = useRef(event.dayOfWeek);
  useEffect(() => {
    if (event.dayOfWeek !== prevDayRef.current) {
      prevDayRef.current = event.dayOfWeek;
      setWeekOffset(0);
    }
  }, [event.dayOfWeek]);

  useEffect(() => {
    updateURL(location, event, weekOffset);
  }, [location, event, weekOffset]);

  const handleLocationSubmit = useCallback(
    (loc: string) => {
      setWeekOffset(0);
      setLocation(loc);
    },
    [setLocation],
  );

  const handlePrevWeek = useCallback(() => {
    setWeekOffset((o) => o - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((o) => o + 1);
  }, []);

  const handleSignIn = useCallback(() => {
    window.alert(
      "This is a demo... didn't quite get to the user authentication part.",
    );
  }, []);

  return (
    <>
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenHelp={() => setHelpOpen(true)}
        onSignIn={handleSignIn}
      />
      <div className="min-h-screen px-4 pt-8 pb-12">
        <div className="mx-auto max-w-[900px] space-y-6">
          <p className="text-sm text-muted-foreground">
            Find the <span className="font-semibold text-warm">perfect day</span> to get your crew outside.
          </p>

          <div className="space-y-4">
            <LocationInput
              onSubmit={handleLocationSubmit}
              loading={loading}
              resolvedAddress={data?.resolvedAddress}
              initialValue={initial.location}
            />
            <EventConfig value={event} onChange={setEvent} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && <SkeletonLoader />}

          {data && !loading && (
            <WeekComparison
              data={data}
              event={event}
              weekOffset={weekOffset}
              onPrev={handlePrevWeek}
              onNext={handleNextWeek}
            />
          )}
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}

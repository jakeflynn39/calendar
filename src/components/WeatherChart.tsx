import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import type { HourData } from "../types/weather";
import { formatHour } from "../utils/dateHelpers";
import { Card, CardContent } from "@/components/ui/card";

const THIS_WEEK_COLOR = "#2a9d6e";
const NEXT_WEEK_COLOR = "#d97706";

interface Props {
  thisWeekHours: HourData[];
  nextWeekHours: HourData[];
  thisWeekLabel: string;
  nextWeekLabel: string;
  eventStartHour: number;
  eventEndHour: number;
  globalTempMin: number;
  globalTempMax: number;
  globalRainMax: number;
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex items-center gap-4 mb-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Payload<number, string>[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {entry.value != null ? entry.value : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

const axisTickStyle = { fontSize: 11, fill: "hsl(20 5% 45%)" };
const gridStroke = "hsl(30 10% 88% / 0.6)";

export default function WeatherChart({
  thisWeekHours,
  nextWeekHours,
  thisWeekLabel,
  nextWeekLabel,
  eventStartHour,
  eventEndHour,
  globalTempMin,
  globalTempMax,
  globalRainMax,
}: Props) {
  const hourSet = new Set<number>();
  for (const h of thisWeekHours)
    hourSet.add(parseInt(h.datetime.split(":")[0], 10));
  for (const h of nextWeekHours)
    hourSet.add(parseInt(h.datetime.split(":")[0], 10));
  const hours = [...hourSet].sort((a, b) => a - b);

  const thisMap = new Map(
    thisWeekHours.map((h) => [parseInt(h.datetime.split(":")[0], 10), h]),
  );
  const nextMap = new Map(
    nextWeekHours.map((h) => [parseInt(h.datetime.split(":")[0], 10), h]),
  );

  const chartData = hours.map((hr) => {
    const tw = thisMap.get(hr);
    const nw = nextMap.get(hr);
    return {
      time: formatHour(`${hr}:00:00`),
      [thisWeekLabel]: tw?.temp ?? null,
      [nextWeekLabel]: nw?.temp ?? null,
      [`${thisWeekLabel} Rain`]: tw?.precipprob ?? null,
      [`${nextWeekLabel} Rain`]: nw?.precipprob ?? null,
    };
  });

  if (!chartData.length) return null;

  const startLabel = formatHour(`${eventStartHour}:00:00`);
  const endLabel = formatHour(`${eventEndHour}:00:00`);

  const refLines = (
    <>
      <ReferenceLine
        x={startLabel}
        stroke="hsl(20 5% 45% / 0.5)"
        strokeDasharray="4 4"
        strokeWidth={1}
        label={{
          value: "Start",
          position: "top",
          fontSize: 10,
          fill: "hsl(20 5% 45%)",
        }}
      />
      <ReferenceLine
        x={endLabel}
        stroke="hsl(20 5% 45% / 0.5)"
        strokeDasharray="4 4"
        strokeWidth={1}
        label={{
          value: "End",
          position: "top",
          fontSize: 10,
          fill: "hsl(20 5% 45%)",
        }}
      />
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Temperature (°F)
          </h4>
          <ChartLegend
            items={[
              { color: THIS_WEEK_COLOR, label: thisWeekLabel },
              { color: NEXT_WEEK_COLOR, label: nextWeekLabel },
            ]}
          />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke={gridStroke}
              />
              <XAxis
                dataKey="time"
                tick={axisTickStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={axisTickStyle}
                domain={[globalTempMin, globalTempMax]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {refLines}
              <Line
                type="natural"
                dataKey={thisWeekLabel}
                stroke={THIS_WEEK_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3, fill: THIS_WEEK_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="natural"
                dataKey={nextWeekLabel}
                stroke={NEXT_WEEK_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3, fill: NEXT_WEEK_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Rain Probability (%)
          </h4>
          <ChartLegend
            items={[
              { color: THIS_WEEK_COLOR, label: thisWeekLabel },
              { color: NEXT_WEEK_COLOR, label: nextWeekLabel },
            ]}
          />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke={gridStroke}
              />
              <XAxis
                dataKey="time"
                tick={axisTickStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={axisTickStyle}
                domain={[0, globalRainMax]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {refLines}
              <Line
                type="natural"
                dataKey={`${thisWeekLabel} Rain`}
                name={thisWeekLabel}
                stroke={THIS_WEEK_COLOR}
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: THIS_WEEK_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="natural"
                dataKey={`${nextWeekLabel} Rain`}
                name={nextWeekLabel}
                stroke={NEXT_WEEK_COLOR}
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: NEXT_WEEK_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

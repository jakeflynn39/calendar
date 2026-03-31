import type { DayData, HourData } from "../types/weather";
import { getWeatherMessage } from "../utils/weatherMessages";

interface Props {
  day: DayData;
  hours?: HourData[];
}

export default function WeatherMessage({ day, hours }: Props) {
  return (
    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
      {getWeatherMessage(day, hours)}
    </p>
  );
}

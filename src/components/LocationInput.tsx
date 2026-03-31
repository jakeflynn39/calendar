import { useState, lazy, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MapPicker = lazy(() => import("./MapPicker"));

const EMOJI_MAP = "🗺️";
const EMOJI_PIN = "📍";
const ELLIPSIS = "…";

interface Props {
  onSubmit: (location: string) => void;
  loading: boolean;
  resolvedAddress?: string;
  initialValue?: string;
}

export default function LocationInput({
  onSubmit,
  loading,
  resolvedAddress,
  initialValue = "",
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [mapOpen, setMapOpen] = useState(false);

  const isDisabled = loading || !value.trim();

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  const handleMapSelect = (location: string) => {
    setValue(location);
    setMapOpen(false);
    onSubmit(location);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter city or zip code${ELLIPSIS}`}
          className="flex-1"
        />
        <Button type="submit" disabled={isDisabled}>
          {loading ? `Loading${ELLIPSIS}` : "Search"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setMapOpen(true)}
        >
          {EMOJI_MAP} Map
        </Button>
      </form>
      {resolvedAddress && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {EMOJI_PIN} {resolvedAddress}
        </p>
      )}

      {mapOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
              <div className="text-sm text-muted-foreground">
                Loading map{ELLIPSIS}
              </div>
            </div>
          }
        >
          <MapPicker
            onSelect={handleMapSelect}
            onClose={() => setMapOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

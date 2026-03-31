import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795]; // geographic center of contiguous US
const DEFAULT_ZOOM = 4;
const COORD_PRECISION = 4;

// url param can't use extra space
function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`;
}

// extra space in this one for display
function formatCoordsDisplay(lat: number, lng: number): string {
  return `${lat.toFixed(COORD_PRECISION)}, ${lng.toFixed(COORD_PRECISION)}`;
}

interface Props {
  onSelect: (location: string) => void;
  onClose: () => void;
}

export default function MapPicker({ onSelect, onClose }: Props) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current).setView(
      DEFAULT_CENTER,
      DEFAULT_ZOOM,
    );

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCoords([lat, lng]);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleConfirm = () => {
    if (coords) {
      onSelect(formatCoords(coords[0], coords[1]));
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-black/50">
      <div className="bg-card border-b px-4 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {coords ? "Location selected" : "Tap the map to pick a location"}
          </p>

          {coords && (
            <span className="text-xs text-muted-foreground">
              {formatCoordsDisplay(coords[0], coords[1])}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button size="sm" disabled={!coords} onClick={handleConfirm}>
            Use this location
          </Button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}

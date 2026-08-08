"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Custom pin — no image files needed
const pinIcon = L.divIcon({
  html: `<div style="width:22px;height:22px;background:#0c4a6e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  className: "",
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface MapPickerProps {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string, address?: string) => void;
}

// Flies the map to a new position when pos changes
function MapController({ pos }: { pos: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number]>(pos);
  useEffect(() => {
    if (prev.current[0] !== pos[0] || prev.current[1] !== pos[1]) {
      map.flyTo(pos, 16, { duration: 0.8 });
      prev.current = pos;
    }
  }, [pos, map]);
  return null;
}

// Moves the pin when user clicks the map
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pos, setPos] = useState<[number, number]>([
    parseFloat(lat) || -13.075,
    parseFloat(lng) || -76.461,
  ]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync when parent values change
  useEffect(() => {
    const newLat = parseFloat(lat);
    const newLng = parseFloat(lng);
    if (!isNaN(newLat) && !isNaN(newLng)) setPos([newLat, newLng]);
  }, [lat, lng]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`,
        { headers: { "Accept-Language": "es" } },
      );
      setResults(await r.json());
    } catch {
      // ignore network errors
    } finally {
      setSearching(false);
    }
  };

  const pick = (r: NominatimResult) => {
    const newPos: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)];
    setPos(newPos);
    setQuery(r.display_name);
    setResults([]);
    onChange(r.lat, r.lon, r.display_name);
  };

  const move = (lat: number, lng: number) => {
    setPos([lat, lng]);
    onChange(lat.toFixed(6), lng.toFixed(6));
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => doSearch(e.target.value), 500);
            }}
            placeholder="Busca tu dirección…"
            className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
          />
          {searching && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>

        {/* Autocomplete dropdown */}
        {results.length > 0 && (
          <ul className="absolute z-[9999] mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-sm transition hover:bg-slate-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0c4a6e]" />
                  <span className="line-clamp-2 text-slate-700">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={pos}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapController pos={pos} />
          <ClickHandler onClick={move} />
          <Marker
            position={pos}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = (e.target as L.Marker).getLatLng();
                move(lat, lng);
              },
            }}
          />
        </MapContainer>
      </div>

      {/* Coordinates readout */}
      <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-2.5">
        <span className="text-xs text-slate-400">Coordenadas:</span>
        <code className="text-xs font-mono text-slate-600">
          {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
        </code>
      </div>

      <p className="text-xs text-slate-400">
        Busca tu dirección arriba, haz clic en el mapa o arrastra el pin para ajustar la posición exacta.
      </p>
    </div>
  );
}

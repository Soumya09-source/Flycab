import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export type LatLng = [number, number];

// Custom gold pins (no external image dependencies)
const pinIcon = (label: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:relative;transform:translate(-50%,-100%);">
        <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,hsl(42,70%,62%),hsl(38,80%,50%));box-shadow:0 6px 18px hsl(42 80% 30% / 0.5),0 0 0 3px hsl(222 45% 7%);display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);font:600 11px Inter,sans-serif;color:hsl(222,50%,8%);">${label}</span>
        </div>
      </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });

function ClickHandler({ onClick }: { onClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function FitBounds({ start, end }: { start: LatLng | null; end: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (start && end) {
      map.fitBounds([start, end], { padding: [60, 60], maxZoom: 14 });
    }
  }, [start, end, map]);
  return null;
}

export const FlightMap = ({
  start,
  end,
  onPick,
}: {
  start: LatLng | null;
  end: LatLng | null;
  onPick: (latlng: LatLng) => void;
}) => {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onPick} />
      {start && <Marker position={start} icon={pinIcon("A")} />}
      {end && <Marker position={end} icon={pinIcon("B")} />}
      {start && end && (
        <Polyline
          positions={[start, end]}
          pathOptions={{ color: "hsl(42, 70%, 60%)", weight: 3, dashArray: "8 8", opacity: 0.95 }}
        />
      )}
      <FitBounds start={start} end={end} />
    </MapContainer>
  );
};

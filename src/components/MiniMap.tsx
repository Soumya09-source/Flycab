import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Safely configure Leaflet icons for Vite without SSR crashes
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  });
}

type LatLngTuple = [number, number];

interface MiniMapProps {
  pickup: LatLngTuple | null;
  destination: LatLngTuple | null;
}

// Sub-component to handle map bounds zooming dynamically when coordinates change
function MapFitter({ pickup, destination }: MiniMapProps) {
  const map = useMap();
  useEffect(() => {
    if (pickup && destination) {
      // Create a latLng bounds covering both points
      const bounds = L.latLngBounds(L.latLng(pickup[0], pickup[1]), L.latLng(destination[0], destination[1]));
      // Pad out the map so the markers don't hit the absolute edge of the box
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [pickup, destination, map]);
  return null;
}

export function MiniMap({ pickup, destination }: MiniMapProps) {
  const [routePolyline, setRoutePolyline] = useState<LatLngTuple[]>([]);

  useEffect(() => {
    // Generate an immediate mock path trace rendering without needing an extensive OSRM API lookup purely for the MiniMap aesthetics
    // If we wanted exact street routing we'd call OSRM here, but a direct golden flight path looks elegant for the preview overview!
    if (pickup && destination) {
       setRoutePolyline([pickup, destination]);
    }
  }, [pickup, destination]);

  // Center defaults reasonably to one of the markers initially before fitter kicks in
  const initialCenter = pickup || [12.9716, 77.5946];

  return (
    <div className="w-full h-full overflow-hidden relative z-10" style={{ minHeight: '250px' }}>
      <MapContainer 
        center={initialCenter} 
        zoom={12} 
        style={{ height: "100%", width: "100%", zIndex: 0 }} 
        zoomControl={false} // Disable zoom controls for a cleaner UI preview card
        dragging={false} // Make it behave like a static preview widget
        scrollWheelZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer 
          attribution="" // Removed attribution aesthetically for preview cards per standard UX
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        <MapFitter pickup={pickup} destination={destination} />

        {pickup && <Marker position={pickup} />}
        {destination && <Marker position={destination} />}

        {routePolyline.length > 0 && (
          <Polyline 
            positions={routePolyline} 
            pathOptions={{ color: 'hsl(42, 60%, 50%)', weight: 4, dashArray: '10, 10' }} // Standardized Gold dashed line matching booking page!
          />
        )}
      </MapContainer>
    </div>
  );
}

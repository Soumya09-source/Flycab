import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Safely configure Leaflet icons
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Only run Leaflet DOM manipulations if window exists to prevent SSR crashes
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  });
}

function RecenterMap({ pickup }: { pickup: string }) {
  const map = useMap();
  useEffect(() => {
    if (pickup.length > 3) {
      // Mock geocoding by slightly altering the base coordinates
      const offset = (pickup.length % 10) * 0.005;
      map.flyTo([12.9716 + offset, 77.5946 + offset], 14, { animate: true });
    } else {
      map.flyTo([12.9716, 77.5946], 13, { animate: true });
    }
  }, [pickup, map]);
  return null;
}

export default function Book() {
  console.log("[Book.tsx] Initializing component rendering setup...");

  const authContext = useAuth();
  const user = authContext ? authContext.user : null;
  
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Book.tsx] Component successfully mounted.");
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !drop) {
      toast.error("Pickup and Drop locations are required.");
      return;
    }
    if (!user) {
      toast.error("Authentication required to book a ride.");
      return;
    }

    console.log("[Book.tsx] Submitting booking for user:", user.id);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('rides').insert([
        { 
          user_id: user?.id || "anonymous",
          distance_km: 10,
          end_label: drop || "Unknown Drop",
          end_lat: 12.98,
          end_lng: 77.60,
          eta_minutes: 25,
          price: 150,
          start_label: pickup || "Unknown Pickup",
          start_lat: 12.9716,
          start_lng: 77.5946,
          tier: 'standard'
        }
      ]);

      if (error) {
        if (error.code === '42P01') { 
            console.log("[Book.tsx] 'rides' table missing, falling back to 'bookings'.");
            const fallbackResult = await (supabase.from as any)('bookings').insert([{ pickup: pickup, drop: drop, user_id: user.id }]);
            if (fallbackResult.error) throw fallbackResult.error;
        } else {
            throw error;
        }
      }

      console.log("[Book.tsx] Booking success.");
      toast.success("Booking Successful! Your ride is confirmed.");
      setPickup("");
      setDrop("");
    } catch (err: any) {
      console.error("[Book.tsx] Booking error caught:", err);
      toast.error(err?.message || "Failed to save booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-background relative z-10 pt-[64px]">
      
      {/* LEFT PANE - Booking Form UI */}
      <div className="w-full md:w-[400px] lg:w-[450px] p-6 lg:p-8 flex flex-col bg-card border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-20 overflow-y-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2 mt-8 md:mt-0">Book a Ride</h1>
        <p className="text-muted-foreground text-sm mb-8">Enter your pickup and destination to calculate your route.</p>
        
        <form onSubmit={handleBook} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground tracking-wide">Pickup Location</label>
            <input 
              type="text" 
              value={pickup || ""}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="e.g. MG Road, Bangalore"
              className="px-4 py-3 rounded-lg bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground tracking-wide">Destination</label>
            <input 
              type="text" 
              value={drop || ""}
              onChange={(e) => setDrop(e.target.value)}
              placeholder="e.g. Airport Terminal 1"
              className="px-4 py-3 rounded-lg bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || (!pickup && !drop)}
            className="mt-6 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? "Booking route..." : "Confirm Booking"}
          </button>
        </form>

        {!user && (
          <div className="mt-8 p-4 rounded-lg border border-primary/30 bg-primary/10 text-primary-foreground text-sm text-center">
            <strong>Logged Out:</strong> Please log in to complete your booking securely.
          </div>
        )}
      </div>

      {/* RIGHT PANE - Safe Map Rendering */}
      <div className="flex-1 w-full relative min-h-[400px] md:min-h-full bg-muted z-10 border-l border-gray-200">
        {mapError ? (
           <div className="absolute inset-0 flex items-center justify-center p-6 text-red-500 font-medium text-center">
             Map Initialization Error: {mapError}
           </div>
        ) : (
          <MapContainer 
            center={[12.9716, 77.5946]} 
            zoom={13} 
            style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", zIndex: 0 }} 
            zoomControl={true}
          >
            <TileLayer 
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <RecenterMap pickup={pickup} />
            <Marker position={[12.9716 + ((pickup.length % 10) * 0.005 || 0), 77.5946 + ((pickup.length % 10) * 0.005 || 0)]}>
              <Popup>Selected Pickup</Popup>
            </Marker>
          </MapContainer>
        )}
      </div>
    </div>
  );
}
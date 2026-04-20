import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crosshair, Navigation, Loader2, CheckCircle, CreditCard, ChevronRight } from "lucide-react";

// Safely configure Leaflet icons
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

type LatLng = [number, number];
const BLR_CENTER: LatLng = [12.9716, 77.5946];

// Helper to smooth pan map
function MapUpdater({ center, polyline }: { center: LatLng, polyline: LatLng[] | null }) {
  const map = useMap();
  useEffect(() => {
    if (polyline && polyline.length > 0) {
      map.fitBounds(polyline, { padding: [50, 50], animate: true });
    } else {
      map.flyTo(center, 13, { animate: true });
    }
  }, [center, polyline, map]);
  return null;
}

export default function Book() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlTier = searchParams.get("tier");
  const validTier = ['economy', 'standard', 'premium'].includes(urlTier || '') ? urlTier : 'standard';
  
  const [pickupText, setPickupText] = useState("");
  const [dropText, setDropText] = useState("");
  
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [dropCoords, setDropCoords] = useState<LatLng | null>(null);

  const [routePolyline, setRoutePolyline] = useState<LatLng[] | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [etaMins, setEtaMins] = useState<number>(0);

  const [isCalculating, setIsCalculating] = useState(false);
  const [bookingStage, setBookingStage] = useState<'idle' | 'searching' | 'assigned' | 'payment' | 'completed'>('idle');
  const [tier, setTier] = useState<'economy'|'standard'|'premium'>(validTier as any);

  const baseFares = { economy: 50, standard: 100, premium: 300 };
  const perKmFares = { economy: 15, standard: 25, premium: 60 };
  const calculatedPrice = Math.round(baseFares[tier] + (distanceKm * perKmFares[tier]));

  // Auto Geolocate
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.info("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setPickupCoords([latitude, longitude]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setPickupText(data.display_name.split(',')[0]); // First segment of address
          toast.success("Location detected!");
        } catch (e) {
          setPickupText("Current Location");
        }
      },
      () => toast.error("Failed to retrieve location")
    );
  };

  // Helper Geocode: Nominatim
  const geocode = async (query: string): Promise<LatLng | null> => {
    try {
      // Bounding box for Bangalore roughly for better results
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=77.4,13.1,77.8,12.8&bounded=1`);
      const data = await res.json();
      if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      return null;
    } catch { return null; }
  };

  // Calculate Route via OSRM
  const handleCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupText || !dropText) return toast.error("Pickup and Drop locations are required.");

    setIsCalculating(true);
    try {
      let pCoords = pickupCoords;
      if (!pCoords) pCoords = await geocode(pickupText);
      let dCoords = dropCoords;
      if (!dCoords) dCoords = await geocode(dropText);

      if (!pCoords || !dCoords) {
         toast.error("Could not find locations on map. Try being more specific.");
         setIsCalculating(false);
         return;
      }

      setPickupCoords(pCoords);
      setDropCoords(dCoords);

      // OSRM requires longitude,latitude
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pCoords[1]},${pCoords[0]};${dCoords[1]},${dCoords[0]}?overview=full&geometries=geojson`);
      const data = await res.json();

      if (data.code === "Ok" && data.routes.length > 0) {
        const route = data.routes[0];
        setDistanceKm(route.distance / 1000); // meters to km
        setEtaMins(Math.round(route.duration / 60)); // seconds to mins
        
        // Convert GeoJSON coords [lng, lat] to Leaflet [lat, lng]
        const swappedCoords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLng);
        setRoutePolyline(swappedCoords);
        toast.success("Optimal route calculated");
      }
    } catch (err) {
      toast.error("Failed to calculate route");
    } finally {
      setIsCalculating(false);
    }
  };

  // Ride Booking Workflow Engine
  const startRideFlow = () => {
    if (!user) return toast.error("You must be logged in to book.");
    if (distanceKm === 0) return toast.error("Calculate a route first!");

    setBookingStage('searching');
    setTimeout(() => {
      setBookingStage('assigned');
      setTimeout(() => {
        setBookingStage('payment');
      }, 2500);
    }, 3000);
  };

  const processPayment = async () => {
    setBookingStage('completed');

    try {
      const { error } = await supabase.from('rides').insert([{ 
          user_id: user?.id || "anonymous",
          distance_km: distanceKm,
          end_label: dropText,
          end_lat: dropCoords![0],
          end_lng: dropCoords![1],
          eta_minutes: etaMins,
          price: calculatedPrice,
          start_label: pickupText,
          start_lat: pickupCoords![0],
          start_lng: pickupCoords![1],
          tier: tier
      }]);

      if (error && error.code === '42P01') { 
         // Fallback legacy insert
         await (supabase.from as any)('bookings').insert([{ pickup: pickupText, drop: dropText, user_id: user?.id }]);
      }

      setTimeout(() => {
         toast.success("Payment Received. FlyCab booked!");
         // Reset state
         setBookingStage('idle');
         setRoutePolyline(null);
         setPickupText("");
         setDropText("");
         setPickupCoords(null);
         setDropCoords(null);
         setDistanceKm(0);
      }, 2000);
    } catch (err) {
      toast.error("Booking recording failed, but ride dispatched.");
      setBookingStage('idle');
    }
  };


  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-background relative z-10 pt-[64px]">
      
      {/* Booking Modal States Overlay */}
      {bookingStage !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
           {bookingStage === 'searching' && (
             <div className="bg-card p-10 rounded-3xl shadow-[0_0_50px_rgba(255,200,0,0.15)] flex flex-col items-center border border-border animate-fade-up">
               <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
               <h2 className="text-2xl font-display font-medium">Scanning airspace...</h2>
               <p className="text-muted-foreground mt-2">Locating nearest available {tier} cab</p>
             </div>
           )}
           {bookingStage === 'assigned' && (
             <div className="bg-card p-10 rounded-3xl shadow-[0_0_50px_rgba(255,200,0,0.15)] flex flex-col items-center border border-border animate-fade-up">
               <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle className="w-10 h-10" />
               </div>
               <h2 className="text-2xl font-display font-medium">Found your pilot!</h2>
               <p className="text-muted-foreground mt-2">Pilot Vihang is 2 mins away.</p>
             </div>
           )}
           {bookingStage === 'payment' && (
             <div className="bg-card p-8 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(255,200,0,0.15)] border border-border animate-fade-up">
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-display font-medium">Complete Payment</h2>
                 <span className="text-2xl text-gold-gradient font-bold">₹{calculatedPrice}</span>
               </div>
               
               <div className="space-y-4">
                 <div className="p-4 border border-border rounded-xl flex items-center gap-4 bg-muted/30 hover:border-gold/50 cursor-pointer transition-colors text-foreground">
                   <CreditCard className="w-6 h-6 text-gold" />
                   <div>
                     <p className="font-medium text-sm">FlyCab Card</p>
                     <p className="text-xs text-muted-foreground">**** 4242</p>
                   </div>
                 </div>
               </div>

               <button onClick={processPayment} className="w-full mt-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md">
                 Pay securely via Vault
               </button>
             </div>
           )}
           {bookingStage === 'completed' && (
             <div className="bg-card p-10 rounded-3xl shadow-[0_0_50px_rgba(255,200,0,0.15)] flex flex-col items-center border border-border animate-fade-up scale-105 transition-transform">
               <div className="w-20 h-20 bg-primary/20 text-gold rounded-full flex items-center justify-center mb-6">
                 <CheckCircle className="w-10 h-10" />
               </div>
               <h2 className="text-2xl font-display font-medium">Payment Successful</h2>
               <p className="text-muted-foreground mt-2">Your cabin is preparing for takeoff.</p>
             </div>
           )}
        </div>
      )}

      {/* LEFT PANE - Booking Form UI */}
      <div className="w-full md:w-[400px] lg:w-[450px] p-6 lg:p-8 flex flex-col bg-card border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-20 overflow-y-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-1 mt-8 md:mt-0">Where to?</h1>
        <p className="text-muted-foreground text-sm mb-6">Real-time geospatial routing</p>
        
        <form onSubmit={handleCalculateRoute} className="flex flex-col gap-5">
          <div className="relative flex flex-col gap-1.5 group">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Pickup</label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={pickupText}
                onChange={(e) => { setPickupText(e.target.value); setPickupCoords(null); setRoutePolyline(null); setDistanceKm(0); }}
                placeholder="e.g. Indiranagar, Bangalore"
                className="w-full pl-3 pr-10 py-3 rounded-xl bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm"
              />
              <button 
                type="button" 
                onClick={handleAutoLocate}
                className="absolute right-3 text-muted-foreground hover:text-gold transition-colors"
                title="Use current location"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 group">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Destination</label>
            <input 
              type="text" 
              value={dropText}
              onChange={(e) => { setDropText(e.target.value); setDropCoords(null); setRoutePolyline(null); setDistanceKm(0); }}
              placeholder="e.g. Airport Terminal 1"
              className="w-full px-3 py-3 rounded-xl bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm"
            />
          </div>

          {distanceKm === 0 ? (
            <button 
              type="submit" 
              disabled={isCalculating || !pickupText || !dropText}
              className="mt-4 px-6 py-4 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calculate Route via OSRM"}
            </button>
          ) : (
            <div className="mt-4 animate-fade-in space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-xl border border-border flex flex-col justify-center items-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Flight Distance</span>
                  <span className="text-xl font-display font-medium text-foreground">{distanceKm.toFixed(1)} km</span>
                </div>
                <div className="bg-muted p-4 rounded-xl border border-border flex flex-col justify-center items-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. ETA</span>
                  <span className="text-xl font-display font-medium text-foreground">{etaMins} mins</span>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id:'economy', title:'Eco', mul: perKmFares.economy, base: baseFares.economy },
                  { id:'standard', title:'Standard', mul: perKmFares.standard, base: baseFares.standard },
                  { id:'premium', title:'Lux', mul: perKmFares.premium, base: baseFares.premium }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id as any)}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${tier === t.id ? 'bg-primary/10 border-gold shadow-[0_0_15px_rgba(255,200,0,0.1)] text-gold' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <span className="text-xs font-semibold">{t.title}</span>
                    <span className="text-sm font-bold">₹{Math.round(t.base + (distanceKm * t.mul))}</span>
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={startRideFlow}
                className="w-full px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-md flex justify-between items-center"
              >
                <span>Request {tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                <span className="flex items-center gap-2">₹{calculatedPrice} <ChevronRight className="w-5 h-5"/></span>
              </button>
            </div>
          )}
        </form>

        {!user && (
          <div className="mt-8 p-4 rounded-lg border border-primary/30 bg-primary/10 text-primary-foreground text-sm text-center">
            <strong>Logged Out:</strong> Please log in to complete your booking securely.
          </div>
        )}
      </div>

      {/* RIGHT PANE - Safe Map Rendering */}
      <div className="flex-1 w-full relative min-h-[400px] md:min-h-full bg-muted z-10 border-l border-gray-200">
          <MapContainer 
            center={BLR_CENTER} 
            zoom={13} 
            style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", zIndex: 0 }} 
            zoomControl={true}
          >
            <TileLayer 
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <MapUpdater center={pickupCoords || BLR_CENTER} polyline={routePolyline} />
            
            {pickupCoords && (
              <Marker position={pickupCoords}>
                <Popup>Pickup Location</Popup>
              </Marker>
            )}
            {dropCoords && (
              <Marker position={dropCoords}>
                <Popup>Drop Location</Popup>
              </Marker>
            )}
            {routePolyline && (
              <Polyline 
                positions={routePolyline} 
                pathOptions={{ color: 'hsl(42, 60%, 50%)', weight: 4, dashArray: '10, 10' }} // Gold-ish dotted line
              />
            )}
          </MapContainer>
      </div>
    </div>
  );
}
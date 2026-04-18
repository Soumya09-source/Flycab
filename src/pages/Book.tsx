import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { FlightMap, LatLng } from "@/components/FlightMap";
import { Button } from "@/components/ui/button";
import { TIERS, Tier, haversineKm, priceFor, etaFor, formatINR } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Navigation, Plane, Clock, Users } from "lucide-react";

const PRESETS: { label: string; coords: LatLng }[] = [
  { label: "Kempegowda Airport", coords: [13.1986, 77.7066] },
  { label: "MG Road", coords: [12.9756, 77.6050] },
  { label: "Whitefield", coords: [12.9698, 77.7500] },
  { label: "Electronic City", coords: [12.8452, 77.6602] },
  { label: "Indiranagar", coords: [12.9784, 77.6408] },
  { label: "Koramangala", coords: [12.9352, 77.6245] },
];

const Book = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [startLabel, setStartLabel] = useState("");
  const [endLabel, setEndLabel] = useState("");
  const [pickMode, setPickMode] = useState<"start" | "end">("start");
  const [tier, setTier] = useState<Tier>("standard");
  const [booking, setBooking] = useState(false);

  const distance = useMemo(() => (start && end ? haversineKm(start, end) : 0), [start, end]);
  const ready = !!(start && end && distance > 0);

  const onMapPick = (latlng: LatLng) => {
    if (pickMode === "start") {
      setStart(latlng);
      setStartLabel(`Pin (${latlng[0].toFixed(3)}, ${latlng[1].toFixed(3)})`);
      setPickMode("end");
    } else {
      setEnd(latlng);
      setEndLabel(`Pin (${latlng[0].toFixed(3)}, ${latlng[1].toFixed(3)})`);
    }
  };

  const setPreset = (which: "start" | "end", p: { label: string; coords: LatLng }) => {
    if (which === "start") { setStart(p.coords); setStartLabel(p.label); }
    else { setEnd(p.coords); setEndLabel(p.label); }
  };

  const reset = () => {
    setStart(null); setEnd(null); setStartLabel(""); setEndLabel(""); setPickMode("start");
  };

  const confirm = async () => {
    if (!ready || !user || !start || !end) return;
    setBooking(true);
    try {
      const { error } = await supabase.from("rides").insert({
        user_id: user.id,
        start_label: startLabel || "Pickup",
        end_label: endLabel || "Drop-off",
        start_lat: start[0], start_lng: start[1],
        end_lat: end[0], end_lng: end[1],
        distance_km: Number(distance.toFixed(2)),
        tier,
        price: priceFor(distance, tier),
        eta_minutes: etaFor(distance, tier),
      });
      if (error) throw error;
      toast.success("Flight booked. Your taxi is en route.");
      nav("/history");
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6 animate-fade-up">
          <h1 className="font-display text-4xl md:text-5xl">Plan your flight</h1>
          <p className="text-muted-foreground mt-1">Tap the map to set pickup and drop-off — or pick a preset below.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr,420px] gap-6">
          {/* Map */}
          <div className="relative h-[460px] md:h-[600px] rounded-2xl overflow-hidden shadow-elegant border border-border">
            <FlightMap start={start} end={end} onPick={onMapPick} />
            <div className="absolute top-4 left-4 z-[400] glass rounded-full px-4 py-2 text-xs">
              Picking: <span className="text-gold font-medium">{pickMode === "start" ? "Pickup (A)" : "Drop-off (B)"}</span>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 animate-fade-up">
            <div className="glass rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Pickup</label>
                <div className="mt-1 px-3 py-2 rounded-md bg-input/60 text-sm">{startLabel || <span className="text-muted-foreground">Tap map or pick preset</span>}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESETS.map((p) => (
                    <button key={"s" + p.label} onClick={() => setPreset("start", p)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:text-gold transition-colors">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Navigation className="h-3 w-3" /> Drop-off</label>
                <div className="mt-1 px-3 py-2 rounded-md bg-input/60 text-sm">{endLabel || <span className="text-muted-foreground">Set destination</span>}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESETS.map((p) => (
                    <button key={"e" + p.label} onClick={() => setPreset("end", p)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:text-gold transition-colors">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="glass" size="sm" className="flex-1" onClick={() => setPickMode("start")}>Set A</Button>
                <Button variant="glass" size="sm" className="flex-1" onClick={() => setPickMode("end")}>Set B</Button>
                <Button variant="ghost" size="sm" onClick={reset}>Clear</Button>
              </div>
            </div>

            {/* Tiers */}
            <div className="space-y-2">
              {(Object.keys(TIERS) as Tier[]).map((k) => {
                const t = TIERS[k];
                const selected = tier === k;
                return (
                  <button
                    key={k}
                    onClick={() => setTier(k)}
                    className={`w-full text-left rounded-xl p-4 border transition-all ${
                      selected
                        ? "border-primary bg-secondary/40 shadow-gold"
                        : "border-border hover:border-primary/40 bg-card/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xl">{t.label}</span>
                          {selected && <span className="text-[10px] uppercase tracking-wider text-gold">Selected</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.tagline}</div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ready ? `${etaFor(distance, k)} min` : `~${t.speedKmh} km/h`}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t.capacity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gold-gradient">
                          {ready ? formatINR(priceFor(distance, k)) : `×${t.multiplier}`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{ready ? `${distance.toFixed(1)} km` : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">ETA</span>
                <span className="font-medium">{ready ? `${etaFor(distance, tier)} min` : "—"}</span>
              </div>
              <div className="hairline pt-3 flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-3xl text-gold-gradient">
                  {ready ? formatINR(priceFor(distance, tier)) : "—"}
                </span>
              </div>
              <Button variant="hero" className="w-full h-12" disabled={!ready || booking} onClick={confirm}>
                <Plane className="h-4 w-4 rotate-[-30deg]" />
                {booking ? "Securing your aircraft…" : "Confirm flight"}
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Book;

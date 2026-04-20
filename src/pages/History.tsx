import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plane, ArrowRight, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Ride = {
  id: string;
  start_label: string;
  end_label: string;
  distance_km: number;
  tier: "economy" | "standard" | "premium";
  price: number;
  eta_minutes: number;
  created_at: string;
};

const tierColor: Record<string, string> = {
  economy: "border-muted-foreground/40 text-muted-foreground",
  standard: "border-primary/50 text-gold",
  premium: "border-primary text-primary bg-primary/10",
};

const History = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[History] Load error:", error);
      toast.error(error.message);
    } else {
      setRides(data as Ride[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("rides").delete().eq("id", id);
    if (error) {
      console.error("[History] Remove error:", error);
      return toast.error(error.message);
    }
    setRides((r) => r.filter((x) => x.id !== id));
    toast.success("Ride removed");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-10 max-w-4xl">
        <div className="flex items-end justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">Your flights</h1>
            <p className="text-muted-foreground mt-1">A record of every journey above the city.</p>
          </div>
          <Button variant="hero" asChild><Link to="/book">New flight</Link></Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map((i) => <div key={i} className="h-28 rounded-xl bg-card/40 animate-pulse" />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Plane className="h-10 w-10 text-gold mx-auto mb-4 rotate-[-30deg] animate-float" />
            <h2 className="font-display text-2xl mb-2">No flights yet</h2>
            <p className="text-muted-foreground mb-6">Your sky journey starts with a single tap.</p>
            <Button variant="hero" asChild><Link to="/book">Book your first flight</Link></Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up">
            {rides.map((r) => (
              <div key={r.id} className="glass rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 group hover:border-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate max-w-[180px] md:max-w-none">{r.start_label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gold shrink-0" />
                    <span className="truncate max-w-[180px] md:max-w-none">{r.end_label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span>•</span>
                    <span>{Number(r.distance_km).toFixed(1)} km</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.eta_minutes} min</span>
                  </div>
                </div>
                <div className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${tierColor[r.tier]}`}>
                  {r.tier}
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-gold-gradient">{formatINR(Number(r.price))}</div>
                </div>
                <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;

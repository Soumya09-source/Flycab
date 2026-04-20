import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/pricing";
import { Link } from "react-router-dom";
import { User, Activity, Map, PiggyBank, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Ride = {
  id: string;
  distance_km: number;
  price: number;
  created_at: string;
};

export default function Profile() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('rides')
        .select('id, distance_km, price, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Ascending for chronological chart
      
      if (error) toast.error("Failed to load analytics");
      else setRides(data as Ride[]);
      setLoading(false);
    };
    fetchAnalytics();
  }, [user]);

  // Derived Metrics
  const totalRides = rides.length;
  const totalDistance = rides.reduce((sum, r) => sum + Number(r.distance_km), 0);
  const totalSpent = rides.reduce((sum, r) => sum + Number(r.price), 0);

  // Formatting data for chart: aggregate by week/month or simply plot last 10 rides
  const chartData = useMemo(() => {
    return rides.slice(-15).map((r, i) => ({
      name: `Flight ${i + 1}`,
      Distance: Number(r.distance_km).toFixed(1),
      Cost: Number(r.price)
    }));
  }, [rides]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 max-w-5xl">
        <div className="flex items-center gap-4 animate-fade-in mb-10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-gold border border-gold/30">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-4xl">My Profile</h1>
            <p className="text-muted-foreground">{user?.email || "Encrypted Identity"}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-gold animate-spin" /></div>
        ) : totalRides === 0 ? (
           <div className="glass rounded-2xl p-12 text-center border border-border">
             <Activity className="w-12 h-12 text-gold/50 mx-auto mb-4" />
             <h2 className="text-2xl font-display">No flight data yet</h2>
             <p className="text-muted-foreground mt-2 mb-6">Your analytics will populate here after your first flight.</p>
             <Link to="/book" className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl inline-flex items-center gap-2">
               Book Now <ArrowRight className="w-4 h-4" />
             </Link>
           </div>
        ) : (
          <div className="space-y-8 animate-fade-up">
            
            {/* KPI Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border border-border flex items-center gap-5 hover:border-gold/40 transition-colors">
                <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl"><Activity className="w-7 h-7" /></div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Flights</p>
                  <p className="text-3xl font-display text-foreground">{totalRides}</p>
                </div>
              </div>
              <div className="glass p-6 rounded-3xl border border-border flex items-center gap-5 hover:border-gold/40 transition-colors">
                <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl"><Map className="w-7 h-7" /></div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Air Distance</p>
                  <p className="text-3xl font-display text-foreground">{totalDistance.toFixed(1)} <span className="text-base text-muted-foreground">km</span></p>
                </div>
              </div>
              <div className="glass p-6 rounded-3xl border border-border flex items-center gap-5 hover:border-gold/40 transition-colors">
                <div className="p-4 bg-gold/10 text-gold rounded-2xl"><PiggyBank className="w-7 h-7" /></div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Spent</p>
                  <p className="text-3xl font-display text-gold-gradient">{formatINR(totalSpent)}</p>
                </div>
              </div>
            </div>

            {/* Analytical Chart */}
            <div className="glass p-8 rounded-3xl border border-border">
              <h3 className="font-display text-2xl mb-6">Recent Flight Distances</h3>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}km`} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted) / 0.5)'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px'}} />
                    <Bar dataKey="Distance" fill="hsl(42, 60%, 50%)" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

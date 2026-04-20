import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Plane, Clock, Shield, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const [latestRide, setLatestRide] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setLatestRide(null);
      return;
    }
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // maybeSingle safely returns null if empty
      
      if (!error && data) {
        setLatestRide(data);
      }
    };
    fetchLatest();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-muted-foreground">Now flying over Bengaluru</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight">
              Skip the traffic.<br />
              <span className="text-gold-gradient">Skip the city.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-md">
              Autonomous flying taxis between Bengaluru&rsquo;s landmarks. Premium cabins.
              Whisper-quiet rotors. From rooftop to rooftop in minutes.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button variant="hero" size="lg" asChild>
                <Link to={user ? "/book" : "/auth?mode=signup"}>
                  Book a flight <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <a href="#tiers">Explore tiers</a>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12 max-w-md">
              {[
                { v: "8 min", l: "Avg. flight" },
                { v: "220 km/h", l: "Top speed" },
                { v: "0 traffic", l: "Always" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl text-gold-gradient">{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-[420px] md:h-[520px] hidden md:block">
            <div className="absolute inset-0 glass rounded-3xl overflow-hidden shadow-elegant">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 500" fill="none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={i} x1="0" y1={i * 45} x2="400" y2={i * 45} stroke="hsl(42 60% 50% / 0.15)" />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={"v" + i} x1={i * 45} y1="0" x2={i * 45} y2="500" stroke="hsl(42 60% 50% / 0.15)" />
                ))}
                <path d="M 50 420 Q 200 100 360 80" stroke="hsl(42 70% 60%)" strokeWidth="2" strokeDasharray="6 6" fill="none" />
                <circle cx="50" cy="420" r="6" fill="hsl(42 70% 60%)" />
                <circle cx="360" cy="80" r="6" fill="hsl(42 70% 60%)" />
              </svg>
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-float">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-primary/40 rounded-full" />
                  <Plane className="relative h-24 w-24 text-gold rotate-[-30deg]" strokeWidth={1.2} />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{latestRide ? "Live route" : "Popular route"}</div>
                  <div className="text-sm truncate max-w-[200px]">{latestRide ? `${latestRide.start_label} → ${latestRide.end_label}` : "MG Road → Airport"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-xl text-gold-gradient">{latestRide ? `${latestRide.eta_minutes} min` : "9 min"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 grid md:grid-cols-3 gap-6">
        {[
          { icon: Clock, title: "Minutes, not hours", body: "A 90-minute drive becomes a 9-minute glide. Reclaim your day." },
          { icon: Shield, title: "Engineered for trust", body: "Triple-redundant systems, ballistic parachute, certified pilots-on-call." },
          { icon: Sparkles, title: "A finer way to arrive", body: "Leather cabins, ambient lighting, panoramic glass. Travel as theatre." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-7 hover:border-primary/30 transition-colors">
            <f.icon className="h-6 w-6 text-gold mb-4" />
            <h3 className="font-display text-2xl mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Tiers */}
      <section id="tiers" className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-4xl md:text-5xl">Three ways to fly</h2>
          <p className="text-muted-foreground mt-3">Choose the cabin that matches the moment.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Economy", price: "₹165/km", desc: "Shared cabin. Effortless commute.", featured: false },
            { name: "Standard", price: "₹112/km", desc: "Private cabin. Refined and quick.", featured: true },
            { name: "Premium", price: "₹312/km", desc: "Luxury suite. Concierge included.", featured: false },
          ].map((t) => (
            <div key={t.name} className={`rounded-2xl p-7 transition-all ${
              t.featured ? "glass border-primary/40 shadow-gold scale-[1.02]" : "glass hover:border-primary/30"
            }`}>
              {t.featured && <div className="text-[10px] uppercase tracking-wider text-gold mb-2">Most chosen</div>}
              <h3 className="font-display text-3xl">{t.name}</h3>
              <div className="font-display text-4xl text-gold-gradient mt-3">{t.price}</div>
              <p className="text-sm text-muted-foreground mt-3">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Button variant="hero" size="lg" asChild>
            <Link to={user ? "/book" : "/auth?mode=signup"}>
              Take your first flight <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="container py-10 border-t border-border/50 text-center text-xs text-muted-foreground">
        FlyCab · Bengaluru · Always above the noise.
      </footer>
    </div>
  );
};

export default Index;

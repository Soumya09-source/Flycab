import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const linkCls = (p: string) =>
    `text-sm transition-colors ${loc.pathname === p ? "text-gold" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Plane className="h-5 w-5 text-gold rotate-[-30deg] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <span className="font-display text-2xl tracking-tight">
            Fly<span className="text-gold-gradient font-semibold">Cab</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={linkCls("/")}>Home</Link>
          {user && <Link to="/book" className={linkCls("/book")}>Book</Link>}
          {user && <Link to="/history" className={linkCls("/history")}>History</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-muted-foreground">{user.email}</span>
              <Button variant="glass" size="sm" onClick={async () => { await signOut(); nav("/"); }}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" size="sm" asChild><Link to="/auth?mode=signup">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

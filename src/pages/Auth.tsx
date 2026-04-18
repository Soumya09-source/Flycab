import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plane } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const Auth = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (user) nav("/book", { replace: true });
  }, [user, nav]);

  const friendlyError = (err: any): string => {
    const msg: string = err?.message ?? "";
    const code: string = err?.code ?? "";
    if (code === "invalid_credentials" || /invalid login credentials/i.test(msg)) {
      return "Invalid email or password.";
    }
    if (code === "email_not_confirmed" || /email not confirmed/i.test(msg)) {
      return "Email not confirmed. Please check your inbox or contact support.";
    }
    if (code === "user_already_exists" || /already registered|already exists/i.test(msg)) {
      return "An account with this email already exists. Try signing in.";
    }
    if (code === "over_email_send_rate_limit" || /rate limit/i.test(msg)) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (/fetch|network|failed to fetch/i.test(msg)) {
      return "Network error. Check your connection and try again.";
    }
    return msg || "Something went wrong";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;

        // If confirmations are off, a session is returned immediately.
        if (data.session) {
          toast.success("Welcome aboard. You're signed in.");
          nav("/book", { replace: true });
          return;
        }

        // Fallback: try to sign in directly (covers cases where confirmations are disabled but session wasn't returned)
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message?.toLowerCase().includes("email not confirmed")) {
            toast.success("Account created. Check your email to confirm.");
            return;
          }
          throw signInError;
        }
        toast.success("Welcome aboard.");
        nav("/book", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        nav("/book", { replace: true });
      }
    } catch (err: any) {
      console.error("[Auth] error:", err);
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <Plane className="h-5 w-5 text-gold rotate-[-30deg]" />
          <span className="font-display text-3xl">Fly<span className="text-gold-gradient font-semibold">Cab</span></span>
        </Link>

        <div className="glass rounded-2xl p-8 shadow-elegant">
          <h1 className="font-display text-3xl mb-2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "signup" ? "Begin your journey above the city." : "Your sky is waiting."}
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already flying with us?" : "New to FlyCab?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-gold hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing you agree to our airspace etiquette and safety protocols.
        </p>
      </div>
    </div>
  );
};

export default Auth;

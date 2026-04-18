import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const nav = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        // Handle hash-based tokens (email link / OAuth)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          // supabase-js auto-detects the session from URL
          await supabase.auth.getSession();
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          toast.success("Signed in successfully");
          nav("/book", { replace: true });
        } else {
          nav("/auth", { replace: true });
        }
      } catch (err: any) {
        console.error("[AuthCallback] error:", err);
        toast.error(err.message ?? "Authentication failed");
        nav("/auth", { replace: true });
      }
    };
    run();
  }, [nav]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
};

export default AuthCallback;

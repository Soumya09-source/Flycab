import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Book from "./pages/Book";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  try {
    const authContext = useAuth();
    if (!authContext) {
      return <div style={{ padding: "1rem", color: "red", background: "#fdd" }}>Error: &lt;ProtectedRoute&gt; must be used inside &lt;AuthProvider&gt;!</div>;
    }

    const { user, loading } = authContext;

    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <span>Loading Auth State...</span>
        </div>
      );
    }

    if (!user) {
      console.log("[ProtectedRoute] Redirecting to /auth");
      return <Navigate to="/auth" replace />;
    }

    return children;
  } catch (err) {
    console.error("[ProtectedRoute] Error rendering:", err);
    return <div style={{ padding: "1rem", color: "red" }}>Error rendering protected route component.</div>;
  }
};

export default function App() {
  console.log("[App] Rendering component tree...");
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Use strict positioning so they don't block the screen if they error */}
          <div style={{ zIndex: 999 }}><Toaster /></div>
          <div style={{ zIndex: 999 }}><Sonner /></div>
          
          <BrowserRouter>
            <AuthProvider>
              <RouteErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Public route */}
                  <Route path="/book" element={<Book />} />
                  
                  {/* Protected route */}
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}
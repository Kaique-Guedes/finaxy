import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import StatsPage from "@/pages/StatsPage";
import GoalsPage from "@/pages/GoalsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import ProjectionPage from "@/pages/ProjectionPage";
import AlertsPage from "@/pages/AlertsPage";
import ProfilePage from "@/pages/ProfilePage";
import BottomNav from "@/components/BottomNav";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-background relative">
      <div className="overflow-y-auto min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/projection" element={<ProjectionPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

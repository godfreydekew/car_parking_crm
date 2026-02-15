import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContextProvider";
import { CRMProvider } from "@/context/CRMContextProvider"; 
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import CheckInOut from "./pages/CheckInOut";
import Operations from "./pages/Operations";
import Overstays from "./pages/Overstays";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen message="Authenticating..." />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/check-in-out";

  if (loading) return <LoadingSpinner fullScreen message="Authenticating..." />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={from} replace /> : <Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/check-in-out" element={<CheckInOut />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/overstays" element={<Overstays />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CRMProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </CRMProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

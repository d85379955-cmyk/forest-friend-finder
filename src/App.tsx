import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav, pageOrder } from "@/components/BottomNav";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Weather from "./pages/Weather";
import Status from "./pages/Status";
import Location from "./pages/Location";
import Safety from "./pages/Safety";
import Tools from "./pages/Tools";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showBottomNav = pageOrder.includes(location.pathname);

  return (
    <>
      <SwipeNavigation>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/status" element={<Status />} />
          <Route path="/location" element={<Location />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SwipeNavigation>
      {showBottomNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
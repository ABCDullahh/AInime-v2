import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext";
import { DataSourceProvider } from "@/contexts/DataSourceContext";
import { PWAInstallPrompt, OfflineIndicator, PWAUpdatePrompt } from "@/components/pwa";
import Index from "./pages/Index";
import AISearch from "./pages/AISearch";
import MyList from "./pages/MyList";
import Auth from "./pages/Auth";
import AnimeDetail from "./pages/AnimeDetail";
import Profile from "./pages/Profile";
import TierLists from "./pages/TierLists";
import TierListCreate from "./pages/TierListCreate";
import TierListDetail from "./pages/TierListDetail";
import TierListEdit from "./pages/TierListEdit";
import SeasonalCalendar from "./pages/SeasonalCalendar";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SimpleAuthProvider>
      <DataSourceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineIndicator />
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ai" element={<AISearch />} />
              <Route path="/my-list" element={<MyList />} />
              <Route path="/tier-lists" element={<TierLists />} />
              <Route path="/tier-lists/create" element={<TierListCreate />} />
              <Route path="/tier-lists/:id" element={<TierListDetail />} />
              <Route path="/tier-lists/:id/edit" element={<TierListEdit />} />
              <Route path="/calendar" element={<SeasonalCalendar />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataSourceProvider>
    </SimpleAuthProvider>
  </QueryClientProvider>
);

export default App;

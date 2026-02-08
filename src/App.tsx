import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNav from "@/components/TopNav";
import LandingPage from "@/pages/LandingPage";
import StudentStudio from "@/pages/StudentStudio";
import TeacherCockpit from "@/pages/TeacherCockpit";
import AdminPanel from "@/pages/AdminPanel";
import ConceptPage from "@/pages/ConceptPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TopNav />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/concept" element={<ConceptPage />} />
          <Route path="/student" element={<StudentStudio />} />
          <Route path="/teacher" element={<TeacherCockpit />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

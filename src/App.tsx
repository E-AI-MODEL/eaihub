import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNav from "@/components/TopNav";
import AuthGuard from "@/components/AuthGuard";
import LandingPage from "@/pages/LandingPage";
import StudentStudio from "@/pages/StudentStudio";
import TeacherCockpit from "@/pages/TeacherCockpit";
import AdminPanel from "@/pages/AdminPanel";
import ConceptPage from "@/pages/ConceptPage";
import LearningPage from "@/pages/LearningPage";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import { useSchoolPlugin } from "@/hooks/useSchoolPlugin";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

/** Bootstraps school plugin using centralised auth state. */
const SchoolPluginProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, roles } = useAuth();
  useSchoolPlugin(user, roles);
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SchoolPluginProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TopNav />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/concept" element={<ConceptPage />} />
              <Route path="/student" element={
                <AuthGuard>
                  <StudentStudio />
                </AuthGuard>
              } />
              <Route path="/teacher" element={
                <AuthGuard requiredRole="DOCENT">
                  <TeacherCockpit />
                </AuthGuard>
              } />
              <Route path="/admin" element={
                <AuthGuard requiredRole="ADMIN">
                  <AdminPanel />
                </AuthGuard>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SchoolPluginProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

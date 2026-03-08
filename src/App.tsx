import { useEffect, useState } from "react";
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
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolPlugin } from "@/hooks/useSchoolPlugin";
import type { User } from "@supabase/supabase-js";

const queryClient = new QueryClient();

/** Listens to auth state and bootstraps school plugin. Non-blocking. */
const SchoolPluginProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', u.id);
        setRoles((data || []).map(r => r.role));
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', u.id);
        setRoles((data || []).map(r => r.role));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useSchoolPlugin(user, roles as any);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;

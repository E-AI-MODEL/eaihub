import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type AppRole } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="w-14 h-14 border border-slate-700 bg-slate-800/40 flex items-center justify-center animate-pulse">
          <span className="text-indigo-400 text-lg font-mono font-bold tracking-tighter">EAI</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 border border-red-500/30 bg-red-950/20 flex items-center justify-center mb-6 mx-auto">
            <span className="text-red-400 text-lg font-mono font-bold">⛔</span>
          </div>
          <h2 className="text-sm text-slate-200 font-medium mb-2">Geen toegang</h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Je hebt de rol <span className="text-slate-300">{requiredRole}</span> nodig om deze pagina te bekijken.
          </p>
          <a href="/student" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
            Terug naar je werkplek →
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;

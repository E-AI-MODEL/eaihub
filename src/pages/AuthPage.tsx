import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Mode = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      toast({ title: 'Inloggen mislukt', description: error.message, variant: 'destructive' });
      return;
    }
    // Role-based redirect
    if (user) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const r = (roles || []).map(x => x.role);
      setIsLoading(false);
      if (r.includes('SUPERUSER') || r.includes('ADMIN')) {
        navigate('/admin');
      } else if (r.includes('DOCENT')) {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } else {
      setIsLoading(false);
      navigate('/student');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Registratie mislukt', description: error.message, variant: 'destructive' });
    } else {
      // Profile + roles are auto-created by database trigger (handle_new_user)
      toast({
        title: 'Account aangemaakt',
        description: 'Je kunt nu inloggen.',
      });
      setMode('login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'E-mail verzonden', description: 'Controleer je inbox voor de reset-link.' });
      setMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        {/* Terug-knop */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-400 transition-colors mb-6 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Terug naar home
        </Link>

        {/* Logo */}
        <div className="w-14 h-14 border border-slate-700 bg-slate-800/40 flex items-center justify-center mb-8 mx-auto">
          <span className="text-indigo-400 text-lg font-mono font-bold tracking-tighter">EAI</span>
        </div>

        <h2 className="text-sm text-slate-200 font-medium mb-1 text-center">
          {mode === 'login' ? 'Inloggen' : mode === 'signup' ? 'Account aanmaken' : 'Wachtwoord vergeten'}
        </h2>
        <p className="text-[11px] text-slate-500 mb-6 text-center">
          {mode === 'login'
            ? 'Log in om verder te werken'
            : mode === 'signup'
            ? 'Maak een account aan als leerling'
            : 'Voer je e-mailadres in voor een reset-link'}
        </p>

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword}>
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Je naam"
              required
              className="w-full bg-slate-900 border border-slate-700 px-4 py-3 text-[16px] sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 mb-3"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-mailadres"
            required
            className="w-full bg-slate-900 border border-slate-700 px-4 py-3 text-[16px] sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 mb-3"
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              required
              minLength={6}
              className="w-full bg-slate-900 border border-slate-700 px-4 py-3 text-[16px] sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 mb-4"
            />
          )}
          {mode === 'forgot' && <div className="mb-4" />}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-xs font-mono uppercase tracking-wider hover:bg-indigo-500/25 disabled:opacity-50 transition-colors"
          >
            {isLoading
              ? 'Bezig...'
              : mode === 'login'
              ? 'Inloggen'
              : mode === 'signup'
              ? 'Registreren'
              : 'Verstuur reset-link'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('signup')} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors block mx-auto">
                Nog geen account? Registreren
              </button>
              <button onClick={() => setMode('forgot')} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors block mx-auto">
                Wachtwoord vergeten?
              </button>
            </>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <button onClick={() => setMode('login')} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors block mx-auto">
              Terug naar inloggen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

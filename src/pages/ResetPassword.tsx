import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Wachtwoord gewijzigd', description: 'Je kunt nu inloggen met je nieuwe wachtwoord.' });
      navigate('/auth');
    }
  };

  if (!isRecovery) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Ongeldige reset-link.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="w-14 h-14 border border-slate-700 bg-slate-800/40 flex items-center justify-center mb-8 mx-auto">
          <span className="text-indigo-400 text-lg font-mono font-bold tracking-tighter">EAI</span>
        </div>
        <h2 className="text-sm text-slate-200 font-medium mb-6 text-center">Nieuw wachtwoord instellen</h2>
        <form onSubmit={handleReset}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nieuw wachtwoord"
            required
            minLength={6}
            className="w-full bg-slate-900 border border-slate-700 px-4 py-3 text-[16px] sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 mb-4"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-xs font-mono uppercase tracking-wider hover:bg-indigo-500/25 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Bezig...' : 'Wachtwoord wijzigen'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

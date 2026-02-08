import React, { useState, useEffect } from 'react';
import { runDiagnostics } from '../utils/diagnostics';
import { SSOT_DATA } from '@/data/ssot';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>(["INITIALIZING EAI KERNEL..."]);
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    let isMounted = true;

    const executeBootProcess = async () => {
        // Phase 1: Fake Init
        await new Promise(r => setTimeout(r, 600));
        if (!isMounted) return;
        setLogs(prev => [...prev, `MOUNTING SSOT FILE SYSTEM (v${SSOT_DATA.version})...`]);
        setProgress(20);

        // Phase 2: Run Real Diagnostics
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) return;
        
        const results = await runDiagnostics(0, undefined);
        
        // Log Critical checks
        results.forEach(res => {
            const statusIcon = res.status === 'OK' ? '[OK]' : `[${res.status}]`;
            setLogs(prev => [...prev, `${res.label.toUpperCase()}... ${statusIcon}`]);
        });
        setProgress(60);

        // Phase 3: Finalize
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) return;
        setLogs(prev => [...prev, "ESTABLISHING SECURE UPLINK..."]);
        setProgress(90);

        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) return;
        setLogs(prev => [...prev, "SYSTEM READY."]);
        setProgress(100);

        // Fade Out
        setTimeout(() => {
            if (isMounted) setOpacity(0);
            setTimeout(() => {
                if (isMounted) onComplete();
            }, 1000);
        }, 500);
    };

    executeBootProcess();

    return () => { isMounted = false; };
  }, [onComplete]);

  // Don't render if fully faded out
  if (opacity === 0 && progress >= 100) return null;

  return (
    <div 
        className="fixed inset-0 z-[9999] bg-[#050914] flex flex-col items-center justify-center font-mono text-cyan-500 transition-opacity duration-1000 ease-in-out select-none cursor-wait"
        style={{ opacity: opacity / 100 }}
    >
        {/* Animated Core Logo - Clean Version */}
        <div className="relative w-32 h-32 mb-12">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-2 border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-6 border-2 border-b-blue-500 border-l-transparent border-t-transparent border-r-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white tracking-widest animate-pulse">EAI</span>
            </div>
        </div>

        {/* Loading Bar */}
        <div className="w-64 sm:w-80 h-1 bg-slate-800 rounded-full mb-6 overflow-hidden relative">
            <div 
                className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300"
                style={{ width: `${progress}%` }}
            />
        </div>

        {/* Terminal Logs (Diagnostics) */}
        <div className="h-32 flex flex-col justify-end items-center space-y-1 overflow-hidden w-full max-w-md px-4">
            {logs.slice(-5).map((log, i) => (
                <div key={i} className={`text-[10px] sm:text-xs w-full text-center tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-300 ${log.includes('[CRITICAL]') ? 'text-red-500 font-bold' : (log.includes('[WARNING]') ? 'text-orange-400' : 'text-cyan-500/80')}`}>
                    {`> ${log}`}
                </div>
            ))}
        </div>
        
        {/* EAI STUDIO Label with dynamic version */}
        <div className="absolute bottom-8 flex flex-col items-center">
            <div className="text-[9px] text-slate-600 tracking-[0.2em] uppercase mb-1">
                EAI STUDIO
            </div>
            <div className="bg-green-900/30 border border-green-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-green-400 tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                v{SSOT_DATA.version}
            </div>
        </div>
    </div>
  );
};

export default BootSequence;

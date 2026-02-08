import React, { useState, useEffect } from 'react';
import { runDiagnostics } from '../utils/diagnostics';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    const executeBootProcess = async () => {
      await new Promise(r => setTimeout(r, 1500));
      await runDiagnostics(0, undefined);

      setOpacity(0);
      setTimeout(() => {
        onComplete();
      }, 1000);
    };

    executeBootProcess();
  }, [onComplete]);

  if (opacity === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out cursor-wait"
      style={{ opacity: opacity / 100 }}
    >
      <div className="relative flex flex-col items-center">
        <div className="w-12 h-12 border-2 border-primary/30 rounded-full animate-ping absolute"></div>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-primary/20">
          <span className="text-primary font-bold text-xs tracking-widest">EAI</span>
        </div>

        <div className="mt-8 text-center space-y-2">
          <div className="h-0.5 w-24 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary/50 animate-pulse w-full origin-left"></div>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium tracking-[0.3em] uppercase animate-pulse">
            Initializing
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 text-[9px] text-muted-foreground font-mono">
        v15.0
      </div>
    </div>
  );
};

export default BootSequence;

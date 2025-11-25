import React, { useEffect, useState } from 'react';
import { Sparkles, Gamepad2, BrainCircuit } from 'lucide-react';
import { SnakeGame } from './games/SnakeGame';
import { TapGame } from './games/TapGame';

export const ThinkingIndicator: React.FC = () => {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const phases = [
    "Thinking...",
    "Analyzing context...",
    "Connecting ideas...",
    "Generating response...",
    "Polishing details..."
  ];

  useEffect(() => {
    // Check screen size
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const timer = setInterval(() => {
      setElapsed(prev => prev + 0.1);
    }, 100);

    const phaseTimer = setInterval(() => {
      setPhase(prev => (prev + 1) % phases.length);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(phaseTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div className="flex w-full justify-center py-6 fade-in-up">
      <div className="relative w-full max-w-xl group">
        {/* Glow Background */}
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur-lg opacity-75"></div>
        
        {/* Arcade Card */}
        <div className="relative flex flex-col items-center bg-gray-950/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          
          {/* Header Status Bar */}
          <div className="flex w-full items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-800">
             <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center h-6 w-6">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-50"></div>
                    <Sparkles className="h-4 w-4 text-blue-400 animate-spin-slow" />
                </div>
                <span className="text-sm font-medium text-gray-300 transition-all duration-500 min-w-[150px]">
                    {phases[phase]}
                </span>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700/50">
                     <BrainCircuit className="h-3 w-3 text-purple-400" />
                     <span className="font-mono text-xs text-gray-400 tabular-nums">
                        {elapsed.toFixed(1)}s
                     </span>
                 </div>
             </div>
          </div>

          {/* Game Container */}
          <div className="w-full p-4 flex flex-col items-center justify-center bg-gray-950 min-h-80">
              {isMobile ? <TapGame /> : <SnakeGame />}
          </div>
          
          {/* Footer */}
          <div className="w-full py-2 bg-gray-900/50 border-t border-gray-800 text-center">
             <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                <Gamepad2 className="h-3 w-3" />
                <span>Waiting Arcade Mode</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

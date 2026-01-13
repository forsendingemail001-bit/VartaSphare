
import React from 'react';
import { HubType } from '../types';

interface StatusBarProps {
  activeHub: HubType;
  currentUser: any;
  onAddSticker: (content: string) => void;
}

const EMOJIS = ['🔥', '🎮', '🚀', '💀', '💎', '🎯', '⚔️', '🛡️', '👑', '⚡', '🤖', '👾'];

const StatusBar: React.FC<StatusBarProps> = ({ activeHub, onAddSticker }) => {
  const isPersonal = activeHub === HubType.PERSONAL;

  return (
    <div className="h-8 w-full bg-[#050507] border-t border-slate-800 flex items-center justify-between px-4 z-50 select-none relative">
      {/* Left: Hub Specific Info */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isPersonal ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest gaming-font">
            {isPersonal ? 'Node: Active' : 'Uplink: Synchronized'}
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-4 border-l border-slate-800 pl-4">
             <span className="text-[8px] text-slate-600 font-bold uppercase">Latency</span>
             <span className="text-[9px] text-green-400 font-mono">24ms</span>
        </div>
      </div>

      {/* Center: Direct Tactical Emojis */}
      <div className="flex items-center space-x-4 bg-slate-900/50 px-4 py-0.5 rounded-full border border-slate-800">
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider gaming-font">Quick Tag:</span>
        <div className="flex items-center space-x-3">
          {EMOJIS.map(emoji => (
            <button 
              key={emoji} 
              onClick={() => onAddSticker(emoji)}
              className="text-sm hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Metrics */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
           <span className="text-[8px] text-slate-600 font-bold">PWR</span>
           <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 w-3/4"></div>
           </div>
        </div>
        <div className="flex items-center text-[9px] font-mono text-slate-600">
           <span className="text-slate-400 uppercase text-[8px] font-bold">FPS</span>
           <span className="ml-1">60.0</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;

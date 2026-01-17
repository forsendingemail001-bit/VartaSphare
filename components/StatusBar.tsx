
import React, { useRef } from 'react';
import { HubType } from '../types';
import { Icons } from '../constants';

interface StatusBarProps {
  activeHub: HubType;
  currentUser: any;
  onAddSticker: (content: string) => void;
  swarm?: { seeds: number; peers: number };
  onUploadFile?: (file: File) => void;
}

const EMOJIS = ['🔥', '🎮', '🚀', '💀', '💎', '🎯'];

const StatusBar: React.FC<StatusBarProps> = ({ activeHub, onAddSticker, swarm, onUploadFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-10 w-full bg-[#050507] border-t border-slate-800 flex items-center justify-between px-4 z-50 select-none relative shadow-[0_-4px_15px_rgba(0,0,0,0.4)]">
      <div className="flex items-center space-x-6">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="group flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-400/30 active:scale-95"
        >
          <Icons.Upload />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest gaming-font">P2P Uplink</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
          />
        </button>
        
        <div className="hidden lg:flex items-center space-x-4 border-l border-slate-800 pl-4">
          <div className="flex items-center space-x-1.5">
            <Icons.Database />
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Global Swarm Health</span>
            <div className="flex items-center space-x-3 font-mono text-[9px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
               <span className="text-green-400">{swarm?.seeds || 124} SEEDS</span>
               <span className="text-blue-400">{swarm?.peers || 892} PEERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Markers / Reaction Strip */}
      <div className="flex items-center space-x-3 bg-[#0a0a0c] px-3 py-1 rounded-full border border-slate-800/80">
        <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mr-1">Markers</span>
        {EMOJIS.map(emoji => (
          <button key={emoji} onClick={() => onAddSticker(emoji)} className="text-xs hover:scale-150 transition-transform active:scale-90">{emoji}</button>
        ))}
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 group cursor-help">
           <Icons.Zap />
           <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Saturation</span>
           <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
             <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-[85%] animate-pulse"></div>
           </div>
        </div>
        <div className="flex items-center space-x-2 text-[9px] font-mono border-l border-slate-800 pl-4 h-6">
           <span className="text-blue-500 font-bold">2.4</span>
           <span className="text-[7px] text-slate-600 uppercase tracking-tighter">TB/S DOWNLINK</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;

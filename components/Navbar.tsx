
import React, { useState, useEffect } from 'react';
import { HubType } from '../types';
import { Icons } from '../constants';
import { p2pMesh } from '../services/P2PMesh';

interface NavbarProps {
  activeHub: HubType;
  setActiveHub: (hub: HubType) => void;
  setSelectedChat: (chat: any) => void;
  currentUser: any;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  activeRoomId?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
    activeHub, setActiveHub, setSelectedChat, currentUser, onLogout, onOpenSettings, activeRoomId 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [swarmMode, setSwarmMode] = useState<'Discovery' | 'Protected' | 'Public'>('Discovery');

  useEffect(() => {
    const updateStats = () => {
        setIsConnected(p2pMesh.isConnected());
        if (activeRoomId) {
            setSwarmMode(activeRoomId.startsWith('dm_') ? 'Protected' : 'Public');
        } else {
            setSwarmMode('Discovery');
        }
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();
    return () => clearInterval(interval);
  }, [activeRoomId]);

  if (!currentUser) return null;

  return (
    <nav className="h-16 w-full glass-effect border-b border-white/5 flex items-center justify-between px-6 z-[100]">
      <div className="flex items-center space-x-3">
        <Icons.Logo className="w-8 h-8" />
        <span className="gaming-font font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden md:block">
          VARTASPHERE
        </span>
      </div>

      <div className="hidden lg:flex items-center space-x-8 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
        <div className="flex items-center space-x-2">
          <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] ${isConnected ? 'bg-green-500 shadow-green-500' : 'bg-orange-500 animate-pulse shadow-orange-500'}`}></span>
          <span className="text-white">{isConnected ? 'Neural Relay Online' : 'Local Mesh Only'}</span>
          <span className="text-slate-600">({swarmMode} Protocol)</span>
        </div>
        <div className="flex items-center space-x-2 border-l border-white/10 pl-8">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#06b6d4]"></span>
          <span className="text-cyan-500">ID: {p2pMesh.getSelfId()?.slice(0, 8)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex bg-slate-900/50 rounded-xl p-1 border border-white/5">
           <button
            onClick={() => setActiveHub(HubType.PERSONAL)}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeHub === HubType.PERSONAL ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Personal
           </button>
           <button
            onClick={() => setActiveHub(HubType.GLOBAL)}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeHub === HubType.GLOBAL ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Global
           </button>
        </div>

        <button 
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl border border-white/5 text-slate-500 hover:text-blue-400 transition-all hover:bg-white/5"
          title="Neural Settings"
        >
          <Icons.Settings />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`relative p-0.5 rounded-xl border-2 transition-all duration-200 ${
              isDropdownOpen ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:border-white/10'
            }`}
          >
            <img src={currentUser.avatar} alt="Profile" className="w-9 h-9 rounded-lg object-cover" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0c]"></div>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-56 glass-effect border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden py-2">
                <div className="px-4 py-3 border-b border-white/5 mb-2 text-left">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Account</p>
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                </div>
                <button onClick={onOpenSettings} className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-[10px]">
                  <Icons.Settings />
                  <span>Configure Node</span>
                </button>
                <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-bold uppercase tracking-widest text-[10px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Terminate Link</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

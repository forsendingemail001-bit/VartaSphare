
import React, { useState } from 'react';
import { HubType } from '../types';
import { Icons } from '../constants';

interface NavbarProps {
  activeHub: HubType;
  setActiveHub: (hub: HubType) => void;
  setSelectedChat: (chat: any) => void;
  currentUser: any;
}

const Navbar: React.FC<NavbarProps> = ({ activeHub, setActiveHub, setSelectedChat, currentUser }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleHub = () => {
    const nextHub = activeHub === HubType.PERSONAL ? HubType.GLOBAL : HubType.PERSONAL;
    setActiveHub(nextHub);
    setSelectedChat(null);
  };

  if (!currentUser) return null;

  return (
    <nav className="h-16 w-full glass-effect border-b border-slate-800 flex items-center justify-between px-6 z-[100]">
      {/* Left: Branding */}
      <div className="flex items-center space-x-3">
        <Icons.Logo className="w-8 h-8" />
        <span className="gaming-font font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden md:block">
          VARTASPHERE
        </span>
      </div>

      {/* Center: Status Indicator */}
      <div className="hidden lg:flex items-center space-x-6 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
          <span>Link: Stable</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
          <span>Node: {currentUser.name.toUpperCase()}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleHub}
          className={`group relative p-2.5 rounded-xl transition-all duration-300 border ${
            activeHub === HubType.PERSONAL 
              ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
              : 'bg-blue-600/10 border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
          }`}
          title={activeHub === HubType.PERSONAL ? "Switch to Global Network" : "Switch to Personal Hub"}
        >
          <div className="transition-transform duration-500 group-hover:rotate-[360deg]">
            {activeHub === HubType.PERSONAL ? <Icons.Globe /> : <Icons.Home />}
          </div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`relative p-0.5 rounded-xl border-2 transition-all duration-200 ${
              isDropdownOpen 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-transparent hover:border-slate-700'
            }`}
          >
            <img 
              src={currentUser.avatar} 
              alt="Profile" 
              className="w-9 h-9 rounded-lg object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0c]"></div>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-56 glass-effect border border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-slate-800 mb-2 text-left">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Account</p>
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                </div>
                
                <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                  <Icons.User />
                  <span>View Profile</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                  <Icons.Settings />
                  <span>Settings</span>
                </button>
                
                <div className="h-[1px] bg-slate-800 my-2 mx-4"></div>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Logout</span>
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

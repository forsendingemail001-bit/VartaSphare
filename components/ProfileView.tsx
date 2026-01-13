
import React from 'react';
import { User } from '../types';
import { Icons } from '../constants';

interface ProfileViewProps {
  user: User;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  return (
    <div className="h-full bg-[#0a0a0c] flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl w-full space-y-8 py-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          
          <div className="relative mb-6">
            <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-2xl">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-2 right-[calc(50%-60px)] w-6 h-6 bg-green-500 border-4 border-slate-900 rounded-full"></div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-1 gaming-font">{user.name}</h2>
          <div className="flex flex-col items-center space-y-1 mb-4">
            <p className="text-blue-500 font-mono text-[10px] tracking-[0.3em] uppercase">Rank: {user.position}</p>
            <p className="text-slate-500 font-mono text-[9px] tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">UID: {user.id}</p>
          </div>
          
          <div className="flex justify-center space-x-4 mb-8">
            <div className="bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700">
              <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Efficiency</span>
              <span className="text-xl font-bold text-white">98.2%</span>
            </div>
            <div className="bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700">
              <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Sector</span>
              <span className="text-xl font-bold text-white">G-12</span>
            </div>
          </div>
          
          <p className="text-slate-400 mb-8 italic text-sm leading-relaxed max-w-md mx-auto">"{user.bio}"</p>
          
          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 border border-blue-400/20">
                <Icons.Settings />
                <span className="text-xs uppercase tracking-widest">Configure Node</span>
             </button>
             <button className="flex items-center justify-center space-x-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700">
                <Icons.Search />
                <span className="text-xs uppercase tracking-widest">Network Scan</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
             <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-500 mb-4">Operational Status</h3>
             <div className="space-y-4">
                {[
                  { label: 'Role Sync', status: 'Operational' },
                  { label: 'Communication Link', status: 'Optimal' },
                  { label: 'Tactical HUD', status: 'Online' }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className="text-[9px] bg-green-500/10 px-2 py-1 rounded text-green-400 border border-green-500/20 font-bold uppercase">{item.status}</span>
                  </div>
                ))}
             </div>
           </div>
           
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
             <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-500 mb-4">Skill Badge Matrix</h3>
             <div className="flex flex-wrap gap-3">
                {['🏆', '🌟', '🛡️', '⚔️', '💎'].map((emoji, idx) => (
                  <div key={idx} className="w-10 h-10 bg-slate-800/80 rounded-xl flex items-center justify-center text-xl shadow-inner border border-slate-700/50" title="Top Explorer">
                    {emoji}
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

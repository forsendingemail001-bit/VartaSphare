
import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';

interface ProfileViewProps {
  user: User;
  onLogout?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl w-full space-y-8 py-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          
          <div className="relative mb-6">
            <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-2xl">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-2 right-[calc(50%-60px)] w-6 h-6 bg-green-500 border-4 border-slate-900 rounded-full"></div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-1 gaming-font uppercase tracking-tight">{user.name}</h2>
          <div className="flex flex-col items-center space-y-1 mb-4">
            <p className="text-blue-500 font-mono text-[10px] tracking-[0.3em] uppercase">Rank: {user.position}</p>
            <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 mt-2 hover:border-blue-500/50 transition-colors group">
               <p className="text-slate-400 font-mono text-[9px] tracking-widest uppercase">UID: {user.id}</p>
               <button 
                 onClick={() => copyToClipboard(user.id)}
                 className={`transition-all p-1.5 rounded-md hover:bg-slate-700 ${copied ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}
                 title="Copy UID"
               >
                 {copied ? <Icons.Check /> : <Icons.Copy />}
               </button>
            </div>
            {copied && <span className="text-[8px] text-green-400 font-bold uppercase animate-pulse mt-1 tracking-widest">Identity Synced!</span>}
          </div>
          
          <p className="text-slate-400 mb-8 italic text-sm leading-relaxed max-w-md mx-auto">"{user.bio}"</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
             <button className="flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 border border-blue-400/20">
                <Icons.Settings />
                <span className="text-xs uppercase tracking-widest">Configure Node</span>
             </button>
             <button onClick={onLogout} className="flex items-center justify-center space-x-2 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl transition-all border border-red-500/20 group">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-300"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span className="text-xs uppercase tracking-[0.2em] gaming-font">Terminate Link</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;


import React, { useState, useRef } from 'react';
import { Icons } from '../constants';

interface LoginViewProps {
  onLogin: (name: string, avatar: string, position: string) => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Aiden',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Commander',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky'
];

const POSITIONS = [
  { id: 'vanguard', label: 'Vanguard', desc: 'Frontline Combatant' },
  { id: 'tactician', label: 'Tactician', desc: 'Strategic Command' },
  { id: 'infiltrator', label: 'Infiltrator', desc: 'Stealth Ops' },
  { id: 'mechanic', label: 'Mechanic', desc: 'System Engineering' },
  { id: 'sentinel', label: 'Sentinel', desc: 'Defense & Security' },
  { id: 'medic', label: 'Medic', desc: 'Support & Recovery' }
];

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [selectedPosition, setSelectedPosition] = useState(POSITIONS[0].id);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomAvatar(base64String);
        setSelectedAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnter = () => {
    if (!name.trim()) {
      setError(true);
      return;
    }
    const positionLabel = POSITIONS.find(p => p.id === selectedPosition)?.label || 'Explorer';
    onLogin(name, selectedAvatar, positionLabel);
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] flex items-center justify-center p-6 py-12 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="max-w-xl w-full glass-effect rounded-[2.5rem] p-8 md:p-10 relative z-10 border border-slate-800 shadow-2xl my-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="mb-4 relative">
            <Icons.Logo className="w-16 h-16" />
            <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full -z-10"></div>
          </div>
          <h1 className="text-3xl font-bold gaming-font tracking-tighter text-white mb-1 uppercase">VartaSphere</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-bold">Protocol Initiation</p>
        </div>

        <div className="space-y-8">
          {/* Identity & Upload */}
          <div>
            <div className="flex justify-between items-end mb-4 px-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Identity</label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors flex items-center space-x-1"
              >
                <Icons.Plus />
                <span>Upload Custom</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {/* Custom Uploaded Avatar Preview */}
              {customAvatar && (
                <button
                  onClick={() => setSelectedAvatar(customAvatar)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedAvatar === customAvatar 
                      ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={customAvatar} alt="Custom" className="w-full h-full object-cover" />
                </button>
              )}
              {PRESET_AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    // Optionally keep the custom one but switch selection
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group ${
                    selectedAvatar === avatar 
                      ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <img src={avatar} alt={`Preset ${idx}`} className="w-full h-full object-cover p-1 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">Commander Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setError(false);
                }}
                placeholder="Callsign..."
                className={`w-full bg-slate-900/50 border ${error ? 'border-red-500/50' : 'border-slate-800'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 font-medium`}
                onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              />
              {error && <p className="absolute -bottom-5 left-2 text-[8px] text-red-500 font-bold uppercase tracking-tighter">Identity validation required</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">Operational Role</label>
              <select 
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                {POSITIONS.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0f172a] text-white">{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Selection Grid (Visual) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 text-center">Protocol Specialization</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POSITIONS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPosition(p.id)}
                  className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                    selectedPosition === p.id 
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${selectedPosition === p.id ? 'text-blue-400' : 'text-slate-300'}`}>{p.label}</span>
                  <span className="text-[8px] text-slate-500 mt-1 uppercase tracking-tighter font-mono">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleEnter}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold gaming-font tracking-[0.3em] text-sm hover:bg-blue-500 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/20"
          >
            ENTER THE SPHERE
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[8px] text-slate-600 uppercase tracking-widest leading-relaxed">
            Identity verification complete. Link stability optimized for current sector.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

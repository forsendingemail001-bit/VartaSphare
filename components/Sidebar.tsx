
import React, { useState, useEffect } from 'react';
import { HubType, ChatRoom } from '../types';
import { Icons } from '../constants';
import { hub } from '../services/MicroserviceHub';
import { p2pMesh } from '../services/P2PMesh';

interface SidebarProps {
  activeHub: HubType;
  onSelectChat: (chat: ChatRoom) => void;
  selectedChatId?: string;
  view?: string;
  currentUser?: any;
  currentTheme?: string;
  onSelectTheme?: (themeId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeHub, onSelectChat, selectedChatId, view = 'direct', currentUser, currentTheme, onSelectTheme 
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  
  const [resolvedIdentity, setResolvedIdentity] = useState<any | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRooms = async () => setRooms(await hub.community.getJoinedRooms());

  useEffect(() => {
    loadRooms();
    const unsubJoined = hub.bus.on('ROOM_JOINED', (room) => {
        setRooms(prev => {
            if (prev.find(r => r.id === room.id)) return prev;
            return [room, ...prev];
        });
    });
    const unsubDeleted = hub.bus.on('ROOM_DELETED', () => loadRooms());
    return () => { unsubJoined(); unsubDeleted(); };
  }, []);

  const performSearch = async () => {
    const val = modalInput.trim();
    if (!val) return;
    
    setIsResolving(true);
    setHasChecked(false);
    setErrorMessage(null);
    setResolvedIdentity(null);

    const identity = await hub.discovery.resolveIdentity(val);
    
    setIsResolving(false);
    setHasChecked(true);
    
    if (identity) {
        setResolvedIdentity(identity);
    } else {
        setErrorMessage("Node unreachable or offline.");
    }
  };

  const handleStartDm = async () => {
    if (!resolvedIdentity || !currentUser) return;
    
    setIsSyncing(true);
    const selfId = p2pMesh.getSelfId();
    const targetId = resolvedIdentity.id;
    
    // Sort IDs to ensure deterministic Room ID for both parties
    const sortedIds = [selfId, targetId].sort();
    const roomId = `dm_${sortedIds[0]}_${sortedIds[1]}`;

    const newRoom: ChatRoom = {
      id: roomId,
      name: resolvedIdentity.name,
      description: 'Verified P2P Link.',
      type: 'dm',
      members: [selfId, targetId],
      icon: resolvedIdentity.avatar
    };

    await hub.community.joinRoom(newRoom);
    
    setTimeout(() => {
      setIsSyncing(false);
      onSelectChat(newRoom);
      setShowDmModal(false);
      setModalInput('');
      setResolvedIdentity(null);
      setHasChecked(false);
    }, 800);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !currentUser) return;
    setIsSyncing(true);
    const group = await hub.community.createGroup(groupName, groupDesc, currentUser.id);
    setTimeout(() => {
      setIsSyncing(false);
      onSelectChat(group);
      setShowGroupModal(false);
      setGroupName('');
      setGroupDesc('');
    }, 500);
  };

  const handleJoinGroup = async () => {
    const gid = modalInput.trim();
    if (!gid) return;
    setIsSyncing(true);
    const group = await hub.discovery.findGroupGlobal(gid);
    if (group) {
        await hub.community.joinRoom(group);
        onSelectChat(group);
        setShowJoinModal(false);
        setModalInput('');
    } else {
        setErrorMessage("Hub GID not found in sector.");
    }
    setIsSyncing(false);
  };

  return (
    <div className="w-80 flex flex-col h-full border-r border-slate-800 bg-[#0a0a0c]">
      <div className="p-5 border-b border-slate-800">
        <h2 className="text-[10px] font-bold gaming-font text-white tracking-[0.3em] uppercase">
          {view === 'direct' ? 'Direct Pager' : view === 'squads' ? 'Squad Hubs' : 'Atmosphere'}
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto px-2 pt-4 custom-scrollbar">
        {/* Fix: Replaced faulty room filter with theme selection UI for Atmosphere view */}
        {view === 'atmosphere' ? (
           <div className="px-3 space-y-3">
             {[
               { id: 'deep-space', name: 'Deep Space', desc: 'Minimalist dark node' },
               { id: 'cyberpunk', name: 'Cyberpunk Royale', desc: 'Neon Pink & Purple' },
               { id: 'light-protocol', name: 'Light Protocol', desc: 'Clean high-visibility' },
               { id: 'emerald-link', name: 'Emerald Mesh', desc: 'Terminal green style' }
             ].map(theme => (
               <button
                 key={theme.id}
                 onClick={() => onSelectTheme?.(theme.id)}
                 className={`w-full p-4 rounded-2xl border transition-all text-left ${
                   currentTheme === theme.id 
                     ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                     : 'text-slate-400 border-slate-800 hover:bg-slate-800/40'
                 }`}
               >
                 <p className={`text-xs font-bold uppercase tracking-widest ${currentTheme === theme.id ? 'text-blue-400' : 'text-slate-300'}`}>
                   {theme.name}
                 </p>
                 <p className="text-[9px] text-slate-500 mt-1">{theme.desc}</p>
               </button>
             ))}
           </div>
        ) : (
          <>
            {rooms.filter(r => (view === 'direct' ? r.type === 'dm' : r.type === 'group')).map(item => (
                <div key={item.id} className="relative group/item">
                    <button
                        onClick={() => onSelectChat(item)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all border mb-1 ${
                        selectedChatId === item.id 
                            ? 'bg-blue-600/10 text-blue-400 border-blue-600/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                            : 'text-slate-400 border-transparent hover:bg-slate-800/40'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-700">
                        {item.icon && (item.icon.startsWith('http') || item.icon.length > 2) ? (
                            <img src={item.icon} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold">{item.name[0]}</span>
                        )}
                        </div>
                        <div className="ml-3 text-left flex-grow overflow-hidden">
                        <p className="font-bold text-xs truncate uppercase tracking-tighter">{item.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{item.description}</p>
                        </div>
                    </button>
                </div>
            ))}
            
            <div className="mt-4 px-1 space-y-2">
              {view === 'direct' ? (
                <button onClick={() => { setShowDmModal(true); setErrorMessage(null); setHasChecked(false); setResolvedIdentity(null); }} className="w-full py-3 bg-blue-600/10 text-blue-400 border border-blue-600/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/20 transition-all">
                  + Establish Link
                </button>
              ) : (
                <>
                    <button onClick={() => { setShowGroupModal(true); setErrorMessage(null); }} className="w-full py-3 bg-blue-600/10 text-blue-400 border border-blue-600/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/20 transition-all">
                        + Form Squad
                    </button>
                    <button onClick={() => { setShowJoinModal(true); setErrorMessage(null); }} className="w-full py-3 bg-slate-800/50 text-slate-400 border border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700/50 transition-all">
                        Join Existing Hub
                    </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showDmModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => !isSyncing && setShowDmModal(false)}>
          <div className="relative w-full max-w-sm glass-effect border border-slate-700 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-bold gaming-font text-white mb-6 uppercase text-center tracking-[0.2em]">Neural Link Protocol</h3>
            <div className="space-y-6">
              <div className="flex space-x-2">
                <input 
                    type="text" 
                    value={modalInput} 
                    onChange={(e) => { setModalInput(e.target.value); setHasChecked(false); setResolvedIdentity(null); }} 
                    onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                    placeholder="UID (e.g. cn9d25...)" 
                    className="flex-grow bg-black border border-slate-800 rounded-xl px-4 py-4 text-sm text-white focus:border-blue-500 font-mono" 
                />
                <button 
                    onClick={performSearch} 
                    disabled={isResolving}
                    className="px-4 bg-slate-900 text-blue-400 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all"
                >
                    {isResolving ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Icons.Search />}
                </button>
              </div>

              {resolvedIdentity && (
                <div className="flex items-center p-4 bg-blue-600/10 border border-blue-500/40 rounded-2xl animate-in zoom-in-95 duration-200 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <img src={resolvedIdentity.avatar} className="w-12 h-12 rounded-xl border border-blue-500/20" />
                    <div className="ml-4 overflow-hidden">
                        <div className="flex items-center space-x-2">
                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                             <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Node Verified</p>
                        </div>
                        <p className="text-sm font-bold text-white truncate gaming-font mt-1">{resolvedIdentity.name}</p>
                        <p className="text-[8px] text-slate-500 font-mono truncate">{resolvedIdentity.id}</p>
                    </div>
                </div>
              )}

              {hasChecked && !resolvedIdentity && !errorMessage && !isResolving && (
                 <p className="text-[10px] text-red-400 font-bold uppercase text-center tracking-widest bg-red-400/5 py-4 rounded-xl border border-red-400/20">Probe Response: NULL</p>
              )}

              {errorMessage && (
                <div className="text-center space-y-2">
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-400/5 py-4 rounded-xl border border-red-400/20">{errorMessage}</p>
                  <p className="text-[8px] text-slate-600 uppercase">Make sure the other user is online and connected to the same relay.</p>
                </div>
              )}
              
              <button onClick={handleStartDm} disabled={isSyncing || !resolvedIdentity} className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 ${!resolvedIdentity ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800' : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-500 border border-blue-400'}`}>
                {isSyncing ? 'LINKING FREQUENCIES...' : 'Establish Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Modals kept original logic */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => !isSyncing && setShowJoinModal(false)}>
          <div className="relative w-full max-w-sm glass-effect border border-slate-700 rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-bold gaming-font text-white mb-6 uppercase text-center">Hub Sync</h3>
            <div className="space-y-4">
              <input type="text" value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder="Hub GID..." className="w-full bg-[#050507] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 font-mono" />
              <button onClick={handleJoinGroup} disabled={isSyncing} className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                {isSyncing ? 'Accessing...' : 'Join Frequency'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

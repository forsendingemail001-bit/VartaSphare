
import React, { useState, useEffect } from 'react';
import { HubType, ChatRoom } from '../types';
import { Icons, MOCK_GLOBAL_ROOMS, Icons as CustomIcons, MOCK_DIRECTORY_USERS, MOCK_DIRECTORY_GROUPS } from '../constants';
import { hub } from '../services/MicroserviceHub';

interface SidebarProps {
  activeHub: HubType;
  onSelectChat: (chat: ChatRoom) => void;
  selectedChatId?: string;
  view?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeHub, onSelectChat, selectedChatId, view = 'all' }) => {
  const isPersonal = activeHub === HubType.PERSONAL;
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [modalInputSecondary, setModalInputSecondary] = useState('');
  const [groupActionType, setGroupActionType] = useState<'join' | 'create'>('join');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load persisted rooms
    const loadRooms = async () => {
      const persisted = await hub.community.getJoinedRooms();
      setRooms(persisted);
    };
    loadRooms();

    const handleRoomJoined = (room: ChatRoom) => {
      setRooms(prev => {
        if (prev.find(r => r.id === room.id)) return prev;
        return [room, ...prev];
      });
    };

    hub.bus.on('ROOM_JOINED', handleRoomJoined);
  }, []);

  const filteredRooms = rooms.filter(r => {
    if (view === 'direct') return r.type === 'dm';
    if (view === 'groups') return r.type === 'group';
    return true;
  });

  const handleStartDm = () => {
    setErrorMessage(null);
    if (!modalInput.trim()) return;
    
    const inputVal = modalInput.trim().toLowerCase();
    // Support both raw ID and prefixed ID
    const searchId = inputVal.startsWith('uid_') ? inputVal : `uid_${inputVal}`;
    
    // Check against Global Network directory
    const targetUser = MOCK_DIRECTORY_USERS.find(u => u.id === searchId);
    
    if (!targetUser) {
      setErrorMessage("User does not exist or UID is incorrect. Please check the network directory and type again.");
      return;
    }

    const newRoom: ChatRoom = {
      id: targetUser.id.startsWith('dm_') ? targetUser.id : `dm_${targetUser.id}`,
      name: targetUser.name,
      description: 'Secure Peer-to-Peer Link established.',
      type: 'dm',
      members: [targetUser.id],
      icon: targetUser.avatar
    };
    
    hub.community.joinRoom(newRoom);
    onSelectChat(newRoom);
    setShowDmModal(false);
    setModalInput('');
    setErrorMessage(null);
  };

  const handleGroupAction = () => {
    setErrorMessage(null);
    if (!modalInput.trim()) return;
    
    if (groupActionType === 'join') {
      const inputVal = modalInput.trim().toLowerCase();
      const searchId = inputVal.startsWith('gid_') ? inputVal : `gid_${inputVal}`;
      
      // Check against Global Group directory
      const targetGroup = MOCK_DIRECTORY_GROUPS.find(g => g.id === searchId);
      
      if (!targetGroup) {
        setErrorMessage("Group does not exist or GID is incorrect. Confirm GID with squad leader and try again.");
        return;
      }

      const joinRoom: ChatRoom = {
        id: targetGroup.id,
        name: targetGroup.name,
        description: targetGroup.description,
        type: 'group',
        members: [],
        icon: targetGroup.icon
      };
      hub.community.joinRoom(joinRoom);
      onSelectChat(joinRoom);
      setShowGroupModal(false);
      setModalInput('');
    } else {
      // Create logic: Generates a unique GID
      const newGid = `gid_${Math.random().toString(36).substr(2, 6)}`;
      const createRoom: ChatRoom = {
        id: newGid,
        name: modalInput.trim(),
        description: modalInputSecondary || 'New tactical group created by user.',
        type: 'group',
        members: [],
        icon: '🛠️'
      };
      hub.community.joinRoom(createRoom);
      onSelectChat(createRoom);
      setShowGroupModal(false);
      setModalInput('');
      setModalInputSecondary('');
    }
    setErrorMessage(null);
  };

  const renderChatItem = (item: ChatRoom) => (
    <button
      key={item.id}
      onClick={() => onSelectChat(item)}
      className={`w-full flex items-center p-3 rounded-xl transition-all group border mb-1 ${
        selectedChatId === item.id 
          ? 'bg-blue-600/10 text-blue-400 border-blue-600/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
          : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
      }`}
    >
      <div className="relative flex-shrink-0">
        {item.icon && typeof item.icon === 'string' && item.icon.startsWith('http') ? (
          <img src={item.icon} className="w-10 h-10 rounded-xl object-cover border border-slate-800" alt={item.name} />
        ) : (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border border-slate-800 bg-slate-800`}>
            {item.icon || item.name[0]}
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-2 border-[#0a0a0c] rounded-full bg-green-500`}></div>
      </div>
      <div className="ml-3 text-left overflow-hidden flex-grow">
        <div className="flex justify-between items-center mb-0.5">
          <span className="font-bold text-xs truncate">{item.name}</span>
          <span className="text-[8px] text-slate-600 font-mono tracking-tighter">NOW</span>
        </div>
        <p className="text-[10px] text-slate-500 truncate">{item.lastMessage || item.description}</p>
      </div>
    </button>
  );

  const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmLabel }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { onClose(); setErrorMessage(null); }}></div>
        <div className="relative w-full max-w-sm glass-effect border border-slate-700 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold gaming-font text-white mb-6 uppercase tracking-wider">{title}</h3>
          
          <div className="space-y-4 mb-8">
            {children}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed tracking-wider">
                  ⚠️ Error: {errorMessage}
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button onClick={() => { onClose(); setErrorMessage(null); }} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">Abort</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Execute</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-80 flex flex-col h-full border-r border-slate-800 transition-colors duration-500 ${isPersonal ? 'bg-[#0a0a0c]' : 'bg-[#070709]'}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isPersonal ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
              {view === 'direct' ? <CustomIcons.MessageSquare /> : view === 'groups' ? <CustomIcons.Users /> : isPersonal ? <CustomIcons.Home /> : <CustomIcons.Globe />}
            </div>
            <h2 className="text-xs font-bold gaming-font text-white tracking-tight uppercase">
              {view === 'all' ? (isPersonal ? 'Home Hub' : 'Global Net') : view}
            </h2>
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search network..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-[11px] focus:outline-none focus:border-blue-500 transition-all text-slate-300 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-y-auto px-2 custom-scrollbar pb-6">
        {isPersonal ? (
          <>
            {filteredRooms.length > 0 ? (
              <div className="space-y-0.5">
                {filteredRooms.map(renderChatItem)}
              </div>
            ) : (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center flex-grow">
                <div className="w-14 h-14 bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-800 shadow-inner text-slate-700">
                  {view === 'direct' ? <CustomIcons.MessageSquare /> : <CustomIcons.Users />}
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">
                  Encryption Layer Active
                </p>
                <p className="text-[8px] text-slate-600 mt-2 uppercase tracking-widest">No existing nodes found.</p>
              </div>
            )}

            <div className="mt-auto px-2 pt-4">
              {view === 'direct' && (
                <button 
                  onClick={() => setShowDmModal(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <CustomIcons.Plus />
                  <span className="gaming-font">Start New Chat</span>
                </button>
              )}

              {view === 'groups' && (
                <button 
                  onClick={() => { setGroupActionType('join'); setShowGroupModal(true); }}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white hover:bg-purple-500 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <CustomIcons.Plus />
                  <span className="gaming-font">Join or Create</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-0.5">
            {MOCK_GLOBAL_ROOMS.map(renderChatItem)}
          </div>
        )}
      </div>

      <Modal 
        isOpen={showDmModal} 
        onClose={() => setShowDmModal(false)}
        title="Initiate Secure Link"
        confirmLabel="Establish"
        onConfirm={handleStartDm}
      >
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-1">Receiver UID</label>
          <input 
            type="text" 
            value={modalInput}
            autoFocus
            onChange={(e) => setModalInput(e.target.value)}
            placeholder="e.g. sarah, ghost, neo..."
            className="w-full bg-[#050507] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </Modal>

      <Modal 
        isOpen={showGroupModal} 
        onClose={() => setShowGroupModal(false)}
        title={groupActionType === 'join' ? 'Deploy to Group' : 'Forge New Squad'}
        confirmLabel={groupActionType === 'join' ? 'Join' : 'Create'}
        onConfirm={handleGroupAction}
      >
        <div className="flex bg-[#050507] p-1 rounded-xl mb-6 border border-slate-800">
          <button 
            onClick={() => { setGroupActionType('join'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${groupActionType === 'join' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600'}`}
          >Join</button>
          <button 
            onClick={() => { setGroupActionType('create'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${groupActionType === 'create' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600'}`}
          >Create</button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-1">
              {groupActionType === 'join' ? 'Tactical GID' : 'Squad Designation'}
            </label>
            <input 
              type="text" 
              value={modalInput}
              autoFocus
              onChange={(e) => setModalInput(e.target.value)}
              placeholder={groupActionType === 'join' ? 'e.g. pubg_pro, cod_war...' : 'Enter squad name...'}
              className="w-full bg-[#050507] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          {groupActionType === 'create' && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-1">Mission Objective</label>
              <input 
                type="text" 
                value={modalInputSecondary}
                onChange={(e) => setModalInputSecondary(e.target.value)}
                placeholder="Squad description..."
                className="w-full bg-[#050507] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;

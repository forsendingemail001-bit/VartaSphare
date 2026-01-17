
import React, { useState, useEffect, useRef } from 'react';
import { HubType, ChatRoom, Message, CursorPos } from './types';
import { Icons } from './constants';
import Sidebar from './components/Sidebar';
import FloatingChatBox from './components/FloatingChatBox';
import DrawingCanvas from './components/DrawingCanvas';
import GlobalHub from './components/GlobalHub';
import ProfileView from './components/ProfileView';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import StatusBar from './components/StatusBar';
import DrawingToolbar from './components/DrawingToolbar';
import { hub } from './services/MicroserviceHub';
import { p2pMesh } from './services/P2PMesh';
import { SocketProvider } from './context/SocketContext';

interface FloatingElement {
  id: string;
  content: string;
  x: number;
  y: number;
  type: 'emoji' | 'text';
  senderName?: string;
}

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeHub, setActiveHub] = useState<HubType>(HubType.PERSONAL);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarView, setSidebarView] = useState('direct');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('deep-space');
  
  const [isPaintMode, setIsPaintMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#3b82f6');
  const [drawSize, setDrawSize] = useState(3);
  const [drawOpacity, setDrawOpacity] = useState(1);
  const [isNeon, setIsNeon] = useState(true);
  const [drawTool, setDrawTool] = useState<'brush' | 'eraser' | 'text'>('brush');
  const [clearTrigger, setClearTrigger] = useState(0);

  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([]);
  const [activeChats, setActiveChats] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({});
  const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: CursorPos }>({});
  
  const [swarmHealth, setSwarmHealth] = useState({ seeds: 1, peers: 1 });

  const currentActiveRoomIdRef = useRef<string>('default');

  // Restore Session
  useEffect(() => {
    const savedSession = localStorage.getItem('varta_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('varta_session');
      }
    }
    const savedTheme = localStorage.getItem('varta_theme');
    if (savedTheme) setCurrentTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const initApp = async () => {
        await hub.start();
        hub.community.announcePresence(currentUser);
        const joined = await hub.community.getJoinedRooms();
        joined.forEach(room => p2pMesh.joinHubSwarm(room.id));
        
        setTimeout(() => setIsReady(true), 1200);
      };
      initApp();
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = (msg: Message) => {
      const rid = msg.roomId || 'default';
      setMessages(prev => {
        const currentRoomMessages = prev[rid] || [];
        if (currentRoomMessages.find(m => m.id === msg.id)) return prev;
        return { ...prev, [rid]: [...currentRoomMessages, msg] };
      });
      if (rid === currentActiveRoomIdRef.current && msg.type === 'text') {
        const id = `pop_${Date.now()}`;
        setFloatingElements(prev => [...prev, {
          id, content: msg.content, x: 15 + Math.random() * 70, y: 15 + Math.random() * 70, type: 'text', senderName: msg.senderName
        }]);
        setTimeout(() => setFloatingElements(prev => prev.filter(e => e.id !== id)), 5000);
      }
    };

    const handleCursorUpdate = (cursor: CursorPos) => {
      if (cursor.userId === currentUser.id) return;
      setRemoteCursors(prev => ({ ...prev, [cursor.userId]: cursor }));
    };

    const unsubMsg = hub.bus.on('MESSAGE_SENT', handleNewMessage);
    const unsubCursor = hub.bus.on('CURSOR_UPDATE', handleCursorUpdate);
    
    return () => {
      unsubMsg();
      unsubCursor();
    };
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('varta_session');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsReady(false);
    setActiveChats([]);
  };

  const spawnChat = async (chat: ChatRoom) => {
    // 1. Join room on Mesh IMMEDIATELY
    p2pMesh.joinHubSwarm(chat.id);
    
    // 2. Load History
    const history = await hub.messaging.loadHistory(chat.id);
    setMessages(prev => ({ ...prev, [chat.id]: history }));
    
    // 3. Set UI State
    setActiveChats([chat]);
    currentActiveRoomIdRef.current = chat.id;
    if (showProfile) setShowProfile(false);
    if (showSettings) setShowSettings(false);
  };

  const currentActiveRoomId = activeChats[0]?.id || '';

  const themeClasses: any = {
    'deep-space': 'bg-[#0a0a0c] text-slate-100',
    'cyberpunk': 'bg-[#0d0221] text-pink-500',
    'light-protocol': 'bg-[#f8fafc] text-slate-900',
    'emerald-link': 'bg-[#061a06] text-green-400'
  };

  if (!isLoggedIn) return <LoginView onLogin={(n, a, p) => {
    const u = { id: `uid_${Math.random().toString(36).substr(2, 6)}`, name: n, avatar: a, position: p, status: 'online', bio: 'Linked to Global Neural Relay.' };
    localStorage.setItem('varta_session', JSON.stringify(u));
    setCurrentUser(u); 
    setIsLoggedIn(true);
  }} />;

  if (!isReady) return (
    <div className="h-screen w-full bg-[#050507] flex items-center justify-center flex-col space-y-6">
      <Icons.Logo className="w-24 h-24 animate-pulse" />
      <p className="gaming-font text-blue-500 animate-pulse text-sm tracking-[0.3em]">SYNCHRONIZING WITH NEURAL RELAY...</p>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen w-full transition-colors duration-500 overflow-hidden relative ${themeClasses[currentTheme]}`} onMouseMove={(e) => {
      if (!currentUser || !currentActiveRoomId) return;
      hub.transmission.broadcastCursor({ userId: currentUser.id, userName: currentUser.name, x: e.clientX, y: e.clientY, roomId: currentActiveRoomId, color: '#3b82f6' });
    }}>
      <Navbar 
        activeHub={activeHub} 
        setActiveHub={setActiveHub} 
        setSelectedChat={(chat) => {
          if (!chat) setActiveChats([]);
          else spawnChat(chat);
        }} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        onOpenSettings={() => {
          setShowSettings(!showSettings);
          setShowProfile(false);
        }}
        activeRoomId={currentActiveRoomId}
      />
      <div className="flex flex-grow overflow-hidden relative">
        <div className="w-16 flex-shrink-0 flex flex-col items-center py-6 space-y-6 bg-black/40 border-r border-white/10 z-[100]">
          <button onClick={() => toggleSidebarView('direct')} className={`p-2.5 rounded-xl transition-all ${sidebarView === 'direct' && isSidebarOpen ? 'bg-blue-600 shadow-[0_0_15px_#3b82f6]' : 'text-slate-500 hover:bg-white/10'}`} title="Direct Transmissions"><Icons.MessageSquare /></button>
          <button onClick={() => toggleSidebarView('squads')} className={`p-2.5 rounded-xl transition-all ${sidebarView === 'squads' && isSidebarOpen ? 'bg-blue-600 shadow-[0_0_15px_#3b82f6]' : 'text-slate-500 hover:bg-white/10'}`} title="Squad Hubs"><Icons.Users /></button>
          <button onClick={() => toggleSidebarView('atmosphere')} className={`p-2.5 rounded-xl transition-all ${sidebarView === 'atmosphere' && isSidebarOpen ? 'bg-blue-600 shadow-[0_0_15px_#3b82f6]' : 'text-slate-500 hover:bg-white/10'}`} title="Visual Atmosphere"><Icons.Atmosphere /></button>
          <button onClick={() => setIsPaintMode(!isPaintMode)} className={`p-2.5 rounded-xl transition-all ${isPaintMode ? 'bg-cyan-600 shadow-[0_0_15px_#06b6d4]' : 'text-slate-500 hover:bg-white/10'}`} title="Tactical Canvas"><Icons.Paint /></button>
          <div className="flex-grow"></div>
          <button onClick={() => { setShowProfile(!showProfile); setShowSettings(false); }} className={`p-3 rounded-xl transition-all ${showProfile ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/10'}`} title="User Node Info"><Icons.User /></button>
        </div>
        
        <div className={`flex-shrink-0 overflow-hidden transition-all duration-300 z-[90] ${isSidebarOpen && activeHub === HubType.PERSONAL && !showProfile && !showSettings ? 'w-80 border-r border-white/10' : 'w-0'}`}>
          <Sidebar 
            activeHub={activeHub} 
            onSelectChat={spawnChat} 
            view={sidebarView} 
            currentUser={currentUser} 
            selectedChatId={currentActiveRoomId} 
            currentTheme={currentTheme}
            onSelectTheme={(t) => { setCurrentTheme(t); localStorage.setItem('varta_theme', t); }}
          />
        </div>

        <div className="flex-grow relative h-full z-10 overflow-hidden">
          {showProfile ? (
            <ProfileView user={currentUser} onLogout={handleLogout} />
          ) : showSettings ? (
            <div className="h-full w-full flex items-center justify-center p-8 bg-black/20">
              <div className="max-w-xl w-full glass-effect p-10 rounded-[2.5rem] border border-slate-800 text-center">
                 <Icons.Settings className="w-16 h-16 mx-auto mb-6 text-blue-500" />
                 <h2 className="text-2xl font-bold gaming-font mb-4 uppercase">Neural Configuration</h2>
                 <p className="text-slate-500 mb-8 text-sm">Fine-tune your mesh connection parameters and system preferences.</p>
                 <div className="grid grid-cols-1 gap-4">
                    <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left hover:border-blue-500 transition-all flex items-center justify-between">
                       <span className="text-xs font-bold uppercase tracking-widest">Notification Protocol</span>
                       <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                    </button>
                    <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left hover:border-blue-500 transition-all flex items-center justify-between">
                       <span className="text-xs font-bold uppercase tracking-widest">Neural Cluster discovery</span>
                       <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                    </button>
                    <button onClick={() => setShowSettings(false)} className="mt-4 p-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-xs">Save Configuration</button>
                 </div>
              </div>
            </div>
          ) : (
            <>
              {activeHub === HubType.PERSONAL ? (
                <>
                  <DrawingCanvas key={currentActiveRoomId || 'empty'} color={drawColor} brushSize={drawSize} brushOpacity={drawOpacity} isNeon={isNeon} tool={drawTool} clearTrigger={clearTrigger} />
                  
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {Object.values(remoteCursors).map((c: CursorPos) => (
                        <div key={c.userId} className="absolute transition-all duration-100 ease-out" style={{ left: c.x, top: c.y }}>
                            <div className="relative">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={c.color || '#3b82f6'} className="drop-shadow-lg">
                                    <path d="M5.653 3.123l14.053 6.94c1.17.577 1.152 2.253-.03 2.8l-4.706 2.185-2.185 4.706c-.547 1.182-2.223 1.2-2.8.03l-6.94-14.053c-.538-1.09.52-2.147 1.608-1.608z"/>
                                </svg>
                                <div className="absolute top-6 left-2 bg-slate-900/80 px-2 py-0.5 rounded border border-white/10">
                                    <span className="text-[7px] text-white font-bold uppercase tracking-widest whitespace-nowrap">{c.userName}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>

                  <div className="absolute inset-0 pointer-events-none z-[15]">
                    {floatingElements.map(el => (
                      <div key={el.id} className="absolute animate-[message-pop_5s_ease-out_forwards]" style={{ left: `${el.x}%`, top: `${el.y}%` }}>
                        <div className="bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-xl pointer-events-auto">
                          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1 opacity-60">{el.senderName}</p>
                          <p className="text-sm text-white font-medium max-w-[200px] break-words">{el.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <GlobalHub onJoinRoom={(room) => {
                    spawnChat(room);
                    setActiveHub(HubType.PERSONAL);
                }} />
              )}
            </>
          )}

          {activeChats.map((chat) => (
            <FloatingChatBox 
              key={chat.id} 
              chat={chat} 
              messages={messages[chat.id] || []} 
              onSendMessage={(c) => {
                hub.messaging.sendMessage({ 
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, 
                    roomId: chat.id, 
                    senderId: currentUser.id, 
                    senderName: currentUser.name, 
                    senderAvatar: currentUser.avatar, 
                    content: c, 
                    timestamp: Date.now(), 
                    type: 'text' 
                });
              }} 
              onClose={() => {
                setActiveChats([]);
                currentActiveRoomIdRef.current = '';
              }} 
              currentUser={currentUser} 
              initialPosition={{ x: window.innerWidth - 420, y: 100 }} 
            />
          ))}
        </div>
      </div>
      
      {activeHub === HubType.PERSONAL && !showProfile && !showSettings && (
        isPaintMode 
          ? <DrawingToolbar color={drawColor} setColor={setDrawColor} brushSize={drawSize} setBrushSize={setDrawSize} brushOpacity={drawOpacity} setBrushOpacity={setDrawOpacity} isNeon={isNeon} setIsNeon={setIsNeon} activeTool={drawTool} setActiveTool={setDrawTool} onClear={() => setClearTrigger(Date.now())} onAddSticker={() => {}} /> 
          : <StatusBar activeHub={activeHub} currentUser={currentUser} onAddSticker={(emoji) => {
              const id = `pop_${Date.now()}`;
              setFloatingElements(prev => [...prev, { id, content: emoji, x: 15 + Math.random() * 70, y: 15 + Math.random() * 70, type: 'emoji', senderName: currentUser.name }]);
              setTimeout(() => setFloatingElements(prev => prev.filter(e => e.id !== id)), 5000);
            }} swarm={swarmHealth} />
      )}
    </div>
  );

  function toggleSidebarView(id: string) {
    if (sidebarView === id && isSidebarOpen) setIsSidebarOpen(false);
    else { 
      setSidebarView(id); 
      setIsSidebarOpen(true); 
      setShowProfile(false); 
      setShowSettings(false);
      setIsPaintMode(false); 
      setActiveHub(HubType.PERSONAL);
    }
  }
};

const App: React.FC = () => {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
};

export default App;

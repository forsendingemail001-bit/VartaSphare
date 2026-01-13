
import React, { useState, useEffect, useCallback } from 'react';
import { HubType, ChatRoom, Message } from './types';
import { Icons, MOCK_CHATS } from './constants';
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

interface Sticker {
  id: string;
  content: string;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeHub, setActiveHub] = useState<HubType>(HubType.PERSONAL);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarView, setSidebarView] = useState('direct');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Drawing State
  const [isPaintMode, setIsPaintMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#3b82f6');
  const [drawSize, setDrawSize] = useState(3);
  const [drawOpacity, setDrawOpacity] = useState(1);
  const [isNeon, setIsNeon] = useState(true);
  const [drawTool, setDrawTool] = useState<'brush' | 'eraser' | 'text'>('brush');
  const [clearTrigger, setClearTrigger] = useState(0);

  // Sticker State (Emoji on Dashboard)
  const [activeStickers, setActiveStickers] = useState<Sticker[]>([]);

  // Manage multiple active floating chats
  const [activeChats, setActiveChats] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({});

  useEffect(() => {
    if (isLoggedIn) {
      const initApp = async () => {
        await hub.start();
        setTimeout(() => setIsReady(true), 1500);
      };
      initApp();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleNewMessage = (msg: Message) => {
      const rid = msg.roomId || 'default';
      setMessages(prev => ({
        ...prev,
        [rid]: [...(prev[rid] || []), msg]
      }));
    };
    hub.bus.on('MESSAGE_SENT', handleNewMessage);
  }, []);

  useEffect(() => {
    setSidebarView(activeHub === HubType.PERSONAL ? 'direct' : 'trending');
    setShowProfile(false);
    setIsSidebarOpen(true);
    setIsPaintMode(false);
  }, [activeHub]);

  const handleLogin = (name: string, avatar: string, position: string) => {
    // Standardized UID generation
    const uid = `uid_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: uid,
      name: name,
      avatar: avatar,
      position: position,
      status: 'online',
      bio: `VartaSphere ${position.toUpperCase()} operational.`
    };
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const spawnChat = (chat: ChatRoom) => {
    // Ensure standard ID format if missing
    let finalChat = { ...chat };
    if (!chat.id.startsWith('gid_') && !chat.id.startsWith('dm_')) {
      finalChat.id = chat.type === 'dm' ? `dm_${chat.id}` : `gid_${chat.id}`;
    }

    if (!activeChats.find(c => c.id === finalChat.id)) {
      setActiveChats(prev => [...prev, finalChat]);
    }
  };

  const closeChat = (chatId: string) => {
    setActiveChats(prev => prev.filter(c => c.id !== chatId));
  };

  const handleSendMessage = (chatId: string, content: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roomId: chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    hub.messaging.sendMessage(newMessage);
  };

  const addSticker = useCallback((content: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Random position within central dashboard area
    const x = 20 + Math.random() * 60; 
    const y = 20 + Math.random() * 60; 
    
    const newSticker: Sticker = { id, content, x, y };
    setActiveStickers(prev => [...prev, newSticker]);

    // Remove after 7 seconds
    setTimeout(() => {
      setActiveStickers(prev => prev.filter(s => s.id !== id));
    }, 7000);
  }, []);

  const toggleSidebarView = (id: string) => {
    if (id === 'paint') {
      setIsPaintMode(!isPaintMode);
      return;
    }

    if (sidebarView === id && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      setSidebarView(id);
      setIsSidebarOpen(true);
      setShowProfile(false);
      setIsPaintMode(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (!isReady) {
    return (
      <div className="h-screen w-full bg-[#050507] flex items-center justify-center flex-col space-y-6">
        <Icons.Logo className="w-24 h-24 animate-pulse" />
        <p className="gaming-font text-blue-500 animate-pulse text-sm uppercase tracking-[0.3em]">Synchronizing Neural Link...</p>
      </div>
    );
  }

  const RailIcon = ({ icon: Icon, id, active, activeOverride }: { icon: any, id: string, active: boolean, activeOverride?: boolean }) => (
    <button 
      onClick={() => toggleSidebarView(id)}
      className={`group relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 ${activeOverride || (active && isSidebarOpen) ? 'bg-blue-600 text-white shadow-[0_0_15px_#3b82f6]' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
    >
      <Icon />
      {(activeOverride || (active && isSidebarOpen)) && <div className="absolute -left-3 w-1 h-4 bg-blue-500 rounded-r-full"></div>}
    </button>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0c] text-slate-100 overflow-hidden">
      <Navbar 
        activeHub={activeHub} 
        setActiveHub={setActiveHub} 
        setSelectedChat={() => {}} 
        currentUser={currentUser}
      />

      <div className="flex flex-grow overflow-hidden relative">
        {/* Left Icon Rail */}
        <div className="w-16 flex-shrink-0 flex flex-col items-center py-6 space-y-6 bg-[#050507] border-r border-slate-800 z-[100]">
          {activeHub === HubType.PERSONAL ? (
            <>
              <RailIcon icon={Icons.MessageSquare} id="direct" active={sidebarView === 'direct'} />
              <RailIcon icon={Icons.Users} id="groups" active={sidebarView === 'groups'} />
              <RailIcon icon={Icons.Paint} id="paint" active={false} activeOverride={isPaintMode} />
            </>
          ) : (
            <>
              <RailIcon icon={Icons.TrendingUp} id="trending" active={sidebarView === 'trending'} />
              <RailIcon icon={Icons.Shield} id="clans" active={sidebarView === 'clans'} />
            </>
          )}
          <div className="flex-grow"></div>
          <button onClick={() => setShowProfile(!showProfile)} className={`p-3 rounded-xl ${showProfile ? 'bg-blue-600' : 'text-slate-500'}`}><Icons.User /></button>
          <button onClick={() => toggleSidebarView('atmosphere')} className={`p-3 rounded-xl ${sidebarView === 'atmosphere' ? 'bg-cyan-600' : 'text-slate-500'}`}><Icons.Atmosphere /></button>
        </div>

        {/* Sidebar */}
        <div className={`flex-shrink-0 overflow-hidden transition-all duration-300 bg-[#0a0a0c] z-[90] ${isSidebarOpen && !showProfile ? 'w-80 border-r border-slate-800' : 'w-0'}`}>
          <div className="w-80 h-full">
            <Sidebar 
              activeHub={activeHub}
              onSelectChat={(chat) => spawnChat(chat)}
              view={sidebarView}
            />
          </div>
        </div>

        {/* The Dashbored / Drawing Bored */}
        <div className="flex-grow relative h-full z-10">
          {showProfile ? (
            <ProfileView user={currentUser} />
          ) : (
            <>
              <DrawingCanvas 
                color={drawColor}
                brushSize={drawSize}
                brushOpacity={drawOpacity}
                isNeon={isNeon}
                tool={drawTool}
                clearTrigger={clearTrigger}
              />
              {/* Sticker Overlay Layer */}
              <div className="absolute inset-0 pointer-events-none z-[15]">
                {activeStickers.map(sticker => (
                  <div 
                    key={sticker.id}
                    className="absolute transition-none animate-[sticker-pop_7s_linear_forwards]"
                    style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                  >
                    <span className="text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">{sticker.content}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Floating Chat Containers */}
          {activeChats.map((chat, index) => (
            <FloatingChatBox 
              key={chat.id}
              chat={chat}
              messages={messages[chat.id] || []}
              onSendMessage={(content) => handleSendMessage(chat.id, content)}
              onClose={() => closeChat(chat.id)}
              currentUser={currentUser}
              initialPosition={{ x: window.innerWidth - 400 - (index * 30), y: 100 + (index * 40) }}
            />
          ))}
        </div>
      </div>

      {/* Global Status Bar or Drawing Toolbar */}
      {isPaintMode ? (
        <DrawingToolbar 
          color={drawColor} setColor={setDrawColor}
          brushSize={drawSize} setBrushSize={setDrawSize}
          brushOpacity={drawOpacity} setBrushOpacity={setDrawOpacity}
          isNeon={isNeon} setIsNeon={setIsNeon}
          activeTool={drawTool} setActiveTool={setDrawTool}
          onClear={() => setClearTrigger(Date.now())}
          onAddSticker={addSticker}
        />
      ) : (
        <StatusBar 
          activeHub={activeHub} 
          currentUser={currentUser} 
          onAddSticker={addSticker}
        />
      )}

      <style>{`
        @keyframes sticker-pop {
          0% { transform: scale(0); opacity: 0; }
          2% { transform: scale(1); opacity: 1; }
          98% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;

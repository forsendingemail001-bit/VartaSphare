
import React, { useState, useRef, useEffect } from 'react';
import { ChatRoom, Message } from '../types';
import { Icons } from '../constants';
import { hub } from '../services/MicroserviceHub';

interface FloatingChatBoxProps {
  chat: ChatRoom;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onClose: () => void;
  currentUser: any;
  initialPosition?: { x: number, y: number };
}

const FloatingChatBox: React.FC<FloatingChatBoxProps> = ({ 
  chat, messages, onSendMessage, onClose, currentUser, initialPosition = { x: 100, y: 100 }
}) => {
  const [pos, setPos] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    
    setIsDragging(true);
    const offset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      setPos({ x: moveEvent.clientX - offset.x, y: moveEvent.clientY - offset.y });
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-99999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Purge all logs for this hub? This cannot be undone.")) {
      await hub.messaging.deleteHistory(chat.id);
      setShowMenu(false);
    }
  };

  const handleDeleteHub = async () => {
    if (confirm("Decommission this hub and terminate all links?")) {
      await hub.community.deleteRoom(chat.id);
      onClose();
    }
  };

  const renderIcon = (icon?: string, fallbackName: string = "Room") => {
    if (icon && (icon.startsWith('http') || icon.startsWith('data:'))) {
        return <img src={icon} className="w-full h-full object-cover" alt="" />;
    }
    return <span className="text-lg font-bold">{fallbackName[0]}</span>;
  };

  return (
    <div 
      className={`fixed z-[200] flex flex-col glass-effect border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-opacity duration-200 ${isDragging ? 'opacity-90 select-none' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: '360px', height: '480px' }}
    >
      <div onMouseDown={handleMouseDown} className="h-14 flex items-center justify-between px-4 bg-[#0f1115]/95 cursor-grab border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            {renderIcon(chat.icon, chat.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white tracking-tight truncate uppercase gaming-font">{chat.name}</span>
            <div className="flex items-center space-x-2">
                <span className="text-[7px] text-slate-500 font-mono uppercase tracking-widest">{chat.type === 'dm' ? 'P2P Link' : 'Squad Hub'}</span>
                {chat.type === 'group' && (
                  <button onClick={(e) => copyToClipboard(e, chat.id)} className={`text-[7px] font-bold px-1.5 py-0.5 rounded border transition-all active:scale-95 ${copiedId ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-blue-500/5 text-blue-500 border-blue-500/20 hover:border-blue-500/50'}`}>
                    {copiedId ? 'LINK SYNCED' : `ID: ${chat.id.split('_')[1]?.slice(0,6) || chat.id.slice(0,6)}...`}
                  </button>
                )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2 relative">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-2 hover:bg-slate-800 rounded-lg transition-all ${showMenu ? 'text-blue-400' : 'text-slate-500'}`}>
            <Icons.More />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1d23] border border-slate-700 rounded-xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <button onClick={handleClearHistory} className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors uppercase font-bold tracking-widest">
                   <Icons.File />
                   <span className="ml-2">Purge Logs</span>
                </button>
                <button onClick={handleDeleteHub} className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors uppercase font-bold tracking-widest">
                   <Icons.Check />
                   <span className="ml-2">Decommission</span>
                </button>
              </div>
            </>
          )}

          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#050507]/40 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end max-w-[85%] ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-slate-700 ${msg.senderId === currentUser.id ? 'ml-2' : 'mr-2'}`}>
                  <img src={msg.senderAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderId}`} className="w-full h-full object-cover" alt="" />
               </div>
               <div className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed transition-all shadow-sm ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                  {msg.content}
                </div>
                <span className="text-[7px] text-slate-600 mt-1 font-mono uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
            <Icons.Shield className="w-12 h-12 mb-4" />
            <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Neural logs empty</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#0f1115]/95 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            placeholder="Transmit logs..." 
            className="flex-grow bg-[#050507] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono" 
          />
          <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Icons.Send /></button>
        </div>
      </div>
    </div>
  );
};

export default FloatingChatBox;

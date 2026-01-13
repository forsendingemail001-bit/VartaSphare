
import React, { useState, useEffect, useRef } from 'react';
import { ChatRoom, Message } from '../types';
import { Icons } from '../constants';
import { geminiService } from '../services/geminiService';

interface ChatWindowProps {
  chat: ChatRoom;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack: () => void;
  currentUser: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, messages, onSendMessage, onBack, currentUser }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const textToSend = inputValue;
    setInputValue('');
    onSendMessage(textToSend);

    if (chat.type === 'global' || chat.type === 'clan') {
      const result = await geminiService.moderateContent(textToSend);
      setSuggestions(result.suggestions || []);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#0f1115] border-b border-slate-800 z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="md:hidden mr-4 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div className="relative">
            {chat.icon && chat.icon.length > 2 ? (
              <img src={chat.icon} className="w-10 h-10 rounded-lg" alt={chat.name} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                {chat.icon || chat.name[0]}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f1115]"></div>
          </div>
          <div className="ml-3">
            <h3 className="font-bold text-white text-sm">{chat.name}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {chat.type === 'dm' ? 'Private Connection' : `${chat.members.length || '3.2k'} Online`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-slate-400">
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Icons.Phone /></button>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Icons.Video /></button>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Icons.More /></button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
               <Icons.Sparkles />
            </div>
            <p className="text-sm">No transmissions yet. Initiate contact.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[70%] ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden ${msg.senderId === currentUser.id ? 'ml-3' : 'mr-3'}`}>
                <img src={msg.senderId === currentUser.id ? currentUser.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderId}`} alt={msg.senderName} />
              </div>
              <div className={msg.senderId === currentUser.id ? 'text-right' : 'text-left'}>
                <div className={`flex items-baseline mb-1 ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                   <span className="text-[10px] font-bold text-slate-400 mx-2">{msg.senderName}</span>
                   <span className="text-[9px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`p-3 rounded-2xl text-sm ${
                  msg.senderId === currentUser.id 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-slate-800 p-2 rounded-lg text-xs text-slate-400">Node typing...</div>
           </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-[#0a0a0c] border-t border-slate-800">
        {suggestions.length > 0 && (
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputValue(s);
                  setSuggestions([]);
                }}
                className="whitespace-nowrap px-4 py-2 bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-800/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-500 hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <div className="flex-grow relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Communicate with ${chat.name}...`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
            />
          </div>
          <button 
            onClick={handleSend}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Icons.Send />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

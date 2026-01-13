
import React, { useState, useRef, useEffect } from 'react';
import { ChatRoom, Message } from '../types';
import { Icons } from '../constants';
import { geminiService } from '../services/geminiService';

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
  const [size, setSize] = useState({ width: 360, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    setIsDragging(true);
    const offset = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      setPos({
        x: moveEvent.clientX - offset.x,
        y: moveEvent.clientY - offset.y
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startSize = { ...size };
    const startPos = { x: e.clientX, y: e.clientY };

    const onMouseMove = (moveEvent: MouseEvent) => {
      setSize({
        width: Math.max(300, startSize.width + (moveEvent.clientX - startPos.x)),
        height: Math.max(300, startSize.height + (moveEvent.clientY - startPos.y))
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
    <div 
      ref={dragRef}
      className={`fixed z-[200] flex flex-col glass-effect border border-slate-700 rounded-2xl shadow-2xl overflow-hidden ${isDragging ? 'opacity-90 select-none' : ''}`}
      style={{ 
        left: `${pos.x}px`, 
        top: `${pos.y}px`, 
        width: `${size.width}px`, 
        height: `${size.height}px` 
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="h-14 flex items-center justify-between px-4 bg-slate-900/80 cursor-grab active:cursor-grabbing border-b border-slate-800"
      >
        <div className="flex items-center space-x-3 pointer-events-none min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {chat.icon && chat.icon.length < 3 ? chat.icon : chat.name[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white tracking-tight truncate">{chat.name}</span>
            <span className="text-[8px] text-slate-500 font-mono tracking-widest">{chat.id.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-3 bg-[#0a0a0c]/60 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2.5 rounded-xl text-[12px] leading-relaxed ${
                msg.senderId === currentUser.id 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message..."
            className="flex-grow bg-[#050507] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
            <Icons.Send />
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={handleResizeStart}
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 group"
      >
        <div className="w-1.5 h-1.5 bg-slate-600 rounded-full group-hover:bg-blue-500 transition-colors"></div>
      </div>
    </div>
  );
};

export default FloatingChatBox;

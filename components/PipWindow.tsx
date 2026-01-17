
import React, { useState } from 'react';
import { PipState } from '../types';
import { Icons } from '../constants';

interface PipWindowProps {
  pip: PipState;
  onClose: () => void;
  onMinimize: () => void;
}

const PipWindow: React.FC<PipWindowProps> = ({ pip, onClose, onMinimize }) => {
  const [pos, setPos] = useState({ x: pip.x, y: pip.y });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pip-action')) return;
    setIsDragging(true);
    const offset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    const onMouseMove = (moveEvent: MouseEvent) => setPos({ x: moveEvent.clientX - offset.x, y: moveEvent.clientY - offset.y });
    const onMouseUp = () => { setIsDragging(false); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!pip.isVisible || pip.minimized) return null;

  return (
    <div 
      className={`fixed z-[180] flex flex-col glass-effect border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden transition-opacity ${isDragging ? 'opacity-90 select-none' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: '320px', height: '240px' }}
    >
      <div 
        onMouseDown={handleMouseDown} 
        className="h-10 flex items-center justify-between px-3 bg-[#0f1115]/90 cursor-grab active:cursor-grabbing border-b border-slate-800"
      >
        <span className="text-[10px] font-bold text-slate-300 truncate uppercase gaming-font">{pip.title}</span>
        <div className="flex space-x-1">
          <button onClick={onMinimize} className="pip-action p-1.5 hover:bg-slate-800 rounded text-slate-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
          <button onClick={onClose} className="pip-action p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      
      <div className="flex-grow bg-black/40 flex items-center justify-center overflow-hidden">
        {pip.type === 'image' && <img src={pip.url} className="max-w-full max-h-full object-contain" alt={pip.title} />}
        {pip.type === 'video' && <video src={pip.url} controls className="w-full h-full object-contain" />}
        {pip.type === 'audio' && (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 animate-pulse"><Icons.Phone /></div>
            <audio src={pip.url} controls className="w-48 h-8" />
          </div>
        )}
        {pip.type === 'file' && (
          <div className="flex flex-col items-center p-6 text-center">
            <Icons.File />
            <span className="text-xs text-slate-300 mt-2 font-mono">{pip.title}</span>
            <span className="text-[9px] text-slate-500 mt-1 uppercase">Ready for P2P Leeching</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipWindow;

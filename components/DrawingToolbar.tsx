
import React from 'react';
import { Icons } from '../constants';

interface DrawingToolbarProps {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  isNeon: boolean;
  setIsNeon: (neon: boolean) => void;
  activeTool: 'brush' | 'eraser' | 'text';
  setActiveTool: (tool: 'brush' | 'eraser' | 'text') => void;
  onClear: () => void;
  onAddSticker: (content: string) => void;
}

const EMOJIS = ['🔥', '🎮', '🚀', '💀', '💎', '🎯', '⚔️', '🛡️', '👑', '⚡', '🤖', '👾'];

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  color, setColor, brushSize, setBrushSize, brushOpacity, setBrushOpacity, 
  isNeon, setIsNeon, activeTool, setActiveTool, onClear, onAddSticker
}) => {
  const tacticalColors = [
    { hex: '#3b82f6', name: 'Blue' },
    { hex: '#ef4444', name: 'Red' },
    { hex: '#22c55e', name: 'Green' },
    { hex: '#eab308', name: 'Gold' },
    { hex: '#a855f7', name: 'Purple' },
    { hex: '#ffffff', name: 'White' },
    { hex: '#06b6d4', name: 'Cyan' }
  ];

  return (
    <div className="h-14 w-full bg-[#050507] border-t border-blue-900/30 flex items-center justify-between px-6 z-50 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {/* Tool Selection */}
      <div className="flex items-center space-x-2 border-r border-slate-800 pr-6 mr-6">
        <button 
          onClick={() => setActiveTool('brush')}
          className={`p-2 rounded-lg transition-all ${activeTool === 'brush' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
        >
          <Icons.Paint />
        </button>
        <button 
          onClick={() => setActiveTool('eraser')}
          className={`p-2 rounded-lg transition-all ${activeTool === 'eraser' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
      </div>

      {/* Sliders Area */}
      <div className="flex items-center space-x-6 border-r border-slate-800 pr-6 mr-6">
        <div className="flex flex-col space-y-1 w-24">
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Size {brushSize}px</span>
          <input 
            type="range" min="1" max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <div className="flex flex-col space-y-1 w-24">
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Alpha {Math.round(brushOpacity * 100)}%</span>
          <input 
            type="range" min="0.1" max="1" step="0.1"
            value={brushOpacity} 
            onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      {/* Emoji Reel (Direct Selection) */}
      <div className="flex items-center space-x-3 flex-grow overflow-x-auto custom-scrollbar no-scrollbar mr-6 pr-6 border-r border-slate-800">
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest gaming-font whitespace-nowrap">Markers:</span>
        {EMOJIS.map(emoji => (
          <button 
            key={emoji}
            onClick={() => onAddSticker(emoji)}
            className="text-xl hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Color Palette */}
      <div className="flex items-center space-x-1.5 mr-6 pr-6 border-r border-slate-800">
        {tacticalColors.map((c) => (
          <button
            key={c.hex}
            onClick={() => setColor(c.hex)}
            className={`w-5 h-5 rounded border transition-all ${color === c.hex ? 'border-white scale-110 shadow-[0_0_8px_white]' : 'border-transparent'}`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      {/* Toggles & Actions */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setIsNeon(!isNeon)}
          className={`flex items-center space-x-2 px-2 py-1 rounded border transition-all ${isNeon ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isNeon ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`}></div>
          <span className="text-[8px] font-bold uppercase tracking-widest gaming-font">Neon</span>
        </button>

        <button 
          onClick={onClear}
          className="p-2 bg-slate-900 border border-slate-700 text-slate-500 hover:text-red-400 transition-all rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  );
};

export default DrawingToolbar;


import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  color: string;
  brushSize: number;
  brushOpacity: number;
  isNeon: boolean;
  tool: 'brush' | 'eraser' | 'text';
  clearTrigger: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  color, brushSize, brushOpacity, isNeon, tool, clearTrigger 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      // Create temporary image to preserve drawing during resize
      const tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      ctx.putImageData(tempImage, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (clearTrigger > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [clearTrigger]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.beginPath();
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
      ctx.globalAlpha = brushOpacity;
      
      if (isNeon) {
        ctx.shadowBlur = brushSize;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="relative w-full h-full bg-[#0f1115] overflow-hidden group">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
        className="relative z-10 cursor-crosshair touch-none"
      />

      <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="glass-effect px-4 py-2 rounded-xl border border-blue-500/20 opacity-20 group-hover:opacity-100 transition-opacity">
           <span className="text-[10px] gaming-font text-blue-400 uppercase tracking-[0.5em]">Tactical Overlay Active</span>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;

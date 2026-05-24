'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Palette, Trash2, Brush, Square, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SketchpadProps {
  value: string; // Base64 data URL
  onChange: (value: string) => void;
}

const PEN_COLORS = [
  { value: 'dynamic', label: 'Theme Pen', light: '#0f172a', dark: '#f4f4f5' },
  { value: '#4f46e5', label: 'Indigo', light: '#4f46e5', dark: '#6366f1' },
  { value: '#10b981', label: 'Mint', light: '#10b981', dark: '#10b981' },
  { value: '#ec4899', label: 'Blossom', light: '#ec4899', dark: '#f472b6' },
  { value: '#eab308', label: 'Amber', light: '#eab308', dark: '#facc15' },
  { value: '#a855f7', label: 'Lilac', light: '#a855f7', dark: '#c084fc' },
  { value: '#ef4444', label: 'Coral', light: '#ef4444', dark: '#f87171' },
];

const PEN_SIZES = [
  { value: 2, label: 'Fine' },
  { value: 5, label: 'Medium' },
  { value: 10, label: 'Thick' },
];

export default function Sketchpad({ value, onChange }: SketchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('dynamic');
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Initialize canvas dimension responsiveness
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || 600;
    canvas.height = 360;

    // Canvas background default setting
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas with white background (or transparent, but solid helps editing)
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#18181b' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load pre-existing drawing image if value is provided
    if (value && value.startsWith('data:image/')) {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }

    setCanvasInitialized(true);
  }, []);

  // Sync background on theme changes while preserving drawings!
  useEffect(() => {
    if (!canvasInitialized) return;
    
    // In React Canvas, changing container theme doesn't automatically repaint canvas,
    // which is excellent because the canvas maintains its independent drawing states!
  }, [canvasInitialized]);

  const getPenColor = () => {
    if (isEraser) {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? '#18181b' : '#ffffff';
    }
    
    const pen = PEN_COLORS.find(c => c.value === color);
    if (!pen) return '#4f46e5';

    if (pen.value === 'dynamic') {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? pen.dark : pen.light;
    }
    
    return pen.value;
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if Touch Event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    // Otherwise Mouse Event
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Drawing mouse/touch handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = getPenColor();
    ctx.lineWidth = size;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasState();
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#18181b' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    saveCanvasState();
  };

  return (
    <div className="space-y-4">
      {/* Toolbox Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted-light/60 border border-card-border/80 rounded-2xl">
        {/* Colors Row */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider hidden sm:inline mr-1">Pen</span>
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map((pen) => {
              const isSelected = !isEraser && color === pen.value;
              const isDark = document.documentElement.classList.contains('dark');
              const displayBg = pen.value === 'dynamic' ? (isDark ? pen.dark : pen.light) : pen.value;
              
              return (
                <button
                  key={pen.value}
                  type="button"
                  onClick={() => {
                    setColor(pen.value);
                    setIsEraser(false);
                  }}
                  title={pen.label}
                  style={{ backgroundColor: displayBg }}
                  className={cn(
                    "w-6 h-6 rounded-full border border-card-border smooth-hover hover:scale-105 active:scale-95 flex items-center justify-center",
                    isSelected ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-indigo-400 dark:ring-offset-zinc-900 scale-105" : ""
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Eraser */}
          <button
            type="button"
            onClick={() => setIsEraser(!isEraser)}
            className={cn(
              "py-1.5 px-3 border border-card-border rounded-xl text-xs font-semibold smooth-hover active:scale-95",
              isEraser 
                ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" 
                : "bg-card-bg text-muted hover:text-text-base"
            )}
          >
            Eraser
          </button>

          {/* Size dropdown */}
          <div className="flex items-center gap-1">
            {PEN_SIZES.map((penSize) => {
              const isSelected = size === penSize.value;
              return (
                <button
                  key={penSize.value}
                  type="button"
                  onClick={() => setSize(penSize.value)}
                  className={cn(
                    "w-7 h-7 text-[10px] font-bold rounded-lg border flex items-center justify-center smooth-hover active:scale-95",
                    isSelected 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-card-bg border-card-border text-muted hover:text-text-base"
                  )}
                >
                  {penSize.value}
                </button>
              );
            })}
          </div>

          {/* Clear canvas */}
          <button
            type="button"
            onClick={clearCanvas}
            title="Clear Sketchpad"
            className="p-1.5 rounded-xl border border-card-border text-muted hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/15 smooth-hover active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Drawing Board */}
      <div 
        ref={containerRef}
        className="w-full bg-white dark:bg-zinc-900 border border-card-border rounded-3xl overflow-hidden cursor-crosshair relative shadow-inner"
        style={{ touchAction: 'none' }} // Prevents mobile touch gestures from scrolling the page while drawing
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full"
        />
      </div>
    </div>
  );
}

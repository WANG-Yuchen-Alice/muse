/*
 * Step 2: Sketch the Melody
 * Canvas drawing: Y=pitch, X=time, quantized to scale
 * Supports: click for dots, drag for lines, multiple strokes
 * Click on existing node to DELETE it
 * Clear all / Undo support
 * Integrated with Tone.js for real-time audio feedback
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eraser, Sparkles, ArrowRight, Volume2, Undo2, Play, Trash2, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getScaleNotes } from '@/lib/themes';
import type { MelodyPoint } from '@/contexts/CompositionContext';

const AI_MELODIES = [
  { id: 'ai-1', name: 'Rising Hope', description: 'Ascending melody with gentle resolution' },
  { id: 'ai-2', name: 'Gentle Wave', description: 'Flowing up and down like ocean waves' },
  { id: 'ai-3', name: 'Playful Skip', description: 'Bouncy, cheerful melodic pattern' },
];

type DrawMode = 'draw' | 'erase';

export default function MelodyStep() {
  const {
    selectedTheme, melodyPoints, setMelodyPoints,
    selectedMelodyOption, setSelectedMelodyOption, nextStep, bpm
  } = useComposition();
  const { playNote, playMelodySequence } = useAudioEngine();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });
  const pointsRef = useRef<MelodyPoint[]>(melodyPoints);
  const lastNoteRef = useRef<string>('');
  const undoStackRef = useRef<MelodyPoint[][]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>('draw');
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);

  const scaleNotes = selectedTheme ? getScaleNotes(selectedTheme) : [];
  const themeColor = selectedTheme?.color || '#00E5FF';

  // Sync points ref with state
  useEffect(() => {
    pointsRef.current = melodyPoints;
  }, [melodyPoints]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: Math.min(rect.height, 450) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Find the nearest node to a point (for deletion)
  const findNearestNode = useCallback((px: number, py: number): number | null => {
    const pts = pointsRef.current;
    const { width, height } = canvasSize;
    let closestIdx: number | null = null;
    let closestDist = Infinity;
    const threshold = 15; // pixels

    for (let i = 0; i < pts.length; i++) {
      const nx = pts[i].x * width;
      const ny = pts[i].y * height;
      const dist = Math.sqrt((px - nx) ** 2 + (py - ny) ** 2);
      if (dist < threshold && dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    return closestIdx;
  }, [canvasSize]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    const rows = scaleNotes.length || 12;
    ctx.strokeStyle = 'oklch(0.25 0.02 280 / 25%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= rows; i++) {
      const y = (i / rows) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * width;
      if (i % 4 === 0) {
        ctx.strokeStyle = 'oklch(0.3 0.02 280 / 40%)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'oklch(0.25 0.02 280 / 25%)';
        ctx.lineWidth = 0.5;
      }
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Beat numbers at top
    ctx.font = '10px "DM Sans"';
    ctx.fillStyle = 'oklch(0.35 0.02 280)';
    for (let i = 0; i < 4; i++) {
      const x = (i / 4) * width + 4;
      ctx.fillText(`Bar ${i + 1}`, x, 12);
    }

    // Note labels on left
    ctx.fillStyle = 'oklch(0.45 0.02 280)';
    scaleNotes.forEach((note, i) => {
      const y = height - ((i + 0.5) / rows) * height;
      ctx.fillText(note, 6, y + 3);
    });

    // Draw melody points and connecting lines
    const pts = pointsRef.current;
    if (pts.length > 0) {
      if (pts.length > 1) {
        // Outer glow line
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `${themeColor}30`;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x * width, pts[0].y * height);
        for (let i = 1; i < pts.length; i++) {
          const dx = Math.abs(pts[i].x - pts[i - 1].x);
          if (dx < 0.08) {
            ctx.lineTo(pts[i].x * width, pts[i].y * height);
          } else {
            ctx.moveTo(pts[i].x * width, pts[i].y * height);
          }
        }
        ctx.stroke();

        // Main line
        ctx.shadowBlur = 10;
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * width, pts[0].y * height);
        for (let i = 1; i < pts.length; i++) {
          const dx = Math.abs(pts[i].x - pts[i - 1].x);
          if (dx < 0.08) {
            ctx.lineTo(pts[i].x * width, pts[i].y * height);
          } else {
            ctx.moveTo(pts[i].x * width, pts[i].y * height);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw dots at each point
      pts.forEach((pt, idx) => {
        const isHovered = hoveredNodeIndex === idx && drawMode === 'erase';

        // Outer glow
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, isHovered ? 10 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#FF006E40' : `${themeColor}30`;
        ctx.shadowColor = isHovered ? '#FF006E' : themeColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Main dot
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#FF006E' : themeColor;
        ctx.fill();

        // Inner white highlight (not on hovered erase)
        if (!isHovered) {
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        // X mark on hovered erase node
        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          const cx = pt.x * width;
          const cy = pt.y * height;
          ctx.beginPath();
          ctx.moveTo(cx - 3, cy - 3);
          ctx.lineTo(cx + 3, cy + 3);
          ctx.moveTo(cx + 3, cy - 3);
          ctx.lineTo(cx - 3, cy + 3);
          ctx.stroke();
        }
      });
    }
  }, [canvasSize, scaleNotes, themeColor, hoveredNodeIndex, drawMode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, melodyPoints]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number; px: number; py: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, px: 0, py: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    return {
      x: Math.max(0, Math.min(1, px / rect.width)),
      y: Math.max(0, Math.min(1, py / rect.height)),
      px,
      py,
    };
  };

  const quantizeToScale = (y: number): { note: string; quantizedY: number } => {
    const noteIndex = Math.round((1 - y) * (scaleNotes.length - 1));
    const clampedIndex = Math.max(0, Math.min(scaleNotes.length - 1, noteIndex));
    return {
      note: scaleNotes[clampedIndex],
      quantizedY: 1 - clampedIndex / (scaleNotes.length - 1),
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (drawMode === 'erase' && !isDrawing) {
      const { px, py } = getCanvasPoint(e);
      const nearIdx = findNearestNode(px, py);
      setHoveredNodeIndex(nearIdx);
    }

    if (isDrawing && drawMode === 'draw') {
      handleMove(e);
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    if (drawMode === 'erase') {
      // In erase mode, click to delete the nearest node
      const { px, py } = getCanvasPoint(e);
      const nearIdx = findNearestNode(px, py);
      if (nearIdx !== null) {
        undoStackRef.current.push([...pointsRef.current]);
        const updated = pointsRef.current.filter((_, i) => i !== nearIdx);
        pointsRef.current = updated;
        setMelodyPoints(updated);
        setHoveredNodeIndex(null);
      }
      return;
    }

    // Draw mode
    setIsDrawing(true);
    setSelectedMelodyOption('draw');

    // Save current state for undo
    undoStackRef.current.push([...pointsRef.current]);

    const pt = getCanvasPoint(e);
    const { note, quantizedY } = quantizeToScale(pt.y);
    const newPoint: MelodyPoint = { x: pt.x, y: quantizedY, note, time: pt.x };

    // ADD to existing points — allows multiple strokes
    const updatedPoints = [...pointsRef.current, newPoint];
    pointsRef.current = updatedPoints;
    setMelodyPoints(updatedPoints);
    playNote(note);
    lastNoteRef.current = note;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || drawMode !== 'draw') return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    const { note, quantizedY } = quantizeToScale(pt.y);

    // Minimum distance threshold for smooth drawing
    const lastPt = pointsRef.current[pointsRef.current.length - 1];
    if (lastPt) {
      const dx = Math.abs(pt.x - lastPt.x);
      const dy = Math.abs(quantizedY - lastPt.y);
      if (dx < 0.008 && dy < 0.01) return;
    }

    const newPoint: MelodyPoint = { x: pt.x, y: quantizedY, note, time: pt.x };
    const updatedPoints = [...pointsRef.current, newPoint];
    pointsRef.current = updatedPoints;
    setMelodyPoints(updatedPoints);

    // Play note if it changed
    if (note !== lastNoteRef.current) {
      playNote(note);
      lastNoteRef.current = note;
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    undoStackRef.current.push([...pointsRef.current]);
    pointsRef.current = [];
    setMelodyPoints([]);
  };

  const undoLastStroke = () => {
    const prev = undoStackRef.current.pop();
    if (prev !== undefined) {
      pointsRef.current = prev;
      setMelodyPoints(prev);
    }
  };

  const generateAIMelody = (type: 'ai-1' | 'ai-2' | 'ai-3') => {
    setSelectedMelodyOption(type);
    undoStackRef.current.push([...pointsRef.current]);
    const points: MelodyPoint[] = [];
    const numPoints = 16;
    for (let i = 0; i < numPoints; i++) {
      const x = i / (numPoints - 1);
      let y: number;
      if (type === 'ai-1') {
        y = 0.7 - (i / numPoints) * 0.5 + Math.sin(i * 0.8) * 0.1;
      } else if (type === 'ai-2') {
        y = 0.5 + Math.sin(i * 0.5) * 0.3;
      } else {
        y = 0.5 + Math.sin(i * 1.2) * 0.2 + (i % 2 === 0 ? -0.1 : 0.1);
      }
      y = Math.max(0.05, Math.min(0.95, y));
      const { note, quantizedY } = quantizeToScale(y);
      points.push({ x, y: quantizedY, note, time: x });
    }
    pointsRef.current = points;
    setMelodyPoints(points);
    playMelodySequence(points, bpm);
  };

  const hasMelody = melodyPoints.length > 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-6 pb-24 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Sketch your <span style={{ color: themeColor }}>melody</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              <strong>Click</strong> to place notes, <strong>drag</strong> to draw lines.
              Switch to <strong>Erase</strong> mode to click on a note to remove it.
            </p>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {/* Draw/Erase mode toggle */}
          <div className="flex items-center gap-1 glass-panel rounded-full p-1">
            <button
              onClick={() => { setDrawMode('draw'); setHoveredNodeIndex(null); }}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${
                drawMode === 'draw' ? 'text-background font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={drawMode === 'draw' ? { background: themeColor } : {}}
            >
              <MousePointer className="w-3 h-3" />
              Draw
            </button>
            <button
              onClick={() => setDrawMode('erase')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${
                drawMode === 'erase' ? 'text-background font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={drawMode === 'erase' ? { background: '#FF006E' } : {}}
            >
              <Eraser className="w-3 h-3" />
              Erase
            </button>
          </div>

          <div className="w-px h-5 bg-border/30 mx-1" />

          {/* AI Melodies */}
          {AI_MELODIES.map((m) => (
            <Button
              key={m.id}
              variant={selectedMelodyOption === m.id ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full text-xs ${
                selectedMelodyOption === m.id ? 'border-0' : 'border-border/50 hover:bg-white/5'
              }`}
              style={selectedMelodyOption === m.id ? { background: themeColor, color: '#0a0a1a' } : {}}
              onClick={() => generateAIMelody(m.id as 'ai-1' | 'ai-2' | 'ai-3')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {m.name}
            </Button>
          ))}

          <div className="w-px h-5 bg-border/30 mx-1" />

          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs border-border/50 hover:bg-white/5"
            onClick={undoLastStroke}
            disabled={undoStackRef.current.length === 0 && melodyPoints.length === 0}
          >
            <Undo2 className="w-3 h-3 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs border-destructive/50 hover:bg-destructive/10 text-destructive"
            onClick={clearCanvas}
            disabled={melodyPoints.length === 0}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 min-h-[300px] max-h-[500px] relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-panel rounded-2xl overflow-hidden h-full relative"
            style={{
              boxShadow: isDrawing ? `0 0 30px ${themeColor}20` : undefined,
              borderColor: isDrawing ? `${themeColor}30` : undefined,
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width * 2}
              height={canvasSize.height * 2}
              style={{
                width: '100%',
                height: '100%',
                cursor: drawMode === 'erase'
                  ? (hoveredNodeIndex !== null ? 'pointer' : 'default')
                  : 'crosshair',
              }}
              className="touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleEnd}
              onMouseLeave={() => { handleEnd(); setHoveredNodeIndex(null); }}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
            {!hasMelody && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${themeColor}15`, border: `1px dashed ${themeColor}40` }}>
                    <Volume2 className="w-6 h-6" style={{ color: `${themeColor}80` }} />
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">Click or drag to create your melody</p>
                  <p className="text-muted-foreground/50 text-xs">Each note plays as you place it</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Melody info */}
        {hasMelody && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground"
          >
            <span>{melodyPoints.length} notes</span>
            <span>·</span>
            <span>{selectedTheme?.key} {selectedTheme?.scale}</span>
            <span>·</span>
            <span>{bpm} BPM</span>
            <span>·</span>
            <button
              onClick={() => playMelodySequence(melodyPoints, bpm)}
              className="inline-flex items-center gap-1 underline hover:text-foreground transition-colors"
              style={{ color: themeColor }}
            >
              <Play className="w-3 h-3" />
              Play melody
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-border/30 py-4">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasMelody ? (
              <span>{melodyPoints.length} notes sketched</span>
            ) : (
              'Click or draw a melody to continue'
            )}
          </div>
          <Button
            onClick={nextStep}
            disabled={!hasMelody}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Choose Rhythm
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/*
 * Step 6: Preview & Share
 * Layered visualization, export options, share
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Share2, RotateCcw, Image, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const LAYER_COLORS = ['#00E5FF', '#FF006E', '#FFB800', '#2DD4BF', '#A78BFA'];

export default function PreviewStep() {
  const { selectedTheme, harmonyLayers, selectedDrumPattern, melodyPoints, resetComposition } = useComposition();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compositionName, setCompositionName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const themeColor = selectedTheme?.color || '#00E5FF';

  const activeLayers = [
    { name: 'Melody', color: themeColor, active: true },
    { name: 'Drums', color: '#FFB800', active: !!selectedDrumPattern },
    ...harmonyLayers.filter(l => l.enabled).map((l, i) => ({
      name: l.name,
      color: LAYER_COLORS[i + 2] || '#A78BFA',
      active: true,
    })),
    { name: 'Bass (AI)', color: '#FF7E7E', active: true },
  ];

  const drawVisualization = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width / 2;
    const h = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);

    // Draw each layer as a waveform
    activeLayers.forEach((layer, li) => {
      if (!layer.active) return;
      const yCenter = (h / (activeLayers.length + 1)) * (li + 1);
      const amplitude = h / (activeLayers.length + 1) * 0.35;

      ctx.beginPath();
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = isPlaying ? 10 : 4;

      for (let x = 0; x < w; x++) {
        const freq = 0.02 + li * 0.008;
        const phase = time * 0.002 + li * 1.5;
        const y = yCenter + Math.sin(x * freq + phase) * amplitude *
          (isPlaying ? (0.5 + Math.sin(time * 0.001 + li) * 0.5) : 0.3);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Layer label
      ctx.font = '11px "DM Sans"';
      ctx.fillStyle = `${layer.color}90`;
      ctx.fillText(layer.name, 8, yCenter - amplitude - 6);
    });

    // Progress bar
    if (isPlaying) {
      const progX = progress * w;
      ctx.beginPath();
      ctx.strokeStyle = `${themeColor}60`;
      ctx.lineWidth = 1;
      ctx.moveTo(progX, 0);
      ctx.lineTo(progX, h);
      ctx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [activeLayers, isPlaying, progress, themeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      if (isPlaying) {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        const duration = 30000; // 30 seconds
        setProgress(Math.min(1, elapsed / duration));
        if (elapsed >= duration) {
          setIsPlaying(false);
          setProgress(0);
          startTimeRef.current = 0;
        }
      }
      drawVisualization(time);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, drawVisualization]);

  const togglePlay = () => {
    if (!isPlaying) {
      startTimeRef.current = 0;
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-6 pb-24 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Your <span style={{ color: themeColor }}>Composition</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Watch each layer come alive. You made this.
            </p>
          </motion.div>
        </div>

        {/* Composition Name */}
        <div className="max-w-md mx-auto w-full mb-4">
          <input
            type="text"
            value={compositionName}
            onChange={(e) => setCompositionName(e.target.value)}
            placeholder="Name your composition..."
            className="w-full bg-transparent border-b border-border/50 text-center font-display text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary pb-2"
          />
        </div>

        {/* Visualization Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 min-h-[250px] max-h-[400px] glass-panel rounded-2xl overflow-hidden relative mb-4"
        >
          {/* Theme background */}
          {selectedTheme && (
            <div className="absolute inset-0 opacity-10">
              <img src={selectedTheme.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-full relative z-10" />

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            {!isPlaying && progress === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-xs text-muted-foreground"
              >
                Press play to hear your composition
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={togglePlay}
            size="lg"
            className="w-14 h-14 rounded-full p-0 border-0"
            style={{
              background: themeColor,
              boxShadow: `0 0 30px ${themeColor}40`,
            }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-background" />
            ) : (
              <Play className="w-6 h-6 text-background ml-0.5" />
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto w-full mb-6">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: themeColor, width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {Math.floor(progress * 30)}:{String(Math.floor((progress * 30 * 60) % 60)).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">0:30</span>
          </div>
        </div>

        {/* Layer Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {activeLayers.filter(l => l.active).map((layer) => (
            <div key={layer.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: layer.color }} />
              <span className="text-xs text-muted-foreground">{layer.name}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            className="rounded-full border-border/50 hover:bg-white/5"
            onClick={() => toast.info('Export feature requires MusicGen API integration. Connect your Replicate API key to enable full audio export.')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export MP3
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-border/50 hover:bg-white/5"
            onClick={() => toast.info('Share feature coming soon! Your composition will be shareable to IG Stories and Reels.')}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-border/50 hover:bg-white/5"
            onClick={() => toast.info('AI cover art generation requires API integration. Connect your API key to generate custom cover art.')}
          >
            <Image className="w-4 h-4 mr-2" />
            Cover Art
          </Button>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-border/30 py-4">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">Theme: <strong className="text-foreground">{selectedTheme?.emoji} {selectedTheme?.name}</strong> · </span>
            <span>{activeLayers.filter(l => l.active).length} layers</span>
          </div>
          <Button
            onClick={() => {
              resetComposition();
              window.location.href = '/compose';
            }}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Composition
          </Button>
        </div>
      </div>
    </div>
  );
}

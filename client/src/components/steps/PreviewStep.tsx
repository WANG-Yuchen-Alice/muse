/*
 * Step 6: Preview & Share
 * REAL audio playback of the full composition via Tone.js
 * Layered waveform visualization synced to playback
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Share2, RotateCcw, Image, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const LAYER_COLORS = ['#00E5FF', '#FF006E', '#FFB800', '#2DD4BF', '#A78BFA', '#FF7E7E'];

export default function PreviewStep() {
  const {
    selectedTheme, harmonyLayers, selectedDrumPattern,
    melodyPoints, bpm, resetComposition,
  } = useComposition();
  const {
    playFullComposition, stopAll, isPlaying: audioIsPlaying,
  } = useAudioEngine();

  const [progress, setProgress] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [compositionName, setCompositionName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);
  const isPlayingRef = useRef(false);
  const themeColor = selectedTheme?.color || '#00E5FF';

  // Derive scale key for chord progressions
  const scaleKey = selectedTheme ? `${selectedTheme.key}-${selectedTheme.scale}` : 'D-major';

  const activeLayers = [
    { name: 'Melody', color: themeColor, active: true },
    { name: 'Drums', color: '#FFB800', active: !!selectedDrumPattern },
    ...harmonyLayers.filter(l => l.enabled).map((l, i) => ({
      name: l.name,
      color: LAYER_COLORS[(i + 2) % LAYER_COLORS.length],
      active: true,
    })),
    { name: 'Bass (AI)', color: '#FF7E7E', active: true },
  ];

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = audioIsPlaying;
  }, [audioIsPlaying]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Canvas visualization
  const drawVisualization = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width / 2;
    const h = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2, 2);

    const playing = isPlayingRef.current;
    const prog = progressRef.current;

    // Draw each layer as a waveform
    const visibleLayers = activeLayers.filter(l => l.active);
    visibleLayers.forEach((layer, li) => {
      const yCenter = (h / (visibleLayers.length + 1)) * (li + 1);
      const amplitude = h / (visibleLayers.length + 1) * 0.35;

      ctx.beginPath();
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = playing ? 2.5 : 1.5;
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = playing ? 12 : 4;

      for (let x = 0; x < w; x++) {
        const freq = 0.015 + li * 0.007;
        const phase = time * (playing ? 0.003 : 0.0005) + li * 1.5;
        const intensityMult = playing
          ? (0.4 + Math.sin(time * 0.0015 + li * 0.7) * 0.6)
          : 0.2;
        const y = yCenter + Math.sin(x * freq + phase) * amplitude * intensityMult;

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

    // Progress playhead
    if (playing || prog > 0) {
      const progX = prog * w;
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff80';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(progX, 0);
      ctx.lineTo(progX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Playhead dot
      ctx.beginPath();
      ctx.arc(progX, 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = themeColor;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [activeLayers, themeColor]);

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      drawVisualization(time);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawVisualization]);

  const togglePlay = async () => {
    if (audioIsPlaying) {
      stopAll();
      setProgress(0);
    } else {
      setHasPlayed(true);
      setProgress(0);
      await playFullComposition(
        melodyPoints,
        selectedDrumPattern,
        harmonyLayers,
        bpm,
        scaleKey,
        (prog) => setProgress(prog),
        () => setProgress(0),
      );
    }
  };

  // Format time display
  const totalDurationSec = (16 / bpm) * 60; // 4 bars at current BPM
  const currentSec = progress * totalDurationSec;
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
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
              Press play to hear your creation — melody, drums, harmony, and bass all together.
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
          {selectedTheme && (
            <div className="absolute inset-0 opacity-10">
              <img src={selectedTheme.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-full relative z-10" />

          {!hasPlayed && !audioIsPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `${themeColor}20`, border: `2px solid ${themeColor}40` }}
                >
                  <Volume2 className="w-6 h-6" style={{ color: `${themeColor}80` }} />
                </div>
                <span className="text-xs text-muted-foreground">Press play to hear your composition</span>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            onClick={togglePlay}
            size="lg"
            className="w-14 h-14 rounded-full p-0 border-0 transition-transform hover:scale-105"
            style={{
              background: themeColor,
              boxShadow: audioIsPlaying ? `0 0 30px ${themeColor}60` : `0 0 20px ${themeColor}30`,
            }}
          >
            {audioIsPlaying ? (
              <Pause className="w-6 h-6 text-background" />
            ) : (
              <Play className="w-6 h-6 text-background ml-0.5" />
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto w-full mb-6">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-all"
              style={{ background: themeColor, width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTime(currentSec)}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTime(totalDurationSec)}
            </span>
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
            onClick={() => toast.info('Share feature coming soon!')}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-border/50 hover:bg-white/5"
            onClick={() => toast.info('AI cover art generation coming soon!')}
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
            <span>{activeLayers.filter(l => l.active).length} layers · {bpm} BPM</span>
          </div>
          <Button
            onClick={() => {
              stopAll();
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

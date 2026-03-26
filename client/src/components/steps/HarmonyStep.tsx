/*
 * Step 4: Add Harmony
 * Toggle instruments on/off with SOUND PREVIEW when toggling
 * Volume slider plays sound continuously as you drag
 * Clear labels explaining what each control does
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { getScaleNotes } from '@/lib/themes';
import { motion } from 'framer-motion';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useRef, useCallback } from 'react';

const LAYER_COLORS: Record<string, string> = {
  strings: '#00E5FF',
  piano: '#FFB800',
  synth: '#A78BFA',
  guitar: '#2DD4BF',
};

const LAYER_DESCRIPTIONS: Record<string, string> = {
  strings: 'Warm, sustained chords that fill the background',
  piano: 'Bright chord hits that add rhythm and clarity',
  synth: 'Ambient pad that creates atmosphere and depth',
  guitar: 'Plucked chords that add texture and groove',
};

export default function HarmonyStep() {
  const { selectedTheme, harmonyLayers, toggleHarmonyLayer, setHarmonyVolume, nextStep } = useComposition();
  const { previewInstrument, startContinuousPreview, setHarmonyVolume: setEngineVolume } = useAudioEngine();
  const themeColor = selectedTheme?.color || '#00E5FF';
  const hasAnyEnabled = harmonyLayers.some(l => l.enabled);

  // Debounce timer for slider preview
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPreviewTimeRef = useRef<Record<string, number>>({});

  // Get chord notes from the selected theme's key
  const scaleNotes = selectedTheme ? getScaleNotes(selectedTheme) : [];
  const chordNotes = scaleNotes.length >= 5
    ? [scaleNotes[0], scaleNotes[2], scaleNotes[4]]
    : ['C4', 'E4', 'G4'];

  const handleToggle = (layerId: string) => {
    const layer = harmonyLayers.find(l => l.id === layerId);
    // If turning ON, play a preview
    if (layer && !layer.enabled) {
      previewInstrument(layerId, chordNotes);
    }
    toggleHarmonyLayer(layerId);
  };

  const handleVolumeChange = useCallback((layerId: string, volume: number) => {
    setHarmonyVolume(layerId, volume);
    // Update engine volume in real-time
    setEngineVolume(layerId, volume);

    // Throttled preview: play a chord every 400ms while dragging
    const now = Date.now();
    const lastTime = lastPreviewTimeRef.current[layerId] || 0;
    if (now - lastTime > 400) {
      lastPreviewTimeRef.current[layerId] = now;
      startContinuousPreview(layerId, volume, chordNotes);
    }
  }, [setHarmonyVolume, setEngineVolume, startContinuousPreview, chordNotes]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-8 pb-24 flex-1">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Add <span style={{ color: themeColor }}>harmony</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Toggle instruments on and adjust volume — drag the slider to hear the sound change in real-time.
            </p>
          </motion.div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {harmonyLayers.map((layer, i) => {
            const color = LAYER_COLORS[layer.id] || themeColor;
            const desc = LAYER_DESCRIPTIONS[layer.id] || '';
            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-panel rounded-2xl p-5 transition-all duration-300"
                style={{ outline: layer.enabled ? `1px solid ${color}60` : 'none', outlineOffset: '-1px' }}
              >
                <div className="flex items-center gap-4">
                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(layer.id)}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 shrink-0"
                    style={{
                      background: layer.enabled ? `${color}20` : 'oklch(0.18 0.015 280)',
                      border: `2px solid ${layer.enabled ? color : 'oklch(0.3 0.015 280)'}`,
                      boxShadow: layer.enabled ? `0 0 20px ${color}30` : 'none',
                    }}
                  >
                    {layer.icon}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-foreground text-sm">{layer.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: layer.enabled ? `${color}20` : 'oklch(0.2 0.015 280)',
                            color: layer.enabled ? color : 'oklch(0.5 0.015 280)',
                          }}
                        >
                          {layer.enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    {/* Volume Slider — plays sound while dragging */}
                    {layer.enabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <div className="flex items-center gap-3">
                          <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <Slider
                            value={[layer.volume]}
                            onValueChange={([v]) => handleVolumeChange(layer.id, v)}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <Volume2 className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                          <span className="text-[11px] font-mono w-8 text-right" style={{ color }}>{layer.volume}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 text-center">
                          Drag to adjust volume — you'll hear the sound change
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Waveform visualization when enabled */}
                {layer.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 flex items-end gap-0.5 h-8"
                  >
                    {Array.from({ length: 32 }).map((_, bi) => (
                      <motion.div
                        key={bi}
                        className="flex-1 rounded-full"
                        style={{ background: color, opacity: layer.volume / 100 }}
                        animate={{
                          height: `${(20 + Math.sin(bi * 0.5 + i * 2) * 60) * (layer.volume / 100)}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          delay: bi * 0.03,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-border/30 py-4">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasAnyEnabled ? (
              <span>{harmonyLayers.filter(l => l.enabled).length} instruments active</span>
            ) : (
              'Enable at least one instrument to continue'
            )}
          </div>
          <Button
            onClick={nextStep}
            disabled={!hasAnyEnabled}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Complete the Mix
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

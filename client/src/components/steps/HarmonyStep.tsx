/*
 * Step 4: Add Harmony
 * Toggle instruments on/off with SOUND PREVIEW when toggling
 * Volume slider with clear label explaining what it controls
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { getScaleNotes } from '@/lib/themes';
import { motion } from 'framer-motion';
import { ArrowRight, Volume2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

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
  const { previewInstrument } = useAudioEngine();
  const themeColor = selectedTheme?.color || '#00E5FF';
  const hasAnyEnabled = harmonyLayers.some(l => l.enabled);

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

  const handlePreview = (layerId: string) => {
    previewInstrument(layerId, chordNotes);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-8 pb-24 flex-1">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Add <span style={{ color: themeColor }}>harmony</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Toggle instruments on and off — you'll hear a preview of each sound.
              Adjust the volume slider to control how loud each layer is in the final mix.
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
                className={`glass-panel rounded-2xl p-5 transition-all duration-300`}
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
                          {layer.enabled && (
                            <button
                              onClick={() => handlePreview(layer.id)}
                              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors hover:opacity-80"
                              style={{ background: `${color}20`, color }}
                            >
                              <Play className="w-2.5 h-2.5" />
                              Preview
                            </button>
                          )}
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

                    {/* Volume Slider with label */}
                    {layer.enabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Volume2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume</span>
                          <span className="text-[10px] font-mono ml-auto" style={{ color }}>{layer.volume}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground/60">Quiet</span>
                          <Slider
                            value={[layer.volume]}
                            onValueChange={([v]) => setHarmonyVolume(layer.id, v)}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-muted-foreground/60">Loud</span>
                        </div>
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
                        style={{ background: color }}
                        animate={{
                          height: `${20 + Math.sin(bi * 0.5 + i * 2) * 60 + Math.random() * 20}%`,
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

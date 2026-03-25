/*
 * Step 4: Add Harmony
 * Toggle instruments on/off, adjust volume with sliders
 */
import { useComposition } from '@/contexts/CompositionContext';
import { motion } from 'framer-motion';
import { ArrowRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const LAYER_COLORS: Record<string, string> = {
  strings: '#00E5FF',
  piano: '#FFB800',
  synth: '#A78BFA',
  guitar: '#2DD4BF',
};

export default function HarmonyStep() {
  const { selectedTheme, harmonyLayers, toggleHarmonyLayer, setHarmonyVolume, nextStep } = useComposition();
  const themeColor = selectedTheme?.color || '#00E5FF';
  const hasAnyEnabled = harmonyLayers.some(l => l.enabled);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-8 pb-24 flex-1">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Add <span style={{ color: themeColor }}>harmony</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Toggle instruments on and off. AI ensures everything harmonizes perfectly.
            </p>
          </motion.div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {harmonyLayers.map((layer, i) => {
            const color = LAYER_COLORS[layer.id] || themeColor;
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
                    onClick={() => toggleHarmonyLayer(layer.id)}
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
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-sm">{layer.name}</h3>
                        <p className="text-xs text-muted-foreground">{layer.instrument}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">{layer.volume}%</span>
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <Slider
                      value={[layer.volume]}
                      onValueChange={([v]) => setHarmonyVolume(layer.id, v)}
                      min={0}
                      max={100}
                      step={5}
                      disabled={!layer.enabled}
                      className={`${!layer.enabled ? 'opacity-30' : ''}`}
                    />
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

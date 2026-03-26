/*
 * Step 3: Choose the Rhythm
 * AI recommends 3 drum patterns + a "No Drums" option
 * Visual beat grid, plays preview when selected
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { DRUM_PATTERNS } from '@/lib/themes';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Play, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

const DRUM_LABELS = ['Kick', 'Snare', 'Hi-hat'];
const DRUM_COLORS = ['#00E5FF', '#FF006E', '#FFB800'];

// Special "no drums" sentinel
const NO_DRUMS_PATTERN = {
  id: 'no-drums',
  name: 'No Drums',
  description: 'Skip drums entirely — let melody and harmony shine',
  density: 0,
  pattern: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export default function RhythmStep() {
  const { selectedTheme, selectedDrumPattern, selectDrumPattern, nextStep } = useComposition();
  const { previewDrum } = useAudioEngine();
  const themeColor = selectedTheme?.color || '#00E5FF';

  const allPatterns = [NO_DRUMS_PATTERN, ...DRUM_PATTERNS];

  const handleSelectPattern = useCallback((pattern: typeof DRUM_PATTERNS[0]) => {
    selectDrumPattern(pattern);
    // Play a quick preview of the pattern (skip for no-drums)
    if (pattern.id === 'no-drums') return;
    const delays = [0, 150, 300, 450];
    for (let step = 0; step < 4; step++) {
      setTimeout(() => {
        if (pattern.pattern[0]?.[step]) previewDrum('kick');
        if (pattern.pattern[1]?.[step]) previewDrum('snare');
        if (pattern.pattern[2]?.[step]) previewDrum('hihat');
      }, delays[step]);
    }
  }, [selectDrumPattern, previewDrum]);

  const handlePreviewFull = useCallback((pattern: typeof DRUM_PATTERNS[0]) => {
    if (pattern.id === 'no-drums') return;
    for (let step = 0; step < 8; step++) {
      const delay = step * 150;
      setTimeout(() => {
        if (pattern.pattern[0]?.[step]) previewDrum('kick');
        if (pattern.pattern[1]?.[step]) previewDrum('snare');
        if (pattern.pattern[2]?.[step]) previewDrum('hihat');
      }, delay);
    }
  }, [previewDrum]);

  const isNoDrums = selectedDrumPattern?.id === 'no-drums';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-8 pb-24 flex-1">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Choose the <span style={{ color: themeColor }}>rhythm</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Select a drum pattern to hear a preview, or go without drums for a cleaner sound.
            </p>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {allPatterns.map((pattern, pi) => {
            const isSelected = selectedDrumPattern?.id === pattern.id;
            const isNoDrumsOption = pattern.id === 'no-drums';

            return (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.08, duration: 0.5 }}
                onClick={() => handleSelectPattern(pattern)}
                className={`w-full text-left glass-panel rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
                  isSelected ? '' : 'hover:border-white/15'
                }`}
                style={{ outline: isSelected ? `2px solid ${isNoDrumsOption ? '#A78BFA' : themeColor}` : 'none', outlineOffset: '-2px' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {isNoDrumsOption && <VolumeX className="w-4 h-4 text-muted-foreground" />}
                      <h3 className="font-display font-semibold text-foreground">{pattern.name}</h3>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: isNoDrumsOption ? '#A78BFA' : themeColor }}
                        >
                          <Check className="w-3 h-3 text-background" />
                        </motion.div>
                      )}
                      {isSelected && !isNoDrumsOption && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewFull(pattern);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors hover:opacity-80"
                          style={{ background: `${themeColor}20`, color: themeColor }}
                        >
                          <Play className="w-2.5 h-2.5" />
                          Preview
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                  </div>
                  {!isNoDrumsOption && (
                    <span
                      className="text-xs font-mono px-2 py-1 rounded-full"
                      style={{ background: `${themeColor}20`, color: themeColor }}
                    >
                      {pattern.density}% density
                    </span>
                  )}
                </div>

                {/* Beat Grid Visualization (not for no-drums) */}
                {!isNoDrumsOption && (
                  <div className="space-y-1.5">
                    {pattern.pattern.map((row, ri) => (
                      <div key={ri} className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground w-10 text-right font-mono">
                          {DRUM_LABELS[ri]}
                        </span>
                        <div className="flex gap-0.5 flex-1">
                          {row.map((beat, bi) => (
                            <div
                              key={bi}
                              className="flex-1 h-6 rounded-sm transition-all duration-200"
                              style={{
                                background: beat
                                  ? isSelected
                                    ? DRUM_COLORS[ri]
                                    : `${DRUM_COLORS[ri]}60`
                                  : 'oklch(0.18 0.015 280)',
                                opacity: beat ? (isSelected ? 1 : 0.6) : 0.4,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No drums visual */}
                {isNoDrumsOption && (
                  <div className="flex items-center justify-center py-3 text-muted-foreground/50">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-8 h-0.5 bg-muted-foreground/20 rounded-full" />
                      <span>Pure melody & harmony</span>
                      <div className="w-8 h-0.5 bg-muted-foreground/20 rounded-full" />
                    </div>
                  </div>
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
            {selectedDrumPattern ? (
              <span>
                {isNoDrums ? 'No drums selected' : (
                  <>Pattern: <strong className="text-foreground">{selectedDrumPattern.name}</strong></>
                )}
              </span>
            ) : (
              'Choose a rhythm option to continue'
            )}
          </div>
          <Button
            onClick={nextStep}
            disabled={!selectedDrumPattern}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Add Harmony
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

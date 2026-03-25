/*
 * Step 1: Choose a Theme
 * Cards with theme images, auto-sets BPM/key/scale
 */
import { useComposition } from '@/contexts/CompositionContext';
import { THEMES } from '@/lib/themes';
import { motion } from 'framer-motion';
import { Check, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeStep() {
  const { selectedTheme, selectTheme, nextStep } = useComposition();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-8 pb-24 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              What's the <span className="gradient-cosmic-text">mood</span>?
            </h1>
            <p className="text-muted-foreground">
              Pick a theme — it sets your musical palette. No music theory needed.
            </p>
          </motion.div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {THEMES.map((theme, i) => {
            const isSelected = selectedTheme?.id === theme.id;
            return (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                onClick={() => selectTheme(theme)}
                className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                  isSelected
                    ? 'scale-[1.02]'
                    : 'hover:scale-[1.01]'
                }`}
                style={{
                  outline: isSelected ? `2px solid ${theme.color}` : 'none',
                  outlineOffset: '-2px',
                }}
              >
                {/* Background Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={theme.image}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: theme.color }}
                    >
                      <Check className="w-5 h-5 text-background" />
                    </motion.div>
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{theme.emoji}</span>
                      <h3 className="font-display text-lg font-bold text-white">{theme.name}</h3>
                    </div>
                    <p className="text-xs text-white/60 mb-2">{theme.nameZh}</p>
                    <p className="text-xs text-white/80 leading-relaxed">{theme.description}</p>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.color}30`, color: theme.color }}
                      >
                        {theme.bpmRange[0]}-{theme.bpmRange[1]} BPM
                      </span>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.color}30`, color: theme.color }}
                      >
                        {theme.key} {theme.scale}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-border/30 py-4">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTheme ? (
              <span>
                Selected: <strong className="text-foreground">{selectedTheme.emoji} {selectedTheme.name}</strong>
              </span>
            ) : (
              'Choose a theme to continue'
            )}
          </div>
          <Button
            onClick={nextStep}
            disabled={!selectedTheme}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Music className="w-4 h-4 mr-2" />
            Sketch Melody
          </Button>
        </div>
      </div>
    </div>
  );
}

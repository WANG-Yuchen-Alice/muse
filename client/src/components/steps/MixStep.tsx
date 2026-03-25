/*
 * Step 5: AI Completes the Mix
 * One-tap AI generation with animated progress
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ArrowRight, Loader2, Check, Music, Drum, Guitar, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIX_STAGES = [
  { icon: Waves, label: 'Generating bass line...', color: '#00E5FF', duration: 1500 },
  { icon: Music, label: 'Adding transitions...', color: '#FF006E', duration: 1200 },
  { icon: Drum, label: 'Balancing levels...', color: '#FFB800', duration: 1000 },
  { icon: Guitar, label: 'Applying effects...', color: '#2DD4BF', duration: 800 },
  { icon: Wand2, label: 'Polishing final mix...', color: '#A78BFA', duration: 1000 },
];

export default function MixStep() {
  const { selectedTheme, isMixComplete, setIsMixComplete, nextStep } = useComposition();
  const [isMixing, setIsMixing] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const themeColor = selectedTheme?.color || '#00E5FF';

  const startMix = async () => {
    setIsMixing(true);
    setCurrentStage(0);

    for (let i = 0; i < MIX_STAGES.length; i++) {
      setCurrentStage(i);
      await new Promise(resolve => setTimeout(resolve, MIX_STAGES[i].duration));
    }

    setIsMixing(false);
    setIsMixComplete(true);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
      <div className="container py-8 pb-24 flex-1 flex flex-col items-center justify-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
            AI Completes the <span style={{ color: themeColor }}>Mix</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            You built 80% of the creative decisions. AI handles the technical 20%.
          </p>
        </motion.div>

        {/* Mix Button / Progress */}
        <div className="w-full max-w-md">
          {!isMixing && !isMixComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <button
                onClick={startMix}
                className="group relative w-40 h-40 rounded-full mx-auto flex items-center justify-center transition-all duration-500 hover:scale-105"
                style={{
                  background: `radial-gradient(circle, ${themeColor}30 0%, transparent 70%)`,
                  border: `2px solid ${themeColor}50`,
                  boxShadow: `0 0 40px ${themeColor}20, 0 0 80px ${themeColor}10`,
                }}
              >
                <Wand2 className="w-12 h-12 transition-transform duration-500 group-hover:rotate-12" style={{ color: themeColor }} />
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ border: `2px solid ${themeColor}` }} />
              </button>
              <p className="mt-6 text-sm text-muted-foreground">Tap to complete your composition</p>
            </motion.div>
          )}

          {isMixing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {MIX_STAGES.map((stage, i) => {
                const isActive = i === currentStage;
                const isDone = i < currentStage;
                const Icon = stage.icon;

                return (
                  <motion.div
                    key={stage.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`glass-panel rounded-xl p-4 flex items-center gap-3 transition-all duration-300`}
                    style={{ outline: isActive ? `1px solid ${stage.color}` : 'none', outlineOffset: '-1px' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isDone || isActive ? `${stage.color}20` : 'oklch(0.18 0.015 280)',
                      }}
                    >
                      {isDone ? (
                        <Check className="w-5 h-5" style={{ color: stage.color }} />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: stage.color }} />
                      ) : (
                        <Icon className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isDone || isActive ? stage.color : 'oklch(0.4 0.015 280)',
                      }}
                    >
                      {isDone ? stage.label.replace('...', ' ✓') : stage.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {isMixComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div
                className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-6"
                style={{
                  background: `radial-gradient(circle, ${themeColor}30 0%, transparent 70%)`,
                  border: `2px solid ${themeColor}`,
                  boxShadow: `0 0 40px ${themeColor}30`,
                }}
              >
                <Check className="w-12 h-12" style={{ color: themeColor }} />
              </div>
              <h2 className="font-display text-xl font-bold mb-2 text-foreground">Mix Complete!</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Your composition is ready. Preview it with layered visualization.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-border/30 py-4 w-full">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isMixComplete ? 'Your composition is ready!' : isMixing ? 'AI is working its magic...' : 'Ready to complete the mix'}
          </div>
          <Button
            onClick={nextStep}
            disabled={!isMixComplete}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Preview & Share
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

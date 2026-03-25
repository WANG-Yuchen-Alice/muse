/*
 * Muse Compose Page — Full composition flow
 * "Liquid Cosmos" design: dark void, glowing accents, frosted glass panels
 */
import { useComposition } from '@/contexts/CompositionContext';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepIndicator from '@/components/StepIndicator';
import ThemeStep from '@/components/steps/ThemeStep';
import MelodyStep from '@/components/steps/MelodyStep';
import RhythmStep from '@/components/steps/RhythmStep';
import HarmonyStep from '@/components/steps/HarmonyStep';
import MixStep from '@/components/steps/MixStep';
import PreviewStep from '@/components/steps/PreviewStep';

const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp';

const stepComponents = {
  theme: ThemeStep,
  melody: MelodyStep,
  rhythm: RhythmStep,
  harmony: HarmonyStep,
  mix: MixStep,
  preview: PreviewStep,
};

const pageVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export default function Compose() {
  const { currentStep, prevStep, stepIndex, resetComposition } = useComposition();
  const [, navigate] = useLocation();
  const StepComponent = stepComponents[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="glass-panel sticky top-0 z-50 border-b border-border/30">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (stepIndex > 0) {
                  prevStep();
                } else {
                  resetComposition();
                  navigate('/');
                }
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={LOGO} alt="Muse" className="w-6 h-6" />
              <span className="font-display text-sm font-semibold text-foreground hidden sm:inline">Muse</span>
            </div>
          </div>

          <StepIndicator />

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => {
              resetComposition();
              navigate('/');
            }}
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Step Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

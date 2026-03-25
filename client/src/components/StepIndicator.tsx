import { useComposition, type CompositionStep } from '@/contexts/CompositionContext';
import { motion } from 'framer-motion';
import { Palette, PenTool, Drum, Guitar, Wand2, Share2 } from 'lucide-react';

const STEP_CONFIG: { id: CompositionStep; icon: React.ElementType; label: string; color: string }[] = [
  { id: 'theme', icon: Palette, label: 'Theme', color: '#00E5FF' },
  { id: 'melody', icon: PenTool, label: 'Melody', color: '#FF006E' },
  { id: 'rhythm', icon: Drum, label: 'Rhythm', color: '#FFB800' },
  { id: 'harmony', icon: Guitar, label: 'Harmony', color: '#2DD4BF' },
  { id: 'mix', icon: Wand2, label: 'Mix', color: '#A78BFA' },
  { id: 'preview', icon: Share2, label: 'Preview', color: '#FF7E7E' },
];

export default function StepIndicator() {
  const { stepIndex } = useComposition();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {STEP_CONFIG.map((step, i) => {
        const isActive = i === stepIndex;
        const isComplete = i < stepIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative flex items-center justify-center">
              <motion.div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isActive
                    ? `${step.color}25`
                    : isComplete
                    ? `${step.color}15`
                    : 'oklch(0.2 0.015 280)',
                  border: isActive
                    ? `2px solid ${step.color}`
                    : isComplete
                    ? `1px solid ${step.color}50`
                    : '1px solid oklch(0.3 0.015 280)',
                }}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{
                    color: isActive || isComplete ? step.color : 'oklch(0.5 0.015 280)',
                  }}
                />
              </motion.div>
              <span className="hidden lg:block absolute -bottom-5 text-[10px] whitespace-nowrap" style={{ color: isActive ? step.color : 'oklch(0.5 0.015 280)' }}>
                {step.label}
              </span>
            </div>
            {i < STEP_CONFIG.length - 1 && (
              <div
                className="w-4 sm:w-6 h-0.5 rounded-full transition-colors duration-300"
                style={{
                  background: isComplete ? `${step.color}60` : 'oklch(0.25 0.015 280)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * VideoProgressIndicator — Step-by-step progress for video generation.
 *
 * Shows which step the video generation is on with animated progress.
 * Steps: Analyzing audio → Writing scenes → Generating clips → Downloading → Merging → Uploading
 *
 * Since the backend is a single long mutation, we simulate progress on the client
 * based on typical timing. Calibrated to Hailuo 2.3 via Replicate timings (~90s per clip).
 */
import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Music, PenTool, Film, Download, Merge, Upload, Loader2, Check } from "lucide-react";

const STEPS = [
  { id: "analyze", label: "Analyzing audio", icon: Music, duration: 3 },
  { id: "prompt", label: "Writing scene descriptions", icon: PenTool, duration: 5 },
  { id: "generate", label: "Generating video clips", icon: Film, duration: 40 },
  { id: "download", label: "Downloading clips", icon: Download, duration: 5 },
  { id: "merge", label: "Merging audio + video", icon: Merge, duration: 8 },
  { id: "upload", label: "Uploading final video", icon: Upload, duration: 4 },
];

const TOTAL_DURATION = STEPS.reduce((sum, s) => sum + s.duration, 0);

export default function VideoProgressIndicator({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    const interval = setInterval(() => {
      if (startRef.current) {
        setElapsed((Date.now() - startRef.current) / 1000);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  // Determine current step based on elapsed time
  let cumulative = 0;
  let currentStepIdx = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (elapsed < cumulative + STEPS[i].duration) {
      currentStepIdx = i;
      break;
    }
    cumulative += STEPS[i].duration;
    if (i === STEPS.length - 1) currentStepIdx = STEPS.length - 1;
  }

  // If elapsed exceeds total, stay on last step with a "still working" message
  if (elapsed >= TOTAL_DURATION) {
    currentStepIdx = STEPS.length - 1;
  }

  // Calculate progress within current step
  let stepElapsed = elapsed - cumulative;
  if (stepElapsed < 0) stepElapsed = 0;

  // Overall progress (capped at 95% to avoid showing 100% before actually done)
  const overallProgress = Math.min(95, (elapsed / TOTAL_DURATION) * 100);

  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Overall progress bar */}
      <Progress value={overallProgress} className="h-1.5" />

      {/* Steps list */}
      <div className="flex flex-col gap-1.5">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isDone = i < currentStepIdx;
          const isCurrent = i === currentStepIdx;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                isCurrent
                  ? "text-primary font-medium"
                  : isDone
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground/30"
              }`}
            >
              {isDone ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <StepIcon className="w-3.5 h-3.5" />
              )}
              <span>{step.label}</span>
              {isCurrent && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {Math.floor(stepElapsed)}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Show "still working" if past estimated time */}
      {elapsed >= TOTAL_DURATION && (
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Still working... almost there
        </p>
      )}
    </div>
  );
}

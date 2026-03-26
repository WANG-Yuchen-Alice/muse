import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Theme {
  id: string;
  name: string;
  nameZh: string;
  emoji: string;
  description: string;
  bpmRange: [number, number];
  key: string;
  scale: string;
  instruments: string[];
  color: string;
  accentColor: string;
  image: string;
  defaultTone: MelodyTone;
  previewAudioUrl: string;
}

export type MelodyTone = 'piano' | 'violin' | 'flute' | 'guitar' | 'electronic';

export interface MelodyPoint {
  x: number;
  y: number;
  note: string;
  time: number;
}

export interface DrumPattern {
  id: string;
  name: string;
  description: string;
  density: number;
  pattern: number[][];
}

export interface HarmonyLayer {
  id: string;
  name: string;
  instrument: string;
  icon: string;
  enabled: boolean;
  volume: number;
}

export type CompositionStep = 'theme' | 'melody' | 'rhythm' | 'harmony' | 'mix' | 'preview';

interface CompositionState {
  currentStep: CompositionStep;
  selectedTheme: Theme | null;
  melodyTone: MelodyTone;
  melodyPoints: MelodyPoint[];
  selectedMelodyOption: 'draw' | 'ai-1' | 'ai-2' | 'ai-3';
  selectedDrumPattern: DrumPattern | null;
  drumDensity: number;
  harmonyLayers: HarmonyLayer[];
  bpm: number;
  isPlaying: boolean;
  isMixComplete: boolean;
  compositionName: string;
}

interface CompositionContextType extends CompositionState {
  setStep: (step: CompositionStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectTheme: (theme: Theme) => void;
  setMelodyTone: (tone: MelodyTone) => void;
  setMelodyPoints: (points: MelodyPoint[]) => void;
  setSelectedMelodyOption: (option: 'draw' | 'ai-1' | 'ai-2' | 'ai-3') => void;
  selectDrumPattern: (pattern: DrumPattern) => void;
  setDrumDensity: (density: number) => void;
  toggleHarmonyLayer: (id: string) => void;
  setHarmonyVolume: (id: string, volume: number) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMixComplete: (complete: boolean) => void;
  setCompositionName: (name: string) => void;
  resetComposition: () => void;
  stepIndex: number;
  totalSteps: number;
}

const STEPS: CompositionStep[] = ['theme', 'melody', 'rhythm', 'harmony', 'mix', 'preview'];

const defaultHarmonyLayers: HarmonyLayer[] = [
  { id: 'strings', name: 'Strings', instrument: 'strings', icon: '🎻', enabled: false, volume: 70 },
  { id: 'piano', name: 'Piano', instrument: 'piano', icon: '🎹', enabled: false, volume: 70 },
  { id: 'synth', name: 'Synth Pad', instrument: 'synth', icon: '🎛️', enabled: false, volume: 60 },
  { id: 'guitar', name: 'Guitar', instrument: 'guitar', icon: '🎸', enabled: false, volume: 65 },
];

const initialState: CompositionState = {
  currentStep: 'theme',
  selectedTheme: null,
  melodyTone: 'piano',
  melodyPoints: [],
  selectedMelodyOption: 'draw',
  selectedDrumPattern: null,
  drumDensity: 50,
  harmonyLayers: defaultHarmonyLayers,
  bpm: 120,
  isPlaying: false,
  isMixComplete: false,
  compositionName: '',
};

const CompositionContext = createContext<CompositionContextType | null>(null);

export function CompositionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CompositionState>(initialState);

  const setStep = useCallback((step: CompositionStep) => {
    setState(s => ({ ...s, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(s => {
      const idx = STEPS.indexOf(s.currentStep);
      if (idx < STEPS.length - 1) {
        return { ...s, currentStep: STEPS[idx + 1] };
      }
      return s;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(s => {
      const idx = STEPS.indexOf(s.currentStep);
      if (idx > 0) {
        return { ...s, currentStep: STEPS[idx - 1] };
      }
      return s;
    });
  }, []);

  const selectTheme = useCallback((theme: Theme) => {
    setState(s => ({
      ...s,
      selectedTheme: theme,
      melodyTone: theme.defaultTone,
      bpm: Math.round((theme.bpmRange[0] + theme.bpmRange[1]) / 2),
    }));
  }, []);

  const setMelodyTone = useCallback((tone: MelodyTone) => {
    setState(s => ({ ...s, melodyTone: tone }));
  }, []);

  const setMelodyPoints = useCallback((points: MelodyPoint[]) => {
    setState(s => ({ ...s, melodyPoints: points }));
  }, []);

  const setSelectedMelodyOption = useCallback((option: 'draw' | 'ai-1' | 'ai-2' | 'ai-3') => {
    setState(s => ({ ...s, selectedMelodyOption: option }));
  }, []);

  const selectDrumPattern = useCallback((pattern: DrumPattern) => {
    setState(s => ({ ...s, selectedDrumPattern: pattern }));
  }, []);

  const setDrumDensity = useCallback((density: number) => {
    setState(s => ({ ...s, drumDensity: density }));
  }, []);

  const toggleHarmonyLayer = useCallback((id: string) => {
    setState(s => ({
      ...s,
      harmonyLayers: s.harmonyLayers.map(l =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      ),
    }));
  }, []);

  const setHarmonyVolume = useCallback((id: string, volume: number) => {
    setState(s => ({
      ...s,
      harmonyLayers: s.harmonyLayers.map(l =>
        l.id === id ? { ...l, volume } : l
      ),
    }));
  }, []);

  const setBpm = useCallback((bpm: number) => {
    setState(s => ({ ...s, bpm }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState(s => ({ ...s, isPlaying: playing }));
  }, []);

  const setIsMixComplete = useCallback((complete: boolean) => {
    setState(s => ({ ...s, isMixComplete: complete }));
  }, []);

  const setCompositionName = useCallback((name: string) => {
    setState(s => ({ ...s, compositionName: name }));
  }, []);

  const resetComposition = useCallback(() => {
    setState(initialState);
  }, []);

  const stepIndex = STEPS.indexOf(state.currentStep);

  return (
    <CompositionContext.Provider
      value={{
        ...state,
        setStep,
        nextStep,
        prevStep,
        selectTheme,
        setMelodyTone,
        setMelodyPoints,
        setSelectedMelodyOption,
        selectDrumPattern,
        setDrumDensity,
        toggleHarmonyLayer,
        setHarmonyVolume,
        setBpm,
        setIsPlaying,
        setIsMixComplete,
        setCompositionName,
        resetComposition,
        stepIndex,
        totalSteps: STEPS.length,
      }}
    >
      {children}
    </CompositionContext.Provider>
  );
}

export function useComposition() {
  const ctx = useContext(CompositionContext);
  if (!ctx) throw new Error('useComposition must be used within CompositionProvider');
  return ctx;
}

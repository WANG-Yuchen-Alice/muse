/*
 * Audio Engine Hook — Tone.js integration
 * Provides real-time melody playback, drum patterns, and harmony layers
 */
import { useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import type { MelodyPoint, Theme, DrumPattern, HarmonyLayer } from '@/contexts/CompositionContext';

// Synth configurations per instrument type
const SYNTH_CONFIGS = {
  melody: {
    oscillator: { type: 'triangle' as const },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
  },
  strings: {
    oscillator: { type: 'sawtooth' as const },
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.7, release: 1.2 },
  },
  piano: {
    oscillator: { type: 'triangle' as const },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.5 },
  },
  synth: {
    oscillator: { type: 'sine' as const },
    envelope: { attack: 0.5, decay: 0.8, sustain: 0.6, release: 1.5 },
  },
  guitar: {
    oscillator: { type: 'square' as const },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.4 },
  },
};

export function useAudioEngine() {
  const melodySynthRef = useRef<Tone.Synth | null>(null);
  const isInitializedRef = useRef(false);
  const reverbRef = useRef<Tone.Reverb | null>(null);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;
    await Tone.start();

    // Create reverb effect
    reverbRef.current = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();

    // Create melody synth
    melodySynthRef.current = new Tone.Synth(SYNTH_CONFIGS.melody).connect(reverbRef.current);

    isInitializedRef.current = true;
  }, []);

  const playNote = useCallback(async (note: string, duration: string = '8n') => {
    await initialize();
    if (melodySynthRef.current) {
      try {
        melodySynthRef.current.triggerAttackRelease(note, duration);
      } catch (e) {
        // Ignore note scheduling errors
      }
    }
  }, [initialize]);

  const playMelodySequence = useCallback(async (points: MelodyPoint[], bpm: number = 120) => {
    await initialize();
    if (!melodySynthRef.current || points.length === 0) return;

    Tone.getTransport().bpm.value = bpm;

    // Sort points by x position (time)
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const totalDuration = 4; // 4 seconds for the melody

    sorted.forEach((pt, i) => {
      const time = pt.x * totalDuration;
      try {
        Tone.getTransport().schedule((t) => {
          melodySynthRef.current?.triggerAttackRelease(pt.note, '8n', t);
        }, time);
      } catch (e) {
        // Ignore
      }
    });

    Tone.getTransport().start();

    // Stop after melody completes
    setTimeout(() => {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    }, (totalDuration + 1) * 1000);
  }, [initialize]);

  const stopAll = useCallback(() => {
    try {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    } catch (e) {
      // Ignore
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      melodySynthRef.current?.dispose();
      reverbRef.current?.dispose();
    };
  }, [stopAll]);

  return {
    initialize,
    playNote,
    playMelodySequence,
    stopAll,
  };
}

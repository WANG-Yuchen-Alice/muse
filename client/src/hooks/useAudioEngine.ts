/*
 * Audio Engine Hook — Tone.js integration
 * Full composition playback: melody + drums + harmony layers
 * Also provides individual instrument previews
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import type { MelodyPoint, DrumPattern, HarmonyLayer } from '@/contexts/CompositionContext';

// Chord progressions per key for harmony layers
const CHORD_PROGRESSIONS: Record<string, string[][]> = {
  'D-major': [['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4'], ['D4', 'F#4', 'A4']],
  'G-pentatonic': [['G3', 'B3', 'D4'], ['E3', 'G3', 'B3'], ['A3', 'D4', 'E4'], ['G3', 'B3', 'D4']],
  'A-minor': [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4']],
  'F-major': [['F3', 'A3', 'C4'], ['Bb3', 'D4', 'F4'], ['C3', 'E3', 'G3'], ['F3', 'A3', 'C4']],
  'E-minor': [['E3', 'G3', 'B3'], ['C3', 'E3', 'G3'], ['D3', 'F#3', 'A3'], ['E3', 'G3', 'B3']],
};

// Bass notes per key
const BASS_LINES: Record<string, string[]> = {
  'D-major': ['D2', 'G2', 'A2', 'D2', 'B2', 'G2', 'A2', 'D2'],
  'G-pentatonic': ['G2', 'E2', 'A2', 'G2', 'D2', 'E2', 'A2', 'G2'],
  'A-minor': ['A2', 'F2', 'G2', 'A2', 'E2', 'F2', 'G2', 'A2'],
  'F-major': ['F2', 'Bb2', 'C2', 'F2', 'D2', 'Bb2', 'C2', 'F2'],
  'E-minor': ['E2', 'C2', 'D2', 'E2', 'G2', 'C2', 'D2', 'E2'],
};

export function useAudioEngine() {
  const isInitializedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Synths
  const melodySynthRef = useRef<Tone.Synth | null>(null);
  const drumSynthsRef = useRef<{
    kick: Tone.MembraneSynth | null;
    snare: Tone.NoiseSynth | null;
    hihat: Tone.MetalSynth | null;
  }>({ kick: null, snare: null, hihat: null });
  const harmonySynthsRef = useRef<Record<string, Tone.PolySynth | null>>({});
  const bassSynthRef = useRef<Tone.Synth | null>(null);

  // Effects
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const compressorRef = useRef<Tone.Compressor | null>(null);

  // Scheduled event IDs for cleanup
  const scheduledIdsRef = useRef<number[]>([]);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;
    await Tone.start();

    // Master effects chain
    compressorRef.current = new Tone.Compressor(-20, 4).toDestination();
    reverbRef.current = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(compressorRef.current);
    delayRef.current = new Tone.FeedbackDelay('8n', 0.15).connect(reverbRef.current);
    delayRef.current.wet.value = 0.15;

    // Melody synth — warm triangle wave
    melodySynthRef.current = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
      volume: -6,
    }).connect(delayRef.current);

    // Drum synths
    drumSynthsRef.current.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
      volume: -8,
    }).connect(compressorRef.current);

    drumSynthsRef.current.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -12,
    }).connect(compressorRef.current);

    drumSynthsRef.current.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -20,
    }).connect(compressorRef.current);

    // Harmony synths — one per instrument type
    const harmonyConfigs: Record<string, { type: OscillatorType; attack: number; decay: number; sustain: number; release: number; vol: number }> = {
      strings: { type: 'sawtooth', attack: 0.4, decay: 0.6, sustain: 0.7, release: 1.5, vol: -14 },
      piano: { type: 'triangle', attack: 0.01, decay: 0.6, sustain: 0.2, release: 0.6, vol: -10 },
      synth: { type: 'sine', attack: 0.6, decay: 1.0, sustain: 0.6, release: 2.0, vol: -14 },
      guitar: { type: 'square', attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.5, vol: -12 },
    };

    for (const [id, cfg] of Object.entries(harmonyConfigs)) {
      harmonySynthsRef.current[id] = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: cfg.type },
        envelope: { attack: cfg.attack, decay: cfg.decay, sustain: cfg.sustain, release: cfg.release },
        volume: cfg.vol,
      }).connect(reverbRef.current);
    }

    // Bass synth
    bassSynthRef.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
      volume: -10,
    }).connect(compressorRef.current);

    isInitializedRef.current = true;
  }, []);

  // Play a single note (for melody drawing)
  const playNote = useCallback(async (note: string, duration: string = '16n') => {
    await initialize();
    if (melodySynthRef.current) {
      try {
        melodySynthRef.current.triggerAttackRelease(note, duration);
      } catch {
        // Ignore scheduling errors
      }
    }
  }, [initialize]);

  // Preview an instrument sound (for harmony step)
  const previewInstrument = useCallback(async (instrumentId: string, notes?: string[]) => {
    await initialize();
    const synth = harmonySynthsRef.current[instrumentId];
    if (!synth) return;
    const previewNotes = notes || ['C4', 'E4', 'G4'];
    try {
      synth.triggerAttackRelease(previewNotes, '4n');
    } catch {
      // Ignore
    }
  }, [initialize]);

  // Preview a drum hit
  const previewDrum = useCallback(async (type: 'kick' | 'snare' | 'hihat') => {
    await initialize();
    const drums = drumSynthsRef.current;
    try {
      if (type === 'kick' && drums.kick) {
        drums.kick.triggerAttackRelease('C1', '8n');
      } else if (type === 'snare' && drums.snare) {
        drums.snare.triggerAttackRelease('8n', Tone.now(), 0.7);
      } else if (type === 'hihat' && drums.hihat) {
        drums.hihat.triggerAttackRelease('32n', Tone.now());
      }
    } catch {
      // Ignore
    }
  }, [initialize]);

  // Play melody sequence only
  const playMelodySequence = useCallback(async (points: MelodyPoint[], bpm: number = 120) => {
    await initialize();
    if (!melodySynthRef.current || points.length === 0) return;

    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.bpm.value = bpm;

    const sorted = [...points].sort((a, b) => a.x - b.x);
    const totalBeats = 8; // 8 beats for melody

    sorted.forEach((pt) => {
      const beatTime = pt.x * totalBeats;
      try {
        const id = transport.schedule((t) => {
          melodySynthRef.current?.triggerAttackRelease(pt.note, '8n', t);
        }, `0:0:${beatTime * 2}`);
        scheduledIdsRef.current.push(id);
      } catch {
        // Ignore
      }
    });

    transport.start();

    const durationMs = (totalBeats / bpm) * 60 * 1000 + 500;
    setTimeout(() => {
      transport.stop();
      transport.cancel();
      scheduledIdsRef.current = [];
    }, durationMs);
  }, [initialize]);

  // Play FULL composition (melody + drums + harmony + bass)
  const playFullComposition = useCallback(async (
    melodyPoints: MelodyPoint[],
    drumPattern: DrumPattern | null,
    harmonyLayers: HarmonyLayer[],
    bpm: number,
    scaleKey: string,
    onProgress?: (progress: number) => void,
    onComplete?: () => void,
  ) => {
    await initialize();
    if (isPlayingRef.current) {
      // Stop if already playing
      stopAll();
      return;
    }

    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    scheduledIdsRef.current = [];
    transport.bpm.value = bpm;

    const totalBars = 4; // 4 bars of music
    const beatsPerBar = 4;
    const totalBeats = totalBars * beatsPerBar;
    const sixteenthsPerBar = 16;
    const totalSixteenths = totalBars * sixteenthsPerBar;

    // --- Schedule Melody ---
    if (melodySynthRef.current && melodyPoints.length > 0) {
      const sorted = [...melodyPoints].sort((a, b) => a.x - b.x);
      // Spread melody across all bars, looping if needed
      for (let bar = 0; bar < totalBars; bar++) {
        sorted.forEach((pt) => {
          const barOffset = bar * beatsPerBar;
          const beatInBar = pt.x * beatsPerBar;
          const totalBeat = barOffset + beatInBar;
          const timeStr = `0:${Math.floor(totalBeat)}:${(totalBeat % 1) * 4}`;
          try {
            const id = transport.schedule((t) => {
              melodySynthRef.current?.triggerAttackRelease(pt.note, '8n', t);
            }, timeStr);
            scheduledIdsRef.current.push(id);
          } catch {
            // Ignore
          }
        });
      }
    }

    // --- Schedule Drums ---
    if (drumPattern && drumSynthsRef.current.kick) {
      const drums = drumSynthsRef.current;
      for (let bar = 0; bar < totalBars; bar++) {
        for (let step = 0; step < 16; step++) {
          const timeStr = `${bar}:${Math.floor(step / 4)}:${step % 4}`;
          // Kick
          if (drumPattern.pattern[0]?.[step]) {
            try {
              const id = transport.schedule((t) => {
                drums.kick?.triggerAttackRelease('C1', '8n', t);
              }, timeStr);
              scheduledIdsRef.current.push(id);
            } catch { /* ignore */ }
          }
          // Snare
          if (drumPattern.pattern[1]?.[step]) {
            try {
              const id = transport.schedule((t) => {
                drums.snare?.triggerAttackRelease('16n', t, 0.7);
              }, timeStr);
              scheduledIdsRef.current.push(id);
            } catch { /* ignore */ }
          }
          // Hi-hat
          if (drumPattern.pattern[2]?.[step]) {
            try {
              const id = transport.schedule((t) => {
                drums.hihat?.triggerAttackRelease('32n', t);
              }, timeStr);
              scheduledIdsRef.current.push(id);
            } catch { /* ignore */ }
          }
        }
      }
    }

    // --- Schedule Harmony Layers ---
    const chords = CHORD_PROGRESSIONS[scaleKey] || CHORD_PROGRESSIONS['D-major'];
    const enabledLayers = harmonyLayers.filter(l => l.enabled);
    enabledLayers.forEach((layer) => {
      const synth = harmonySynthsRef.current[layer.id];
      if (!synth) return;
      // Set volume based on layer volume
      synth.volume.value = -20 + (layer.volume / 100) * 14;
      for (let bar = 0; bar < totalBars; bar++) {
        const chord = chords[bar % chords.length];
        const timeStr = `${bar}:0:0`;
        try {
          const id = transport.schedule((t) => {
            synth.triggerAttackRelease(chord, '1n', t);
          }, timeStr);
          scheduledIdsRef.current.push(id);
        } catch { /* ignore */ }
      }
    });

    // --- Schedule Bass ---
    const bassNotes = BASS_LINES[scaleKey] || BASS_LINES['D-major'];
    if (bassSynthRef.current) {
      for (let bar = 0; bar < totalBars; bar++) {
        for (let beat = 0; beat < 2; beat++) {
          const noteIdx = (bar * 2 + beat) % bassNotes.length;
          const timeStr = `${bar}:${beat * 2}:0`;
          try {
            const id = transport.schedule((t) => {
              bassSynthRef.current?.triggerAttackRelease(bassNotes[noteIdx], '2n', t);
            }, timeStr);
            scheduledIdsRef.current.push(id);
          } catch { /* ignore */ }
        }
      }
    }

    // --- Progress tracking ---
    const totalDurationSec = (totalBeats / bpm) * 60;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    const startTime = Date.now();

    if (onProgress) {
      progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const prog = Math.min(1, elapsed / totalDurationSec);
        onProgress(prog);
        if (prog >= 1) {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 50);
    }

    // Schedule stop
    const stopTimeStr = `${totalBars}:0:0`;
    try {
      const id = transport.schedule((t) => {
        transport.stop();
        isPlayingRef.current = false;
        setIsPlaying(false);
        scheduledIdsRef.current = [];
        if (progressInterval) clearInterval(progressInterval);
        onProgress?.(1);
        onComplete?.();
      }, stopTimeStr);
      scheduledIdsRef.current.push(id);
    } catch { /* ignore */ }

    isPlayingRef.current = true;
    setIsPlaying(true);
    transport.start();
  }, [initialize]);

  const stopAll = useCallback(() => {
    try {
      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
      scheduledIdsRef.current = [];
      isPlayingRef.current = false;
      setIsPlaying(false);
    } catch {
      // Ignore
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      melodySynthRef.current?.dispose();
      drumSynthsRef.current.kick?.dispose();
      drumSynthsRef.current.snare?.dispose();
      drumSynthsRef.current.hihat?.dispose();
      Object.values(harmonySynthsRef.current).forEach(s => s?.dispose());
      bassSynthRef.current?.dispose();
      reverbRef.current?.dispose();
      delayRef.current?.dispose();
      compressorRef.current?.dispose();
    };
  }, [stopAll]);

  return {
    initialize,
    playNote,
    previewInstrument,
    previewDrum,
    playMelodySequence,
    playFullComposition,
    stopAll,
    isPlaying,
  };
}

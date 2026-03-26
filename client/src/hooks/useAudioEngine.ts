/*
 * Audio Engine Hook — Tone.js integration
 * Full composition playback: melody + drums + harmony layers + bass
 * Supports: melody variations, longer duration (8 bars), continuous instrument preview
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import type { MelodyPoint, DrumPattern, HarmonyLayer } from '@/contexts/CompositionContext';

// Chord progressions per key for harmony layers
const CHORD_PROGRESSIONS: Record<string, string[][]> = {
  'D-major': [
    ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4'], ['D4', 'F#4', 'A4'],
    ['B3', 'D4', 'F#4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4'], ['D3', 'F#3', 'A3'],
  ],
  'G-pentatonic': [
    ['G3', 'B3', 'D4'], ['E3', 'G3', 'B3'], ['A3', 'D4', 'E4'], ['G3', 'B3', 'D4'],
    ['D3', 'G3', 'A3'], ['E3', 'G3', 'B3'], ['A3', 'D4', 'E4'], ['G3', 'B3', 'D4'],
  ],
  'A-minor': [
    ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'],
    ['D3', 'F3', 'A3'], ['E3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['A3', 'C4', 'E4'],
  ],
  'F-major': [
    ['F3', 'A3', 'C4'], ['Bb3', 'D4', 'F4'], ['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'],
    ['D3', 'F3', 'A3'], ['Bb3', 'D4', 'F4'], ['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'],
  ],
  'E-minor': [
    ['E3', 'G3', 'B3'], ['C3', 'E3', 'G3'], ['D3', 'F#3', 'A3'], ['E3', 'G3', 'B3'],
    ['A3', 'C4', 'E4'], ['B3', 'D4', 'F#4'], ['C3', 'E3', 'G3'], ['E3', 'G3', 'B3'],
  ],
};

// Bass notes per key (8 bars worth)
const BASS_LINES: Record<string, string[]> = {
  'D-major': ['D2', 'G2', 'A2', 'D2', 'B1', 'G2', 'A2', 'D2', 'E2', 'F#2', 'G2', 'A2', 'B2', 'A2', 'G2', 'D2'],
  'G-pentatonic': ['G2', 'E2', 'A2', 'G2', 'D2', 'E2', 'A2', 'G2', 'B2', 'A2', 'G2', 'E2', 'D2', 'G2', 'A2', 'G2'],
  'A-minor': ['A2', 'F2', 'G2', 'A2', 'D2', 'E2', 'F2', 'A2', 'G2', 'F2', 'E2', 'A2', 'D2', 'E2', 'G2', 'A2'],
  'F-major': ['F2', 'Bb2', 'C2', 'F2', 'D2', 'Bb2', 'C2', 'F2', 'A2', 'Bb2', 'C3', 'F2', 'D2', 'Bb2', 'C2', 'F2'],
  'E-minor': ['E2', 'C2', 'D2', 'E2', 'A2', 'B2', 'C2', 'E2', 'G2', 'A2', 'B2', 'E2', 'C2', 'D2', 'B2', 'E2'],
};

// Generate melody variations from the original melody
function generateMelodyVariation(
  original: MelodyPoint[],
  variationType: 'original' | 'transposed' | 'inverted' | 'retrograde' | 'rhythmic-shift' | 'ornamented' | 'simplified' | 'octave-up',
  scaleNotes: string[],
): MelodyPoint[] {
  if (original.length === 0) return [];
  const sorted = [...original].sort((a, b) => a.x - b.x);

  const noteToIndex = (note: string): number => {
    const idx = scaleNotes.indexOf(note);
    return idx >= 0 ? idx : Math.floor(scaleNotes.length / 2);
  };

  const indexToNote = (idx: number): string => {
    const clamped = Math.max(0, Math.min(scaleNotes.length - 1, idx));
    return scaleNotes[clamped];
  };

  switch (variationType) {
    case 'original':
      return sorted;

    case 'transposed': {
      // Shift all notes up by 2 scale degrees
      return sorted.map(pt => {
        const idx = noteToIndex(pt.note);
        const newIdx = idx + 2;
        const newNote = indexToNote(newIdx);
        const newY = 1 - newIdx / (scaleNotes.length - 1);
        return { ...pt, note: newNote, y: Math.max(0, Math.min(1, newY)) };
      });
    }

    case 'inverted': {
      // Mirror the melody around its center pitch
      const centerIdx = sorted.reduce((sum, pt) => sum + noteToIndex(pt.note), 0) / sorted.length;
      return sorted.map(pt => {
        const idx = noteToIndex(pt.note);
        const newIdx = Math.round(2 * centerIdx - idx);
        const newNote = indexToNote(newIdx);
        const newY = 1 - Math.max(0, Math.min(scaleNotes.length - 1, newIdx)) / (scaleNotes.length - 1);
        return { ...pt, note: newNote, y: Math.max(0, Math.min(1, newY)) };
      });
    }

    case 'retrograde': {
      // Reverse the time positions while keeping pitches in reverse order
      const maxX = Math.max(...sorted.map(p => p.x));
      return sorted.map((pt, i) => {
        const reversePt = sorted[sorted.length - 1 - i];
        return { ...pt, note: reversePt.note, y: reversePt.y, x: pt.x };
      });
    }

    case 'rhythmic-shift': {
      // Shift all notes slightly forward in time, with some syncopation
      return sorted.map((pt, i) => {
        const shift = (i % 2 === 0) ? 0.03 : -0.02;
        return { ...pt, x: Math.max(0, Math.min(1, pt.x + shift)) };
      });
    }

    case 'ornamented': {
      // Add passing tones between notes
      const result: MelodyPoint[] = [];
      for (let i = 0; i < sorted.length; i++) {
        result.push(sorted[i]);
        if (i < sorted.length - 1) {
          const curIdx = noteToIndex(sorted[i].note);
          const nextIdx = noteToIndex(sorted[i + 1].note);
          if (Math.abs(nextIdx - curIdx) > 1) {
            const midIdx = Math.round((curIdx + nextIdx) / 2);
            const midX = (sorted[i].x + sorted[i + 1].x) / 2;
            const midNote = indexToNote(midIdx);
            const midY = 1 - midIdx / (scaleNotes.length - 1);
            result.push({ x: midX, y: Math.max(0, Math.min(1, midY)), note: midNote, time: midX });
          }
        }
      }
      return result;
    }

    case 'simplified': {
      // Keep only every other note for a sparser feel
      return sorted.filter((_, i) => i % 2 === 0);
    }

    case 'octave-up': {
      // Move notes up by shifting index up significantly
      return sorted.map(pt => {
        const idx = noteToIndex(pt.note);
        const newIdx = Math.min(scaleNotes.length - 1, idx + 4);
        const newNote = indexToNote(newIdx);
        const newY = 1 - newIdx / (scaleNotes.length - 1);
        return { ...pt, note: newNote, y: Math.max(0, Math.min(1, newY)) };
      });
    }

    default:
      return sorted;
  }
}

// Variation sequence for 8 bars
const VARIATION_SEQUENCE: Array<'original' | 'transposed' | 'inverted' | 'retrograde' | 'rhythmic-shift' | 'ornamented' | 'simplified' | 'octave-up'> = [
  'original',
  'original',
  'transposed',
  'ornamented',
  'inverted',
  'rhythmic-shift',
  'original',
  'octave-up',
];

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
  const chorusRef = useRef<Tone.Chorus | null>(null);

  // Scheduled event IDs for cleanup
  const scheduledIdsRef = useRef<number[]>([]);

  // For continuous harmony preview
  const previewLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;
    await Tone.start();

    // Master effects chain
    compressorRef.current = new Tone.Compressor(-18, 5).toDestination();
    reverbRef.current = new Tone.Reverb({ decay: 3.0, wet: 0.3 }).connect(compressorRef.current);
    delayRef.current = new Tone.FeedbackDelay('8n', 0.2).connect(reverbRef.current);
    delayRef.current.wet.value = 0.15;
    chorusRef.current = new Tone.Chorus(4, 2.5, 0.5).connect(reverbRef.current);
    chorusRef.current.start();

    // Melody synth — richer FM-like sound
    melodySynthRef.current = new Tone.Synth({
      oscillator: { type: 'fatsawtooth', spread: 20, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1.0 },
      volume: -8,
    }).connect(delayRef.current);

    // Drum synths — improved quality
    drumSynthsRef.current.kick = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 0.5, sustain: 0.01, release: 0.5 },
      volume: -6,
    }).connect(compressorRef.current);

    drumSynthsRef.current.snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      volume: -10,
    }).connect(compressorRef.current);

    drumSynthsRef.current.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.02 },
      harmonicity: 5.1,
      modulationIndex: 40,
      resonance: 5000,
      octaves: 1.5,
      volume: -18,
    }).connect(compressorRef.current);

    // Harmony synths — much richer sounds using multiple oscillators and chorus
    const stringSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', spread: 40, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.6, decay: 0.8, sustain: 0.8, release: 2.0 },
      volume: -16,
    }).connect(chorusRef.current);
    harmonySynthsRef.current['strings'] = stringSynth;

    const pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', spread: 10, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.005, decay: 1.0, sustain: 0.1, release: 1.2 },
      volume: -10,
    }).connect(reverbRef.current);
    harmonySynthsRef.current['piano'] = pianoSynth;

    const synthPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsine', spread: 30, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.8, decay: 1.5, sustain: 0.7, release: 3.0 },
      volume: -16,
    }).connect(chorusRef.current);
    harmonySynthsRef.current['synth'] = synthPad;

    const guitarSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsquare', spread: 15, count: 2 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 },
      volume: -12,
    }).connect(reverbRef.current);
    harmonySynthsRef.current['guitar'] = guitarSynth;

    // Bass synth — deeper, warmer
    bassSynthRef.current = new Tone.Synth({
      oscillator: { type: 'fatsine', spread: 10, count: 2 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.04, decay: 0.4, sustain: 0.6, release: 0.6 },
      volume: -8,
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
      synth.triggerAttackRelease(previewNotes, '2n');
    } catch {
      // Ignore
    }
  }, [initialize]);

  // Start continuous harmony preview (plays chord repeatedly while slider is being dragged)
  const startContinuousPreview = useCallback(async (instrumentId: string, volume: number, notes?: string[]) => {
    await initialize();
    const synth = harmonySynthsRef.current[instrumentId];
    if (!synth) return;

    // Set volume based on slider value
    synth.volume.value = -30 + (volume / 100) * 24;

    // Stop any existing preview loop
    if (previewLoopRef.current) {
      clearInterval(previewLoopRef.current);
      previewLoopRef.current = null;
    }

    const previewNotes = notes || ['C4', 'E4', 'G4'];
    try {
      synth.triggerAttackRelease(previewNotes, '4n');
    } catch {
      // Ignore
    }
  }, [initialize]);

  const stopContinuousPreview = useCallback(() => {
    if (previewLoopRef.current) {
      clearInterval(previewLoopRef.current);
      previewLoopRef.current = null;
    }
  }, []);

  // Update volume of a harmony synth in real-time
  const setHarmonyVolume = useCallback(async (instrumentId: string, volume: number) => {
    await initialize();
    const synth = harmonySynthsRef.current[instrumentId];
    if (!synth) return;
    synth.volume.value = -30 + (volume / 100) * 24;
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
    const totalBeats = 8;

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

  // Play FULL composition — 8 bars with melody variations
  const playFullComposition = useCallback(async (
    melodyPoints: MelodyPoint[],
    drumPattern: DrumPattern | null,
    harmonyLayers: HarmonyLayer[],
    bpm: number,
    scaleKey: string,
    onProgress?: (progress: number) => void,
    onComplete?: () => void,
    scaleNotes?: string[],
  ) => {
    await initialize();
    if (isPlayingRef.current) {
      stopAll();
      return;
    }

    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    scheduledIdsRef.current = [];
    transport.bpm.value = bpm;

    const totalBars = 8; // 8 bars for longer duration
    const beatsPerBar = 4;
    const totalBeats = totalBars * beatsPerBar;

    // --- Schedule Melody with VARIATIONS ---
    if (melodySynthRef.current && melodyPoints.length > 0) {
      const notes = scaleNotes || [];
      for (let bar = 0; bar < totalBars; bar++) {
        const variationType = VARIATION_SEQUENCE[bar % VARIATION_SEQUENCE.length];
        const variation = notes.length > 0
          ? generateMelodyVariation(melodyPoints, variationType, notes)
          : [...melodyPoints].sort((a, b) => a.x - b.x);

        variation.forEach((pt) => {
          const barOffset = bar * beatsPerBar;
          const beatInBar = pt.x * beatsPerBar;
          const totalBeat = barOffset + beatInBar;
          const barNum = Math.floor(totalBeat / beatsPerBar);
          const beatInBarNum = totalBeat % beatsPerBar;
          const quarterBeat = Math.floor(beatInBarNum);
          const sixteenth = Math.round((beatInBarNum - quarterBeat) * 4);
          const timeStr = `${barNum}:${quarterBeat}:${sixteenth}`;
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

    // --- Schedule Drums (if pattern exists) ---
    if (drumPattern && drumSynthsRef.current.kick) {
      const drums = drumSynthsRef.current;
      for (let bar = 0; bar < totalBars; bar++) {
        for (let step = 0; step < 16; step++) {
          const timeStr = `${bar}:${Math.floor(step / 4)}:${step % 4}`;
          if (drumPattern.pattern[0]?.[step]) {
            try {
              const id = transport.schedule((t) => {
                drums.kick?.triggerAttackRelease('C1', '8n', t);
              }, timeStr);
              scheduledIdsRef.current.push(id);
            } catch { /* ignore */ }
          }
          if (drumPattern.pattern[1]?.[step]) {
            try {
              const id = transport.schedule((t) => {
                drums.snare?.triggerAttackRelease('16n', t, 0.7);
              }, timeStr);
              scheduledIdsRef.current.push(id);
            } catch { /* ignore */ }
          }
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
      synth.volume.value = -30 + (layer.volume / 100) * 24;
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
      const id = transport.schedule(() => {
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
      stopContinuousPreview();
    } catch {
      // Ignore
    }
  }, [stopContinuousPreview]);

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
      chorusRef.current?.dispose();
    };
  }, [stopAll]);

  return {
    initialize,
    playNote,
    previewInstrument,
    startContinuousPreview,
    stopContinuousPreview,
    setHarmonyVolume,
    previewDrum,
    playMelodySequence,
    playFullComposition,
    stopAll,
    isPlaying,
  };
}

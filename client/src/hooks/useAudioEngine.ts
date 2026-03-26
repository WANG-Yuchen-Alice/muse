/*
 * Audio Engine Hook — Tone.js integration with real instrument samples
 * Uses Tone.Sampler for piano, violin, flute, guitar (from tonejs-instruments)
 * Falls back to Tone.Synth for electronic tone
 * All scheduling uses seconds-based timing to avoid "Start time" errors
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import type { MelodyPoint, DrumPattern, HarmonyLayer, MelodyTone } from '@/contexts/CompositionContext';
import type { SampleNote } from '@/lib/themes';

// CDN base for instrument samples
const SAMPLES_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples';

// Minimal sample maps for each instrument (Tone.Sampler interpolates between these)
const SAMPLE_MAPS: Record<string, Record<string, string>> = {
  piano: {
    A3: `${SAMPLES_BASE}/piano/A3.mp3`,
    A4: `${SAMPLES_BASE}/piano/A4.mp3`,
    A5: `${SAMPLES_BASE}/piano/A5.mp3`,
    C3: `${SAMPLES_BASE}/piano/C3.mp3`,
    C4: `${SAMPLES_BASE}/piano/C4.mp3`,
    C5: `${SAMPLES_BASE}/piano/C5.mp3`,
    E3: `${SAMPLES_BASE}/piano/E3.mp3`,
    E4: `${SAMPLES_BASE}/piano/E4.mp3`,
    E5: `${SAMPLES_BASE}/piano/E5.mp3`,
    'F#3': `${SAMPLES_BASE}/piano/Fs3.mp3`,
    'F#4': `${SAMPLES_BASE}/piano/Fs4.mp3`,
    G3: `${SAMPLES_BASE}/piano/G3.mp3`,
    G4: `${SAMPLES_BASE}/piano/G4.mp3`,
  },
  violin: {
    A3: `${SAMPLES_BASE}/violin/A3.mp3`,
    A4: `${SAMPLES_BASE}/violin/A4.mp3`,
    A5: `${SAMPLES_BASE}/violin/A5.mp3`,
    C4: `${SAMPLES_BASE}/violin/C4.mp3`,
    C5: `${SAMPLES_BASE}/violin/C5.mp3`,
    E4: `${SAMPLES_BASE}/violin/E4.mp3`,
    E5: `${SAMPLES_BASE}/violin/E5.mp3`,
    G4: `${SAMPLES_BASE}/violin/G4.mp3`,
    G5: `${SAMPLES_BASE}/violin/G5.mp3`,
  },
  flute: {
    A4: `${SAMPLES_BASE}/flute/A4.mp3`,
    A5: `${SAMPLES_BASE}/flute/A5.mp3`,
    C4: `${SAMPLES_BASE}/flute/C4.mp3`,
    C5: `${SAMPLES_BASE}/flute/C5.mp3`,
    D4: `${SAMPLES_BASE}/flute/D4.mp3`,
    D5: `${SAMPLES_BASE}/flute/D5.mp3`,
    E4: `${SAMPLES_BASE}/flute/E4.mp3`,
    E5: `${SAMPLES_BASE}/flute/E5.mp3`,
    G4: `${SAMPLES_BASE}/flute/G4.mp3`,
    G5: `${SAMPLES_BASE}/flute/G5.mp3`,
  },
  guitar: {
    A3: `${SAMPLES_BASE}/guitar-acoustic/A3.mp3`,
    A4: `${SAMPLES_BASE}/guitar-acoustic/A4.mp3`,
    C3: `${SAMPLES_BASE}/guitar-acoustic/C3.mp3`,
    C4: `${SAMPLES_BASE}/guitar-acoustic/C4.mp3`,
    D3: `${SAMPLES_BASE}/guitar-acoustic/D3.mp3`,
    D4: `${SAMPLES_BASE}/guitar-acoustic/D4.mp3`,
    E3: `${SAMPLES_BASE}/guitar-acoustic/E3.mp3`,
    E4: `${SAMPLES_BASE}/guitar-acoustic/E4.mp3`,
    G3: `${SAMPLES_BASE}/guitar-acoustic/G3.mp3`,
    G4: `${SAMPLES_BASE}/guitar-acoustic/G4.mp3`,
  },
  // Harmony instruments
  cello: {
    A2: `${SAMPLES_BASE}/cello/A2.mp3`,
    A3: `${SAMPLES_BASE}/cello/A3.mp3`,
    C3: `${SAMPLES_BASE}/cello/C3.mp3`,
    C4: `${SAMPLES_BASE}/cello/C4.mp3`,
    E3: `${SAMPLES_BASE}/cello/E3.mp3`,
    G3: `${SAMPLES_BASE}/cello/G3.mp3`,
  },
  harp: {
    A3: `${SAMPLES_BASE}/harp/A3.mp3`,
    A4: `${SAMPLES_BASE}/harp/A4.mp3`,
    C4: `${SAMPLES_BASE}/harp/C4.mp3`,
    C5: `${SAMPLES_BASE}/harp/C5.mp3`,
    E4: `${SAMPLES_BASE}/harp/E4.mp3`,
    G4: `${SAMPLES_BASE}/harp/G4.mp3`,
  },
};

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

// Bass notes per key
const BASS_LINES: Record<string, string[]> = {
  'D-major': ['D2', 'G2', 'A2', 'D2', 'B1', 'G2', 'A2', 'D2', 'E2', 'F#2', 'G2', 'A2', 'B2', 'A2', 'G2', 'D2'],
  'G-pentatonic': ['G2', 'E2', 'A2', 'G2', 'D2', 'E2', 'A2', 'G2', 'B2', 'A2', 'G2', 'E2', 'D2', 'G2', 'A2', 'G2'],
  'A-minor': ['A2', 'F2', 'G2', 'A2', 'D2', 'E2', 'F2', 'A2', 'G2', 'F2', 'E2', 'A2', 'D2', 'E2', 'G2', 'A2'],
  'F-major': ['F2', 'Bb2', 'C2', 'F2', 'D2', 'Bb2', 'C2', 'F2', 'A2', 'Bb2', 'C3', 'F2', 'D2', 'Bb2', 'C2', 'F2'],
  'E-minor': ['E2', 'C2', 'D2', 'E2', 'A2', 'B2', 'C2', 'E2', 'G2', 'A2', 'B2', 'E2', 'C2', 'D2', 'B2', 'E2'],
};

// Melody variation generator
function generateMelodyVariation(
  original: MelodyPoint[],
  variationType: string,
  scaleNotes: string[],
): MelodyPoint[] {
  if (original.length === 0) return [];
  const sorted = [...original].sort((a, b) => a.x - b.x);

  const noteToIndex = (note: string): number => {
    const idx = scaleNotes.indexOf(note);
    return idx >= 0 ? idx : Math.floor(scaleNotes.length / 2);
  };
  const indexToNote = (idx: number): string => {
    return scaleNotes[Math.max(0, Math.min(scaleNotes.length - 1, idx))];
  };

  switch (variationType) {
    case 'original': return sorted;
    case 'transposed':
      return sorted.map(pt => {
        const newIdx = noteToIndex(pt.note) + 2;
        const note = indexToNote(newIdx);
        return { ...pt, note, y: 1 - Math.max(0, Math.min(scaleNotes.length - 1, newIdx)) / (scaleNotes.length - 1) };
      });
    case 'inverted': {
      const center = sorted.reduce((s, pt) => s + noteToIndex(pt.note), 0) / sorted.length;
      return sorted.map(pt => {
        const newIdx = Math.round(2 * center - noteToIndex(pt.note));
        const note = indexToNote(newIdx);
        return { ...pt, note, y: 1 - Math.max(0, Math.min(scaleNotes.length - 1, newIdx)) / (scaleNotes.length - 1) };
      });
    }
    case 'retrograde':
      return sorted.map((pt, i) => {
        const rev = sorted[sorted.length - 1 - i];
        return { ...pt, note: rev.note, y: rev.y };
      });
    case 'rhythmic-shift':
      return sorted.map((pt, i) => ({
        ...pt, x: Math.max(0, Math.min(1, pt.x + (i % 2 === 0 ? 0.03 : -0.02)))
      }));
    case 'ornamented': {
      const result: MelodyPoint[] = [];
      for (let i = 0; i < sorted.length; i++) {
        result.push(sorted[i]);
        if (i < sorted.length - 1) {
          const curIdx = noteToIndex(sorted[i].note);
          const nextIdx = noteToIndex(sorted[i + 1].note);
          if (Math.abs(nextIdx - curIdx) > 1) {
            const midIdx = Math.round((curIdx + nextIdx) / 2);
            const midX = (sorted[i].x + sorted[i + 1].x) / 2;
            result.push({ x: midX, y: 1 - midIdx / (scaleNotes.length - 1), note: indexToNote(midIdx), time: midX });
          }
        }
      }
      return result;
    }
    case 'octave-up':
      return sorted.map(pt => {
        const newIdx = Math.min(scaleNotes.length - 1, noteToIndex(pt.note) + 4);
        return { ...pt, note: indexToNote(newIdx), y: 1 - newIdx / (scaleNotes.length - 1) };
      });
    default: return sorted;
  }
}

const VARIATION_SEQUENCE = [
  'original', 'original', 'transposed', 'ornamented',
  'inverted', 'rhythmic-shift', 'original', 'octave-up',
];

export function useAudioEngine() {
  const isInitializedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [samplesLoaded, setSamplesLoaded] = useState(false);

  // Samplers for real instruments
  const samplersRef = useRef<Record<string, Tone.Sampler>>({});
  // Electronic synth fallback
  const electronicSynthRef = useRef<Tone.Synth | null>(null);
  // Current melody sampler/synth
  const currentToneRef = useRef<MelodyTone>('piano');

  // Drum synths
  const drumSynthsRef = useRef<{
    kick: Tone.MembraneSynth | null;
    snare: Tone.NoiseSynth | null;
    hihat: Tone.MetalSynth | null;
  }>({ kick: null, snare: null, hihat: null });

  // Harmony synths (PolySynth for chords)
  const harmonySynthsRef = useRef<Record<string, Tone.PolySynth | null>>({});
  // Bass synth
  const bassSynthRef = useRef<Tone.Synth | null>(null);

  // Effects
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const compressorRef = useRef<Tone.Compressor | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);

  // Scheduled timeouts for cleanup
  const scheduledTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sample preview stop function
  const sampleStopRef = useRef<(() => void) | null>(null);

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

    // Load real instrument samplers
    const loadSampler = (name: string, samples: Record<string, string>, dest: Tone.ToneAudioNode): Promise<void> => {
      return new Promise((resolve) => {
        const sampler = new Tone.Sampler({
          urls: samples,
          onload: () => {
            resolve();
          },
          onerror: () => {
            resolve(); // Don't block on error
          },
          volume: -6,
          release: 1.5,
        }).connect(dest);
        samplersRef.current[name] = sampler;
      });
    };

    // Load all samplers in parallel
    const loadPromises = Object.entries(SAMPLE_MAPS).map(([name, samples]) => {
      const dest = ['violin', 'cello'].includes(name) ? chorusRef.current! : reverbRef.current!;
      return loadSampler(name, samples, dest);
    });

    // Electronic synth (no samples needed)
    electronicSynthRef.current = new Tone.Synth({
      oscillator: { type: 'fatsawtooth', spread: 20, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1.0 },
      volume: -8,
    }).connect(delayRef.current);

    // Drum synths
    drumSynthsRef.current.kick = new Tone.MembraneSynth({
      pitchDecay: 0.08, octaves: 8,
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
      harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1.5,
      volume: -18,
    }).connect(compressorRef.current);

    // Harmony PolySynths — using richer oscillators
    harmonySynthsRef.current['strings'] = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', spread: 40, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.6, decay: 0.8, sustain: 0.8, release: 2.0 },
      volume: -16,
    }).connect(chorusRef.current);

    harmonySynthsRef.current['piano'] = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', spread: 10, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.005, decay: 1.0, sustain: 0.1, release: 1.2 },
      volume: -10,
    }).connect(reverbRef.current);

    harmonySynthsRef.current['synth'] = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsine', spread: 30, count: 3 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.8, decay: 1.5, sustain: 0.7, release: 3.0 },
      volume: -16,
    }).connect(chorusRef.current);

    harmonySynthsRef.current['guitar'] = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsquare', spread: 15, count: 2 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 },
      volume: -12,
    }).connect(reverbRef.current);

    // Bass synth
    bassSynthRef.current = new Tone.Synth({
      oscillator: { type: 'fatsine', spread: 10, count: 2 } as unknown as Tone.OmniOscillatorOptions,
      envelope: { attack: 0.04, decay: 0.4, sustain: 0.6, release: 0.6 },
      volume: -8,
    }).connect(compressorRef.current);

    isInitializedRef.current = true;

    // Wait for all samplers to load
    await Promise.all(loadPromises);
    setSamplesLoaded(true);
  }, []);

  // Get the right instrument for the current tone
  const getMelodyInstrument = useCallback((tone?: MelodyTone) => {
    const t = tone || currentToneRef.current;
    if (t === 'electronic') return electronicSynthRef.current;
    return samplersRef.current[t] || electronicSynthRef.current;
  }, []);

  // Play a single note (for melody drawing)
  const playNote = useCallback(async (note: string, duration: string = '16n', tone?: MelodyTone) => {
    await initialize();
    const instrument = getMelodyInstrument(tone);
    if (instrument) {
      try {
        instrument.triggerAttackRelease(note, duration);
      } catch { /* ignore */ }
    }
  }, [initialize, getMelodyInstrument]);

  // Set current tone
  const setTone = useCallback((tone: MelodyTone) => {
    currentToneRef.current = tone;
  }, []);

  // Play a sample melody for theme preview — uses setTimeout for scheduling (no Transport)
  const playSampleMelody = useCallback(async (notes: SampleNote[], tone: MelodyTone) => {
    await initialize();

    // Stop any currently playing sample
    if (sampleStopRef.current) {
      sampleStopRef.current();
    }

    const instrument = getMelodyInstrument(tone);
    if (!instrument) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    notes.forEach((n) => {
      const t = setTimeout(() => {
        if (cancelled) return;
        try {
          instrument.triggerAttackRelease(n.note, n.duration);
        } catch { /* ignore */ }
      }, n.time * 1000);
      timeouts.push(t);
    });

    sampleStopRef.current = () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      sampleStopRef.current = null;
    };

    // Auto-cleanup after the sample finishes
    const maxTime = Math.max(...notes.map(n => n.time)) + 2;
    const cleanup = setTimeout(() => {
      sampleStopRef.current = null;
    }, maxTime * 1000);
    timeouts.push(cleanup);
  }, [initialize, getMelodyInstrument]);

  const stopSampleMelody = useCallback(() => {
    if (sampleStopRef.current) {
      sampleStopRef.current();
    }
  }, []);

  // Preview an instrument sound (for harmony step)
  const previewInstrument = useCallback(async (instrumentId: string, notes?: string[]) => {
    await initialize();
    const synth = harmonySynthsRef.current[instrumentId];
    if (!synth) return;
    const previewNotes = notes || ['C4', 'E4', 'G4'];
    try {
      synth.triggerAttackRelease(previewNotes, '2n');
    } catch { /* ignore */ }
  }, [initialize]);

  // Start continuous harmony preview
  const startContinuousPreview = useCallback(async (instrumentId: string, volume: number, notes?: string[]) => {
    await initialize();
    const synth = harmonySynthsRef.current[instrumentId];
    if (!synth) return;
    synth.volume.value = -30 + (volume / 100) * 24;
    const previewNotes = notes || ['C4', 'E4', 'G4'];
    try {
      synth.triggerAttackRelease(previewNotes, '4n');
    } catch { /* ignore */ }
  }, [initialize]);

  const stopContinuousPreview = useCallback(() => {
    // No-op for now, chords decay naturally
  }, []);

  const setHarmonyVolume = useCallback(async (instrumentId: string, volume: number) => {
    await initialize();
    const synth = harmonySynthsRef.current[instrumentId];
    if (!synth) return;
    synth.volume.value = -30 + (volume / 100) * 24;
  }, [initialize]);

  // Preview drum hit
  const previewDrum = useCallback(async (type: 'kick' | 'snare' | 'hihat') => {
    await initialize();
    const drums = drumSynthsRef.current;
    try {
      if (type === 'kick' && drums.kick) drums.kick.triggerAttackRelease('C1', '8n');
      else if (type === 'snare' && drums.snare) drums.snare.triggerAttackRelease('8n', Tone.now(), 0.7);
      else if (type === 'hihat' && drums.hihat) drums.hihat.triggerAttackRelease('32n', Tone.now());
    } catch { /* ignore */ }
  }, [initialize]);

  // Play melody sequence only (for melody step preview)
  const playMelodySequence = useCallback(async (points: MelodyPoint[], bpm: number = 120, tone?: MelodyTone) => {
    await initialize();
    const instrument = getMelodyInstrument(tone);
    if (!instrument || points.length === 0) return;

    // Clear any previous scheduled timeouts
    scheduledTimeoutsRef.current.forEach(clearTimeout);
    scheduledTimeoutsRef.current = [];

    const sorted = [...points].sort((a, b) => a.x - b.x);
    const totalBeats = 8;
    const beatDuration = 60 / bpm; // seconds per beat

    sorted.forEach((pt) => {
      const timeInSeconds = pt.x * totalBeats * beatDuration;
      const t = setTimeout(() => {
        try {
          instrument.triggerAttackRelease(pt.note, '8n');
        } catch { /* ignore */ }
      }, timeInSeconds * 1000);
      scheduledTimeoutsRef.current.push(t);
    });
  }, [initialize, getMelodyInstrument]);

  // Play FULL composition — 8 bars, all layers, using setTimeout-based scheduling
  const playFullComposition = useCallback(async (
    melodyPoints: MelodyPoint[],
    drumPattern: DrumPattern | null,
    harmonyLayers: HarmonyLayer[],
    bpm: number,
    scaleKey: string,
    onProgress?: (progress: number) => void,
    onComplete?: () => void,
    scaleNotes?: string[],
    tone?: MelodyTone,
  ) => {
    await initialize();

    if (isPlayingRef.current) {
      stopAll();
      return;
    }

    // Clear previous
    scheduledTimeoutsRef.current.forEach(clearTimeout);
    scheduledTimeoutsRef.current = [];
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const instrument = getMelodyInstrument(tone);
    const totalBars = 8;
    const beatsPerBar = 4;
    const beatDuration = 60 / bpm;
    const barDuration = beatsPerBar * beatDuration;
    const totalDuration = totalBars * barDuration;

    // --- Schedule Melody with VARIATIONS ---
    if (instrument && melodyPoints.length > 0) {
      const notes = scaleNotes || [];
      for (let bar = 0; bar < totalBars; bar++) {
        const variationType = VARIATION_SEQUENCE[bar % VARIATION_SEQUENCE.length];
        const variation = notes.length > 0
          ? generateMelodyVariation(melodyPoints, variationType, notes)
          : [...melodyPoints].sort((a, b) => a.x - b.x);

        variation.forEach((pt) => {
          const timeInBar = pt.x * barDuration;
          const absoluteTime = bar * barDuration + timeInBar;
          const t = setTimeout(() => {
            try {
              instrument.triggerAttackRelease(pt.note, '8n');
            } catch { /* ignore */ }
          }, absoluteTime * 1000);
          scheduledTimeoutsRef.current.push(t);
        });
      }
    }

    // --- Schedule Drums ---
    if (drumPattern && drumSynthsRef.current.kick) {
      const drums = drumSynthsRef.current;
      const sixteenthDuration = barDuration / 16;
      for (let bar = 0; bar < totalBars; bar++) {
        for (let step = 0; step < 16; step++) {
          const absoluteTime = bar * barDuration + step * sixteenthDuration;
          if (drumPattern.pattern[0]?.[step]) {
            const t = setTimeout(() => {
              try { drums.kick?.triggerAttackRelease('C1', '8n'); } catch { /* ignore */ }
            }, absoluteTime * 1000);
            scheduledTimeoutsRef.current.push(t);
          }
          if (drumPattern.pattern[1]?.[step]) {
            const t = setTimeout(() => {
              try { drums.snare?.triggerAttackRelease('16n', Tone.now(), 0.7); } catch { /* ignore */ }
            }, absoluteTime * 1000);
            scheduledTimeoutsRef.current.push(t);
          }
          if (drumPattern.pattern[2]?.[step]) {
            const t = setTimeout(() => {
              try { drums.hihat?.triggerAttackRelease('32n', Tone.now()); } catch { /* ignore */ }
            }, absoluteTime * 1000);
            scheduledTimeoutsRef.current.push(t);
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
        const absoluteTime = bar * barDuration;
        const t = setTimeout(() => {
          try { synth.triggerAttackRelease(chord, '1n'); } catch { /* ignore */ }
        }, absoluteTime * 1000);
        scheduledTimeoutsRef.current.push(t);
      }
    });

    // --- Schedule Bass ---
    const bassNotes = BASS_LINES[scaleKey] || BASS_LINES['D-major'];
    if (bassSynthRef.current) {
      for (let bar = 0; bar < totalBars; bar++) {
        for (let beat = 0; beat < 2; beat++) {
          const noteIdx = (bar * 2 + beat) % bassNotes.length;
          const absoluteTime = bar * barDuration + beat * 2 * beatDuration;
          const t = setTimeout(() => {
            try { bassSynthRef.current?.triggerAttackRelease(bassNotes[noteIdx], '2n'); } catch { /* ignore */ }
          }, absoluteTime * 1000);
          scheduledTimeoutsRef.current.push(t);
        }
      }
    }

    // --- Progress tracking ---
    const startTime = Date.now();
    if (onProgress) {
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const prog = Math.min(1, elapsed / totalDuration);
        onProgress(prog);
        if (prog >= 1 && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, 50);
    }

    // Schedule stop
    const stopTimeout = setTimeout(() => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      onProgress?.(1);
      onComplete?.();
    }, totalDuration * 1000 + 200);
    scheduledTimeoutsRef.current.push(stopTimeout);

    isPlayingRef.current = true;
    setIsPlaying(true);
  }, [initialize, getMelodyInstrument]);

  const stopAll = useCallback(() => {
    scheduledTimeoutsRef.current.forEach(clearTimeout);
    scheduledTimeoutsRef.current = [];
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    stopSampleMelody();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [stopSampleMelody]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      Object.values(samplersRef.current).forEach(s => { try { s.dispose(); } catch { /* ignore */ } });
      electronicSynthRef.current?.dispose();
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
    setTone,
    playSampleMelody,
    stopSampleMelody,
    previewInstrument,
    startContinuousPreview,
    stopContinuousPreview,
    setHarmonyVolume,
    previewDrum,
    playMelodySequence,
    playFullComposition,
    stopAll,
    isPlaying,
    samplesLoaded,
  };
}

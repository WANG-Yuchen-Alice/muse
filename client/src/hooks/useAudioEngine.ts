/*
 * Audio Engine Hook — Tone.js integration with MusyngKite high-quality instrument samples
 * Uses MusyngKite soundfont (1.75GB source) via CDN for realistic piano, violin, flute, guitar, cello
 * Falls back to Tone.Synth for electronic tone
 * All scheduling uses setTimeout (seconds-based) to avoid "Start time" errors
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import type { MelodyPoint, DrumPattern, HarmonyLayer, MelodyTone } from '@/contexts/CompositionContext';
import type { SampleNote } from '@/lib/themes';

// MusyngKite CDN — high-quality General MIDI soundfont (every chromatic note)
const MK_BASE = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite';

// Instrument name mapping for MusyngKite CDN
const MK_INSTRUMENTS: Record<string, string> = {
  piano: 'acoustic_grand_piano',
  violin: 'violin',
  flute: 'flute',
  guitar: 'acoustic_guitar_nylon',
  cello: 'cello',
  strings: 'string_ensemble_1',
  harp: 'orchestral_harp',
};

// Build sample map for a MusyngKite instrument — load every 3rd semitone for good coverage
function buildSampleMap(instrumentName: string): Record<string, string> {
  const mkName = MK_INSTRUMENTS[instrumentName];
  if (!mkName) return {};
  const map: Record<string, string> = {};
  // Load chromatic samples across useful range — every note for best quality
  const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  // Different ranges per instrument
  const ranges: Record<string, [number, number]> = {
    piano: [2, 6],
    violin: [3, 7],
    flute: [4, 7],
    guitar: [2, 5],
    cello: [2, 5],
    strings: [2, 5],
    harp: [2, 6],
  };
  const [lo, hi] = ranges[instrumentName] || [3, 6];
  // Load every 3rd semitone for balance of quality vs load time
  for (let oct = lo; oct <= hi; oct++) {
    for (let i = 0; i < notes.length; i += 3) {
      const noteName = `${notes[i]}${oct}`;
      // Tone.js uses '#' for sharps, but MusyngKite uses 'b' for flats
      // The CDN uses Db, Eb, Gb, Ab, Bb naming
      map[noteName] = `${MK_BASE}/${mkName}-mp3/${noteName}.mp3`;
    }
  }
  return map;
}

// Chord progressions per key for harmony layers
const CHORD_PROGRESSIONS: Record<string, string[][]> = {
  'D-major': [
    ['D3', 'F#3', 'A3'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4'], ['D3', 'F#3', 'A3'],
    ['B2', 'D3', 'F#3'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4'], ['D3', 'F#3', 'A3'],
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

// Map harmony layer IDs to sampler names for real instrument sounds
const HARMONY_SAMPLER_MAP: Record<string, string> = {
  strings: 'strings',   // Use string ensemble for strings harmony
  piano: 'piano',       // Use piano samples for piano harmony
  synth: 'harp',        // Use harp samples for synth pad (ethereal quality)
  guitar: 'guitar',     // Use guitar samples for guitar harmony
};

export function useAudioEngine() {
  const isInitializedRef = useRef(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);
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
    // Prevent multiple simultaneous initializations
    if (isInitializedRef.current) return;
    if (initPromiseRef.current) return initPromiseRef.current;

    const doInit = async () => {
      try {
        await Tone.start();

        // Master effects chain
        compressorRef.current = new Tone.Compressor(-18, 5).toDestination();
        reverbRef.current = new Tone.Reverb({ decay: 3.0, wet: 0.3 }).connect(compressorRef.current);
        delayRef.current = new Tone.FeedbackDelay('8n', 0.2).connect(reverbRef.current);
        delayRef.current.wet.value = 0.15;
        chorusRef.current = new Tone.Chorus(4, 2.5, 0.5).connect(reverbRef.current);
        chorusRef.current.start();

        // Load MusyngKite instrument samplers
        const instrumentsToLoad = ['piano', 'violin', 'flute', 'guitar', 'cello', 'strings', 'harp'];

        const loadSampler = (name: string, dest: Tone.ToneAudioNode, vol: number = -6): Promise<void> => {
          return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(), 20000); // 20s timeout per sampler
            try {
              const samples = buildSampleMap(name);
              if (Object.keys(samples).length === 0) {
                clearTimeout(timeout);
                resolve();
                return;
              }
              const sampler = new Tone.Sampler({
                urls: samples,
                onload: () => {
                  clearTimeout(timeout);
                  resolve();
                },
                onerror: () => {
                  clearTimeout(timeout);
                  resolve(); // Don't block on error
                },
                volume: vol,
                release: 1.5,
              }).connect(dest);
              samplersRef.current[name] = sampler;
            } catch {
              clearTimeout(timeout);
              resolve();
            }
          });
        };

        // Load all samplers in parallel
        const loadPromises = instrumentsToLoad.map((name) => {
          // Route bowed/sustained instruments through chorus for warmth
          const dest = ['violin', 'cello', 'strings'].includes(name) ? chorusRef.current! : reverbRef.current!;
          const vol = ['cello', 'strings', 'harp'].includes(name) ? -8 : -6;
          return loadSampler(name, dest, vol);
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

        // Bass synth
        bassSynthRef.current = new Tone.Synth({
          oscillator: { type: 'fatsine', spread: 10, count: 2 } as unknown as Tone.OmniOscillatorOptions,
          envelope: { attack: 0.04, decay: 0.4, sustain: 0.6, release: 0.6 },
          volume: -8,
        }).connect(compressorRef.current);

        isInitializedRef.current = true;

        // Wait for all samplers to load (with global timeout)
        await Promise.race([
          Promise.all(loadPromises),
          new Promise<void>(resolve => setTimeout(resolve, 25000)), // 25s global timeout
        ]);
        setSamplesLoaded(true);
      } catch (err) {
        console.warn('Audio engine init error:', err);
        isInitializedRef.current = true; // Mark as initialized even on error to prevent retries
      }
    };

    initPromiseRef.current = doInit();
    return initPromiseRef.current;
  }, []);

  // Get the right instrument for the current tone
  const getMelodyInstrument = useCallback((tone?: MelodyTone) => {
    const t = tone || currentToneRef.current;
    if (t === 'electronic') return electronicSynthRef.current;
    return samplersRef.current[t] || electronicSynthRef.current;
  }, []);

  // Get sampler for a harmony layer — uses REAL samples
  const getHarmonySampler = useCallback((layerId: string): Tone.Sampler | null => {
    const samplerName = HARMONY_SAMPLER_MAP[layerId];
    if (!samplerName) return null;
    return samplersRef.current[samplerName] || null;
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

  // Preview an instrument sound (for harmony step) — uses REAL sampler
  const previewInstrument = useCallback(async (instrumentId: string, notes?: string[]) => {
    await initialize();
    const sampler = getHarmonySampler(instrumentId);
    if (!sampler) return;
    const previewNotes = notes || ['C4', 'E4', 'G4'];
    try {
      // Play each note of the chord with slight stagger for a more natural sound
      previewNotes.forEach((note, i) => {
        setTimeout(() => {
          try { sampler.triggerAttackRelease(note, '2n'); } catch { /* ignore */ }
        }, i * 50); // 50ms stagger between chord notes
      });
    } catch { /* ignore */ }
  }, [initialize, getHarmonySampler]);

  // Start continuous harmony preview — uses REAL sampler
  const startContinuousPreview = useCallback(async (instrumentId: string, volume: number, notes?: string[]) => {
    await initialize();
    const sampler = getHarmonySampler(instrumentId);
    if (!sampler) return;
    // Adjust volume based on slider
    sampler.volume.value = -30 + (volume / 100) * 24;
    const previewNotes = notes || ['C4', 'E4', 'G4'];
    try {
      previewNotes.forEach((note, i) => {
        setTimeout(() => {
          try { sampler.triggerAttackRelease(note, '4n'); } catch { /* ignore */ }
        }, i * 30);
      });
    } catch { /* ignore */ }
  }, [initialize, getHarmonySampler]);

  const stopContinuousPreview = useCallback(() => {
    // No-op for now, chords decay naturally
  }, []);

  const setHarmonyVolume = useCallback(async (instrumentId: string, volume: number) => {
    await initialize();
    const sampler = getHarmonySampler(instrumentId);
    if (!sampler) return;
    sampler.volume.value = -30 + (volume / 100) * 24;
  }, [initialize, getHarmonySampler]);

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
    if (drumPattern && drumPattern.id !== 'no-drums' && drumSynthsRef.current.kick) {
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

    // --- Schedule Harmony Layers — using REAL samplers ---
    const chords = CHORD_PROGRESSIONS[scaleKey] || CHORD_PROGRESSIONS['D-major'];
    const enabledLayers = harmonyLayers.filter(l => l.enabled);
    enabledLayers.forEach((layer) => {
      const sampler = getHarmonySampler(layer.id);
      if (!sampler) return;
      // Set volume from layer
      sampler.volume.value = -30 + (layer.volume / 100) * 24;
      for (let bar = 0; bar < totalBars; bar++) {
        const chord = chords[bar % chords.length];
        const absoluteTime = bar * barDuration;
        // Stagger chord notes slightly for natural attack
        chord.forEach((note, ni) => {
          const t = setTimeout(() => {
            try { sampler.triggerAttackRelease(note, '1n'); } catch { /* ignore */ }
          }, (absoluteTime + ni * 0.02) * 1000);
          scheduledTimeoutsRef.current.push(t);
        });
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
  }, [initialize, getMelodyInstrument, getHarmonySampler]);

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

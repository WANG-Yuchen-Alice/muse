/**
 * Pitch Detection — Spotify Basic Pitch ML + Time-Window Melody Sampling
 *
 * Strategy:
 * 1. Use Basic Pitch (ML model) with LOW thresholds to detect ALL notes accurately
 * 2. Sample the output: divide time into windows, pick the STRONGEST note per window
 * 3. Merge adjacent identical notes and remove tiny noise fragments
 *
 * This preserves Basic Pitch's accurate pitch detection while reducing
 * the polyphonic output to a clean monophonic melody line.
 */
import { BasicPitch, type NoteEventTime } from "@spotify/basic-pitch";
import {
  addPitchBendsToNoteEvents,
  noteFramesToTime,
  outputToNotesPoly,
} from "@spotify/basic-pitch";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export interface DetectedNote {
  note: string; // e.g. "C4", "A#5"
  freq: number; // frequency in Hz
  startTime: number; // seconds from start
  duration: number; // seconds
  midiNumber: number; // MIDI note number
  amplitude: number; // 0-1
}

/**
 * Get the frequency for a given note name (e.g. "C4" -> 261.63)
 */
export function noteToFreq(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 440;
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteIdx = NOTE_NAMES.indexOf(name);
  if (noteIdx === -1) return 440;
  const midiNumber = (octave + 1) * 12 + noteIdx;
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIdx = midi % 12;
  return `${NOTE_NAMES[noteIdx]}${octave}`;
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Analyze a hum audio blob and extract the main melody as piano notes.
 *
 * Uses Spotify Basic Pitch for accurate pitch detection, then applies
 * time-window sampling to extract only the main melody line.
 */
export async function analyzeHumToNotes(
  audioBlob: Blob,
  onProgress?: (pct: number) => void
): Promise<DetectedNote[]> {
  onProgress?.(0);

  // Decode audio to AudioBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 22050 });
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  onProgress?.(10);

  // Initialize Basic Pitch with the model from public directory
  const modelUrl = "/models/basic-pitch/model.json";
  const basicPitch = new BasicPitch(modelUrl);

  // Run the ML model
  let frames: number[][] = [];
  let onsets: number[][] = [];
  let contours: number[][] = [];

  await basicPitch.evaluateModel(
    audioBuffer,
    (f, o, c) => {
      frames = [...frames, ...f];
      onsets = [...onsets, ...o];
      contours = [...contours, ...c];
    },
    (pct) => {
      // Map model progress to 10-70% of total
      onProgress?.(10 + pct * 60);
    }
  );

  onProgress?.(70);

  // Convert to note events with LOW thresholds to capture everything
  // We want ALL the real notes — we'll filter later with sampling
  const noteEvents = outputToNotesPoly(
    frames,
    onsets,
    0.25, // onsetThresh — low to catch all note starts
    0.15, // frameThresh — low to catch all sustained notes
    5, // minNoteLen in frames (~50ms)
    true, // inferOnsets
    null, // maxFreq — no limit
    null, // minFreq — no limit
    true, // melodiaTrick — helps with monophonic input!
    11 // energyTolerance
  );

  // Add pitch bends and convert to timed events
  const withBends = addPitchBendsToNoteEvents(contours, noteEvents);
  const timedNotes = noteFramesToTime(withBends);

  onProgress?.(80);

  // ===== MELODY EXTRACTION: Time-Window Sampling =====
  const melody = extractMelodyByTimeWindows(timedNotes);

  onProgress?.(85);

  // ===== SNAP TO NATURAL NOTES (remove semitones) =====
  // Sharps/flats from humming are usually transition glides, not intentional notes.
  // Snap each note to the nearest natural note (C, D, E, F, G, A, B).
  const snapped = snapToNaturalNotes(melody);

  onProgress?.(90);

  // Convert to our DetectedNote format
  const detectedNotes: DetectedNote[] = snapped.map((n) => ({
    note: midiToNoteName(n.pitchMidi),
    freq: midiToHz(n.pitchMidi),
    startTime: n.startTimeSeconds,
    duration: n.durationSeconds,
    midiNumber: n.pitchMidi,
    amplitude: n.amplitude,
  }));

  onProgress?.(100);

  // Clean up
  await audioCtx.close();

  return detectedNotes;
}

/**
 * Extract the main melody from polyphonic note events using time-window sampling.
 *
 * Algorithm:
 * 1. Divide the audio timeline into fixed-size windows (e.g., 0.15s each)
 * 2. For each window, find all notes that are active (overlapping)
 * 3. Pick the note with the HIGHEST amplitude in that window
 * 4. Merge consecutive windows that picked the same pitch
 * 5. Remove very short fragments (likely noise)
 */
function extractMelodyByTimeWindows(
  notes: NoteEventTime[]
): NoteEventTime[] {
  if (notes.length === 0) return [];

  // Find the time range
  const maxEnd = Math.max(
    ...notes.map((n) => n.startTimeSeconds + n.durationSeconds)
  );

  // Time window size — 0.12s gives good resolution for humming
  // (typical hum note is 0.2-0.5s, so we sample ~2-4 times per note)
  const WINDOW_SIZE = 0.12;
  const numWindows = Math.ceil(maxEnd / WINDOW_SIZE);

  // For each window, find the strongest note
  const windowNotes: (NoteEventTime | null)[] = [];

  for (let w = 0; w < numWindows; w++) {
    const windowStart = w * WINDOW_SIZE;
    const windowEnd = windowStart + WINDOW_SIZE;
    const windowMid = windowStart + WINDOW_SIZE / 2;

    // Find all notes active during this window
    const activeNotes = notes.filter((n) => {
      const noteEnd = n.startTimeSeconds + n.durationSeconds;
      return n.startTimeSeconds < windowEnd && noteEnd > windowStart;
    });

    if (activeNotes.length === 0) {
      windowNotes.push(null);
      continue;
    }

    // Pick the note with the highest amplitude
    // If amplitudes are similar (within 20%), prefer the one closest to the previous note
    // to maintain melodic continuity
    const sorted = [...activeNotes].sort(
      (a, b) => b.amplitude - a.amplitude
    );
    windowNotes.push(sorted[0]);
  }

  // Convert window selections to a melody sequence
  // Merge consecutive windows with the same pitch
  const mergedNotes: NoteEventTime[] = [];
  let currentNote: NoteEventTime | null = null;
  let currentStart = 0;
  let currentWindows = 0;

  for (let w = 0; w < windowNotes.length; w++) {
    const wn = windowNotes[w];

    if (wn === null) {
      // Gap — finalize current note if any
      if (currentNote && currentWindows > 0) {
        mergedNotes.push({
          startTimeSeconds: currentStart,
          durationSeconds: currentWindows * WINDOW_SIZE,
          pitchMidi: currentNote.pitchMidi,
          amplitude: currentNote.amplitude,
        });
      }
      currentNote = null;
      currentWindows = 0;
      continue;
    }

    if (
      currentNote &&
      Math.abs(wn.pitchMidi - currentNote.pitchMidi) <= 0 // Same exact pitch
    ) {
      // Same pitch — extend current note
      currentWindows++;
      // Keep the higher amplitude
      if (wn.amplitude > currentNote.amplitude) {
        currentNote = wn;
      }
    } else {
      // Different pitch — finalize current and start new
      if (currentNote && currentWindows > 0) {
        mergedNotes.push({
          startTimeSeconds: currentStart,
          durationSeconds: currentWindows * WINDOW_SIZE,
          pitchMidi: currentNote.pitchMidi,
          amplitude: currentNote.amplitude,
        });
      }
      currentNote = wn;
      currentStart = w * WINDOW_SIZE;
      currentWindows = 1;
    }
  }

  // Finalize last note
  if (currentNote && currentWindows > 0) {
    mergedNotes.push({
      startTimeSeconds: currentStart,
      durationSeconds: currentWindows * WINDOW_SIZE,
      pitchMidi: currentNote.pitchMidi,
      amplitude: currentNote.amplitude,
    });
  }

  // Remove very short notes (< 0.08s) — likely noise
  const MIN_NOTE_DURATION = 0.08;
  const cleaned = mergedNotes.filter(
    (n) => n.durationSeconds >= MIN_NOTE_DURATION
  );

  return cleaned;
}

/**
 * Snap all notes to the nearest natural note (no sharps/flats).
 * MIDI note numbers for sharps: 1(C#), 3(D#), 6(F#), 8(G#), 10(A#) within each octave.
 * Each sharp is snapped DOWN to the natural below it (e.g., C#→C, F#→F).
 * After snapping, merge consecutive notes that now have the same pitch.
 */
function snapToNaturalNotes(
  notes: NoteEventTime[]
): NoteEventTime[] {
  // Natural note indices within an octave: C=0, D=2, E=4, F=5, G=7, A=9, B=11
  // Sharp indices: C#=1, D#=3, F#=6, G#=8, A#=10
  // Snap map: sharp → nearest natural below
  const snapDown: Record<number, number> = {
    1: 0,   // C# → C
    3: 2,   // D# → D
    6: 5,   // F# → F
    8: 7,   // G# → G
    10: 9,  // A# → A
  };

  // Snap each note
  const snappedNotes: NoteEventTime[] = notes.map((n) => {
    const noteInOctave = n.pitchMidi % 12;
    if (noteInOctave in snapDown) {
      const offset = noteInOctave - snapDown[noteInOctave];
      return { ...n, pitchMidi: n.pitchMidi - offset };
    }
    return n;
  });

  // Merge consecutive notes with the same pitch after snapping
  const merged: NoteEventTime[] = [];
  for (const note of snappedNotes) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.pitchMidi === note.pitchMidi &&
      note.startTimeSeconds - (prev.startTimeSeconds + prev.durationSeconds) < 0.05
    ) {
      // Extend previous note to cover this one
      prev.durationSeconds =
        note.startTimeSeconds + note.durationSeconds - prev.startTimeSeconds;
      // Keep higher amplitude
      if (note.amplitude > prev.amplitude) {
        prev.amplitude = note.amplitude;
      }
    } else {
      merged.push({ ...note });
    }
  }

  return merged;
}

/**
 * Convert detected notes to a melody description string for the music generator
 */
export function notesToMelodyDescription(notes: DetectedNote[]): string {
  if (notes.length === 0) return "";

  const noteSeq = notes.map((n) => n.note);
  const uniqueNotes = Array.from(new Set(noteSeq));
  const avgDuration =
    notes.reduce((sum, n) => sum + n.duration, 0) / notes.length;

  const tempoDesc =
    avgDuration < 0.2 ? "fast" : avgDuration < 0.4 ? "moderate" : "slow";
  const complexityDesc =
    uniqueNotes.length <= 3
      ? "simple and repetitive"
      : uniqueNotes.length <= 6
        ? "moderate"
        : "complex and varied";

  return `A piano melody with the note sequence: ${noteSeq.join(", ")}. The melody has a ${complexityDesc} pattern, played at a ${tempoDesc} tempo.`;
}

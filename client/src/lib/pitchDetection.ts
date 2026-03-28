/**
 * Pitch Detection — Using Spotify's Basic Pitch ML model + Melody Extraction
 *
 * Pipeline:
 * 1. Basic Pitch ML model detects all note events (polyphonic)
 * 2. Skyline algorithm extracts the main melody (keeps strongest note at each time)
 * 3. Amplitude filtering removes weak harmonics/noise
 * 4. Temporal smoothing merges fragmented notes and removes isolated blips
 *
 * Result: a clean monophonic melody from a hummed recording.
 */

import {
  BasicPitch,
  noteFramesToTime,
  addPitchBendsToNoteEvents,
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
 * Convert MIDI number to note name
 */
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIdx = midi % 12;
  return `${NOTE_NAMES[noteIdx]}${octave}`;
}

/**
 * Convert MIDI number to frequency in Hz
 */
function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
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

// Cache the model instance so we don't reload it on every analysis
let cachedBasicPitch: BasicPitch | null = null;

function getBasicPitch(): BasicPitch {
  if (!cachedBasicPitch) {
    // Model files are copied to public/models/ for reliable browser loading
    cachedBasicPitch = new BasicPitch("/models/model.json");
  }
  return cachedBasicPitch;
}

// ─── Melody Extraction Algorithms ───────────────────────────────────────────

interface RawNote {
  startTime: number;
  duration: number;
  pitchMidi: number;
  amplitude: number;
}

/**
 * Skyline Algorithm — Classic melody extraction.
 * At each point in time, keep only the note with the highest amplitude.
 * For humming, the fundamental is typically the loudest, while harmonics are weaker.
 *
 * We use amplitude (not pitch) as the primary selector because humming
 * produces a strong fundamental with weaker overtones.
 */
function skylineExtract(notes: RawNote[]): RawNote[] {
  if (notes.length <= 1) return notes;

  // Sort by start time
  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);

  // Build a timeline: for each time slot, find overlapping notes and keep the strongest
  const result: RawNote[] = [];
  const used = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;

    const note = sorted[i];
    const noteEnd = note.startTime + note.duration;

    // Find all notes overlapping with this one
    let bestIdx = i;
    let bestAmplitude = note.amplitude;

    for (let j = 0; j < sorted.length; j++) {
      if (i === j || used.has(j)) continue;
      const other = sorted[j];
      const otherEnd = other.startTime + other.duration;

      // Check overlap: two intervals overlap if start1 < end2 && start2 < end1
      const overlapStart = Math.max(note.startTime, other.startTime);
      const overlapEnd = Math.min(noteEnd, otherEnd);

      if (overlapStart < overlapEnd) {
        // They overlap — keep the one with higher amplitude
        if (other.amplitude > bestAmplitude) {
          bestAmplitude = other.amplitude;
          bestIdx = j;
        }
        used.add(j); // mark the loser as used
      }
    }

    used.add(i);
    result.push(sorted[bestIdx]);
  }

  return result.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Amplitude-based filtering.
 * Remove notes whose amplitude is below a threshold relative to the max amplitude.
 * This removes weak harmonics and noise.
 */
function filterByAmplitude(
  notes: RawNote[],
  relativeThreshold: number = 0.25
): RawNote[] {
  if (notes.length === 0) return notes;
  const maxAmp = Math.max(...notes.map((n) => n.amplitude));
  const threshold = maxAmp * relativeThreshold;
  return notes.filter((n) => n.amplitude >= threshold);
}

/**
 * Merge consecutive notes that are the same pitch (within tolerance).
 * Humming often produces fragmented detections of the same note.
 */
function mergeConsecutiveNotes(
  notes: RawNote[],
  maxGap: number = 0.15, // max gap in seconds to merge
  semitoneTolerance: number = 1 // merge notes within this many semitones
): RawNote[] {
  if (notes.length <= 1) return notes;

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);
  const merged: RawNote[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    const prevEnd = prev.startTime + prev.duration;
    const gap = curr.startTime - prevEnd;
    const pitchDiff = Math.abs(curr.pitchMidi - prev.pitchMidi);

    if (gap <= maxGap && pitchDiff <= semitoneTolerance) {
      // Merge: extend previous note to cover current
      const newEnd = Math.max(prevEnd, curr.startTime + curr.duration);
      prev.duration = newEnd - prev.startTime;
      // Keep the higher amplitude
      prev.amplitude = Math.max(prev.amplitude, curr.amplitude);
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

/**
 * Remove isolated short notes that are likely noise.
 * A note is "isolated" if it has no nearby neighbors (within gapThreshold).
 */
function removeIsolatedNotes(
  notes: RawNote[],
  minDuration: number = 0.1,
  gapThreshold: number = 0.5
): RawNote[] {
  if (notes.length <= 2) return notes;

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);

  return sorted.filter((note, i) => {
    // Keep notes that are long enough
    if (note.duration >= minDuration) return true;

    // Check if there's a neighbor within gapThreshold
    const prevEnd =
      i > 0 ? sorted[i - 1].startTime + sorted[i - 1].duration : -Infinity;
    const nextStart =
      i < sorted.length - 1 ? sorted[i + 1].startTime : Infinity;

    const gapBefore = note.startTime - prevEnd;
    const gapAfter = nextStart - (note.startTime + note.duration);

    // If both gaps are large, this note is isolated → remove it
    return !(gapBefore > gapThreshold && gapAfter > gapThreshold);
  });
}

// ─── Main Analysis Function ─────────────────────────────────────────────────

/**
 * Analyze a hummed audio blob and return detected musical notes
 * using Spotify's Basic Pitch ML model + melody extraction pipeline.
 */
export async function analyzeHumToNotes(
  audioBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<DetectedNote[]> {
  // Decode audio with browser's AudioContext at 22050 Hz (Basic Pitch requirement)
  const arrayBuffer = await audioBlob.arrayBuffer();
  const tempCtx = new AudioContext({ sampleRate: 22050 });
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } finally {
    await tempCtx.close();
  }

  const basicPitch = getBasicPitch();

  // Collect model output
  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];

  await basicPitch.evaluateModel(
    audioBuffer,
    (f: number[][], o: number[][], c: number[][]) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (percent: number) => {
      onProgress?.(percent);
    }
  );

  // Step 1: Convert raw output to note events with HIGHER thresholds
  // Higher thresholds = fewer but more confident notes
  const noteEvents = outputToNotesPoly(
    frames,
    onsets,
    0.5, // onset threshold — higher to only catch clear note starts
    0.4, // frame threshold — higher to ignore weak harmonics
    8, // min note length in frames — longer to skip noise blips
    true, // infer onsets
    null, // max freq
    null, // min freq
    false // melodia trick OFF — we do our own melody extraction below
  );

  // Add pitch bends and convert to timed events
  const notesWithBends = addPitchBendsToNoteEvents(contours, noteEvents);
  const timedNotes = noteFramesToTime(notesWithBends);

  // Convert to our internal format
  let rawNotes: RawNote[] = timedNotes
    .filter((n) => n.durationSeconds > 0.05)
    .map((n) => ({
      startTime: n.startTimeSeconds,
      duration: n.durationSeconds,
      pitchMidi: n.pitchMidi,
      amplitude: n.amplitude,
    }));

  // Step 2: Amplitude filtering — remove notes weaker than 25% of the strongest
  rawNotes = filterByAmplitude(rawNotes, 0.25);

  // Step 3: Skyline algorithm — at each time point, keep only the strongest note
  rawNotes = skylineExtract(rawNotes);

  // Step 4: Merge fragmented consecutive same-pitch notes
  rawNotes = mergeConsecutiveNotes(rawNotes, 0.15, 1);

  // Step 5: Remove isolated short notes (noise blips)
  rawNotes = removeIsolatedNotes(rawNotes, 0.1, 0.5);

  // Convert to DetectedNote format and quantize to piano range
  const detectedNotes: DetectedNote[] = rawNotes.map((n) => {
    let midi = n.pitchMidi;
    // Transpose to C4-B5 range (MIDI 60-83) for piano visualization
    while (midi < 60) midi += 12;
    while (midi > 83) midi -= 12;

    return {
      note: midiToNoteName(midi),
      freq: midiToHz(midi),
      startTime: n.startTime,
      duration: n.duration,
      midiNumber: midi,
      amplitude: n.amplitude,
    };
  });

  return detectedNotes;
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

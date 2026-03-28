/**
 * Pitch Detection — Using Spotify's Basic Pitch ML model
 *
 * Converts hummed audio to musical note events using a lightweight neural network.
 * Much more accurate than traditional DSP-based pitch detection (YIN, autocorrelation).
 *
 * Basic Pitch outputs NoteEventTime objects with:
 *   - startTimeSeconds, durationSeconds, pitchMidi, amplitude, pitchBends
 *
 * We convert pitchMidi → note name (e.g. "C4", "F#5") for our UI.
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
    // TensorFlow.js loadGraphModel will fetch model.json and its weight shard
    cachedBasicPitch = new BasicPitch("/models/model.json");
  }
  return cachedBasicPitch;
}

/**
 * Analyze a hummed audio blob and return detected musical notes
 * using Spotify's Basic Pitch ML model.
 */
export async function analyzeHumToNotes(
  audioBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<DetectedNote[]> {
  // Decode audio with browser's AudioContext
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

  // Convert raw output to note events
  // For humming: use lower thresholds to capture softer notes
  const noteEvents = outputToNotesPoly(
    frames,
    onsets,
    0.3, // onset threshold (lower = more sensitive)
    0.2, // frame threshold (lower = more sensitive)
    5, // min note length in frames
    true, // infer onsets
    null, // max freq (no limit)
    null, // min freq (no limit)
    true // melodia trick (helps with monophonic melodies like humming)
  );

  // Add pitch bends and convert to timed events
  const notesWithBends = addPitchBendsToNoteEvents(contours, noteEvents);
  const timedNotes = noteFramesToTime(notesWithBends);

  // Convert to our DetectedNote format and quantize to piano range
  const detectedNotes: DetectedNote[] = timedNotes
    .filter((n) => n.durationSeconds > 0.05) // filter very short noise notes
    .map((n) => {
      let midi = n.pitchMidi;
      // Transpose to C4-B5 range (MIDI 60-83) if needed for piano visualization
      while (midi < 60) midi += 12;
      while (midi > 83) midi -= 12;

      return {
        note: midiToNoteName(midi),
        freq: midiToHz(midi),
        startTime: n.startTimeSeconds,
        duration: n.durationSeconds,
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

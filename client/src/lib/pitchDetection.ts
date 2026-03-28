/**
 * Pitch Detection — Using Gemini AI (server-side) for accurate hum-to-notes
 *
 * The audio is sent to the server where Gemini analyzes it and returns
 * a clean monophonic melody as structured note data.
 * This replaces the previous browser-side Basic Pitch ML approach.
 */

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

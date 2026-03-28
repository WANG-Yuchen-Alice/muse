/**
 * Hum → Piano Keys Conversion
 * Uses YIN pitch detection algorithm to extract notes from a hum recording.
 * Returns a sequence of {note, startTime, duration} that can be played back on the piano.
 */

// Note names for mapping
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Piano range: C3 to C6 (roughly 130Hz to 1046Hz)
const MIN_FREQ = 80;
const MAX_FREQ = 1200;

export interface DetectedNote {
  note: string; // e.g. "C4", "A#5"
  freq: number; // detected frequency in Hz
  startTime: number; // seconds from start
  duration: number; // seconds
  midiNumber: number; // MIDI note number
}

/**
 * Convert frequency to note name and MIDI number
 */
function freqToNote(freq: number): { note: string; midiNumber: number } | null {
  if (freq < MIN_FREQ || freq > MAX_FREQ) return null;
  const midiNumber = Math.round(12 * Math.log2(freq / 440) + 69);
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIdx = midiNumber % 12;
  return {
    note: `${NOTE_NAMES[noteIdx]}${octave}`,
    midiNumber,
  };
}

/**
 * Simple YIN-based pitch detection for a single frame
 * Returns frequency in Hz or null if no pitch detected
 */
function detectPitchYIN(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length;
  const halfSize = Math.floor(SIZE / 2);

  // Check if there's enough signal
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // too quiet

  // YIN difference function
  const yinBuffer = new Float32Array(halfSize);
  for (let tau = 0; tau < halfSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // Absolute threshold
  const threshold = 0.15;
  let tauEstimate = -1;

  for (let tau = 2; tau < halfSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return null;

  // Parabolic interpolation for better accuracy
  let betterTau: number;
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 = tauEstimate + 1 < halfSize ? tauEstimate + 1 : tauEstimate;

  if (x0 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
  } else if (x2 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];
    betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  return sampleRate / betterTau;
}

/**
 * Analyze an audio blob and extract a sequence of musical notes.
 * This is the main function for hum-to-piano-keys conversion.
 */
export async function analyzeHumToNotes(
  audioBlob: Blob,
  options?: {
    frameSize?: number; // samples per analysis frame (default 2048)
    hopSize?: number; // samples between frames (default 512)
    minNoteDuration?: number; // minimum note duration in seconds (default 0.08)
    mergeThreshold?: number; // merge notes within this many semitones (default 1)
  }
): Promise<DetectedNote[]> {
  const frameSize = options?.frameSize ?? 2048;
  const hopSize = options?.hopSize ?? 512;
  const minNoteDuration = options?.minNoteDuration ?? 0.08;

  // Decode audio
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);

  // Detect pitch for each frame
  const rawPitches: { freq: number | null; time: number }[] = [];

  for (let i = 0; i + frameSize <= channelData.length; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize);
    const freq = detectPitchYIN(frame, sampleRate);
    const time = i / sampleRate;

    if (freq && freq >= MIN_FREQ && freq <= MAX_FREQ) {
      rawPitches.push({ freq, time });
    } else {
      rawPitches.push({ freq: null, time });
    }
  }

  // Group consecutive same-note frames into notes
  const notes: DetectedNote[] = [];
  let currentNote: { note: string; freq: number; midiNumber: number; startTime: number; endTime: number } | null = null;

  for (const pitch of rawPitches) {
    if (pitch.freq === null) {
      // Silence — close current note
      if (currentNote) {
        currentNote.endTime = pitch.time;
        notes.push({
          note: currentNote.note,
          freq: currentNote.freq,
          startTime: currentNote.startTime,
          duration: currentNote.endTime - currentNote.startTime,
          midiNumber: currentNote.midiNumber,
        });
        currentNote = null;
      }
      continue;
    }

    const noteInfo = freqToNote(pitch.freq);
    if (!noteInfo) {
      if (currentNote) {
        currentNote.endTime = pitch.time;
        notes.push({
          note: currentNote.note,
          freq: currentNote.freq,
          startTime: currentNote.startTime,
          duration: currentNote.endTime - currentNote.startTime,
          midiNumber: currentNote.midiNumber,
        });
        currentNote = null;
      }
      continue;
    }

    if (currentNote && currentNote.midiNumber === noteInfo.midiNumber) {
      // Same note — extend
      currentNote.endTime = pitch.time + hopSize / sampleRate;
    } else {
      // Different note — close previous, start new
      if (currentNote) {
        currentNote.endTime = pitch.time;
        notes.push({
          note: currentNote.note,
          freq: currentNote.freq,
          startTime: currentNote.startTime,
          duration: currentNote.endTime - currentNote.startTime,
          midiNumber: currentNote.midiNumber,
        });
      }
      currentNote = {
        note: noteInfo.note,
        freq: pitch.freq,
        midiNumber: noteInfo.midiNumber,
        startTime: pitch.time,
        endTime: pitch.time + hopSize / sampleRate,
      };
    }
  }

  // Close last note
  if (currentNote) {
    notes.push({
      note: currentNote.note,
      freq: currentNote.freq,
      startTime: currentNote.startTime,
      duration: currentNote.endTime - currentNote.startTime,
      midiNumber: currentNote.midiNumber,
    });
  }

  // Filter out very short notes (noise)
  const filtered = notes.filter((n) => n.duration >= minNoteDuration);

  // Quantize to piano range (C4-B5 = MIDI 60-83)
  // If notes are outside this range, transpose to fit
  const quantized = filtered.map((n) => {
    let midi = n.midiNumber;
    // Transpose to C4-B5 range if needed
    while (midi < 60) midi += 12;
    while (midi > 83) midi -= 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteIdx = midi % 12;
    return {
      ...n,
      note: `${NOTE_NAMES[noteIdx]}${octave}`,
      midiNumber: midi,
    };
  });

  return quantized;
}

/**
 * Convert detected notes to a melody description string for the music generator
 */
export function notesToMelodyDescription(notes: DetectedNote[]): string {
  if (notes.length === 0) return "";

  const noteSeq = notes.map((n) => n.note);
  const uniqueNotes = Array.from(new Set(noteSeq));
  const avgDuration = notes.reduce((sum, n) => sum + n.duration, 0) / notes.length;

  const tempoDesc = avgDuration < 0.2 ? "fast" : avgDuration < 0.4 ? "moderate" : "slow";
  const complexityDesc =
    uniqueNotes.length <= 3
      ? "simple and repetitive"
      : uniqueNotes.length <= 6
        ? "moderate"
        : "complex and varied";

  return `A piano melody with the note sequence: ${noteSeq.join(", ")}. The melody has a ${complexityDesc} pattern, played at a ${tempoDesc} tempo.`;
}

/**
 * Get the frequency for a given note name (e.g. "C4" -> 261.63)
 */
export function noteToFreq(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteIdx = NOTE_NAMES.indexOf(name);
  if (noteIdx === -1) return 440;
  const midiNumber = (octave + 1) * 12 + noteIdx;
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

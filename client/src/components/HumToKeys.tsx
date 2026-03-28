/**
 * HumToKeys — Hum-to-Piano-Keys Conversion & Verification UI
 * 
 * After recording a hum, this component:
 * 1. Analyzes the audio to detect pitch/notes
 * 2. Shows detected notes on a mini piano visualization
 * 3. Allows playback of detected notes for verification
 * 4. Generates a new audio blob from the piano notes for the music generator
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Loader2, Music, Piano, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analyzeHumToNotes,
  noteToFreq,
  type DetectedNote,
} from "@/lib/pitchDetection";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Piano keys C4 to B5
const PIANO_NOTES = (() => {
  const notes: { note: string; freq: number; isBlack: boolean; midiNumber: number }[] = [];
  for (let midi = 60; midi <= 83; midi++) {
    const octave = Math.floor(midi / 12) - 1;
    const noteIdx = midi % 12;
    const name = NOTE_NAMES[noteIdx];
    notes.push({
      note: `${name}${octave}`,
      freq: 440 * Math.pow(2, (midi - 69) / 12),
      isBlack: name.includes("#"),
      midiNumber: midi,
    });
  }
  return notes;
})();

const WHITE_KEYS = PIANO_NOTES.filter((n) => !n.isBlack);

interface HumToKeysProps {
  audioBlob: Blob;
  onConfirm: (notes: DetectedNote[], pianoAudioBlob: Blob) => void;
  onRerecord: () => void;
}

export default function HumToKeys({ audioBlob, onConfirm, onRerecord }: HumToKeysProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedNotes, setDetectedNotes] = useState<DetectedNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);
  const [confirmed, setConfirmed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackTimeoutRef = useRef<number[]>([]);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  // Analyze on mount
  useEffect(() => {
    let cancelled = false;
    const analyze = async () => {
      setAnalyzing(true);
      setError(null);
      try {
        const notes = await analyzeHumToNotes(audioBlob);
        if (!cancelled) {
          setDetectedNotes(notes);
          if (notes.length === 0) {
            setError("No clear melody detected. Try humming louder or more distinctly.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Pitch detection failed:", err);
          setError("Failed to analyze audio. Please try again.");
        }
      } finally {
        if (!cancelled) setAnalyzing(false);
      }
    };
    analyze();
    return () => { cancelled = true; };
  }, [audioBlob]);

  // Play detected notes as piano sounds
  const playNotes = useCallback(() => {
    if (!detectedNotes || detectedNotes.length === 0) return;

    // Stop any existing playback
    playbackTimeoutRef.current.forEach(clearTimeout);
    playbackTimeoutRef.current = [];

    setIsPlaying(true);
    setCurrentNoteIdx(0);

    const ctx = getAudioCtx();
    const startTime = ctx.currentTime;

    // Schedule each note
    detectedNotes.forEach((note, idx) => {
      const noteStartTime = note.startTime;
      const noteDuration = Math.min(note.duration, 0.8);

      const timeout = window.setTimeout(() => {
        setCurrentNoteIdx(idx);

        // Play the note
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = noteToFreq(note.note);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDuration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + noteDuration);
      }, noteStartTime * 1000);

      playbackTimeoutRef.current.push(timeout);
    });

    // End playback after last note
    const lastNote = detectedNotes[detectedNotes.length - 1];
    const endTimeout = window.setTimeout(() => {
      setIsPlaying(false);
      setCurrentNoteIdx(-1);
    }, (lastNote.startTime + lastNote.duration) * 1000 + 200);
    playbackTimeoutRef.current.push(endTimeout);
  }, [detectedNotes, getAudioCtx]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutRef.current.forEach(clearTimeout);
    playbackTimeoutRef.current = [];
    setIsPlaying(false);
    setCurrentNoteIdx(-1);
  }, []);

  // Generate piano audio blob from detected notes and confirm
  const handleConfirm = useCallback(async () => {
    if (!detectedNotes || detectedNotes.length === 0) return;

    setConfirmed(true);

    // Create an OfflineAudioContext to render piano notes to audio
    const totalDuration = detectedNotes[detectedNotes.length - 1].startTime +
      detectedNotes[detectedNotes.length - 1].duration + 0.5;
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(totalDuration * sampleRate), sampleRate);

    // Schedule all notes
    for (const note of detectedNotes) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = noteToFreq(note.note);
      const noteDuration = Math.min(note.duration, 0.8);
      gain.gain.setValueAtTime(0.3, note.startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, note.startTime + noteDuration);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(note.startTime);
      osc.stop(note.startTime + noteDuration);
    }

    // Render to buffer
    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer to WAV blob
    const wavBlob = audioBufferToWav(renderedBuffer);

    onConfirm(detectedNotes, wavBlob);
  }, [detectedNotes, onConfirm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playbackTimeoutRef.current.forEach(clearTimeout);
    };
  }, []);

  // Get active notes for piano visualization
  const activeNoteNames = new Set(
    detectedNotes?.map((n) => n.note) ?? []
  );
  const currentNoteName = currentNoteIdx >= 0 && detectedNotes ? detectedNotes[currentNoteIdx]?.note : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 w-full max-w-lg"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Piano className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Hum → Piano Keys
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {analyzing
            ? "Analyzing your hum..."
            : detectedNotes && detectedNotes.length > 0
              ? `Detected ${detectedNotes.length} notes — listen to verify`
              : "Processing..."}
        </p>
      </div>

      {/* Loading state */}
      {analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-8"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Detecting pitch from your hum...</p>
        </motion.div>
      )}

      {/* Error state */}
      {error && !analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel rounded-xl p-4 text-center"
        >
          <p className="text-sm text-amber-400 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={onRerecord} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Detected notes visualization */}
      {detectedNotes && detectedNotes.length > 0 && !analyzing && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-4"
          >
            {/* Mini piano with highlighted notes */}
            <div className="glass-panel rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-3">Detected notes on piano:</p>
              <div className="relative select-none mx-auto" style={{ height: 100, width: "100%", maxWidth: 420 }}>
                <div className="flex justify-center">
                  {WHITE_KEYS.map((key) => {
                    const isActive = activeNoteNames.has(key.note);
                    const isCurrent = currentNoteName === key.note;
                    return (
                      <div
                        key={key.note}
                        className={`relative h-24 border border-gray-600 rounded-b transition-all ${
                          isCurrent
                            ? "bg-primary shadow-lg shadow-primary/30"
                            : isActive
                              ? "bg-primary/30 border-primary/50"
                              : "bg-gray-100/90"
                        }`}
                        style={{ width: "calc(100% / 14)", minWidth: 20 }}
                      >
                        <span
                          className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] ${
                            isCurrent || isActive ? "text-primary-foreground font-bold" : "text-gray-400"
                          }`}
                        >
                          {key.note.replace(/\d/, "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Black keys overlay */}
                <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                  {WHITE_KEYS.map((key) => {
                    const blackKey = PIANO_NOTES.find((b) => {
                      if (!b.isBlack) return false;
                      const whiteIdx = PIANO_NOTES.indexOf(key);
                      return PIANO_NOTES.indexOf(b) === whiteIdx + 1;
                    });
                    if (!blackKey) {
                      return <div key={key.note} style={{ width: "calc(100% / 14)", minWidth: 20 }} />;
                    }
                    const isActive = activeNoteNames.has(blackKey.note);
                    const isCurrent = currentNoteName === blackKey.note;
                    return (
                      <div key={key.note} className="relative" style={{ width: "calc(100% / 14)", minWidth: 20 }}>
                        <div
                          className={`absolute -right-2 w-4 h-14 rounded-b transition-all ${
                            isCurrent
                              ? "bg-primary shadow-lg shadow-primary/30"
                              : isActive
                                ? "bg-primary/60"
                                : "bg-gray-900"
                          }`}
                          style={{ zIndex: 2 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Note sequence display */}
            <div className="glass-panel rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">Note sequence ({detectedNotes.length} notes):</p>
              <div className="flex flex-wrap gap-1">
                {detectedNotes.map((note, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`text-xs font-mono px-2 py-0.5 rounded-full transition-all ${
                      i === currentNoteIdx
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {note.note}
                    <span className="text-[9px] opacity-50 ml-0.5">
                      {note.duration.toFixed(2)}s
                    </span>
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={isPlaying ? stopPlayback : playNotes}
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Preview Piano Notes
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={onRerecord}
                className="gap-2 text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Re-record
              </Button>
            </div>

            {/* Confirm button */}
            {!confirmed && (
              <Button
                onClick={handleConfirm}
                className="gap-2 gradient-cosmic text-background font-semibold h-11 rounded-full border-0 hover:opacity-90 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Sounds Good — Use These Notes
              </Button>
            )}

            {confirmed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-green-400 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Notes confirmed! Choose a style below.
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

/**
 * Convert an AudioBuffer to a WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

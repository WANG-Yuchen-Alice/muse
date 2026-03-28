/**
 * Muse — Input Page
 * Record a hum or play a 2-octave piano keyboard, then generate music.
 * Hum mode: record → verify piano keys → choose style → generate
 * Piano mode: play → choose style → generate
 * Includes "My Music Vault" section showing recent sessions.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Piano, Wand2, Trash2, Music, Play, Pause, ChevronRight, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import HumToKeys from "@/components/HumToKeys";
import { notesToMelodyDescription, type DetectedNote } from "@/lib/pitchDetection";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

// 2 octaves: C4 to B5
const NOTES = [
  { note: "C4", freq: 261.63, isBlack: false },
  { note: "C#4", freq: 277.18, isBlack: true },
  { note: "D4", freq: 293.66, isBlack: false },
  { note: "D#4", freq: 311.13, isBlack: true },
  { note: "E4", freq: 329.63, isBlack: false },
  { note: "F4", freq: 349.23, isBlack: false },
  { note: "F#4", freq: 369.99, isBlack: true },
  { note: "G4", freq: 392.0, isBlack: false },
  { note: "G#4", freq: 415.3, isBlack: true },
  { note: "A4", freq: 440.0, isBlack: false },
  { note: "A#4", freq: 466.16, isBlack: true },
  { note: "B4", freq: 493.88, isBlack: false },
  { note: "C5", freq: 523.25, isBlack: false },
  { note: "C#5", freq: 554.37, isBlack: true },
  { note: "D5", freq: 587.33, isBlack: false },
  { note: "D#5", freq: 622.25, isBlack: true },
  { note: "E5", freq: 659.25, isBlack: false },
  { note: "F5", freq: 698.46, isBlack: false },
  { note: "F#5", freq: 739.99, isBlack: true },
  { note: "G5", freq: 783.99, isBlack: false },
  { note: "G#5", freq: 830.61, isBlack: true },
  { note: "A5", freq: 880.0, isBlack: false },
  { note: "A#5", freq: 932.33, isBlack: true },
  { note: "B5", freq: 987.77, isBlack: false },
];

const WHITE_KEYS = NOTES.filter((n) => !n.isBlack);
const BLACK_KEYS = NOTES.filter((n) => n.isBlack);

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function freqToNoteName(freq: number): string {
  const noteNum = 12 * Math.log2(freq / 440) + 69;
  const rounded = Math.round(noteNum);
  const octave = Math.floor(rounded / 12) - 1;
  const name = NOTE_NAMES[rounded % 12];
  return `${name}${octave}`;
}

type InputMode = "hum" | "piano";

// Hum flow stages: "record" → "verify" → "ready"
type HumStage = "record" | "verify" | "ready";

function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null;

  const correlations = new Float32Array(MAX_SAMPLES);
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    correlations[offset] = correlation;

    if (correlation > 0.9 && correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.01 && bestOffset > 0) {
    return sampleRate / bestOffset;
  }
  return null;
}

// Style colors for vault track thumbnails
const STYLE_COLORS: Record<string, string> = {
  "lofi": "#FF6B9D",
  "cinematic": "#00E5FF",
  "jazz": "#FFB800",
  "electronic": "#A78BFA",
  "tiktok": "#FF3B5C",
  "upbeat": "#22D3EE",
  "rock": "#EF4444",
  "rnb": "#F472B6",
  "classical": "#D4A574",
  "edm": "#10B981",
};

function getStyleColor(style: string): string {
  const key = style.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(STYLE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "#888";
}

export default function Home() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<InputMode>("hum");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Hum flow: multi-stage
  const [humStage, setHumStage] = useState<HumStage>("record");
  const [humAudioBlob, setHumAudioBlob] = useState<Blob | null>(null); // raw hum recording
  const [pianoAudioBlob, setPianoAudioBlob] = useState<Blob | null>(null); // converted piano audio
  const [confirmedNotes, setConfirmedNotes] = useState<DetectedNote[]>([]);
  const [melodyDescription, setMelodyDescription] = useState("");

  const [detectedNotes, setDetectedNotes] = useState<string[]>([]);
  const [playedNotes, setPlayedNotes] = useState<{ note: string; time: number }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pitchIntervalRef = useRef<number | null>(null);

  // Piano recording state
  const pianoRecorderRef = useRef<MediaRecorder | null>(null);
  const pianoDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const pianoChunksRef = useRef<Blob[]>([]);
  const [isPianoRecording, setIsPianoRecording] = useState(false);
  const [pianoRecordTime, setPianoRecordTime] = useState(0);
  const pianoTimerRef = useRef<number | null>(null);
  const pianoStartTimeRef = useRef<number>(0);

  // Vault: mini audio player
  const [vaultPlayingUrl, setVaultPlayingUrl] = useState<string | null>(null);
  const vaultAudioRef = useRef<HTMLAudioElement | null>(null);

  // Style selection: exactly 1 style
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["lofi"]);

  const uploadAudio = trpc.music.uploadAudio.useMutation();

  // Fetch all available styles from backend
  const { data: allStyles } = trpc.music.getStyles.useQuery();

  // Fetch recent sessions for My Music Vault
  const { data: galleryData } = trpc.gallery.listSessions.useQuery({ limit: 6, offset: 0 });

  const toggleStyle = useCallback((styleId: string) => {
    // Single-select: always switch to the clicked style
    setSelectedStyles([styleId]);
  }, []);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  // ---- Hum Recording with Pitch Detection ----
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = getAudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setHumAudioBlob(blob);
        // Move to verify stage
        setHumStage("verify");
        stream.getTracks().forEach((tr) => tr.stop());
        if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);
      setDetectedNotes([]);

      const buffer = new Float32Array(analyser.fftSize);
      const notes: string[] = [];
      let lastNote = "";

      pitchIntervalRef.current = window.setInterval(() => {
        analyser.getFloatTimeDomainData(buffer);
        const freq = detectPitch(buffer, ctx.sampleRate);
        if (freq && freq > 80 && freq < 1200) {
          const noteName = freqToNoteName(freq);
          if (noteName !== lastNote) {
            notes.push(noteName);
            lastNote = noteName;
            setDetectedNotes([...notes]);
          }
        }
      }, 100);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 10) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
            return 10;
          }
          return t + 0.1;
        });
      }, 100);
    } catch {
      alert("Microphone access is required to record your hum.");
    }
  }, [getAudioCtx]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
  }, []);

  // ---- HumToKeys Confirm Callback ----
  // When user confirms the piano keys from hum detection
  const handleHumConfirm = useCallback((notes: DetectedNote[], pianoBlob: Blob) => {
    setConfirmedNotes(notes);
    setPianoAudioBlob(pianoBlob);
    setAudioBlob(pianoBlob); // Use the piano audio for generation
    setHasRecording(true);
    setHumStage("ready");
    // Generate melody description from confirmed notes
    setMelodyDescription(notesToMelodyDescription(notes));
  }, []);

  // ---- HumToKeys Re-record Callback ----
  const handleHumRerecord = useCallback(() => {
    setHumAudioBlob(null);
    setPianoAudioBlob(null);
    setConfirmedNotes([]);
    setMelodyDescription("");
    setHumStage("record");
    setHasRecording(false);
    setAudioBlob(null);
    setDetectedNotes([]);
    setRecordingTime(0);
  }, []);

  // ---- Piano Playback ----
  const playNote = useCallback(
    (freq: number, noteName: string) => {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (pianoDestRef.current) {
        gain.connect(pianoDestRef.current);
      }
      osc.start();
      osc.stop(ctx.currentTime + 0.8);

      if (isPianoRecording) {
        const elapsed = (Date.now() - pianoStartTimeRef.current) / 1000;
        setPlayedNotes((prev) => [...prev, { note: noteName, time: elapsed }]);
      }
    },
    [getAudioCtx, isPianoRecording]
  );

  // ---- Piano Recording ----
  const startPianoRecording = useCallback(() => {
    const ctx = getAudioCtx();
    const dest = ctx.createMediaStreamDestination();
    pianoDestRef.current = dest;
    const recorder = new MediaRecorder(dest.stream, { mimeType: "audio/webm" });
    pianoChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) pianoChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(pianoChunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setHasRecording(true);
      pianoDestRef.current = null;
    };
    pianoRecorderRef.current = recorder;
    recorder.start();

    pianoStartTimeRef.current = Date.now();
    setIsPianoRecording(true);
    setPianoRecordTime(0);
    setPlayedNotes([]);
    pianoTimerRef.current = window.setInterval(() => {
      setPianoRecordTime((t) => {
        if (t >= 10) {
          pianoRecorderRef.current?.stop();
          setIsPianoRecording(false);
          if (pianoTimerRef.current) clearInterval(pianoTimerRef.current);
          return 10;
        }
        return t + 0.1;
      });
    }, 100);
  }, [getAudioCtx]);

  const stopPianoRecording = useCallback(() => {
    pianoRecorderRef.current?.stop();
    setIsPianoRecording(false);
    if (pianoTimerRef.current) clearInterval(pianoTimerRef.current);
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setHasRecording(false);
    setRecordingTime(0);
    setPianoRecordTime(0);
    setDetectedNotes([]);
    setPlayedNotes([]);
    // Reset hum flow
    setHumStage("record");
    setHumAudioBlob(null);
    setPianoAudioBlob(null);
    setConfirmedNotes([]);
    setMelodyDescription("");
  }, []);

  // ---- Upload audio + navigate to results ----
  const handleGenerate = useCallback(async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    try {
      const buffer = await audioBlob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const { url: audioUrl } = await uploadAudio.mutateAsync({
        audioBase64: base64,
        mimeType: audioBlob.type,
      });

      let melodyDesc = "";
      if (mode === "hum") {
        // Use the melody description from confirmed piano keys
        melodyDesc = melodyDescription;
      } else if (mode === "piano" && playedNotes.length > 0) {
        const noteSeq = playedNotes.map((n) => n.note);
        melodyDesc = `A piano melody with the note sequence: ${noteSeq.join(", ")}. The melody has a ${
          noteSeq.length <= 4 ? "simple and repetitive" : noteSeq.length <= 8 ? "moderate" : "complex and varied"
        } pattern, played at a ${noteSeq.length <= 6 ? "slow" : "moderate"} tempo.`;
      }

      const stylesParam = selectedStyles.join(",");
      // For hum mode, pass mode=piano since we've converted to piano keys
      const effectiveMode = mode === "hum" ? "piano" : mode;
      navigate(
        `/results?audio=${encodeURIComponent(audioUrl)}&melody=${encodeURIComponent(melodyDesc)}&styles=${encodeURIComponent(stylesParam)}&mode=${effectiveMode}`
      );
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload audio. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, uploadAudio, mode, melodyDescription, playedNotes, navigate, selectedStyles]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pianoTimerRef.current) clearInterval(pianoTimerRef.current);
      if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    };
  }, []);

  // Vault mini player
  const toggleVaultPlay = useCallback((audioUrl: string) => {
    if (vaultPlayingUrl === audioUrl) {
      vaultAudioRef.current?.pause();
      setVaultPlayingUrl(null);
    } else {
      if (vaultAudioRef.current) {
        vaultAudioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => setVaultPlayingUrl(null);
      audio.play();
      vaultAudioRef.current = audio;
      setVaultPlayingUrl(audioUrl);
    }
  }, [vaultPlayingUrl]);

  useEffect(() => {
    return () => {
      vaultAudioRef.current?.pause();
    };
  }, []);

  const currentNotes = mode === "hum" ? detectedNotes : playedNotes.map((n) => n.note);

  const recentSessions = galleryData?.sessions ?? [];

  // For hum mode, determine if we should show style selection + generate
  const humReady = mode === "hum" && humStage === "ready" && hasRecording;
  const pianoReady = mode === "piano" && hasRecording;
  const showStyleAndGenerate = humReady || pianoReady;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-void">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Muse" className="w-8 h-8" />
            <span className="font-display text-xl font-bold text-foreground">Muse</span>
          </div>
          <div className="flex items-center gap-3">
            {recentSessions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/gallery")}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Library className="w-4 h-4" />
                My Music
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-cosmic-text">Hum or Play</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Give us a short melody (up to 10 seconds) and we'll turn it into polished music in
            multiple styles.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 rounded-full glass-panel">
          <button
            onClick={() => { setMode("hum"); clearRecording(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              mode === "hum"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="w-4 h-4" />
            Hum
          </button>
          <button
            onClick={() => { setMode("piano"); clearRecording(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              mode === "piano"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Piano className="w-4 h-4" />
            Piano
          </button>
        </div>

        {/* Input Area */}
        <AnimatePresence mode="wait">
          {mode === "hum" ? (
            <motion.div
              key="hum"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Stage 1: Record */}
              {humStage === "record" && (
                <div className="flex flex-col items-center gap-6 w-full max-w-md">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/30 pointer-events-none"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-full border-2 border-primary/20 pointer-events-none"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        />
                      </>
                    )}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isRecording
                          ? "bg-red-500/20 border-2 border-red-500 glow-magenta"
                          : "bg-primary/10 border-2 border-primary/50 hover:bg-primary/20 hover:border-primary"
                      }`}
                    >
                      {isRecording ? (
                        <Square className="w-8 h-8 text-red-400" />
                      ) : (
                        <Mic className="w-8 h-8 text-primary" />
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="font-mono text-2xl text-foreground">
                      {recordingTime.toFixed(1)}s
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">/ 10s</span>
                  </div>

                  {!isRecording && (
                    <p className="text-muted-foreground text-sm">Tap to start recording your hum</p>
                  )}
                  {isRecording && (
                    <p className="text-red-400/80 text-sm animate-pulse">Recording... tap the button to stop</p>
                  )}

                  {/* Real-time detected notes during recording */}
                  {detectedNotes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass-panel rounded-xl px-4 py-3 max-w-md w-full"
                    >
                      <p className="text-xs text-muted-foreground mb-1">Detected melody:</p>
                      <div className="flex flex-wrap gap-1">
                        {detectedNotes.slice(-20).map((note, i) => (
                          <span
                            key={i}
                            className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                          >
                            {note}
                          </span>
                        ))}
                        {detectedNotes.length > 20 && (
                          <span className="text-xs text-muted-foreground">
                            +{detectedNotes.length - 20} more
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Stage 2: Verify piano keys */}
              {humStage === "verify" && humAudioBlob && (
                <HumToKeys
                  audioBlob={humAudioBlob}
                  onConfirm={handleHumConfirm}
                  onRerecord={handleHumRerecord}
                />
              )}

              {/* Stage 3: Ready — show confirmed notes summary */}
              {humStage === "ready" && confirmedNotes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-xl px-4 py-3 max-w-md w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-green-400 font-medium">Piano keys confirmed</p>
                    <button
                      onClick={handleHumRerecord}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Re-record
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {confirmedNotes.slice(0, 20).map((note, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-400"
                      >
                        {note.note}
                      </span>
                    ))}
                    {confirmedNotes.length > 20 && (
                      <span className="text-xs text-muted-foreground">
                        +{confirmedNotes.length - 20} more
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="piano"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center gap-6 w-full max-w-2xl"
            >
              <div className="relative select-none" style={{ height: 180 }}>
                <div className="flex">
                  {WHITE_KEYS.map((key) => (
                    <button
                      key={key.note}
                      onPointerDown={() => playNote(key.freq, key.note)}
                      className="relative w-10 sm:w-12 h-44 bg-gradient-to-b from-white to-gray-100 border border-gray-300 rounded-b-md 
                        hover:from-gray-100 hover:to-gray-200 active:from-gray-200 active:to-gray-300 
                        transition-all duration-75 active:translate-y-0.5"
                      style={{ zIndex: 1 }}
                    >
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
                        {key.note.replace(/\d/, "")}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="absolute top-0 left-0 flex pointer-events-none" style={{ zIndex: 2 }}>
                  {WHITE_KEYS.map((key) => {
                    const blackKey = BLACK_KEYS.find((b) => {
                      const whiteIdx = NOTES.indexOf(key);
                      const blackIdx = NOTES.indexOf(b);
                      return blackIdx === whiteIdx + 1;
                    });
                    if (!blackKey) return <div key={key.note} className="w-10 sm:w-12" />;
                    return (
                      <div key={key.note} className="relative w-10 sm:w-12">
                        <button
                          onPointerDown={() => playNote(blackKey.freq, blackKey.note)}
                          className="absolute -right-3 sm:-right-3.5 w-6 sm:w-7 h-28 bg-gradient-to-b from-gray-800 to-gray-950 
                            rounded-b-md border border-gray-700 pointer-events-auto
                            hover:from-gray-700 hover:to-gray-900 active:from-gray-600 active:to-gray-800
                            transition-all duration-75 active:translate-y-0.5"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!isPianoRecording && !hasRecording && (
                  <Button onClick={startPianoRecording} variant="outline" className="gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Start Recording
                  </Button>
                )}
                {isPianoRecording && (
                  <Button onClick={stopPianoRecording} variant="destructive" className="gap-2">
                    <Square className="w-4 h-4" />
                    Stop ({pianoRecordTime.toFixed(1)}s / 10s)
                  </Button>
                )}
                {hasRecording && (
                  <p className="text-green-400 text-sm">Piano melody captured! Ready to generate.</p>
                )}
              </div>
              {!isPianoRecording && !hasRecording && (
                <p className="text-muted-foreground text-sm">
                  Hit "Start Recording" then play some notes on the keyboard
                </p>
              )}

              {/* Piano detected notes display */}
              {playedNotes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-xl px-4 py-3 max-w-md w-full"
                >
                  <p className="text-xs text-muted-foreground mb-1">Played notes:</p>
                  <div className="flex flex-wrap gap-1">
                    {playedNotes.slice(-20).map((note, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {note.note}
                      </span>
                    ))}
                    {playedNotes.length > 20 && (
                      <span className="text-xs text-muted-foreground">
                        +{playedNotes.length - 20} more
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Style Selection — shown when recording is ready */}
        {showStyleAndGenerate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Choose a style</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {(allStyles ?? []).map((style) => {
                const isSelected = selectedStyles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? "border-transparent text-white shadow-md"
                        : "border-border/20 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                    style={
                      isSelected
                        ? { background: `${style.color}cc`, borderColor: style.color }
                        : {}
                    }
                  >
                    <span className="mr-1">{style.emoji}</span>
                    {style.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {showStyleAndGenerate && (
            <>
              <Button variant="outline" onClick={clearRecording} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isUploading || selectedStyles.length === 0}
                className="gap-2 gradient-cosmic text-background font-semibold px-8 h-12 rounded-full border-0 hover:opacity-90 transition-all"
              >
                <Wand2 className="w-5 h-5" />
                {isUploading ? "Uploading..." : "Generate 2 Tracks"}
              </Button>
            </>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* My Music Vault — Recent Sessions */}
      {/* ============================================================ */}
      {recentSessions.length > 0 && (
        <section className="border-t border-border/20 bg-void/50 py-10 px-4">
          <div className="container max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Library className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">My Music Vault</h2>
                  <p className="text-xs text-muted-foreground">
                    {galleryData?.total ?? 0} session{(galleryData?.total ?? 0) !== 1 ? "s" : ""} created
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/gallery")}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSessions.map((session) => (
                <VaultSessionCard
                  key={session.id}
                  session={session}
                  vaultPlayingUrl={vaultPlayingUrl}
                  onTogglePlay={toggleVaultPlay}
                  onViewSession={() => navigate(`/gallery?session=${session.id}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================
// VaultSessionCard — compact card for a recent session
// ============================================================
function VaultSessionCard({
  session,
  vaultPlayingUrl,
  onTogglePlay,
  onViewSession,
}: {
  session: {
    id: number;
    melodyDescription: string | null;
    inputMode: string | null;
    sessionName: string | null;
    createdAt: Date;
  };
  vaultPlayingUrl: string | null;
  onTogglePlay: (url: string) => void;
  onViewSession: () => void;
}) {
  // Fetch tracks for this session
  const { data } = trpc.gallery.getSession.useQuery({ sessionId: session.id });
  const sessionTracks = data?.tracks ?? [];

  const dateStr = new Date(session.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/20 overflow-hidden cursor-pointer hover:border-border/40 transition-all group"
      style={{ background: "oklch(0.13 0.02 280)" }}
      onClick={onViewSession}
    >
      {/* Track thumbnails grid */}
      <div className="grid grid-cols-4 gap-0.5 p-0.5">
        {sessionTracks.slice(0, 4).map((track) => (
          <div
            key={track.id}
            className="relative aspect-square overflow-hidden"
          >
            {track.imageUrl ? (
              <img src={track.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${getStyleColor(track.styleId ?? "")}20, oklch(0.1 0.02 280))`,
                }}
              >
                <Music className="w-4 h-4" style={{ color: getStyleColor(track.styleId ?? ""), opacity: 0.5 }} />
              </div>
            )}
          </div>
        ))}
        {sessionTracks.length < 4 &&
          Array.from({ length: 4 - sessionTracks.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-square"
              style={{ background: "oklch(0.1 0.02 280)" }}
            />
          ))}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-foreground">
            {session.sessionName || `Session #${session.id}`}
          </p>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {session.inputMode === "piano" ? "Piano" : "Hum"}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-0.5">{dateStr}</p>
        <p className="text-xs text-foreground/70 line-clamp-1">
          {sessionTracks.length > 0
            ? sessionTracks.map((t) => t.trackName).filter(Boolean).slice(0, 3).join(" / ")
            : "No tracks yet"}
        </p>

        {/* Quick play buttons for first 2 tracks */}
        {sessionTracks.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {sessionTracks.slice(0, 2).map((track) =>
              track.audioUrl ? (
                <button
                  key={track.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay(track.audioUrl!);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] transition-all hover:bg-white/10"
                  style={{
                    border: `1px solid ${getStyleColor(track.styleId ?? "")}30`,
                    color: getStyleColor(track.styleId ?? ""),
                  }}
                >
                  {vaultPlayingUrl === track.audioUrl ? (
                    <Pause className="w-2.5 h-2.5" />
                  ) : (
                    <Play className="w-2.5 h-2.5" />
                  )}
                  <span className="truncate max-w-[80px]">{track.trackName ?? track.styleId}</span>
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

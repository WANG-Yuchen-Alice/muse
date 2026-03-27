/**
 * Muse V2 — Results Page
 * Entertaining loading experience with progressive reveal.
 * All 8 tracks fire in parallel. Images/titles show first, audio fills in.
 * AI background images + audio spectrum histogram overlay.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Loader2,
  RefreshCw,
  Fingerprint,
  Sparkles,
  Music,
  Music2,
  Video,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StyleAnimation from "@/components/StyleAnimation";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

// Fun loading messages that rotate
const LOADING_MESSAGES = [
  "Composing your melody into something magical...",
  "The AI orchestra is warming up...",
  "Mixing frequencies and feelings...",
  "Turning your notes into a symphony...",
  "Sprinkling some musical stardust...",
  "Finding the perfect harmony...",
  "Weaving melodies across dimensions...",
  "Your music is almost ready to shine...",
  "Tuning the final notes...",
  "Adding the finishing touches...",
];

type TrackStatus = "pending" | "generating" | "done" | "error";

type GeneratedTrack = {
  key: string;
  model: "musicgen" | "lyria3";
  variant: "faithful" | "reimagined";
  variantLabel: string;
  trackName: string;
  styleId: string;
  styleName: string;
  color: string;
  audioUrl: string;
  caption: string;
  imageUrl: string;
  status: TrackStatus;
  error?: string;
};

export default function Results() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const audioUrl = params.get("audio") ?? "";
  const melodyDescription = params.get("melody") ?? "";
  const inputMode = params.get("mode") ?? "hum";

  const { data: styles } = trpc.music.getStyles.useQuery();
  const generateLyria = trpc.music.generateLyria.useMutation();
  const generateMusicGen = trpc.music.generateMusicGen.useMutation();
  const createSession = trpc.music.createSession.useMutation();
  const downloadMp3Mut = trpc.music.downloadMp3.useMutation();
  const downloadMp4Mut = trpc.music.downloadMp4.useMutation();

  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const generationStartedRef = useRef(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Initialize 8 tracks
  useEffect(() => {
    if (styles && tracks.length === 0) {
      const allTracks: GeneratedTrack[] = [];
      for (const s of styles) {
        allTracks.push({
          key: `faithful-${s.id}`,
          model: "musicgen",
          variant: "faithful",
          variantLabel: "Your Melody",
          trackName: "",
          styleId: s.id,
          styleName: s.name,
          color: s.color,
          audioUrl: "",
          caption: "",
          imageUrl: "",
          status: "pending",
        });
        allTracks.push({
          key: `reimagined-${s.id}`,
          model: "lyria3",
          variant: "reimagined",
          variantLabel: "Reimagined",
          trackName: "",
          styleId: s.id,
          styleName: s.name,
          color: s.color,
          audioUrl: "",
          caption: "",
          imageUrl: "",
          status: "pending",
        });
      }
      setTracks(allTracks);
    }
  }, [styles, tracks.length]);

  // Update a single track by key
  const updateTrack = useCallback(
    (key: string, updates: Partial<GeneratedTrack>) => {
      setTracks((prev) =>
        prev.map((t) => (t.key === key ? { ...t, ...updates } : t))
      );
    },
    []
  );

  // Fire ALL 8 generations in parallel (not sequentially per style)
  useEffect(() => {
    if (!styles || styles.length === 0 || tracks.length === 0) return;
    if (generationStartedRef.current) return;
    generationStartedRef.current = true;

    const run = async () => {
      // Create session first
      let sessionId: number | undefined;
      try {
        const result = await createSession.mutateAsync({
          originalAudioUrl: audioUrl || undefined,
          melodyDescription: melodyDescription || undefined,
          inputMode,
        });
        sessionId = result.sessionId;
      } catch (err) {
        console.error("Failed to create session:", err);
      }

      // Mark all as generating
      setTracks((prev) => prev.map((t) => ({ ...t, status: "generating" as const })));

      // Fire all 8 in parallel
      const promises: Promise<void>[] = [];

      for (const style of styles) {
        // MusicGen (faithful)
        const fKey = `faithful-${style.id}`;
        if (audioUrl) {
          promises.push(
            generateMusicGen
              .mutateAsync({
                audioUrl,
                styleId: style.id,
                duration: 30,
                sessionId,
              })
              .then((result) => {
                updateTrack(fKey, {
                  status: "done",
                  audioUrl: result.audioUrl,
                  trackName: result.trackName ?? "",
                  imageUrl: result.imageUrl ?? "",
                });
              })
              .catch((err: any) => {
                updateTrack(fKey, {
                  status: "error",
                  error: err?.message ?? "Generation failed",
                });
              })
          );
        } else {
          updateTrack(fKey, {
            status: "error",
            error: "No audio recording for melody conditioning",
          });
        }

        // Lyria 3 (reimagined)
        const rKey = `reimagined-${style.id}`;
        promises.push(
          generateLyria
            .mutateAsync({
              melodyDescription: melodyDescription || undefined,
              styleId: style.id,
              sessionId,
            })
            .then((result) => {
              updateTrack(rKey, {
                status: "done",
                audioUrl: result.audioUrl,
                caption: result.caption ?? "",
                trackName: result.trackName ?? "",
                imageUrl: result.imageUrl ?? "",
              });
            })
            .catch((err: any) => {
              updateTrack(rKey, {
                status: "error",
                error: err?.message ?? "Generation failed",
              });
            })
        );
      }

      await Promise.allSettled(promises);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles, tracks.length]);

  // Audio playback with analyser
  const togglePlay = useCallback(
    (track: GeneratedTrack) => {
      if (playingKey === track.key) {
        audioRef.current?.pause();
        setPlayingKey(null);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(track.audioUrl);
        audio.crossOrigin = "anonymous";
        audio.onended = () => setPlayingKey(null);

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (sourceRef.current) {
          try { sourceRef.current.disconnect(); } catch {}
        }

        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
        analyserRef.current = analyser;

        audio.play();
        audioRef.current = audio;
        setPlayingKey(track.key);
      }
    },
    [playingKey]
  );

  const handleDownloadMp3 = useCallback(
    async (track: GeneratedTrack) => {
      if (downloadingKey) return;
      setDownloadingKey(`mp3-${track.key}`);
      try {
        const result = await downloadMp3Mut.mutateAsync({
          audioUrl: track.audioUrl,
          trackName: track.trackName || track.styleName,
        });
        const a = document.createElement("a");
        a.href = result.url;
        a.download = result.filename;
        a.target = "_blank";
        a.click();
      } catch (err) {
        console.error("MP3 download failed:", err);
      } finally {
        setDownloadingKey(null);
      }
    },
    [downloadMp3Mut, downloadingKey]
  );

  const handleDownloadMp4 = useCallback(
    async (track: GeneratedTrack) => {
      if (downloadingKey) return;
      setDownloadingKey(`mp4-${track.key}`);
      try {
        const result = await downloadMp4Mut.mutateAsync({
          audioUrl: track.audioUrl,
          imageUrl: track.imageUrl || undefined,
          trackName: track.trackName || track.styleName,
        });
        const a = document.createElement("a");
        a.href = result.url;
        a.download = result.filename;
        a.target = "_blank";
        a.click();
      } catch (err) {
        console.error("MP4 download failed:", err);
      } finally {
        setDownloadingKey(null);
      }
    },
    [downloadMp4Mut, downloadingKey]
  );

  const doneCount = tracks.filter((t) => t.status === "done" || t.status === "error").length;
  const totalCount = tracks.length;
  const allDone = doneCount >= totalCount && totalCount > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-void sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={LOGO} alt="Muse" className="w-8 h-8" />
            <span className="font-display text-xl font-bold text-foreground">Muse</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/gallery")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              Gallery
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 text-center">
            <span className="gradient-cosmic-text">Your Music</span>
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-2">
            8 unique pieces across 4 styles
          </p>

          {/* Loading entertainment */}
          {!allDone && (
            <div className="text-center py-4 mb-4">
              {/* Animated music notes */}
              <div className="flex justify-center gap-3 mb-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -12, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  >
                    <Music
                      className="w-4 h-4"
                      style={{
                        color: (styles ?? [])[i % (styles?.length ?? 1)]?.color ?? "#fff",
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Rotating message */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground text-sm mb-3"
                >
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </motion.p>
              </AnimatePresence>

              {/* Progress */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="font-mono">
                  {tracks.filter((t) => t.status === "done").length} / {totalCount}
                </span>
                <span>tracks ready</span>
              </div>
              <div className="w-48 h-1.5 rounded-full bg-white/10 mx-auto overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-cosmic"
                  animate={{
                    width: `${totalCount > 0 ? (tracks.filter((t) => t.status === "done").length / totalCount) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="flex items-center justify-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span className="font-display text-sm font-semibold text-foreground">
                Your Melody
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-display text-sm font-semibold text-foreground">
                Reimagined
              </span>
            </div>
          </div>

          {/* Style rows */}
          <div className="flex flex-col gap-8">
            {(styles ?? []).map((style, i) => {
              const fTrack = tracks.find(
                (t) => t.styleId === style.id && t.variant === "faithful"
              );
              const rTrack = tracks.find(
                (t) => t.styleId === style.id && t.variant === "reimagined"
              );
              if (!fTrack || !rTrack) return null;

              return (
                <motion.div
                  key={style.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Style label */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: style.color }}
                    />
                    <span
                      className="font-display font-semibold text-sm"
                      style={{ color: style.color }}
                    >
                      {style.name}
                    </span>
                  </div>

                  {/* Two cards side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <TrackCard
                      track={fTrack}
                      isPlaying={playingKey === fTrack.key}
                      isDownloading={downloadingKey?.includes(fTrack.key) ?? false}
                      downloadingKey={downloadingKey}
                      analyser={playingKey === fTrack.key ? analyserRef.current : null}
                      onTogglePlay={() => togglePlay(fTrack)}
                      onDownloadMp3={() => handleDownloadMp3(fTrack)}
                      onDownloadMp4={() => handleDownloadMp4(fTrack)}
                    />
                    <TrackCard
                      track={rTrack}
                      isPlaying={playingKey === rTrack.key}
                      isDownloading={downloadingKey?.includes(rTrack.key) ?? false}
                      downloadingKey={downloadingKey}
                      analyser={playingKey === rTrack.key ? analyserRef.current : null}
                      onTogglePlay={() => togglePlay(rTrack)}
                      onDownloadMp3={() => handleDownloadMp3(rTrack)}
                      onDownloadMp4={() => handleDownloadMp4(rTrack)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ============================================================
// TrackCard — progressive reveal: skeleton → image/title → audio
// ============================================================
function TrackCard({
  track,
  isPlaying,
  isDownloading,
  downloadingKey,
  analyser,
  onTogglePlay,
  onDownloadMp3,
  onDownloadMp4,
}: {
  track: GeneratedTrack;
  isPlaying: boolean;
  isDownloading: boolean;
  downloadingKey: string | null;
  analyser: AnalyserNode | null;
  onTogglePlay: () => void;
  onDownloadMp3: () => void;
  onDownloadMp4: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Draw spectrum bars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 240;

    const draw = () => {
      ctx.clearRect(0, 0, 400, 240);

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 32;
        const barWidth = 400 / barCount - 2;
        const maxBarHeight = 100;

        for (let i = 0; i < barCount; i++) {
          const dataIdx = Math.floor((i / barCount) * bufferLength);
          const value = dataArray[dataIdx] / 255;
          const barHeight = value * maxBarHeight;

          const x = i * (barWidth + 2) + 1;
          const y = 240 - barHeight - 8;

          const gradient = ctx.createLinearGradient(x, y, x, 240 - 8);
          gradient.addColorStop(0, `${track.color}cc`);
          gradient.addColorStop(1, `${track.color}33`);
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      } else if (track.status === "done" && !isPlaying) {
        const barCount = 32;
        const barWidth = 400 / barCount - 2;
        for (let i = 0; i < barCount; i++) {
          const h = 4 + Math.sin(i * 0.5) * 3;
          const x = i * (barWidth + 2) + 1;
          ctx.fillStyle = `${track.color}30`;
          ctx.fillRect(x, 240 - h - 8, barWidth, h);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, analyser, track.color, track.status]);

  // Skeleton / generating state — use style-specific canvas animation
  if (track.status === "pending" || track.status === "generating") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden border border-border/20"
        style={{ background: "oklch(0.12 0.02 280)" }}
      >
        <div className="relative" style={{ height: 200 }}>
          <StyleAnimation
            isPlaying={true}
            color={track.color}
            styleId={track.styleId}
            width={400}
            height={200}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Music className="w-8 h-8" style={{ color: track.color, opacity: 0.7 }} />
            </motion.div>
            <span className="text-xs text-muted-foreground">
              {track.status === "pending" ? "Waiting..." : "Composing..."}
            </span>
          </div>
        </div>
        <div className="p-3">
          <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse mt-2" />
        </div>
      </motion.div>
    );
  }

  // Error state
  if (track.status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden border border-destructive/20"
        style={{ background: "oklch(0.12 0.02 280)" }}
      >
        <div className="relative flex items-center justify-center" style={{ height: 200 }}>
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 text-destructive/60 mx-auto mb-2" />
            <p className="text-xs text-destructive/80">{track.error ?? "Generation failed"}</p>
          </div>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground">{track.variantLabel}</p>
        </div>
      </motion.div>
    );
  }

  // Done state — full card with image, spectrum, play, download
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`rounded-xl overflow-hidden transition-all border ${
        isPlaying ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border/20"
      }`}
      style={{ background: "oklch(0.12 0.02 280)" }}
    >
      {/* Image + spectrum area */}
      <div className="relative" style={{ height: 200 }}>
        {track.imageUrl ? (
          <img
            src={track.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${track.color}15, oklch(0.1 0.02 280))`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: "screen" }}
        />

        {/* Play/pause */}
        <button
          onClick={onTogglePlay}
          className="absolute inset-0 flex items-center justify-center group cursor-pointer"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                : "bg-white/20 backdrop-blur-sm"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>
        </button>

        {/* Track name at bottom */}
        {track.trackName && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-display text-sm font-semibold text-white drop-shadow-lg truncate">
              {track.trackName}
            </p>
          </div>
        )}
      </div>

      {/* Info + downloads */}
      <div className="p-3">
        <p className="text-[11px] text-muted-foreground mb-2">{track.variantLabel}</p>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-1"
            onClick={onDownloadMp3}
            disabled={isDownloading}
          >
            {downloadingKey === `mp3-${track.key}` ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Music2 className="w-3 h-3" />
            )}
            MP3
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-1"
            onClick={onDownloadMp4}
            disabled={isDownloading}
          >
            {downloadingKey === `mp4-${track.key}` ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Video className="w-3 h-3" />
            )}
            MP4
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

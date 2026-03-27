/**
 * Muse — Results Page
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
  Film,
  Share2,
  AlertCircle,
  X,
  Download,
  Link2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StyleAnimation from "@/components/StyleAnimation";
import { trpc } from "@/lib/trpc";
import { MUSIC_FACTS } from "@shared/musicFacts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

const LOADING_MESSAGES = MUSIC_FACTS;

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
  const selectedStyleIds = useMemo(() => {
    const raw = params.get("styles") ?? "";
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [params]);

  const { data: allStyles } = trpc.music.getStyles.useQuery();
  // Filter to only selected styles (or fallback to all if none specified)
  const styles = useMemo(() => {
    if (!allStyles) return undefined;
    if (selectedStyleIds.length === 0) return allStyles;
    return allStyles.filter((s) => selectedStyleIds.includes(s.id));
  }, [allStyles, selectedStyleIds]);
  const generateLyria = trpc.music.generateLyria.useMutation();
  const generateMusicGen = trpc.music.generateMusicGen.useMutation();
  const createSession = trpc.music.createSession.useMutation();
  const generateVideoMut = trpc.music.generateVideo.useMutation();

  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const generationStartedRef = useRef(false);
  const sessionIdRef = useRef<number | undefined>(undefined);
  const [videoStudioTrack, setVideoStudioTrack] = useState<GeneratedTrack | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));

  // Rotate loading messages (every 5s for readability with fun facts)
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 5000);
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
      let sessionId = sessionIdRef.current;
      if (!sessionId) {
        try {
          const result = await createSession.mutateAsync({
            originalAudioUrl: audioUrl || undefined,
            melodyDescription: melodyDescription || undefined,
            inputMode,
            selectedStyles: selectedStyleIds.length > 0 ? selectedStyleIds : undefined,
          });
          sessionId = result.sessionId;
          sessionIdRef.current = sessionId;
        } catch (err) {
          console.error("Failed to create session:", err);
        }
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

  // Retry a single failed track
  const retryTrack = useCallback(
    async (trackToRetry: GeneratedTrack) => {
      const style = styles?.find((s) => s.id === trackToRetry.styleId);
      if (!style) return;

      updateTrack(trackToRetry.key, { status: "generating", error: undefined });

      try {
        if (trackToRetry.variant === "faithful" && audioUrl) {
          const result = await generateMusicGen.mutateAsync({
            audioUrl,
            styleId: style.id,
            duration: 30,
            sessionId: sessionIdRef.current,
          });
          updateTrack(trackToRetry.key, {
            status: "done",
            audioUrl: result.audioUrl,
            trackName: result.trackName ?? "",
            imageUrl: result.imageUrl ?? "",
          });
        } else if (trackToRetry.variant === "reimagined") {
          const result = await generateLyria.mutateAsync({
            melodyDescription: melodyDescription || undefined,
            styleId: style.id,
            sessionId: sessionIdRef.current,
          });
          updateTrack(trackToRetry.key, {
            status: "done",
            audioUrl: result.audioUrl,
            caption: result.caption ?? "",
            trackName: result.trackName ?? "",
            imageUrl: result.imageUrl ?? "",
          });
        }
      } catch (err: any) {
        updateTrack(trackToRetry.key, {
          status: "error",
          error: err?.message ?? "Retry failed",
        });
      }
    },
    [styles, audioUrl, melodyDescription, generateMusicGen, generateLyria, updateTrack]
  );

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

  const openVideoStudio = useCallback((track: GeneratedTrack) => {
    setVideoStudioTrack(track);
    setGeneratedVideoUrl(null);
    setVideoGenerating(false);
    setLinkCopied(false);
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!videoStudioTrack || videoGenerating) return;
    setVideoGenerating(true);
    try {
      const result = await generateVideoMut.mutateAsync({
        audioUrl: videoStudioTrack.audioUrl,
        imageUrl: videoStudioTrack.imageUrl || undefined,
        trackName: videoStudioTrack.trackName || videoStudioTrack.styleName,
        styleId: videoStudioTrack.styleId,
        color: videoStudioTrack.color,
      });
      setGeneratedVideoUrl(result.url);
    } catch (err) {
      console.error("Video generation failed:", err);
    } finally {
      setVideoGenerating(false);
    }
  }, [videoStudioTrack, videoGenerating, generateVideoMut]);

  const handleDownloadVideo = useCallback(() => {
    if (!generatedVideoUrl || !videoStudioTrack) return;
    const a = document.createElement("a");
    a.href = generatedVideoUrl;
    a.download = `${(videoStudioTrack.trackName || "muse-track").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.mp4`;
    a.target = "_blank";
    a.click();
  }, [generatedVideoUrl, videoStudioTrack]);

  const handleShare = useCallback(async () => {
    if (!generatedVideoUrl) return;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoStudioTrack?.trackName || "Muse Music Video",
          text: `Check out this AI-generated music video: ${videoStudioTrack?.trackName}`,
          url: generatedVideoUrl,
        });
        shared = true;
      } catch {
        // navigator.share failed (e.g. in iframe) — fall through to clipboard
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(generatedVideoUrl);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = generatedVideoUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [generatedVideoUrl, videoStudioTrack]);

  const handleCopyLink = useCallback(async () => {
    if (!generatedVideoUrl) return;
    await navigator.clipboard.writeText(generatedVideoUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [generatedVideoUrl]);

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
              onClick={() => navigate("/create")}
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
              Community
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/create")}
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
            {tracks.length} unique pieces across {styles?.length ?? 0} styles
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
                  className="text-muted-foreground text-sm mb-3 italic max-w-md mx-auto"
                >
                  <span className="not-italic">Did you know?</span>{" "}
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
                      analyser={playingKey === fTrack.key ? analyserRef.current : null}
                      onTogglePlay={() => togglePlay(fTrack)}
                      onCreateVideo={() => openVideoStudio(fTrack)}
                      onRetry={() => retryTrack(fTrack)}
                    />
                    <TrackCard
                      track={rTrack}
                      isPlaying={playingKey === rTrack.key}
                      analyser={playingKey === rTrack.key ? analyserRef.current : null}
                      onTogglePlay={() => togglePlay(rTrack)}
                      onCreateVideo={() => openVideoStudio(rTrack)}
                      onRetry={() => retryTrack(rTrack)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* ============================================================ */}
      {/* Video Studio Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={!!videoStudioTrack}
        onOpenChange={(open) => {
          if (!open) {
            setVideoStudioTrack(null);
            setGeneratedVideoUrl(null);
            setVideoGenerating(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              {generatedVideoUrl ? "Your Music Video" : "Create Music Video"}
            </DialogTitle>
          </DialogHeader>

          {videoStudioTrack && !generatedVideoUrl && (
            <div className="flex flex-col gap-4">
              {/* Preview card */}
              <div className="rounded-lg overflow-hidden border border-border/20">
                <div className="relative" style={{ height: 180 }}>
                  {videoStudioTrack.imageUrl ? (
                    <img
                      src={videoStudioTrack.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${videoStudioTrack.color}20, oklch(0.1 0.02 280))`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-display text-sm font-semibold text-white truncate">
                      {videoStudioTrack.trackName}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">{videoStudioTrack.styleName}</p>
                  </div>
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerateVideo}
                disabled={videoGenerating}
                className="w-full gap-2 gradient-cosmic text-background font-semibold h-11 rounded-full border-0 hover:opacity-90 transition-all"
              >
                {videoGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rendering Video...
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    Generate Music Video
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Audio-reactive visualization with dynamic spectrum overlay
              </p>
            </div>
          )}

          {videoStudioTrack && generatedVideoUrl && (
            <div className="flex flex-col gap-4">
              {/* Video preview */}
              <div className="rounded-lg overflow-hidden border border-border/20 bg-black">
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full"
                  style={{ maxHeight: 400 }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadVideo}
                  className="flex-1 gap-2 h-10"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  onClick={handleShare}
                  className="flex-1 gap-2 h-10 gradient-cosmic text-background border-0 hover:opacity-90"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              {/* Copy link */}
              <Button
                onClick={handleCopyLink}
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    Link copied!
                  </>
                ) : (
                  <>
                    <Link2 className="w-3 h-3" />
                    Copy video link
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Created with Muse — AI Music Generator
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// TrackCard — progressive reveal: skeleton → image/title → audio
// ============================================================
function TrackCard({
  track,
  isPlaying,
  analyser,
  onTogglePlay,
  onCreateVideo,
  onRetry,
}: {
  track: GeneratedTrack;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  onTogglePlay: () => void;
  onCreateVideo: () => void;
  onRetry?: () => void;
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
    // For Reimagined (Lyria 3) failures, show a fun compliment card
    if (track.variant === "reimagined") {
      const compliments = [
        "Your melody is already perfect — I couldn't improve it 🤷‍♂️",
        "Even AI knows when not to mess with a masterpiece ✨",
        "I tried reimagining this, but honestly? The original slaps too hard 🔥",
        "Some melodies are born perfect. This is one of them 💎",
        "The AI listened, paused, and said: 'Nah, this one's already a vibe' 🎧",
        "Reimagine this? Please. You already nailed it 👏",
        "AI tried 3 times and gave up — your taste is just too good 😎",
        "Not every melody needs a remix. Yours is chef's kiss as-is 🤌",
      ];
      const compliment = compliments[Math.floor(Math.random() * compliments.length)];

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden border border-amber-500/30"
          style={{ background: "linear-gradient(135deg, oklch(0.15 0.04 80), oklch(0.12 0.02 280))" }}
        >
          <div className="relative flex items-center justify-center" style={{ height: 200 }}>
            <div className="absolute inset-0 opacity-10">
              <StyleAnimation
                isPlaying={false}
                color="#F59E0B"
                styleId={track.styleId}
                width={400}
                height={200}
              />
            </div>
            <div className="text-center p-5 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3"
              >
                <Sparkles className="w-6 h-6 text-amber-400" />
              </motion.div>
              <p className="text-sm text-amber-200/90 font-medium leading-relaxed mb-3">{compliment}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-1.5 text-xs h-7 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try again anyway
                </Button>
              )}
            </div>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-amber-400/60">{track.variantLabel}</p>
          </div>
        </motion.div>
      );
    }

    // For Faithful (MusicGen) failures, show standard error
    const rawErr = track.error ?? "Generation failed";
    const friendlyMsg = rawErr.toLowerCase().includes("fetch")
      ? "Connection timed out. The AI model took too long to respond."
      : rawErr.toLowerCase().includes("timeout")
        ? "Generation timed out. Please try again."
        : rawErr;

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
            <p className="text-xs text-destructive/80 mb-2">{friendlyMsg}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 text-xs h-7"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            )}
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

      {/* Info + Create Video */}
      <div className="p-3">
        <p className="text-[11px] text-muted-foreground mb-2">{track.variantLabel}</p>

        <Button
          size="sm"
          className="w-full h-8 text-xs gap-1.5 gradient-cosmic text-background font-semibold border-0 hover:opacity-90 rounded-full relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            onCreateVideo();
          }}
        >
          <Film className="w-3.5 h-3.5" />
          Create Music Video
        </Button>
      </div>
    </motion.div>
  );
}

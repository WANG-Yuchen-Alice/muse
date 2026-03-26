/**
 * Muse V2 — Results Page
 * Simplified titles, AI-generated track names, style-specific animations,
 * audio + video download support.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Loader2,
  RefreshCw,
  Fingerprint,
  Sparkles,
  Music2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import StyleAnimation from "@/components/StyleAnimation";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

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
  status: TrackStatus;
  error?: string;
};

export default function Results() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const audioUrl = params.get("audio") ?? "";
  const melodyDescription = params.get("melody") ?? "";

  const { data: styles } = trpc.music.getStyles.useQuery();
  const generateLyria = trpc.music.generateLyria.useMutation();
  const generateMusicGen = trpc.music.generateMusicGen.useMutation();

  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  // Initialize 8 tracks (4 styles × 2 variants)
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
          status: "pending",
        });
      }
      setTracks(allTracks);
    }
  }, [styles, tracks.length]);

  // Generate all 8 tracks
  const startGeneration = useCallback(async () => {
    if (generationStarted || !styles) return;
    setGenerationStarted(true);

    for (const style of styles) {
      const faithfulKey = `faithful-${style.id}`;
      const reimaginedKey = `reimagined-${style.id}`;

      setTracks((prev) =>
        prev.map((t) =>
          t.key === faithfulKey || t.key === reimaginedKey
            ? { ...t, status: "generating" }
            : t
        )
      );

      const faithfulPromise = (async () => {
        try {
          const result = await generateMusicGen.mutateAsync({
            audioUrl,
            styleId: style.id,
            duration: 30,
          });
          setTracks((prev) =>
            prev.map((t) =>
              t.key === faithfulKey
                ? {
                    ...t,
                    status: "done",
                    audioUrl: result.audioUrl,
                    trackName: result.trackName ?? "",
                  }
                : t
            )
          );
        } catch (err: any) {
          setTracks((prev) =>
            prev.map((t) =>
              t.key === faithfulKey
                ? { ...t, status: "error", error: err.message ?? "Failed" }
                : t
            )
          );
        }
      })();

      const reimaginedPromise = (async () => {
        try {
          const result = await generateLyria.mutateAsync({
            melodyDescription: melodyDescription || undefined,
            styleId: style.id,
          });
          setTracks((prev) =>
            prev.map((t) =>
              t.key === reimaginedKey
                ? {
                    ...t,
                    status: "done",
                    audioUrl: result.audioUrl,
                    caption: result.caption ?? "",
                    trackName: result.trackName ?? "",
                  }
                : t
            )
          );
        } catch (err: any) {
          setTracks((prev) =>
            prev.map((t) =>
              t.key === reimaginedKey
                ? { ...t, status: "error", error: err.message ?? "Failed" }
                : t
            )
          );
        }
      })();

      await Promise.all([faithfulPromise, reimaginedPromise]);
    }
  }, [styles, audioUrl, melodyDescription, generateMusicGen, generateLyria, generationStarted]);

  useEffect(() => {
    if (styles && styles.length > 0 && !generationStarted) {
      startGeneration();
    }
  }, [styles, generationStarted, startGeneration]);

  // Audio playback
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
        audio.onended = () => setPlayingKey(null);
        audio.play();
        audioRef.current = audio;
        setPlayingKey(track.key);
      }
    },
    [playingKey]
  );

  const downloadAudio = useCallback((track: GeneratedTrack) => {
    const a = document.createElement("a");
    a.href = track.audioUrl;
    a.download = `muse-${track.trackName || track.styleId}-${track.variant}.mp3`;
    a.target = "_blank";
    a.click();
  }, []);

  // Video export: record canvas + audio into WebM
  const exportVideo = useCallback(
    async (track: GeneratedTrack) => {
      if (exportingKey) return;
      setExportingKey(track.key);

      try {
        // Create offscreen canvas for recording
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 720;
        const ctx = canvas.getContext("2d")!;

        // Fetch audio as ArrayBuffer
        const audioResponse = await fetch(track.audioUrl);
        const audioArrayBuffer = await audioResponse.arrayBuffer();
        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);
        const duration = audioBuffer.duration;

        // Create MediaStream from canvas
        const canvasStream = canvas.captureStream(30);

        // Create audio source for recording
        const audioSource = audioCtx.createBufferSource();
        audioSource.buffer = audioBuffer;
        const dest = audioCtx.createMediaStreamDestination();
        audioSource.connect(dest);
        audioSource.connect(audioCtx.destination);

        // Combine video + audio streams
        const combinedStream = new MediaStream([
          ...canvasStream.getTracks(),
          ...dest.stream.getTracks(),
        ]);

        const recorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm;codecs=vp9,opus",
          videoBitsPerSecond: 2500000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        const recordingDone = new Promise<Blob>((resolve) => {
          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: "video/webm" }));
          };
        });

        // Start recording
        recorder.start();
        audioSource.start();

        // Animate the canvas
        let time = 0;
        const fps = 30;
        const frameInterval = 1000 / fps;
        const totalFrames = Math.ceil(duration * fps);

        const drawAnimFrame = (styleId: string, color: string) => {
          // Background
          ctx.fillStyle = "#0a0a0f";
          ctx.fillRect(0, 0, 720, 720);

          // Draw the animation in the top portion
          ctx.save();
          ctx.translate(0, 60);
          drawStyleFrame(ctx, 720, 480, time, styleId, color);
          ctx.restore();

          // Track info at bottom
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(track.trackName || track.styleName, 360, 590);

          ctx.fillStyle = "#888888";
          ctx.font = "16px 'DM Sans', sans-serif";
          ctx.fillText(
            `${track.styleName} · ${track.variant === "faithful" ? "Your Melody" : "Reimagined"}`,
            360,
            620
          );

          // Muse branding
          ctx.fillStyle = "#555555";
          ctx.font = "14px 'DM Sans', sans-serif";
          ctx.fillText("Made with Muse", 360, 690);
        };

        let frame = 0;
        const renderLoop = () => {
          if (frame >= totalFrames) {
            recorder.stop();
            audioSource.stop();
            return;
          }
          time = frame / fps;
          drawAnimFrame(track.styleId, track.color);
          frame++;
          setTimeout(renderLoop, frameInterval);
        };
        renderLoop();

        const blob = await recordingDone;
        audioCtx.close();

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `muse-${track.trackName || track.styleId}-${track.variant}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Video export failed:", err);
      } finally {
        setExportingKey(null);
      }
    },
    [exportingKey]
  );

  const doneCount = tracks.filter((t) => t.status === "done").length;
  const totalCount = tracks.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-void">
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
      </header>

      {/* Main */}
      <main className="flex-1 container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Simplified title */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 text-center">
            <span className="gradient-cosmic-text">Your Music</span>
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {doneCount < totalCount
              ? `${doneCount} of ${totalCount} tracks ready`
              : `${totalCount} tracks ready`}
          </p>

          {/* Progress */}
          {doneCount < totalCount && (
            <div className="w-full h-1 bg-void-lighter rounded-full mb-8 overflow-hidden">
              <motion.div
                className="h-full gradient-cosmic rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(doneCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
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
                    <span className="font-display font-semibold text-sm text-foreground">
                      {style.name}
                    </span>
                  </div>

                  {/* Two cards side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <TrackCard
                      track={fTrack}
                      isPlaying={playingKey === fTrack.key}
                      isExporting={exportingKey === fTrack.key}
                      onTogglePlay={() => togglePlay(fTrack)}
                      onDownloadAudio={() => downloadAudio(fTrack)}
                      onExportVideo={() => exportVideo(fTrack)}
                    />
                    <TrackCard
                      track={rTrack}
                      isPlaying={playingKey === rTrack.key}
                      isExporting={exportingKey === rTrack.key}
                      onTogglePlay={() => togglePlay(rTrack)}
                      onDownloadAudio={() => downloadAudio(rTrack)}
                      onExportVideo={() => exportVideo(rTrack)}
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

function TrackCard({
  track,
  isPlaying,
  isExporting,
  onTogglePlay,
  onDownloadAudio,
  onExportVideo,
}: {
  track: GeneratedTrack;
  isPlaying: boolean;
  isExporting: boolean;
  onTogglePlay: () => void;
  onDownloadAudio: () => void;
  onExportVideo: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div
      className={`glass-panel rounded-xl overflow-hidden transition-all ${
        isPlaying ? "glow-cyan border-primary/30" : ""
      }`}
    >
      {/* Canvas animation */}
      <div className="relative">
        <StyleAnimation
          isPlaying={isPlaying || track.status === "generating"}
          color={track.color}
          styleId={track.styleId}
          canvasRef={canvasRef}
          width={400}
          height={240}
        />

        {/* Overlay: play button when done */}
        {track.status === "done" && !isPlaying && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </button>
        )}

        {/* Overlay: pause button when playing */}
        {track.status === "done" && isPlaying && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Pause className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Overlay: generating spinner */}
        {track.status === "generating" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="w-8 h-8 animate-spin text-white/70" />
          </div>
        )}

        {/* Overlay: error */}
        {track.status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-red-400 text-xs px-4 text-center">
              {track.error ?? "Generation failed"}
            </p>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="p-3">
        <p className="font-display text-sm font-semibold text-foreground truncate">
          {track.trackName || (track.status === "done" ? track.styleName : "...")}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {track.status === "pending" && "Waiting..."}
          {track.status === "generating" && "Creating..."}
          {track.status === "done" && track.variantLabel}
          {track.status === "error" && "Failed"}
        </p>

        {/* Download buttons */}
        {track.status === "done" && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-1"
              onClick={onDownloadAudio}
            >
              <Music2 className="w-3 h-3" />
              Audio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-1"
              onClick={onExportVideo}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Video className="w-3 h-3" />
              )}
              Video
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Standalone draw functions for video export (no React)
// ============================================================
function drawStyleFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  styleId: string,
  color: string
) {
  switch (styleId) {
    case "lofi":
      drawLofiFrame(ctx, w, h, t, color);
      break;
    case "cinematic":
      drawCinematicFrame(ctx, w, h, t, color);
      break;
    case "jazz":
      drawJazzFrame(ctx, w, h, t, color);
      break;
    case "electronic":
      drawElectronicFrame(ctx, w, h, t, color);
      break;
    default:
      drawLofiFrame(ctx, w, h, t, color);
  }
}

function drawLofiFrame(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  ctx.fillStyle = "#1a1118";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.8, 0, w * 0.5, h * 0.8, w * 0.6);
  glow.addColorStop(0, `${color}18`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = `${color}30`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const seed = i * 137.5;
    const x = ((seed * 7.3 + t * 20 * (0.5 + (i % 3) * 0.3)) % (w + 40)) - 20;
    const y = ((seed * 3.1 + t * 80 * (0.5 + (i % 4) * 0.2)) % (h + 60)) - 30;
    const len = 8 + (i % 5) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + len);
    ctx.stroke();
  }
  ctx.strokeStyle = `${color}60`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x += 2) {
    const y2 = h * 0.5 + Math.sin(x * 0.02 + t * 1.5) * 15 + Math.sin(x * 0.05 + t * 2.3) * 8;
    x === 0 ? ctx.moveTo(x, y2) : ctx.lineTo(x, y2);
  }
  ctx.stroke();
}

function drawCinematicFrame(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(0, 0, w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const intensity = 0.5 + Math.sin(t * 0.5) * 0.3;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
  glow.addColorStop(0, `${color}${Math.round(intensity * 30).toString(16).padStart(2, "0")}`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 + t * 0.1;
    const speed = 0.3 + (i % 5) * 0.15;
    const dist = (t * speed * 60 + i * 17) % (w * 0.6);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const alpha = Math.max(0, 1 - dist / (w * 0.6));
    ctx.fillStyle = `${color}${Math.round(alpha * 180).toString(16).padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + alpha * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJazzFrame(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  ctx.fillStyle = "#141008";
  ctx.fillRect(0, 0, w, h);
  const spot = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.5);
  spot.addColorStop(0, `${color}15`);
  spot.addColorStop(1, "transparent");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) {
    const bx = w * (0.15 + (i % 4) * 0.22) + Math.sin(t * 0.4 + i * 1.7) * 20;
    const by = h * (0.2 + Math.floor(i / 4) * 0.25) + Math.cos(t * 0.3 + i * 2.1) * 15;
    const radius = 15 + Math.sin(t * 0.6 + i) * 8;
    ctx.strokeStyle = `${color}20`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = `${color}80`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x < w; x += 2) {
    const y2 = h * 0.65 + Math.sin(x * 0.015 + t * 1.2) * 20 + Math.sin(x * 0.04 + t * 2.5) * 8;
    x === 0 ? ctx.moveTo(x, y2) : ctx.lineTo(x, y2);
  }
  ctx.stroke();
}

function drawElectronicFrame(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  ctx.fillStyle = "#08060f";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = `${color}12`;
  ctx.lineWidth = 0.5;
  const vanishY = h * 0.35;
  for (let i = 0; i < 12; i++) {
    const rawY = vanishY + i * 30 * (1 + i * 0.1);
    if (rawY > h) break;
    ctx.beginPath();
    ctx.moveTo(0, rawY);
    ctx.lineTo(w, rawY);
    ctx.stroke();
  }
  for (let wave = 0; wave < 3; wave++) {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.3, `${color}25`);
    gradient.addColorStop(0.7, `${color}18`);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= w; x += 3) {
      const y2 = h * (0.15 + wave * 0.06) + Math.sin(x * 0.008 + t * (0.4 + wave * 0.15) + wave * 2) * 25;
      ctx.lineTo(x, y2);
    }
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 8; i++) {
    const ox = (Math.sin(t * 0.2 + i * 2.5) * 0.4 + 0.5) * w;
    const oy = (Math.cos(t * 0.15 + i * 1.8) * 0.3 + 0.35) * h;
    const radius = 3 + Math.sin(t * 0.8 + i * 1.3) * 2;
    const orbGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 4);
    orbGlow.addColorStop(0, `${color}50`);
    orbGlow.addColorStop(1, "transparent");
    ctx.fillStyle = orbGlow;
    ctx.fillRect(ox - radius * 4, oy - radius * 4, radius * 8, radius * 8);
  }
}

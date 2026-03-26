/**
 * Muse V2 — Results Page (Comparison Mode)
 * Side-by-side: MusicGen (left) vs Lyria 3 (right), 4 styles each = 8 total
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, Download, Loader2, Music, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

type TrackStatus = "pending" | "generating" | "done" | "error";

type GeneratedTrack = {
  key: string; // unique key: `${model}-${styleId}`
  model: "musicgen" | "lyria3";
  modelLabel: string;
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

  // Initialize 8 tracks (4 styles × 2 models)
  useEffect(() => {
    if (styles && tracks.length === 0) {
      const allTracks: GeneratedTrack[] = [];
      for (const s of styles) {
        allTracks.push({
          key: `musicgen-${s.id}`,
          model: "musicgen",
          modelLabel: "MusicGen",
          styleId: s.id,
          styleName: s.name,
          color: s.color,
          audioUrl: "",
          caption: "",
          status: "pending",
        });
        allTracks.push({
          key: `lyria3-${s.id}`,
          model: "lyria3",
          modelLabel: "Lyria 3",
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

  // Generate all 8 tracks: run both models in parallel for each style
  const startGeneration = useCallback(async () => {
    if (generationStarted || !styles) return;
    setGenerationStarted(true);

    // Generate each style sequentially, but both models in parallel per style
    for (const style of styles) {
      const musicgenKey = `musicgen-${style.id}`;
      const lyriaKey = `lyria3-${style.id}`;

      // Mark both as generating
      setTracks((prev) =>
        prev.map((t) =>
          t.key === musicgenKey || t.key === lyriaKey ? { ...t, status: "generating" } : t
        )
      );

      // Run both in parallel
      const musicgenPromise = (async () => {
        try {
          const result = await generateMusicGen.mutateAsync({
            audioUrl,
            styleId: style.id,
            duration: 15,
          });
          setTracks((prev) =>
            prev.map((t) =>
              t.key === musicgenKey
                ? { ...t, status: "done", audioUrl: result.audioUrl }
                : t
            )
          );
        } catch (err: any) {
          setTracks((prev) =>
            prev.map((t) =>
              t.key === musicgenKey
                ? { ...t, status: "error", error: err.message ?? "Failed" }
                : t
            )
          );
        }
      })();

      const lyriaPromise = (async () => {
        try {
          const result = await generateLyria.mutateAsync({
            melodyDescription: melodyDescription || undefined,
            styleId: style.id,
          });
          setTracks((prev) =>
            prev.map((t) =>
              t.key === lyriaKey
                ? { ...t, status: "done", audioUrl: result.audioUrl, caption: result.caption ?? "" }
                : t
            )
          );
        } catch (err: any) {
          setTracks((prev) =>
            prev.map((t) =>
              t.key === lyriaKey
                ? { ...t, status: "error", error: err.message ?? "Failed" }
                : t
            )
          );
        }
      })();

      // Wait for both to finish before moving to next style
      await Promise.all([musicgenPromise, lyriaPromise]);
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

  const downloadTrack = useCallback((track: GeneratedTrack) => {
    const a = document.createElement("a");
    a.href = track.audioUrl;
    a.download = `muse-${track.model}-${track.styleId}.mp3`;
    a.target = "_blank";
    a.click();
  }, []);

  const doneCount = tracks.filter((t) => t.status === "done").length;
  const totalCount = tracks.length;

  // Group tracks by style for side-by-side display
  const musicgenTracks = tracks.filter((t) => t.model === "musicgen");
  const lyriaTracks = tracks.filter((t) => t.model === "lyria3");

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
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            New Melody
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center">
            <span className="gradient-cosmic-text">Model Comparison</span>
          </h1>
          <p className="text-muted-foreground text-center mb-2">
            {doneCount < totalCount
              ? `Generating ${totalCount} tracks (${doneCount} done)...`
              : `All ${totalCount} tracks generated! Tap to listen and compare.`}
          </p>
          <p className="text-xs text-muted-foreground text-center mb-8">
            Same 4 styles, two different AI models side by side
          </p>

          {/* Progress */}
          {doneCount < totalCount && (
            <div className="w-full h-1.5 bg-void-lighter rounded-full mb-8 overflow-hidden">
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
            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-foreground">
                MusicGen
              </h2>
              <p className="text-xs text-muted-foreground">
                Meta · Melody-conditioned · Uses your audio
              </p>
            </div>
            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-foreground">
                Lyria 3
              </h2>
              <p className="text-xs text-muted-foreground">
                Google · Text-prompted · 48kHz stereo
              </p>
            </div>
          </div>

          {/* Side-by-side tracks */}
          <div className="flex flex-col gap-4">
            {(styles ?? []).map((style, i) => {
              const mgTrack = musicgenTracks.find((t) => t.styleId === style.id);
              const lyTrack = lyriaTracks.find((t) => t.styleId === style.id);
              if (!mgTrack || !lyTrack) return null;

              return (
                <motion.div
                  key={style.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Style label */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: style.color }}
                    />
                    <span className="font-display font-semibold text-sm text-foreground">
                      {style.name}
                    </span>
                  </div>

                  {/* Two cards side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    {[mgTrack, lyTrack].map((track) => (
                      <TrackCard
                        key={track.key}
                        track={track}
                        isPlaying={playingKey === track.key}
                        onTogglePlay={() => togglePlay(track)}
                        onDownload={() => downloadTrack(track)}
                      />
                    ))}
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
  onTogglePlay,
  onDownload,
}: {
  track: GeneratedTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className={`glass-panel rounded-xl p-4 transition-all ${
        isPlaying ? "glow-cyan border-primary/30" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${track.color}20` }}
        >
          {track.status === "generating" ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: track.color }} />
          ) : track.status === "done" ? (
            <Music className="w-4 h-4" style={{ color: track.color }} />
          ) : track.status === "error" ? (
            <span className="text-red-400 text-sm font-bold">!</span>
          ) : (
            <div
              className="w-2.5 h-2.5 rounded-full opacity-40"
              style={{ background: track.color }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{track.modelLabel}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {track.status === "pending" && "Waiting..."}
            {track.status === "generating" && `Generating...`}
            {track.status === "done" &&
              (track.caption ? track.caption.slice(0, 60) + "..." : "Ready to play")}
            {track.status === "error" && (track.error ?? "Failed")}
          </p>
        </div>

        {/* Controls */}
        {track.status === "done" && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
              onClick={onTogglePlay}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
              onClick={onDownload}
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* Waveform animation */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 24 }}
          className="mt-2 flex items-end gap-0.5 justify-center"
        >
          {Array.from({ length: 24 }).map((_, j) => (
            <motion.div
              key={j}
              className="w-0.5 rounded-full"
              style={{ background: track.color }}
              animate={{
                height: [3, 6 + Math.random() * 14, 3],
              }}
              transition={{
                duration: 0.4 + Math.random() * 0.4,
                repeat: Infinity,
                delay: j * 0.02,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

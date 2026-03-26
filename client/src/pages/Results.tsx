/**
 * Muse V2 — Results Page
 * Shows AI-generated music in 4 styles from the user's melody description
 * Powered by Google Lyria 3 Clip
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, Download, Loader2, Music, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

type GeneratedTrack = {
  styleId: string;
  styleName: string;
  color: string;
  audioUrl: string;
  caption: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
};

export default function Results() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const melodyDescription = params.get("melody") ?? "";

  const { data: styles } = trpc.music.getStyles.useQuery();
  const generateMutation = trpc.music.generate.useMutation();

  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [generationStarted, setGenerationStarted] = useState(false);

  // Initialize tracks when styles load
  useEffect(() => {
    if (styles && tracks.length === 0) {
      setTracks(
        styles.map((s) => ({
          styleId: s.id,
          styleName: s.name,
          color: s.color,
          audioUrl: "",
          caption: "",
          status: "pending" as const,
        }))
      );
    }
  }, [styles, tracks.length]);

  // Start generating all styles
  const startGeneration = useCallback(async () => {
    if (generationStarted) return;
    setGenerationStarted(true);

    for (const style of styles ?? []) {
      setTracks((prev) =>
        prev.map((t) => (t.styleId === style.id ? { ...t, status: "generating" } : t))
      );

      try {
        const result = await generateMutation.mutateAsync({
          melodyDescription: melodyDescription || undefined,
          styleId: style.id,
        });
        setTracks((prev) =>
          prev.map((t) =>
            t.styleId === style.id
              ? { ...t, status: "done", audioUrl: result.audioUrl, caption: result.caption ?? "" }
              : t
          )
        );
      } catch (err: any) {
        setTracks((prev) =>
          prev.map((t) =>
            t.styleId === style.id
              ? { ...t, status: "error", error: err.message ?? "Generation failed" }
              : t
          )
        );
      }
    }
  }, [melodyDescription, styles, generateMutation, generationStarted]);

  // Auto-start generation when styles are loaded
  useEffect(() => {
    if (styles && styles.length > 0 && !generationStarted) {
      startGeneration();
    }
  }, [styles, generationStarted, startGeneration]);

  // Audio playback
  const togglePlay = useCallback(
    (track: GeneratedTrack) => {
      if (playingId === track.styleId) {
        audioRef.current?.pause();
        setPlayingId(null);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(track.audioUrl);
        audio.onended = () => setPlayingId(null);
        audio.play();
        audioRef.current = audio;
        setPlayingId(track.styleId);
      }
    },
    [playingId]
  );

  const downloadTrack = useCallback((track: GeneratedTrack) => {
    const a = document.createElement("a");
    a.href = track.audioUrl;
    a.download = `muse-${track.styleId}.mp3`;
    a.target = "_blank";
    a.click();
  }, []);

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
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            New Melody
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center">
            <span className="gradient-cosmic-text">Your Music</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {doneCount < totalCount
              ? `Generating ${totalCount} styles from your melody...`
              : `${totalCount} styles generated! Tap to listen.`}
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

          {/* Track Cards */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {tracks.map((track, i) => (
                <motion.div
                  key={track.styleId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-panel rounded-2xl p-5 transition-all ${
                    playingId === track.styleId ? "glow-cyan border-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Style indicator */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${track.color}20` }}
                    >
                      {track.status === "generating" ? (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: track.color }} />
                      ) : track.status === "done" ? (
                        <Music className="w-5 h-5" style={{ color: track.color }} />
                      ) : track.status === "error" ? (
                        <span className="text-red-400 text-lg">!</span>
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full opacity-40"
                          style={{ background: track.color }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground">
                        {track.styleName}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.status === "pending" && "Waiting..."}
                        {track.status === "generating" && "Generating with Lyria 3..."}
                        {track.status === "done" && (track.caption ? track.caption.slice(0, 80) + "..." : "Ready to play")}
                        {track.status === "error" && (track.error ?? "Failed")}
                      </p>
                    </div>

                    {/* Controls */}
                    {track.status === "done" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-full"
                          onClick={() => togglePlay(track)}
                        >
                          {playingId === track.styleId ? (
                            <Pause className="w-5 h-5 text-primary" />
                          ) : (
                            <Play className="w-5 h-5 text-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-full"
                          onClick={() => downloadTrack(track)}
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Waveform animation for playing track */}
                  {playingId === track.styleId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 32 }}
                      className="mt-3 flex items-end gap-0.5 justify-center"
                    >
                      {Array.from({ length: 40 }).map((_, j) => (
                        <motion.div
                          key={j}
                          className="w-1 rounded-full"
                          style={{ background: track.color }}
                          animate={{
                            height: [4, 8 + Math.random() * 20, 4],
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

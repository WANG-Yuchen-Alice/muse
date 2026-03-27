/**
 * Muse V2 — Gallery Page
 * Shows all past generation sessions with their tracks.
 */
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Music2,
  Video,
  Loader2,
  Calendar,
  Mic,
  Piano,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

export default function Gallery() {
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.gallery.listSessions.useQuery({ limit: 50, offset: 0 });
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
            <span className="font-display text-xl font-bold text-foreground">Gallery</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Music2 className="w-3.5 h-3.5" />
            Create New
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-5xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.sessions.length === 0 ? (
          <div className="text-center py-20">
            <Music2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              No creations yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Hum a melody or play the piano to create your first piece.
            </p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Music2 className="w-4 h-4" />
              Start Creating
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.sessions.map((session, i) => (
              <SessionCard
                key={session.id}
                session={session}
                index={i}
                isExpanded={expandedId === session.id}
                onToggle={() =>
                  setExpandedId(expandedId === session.id ? null : session.id)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// Session Card — expandable to show tracks
// ============================================================
function SessionCard({
  session,
  index,
  isExpanded,
  onToggle,
}: {
  session: {
    id: number;
    originalAudioUrl: string | null;
    melodyDescription: string | null;
    inputMode: string | null;
    createdAt: Date;
  };
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: details, isLoading } = trpc.gallery.getSession.useQuery(
    { sessionId: session.id },
    { enabled: isExpanded }
  );

  const date = new Date(session.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border/20 overflow-hidden"
      style={{ background: "oklch(0.12 0.02 280)" }}
    >
      {/* Session header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-lg bg-void-lighter flex items-center justify-center">
          {session.inputMode === "piano" ? (
            <Piano className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Mic className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            Session #{session.id}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          {isExpanded ? "▲" : "▼"}
        </div>
      </button>

      {/* Expanded tracks */}
      {isExpanded && (
        <div className="border-t border-border/10 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !details || details.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tracks found for this session.
            </p>
          ) : (
            <>
              {/* Original input */}
              {session.originalAudioUrl && (
                <div className="mb-4 p-3 rounded-lg bg-void-lighter">
                  <p className="text-xs text-muted-foreground mb-2">Original Input</p>
                  <audio
                    src={session.originalAudioUrl}
                    controls
                    className="w-full h-8"
                    style={{ filter: "invert(1) hue-rotate(180deg)" }}
                  />
                </div>
              )}

              {/* Tracks grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {details.tracks.map((track) => (
                  <GalleryTrackCard key={track.id} track={track} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Gallery Track Card — compact card with image + play
// ============================================================
function GalleryTrackCard({
  track,
}: {
  track: {
    id: number;
    styleId: string;
    variant: string;
    trackName: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    status: string;
  };
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const downloadMp3 = trpc.music.downloadMp3.useMutation();
  const [downloading, setDownloading] = useState(false);

  const togglePlay = useCallback(() => {
    if (!track.audioUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      audioRef.current = audio;
      setIsPlaying(true);
    }
  }, [isPlaying, track.audioUrl]);

  const handleDownload = useCallback(async () => {
    if (!track.audioUrl || downloading) return;
    setDownloading(true);
    try {
      const result = await downloadMp3.mutateAsync({
        audioUrl: track.audioUrl,
        trackName: track.trackName ?? "muse-track",
      });
      const a = document.createElement("a");
      a.href = result.url;
      a.download = result.filename;
      a.target = "_blank";
      a.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [track.audioUrl, track.trackName, downloadMp3, downloading]);

  const STYLE_COLORS: Record<string, string> = {
    lofi: "#FF6B9D",
    cinematic: "#00E5FF",
    jazz: "#FFB800",
    electronic: "#A78BFA",
  };

  const color = STYLE_COLORS[track.styleId] ?? "#888";

  return (
    <div
      className="rounded-lg overflow-hidden border border-border/10"
      style={{ background: "oklch(0.1 0.02 280)" }}
    >
      {/* Image area */}
      <div className="relative" style={{ height: 100 }}>
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
              background: `linear-gradient(135deg, ${color}20, oklch(0.1 0.02 280))`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Play button */}
        {track.audioUrl && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white ml-0.5" />
              )}
            </div>
          </button>
        )}

        {/* Status badge */}
        {track.status !== "done" && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] bg-black/60 text-muted-foreground">
            {track.status}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-foreground truncate">
          {track.trackName || track.styleId}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-[10px]"
            style={{ color }}
          >
            {track.variant === "faithful" ? "Melody" : "Reimagined"}
          </span>
          {track.audioUrl && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Music2 className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

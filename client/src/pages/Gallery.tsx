/**
 * Muse — Gallery Page
 * Beautiful gallery of all past generation sessions.
 * When "All Styles" is selected, shows sessions (grouped).
 * When a specific style is selected, shows individual tracks directly.
 */
import { useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Music2,
  Film,
  Share2,
  Loader2,
  Calendar,
  Mic,
  Piano,
  Filter,
  Sparkles,
  Fingerprint,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

const STYLE_META: Record<string, { name: string; color: string; emoji: string }> = {
  lofi: { name: "Lo-fi Chill", color: "#FF6B9D", emoji: "🌧" },
  cinematic: { name: "Cinematic Epic", color: "#00E5FF", emoji: "🎬" },
  jazz: { name: "Smooth Jazz", color: "#FFB800", emoji: "🎷" },
  electronic: { name: "Ambient Electronic", color: "#A78BFA", emoji: "🌌" },
  tiktok: { name: "TikTok Viral", color: "#FF3B5C", emoji: "🔥" },
  upbeat: { name: "Upbeat Pop", color: "#22D3EE", emoji: "☀️" },
  rock: { name: "Rock", color: "#EF4444", emoji: "🎸" },
  rnb: { name: "R&B Soul", color: "#F472B6", emoji: "💜" },
  classical: { name: "Classical Piano", color: "#D4A574", emoji: "🎹" },
  edm: { name: "EDM / Dance", color: "#10B981", emoji: "🪩" },
};

const ALL_STYLES = ["all", "lofi", "cinematic", "jazz", "electronic", "tiktok", "upbeat", "rock", "rnb", "classical", "edm"] as const;

export default function Gallery() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [styleFilter, setStyleFilter] = useState<string>("all");

  // Fetch sessions for "All" view
  const { data: sessionsData, isLoading: sessionsLoading } = trpc.gallery.listSessions.useQuery(
    { limit: 50, offset: 0 },
    { enabled: styleFilter === "all" }
  );

  // Fetch individual tracks for filtered view
  const { data: tracksData, isLoading: tracksLoading } = trpc.gallery.listTracks.useQuery(
    { styleId: styleFilter, limit: 100, offset: 0 },
    { enabled: styleFilter !== "all" }
  );

  const isLoading = styleFilter === "all" ? sessionsLoading : tracksLoading;
  const totalCount = styleFilter === "all" ? (sessionsData?.total ?? 0) : (tracksData?.total ?? 0);

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
            <span className="font-display text-xl font-bold text-foreground">Community</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/create")}
            className="gap-2"
          >
            <Music2 className="w-3.5 h-3.5" />
            Create New
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-5xl">
        {/* Page title */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">
            <span className="gradient-cosmic-text">Community</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {styleFilter === "all" ? "session" : "track"}{totalCount !== 1 ? "s" : ""} — discover and share music videos
          </p>
        </div>

        {/* Style filter chips */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {ALL_STYLES.map((sid) => {
            const isActive = styleFilter === sid;
            const meta = sid === "all" ? null : STYLE_META[sid];
            return (
              <button
                key={sid}
                onClick={() => setStyleFilter(sid)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                  isActive
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border/20 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
                style={
                  isActive && meta
                    ? { borderColor: `${meta.color}50`, background: `${meta.color}15`, color: meta.color }
                    : {}
                }
              >
                {sid === "all" ? (
                  <>
                    <Filter className="w-3 h-3 inline mr-1" />
                    All Styles
                  </>
                ) : (
                  <>
                    <span className="mr-1">{meta?.emoji}</span>
                    {meta?.name}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading your creations...</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20">
            <Music2 className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              {styleFilter === "all" ? "No creations yet" : `No ${STYLE_META[styleFilter]?.name ?? ""} tracks yet`}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Hum a melody or play the piano to create your first piece. Each session generates unique tracks across multiple styles.
            </p>
            <Button onClick={() => navigate("/create")} className="gap-2">
              <Music2 className="w-4 h-4" />
              Start Creating
            </Button>
          </div>
        ) : styleFilter === "all" ? (
          /* ============================================================ */
          /* ALL STYLES VIEW — Show sessions (grouped) */
          /* ============================================================ */
          <div className="flex flex-col gap-6">
            {(sessionsData?.sessions ?? []).map((session, i) => (
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
        ) : (
          /* ============================================================ */
          /* FILTERED VIEW — Show individual tracks directly */
          /* ============================================================ */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(tracksData?.tracks ?? []).map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GalleryTrackCard
                  track={track}
                  variantIcon={
                    track.variant === "faithful" ? (
                      <Fingerprint className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    )
                  }
                  variantLabel={track.variant === "faithful" ? "Your Melody" : "Reimagined"}
                  color={STYLE_META[track.styleId]?.color ?? "#888"}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// Session Card — shows original input + expandable track grid
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
    sessionName: string | null;
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

  const allTracks = details?.tracks ?? [];

  // Group tracks by style for display
  const groupedByStyle = useMemo(() => {
    const groups: Record<string, typeof allTracks> = {};
    for (const t of allTracks) {
      if (!groups[t.styleId]) groups[t.styleId] = [];
      groups[t.styleId].push(t);
    }
    return groups;
  }, [allTracks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border/20 overflow-hidden"
      style={{ background: "oklch(0.12 0.02 280)" }}
    >
      {/* Session header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left cursor-pointer"
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, oklch(0.2 0.03 280), oklch(0.15 0.02 280))",
          }}
        >
          {session.inputMode === "piano" ? (
            <Piano className="w-5 h-5 text-cyan-400" />
          ) : (
            <Mic className="w-5 h-5 text-pink-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {session.sessionName || `Session #${session.id}`}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Calendar className="w-3 h-3" />
            {formattedDate}
            <span className="text-border">|</span>
            <span className="capitalize">{session.inputMode ?? "hum"} input</span>
          </div>
          {/* Melody description preview */}
          {session.melodyDescription && (
            <p className="text-xs text-muted-foreground/60 mt-1 truncate max-w-md">
              {session.melodyDescription.slice(0, 80)}...
            </p>
          )}
        </div>

        {/* Expand indicator */}
        <div className="text-muted-foreground shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/10 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading tracks...</span>
                </div>
              ) : allTracks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tracks found for this session.
                </p>
              ) : (
                <>
                  {/* Original input audio */}
                  {session.originalAudioUrl && (
                    <div className="mb-5 p-3 rounded-lg bg-white/5 border border-border/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-xs font-medium text-foreground">
                          Original Input
                        </span>
                      </div>
                      <audio
                        src={session.originalAudioUrl}
                        controls
                        className="w-full h-8"
                        style={{ filter: "invert(1) hue-rotate(180deg)" }}
                      />
                    </div>
                  )}

                  {/* Tracks grouped by style */}
                  <div className="flex flex-col gap-5">
                    {Object.entries(groupedByStyle).map(([styleId, styleTracks]) => {
                      const meta = STYLE_META[styleId];
                      if (!meta) return null;

                      // Separate faithful and reimagined
                      const faithful = styleTracks.find((t) => t.variant === "faithful");
                      const reimagined = styleTracks.find((t) => t.variant === "reimagined");

                      return (
                        <div key={styleId}>
                          {/* Style header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: meta.color }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: meta.color }}
                            >
                              {meta.name}
                            </span>
                          </div>

                          {/* Two tracks side by side */}
                          <div className="grid grid-cols-2 gap-3">
                            {faithful && (
                              <GalleryTrackCard
                                track={faithful}
                                variantIcon={<Fingerprint className="w-3 h-3 text-cyan-400" />}
                                variantLabel="Your Melody"
                                color={meta.color}
                              />
                            )}
                            {reimagined && (
                              <GalleryTrackCard
                                track={reimagined}
                                variantIcon={<Sparkles className="w-3 h-3 text-purple-400" />}
                                variantLabel="Reimagined"
                                color={meta.color}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Gallery Track Card — video-first with share link
// ============================================================
function GalleryTrackCard({
  track,
  variantIcon,
  variantLabel,
  color,
}: {
  track: {
    id: number;
    styleId: string;
    variant: string;
    trackName: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    videoUrl?: string | null;
    status: string;
  };
  variantIcon: React.ReactNode;
  variantLabel: string;
  color: string;
}) {
  const [, navigate] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasVideo = !!track.videoUrl;

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

  return (
    <div
      className={`rounded-lg overflow-hidden border transition-all ${
        isPlaying ? "border-primary/30 shadow-md shadow-primary/5" : hasVideo ? "border-primary/20" : "border-border/10"
      }`}
      style={{ background: "oklch(0.1 0.02 280)" }}
    >
      {/* Image area */}
      <div className="relative" style={{ height: 120 }}>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Video badge */}
        {hasVideo && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm">
            <Film className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-semibold text-white">VIDEO</span>
          </div>
        )}

        {/* Play button */}
        {track.audioUrl && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? "bg-white/25 backdrop-blur-sm"
                  : "bg-white/20 backdrop-blur-sm opacity-80 group-hover:opacity-100"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </div>
          </button>
        )}

        {/* Track name at bottom */}
        {track.trackName && (
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
            <p className="text-xs font-semibold text-white drop-shadow-lg truncate">
              {track.trackName}
            </p>
          </div>
        )}
      </div>

      {/* Info + actions */}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          {variantIcon}
          <span className="text-[10px] text-muted-foreground">{variantLabel}</span>
        </div>

        {hasVideo ? (
          <button
            onClick={() => navigate(`/share/${track.id}`)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[10px] font-semibold text-white transition-colors cursor-pointer gradient-cosmic hover:opacity-90"
          >
            <Share2 className="w-3 h-3" />
            View & Share
          </button>
        ) : (
          <button
            onClick={() => navigate(`/share/${track.id}`)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Film className="w-3 h-3" />
            View Track
          </button>
        )}
      </div>
    </div>
  );
}

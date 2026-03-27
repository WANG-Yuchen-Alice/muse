/**
 * Muse — Share Page
 * Public-facing page for a single track's music video.
 * URL: /share/:trackId
 * Designed for social media link previews and direct video sharing.
 */
import { useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Share2,
  Link2,
  Check,
  Loader2,
  Music2,
  Film,
  Sparkles,
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

export default function Share() {
  const [, navigate] = useLocation();
  const params = useParams<{ trackId: string }>();
  const trackId = parseInt(params.trackId ?? "0", 10);

  const { data: track, isLoading, error } = trpc.gallery.getTrack.useQuery(
    { trackId },
    { enabled: trackId > 0 }
  );

  const [linkCopied, setLinkCopied] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const color = track?.color ?? STYLE_META[track?.styleId ?? ""]?.color ?? "#A78BFA";
  const styleName = track?.styleName ?? STYLE_META[track?.styleId ?? ""]?.name ?? "";

  const handleDownload = useCallback(() => {
    const url = track?.videoUrl || track?.audioUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(track?.trackName || "muse-track").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.${track?.videoUrl ? "mp4" : "mp3"}`;
    a.target = "_blank";
    a.click();
  }, [track]);

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: track?.trackName || "Muse Music Video",
          text: `Check out this AI-generated music: ${track?.trackName}`,
          url: shareUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [track]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Music2 className="w-16 h-16 text-muted-foreground/20" />
        <h2 className="font-display text-lg font-semibold text-foreground">Track not found</h2>
        <p className="text-sm text-muted-foreground">This track may have been removed or the link is invalid.</p>
        <Button onClick={() => navigate("/")} className="gap-2 mt-2">
          <Music2 className="w-4 h-4" />
          Create Your Own
        </Button>
      </div>
    );
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Make Your Own
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-lg mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          {/* Track name */}
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">
              <span className="gradient-cosmic-text">{track.trackName || "Untitled"}</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: color }}
              />
              <span>{styleName}</span>
              <span className="text-border">|</span>
              <span>{track.variant === "faithful" ? "Your Melody" : "Reimagined"}</span>
            </div>
          </div>

          {/* Video / Image display */}
          {track.videoUrl ? (
            <div className="rounded-xl overflow-hidden border border-border/20 bg-black mb-6">
              <video
                src={track.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full"
                style={{ maxHeight: 600 }}
              />
            </div>
          ) : track.imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-border/20 mb-6 relative">
              <img
                src={track.imageUrl}
                alt={track.trackName || ""}
                className="w-full object-cover"
                style={{ maxHeight: 400 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {track.audioUrl && (
                <div className="absolute bottom-4 left-4 right-4">
                  <audio
                    src={track.audioUrl}
                    controls
                    className="w-full"
                    style={{ height: 36 }}
                  />
                </div>
              )}
            </div>
          ) : track.audioUrl ? (
            <div className="rounded-xl border border-border/20 p-6 mb-6 text-center"
              style={{ background: `linear-gradient(135deg, ${color}10, oklch(0.1 0.02 280))` }}
            >
              <Film className="w-12 h-12 mx-auto mb-3" style={{ color }} />
              <audio src={track.audioUrl} controls className="w-full" />
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 gap-2 h-11"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 gap-2 h-11 gradient-cosmic text-background border-0 hover:opacity-90"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Copy link */}
          <div className="text-center mb-6">
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
                  Copy share link
                </>
              )}
            </Button>
          </div>

          {/* Caption */}
          {track.caption && (
            <div className="rounded-lg bg-white/5 border border-border/10 p-4 mb-6">
              <p className="text-sm text-muted-foreground italic">{track.caption}</p>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/20 bg-white/5"
            >
              <img src={LOGO} alt="Muse" className="w-5 h-5" />
              <span className="text-xs text-muted-foreground">
                Created with <span className="font-semibold text-foreground">Muse</span> — AI Music Generator
              </span>
            </div>
            <div className="mt-3">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="sm"
                className="gap-2 text-xs"
              >
                <Sparkles className="w-3 h-3" />
                Create your own music
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/**
 * Muse — Share Page
 * Public-facing page for a single track.
 * URL: /share/:trackId
 *
 * Features:
 * - Play audio
 * - Download MP3 / Download Video
 * - Share link
 * - Generate Video (if no video exists yet)
 * - View existing video
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
  const utils = trpc.useUtils();

  const { data: track, isLoading, error } = trpc.gallery.getTrack.useQuery(
    { trackId },
    { enabled: trackId > 0 }
  );

  const generateVideoMut = trpc.music.generateVideo.useMutation();

  const [linkCopied, setLinkCopied] = useState(false);
  const [downloading, setDownloading] = useState<"audio" | "video" | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const color = track?.color ?? STYLE_META[track?.styleId ?? ""]?.color ?? "#A78BFA";
  const styleName = track?.styleName ?? STYLE_META[track?.styleId ?? ""]?.name ?? "";

  // The effective video URL: either from DB or just generated
  const videoUrl = generatedVideoUrl || track?.videoUrl;
  const hasVideo = !!videoUrl;

  const handleDownload = useCallback(
    async (type: "audio" | "video") => {
      const url = type === "video" ? videoUrl : track?.audioUrl;
      if (!url || downloading) return;
      const filename = `${(track?.trackName || "muse-track").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.${type === "video" ? "mp4" : "mp3"}`;
      setDownloading(type);
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } catch {
        // Fallback: open in new tab
        window.open(url, "_blank");
      } finally {
        setDownloading(null);
      }
    },
    [track, videoUrl, downloading]
  );

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: track?.trackName || "Muse Music Video",
          text: `Check out this AI-generated music: ${track?.trackName}`,
          url: shareUrl,
        });
        shared = true;
      } catch {
        // navigator.share failed (e.g. in iframe, user cancelled) — fall through to clipboard
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
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
  }, [track]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!track || videoGenerating) return;
    setVideoGenerating(true);
    setVideoError(null);
    try {
      const result = await generateVideoMut.mutateAsync({
        audioUrl: track.audioUrl || "",
        imageUrl: track.imageUrl || undefined,
        trackName: track.trackName || track.styleId,
        styleId: track.styleId,
        color: color,
        melodyDescription: undefined,
      });
      setGeneratedVideoUrl(result.url);
      // Invalidate the track query so it picks up the new videoUrl from DB
      utils.gallery.getTrack.invalidate({ trackId });
    } catch (err: any) {
      console.error("Video generation failed:", err);
      setVideoError(err?.message || "Video generation failed. Please try again.");
    } finally {
      setVideoGenerating(false);
    }
  }, [track, videoGenerating, generateVideoMut, color, utils, trackId]);

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
        <Button onClick={() => navigate("/create")} className="gap-2 mt-2">
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
              onClick={() => navigate("/gallery")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={LOGO} alt="Muse" className="w-8 h-8" />
            <span className="font-display text-xl font-bold text-foreground">Muse</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/create")}
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
          {hasVideo ? (
            <div className="rounded-xl overflow-hidden border border-border/20 bg-black mb-6">
              <video
                src={videoUrl!}
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
            <div
              className="rounded-xl border border-border/20 p-6 mb-6 text-center"
              style={{ background: `linear-gradient(135deg, ${color}10, oklch(0.1 0.02 280))` }}
            >
              <Film className="w-12 h-12 mx-auto mb-3" style={{ color }} />
              <audio src={track.audioUrl} controls className="w-full" />
            </div>
          ) : null}

          {/* Primary action buttons */}
          <div className="flex gap-3 mb-3">
            {/* Download MP3 */}
            {track.audioUrl && (
              <Button
                onClick={() => handleDownload("audio")}
                disabled={downloading === "audio"}
                variant="outline"
                className="flex-1 gap-2 h-11"
              >
                {downloading === "audio" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                MP3
              </Button>
            )}

            {/* Download Video */}
            {hasVideo && (
              <Button
                onClick={() => handleDownload("video")}
                disabled={downloading === "video"}
                variant="outline"
                className="flex-1 gap-2 h-11"
              >
                <Film className="w-4 h-4" />
                Video
              </Button>
            )}

            {/* Share */}
            <Button
              onClick={handleShare}
              className="flex-1 gap-2 h-11 gradient-cosmic text-background border-0 hover:opacity-90"
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </Button>
          </div>

          {/* Generate Video button (always visible, whether video exists or not) */}
          {!hasVideo && track.audioUrl && (
            <Button
              onClick={handleGenerateVideo}
              disabled={videoGenerating}
              variant="outline"
              className="w-full gap-2 h-11 mb-3 border-primary/30 hover:bg-primary/5"
            >
              {videoGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Music Video... (2-5 min)
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  Create Music Video
                </>
              )}
            </Button>
          )}

          {/* Video error message */}
          {videoError && (
            <p className="text-xs text-destructive text-center mb-3">{videoError}</p>
          )}

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/20 bg-white/5">
              <img src={LOGO} alt="Muse" className="w-5 h-5" />
              <span className="text-xs text-muted-foreground">
                Created with <span className="font-semibold text-foreground">Muse</span> — AI Music Generator
              </span>
            </div>
            <div className="mt-3">
              <Button
                onClick={() => navigate("/create")}
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

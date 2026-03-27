import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Piano,
  Sparkles,
  Film,
  Share2,
  Music,
  ArrowRight,
  Zap,
  Globe,
  Users,
  ChevronRight,
  Play,
  Heart,
  Star,
} from "lucide-react";

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-hero-bg-PgKKzSChEL5YWPDsxHkCfZ.webp";
const FEATURE_HUM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-feature-hum-FXMeWgjEZrfYoVLsLwvHha.webp";
const FEATURE_AI =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-feature-ai-FP34QWdc9cxEH9c3U3SqxR.webp";
const FEATURE_VIDEO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-feature-video-MxfvnactXZHZXpWCQtujSh.webp";
const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const STEPS = [
  {
    icon: Mic,
    title: "Hum or Play",
    desc: "Sing a melody into your mic or tap notes on the virtual piano. No music theory needed.",
    color: "oklch(0.85 0.18 195)",
  },
  {
    icon: Sparkles,
    title: "AI Composes",
    desc: "Google Lyria 3 and Meta MusicGen transform your idea into a full, polished track in multiple styles.",
    color: "oklch(0.7 0.25 350)",
  },
  {
    icon: Film,
    title: "Generate Video",
    desc: "One tap creates a stunning 9:16 music video powered by Gemini Veo — ready for TikTok and Reels.",
    color: "oklch(0.82 0.16 80)",
  },
  {
    icon: Share2,
    title: "Share & Go Viral",
    desc: "Share your creation with a unique link. Let the world hear what was stuck in your head.",
    color: "oklch(0.7 0.15 160)",
  },
];

const STATS = [
  { value: "10+", label: "Music Styles", icon: Music },
  { value: "< 60s", label: "Generation Time", icon: Zap },
  { value: "9:16", label: "Video Ready", icon: Film },
  { value: "1-Tap", label: "Share to Social", icon: Globe },
];

const GENRES = [
  "Lo-fi",
  "Cinematic",
  "Jazz",
  "Electronic",
  "TikTok Viral",
  "Upbeat Pop",
  "Rock",
  "R&B",
  "Classical",
  "EDM",
];

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/create");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ========== NAV ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/20">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="Muse" className="w-8 h-8 rounded-lg" />
            <span className="font-display text-lg font-bold gradient-cosmic-text">
              Muse
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/gallery")}
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              Community
            </Button>
            <Button
              size="sm"
              onClick={handleGetStarted}
              className="gradient-cosmic text-primary-foreground font-semibold"
            >
              Start Creating
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background:
                  i % 3 === 0
                    ? "oklch(0.85 0.18 195 / 40%)"
                    : i % 3 === 1
                      ? "oklch(0.7 0.25 350 / 40%)"
                      : "oklch(0.82 0.16 80 / 40%)",
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container text-center max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-cyan-glow/30 text-cyan-glow bg-cyan-glow/5">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Google Lyria 3 + Meta MusicGen
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              Your melody.
              <br />
              <span className="gradient-cosmic-text">AI-composed.</span>
              <br />
              Video-ready.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Hum a tune or tap a melody. Muse transforms it into a
              professionally produced track with AI-generated music videos —
              ready to share on TikTok, Reels, and beyond.
            </motion.p>

            {/* CTA */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gradient-cosmic text-primary-foreground font-bold text-lg px-8 py-6 rounded-2xl glow-cyan hover:scale-105 transition-transform"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Create Your First Track
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/gallery")}
                className="text-foreground border-border/40 px-8 py-6 rounded-2xl hover:bg-white/5"
              >
                <Heart className="w-5 h-5 mr-2" />
                Explore Community
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex items-center justify-center gap-6 pt-6 text-muted-foreground/60 text-sm"
            >
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-glow fill-amber-glow" />
                No music knowledge required
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:flex items-center gap-1">
                Free to use
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:flex items-center gap-1">
                Works in browser
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronRight className="w-6 h-6 text-muted-foreground/40 rotate-90" />
        </motion.div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="relative py-12 border-y border-border/10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-cyan-glow" />
                <p className="font-display text-2xl sm:text-3xl font-bold gradient-cosmic-text">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24 relative">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-widest text-cyan-glow font-medium">
              How It Works
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              From idea to viral video in{" "}
              <span className="gradient-cosmic-text">4 steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-6 group hover:border-white/15 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${step.color}15`,
                      border: `1px solid ${step.color}30`,
                    }}
                  >
                    <step.icon
                      className="w-6 h-6"
                      style={{ color: step.color }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${step.color}15`,
                          color: step.color,
                        }}
                      >
                        {i + 1}
                      </span>
                      <h3 className="font-display text-lg font-semibold">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-24 relative">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-widest text-magenta-glow font-medium">
              Core Features
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Everything you need to{" "}
              <span className="gradient-cosmic-text">make music</span>
            </h2>
          </motion.div>

          {/* Feature 1: Input */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 items-center mb-20"
          >
            <div className="order-2 md:order-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-glow mb-3">
                <Mic className="w-3.5 h-3.5" />
                Natural Input
              </span>
              <h3 className="font-display text-2xl font-bold mb-4">
                Hum it. Play it. That's it.
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                No sheet music. No DAW experience. Just open your mouth and hum,
                or tap notes on our beautiful virtual piano. Muse captures your
                musical idea exactly as you imagine it.
              </p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 text-sm text-foreground/70">
                  <Mic className="w-4 h-4 text-cyan-glow" />
                  Voice Recording
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/70">
                  <Piano className="w-4 h-4 text-magenta-glow" />
                  Virtual Piano
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden border border-border/20 glow-cyan">
                <img
                  src={FEATURE_HUM}
                  alt="Hum or play your melody"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: AI */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 items-center mb-20"
          >
            <div>
              <div className="rounded-2xl overflow-hidden border border-border/20 glow-magenta">
                <img
                  src={FEATURE_AI}
                  alt="AI composition"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-magenta-glow mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Dual AI Engine
              </span>
              <h3 className="font-display text-2xl font-bold mb-4">
                Two AI models. Infinite possibilities.
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Google's Lyria 3 reimagines your melody with creative flair,
                while Meta's MusicGen stays faithful to your original vision.
                Choose from 10 genres — Lo-fi, Rock, Jazz, EDM, TikTok Viral,
                and more.
              </p>
              <div className="flex flex-wrap gap-2">
                {GENRES.slice(0, 6).map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-full text-xs border border-border/30 text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-full text-xs border border-magenta-glow/30 text-magenta-glow">
                  +4 more
                </span>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Video */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="order-2 md:order-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-glow mb-3">
                <Film className="w-3.5 h-3.5" />
                Video Generation
              </span>
              <h3 className="font-display text-2xl font-bold mb-4">
                Music videos that match your vibe.
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Powered by Google Veo, Muse generates stunning 9:16 vertical
                music videos perfectly synced to your track. One tap from
                creation to TikTok-ready content.
              </p>
              <div className="flex gap-4 text-sm text-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-glow" />
                  9:16 Vertical
                </span>
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-glow" />
                  1-Tap Share
                </span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden border border-border/20 glow-amber">
                <img
                  src={FEATURE_VIDEO}
                  alt="AI music video generation"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== POWERED BY ========== */}
      <section className="py-20 border-y border-border/10">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Powered By
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
              {[
                { name: "Google Lyria 3", desc: "Music Generation" },
                { name: "Meta MusicGen", desc: "Faithful Composition" },
                { name: "Google Veo", desc: "Video Generation" },
                { name: "Gemini", desc: "AI Intelligence" },
              ].map((tech) => (
                <div key={tech.name} className="text-center px-4">
                  <p className="font-display text-base font-semibold text-foreground/80">
                    {tech.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tech.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== META ECOSYSTEM ========== */}
      <section className="py-24 relative">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs uppercase tracking-widest text-amber-glow font-medium">
              Platform Ready
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Built for the{" "}
              <span className="gradient-cosmic-text">social era</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Every track and video is optimized for social platforms. 9:16
              vertical format, shareable links, and community features make Muse
              the perfect companion for content creators.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Film,
                title: "TikTok & Reels Ready",
                desc: "9:16 vertical videos generated automatically. Download and post in seconds.",
                color: "oklch(0.85 0.18 195)",
              },
              {
                icon: Users,
                title: "Community Gallery",
                desc: "Discover what others are creating. Get inspired by the global Muse community.",
                color: "oklch(0.7 0.25 350)",
              },
              {
                icon: Share2,
                title: "Instant Sharing",
                desc: "Every creation gets a unique shareable link. Web Share API + clipboard fallback.",
                color: "oklch(0.82 0.16 80)",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-6 text-center"
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: `${item.color}15`,
                    border: `1px solid ${item.color}30`,
                  }}
                >
                  <item.icon
                    className="w-6 h-6"
                    style={{ color: item.color }}
                  />
                </div>
                <h3 className="font-display font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 relative">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel rounded-3xl p-12 relative overflow-hidden"
          >
            {/* Glow effects */}
            <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-cyan-glow/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-magenta-glow/10 blur-3xl" />

            <div className="relative z-10">
              <Music className="w-10 h-10 mx-auto mb-4 text-cyan-glow" />
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Ready to make{" "}
                <span className="gradient-cosmic-text">your music</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                No downloads. No sign-ups required to explore. Just open your
                browser and start creating. Your next viral track is one hum
                away.
              </p>
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gradient-cosmic text-primary-foreground font-bold text-lg px-10 py-6 rounded-2xl glow-cyan hover:scale-105 transition-transform"
              >
                Start Creating — It's Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 border-t border-border/10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Muse" className="w-6 h-6 rounded-md" />
            <span className="font-display text-sm font-semibold text-muted-foreground">
              Muse
            </span>
            <span className="text-xs text-muted-foreground/50">
              · APAC AI New Bets Hackathon 2026
            </span>
          </div>
          <p className="text-xs text-muted-foreground/40">
            Powered by Google Lyria 3, Meta MusicGen, and Google Veo
          </p>
        </div>
      </footer>
    </div>
  );
}

/*
 * Muse Landing Page — "Liquid Cosmos" Design
 * Deep dark void background, bioluminescent accents, frosted glass panels
 * Font: Space Grotesk (display) + DM Sans (body)
 * 
 * Messaging: "Create your first BGM" — feelings-first, hands-on, no knowledge required
 */
import { motion, type Easing } from 'framer-motion';
import { useLocation } from 'wouter';
import { Music, Sparkles, Layers, Share2, ArrowRight, Palette, PenTool, Drum, Guitar, Wand2, Play, Heart, Headphones, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/hero-cosmic-bg-dQF7KEjpdvbhp2dhHCd8oj.webp';
const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp';

const steps = [
  { icon: Palette, title: 'Set the Mood', desc: 'How are you feeling? Pick a vibe — Ocean Sunset, Bamboo Forest, City Neon. Your mood becomes your musical palette.', color: '#00E5FF' },
  { icon: PenTool, title: 'Draw Your Melody', desc: 'No notes to read. Just draw a line — up for higher, down for lower. Hear it play as your finger moves.', color: '#FF006E' },
  { icon: Drum, title: 'Add a Beat', desc: 'Pick a rhythm that feels right, or skip drums entirely. Your music, your rules.', color: '#FFB800' },
  { icon: Guitar, title: 'Layer Instruments', desc: 'Toggle on strings, piano, guitar — hear them blend in real-time. Drag to adjust the mix.', color: '#2DD4BF' },
  { icon: Wand2, title: 'AI Polishes It', desc: 'One tap: AI adds a bass line, smooths transitions, and turns your sketch into a finished track.', color: '#A78BFA' },
  { icon: Share2, title: 'Play & Share', desc: 'Listen to YOUR composition. Watch the layers animate. Share it with the world.', color: '#FF7E7E' },
];

const EASE_OUT: Easing = "easeOut";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: EASE_OUT },
  }),
};

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Muse" className="w-8 h-8" />
            <span className="font-display text-xl font-bold text-foreground">Muse</span>
          </div>
          <Button
            onClick={() => navigate('/compose')}
            className="gradient-cosmic text-background font-semibold px-6 h-9 rounded-full border-0 hover:opacity-90 transition-opacity"
          >
            Create Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['#00E5FF', '#FF006E', '#FFB800'][i % 3],
                opacity: 0.4,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-foreground">Create Your</span>
            <br />
            <span className="gradient-cosmic-text">First BGM</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
          >
            Express your feelings with notes and create your very own background music.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
            className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#00E5FF' }}
          >
            With Muse, your music tutor — no knowledge required, just your feelings and mood.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => navigate('/compose')}
              size="lg"
              className="gradient-cosmic text-background font-semibold px-8 h-14 rounded-full border-0 text-lg hover:opacity-90 transition-all hover:scale-105 glow-cyan"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Creating — It's Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-12 border-border/50 text-foreground hover:bg-white/5 text-base"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </motion.div>

          {/* Taglines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 flex items-center justify-center gap-6 sm:gap-12"
          >
            {[
              { label: 'No Music Knowledge', icon: Heart, color: '#FF006E' },
              { label: '2 Minutes to Create', icon: Zap, color: '#FFB800' },
              { label: '"I Made This!"', icon: Headphones, color: '#00E5FF' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* "Why Muse?" — Emotional hook */}
      <section className="py-20 sm:py-28 relative">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.p variants={fadeUp} custom={0} className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              Ever had a melody stuck in your head but no way to get it out?
            </motion.p>
            <motion.p variants={fadeUp} custom={1} className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              Ever wished you could turn a <em>feeling</em> into a song?
            </motion.p>
            <motion.h2 variants={fadeUp} custom={2} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold">
              Muse turns your <span className="gradient-cosmic-text">emotions into music</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground text-base mt-6 max-w-lg mx-auto">
              No sheet music. No complex software. Just pick a mood, draw a line, and hear your feelings come alive — layer by layer.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 sm:py-32 relative">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 mb-6">
              <Layers className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-sm text-muted-foreground">6 Simple Steps</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              From Feeling to <span className="gradient-cosmic-text">Finished Track</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Muse guides you step by step. Each layer adds depth. You make every creative choice.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
                className="glass-panel rounded-2xl p-6 group hover:border-white/15 transition-all duration-500"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110"
                  style={{ background: `${step.color}15`, color: step.color }}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                  <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Muse Different */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-void-light/30 to-background" />
        <div className="container relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Why Muse Feels <span className="gradient-cosmic-text">Different</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Other tools make music for you or overwhelm you. Muse is the sweet spot.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'AI Generators',
                  subtitle: 'Suno, Udio',
                  problem: 'Type a prompt, get a song. You never touch the music.',
                  verdict: 'You\'re a listener',
                  color: '#FF006E',
                },
                {
                  title: 'Muse',
                  subtitle: 'Your Music Tutor',
                  problem: 'You choose the mood, draw the melody, pick the instruments. AI helps you finish.',
                  verdict: 'You\'re the creator',
                  color: '#00E5FF',
                  highlighted: true,
                },
                {
                  title: 'DAWs',
                  subtitle: 'GarageBand, FL Studio',
                  problem: 'Blank timeline, 100+ buttons. Most people quit before finishing a track.',
                  verdict: 'You\'re overwhelmed',
                  color: '#FFB800',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className={`rounded-2xl p-6 text-center ${
                    item.highlighted
                      ? 'glass-panel border-primary/30 glow-cyan'
                      : 'glass-panel'
                  }`}
                >
                  <h3 className="font-display text-xl font-bold mb-1" style={{ color: item.color }}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{item.subtitle}</p>
                  <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{item.problem}</p>
                  <div
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: `${item.color}20`, color: item.color }}
                  >
                    {item.verdict}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Use Cases */}
      <section className="py-24 sm:py-32">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Music for <span className="gradient-cosmic-text">Every Moment</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg mb-12">
              Create BGM for your videos, podcasts, study sessions, or just for fun.
            </motion.p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: '🎬', label: 'Video BGM', desc: 'YouTube, TikTok, Reels' },
                { emoji: '🎙️', label: 'Podcast Intros', desc: 'Unique show identity' },
                { emoji: '📚', label: 'Study Music', desc: 'Focus & concentration' },
                { emoji: '🎮', label: 'Game Soundtracks', desc: 'Indie game vibes' },
              ].map((useCase, i) => (
                <motion.div
                  key={useCase.label}
                  variants={fadeUp}
                  custom={i + 2}
                  className="glass-panel rounded-2xl p-5 text-center group hover:border-white/15 transition-all duration-500"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{useCase.emoji}</div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1">{useCase.label}</h3>
                  <p className="text-xs text-muted-foreground">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
        </div>
        <div className="container relative text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Your First BGM is
            </motion.h2>
            <motion.h2 variants={fadeUp} custom={0.5} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-cosmic-text">2 Minutes Away</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              No account. No music theory. No downloads. Just open Muse and start creating.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button
                onClick={() => navigate('/compose')}
                size="lg"
                className="gradient-cosmic text-background font-semibold px-10 h-14 rounded-full border-0 text-lg hover:opacity-90 transition-all hover:scale-105 glow-cyan"
              >
                Create My First BGM
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Muse" className="w-6 h-6" />
            <span className="font-display text-sm font-semibold text-foreground">Muse</span>
            <span className="text-xs text-muted-foreground">· Your AI Music Tutor</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by Meta MusicGen</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

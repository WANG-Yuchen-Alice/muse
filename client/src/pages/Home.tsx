/*
 * Muse Landing Page — "Liquid Cosmos" Design
 * Deep dark void background, bioluminescent accents, frosted glass panels
 * Font: Space Grotesk (display) + DM Sans (body)
 */
import { motion, type Easing } from 'framer-motion';
import { useLocation } from 'wouter';
import { Music, Sparkles, Layers, Share2, ArrowRight, Palette, PenTool, Drum, Guitar, Wand2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/hero-cosmic-bg-dQF7KEjpdvbhp2dhHCd8oj.webp';
const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/muse-logo-iAru96gtvvShY97Zw7G2SK.webp';

const steps = [
  { icon: Palette, title: 'Choose a Theme', desc: 'Pick a mood — Ocean Sunset, Bamboo Forest, City Neon, and more. The theme sets your musical palette.', color: '#00E5FF' },
  { icon: PenTool, title: 'Sketch the Melody', desc: 'Draw a line on the canvas. Y-axis is pitch, X-axis is time. Hear your melody come alive as you draw.', color: '#FF006E' },
  { icon: Drum, title: 'Choose the Rhythm', desc: 'AI suggests drum patterns that complement your melody. Pick one, adjust the density.', color: '#FFB800' },
  { icon: Guitar, title: 'Add Harmony', desc: 'Toggle instruments on and off — strings, piano, synth pads. AI ensures everything harmonizes.', color: '#2DD4BF' },
  { icon: Wand2, title: 'AI Completes the Mix', desc: 'One tap: AI generates the bass line, adds transitions, and produces a polished final mix.', color: '#A78BFA' },
  { icon: Share2, title: 'Preview & Share', desc: 'Watch your composition come alive with layered visualization. Export and share to the world.', color: '#FF7E7E' },
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
            Start Creating
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
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-amber-glow" style={{ color: '#FFB800' }} />
              <span className="text-sm text-muted-foreground">Meta AI Hackathon 2026</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-foreground">Your AI</span>
            <br />
            <span className="gradient-cosmic-text">Music Teacher</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Suno makes music <em>for</em> you. Muse teaches you to <em>make</em> music.
            Compose layer by layer through a guided, beautiful flow — no music theory required.
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
              className="gradient-cosmic text-background font-semibold px-8 h-12 rounded-full border-0 text-base hover:opacity-90 transition-all hover:scale-105 glow-cyan"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Composing — Free
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 flex items-center justify-center gap-8 sm:gap-16"
          >
            {[
              { label: 'No Music Theory', icon: '🎓' },
              { label: '2 Min to Create', icon: '⚡' },
              { label: '"I Made This"', icon: '🎵' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
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
              Build Music <span className="gradient-cosmic-text">Layer by Layer</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-xl mx-auto">
              No blank timeline. No text prompt. Just a guided, beautiful flow from mood to masterpiece.
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

      {/* Value Proposition */}
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
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Not a Generator. Not a DAW.
                <br />
                <span className="gradient-cosmic-text">A New Category.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'AI Generators',
                  subtitle: 'Suno, Udio',
                  problem: 'Type a prompt, get a song. Zero creative involvement.',
                  verdict: 'You\'re a consumer',
                  color: '#FF006E',
                },
                {
                  title: 'Muse',
                  subtitle: 'The Middle Path',
                  problem: 'AI guides you step by step. You make every creative decision.',
                  verdict: 'You\'re the creator',
                  color: '#00E5FF',
                  highlighted: true,
                },
                {
                  title: 'DAWs',
                  subtitle: 'GarageBand, BandLab',
                  problem: 'Blank timeline, 100+ buttons. Most users never finish a track.',
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

      {/* Duolingo Comparison */}
      <section className="py-24 sm:py-32">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              The <span className="gradient-cosmic-text">Duolingo</span> Model for Music
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg mb-12">
              Duolingo proved 50M people want to learn languages through guided play.
              Muse brings the same model to music composition.
            </motion.p>

            <motion.div variants={fadeUp} custom={2} className="glass-panel rounded-2xl p-8 text-left">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-display font-semibold text-muted-foreground">Metric</div>
                <div className="font-display font-semibold" style={{ color: '#2DD4BF' }}>Duolingo</div>
                <div className="font-display font-semibold" style={{ color: '#00E5FF' }}>Muse Opportunity</div>

                <div className="text-muted-foreground border-t border-border/30 pt-3">DAU</div>
                <div className="text-foreground border-t border-border/30 pt-3">50M+</div>
                <div className="text-foreground border-t border-border/30 pt-3">100M+ BandLab users</div>

                <div className="text-muted-foreground border-t border-border/30 pt-3">Revenue</div>
                <div className="text-foreground border-t border-border/30 pt-3">$600M+/yr</div>
                <div className="text-foreground border-t border-border/30 pt-3">CAGR 8-10%</div>

                <div className="text-muted-foreground border-t border-border/30 pt-3">Key Insight</div>
                <div className="text-foreground border-t border-border/30 pt-3">Guided learning beats textbooks</div>
                <div className="text-foreground border-t border-border/30 pt-3">Guided creation beats blank DAW</div>
              </div>
            </motion.div>
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
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Compose?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Create your first composition in under 2 minutes. No account needed. No music theory required.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button
                onClick={() => navigate('/compose')}
                size="lg"
                className="gradient-cosmic text-background font-semibold px-10 h-14 rounded-full border-0 text-lg hover:opacity-90 transition-all hover:scale-105 glow-cyan"
              >
                Start Creating — It's Free
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
            <span className="text-xs text-muted-foreground">· AI Music Composition</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Built with Meta MusicGen</span>
            <span>·</span>
            <span>APAC New Bets Hackathon 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

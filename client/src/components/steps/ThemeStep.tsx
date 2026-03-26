/*
 * Step 1: Choose a Theme
 * - Cards with theme images, auto-sets BPM/key/scale
 * - Plays MusicGen-generated BGM preview when theme is clicked
 * - Shows a tone selector to override the melody instrument
 */
import { useComposition } from '@/contexts/CompositionContext';
import type { MelodyTone } from '@/contexts/CompositionContext';
import { THEMES, TONE_OPTIONS, THEME_SAMPLES } from '@/lib/themes';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Music, Volume2, Loader2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useEffect, useState } from 'react';

export default function ThemeStep() {
  const { selectedTheme, selectTheme, melodyTone, setMelodyTone, nextStep } = useComposition();
  const { playSampleMelody, stopSampleMelody, setTone, samplesLoaded } = useAudioEngine();

  // HTML5 Audio for MusicGen preview
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPreviewPlaying(false);
    setPreviewThemeId(null);
  };

  const playPreview = (theme: typeof THEMES[0]) => {
    // Stop any existing preview
    stopPreview();
    stopSampleMelody();

    // Create new audio element for the MusicGen preview
    const audio = new Audio(theme.previewAudioUrl);
    audio.loop = true;
    audio.volume = 0.7;
    audioRef.current = audio;

    audio.addEventListener('play', () => {
      setIsPreviewPlaying(true);
      setPreviewThemeId(theme.id);
    });
    audio.addEventListener('ended', () => {
      setIsPreviewPlaying(false);
      setPreviewThemeId(null);
    });
    audio.addEventListener('error', () => {
      // Fallback to Tone.js sample melody if CDN audio fails
      const sample = THEME_SAMPLES[theme.id];
      if (sample) {
        playSampleMelody(sample, theme.defaultTone);
      }
    });

    audio.play().catch(() => {
      // Autoplay blocked — fallback to Tone.js
      const sample = THEME_SAMPLES[theme.id];
      if (sample) {
        playSampleMelody(sample, theme.defaultTone);
      }
    });
  };

  const handleThemeClick = async (theme: typeof THEMES[0]) => {
    selectTheme(theme);
    setTone(theme.defaultTone);
    playPreview(theme);
  };

  const handleToneChange = async (tone: MelodyTone) => {
    setMelodyTone(tone);
    setTone(tone);

    // Replay the Tone.js sample with the new tone to demonstrate the instrument
    if (selectedTheme) {
      const sample = THEME_SAMPLES[selectedTheme.id];
      if (sample) {
        stopSampleMelody();
        await playSampleMelody(sample, tone);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container py-8 pb-24 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              What's the <span className="gradient-cosmic-text">mood</span>?
            </h1>
            <p className="text-muted-foreground">
              Pick a theme — it sets your musical palette. Click to hear a preview.
            </p>
          </motion.div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {THEMES.map((theme, i) => {
            const isSelected = selectedTheme?.id === theme.id;
            const isPlaying = previewThemeId === theme.id && isPreviewPlaying;
            return (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                onClick={() => handleThemeClick(theme)}
                className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                  isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                style={{
                  outline: isSelected ? `2px solid ${theme.color}` : 'none',
                  outlineOffset: '-2px',
                }}
              >
                {/* Background Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={theme.image}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: theme.color }}
                    >
                      <Check className="w-5 h-5 text-background" />
                    </motion.div>
                  )}

                  {/* Sound indicator when playing */}
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-3 left-3"
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-white"
                        style={{ background: `${theme.color}90` }}
                      >
                        <Volume2 className="w-3 h-3" />
                        Playing preview
                        {/* Animated sound bars */}
                        <div className="flex items-end gap-0.5 h-3 ml-1">
                          {[0, 1, 2].map((j) => (
                            <motion.div
                              key={j}
                              className="w-0.5 rounded-full bg-white"
                              animate={{ height: ['30%', '100%', '50%', '80%', '30%'] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.15 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{theme.emoji}</span>
                      <h3 className="font-display text-lg font-bold text-white">{theme.name}</h3>
                    </div>
                    <p className="text-xs text-white/60 mb-2">{theme.nameZh}</p>
                    <p className="text-xs text-white/80 leading-relaxed">{theme.description}</p>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.color}30`, color: theme.color }}
                      >
                        {theme.bpmRange[0]}-{theme.bpmRange[1]} BPM
                      </span>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.color}30`, color: theme.color }}
                      >
                        {theme.key} {theme.scale}
                      </span>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.color}30`, color: theme.color }}
                      >
                        {TONE_OPTIONS.find(t => t.id === theme.defaultTone)?.emoji}{' '}
                        {TONE_OPTIONS.find(t => t.id === theme.defaultTone)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Tone Selector — appears after theme is selected */}
        <AnimatePresence>
          {selectedTheme && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto mt-8"
            >
              <div className="glass-panel rounded-2xl p-5">
                <div className="text-center mb-4">
                  <h3 className="font-display text-lg font-semibold mb-1">
                    Choose your <span style={{ color: selectedTheme.color }}>instrument tone</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This sets how your melody sounds. Click to hear the difference.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TONE_OPTIONS.map((tone) => {
                    const isActive = melodyTone === tone.id;
                    return (
                      <motion.button
                        key={tone.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleToneChange(tone.id)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'text-background font-semibold'
                            : 'glass-panel hover:bg-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                        style={isActive ? { background: selectedTheme.color } : {}}
                      >
                        <span className="text-2xl">{tone.emoji}</span>
                        <span className="text-xs font-medium">{tone.name}</span>
                        <span className={`text-[10px] ${isActive ? 'text-background/70' : 'text-muted-foreground/60'}`}>
                          {tone.description}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="tone-indicator"
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-background"
                          >
                            <Check className="w-2.5 h-2.5" style={{ color: selectedTheme.color }} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {!samplesLoaded && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading instrument samples...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-border/30 py-4">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTheme ? (
              <span>
                Selected: <strong className="text-foreground">{selectedTheme.emoji} {selectedTheme.name}</strong>
                {' · '}
                <span style={{ color: selectedTheme.color }}>
                  {TONE_OPTIONS.find(t => t.id === melodyTone)?.emoji} {TONE_OPTIONS.find(t => t.id === melodyTone)?.name}
                </span>
              </span>
            ) : (
              'Choose a theme to continue'
            )}
          </div>
          <Button
            onClick={() => {
              stopPreview(); // Stop audio before navigating
              nextStep();
            }}
            disabled={!selectedTheme}
            className="gradient-cosmic text-background font-semibold px-6 rounded-full border-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Music className="w-4 h-4 mr-2" />
            Sketch Melody
          </Button>
        </div>
      </div>
    </div>
  );
}

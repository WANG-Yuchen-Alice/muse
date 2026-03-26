import type { Theme, MelodyTone } from '@/contexts/CompositionContext';

export const THEMES: Theme[] = [
  {
    id: 'ocean-sunset',
    name: 'Ocean Sunset',
    nameZh: '海浪日落',
    emoji: '🌊',
    description: 'Warm, flowing melodies with gentle waves of sound',
    bpmRange: [70, 95],
    key: 'D',
    scale: 'major',
    instruments: ['piano', 'strings', 'synth-pad', 'acoustic-guitar'],
    color: '#FF6B35',
    accentColor: '#00B4D8',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-ocean-sunset-GzCzB5RrbL8JLM8sQpFkZB.webp',
    defaultTone: 'piano',
    previewAudioUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-preview-ocean-sunset_0e5ae494.mp3',
  },
  {
    id: 'bamboo-forest',
    name: 'Bamboo Forest',
    nameZh: '竹林清风',
    emoji: '🎋',
    description: 'Serene, meditative tones inspired by nature',
    bpmRange: [60, 85],
    key: 'G',
    scale: 'pentatonic',
    instruments: ['flute', 'piano', 'strings', 'wind-chimes'],
    color: '#2DD4BF',
    accentColor: '#A3E635',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-bamboo-forest-bkb2M7JvSmLfdCgtHD5SEZ.webp',
    defaultTone: 'flute',
    previewAudioUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-preview-bamboo-forest_6c8cf595.mp3',
  },
  {
    id: 'city-neon',
    name: 'City Neon',
    nameZh: '城市霓虹',
    emoji: '🌃',
    description: 'Energetic, pulsing beats with electric atmosphere',
    bpmRange: [110, 140],
    key: 'A',
    scale: 'minor',
    instruments: ['synth-lead', 'synth-bass', 'drum-machine', 'electric-piano'],
    color: '#FF006E',
    accentColor: '#00E5FF',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-city-neon-a7oQjagSjdJscMvoBWDwY2.webp',
    defaultTone: 'electronic',
    previewAudioUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-preview-city-neon_4cb24182.mp3',
  },
  {
    id: 'rainy-cafe',
    name: 'Rainy Café',
    nameZh: '雨夜咖啡',
    emoji: '☕',
    description: 'Cozy, intimate melodies with warm undertones',
    bpmRange: [75, 100],
    key: 'F',
    scale: 'major',
    instruments: ['piano', 'acoustic-guitar', 'soft-drums', 'bass'],
    color: '#FFB800',
    accentColor: '#FF7E7E',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-rainy-cafe-68Hmi3CgJNFmbh26hmYThU.webp',
    defaultTone: 'guitar',
    previewAudioUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-preview-rainy-cafe_0a96f823.mp3',
  },
  {
    id: 'stargazing',
    name: 'Stargazing',
    nameZh: '星空冥想',
    emoji: '✨',
    description: 'Ethereal, ambient soundscapes for deep reflection',
    bpmRange: [55, 75],
    key: 'E',
    scale: 'minor',
    instruments: ['synth-pad', 'strings', 'bells', 'ambient-texture'],
    color: '#A78BFA',
    accentColor: '#67E8F9',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-stargazing-SceYXcPWyRfdigA834GBZf.webp',
    defaultTone: 'violin',
    previewAudioUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298187430/VBztMERnZXrMaUjwVoLUNH/theme-preview-stargazing_31a7a358.mp3',
  },
];

// Tone display info for the UI
export const TONE_OPTIONS: { id: MelodyTone; name: string; emoji: string; description: string }[] = [
  { id: 'piano', name: 'Piano', emoji: '🎹', description: 'Warm, expressive keys' },
  { id: 'violin', name: 'Violin', emoji: '🎻', description: 'Rich, emotional strings' },
  { id: 'flute', name: 'Flute', emoji: '🪈', description: 'Airy, meditative breath' },
  { id: 'guitar', name: 'Guitar', emoji: '🎸', description: 'Intimate, acoustic warmth' },
  { id: 'electronic', name: 'Electronic', emoji: '🎛️', description: 'Sharp, modern synth' },
];

// Sample melodies for each theme — played when user clicks a theme card
// Each is an array of { note, duration } pairs that create a short recognizable motif
export interface SampleNote {
  note: string;
  duration: string;
  time: number; // in seconds from start
}

export const THEME_SAMPLES: Record<string, SampleNote[]> = {
  'ocean-sunset': [
    { note: 'D4', duration: '4n', time: 0 },
    { note: 'F#4', duration: '8n', time: 0.4 },
    { note: 'A4', duration: '4n', time: 0.7 },
    { note: 'G4', duration: '8n', time: 1.2 },
    { note: 'F#4', duration: '4n', time: 1.5 },
    { note: 'E4', duration: '8n', time: 2.0 },
    { note: 'D4', duration: '2n', time: 2.3 },
  ],
  'bamboo-forest': [
    { note: 'G4', duration: '4n', time: 0 },
    { note: 'A4', duration: '8n', time: 0.5 },
    { note: 'B4', duration: '4n', time: 0.8 },
    { note: 'D5', duration: '8n', time: 1.4 },
    { note: 'B4', duration: '4n', time: 1.7 },
    { note: 'A4', duration: '8n', time: 2.3 },
    { note: 'G4', duration: '2n', time: 2.6 },
  ],
  'city-neon': [
    { note: 'A4', duration: '8n', time: 0 },
    { note: 'C5', duration: '8n', time: 0.2 },
    { note: 'E5', duration: '8n', time: 0.4 },
    { note: 'A4', duration: '8n', time: 0.6 },
    { note: 'G4', duration: '4n', time: 0.8 },
    { note: 'F4', duration: '8n', time: 1.1 },
    { note: 'E4', duration: '8n', time: 1.3 },
    { note: 'A4', duration: '4n', time: 1.5 },
  ],
  'rainy-cafe': [
    { note: 'F4', duration: '4n', time: 0 },
    { note: 'A4', duration: '8n', time: 0.5 },
    { note: 'C5', duration: '4n', time: 0.8 },
    { note: 'Bb4', duration: '8n', time: 1.4 },
    { note: 'A4', duration: '4n', time: 1.7 },
    { note: 'G4', duration: '8n', time: 2.2 },
    { note: 'F4', duration: '2n', time: 2.5 },
  ],
  'stargazing': [
    { note: 'E4', duration: '2n', time: 0 },
    { note: 'G4', duration: '4n', time: 0.8 },
    { note: 'B4', duration: '2n', time: 1.3 },
    { note: 'A4', duration: '4n', time: 2.1 },
    { note: 'G4', duration: '4n', time: 2.6 },
    { note: 'E4', duration: '2n', time: 3.1 },
  ],
};

export const SCALE_NOTES: Record<string, string[]> = {
  'D-major': ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5'],
  'G-pentatonic': ['G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5'],
  'A-minor': ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
  'F-major': ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
  'E-minor': ['E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'],
};

export function getScaleNotes(theme: Theme): string[] {
  const key = `${theme.key}-${theme.scale}`;
  return SCALE_NOTES[key] || SCALE_NOTES['D-major'];
}

export const DRUM_PATTERNS = [
  {
    id: 'gentle-groove',
    name: 'Gentle Groove',
    emoji: '🌿',
    description: 'Soft, understated rhythm with light touches',
    density: 30,
    pattern: [
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // kick
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // snare
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // hihat
    ],
  },
  {
    id: 'steady-pulse',
    name: 'Steady Pulse',
    emoji: '💗',
    description: 'Balanced beat with a confident, driving feel',
    density: 55,
    pattern: [
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0], // kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // hihat
    ],
  },
  {
    id: 'energetic-drive',
    name: 'Energetic Drive',
    emoji: '⚡',
    description: 'Upbeat, lively rhythm with dynamic energy',
    density: 80,
    pattern: [
      [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0], // kick
      [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1], // snare
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // hihat
    ],
  },
  {
    id: 'lofi-chill',
    name: 'Lo-fi Chill',
    emoji: '🌙',
    description: 'Laid-back, dusty hip-hop groove with swing',
    density: 40,
    pattern: [
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], // kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], // snare
      [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0], // hihat
    ],
  },
  {
    id: 'reggaeton',
    name: 'Reggaeton',
    emoji: '🔥',
    description: 'Latin-inspired dembow rhythm, infectious bounce',
    density: 65,
    pattern: [
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], // kick
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // snare
      [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1], // hihat
    ],
  },
  {
    id: 'shuffle',
    name: 'Jazz Shuffle',
    emoji: '🎷',
    description: 'Swinging triplet feel, smooth and sophisticated',
    density: 50,
    pattern: [
      [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0], // kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], // hihat (triplet feel)
    ],
  },
];

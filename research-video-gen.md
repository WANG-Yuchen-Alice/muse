# Research: Video Generation & Social Share for Muse

## Current State
- MP4 export: static image + audio via ffmpeg (`createMp4WithImage`)
- Canvas animations: 4 style-specific renderers (lofi, cinematic, jazz, electronic) — client-side only
- Style images: AI-generated per genre, stored in DB
- Audio: 30s tracks from MusicGen (faithful) and Lyria 3 (reimagined)
- Storage: Forge proxy → CDN URLs

## Social Media Video Specs (2025/2026)
| Platform | Aspect Ratio | Resolution | Duration | Format |
|---|---|---|---|---|
| TikTok | 9:16 | 1080x1920 | 15s-10min | MP4 |
| Instagram Reels | 9:16 | 1080x1920 | up to 3min | MP4 |
| YouTube Shorts | 9:16 | 1080x1920 | up to 60s | MP4 |
| Spotify Canvas | 9:16 | 720-1080px tall | 3-8s loop | MP4/JPG |
| Twitter/X | 16:9 or 1:1 | 1280x720+ | up to 2:20 | MP4 |

## Approach Options

### Tier 1: Enhanced FFmpeg (Low cost, fast, deterministic)
- Use ffmpeg `showwaves`, `showfreqs`, `avectorscope` filters
- Overlay audio visualization on style background image
- Can add text overlays (track name, artist, branding)
- Vertical 9:16 output for social media
- **Pros**: Free, fast (~5-10s render), deterministic, server-side
- **Cons**: Limited visual creativity, looks "generated"
- **Cost**: $0 (just compute time)

### Tier 2: Remotion (Medium cost, high quality, programmable)
- React-based video rendering framework
- Full audio visualization APIs (visualizeAudio, visualizeAudioWaveform)
- Can reuse existing StyleAnimation canvas renderers
- Server-side rendering via @remotion/renderer
- **Pros**: Full creative control, React ecosystem, audio-reactive, reuse existing code
- **Cons**: Heavier infra (needs Puppeteer/Chrome), slower render, licensing cost
- **Cost**: Remotion license needed for commercial use

### Tier 3: AI Video Generation (High cost, cinematic, non-deterministic)
- Image-to-video models on Replicate:
  - **Veo 3.1 Fast** (Google): audio-aware, high fidelity, ~$0.10-0.50/video
  - **Wan 2.5 I2V**: open source, background audio, ~$0.05-0.15/video
  - **Kling v2.5 Turbo Pro**: smooth motion, ~$0.10-0.30/video
  - **Seedance 1 Pro**: 5-10s, 720p, ~$0.10-0.20/video
  - **Hailuo 2.3** (MiniMax): realistic motion, ~$0.15-0.40/video
- Use existing style image as first frame → animate it
- **Pros**: Stunning cinematic quality, "wow" factor
- **Cons**: Expensive at scale, slow (30-120s), non-deterministic, 5-10s only (need to loop/extend)
- **Cost**: $0.05-0.50 per video generation

### Tier 4: Hybrid Approach (Recommended)
Combine Tier 1 + Tier 3:
1. **Quick share** (Tier 1): FFmpeg-based, instant, always available
   - Audio waveform/spectrum overlay on style image
   - Track name + branding text overlay
   - 9:16 vertical format
2. **Premium video** (Tier 3): AI-generated, optional upgrade
   - Use style image as first frame
   - AI animates it into a cinematic 5-10s clip
   - Loop to match audio duration
   - Higher "wow" factor for social sharing

## Share Features
1. **One-click download** in social media formats (9:16 vertical)
2. **Direct share** to TikTok/Instagram/Twitter via Web Share API
3. **Share page** with unique URL per track (public playback page)
4. **Spotify Canvas** export (3-8s loop, 9:16)
5. **QR code** generation for easy mobile sharing
6. **Embed code** for websites/blogs

## Replicate Models Already Used
- MusicGen (meta/musicgen): already integrated for melody-conditioned generation
- Can easily add image-to-video models via same Replicate API pattern

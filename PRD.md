# Muse — Product Requirements Document

**Version:** 2.0  
**Date:** March 30, 2026  
**Authors:** Muse Team  
**Hackathon:** APAC AI New Bets Hackathon

---

## Executive Summary

Muse is an AI-powered music creation platform that transforms anyone into a music producer. Users simply hum a melody or play a few notes on a virtual piano, and Muse's AI engine generates polished, multi-style music tracks complete with AI-generated cinematic scene videos optimized for social sharing on Instagram Reels, TikTok, and other short-form video platforms. Muse democratizes music creation by eliminating the need for musical training, expensive software, or production expertise, making the creative process as intuitive as humming a tune.

The platform leverages Google's Lyria 3 for creative reimagination, Meta's MusicGen for faithful melody reproduction, MiniMax's Hailuo 2.3 for AI scene video generation, and Spotify's Basic Pitch for intelligent hum-to-notes conversion. Muse targets the intersection of three explosive growth markets: AI music generation ($569M in 2024, projected to reach $2.8B by 2030 [1]), short-form video content creation (2B+ daily Reels plays on Instagram [2]), and the creator economy ($250B+ globally [3]).

**Tagline:** *Turn your hum into music. Go viral.*

---

## 1. Problem Statement

### 1.1 The Creation Gap

Over 80% of people enjoy music daily, yet fewer than 5% can create it. The barrier is not a lack of creativity or desire — it is the prohibitive complexity of traditional music production. Professional Digital Audio Workstations (DAWs) like Ableton Live, Logic Pro, and FL Studio require months of learning, cost hundreds of dollars, and demand knowledge of music theory, mixing, and mastering. This creates what we call the **Creation Gap**: the vast distance between having a musical idea (a melody in your head, a rhythm you tap on a desk) and producing a shareable piece of music.

Existing AI music tools like Suno ($2.45B valuation, $200M ARR [4]) and Udio have begun to close this gap, but they approach the problem from a text-prompt paradigm — users describe music in words ("upbeat electronic track with synth pads"). This approach fundamentally misunderstands how most people experience music: not through verbal description, but through **feeling, humming, and movement**. When you have a melody stuck in your head, you hum it — you do not write a paragraph describing it.

### 1.2 The Distribution Bottleneck

Even when users successfully create music with existing tools, they face a second barrier: **distribution**. Raw audio files are not shareable on social media. The dominant content format across Instagram Reels, TikTok, and YouTube Shorts is short-form video with synchronized visuals. Converting an audio track into a visually compelling, platform-optimized video requires video editing skills, visual design sense, and knowledge of platform-specific formats (9:16 aspect ratio, 15-60 second duration, attention-grabbing first frames).

Muse solves both problems in a single, seamless flow: **Hum → Music → Video → Share**.

---

## 2. Market Sizing

### 2.1 Total Addressable Market (TAM)

The TAM for Muse sits at the intersection of three converging markets:

| Market Segment | 2024 Size | 2030 Projected | CAGR | Source |
|---|---|---|---|---|
| AI Music Generation | $569.7M | $2,794.7M | ~30% | Grand View Research [1] |
| Creator Economy | $250B+ | $480B+ | ~15% | Goldman Sachs [3] |
| Short-Form Video Tools | $1.8B | $8.2B | ~28% | Mordor Intelligence [5] |

The combined TAM exceeds **$11B by 2030**, representing the total opportunity for a platform that unifies music creation, video production, and social distribution.

### 2.2 Serviceable Addressable Market (SAM)

Muse's SAM focuses on non-professional music creators who actively use social media platforms in the APAC region:

- **APAC social media users**: 2.3B+ (60% of global social media users) [6]
- **Content creators in APAC**: ~120M active creators [7]
- **Music-interested creators**: ~35% of creators regularly use music in content = ~42M
- **Willingness to pay for AI tools**: ~25% at $5-15/month = ~10.5M potential subscribers
- **SAM**: ~$630M-$1.9B annually

### 2.3 Serviceable Obtainable Market (SOM)

In the first 18 months post-launch, Muse targets:

- **Year 1 target users**: 500K registered users (organic + social platform distribution)
- **Conversion to paid**: 5% = 25K paying subscribers
- **Average revenue per user (ARPU)**: $8/month
- **Year 1 SOM**: ~$2.4M ARR
- **Year 3 target**: 5M users, 250K paid subscribers, $24M ARR

### 2.4 Market Timing

Several converging trends make this the optimal moment for Muse. The release of Google's Lyria 3 Clip in 2025-2026 has made high-fidelity music generation accessible via API for the first time. MiniMax's Hailuo 2.3 delivers reliable, high-quality video generation at scale. The short-form video market continues to grow at 28% CAGR, with Instagram Reels alone seeing 2B+ daily plays. Meanwhile, Suno's rapid growth to $200M ARR validates massive consumer demand for AI music creation.

---

## 3. Moonshot Vision

### 3.1 The 10x Opportunity

Muse's moonshot is to become the **universal music creation layer** — a platform where any human emotion, gesture, or sound can be transformed into professional-quality music and visual content, instantly shareable across all social platforms.

Today, Muse starts with hum-to-music. But the underlying architecture is designed for a much larger vision:

**Phase 1 (Current — Hackathon MVP):** Hum or play a melody → AI generates multi-style tracks → AI creates cinematic scene videos → One-tap share to social platforms.

**Phase 2 (6 months):** Real-time collaborative music creation. Multiple users hum different parts simultaneously, and AI weaves them into a cohesive composition. Integration with immersive platforms for spatial music creation.

**Phase 3 (12 months):** Ambient music generation. Muse on smart glasses or wearables listens to your environment (a rainstorm, a bustling cafe, a quiet forest) and generates a personalized soundtrack that evolves with your surroundings in real-time.

**Phase 4 (24 months):** The Music Social Network. A TikTok-like feed where every piece of content is AI-generated music + video, created by everyday people. Users remix each other's melodies, collaborate across continents, and build musical conversations. The platform becomes a new form of social expression where music replaces text as the primary communication medium.

### 3.2 Why This Matters

Music is the most universal human language. Every culture, every civilization, every era has music. Yet the ability to create music has been gatekept by technical skill for centuries. Muse's moonshot is to make music creation as natural and accessible as speaking — because humming IS speaking, in the language of music.

---

## 4. Social Platform Compatibility

### 4.1 Platform Integration Architecture

Muse is designed as a **social-native creation tool**, optimized for distribution across major social and messaging platforms:

| Platform | Integration Point | User Value |
|---|---|---|
| **Instagram Reels** | One-tap export of 9:16 AI music videos | Instant social sharing with optimized format |
| **TikTok** | 9:16 portrait video with music | Native format for viral distribution |
| **YouTube Shorts** | Cross-post music videos | Extended reach on Google's platform |
| **WhatsApp** | Share creation links + audio previews | Viral distribution through messaging |
| **Threads** | Share music creation stories | Community building around music creation |
| **Smart Glasses** | Hum-to-music via built-in mic | Hands-free music creation on the go |
| **VR/MR Headsets** | Immersive music studio | Spatial audio creation and collaboration |

### 4.2 Instagram Reels Deep Integration

Instagram Reels is the primary distribution channel for Muse-generated content. Muse generates videos in the exact 9:16 portrait format at 1080x1920 resolution that Instagram Reels requires. Each video includes AI-generated cinematic scene visuals that match the music's mood and style (e.g., neon cityscapes for electronic music, serene landscapes for lo-fi). Users can share directly from Muse to Instagram with pre-filled captions and relevant hashtags.

### 4.3 Audio Reuse and Remix Cycle

Instagram's audio reuse feature enables a viral remix cycle: Creator A hums a melody → Muse generates a track → Creator B discovers the track on Reels → Creator B remixes it with their own hum → A new track is born. This creates a **flywheel effect** where each creation spawns new creations, driving both platform engagement and Muse adoption.

---

## 5. Product Architecture

### 5.1 Core User Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   INPUT      │     │  GENERATION  │     │   VIDEO      │     │   SHARE      │
│              │     │              │     │              │     │              │
│ Hum melody   │────▶│ Lyria 3      │────▶│ Hailuo 2.3   │────▶│ Instagram    │
│ Play piano   │     │ (Reimagined) │     │ Scene video  │     │ TikTok       │
│ Choose style │     │              │     │ 9:16 format  │     │ WhatsApp     │
│ (1-3 styles) │     │ MusicGen     │     │ Style-matched│     │ Community    │
│              │     │ (Faithful)   │     │ visuals      │     │              │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 5.2 Hum-to-Notes Pipeline

Muse's hum detection pipeline converts raw vocal input into structured musical notes through a multi-stage process:

1. **Audio Capture**: Browser-based recording via Web Audio API with real-time pitch visualization. Maximum 10 seconds of recording with live note detection feedback.

2. **Pitch Detection**: Spotify's Basic Pitch ML model analyzes the audio to extract note onsets, pitches, and durations. The model runs server-side for accuracy.

3. **Melody Extraction**: A smart sampling algorithm filters the raw Basic Pitch output — downsampling to the strongest note per time window, filtering out semitones (sharps/flats) to keep only natural notes (C, D, E, F, G, A, B), and removing harmonic artifacts.

4. **Piano Key Verification**: The extracted notes are displayed on an interactive 2-octave piano keyboard (C4-B5). Users can hear each note played back, add or remove notes, and confirm the melody before generation.

5. **Melody Description**: Confirmed notes are converted into a structured text description (e.g., "ascending melody: C4 → E4 → G4 → C5, tempo moderate") that feeds into both music generation engines.

### 5.3 Dual-Engine Music Generation

Muse employs two complementary AI models to give users creative choice:

**Lyria 3 Clip (Reimagined):** Google's state-of-the-art music generation model. Takes the user's melody as inspiration and reimagines it with professional arrangement, harmonization, and production. Supports lyrics and vocal generation. Produces 30-second tracks with fade-out endings. Best for users who want AI to take creative liberties with their melody.

**MusicGen (Faithful):** Meta's open-source music generation model hosted on Replicate. Stays closer to the original melody's structure and rhythm. Produces instrumental-only tracks. Best for users who want their original melody preserved with professional production quality.

Each generation session produces tracks in the user's selected styles (up to 3 from 10 available genres), with both Reimagined and Faithful variants per style, giving users up to 6 unique tracks from a single hum.

### 5.4 Style System

Muse offers 10 curated music styles, each with a distinct visual identity:

| Style | Description | Visual Theme |
|---|---|---|
| Lo-fi | Warm, nostalgic beats with vinyl crackle | Cozy room, rain on window |
| Cinematic | Epic orchestral with emotional depth | Sweeping landscapes, golden hour |
| Jazz | Smooth improvisation with swing | Smoky club, city at night |
| Electronic | Pulsing synths and driving rhythms | Neon lights, digital landscapes |
| TikTok Viral | Catchy, energetic, trend-ready | Colorful, fast-paced montage |
| Upbeat Pop | Bright, cheerful, singalong melodies | Sunshine, dancing, celebrations |
| Rock | Raw guitars, powerful drums | Concert stage, urban grit |
| R&B | Smooth vocals, soulful grooves | Sunset, intimate moments |
| Classical | Elegant orchestral arrangements | Grand halls, nature's beauty |
| EDM | High-energy drops and builds | Festival lights, crowd energy |

### 5.5 AI Scene Video Generation

Using MiniMax's Hailuo 2.3 model via Replicate, Muse generates cinematic scene videos that visually match the music's mood and style. The video generation pipeline uses a **background job + polling** architecture for reliability:

1. **Job Initiation**: The client sends a `generateVideo` mutation that immediately returns a `jobId`. The actual generation runs as a background process on the server.

2. **Scene Prompt Generation**: An LLM analyzes the track's style, mood, and cover art to craft a detailed cinematic scene description (e.g., "A close-up on a rain-streaked window pane, blurred city lights shimmering beyond, warm amber tones").

3. **Video Segment Generation**: Hailuo 2.3 generates a single 10-second video segment at 768p resolution, using the AI-generated cover art as the first-frame reference for visual consistency.

4. **Loop and Merge**: FFmpeg loops the video segment to match the audio duration (typically 20-30 seconds) and merges the generated music as the audio track. Output is 9:16 portrait format optimized for social platforms.

5. **Progress Polling**: The frontend polls `videoJobStatus` every 3 seconds, receiving real-time progress updates (step name + percentage) from the server. Total generation time is approximately 2 minutes.

6. **Fallback**: If FFmpeg is unavailable in the deployment environment, the system falls back to uploading the raw video segment directly, ensuring generation always completes.

### 5.6 Session Naming

Each creation session receives an AI-generated poetic name (e.g., "Midnight Reverie," "Sunlit Drift," "Velvet Thunder") using LLM-based naming that considers the selected styles and musical context. Individual tracks also receive creative names (e.g., "Last Train Home," "The Night Walk") rather than generic labels.

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + Tailwind CSS 4 | Modern, performant UI with rapid iteration |
| Backend | Express 4 + tRPC 11 | End-to-end type safety, efficient RPC |
| Database | TiDB (MySQL-compatible) | Scalable, cloud-native relational DB |
| Auth | Manus OAuth | Seamless authentication integration |
| Music AI (1) | Google Lyria 3 Clip API | State-of-the-art music generation with lyrics |
| Music AI (2) | Meta MusicGen via Replicate | Faithful melody reproduction |
| Video AI | MiniMax Hailuo 2.3 via Replicate | Reliable cinematic scene video generation |
| Image AI | Built-in Image Generation | Style-specific cover art |
| Pitch Detection | Spotify Basic Pitch | ML-based hum-to-notes conversion |
| LLM | Built-in LLM (Gemini) | Track naming, session naming, scene prompts |
| Media Processing | FFmpeg (@ffmpeg-installer) | Audio conversion, video looping, audio-video merge |
| Storage | S3-compatible object storage | Audio, video, and image asset storage |
| Hosting | Manus Platform | Managed deployment with custom domains |

### 6.2 API Integration Architecture

```
Client (React)
    │
    ├── tRPC ──▶ Express Server
    │               │
    │               ├── Lyria 3 API (Google AI)
    │               │     └── Music generation + lyrics
    │               │
    │               ├── Replicate API (MusicGen)
    │               │     └── Faithful melody reproduction
    │               │
    │               ├── Replicate API (Hailuo 2.3)
    │               │     └── Cinematic scene video generation
    │               │
    │               ├── Image Generation API
    │               │     └── Style-specific cover art
    │               │
    │               ├── LLM API (Gemini)
    │               │     └── Track/session naming, scene prompts
    │               │
    │               ├── FFmpeg (bundled binary)
    │               │     └── Audio conversion, video loop + merge
    │               │
    │               └── S3 Storage
    │                     └── Audio, video, image assets
    │
    └── Web Audio API
          └── Real-time pitch detection + spectrum visualization
```

### 6.3 Background Job Architecture

Video generation uses an in-memory job store with polling-based progress tracking:

```
Client                          Server
  │                               │
  ├── generateVideo ─────────────▶│ Creates job, returns jobId
  │                               │ Starts background generation
  │                               │
  ├── videoJobStatus (poll) ─────▶│ Returns { status, step, progress }
  │   (every 3 seconds)           │
  ├── videoJobStatus (poll) ─────▶│ "Generating scene prompt..." (10%)
  ├── videoJobStatus (poll) ─────▶│ "Generating video clip..." (30%)
  ├── videoJobStatus (poll) ─────▶│ "Merging video + audio..." (80%)
  ├── videoJobStatus (poll) ─────▶│ "complete" + videoUrl (100%)
  │                               │
  └── Display video player        │
```

### 6.4 Performance Considerations

Music generation latency is the primary UX challenge. Lyria 3 typically responds in 30-70 seconds, while MusicGen takes 20-40 seconds. Muse addresses this through several strategies: parallel generation of all tracks simultaneously (rather than sequential), progressive UI reveal (showing cover art and track names while audio generates), entertaining loading animations with rotating music fun facts (200 curated facts), and server-side auto-retry with exponential backoff for transient API failures. When Lyria 3 fails after multiple retries, Muse displays a humorous "compliment card" instead of a cold error message, maintaining the playful user experience.

Video generation takes approximately 2 minutes (down from 8 minutes after optimization from 4 segments to 1 looped segment). The background job + polling architecture ensures the HTTP connection never times out, and real-time progress updates keep users informed throughout the process.

---

## 7. Competitive Analysis

### 7.1 Competitive Landscape

| Feature | Muse | Suno | Udio | AIVA |
|---|---|---|---|---|
| **Input Method** | Hum / Play melody | Text prompt | Text prompt | Text prompt / MIDI |
| **Melody Preservation** | Yes (dual engine) | No | No | Partial |
| **Video Generation** | AI scene video (Hailuo) | No | No | No |
| **Social Sharing** | One-tap to Reels/TikTok | Manual export | Manual export | Manual export |
| **Hum Detection** | ML-based (Basic Pitch) | No | No | No |
| **Lyrics Support** | Yes (Lyria 3) | Yes | Yes | No |
| **Style Selection** | 10 curated styles | Free-form | Free-form | Genre-based |
| **Pricing** | Freemium | $10/mo | $10/mo | $15/mo |
| **Valuation** | Hackathon stage | $2.45B | ~$500M est. | ~$100M est. |

### 7.2 Competitive Moat

Muse's defensible advantages are:

**Input modality**: Hum-first input is fundamentally more natural than text prompts. Users do not need to know music terminology — they just sing what they feel. The ML-based pitch detection (Spotify Basic Pitch) with interactive piano verification ensures high accuracy while keeping the experience intuitive. This dramatically lowers the barrier to entry and expands the addressable user base beyond music enthusiasts to the general population.

**End-to-end pipeline**: Muse is the only platform that takes users from melody input to shareable social video in a single flow. Competitors stop at audio generation, leaving users to figure out video creation and distribution on their own.

**Dual-engine approach**: By offering both "Reimagined" (Lyria 3) and "Faithful" (MusicGen) variants, Muse gives users creative choice that single-model competitors cannot match. Users can hear their melody interpreted creatively or preserved faithfully, across multiple genres.

**Social-native output**: Every generated video is in 9:16 portrait format with cinematic AI visuals, ready for immediate sharing. The share page works without authentication, enabling viral distribution through link sharing.

---

## 8. Business Model

### 8.1 Revenue Streams

**Freemium Subscription:**

| Tier | Price | Features |
|---|---|---|
| Free | $0 | 3 generations/day, watermarked videos, standard quality |
| Creator | $8/mo | Unlimited generations, no watermark, HD video, all styles |
| Pro | $15/mo | Priority generation, 4K video, custom styles, API access |

**Additional Revenue:**

- **Platform fees**: Revenue share on premium style packs created by professional producers
- **Enterprise API**: B2B licensing for content platforms, gaming companies, and advertising agencies
- **Social platform partnerships**: Potential revenue share on engagement driven by Muse-generated content

### 8.2 Unit Economics

| Metric | Value | Notes |
|---|---|---|
| Music generation cost | ~$0.02-0.05/track | Lyria 3 API + MusicGen API |
| Video generation cost | ~$0.10/video | Hailuo 2.3 via Replicate (1 segment) |
| Image generation cost | ~$0.01/image | Built-in image generation |
| Total cost per session | ~$0.30-0.50 | 6 tracks + 1 video + images |
| Target ARPU | $8/month | Creator tier |
| Estimated sessions/user/month | 8-12 | Based on Suno usage patterns |
| Cost per user/month | ~$3-6 | At current API pricing |
| **Gross margin** | **~60-75%** | Healthy unit economics at scale |

The migration from Veo ($2.80/video) to Hailuo 2.3 (~$0.10/video) dramatically improved unit economics, reducing per-session costs by over 85%. The single-segment loop optimization further reduced video generation costs while maintaining visual quality.

---

## 9. User Stories and Acceptance Criteria

### 9.1 Core User Stories

**US-1: First-Time Creator**
> As a person with no musical training, I want to hum a melody into my phone and receive a polished music track, so that I can experience the joy of creating music for the first time.

Acceptance Criteria:
- Recording starts within 1 second of tapping the microphone button
- Recording can be stopped at any time (no minimum duration requirement)
- ML-based pitch detection extracts melody from hum within 5 seconds
- Interactive piano keyboard shows detected notes for verification
- At least 2 music tracks are generated within 90 seconds
- Each track is playable directly in the browser with AI-generated cover art

**US-2: Social Content Creator**
> As an Instagram content creator, I want to generate a music video from my melody that I can share directly to Reels, so that I can create unique audio content for my followers.

Acceptance Criteria:
- Video is generated in 9:16 portrait format at 768p+ resolution
- Video includes AI-generated cinematic scene visuals matching the music style
- Video generation completes within 2 minutes with real-time progress updates
- Share button copies link or triggers native share dialog
- Video is playable on the share page without authentication

**US-3: Style Explorer**
> As a music enthusiast, I want to hear my melody interpreted in different genres, so that I can discover how my idea sounds across musical styles.

Acceptance Criteria:
- User can select 1-3 styles from 10 available genres
- Default selection is Lo-fi
- Each selected style generates both Reimagined and Faithful variants
- Style-specific AI cover art is generated for each track

**US-4: Community Member**
> As a Muse user, I want to browse and listen to other people's creations, so that I can discover new music and get inspired.

Acceptance Criteria:
- Community gallery shows all public creations with cover art thumbnails
- Tracks with videos display a "VIDEO" badge
- Clicking a creation opens the share page with full playback
- Filter by style is available
- MP3 download and video share are available from the gallery

---

## 10. Success Metrics

### 10.1 Key Performance Indicators

| Metric | Target (Month 1) | Target (Month 6) | Target (Year 1) |
|---|---|---|---|
| Registered Users | 10K | 100K | 500K |
| Daily Active Users (DAU) | 1K | 15K | 75K |
| Tracks Generated/Day | 5K | 50K | 250K |
| Videos Generated/Day | 500 | 10K | 50K |
| Social Shares/Day | 200 | 5K | 25K |
| Paid Conversion Rate | 2% | 4% | 5% |
| DAU/MAU Ratio | 15% | 20% | 25% |
| Avg. Session Duration | 3 min | 5 min | 7 min |

### 10.2 North Star Metric

**Tracks shared to social platforms per day.** This single metric captures the full value chain: a user created music (engagement), generated a video (feature adoption), and shared it publicly (distribution + growth). Every shared track is both a satisfied user and a potential new user acquisition channel.

---

## 11. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| API cost exceeds revenue | Low | Medium | Hailuo migration reduced video cost 96%; healthy unit economics |
| Music API instability | Medium | High | Auto-retry with backoff, graceful degradation, dual-engine fallback |
| Copyright concerns with AI music | Medium | High | Clear AI-generated labeling, no training on copyrighted melodies |
| Low user retention after novelty | Medium | Medium | Community features, remix capabilities, progressive skill building |
| Platform policy changes | Low | High | Multi-platform support (TikTok, YouTube Shorts, Instagram), standalone value |
| Competitor replication | Medium | Medium | Speed of execution, hum-first moat, community network effects |
| FFmpeg deployment issues | Low | Medium | Fallback to raw video upload, bundled binary via @ffmpeg-installer |

---

## 12. Roadmap

| Quarter | Milestone | Key Features |
|---|---|---|
| **Q2 2026** | Hackathon MVP | Hum/play input, dual-engine generation, 10 styles, AI video, social share, community gallery |
| **Q3 2026** | Public Beta | Lyrics input, user profiles, remix capability, Instagram Reels deep link, video crossfade |
| **Q4 2026** | Growth Phase | Smart glasses integration, collaborative creation, premium styles marketplace |
| **Q1 2027** | Platform | API for developers, enterprise tier, VR music studio prototype |
| **Q2 2027** | Scale | Music social feed, algorithmic discovery, creator monetization |

---

## 13. Current Implementation Status

As of March 30, 2026, the following features are fully implemented and deployed:

| Feature | Status | Notes |
|---|---|---|
| Hum recording with pitch detection | Shipped | 10s max, real-time note visualization |
| Basic Pitch ML hum-to-notes | Shipped | Spotify's model, smart melody extraction |
| Interactive piano verification | Shipped | 2-octave keyboard (C4-B5), playback |
| Lyria 3 Clip generation | Shipped | 30s tracks with auto-retry |
| MusicGen generation | Shipped | 30s instrumental tracks via Replicate |
| 10 music styles | Shipped | Lo-fi through EDM |
| AI cover art generation | Shipped | Style-specific, per-track |
| AI track naming | Shipped | LLM-generated creative names |
| AI session naming | Shipped | Poetic session identifiers |
| Hailuo 2.3 video generation | Shipped | 1 segment looped, ~2 min generation |
| Background job + polling | Shipped | Real-time progress, no HTTP timeout |
| FFmpeg audio-video merge | Shipped | With fallback for deployment |
| Community gallery | Shipped | Style filters, session/track views |
| Share page | Shipped | Public, no-auth video playback |
| MP3 download | Shipped | Server-side format conversion |
| MP4 video download | Shipped | Fetch-then-blob for cross-origin |
| Landing page | Shipped | "Turn your hum into music. Go viral." |
| 200 music fun facts | Shipped | Rotating loading messages |

---

## References

[1] Grand View Research. "Global Generative AI in Music Market Size & Outlook." 2024. https://www.grandviewresearch.com/horizon/outlook/generative-ai-in-music-market-size/global

[2] Meta Platforms. "Instagram Reels Statistics." 2025. https://about.instagram.com

[3] Goldman Sachs. "Creator Economy Market Size." 2024. https://www.goldmansachs.com/insights/articles/the-creator-economy-could-approach-half-a-trillion-dollars-by-2027

[4] TechCrunch. "Suno raises at $2.45B valuation on $200M revenue." November 2025. https://techcrunch.com/2025/11/19/legally-embattled-ai-music-startup-suno-raises-at-2-45b-valuation-on-200m-revenue/

[5] Mordor Intelligence. "Short-Form Video Platform Market." 2024. https://www.mordorintelligence.com

[6] DataReportal. "Digital 2025: Global Overview Report." 2025. https://datareportal.com

[7] Influencer Marketing Hub. "Creator Economy Statistics." 2025. https://influencermarketinghub.com

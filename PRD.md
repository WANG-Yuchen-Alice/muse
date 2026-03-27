# Muse — Product Requirements Document

**Version:** 1.0  
**Date:** March 28, 2026  
**Authors:** Muse Team  
**Hackathon:** APAC AI New Bets Hackathon

---

## Executive Summary

Muse is an AI-powered music creation platform that transforms anyone into a music producer. Users simply hum a melody or play a few notes on a virtual piano, and Muse's AI engine generates polished, multi-style music tracks complete with AI-generated scene videos optimized for social sharing on Instagram Reels, TikTok, and Meta platforms. Muse democratizes music creation by eliminating the need for musical training, expensive software, or production expertise, making the creative process as intuitive as humming a tune.

The platform leverages Google's Lyria 3 and Meta's MusicGen for dual-engine music generation, Google's Veo for AI scene video creation, and deep integration with the Meta ecosystem for frictionless social distribution. Muse targets the intersection of three explosive growth markets: AI music generation ($569M in 2024, projected to reach $2.8B by 2030 [1]), short-form video content creation (2B+ daily Reels plays on Instagram [2]), and the creator economy ($250B+ globally [3]).

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

- **Year 1 target users**: 500K registered users (organic + Meta ecosystem distribution)
- **Conversion to paid**: 5% = 25K paying subscribers
- **Average revenue per user (ARPU)**: $8/month
- **Year 1 SOM**: ~$2.4M ARR
- **Year 3 target**: 5M users, 250K paid subscribers, $24M ARR

### 2.4 Market Timing

Several converging trends make this the optimal moment for Muse:

The release of Google's Lyria 3 Clip and Veo 3.1 in 2025-2026 has made high-fidelity music and video generation accessible via API for the first time. Meta's aggressive push into AI-powered content creation tools (Vibes for Instagram, AI audio reuse features) signals a platform-level commitment to AI-generated content. The short-form video market continues to grow at 28% CAGR, with Instagram Reels alone seeing 2B+ daily plays. Meanwhile, Suno's rapid growth to $200M ARR validates massive consumer demand for AI music creation.

---

## 3. Moonshot Vision

### 3.1 The 10x Opportunity

Muse's moonshot is to become the **universal music creation layer** — a platform where any human emotion, gesture, or sound can be transformed into professional-quality music and visual content, instantly shareable across all social platforms.

Today, Muse starts with hum-to-music. But the underlying architecture is designed for a much larger vision:

**Phase 1 (Current — Hackathon MVP):** Hum or play a melody → AI generates multi-style tracks → AI creates scene videos → One-tap share to social platforms.

**Phase 2 (6 months):** Real-time collaborative music creation. Multiple users hum different parts simultaneously, and AI weaves them into a cohesive composition. Integration with Meta's Horizon Worlds for immersive music creation in VR/MR.

**Phase 3 (12 months):** Ambient music generation. Muse on Meta Ray-Ban glasses listens to your environment (a rainstorm, a bustling cafe, a quiet forest) and generates a personalized soundtrack that evolves with your surroundings in real-time using Lyria RealTime.

**Phase 4 (24 months):** The Music Social Network. A TikTok-like feed where every piece of content is AI-generated music + video, created by everyday people. Users remix each other's melodies, collaborate across continents, and build musical conversations. The platform becomes a new form of social expression where music replaces text as the primary communication medium.

### 3.2 Why This Matters

Music is the most universal human language. Every culture, every civilization, every era has music. Yet the ability to create music has been gatekept by technical skill for centuries. Muse's moonshot is to make music creation as natural and accessible as speaking — because humming IS speaking, in the language of music.

---

## 4. Meta Ecosystem Compatibility

### 4.1 Integration Architecture

Muse is designed as a **Meta-native creation tool**, deeply integrated across Meta's family of apps and devices:

| Meta Platform | Integration Point | User Value |
|---|---|---|
| **Instagram Reels** | One-tap export of 9:16 AI music videos | Instant social sharing with optimized format |
| **Facebook Stories** | Cross-post music videos | Extended reach across Meta platforms |
| **WhatsApp** | Share creation links + audio previews | Viral distribution through messaging |
| **Meta Ray-Ban Glasses** | Hum-to-music via built-in mic | Hands-free music creation on the go |
| **Meta Quest (VR/MR)** | Immersive music studio in Horizon Worlds | Spatial audio creation and collaboration |
| **Threads** | Share music creation stories | Community building around music creation |
| **Meta AI** | Audio reuse and remix capabilities | AI-powered music remixing ecosystem |

### 4.2 Instagram Reels Deep Integration

Instagram Reels is the primary distribution channel for Muse-generated content. The integration is designed to maximize both creator satisfaction and platform engagement:

Muse generates videos in the exact 9:16 portrait format at 1080x1920 resolution that Instagram Reels requires. Each video includes AI-generated scene visuals that match the music's mood and style (e.g., neon cityscapes for electronic music, serene landscapes for lo-fi). The video includes the track title and creator attribution as text overlays, optimized for the Reels viewing experience. Users can share directly from Muse to Instagram with pre-filled captions and relevant hashtags.

### 4.3 Meta AI Audio Reuse

Instagram recently introduced a feature allowing creators to enable audio reuse via Meta AI [8]. Muse-generated tracks can opt into this system, enabling a viral remix cycle: Creator A hums a melody → Muse generates a track → Creator B discovers the track on Reels → Creator B remixes it with their own hum → A new track is born. This creates a **flywheel effect** where each creation spawns new creations, driving both platform engagement and Muse adoption.

### 4.4 Meta Ray-Ban Glasses

Meta's Ray-Ban smart glasses include an open-ear speaker system, built-in microphone, and Meta AI voice assistant [9]. Muse can integrate as a voice-activated experience: "Hey Meta, open Muse" → hum a melody → receive a notification when the track is ready → listen through the glasses' speakers. This represents the most natural music creation experience possible — literally humming while walking down the street.

### 4.5 Meta Horizon Worlds (VR/MR)

For the Phase 2 moonshot, Muse envisions a spatial music creation experience in Meta's VR/MR environment. Users enter a virtual music studio where they can physically "sculpt" sound — reaching out to grab and stretch melodies, arranging instruments in 3D space, and collaborating with other users in real-time. Meta's Horizon Studio generative AI tools [10] provide the foundation for building these immersive experiences.

---

## 5. Product Architecture

### 5.1 Core User Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   INPUT      │     │  GENERATION  │     │   VIDEO      │     │   SHARE      │
│              │     │              │     │              │     │              │
│ Hum melody   │────▶│ Lyria 3      │────▶│ Veo 3.1      │────▶│ Instagram    │
│ Play piano   │     │ (Reimagined) │     │ Scene video  │     │ TikTok       │
│ Choose style │     │              │     │ 9:16 format  │     │ WhatsApp     │
│ Add lyrics   │     │ MusicGen     │     │ Style-matched│     │ Community    │
│ (optional)   │     │ (Faithful)   │     │ visuals      │     │              │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 5.2 Dual-Engine Music Generation

Muse employs two complementary AI models to give users creative choice:

**Lyria 3 Clip (Reimagined):** Google's state-of-the-art music generation model. Takes the user's melody as inspiration and reimagines it with professional arrangement, harmonization, and production. Supports lyrics and vocal generation. Produces 30-second tracks with fade-out endings. Best for users who want AI to take creative liberties with their melody.

**MusicGen (Faithful):** Meta's open-source music generation model hosted on Replicate. Stays closer to the original melody's structure and rhythm. Produces instrumental-only tracks. Best for users who want their original melody preserved with professional production quality.

Each generation session produces tracks in the user's selected styles (up to 3 from 10 available genres), with both Reimagined and Faithful variants per style, giving users up to 6 unique tracks from a single hum.

### 5.3 Style System

Muse offers 10 curated music styles, each with carefully crafted AI prompts:

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

### 5.4 AI Scene Video Generation

Using Google's Veo 3.1 API, Muse generates 8-second scene videos that visually match the music's mood and style. The video generation pipeline works as follows:

1. The user's selected style determines the base visual prompt (e.g., "neon-lit Tokyo street at night, rain reflections on pavement" for Electronic)
2. The AI-generated cover art for the track serves as a reference image for visual consistency
3. Veo generates a 9:16 portrait video at 1080x1920 resolution
4. The generated music audio replaces Veo's native audio track
5. Text overlays (track title, creator name) are composited onto the final video
6. The result is a platform-ready video optimized for Instagram Reels and TikTok

### 5.5 Session Naming

Each creation session receives an AI-generated poetic name (e.g., "Midnight Reverie," "Sunlit Drift," "Velvet Thunder") using LLM-based naming that considers the selected styles and musical context. This transforms a technical session ID into a memorable creative identity.

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
| Video AI | Google Veo 3.1 API | High-fidelity scene video generation |
| Image AI | Built-in Image Generation | Style-specific cover art |
| LLM | Built-in LLM (Gemini) | Track naming, session naming, prompt crafting |
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
    │               ├── Veo 3.1 API (Google AI)
    │               │     └── Scene video generation
    │               │
    │               ├── Image Generation API
    │               │     └── Style-specific cover art
    │               │
    │               ├── LLM API (Gemini)
    │               │     └── Track/session naming
    │               │
    │               └── S3 Storage
    │                     └── Audio, video, image assets
    │
    └── Web Audio API
          └── Real-time pitch detection + spectrum visualization
```

### 6.3 Performance Considerations

Music generation latency is the primary UX challenge. Lyria 3 typically responds in 30-70 seconds, while MusicGen takes 20-40 seconds. Muse addresses this through several strategies: parallel generation of all tracks simultaneously (rather than sequential), progressive UI reveal (showing cover art and track names while audio generates), entertaining loading animations with rotating music fun facts, and server-side auto-retry with exponential backoff for transient API failures. When Lyria 3 fails after multiple retries, Muse displays a humorous "compliment card" instead of a cold error message, maintaining the playful user experience.

---

## 7. Competitive Analysis

### 7.1 Competitive Landscape

| Feature | Muse | Suno | Udio | AIVA |
|---|---|---|---|---|
| **Input Method** | Hum / Play melody | Text prompt | Text prompt | Text prompt / MIDI |
| **Melody Preservation** | Yes (dual engine) | No | No | Partial |
| **Video Generation** | AI scene video (Veo) | No | No | No |
| **Social Sharing** | One-tap to Reels/TikTok | Manual export | Manual export | Manual export |
| **Meta Integration** | Deep (Reels, Glasses, Quest) | None | None | None |
| **Lyrics Support** | Yes (Lyria 3) | Yes | Yes | No |
| **Style Selection** | 10 curated styles | Free-form | Free-form | Genre-based |
| **Pricing** | Freemium | $10/mo | $10/mo | $15/mo |
| **Valuation** | Hackathon stage | $2.45B | ~$500M est. | ~$100M est. |

### 7.2 Competitive Moat

Muse's defensible advantages are:

**Input modality**: Hum-first input is fundamentally more natural than text prompts. Users do not need to know music terminology — they just sing what they feel. This dramatically lowers the barrier to entry and expands the addressable user base beyond music enthusiasts to the general population.

**End-to-end pipeline**: Muse is the only platform that takes users from melody input to shareable social video in a single flow. Competitors stop at audio generation, leaving users to figure out video creation and distribution on their own.

**Meta ecosystem integration**: Deep integration with Instagram Reels, WhatsApp, Meta Glasses, and Meta Quest creates distribution advantages that pure-play music tools cannot replicate. Every Muse creation shared on Instagram becomes organic marketing for the platform.

**Dual-engine approach**: By offering both "Reimagined" (Lyria 3) and "Faithful" (MusicGen) variants, Muse gives users creative choice that single-model competitors cannot match.

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
- **Meta partnership**: Potential revenue share on Reels engagement driven by Muse-generated content

### 8.2 Unit Economics

| Metric | Value | Notes |
|---|---|---|
| Music generation cost | ~$0.02-0.05/track | Lyria 3 API + MusicGen API |
| Video generation cost | ~$2.80/video | Veo 3.1 at $0.35/sec × 8 sec |
| Image generation cost | ~$0.01/image | Built-in image generation |
| Total cost per session | ~$3.50-4.00 | 6 tracks + 1 video + images |
| Target ARPU | $8/month | Creator tier |
| Estimated sessions/user/month | 8-12 | Based on Suno usage patterns |
| Cost per user/month | ~$35-48 | At current API pricing |
| Break-even requires | Scale pricing + selective video gen | Video only on user request |

The unit economics improve significantly with scale through negotiated API pricing, caching of popular style templates, and selective video generation (only when users explicitly request it rather than auto-generating for every track).

---

## 9. User Stories and Acceptance Criteria

### 9.1 Core User Stories

**US-1: First-Time Creator**
> As a person with no musical training, I want to hum a melody into my phone and receive a polished music track, so that I can experience the joy of creating music for the first time.

Acceptance Criteria:
- Recording starts within 1 second of tapping the microphone button
- Recording can be stopped at any time (no minimum duration requirement)
- Pitch detection extracts melody from hum within 2 seconds
- At least 2 music tracks are generated within 90 seconds
- Each track is playable directly in the browser with spectrum visualization

**US-2: Social Content Creator**
> As an Instagram content creator, I want to generate a music video from my melody that I can share directly to Reels, so that I can create unique audio content for my followers.

Acceptance Criteria:
- Video is generated in 9:16 portrait format at 1080x1920 resolution
- Video includes AI-generated scene visuals matching the music style
- Share button copies link or triggers native share dialog
- Video is playable on the share page without authentication

**US-3: Style Explorer**
> As a music enthusiast, I want to hear my melody interpreted in different genres, so that I can discover how my idea sounds across musical styles.

Acceptance Criteria:
- User can select 1-3 styles from 10 available genres
- Default selection is Lo-fi and Electronic
- Each selected style generates both Reimagined and Faithful variants
- Style-specific cover art is generated for each track

**US-4: Community Member**
> As a Muse user, I want to browse and listen to other people's creations, so that I can discover new music and get inspired.

Acceptance Criteria:
- Community page shows all public creations with video thumbnails
- Tracks with videos display a "VIDEO" badge
- Clicking a creation opens the share page with full playback
- Filter by style is available

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
| API cost exceeds revenue | High | High | Selective video gen, caching, negotiated pricing |
| Lyria 3 / Veo API instability | Medium | High | Auto-retry with backoff, graceful degradation, dual-engine fallback |
| Copyright concerns with AI music | Medium | High | Clear AI-generated labeling, no training on copyrighted melodies |
| Low user retention after novelty | Medium | Medium | Community features, remix capabilities, progressive skill building |
| Meta platform policy changes | Low | High | Multi-platform support (TikTok, YouTube Shorts), standalone value |
| Competitor replication | Medium | Medium | Speed of execution, Meta integration moat, community network effects |

---

## 12. Roadmap

| Quarter | Milestone | Key Features |
|---|---|---|
| **Q2 2026** | Hackathon MVP | Hum/play input, dual-engine generation, 10 styles, AI video, social share |
| **Q3 2026** | Public Beta | Lyrics input, user profiles, remix capability, Instagram Reels deep link |
| **Q4 2026** | Growth Phase | Meta Glasses integration, collaborative creation, premium styles marketplace |
| **Q1 2027** | Platform | API for developers, enterprise tier, VR music studio prototype |
| **Q2 2027** | Scale | Music social feed, algorithmic discovery, creator monetization |

---

## References

[1] Grand View Research. "Global Generative AI in Music Market Size & Outlook." 2024. https://www.grandviewresearch.com/horizon/outlook/generative-ai-in-music-market-size/global

[2] Meta Platforms. "Instagram Reels Statistics." 2025. https://about.instagram.com

[3] Goldman Sachs. "Creator Economy Market Size." 2024. https://www.goldmansachs.com/insights/articles/the-creator-economy-could-approach-half-a-trillion-dollars-by-2027

[4] TechCrunch. "Suno raises at $2.45B valuation on $200M revenue." November 2025. https://techcrunch.com/2025/11/19/legally-embattled-ai-music-startup-suno-raises-at-2-45b-valuation-on-200m-revenue/

[5] Mordor Intelligence. "Short-Form Video Platform Market." 2024. https://www.mordorintelligence.com

[6] DataReportal. "Digital 2025: Global Overview Report." 2025. https://datareportal.com

[7] Influencer Marketing Hub. "Creator Economy Statistics." 2025. https://influencermarketinghub.com

[8] Threads/@jonahmanzano. "Instagram now lets you enable audio reuse via Meta AI." February 2026. https://www.threads.com/@jonahmanzano/post/DUnQE5QCbw0

[9] Meta. "AI glasses with music: Immersive open-air audio experience." 2025. https://www.meta.com/ai-glasses/music-and-audio/

[10] Meta. "Meta Connect 2025: How AI Is Supercharging the Metaverse." September 2025. https://www.meta.com/blog/connect-2025-day-2-keynote-recap-vr-development-use-cases-wearable-device-access-toolkit/

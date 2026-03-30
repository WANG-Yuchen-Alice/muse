# Muse — Product Requirements Document

**Version:** 3.0
**Date:** March 30, 2026
**Authors:** Muse Team
**Hackathon:** APAC AI New Bets Hackathon

---

## Executive Summary

Muse is an AI-powered music creation platform that transforms anyone into a music producer. Users hum a melody, and Muse's AI engine generates polished, multi-style music tracks with cinematic scene videos optimized for social sharing on Instagram Reels, TikTok, and YouTube Shorts. The platform eliminates the need for musical training, expensive software, or production expertise, making the creative process as intuitive as humming a tune.

The platform leverages Google's Lyria 3 for creative reimagination, Meta's MusicGen for faithful melody reproduction, MiniMax's Hailuo 2.3 for AI scene video generation, and Spotify's Basic Pitch for intelligent hum-to-notes conversion. Muse targets the intersection of three converging markets: AI music generation ($569M in 2024, projected to reach $2.8B by 2030 [1]), short-form video content creation (2B+ daily Reels plays on Instagram [2]), and the creator economy ($250B+ globally [3]).

This document is structured as both a product specification and a strategic playbook. It addresses not only what Muse builds, but how Muse learns, defends, and scales — with explicit treatment of unit economics, privacy architecture, growth instrumentation, platform abstraction, and the path to durable competitive advantage through community network effects.

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

### 2.1 Top-Down Market Context

The TAM for Muse sits at the intersection of three converging markets. These figures establish the ceiling of opportunity, not a forecast of capture.

| Market Segment | 2024 Size | 2030 Projected | CAGR | Source |
|---|---|---|---|---|
| AI Music Generation | $569.7M | $2,794.7M | ~30% | Grand View Research [1] |
| Creator Economy | $250B+ | $480B+ | ~15% | Goldman Sachs [3] |
| Short-Form Video Tools | $1.8B | $8.2B | ~28% | Mordor Intelligence [5] |

### 2.2 Bottoms-Up Growth Model

Rather than relying solely on top-down TAM projections, Muse's growth model is built from measurable viral loop mechanics. The model below uses conservative assumptions that will be validated and refined through instrumentation (see Section 10).

**Viral Loop Mechanics:**

Each Muse creation that is shared to a social platform becomes a user acquisition channel. The viral coefficient (k-factor) is the product of three measurable rates:

| Variable | Definition | Conservative Estimate | Optimistic Estimate |
|---|---|---|---|
| Share Rate | % of completed creations shared to social | 15% | 30% |
| Click-Through Rate | % of viewers who click the Muse link | 3% | 6% |
| Signup Rate | % of clickers who create an account | 20% | 35% |
| Avg. Social Reach | Views per shared video | 200 | 500 |
| **k-factor** | Share Rate x Reach x CTR x Signup | **0.18** | **1.05** |

A k-factor below 1.0 means organic virality alone will not sustain growth — paid acquisition and content marketing are required to supplement. A k-factor above 1.0 creates self-sustaining viral growth. The conservative model assumes Muse operates in the sub-viral regime initially and must earn its way to viral growth through product quality improvements.

**Year 1 Bottoms-Up Projection:**

| Month | Seed Users (Paid/Organic) | Viral Invites (k=0.18) | Cumulative Users | DAU (15% of MAU) |
|---|---|---|---|---|
| 1 | 5,000 | 900 | 5,900 | 885 |
| 3 | 15,000 | 8,100 | 38,000 | 5,700 |
| 6 | 30,000 | 27,000 | 105,000 | 15,750 |
| 12 | 50,000 | 72,000 | 310,000 | 46,500 |

This bottoms-up model yields approximately 310K users at Year 1 under conservative assumptions — notably lower than the 500K top-down target. The gap represents the validation work required: improving share rates, click-through rates, and the core creation experience to push the k-factor upward.

### 2.3 Cost-Per-Acquisition Analysis

For the non-viral portion of growth, Muse plans channel-specific acquisition:

| Channel | Est. CPA | Year 1 Budget | Users Acquired | Notes |
|---|---|---|---|---|
| TikTok creator partnerships | $1.50 | $45,000 | 30,000 | Muse-created content as ads |
| Instagram Reels seeding | $2.00 | $30,000 | 15,000 | Influencer collaborations |
| Organic SEO/content | $0.50 | $10,000 | 20,000 | "AI music maker" keywords |
| Product Hunt / Hacker News | $0 | $0 | 5,000 | Launch campaigns |
| **Blended CPA** | **$1.21** | **$85,000** | **70,000** | |

These acquisition costs are viable only if the LTV of acquired users exceeds the blended CPA — which depends on the unit economics and conversion rates modeled in Section 8.

---

## 3. Strategic Vision and Competitive Moat

### 3.1 The Moat Problem — and Our Answer

We acknowledge the central challenge raised by the PM crit panel: hum-first input, dual-engine generation, and AI video are product decisions, not moats. Any well-funded competitor could replicate these features within 90 days by calling the same APIs. Suno, with $200M ARR and a $2.45B valuation, could announce hum-to-music input tomorrow.

Muse's durable competitive advantage does not come from any single feature. It comes from **community network effects** — the compounding value created when users share, discover, remix, and build on each other's musical creations. This is the only moat candidate that grows stronger with scale and cannot be replicated by a competitor on day one.

### 3.2 Revised Strategic Roadmap — Community First

Based on the PM crit feedback, we have restructured the roadmap to pull community and social features forward from Phase 4 to Phase 2, and removed speculative hardware integrations (smart glasses, VR) entirely.

| Phase | Timeline | Focus | Key Deliverables |
|---|---|---|---|
| **Phase 1** | Q2 2026 (Current) | **Creation Engine** | Hum/play input, dual-engine generation, 10 styles, AI video, social share, community gallery, analytics instrumentation |
| **Phase 2** | Q3 2026 | **Social Network Foundation** | User profiles with follower graphs, melody remix chains (fork a melody, credit the original), collaborative duets, algorithmic discovery feed, notification system |
| **Phase 3** | Q4 2026 | **Network Effects Flywheel** | Remix leaderboards, creator monetization (tips, premium remixes), trending melodies feed, cross-platform embed widgets, public API (v1) |
| **Phase 4** | H1 2027 | **Platform Scale** | Enterprise API, white-label SDK, third-party style packs marketplace, advanced analytics for creators |

The critical insight is that **every quarter we delay building network effects is a quarter a competitor could use to build them first**. The creation tool (Phase 1) generates the content library; the social network (Phase 2) makes that library defensible.

### 3.3 Why the Sequencing Works

Building the creation tool first is not a delay — it is a prerequisite. A music social network requires a critical mass of content and users. You cannot launch a TikTok-for-AI-music to an empty room. The Phase 1 pipeline (hum → music → video → share) is the content generation engine that fills the social network. The sequencing is: build the creation tool, accumulate a content library and user base, then layer on the social graph. The critical question is whether the tool is sticky enough to retain users long enough to reach that critical mass — which is why retention instrumentation (Section 10) is a Phase 1 priority, not a Phase 2 afterthought.

### 3.4 Defensibility Layers

| Layer | Description | Time to Replicate |
|---|---|---|
| **Community graph** | Follower relationships, remix chains, collaborative history | 12-18 months (requires content + users) |
| **Content library** | Thousands of user-created melodies, tracks, and videos | 6-12 months (requires active user base) |
| **Proprietary data** | Hum-to-melody conversion accuracy improvements from user corrections | 6 months (requires training data) |
| **Brand association** | "Muse" as the verb for hum-to-music creation | 3-6 months (requires viral moments) |
| **Feature bundle** | Hum input + dual engine + video + social (table stakes) | 90 days (API calls, replicable) |

The feature bundle is the least defensible layer. The community graph is the most defensible. The roadmap is designed to build upward through these layers as quickly as possible.

---

## 4. Product Architecture

### 4.1 Core User Flow

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

### 4.2 Honest UX Assessment — Steps and Wait Times

We acknowledge that the current user journey involves more steps and longer wait times than the tagline "Turn your hum into music" implies. Transparency about this gap is essential for prioritizing UX improvements.

**Current Flow (measured):**

| Step | User Action | Wait Time | Notes |
|---|---|---|---|
| 1 | Land on page, tap "Create" | 0s | Immediate |
| 2 | Tap record, hum melody | 3-10s | User-controlled |
| 3 | Stop recording | 0s | Immediate |
| 4 | Wait for pitch detection | 3-5s | Basic Pitch ML processing |
| 5 | Verify/edit notes on piano | 10-30s | Optional but shown by default |
| 6 | Select styles (1-3) | 5-10s | Default pre-selected |
| 7 | Tap "Generate" | 0s | Immediate |
| 8 | Wait for music generation | 60-90s | Parallel generation, fun facts shown |
| 9 | Browse results, play tracks | 30-60s | User-controlled |
| 10 | Tap "Generate Video" | 0s | Optional |
| 11 | Wait for video generation | ~120s | Background job with progress |
| **Total** | | **~4-6 min** | **Including all waits** |

This is not a "60-second core action" product today. The path to reducing this is documented in the UX Improvement Roadmap (Section 4.3).

### 4.3 UX Improvement Roadmap

| Improvement | Impact | Timeline | Technical Approach |
|---|---|---|---|
| **On-device pitch detection** (WebAssembly Basic Pitch) | Eliminates 3-5s server round-trip; eliminates biometric data transmission | Phase 2 | Compile Basic Pitch ONNX model to WASM; send only extracted notes to server |
| **Skip piano verification** for confident detections | Removes 10-30s step for 70%+ of users | Phase 1.5 | Auto-skip when detection confidence > 0.85; show "Edit melody" as secondary action |
| **Instant preview** during generation | Reduces perceived wait from 90s to 15s | Phase 2 | Stream first 5 seconds of audio as soon as available; progressive reveal |
| **Pre-generated video templates** | Reduces video wait from 120s to 10s | Phase 2 | Pre-render style-matched video loops; overlay user's audio in-browser |
| **One-tap "Quick Create"** | Reduces total flow to 3 steps | Phase 2 | Hum → auto-detect → auto-generate with default style; skip all intermediate screens |

The on-device pitch detection improvement is particularly strategic because it simultaneously solves a UX problem (latency), a privacy problem (biometric data never leaves the device), and a cost problem (eliminates server-side ML inference). This is a feature, not a compliance burden.

### 4.4 Hum-to-Notes Pipeline

Muse's hum detection pipeline converts raw vocal input into structured musical notes through a multi-stage process. Audio is captured via the Web Audio API with real-time pitch visualization (maximum 10 seconds). Spotify's Basic Pitch ML model analyzes the audio to extract note onsets, pitches, and durations. A smart sampling algorithm filters the raw output — downsampling to the strongest note per time window, filtering out semitones to keep only natural notes (C, D, E, F, G, A, B), and removing harmonic artifacts. The extracted notes are displayed on an interactive 2-octave piano keyboard (C4-B5) where users can verify, edit, and confirm before generation.

### 4.5 Dual-Engine Music Generation

Muse employs two complementary AI models to give users creative choice. **Lyria 3 Clip (Reimagined)** is Google's state-of-the-art music generation model that takes the user's melody as inspiration and reimagines it with professional arrangement, harmonization, and production. It supports lyrics and vocal generation and produces 30-second tracks. **MusicGen (Faithful)** is Meta's open-source model hosted on Replicate that stays closer to the original melody's structure and rhythm, producing instrumental tracks. Each generation session produces tracks in the user's selected styles (up to 3 from 10 available genres), with both Reimagined and Faithful variants per style, giving users up to 6 unique tracks from a single hum.

### 4.6 AI Scene Video Generation

Using MiniMax's Hailuo 2.3 model via Replicate, Muse generates cinematic scene videos that visually match the music's mood and style. The pipeline uses a background job + polling architecture: the client sends a `generateVideo` mutation that immediately returns a `jobId`, while the actual generation runs as a background process. An LLM crafts a detailed cinematic scene description based on the track's style, mood, and cover art. Hailuo 2.3 generates a single 10-second video segment at 768p resolution, which FFmpeg loops to match the audio duration and merges with the music track. The frontend polls for progress every 3 seconds, receiving real-time step and percentage updates. Total generation time is approximately 2 minutes.

**Addressing video quality and personalization:** The current style-to-visual mapping produces genre-appropriate but generic scenes (e.g., "rain on window" for every lo-fi track). Phase 2 will introduce **melody-aware scene prompts** that incorporate the specific notes, tempo, and energy curve of each track to generate visually unique videos even within the same genre. Additionally, user-uploaded reference images will allow personal visual elements, making each video feel "made by me" rather than "made by AI."

---

## 5. Privacy Architecture and Data Lifecycle

### 5.1 Why Privacy Is a Launch Requirement

Muse captures audio recordings of people humming — which constitutes **biometric data** under an increasing number of jurisdictions including the Illinois Biometric Information Privacy Act (BIPA), the EU AI Act, and India's Digital Personal Data Protection (DPDP) Act [8]. The APAC market, where India's DPDP Act is directly relevant, is Muse's primary target. Treating privacy as a Phase 3 concern is not viable; it is a launch requirement.

### 5.2 Data Lifecycle Map

The following table documents every system and third party that touches a user's audio data, answering the critical question: **is the raw hum deleted after note extraction, or does it persist?**

| Stage | Data | System | Retention | Deletion Trigger |
|---|---|---|---|---|
| 1. Recording | Raw audio (WebM) | User's browser (Web Audio API) | Session only | Browser tab close |
| 2. Upload | Raw audio (WebM) | Muse server (memory buffer) | Processing only (~5s) | Immediately after Basic Pitch extraction |
| 3. Pitch Detection | Raw audio → MIDI notes | Spotify Basic Pitch (server-side) | Processing only | Input discarded after inference |
| 4. Note Storage | MIDI note sequence (C4, E4, G4...) | Muse database (TiDB) | Persistent | User account deletion |
| 5. Music Generation | Text prompt + note description | Google Lyria 3 API | Per Google's data policy | N/A (no raw audio sent) |
| 6. Music Generation | Text prompt + note description | Meta MusicGen via Replicate | Per Replicate's data policy | N/A (no raw audio sent) |
| 7. Generated Audio | MP3/WAV files | S3 object storage | Persistent | User deletion request |
| 8. Video Generation | Text prompt + cover image | Hailuo 2.3 via Replicate | Per Replicate's data policy | N/A (no audio sent) |
| 9. Generated Video | MP4 files | S3 object storage | Persistent | User deletion request |

**Critical design decision:** Raw audio is never persisted to disk or database. It exists only in server memory during the ~5 seconds of Basic Pitch processing, then is discarded. Only the extracted MIDI note sequence (e.g., "C4, E4, G4, C5") is stored — this is not biometric data, as it cannot be used to identify the individual. No raw audio is sent to any third-party AI service; only text prompts and note descriptions are transmitted.

### 5.3 Phase 2: On-Device Processing

The Phase 2 migration to WebAssembly-based Basic Pitch eliminates even the transient server-side audio processing. Under this architecture, the raw hum is processed entirely in the user's browser, and only the extracted note sequence is transmitted to the server. The raw audio never leaves the device. This is both a privacy improvement and a UX improvement (eliminating the 3-5 second server round-trip).

### 5.4 Consent and Rights Framework

| Requirement | Implementation | Timeline |
|---|---|---|
| **Recording consent** | Explicit opt-in before microphone access; clear explanation of what is recorded and how it is used | Phase 1 (shipped) |
| **Data processing disclosure** | Privacy policy listing all sub-processors (Google, Replicate, MiniMax, S3 provider) with data types shared | Phase 1.5 |
| **Right to deletion** | One-click account deletion that removes all user data (notes, tracks, videos, profile) from database and S3 | Phase 1.5 |
| **Content takedown** | Report button on community gallery and share pages; 48-hour response SLA | Phase 2 |
| **Remix lineage tracking** | When Creator B remixes Creator A's melody, the dependency is recorded; if Creator A deletes, the remix is flagged for review (not auto-deleted, as it is a derivative work) | Phase 2 |
| **Public sharing consent** | Explicit opt-in before publishing to community gallery; default is private | Phase 2 |
| **Sub-processor DPAs** | Data Processing Agreements with Replicate, Google AI, and S3 provider | Phase 1.5 |

### 5.5 Regulatory Compliance Roadmap

| Regulation | Jurisdiction | Relevance | Compliance Approach |
|---|---|---|---|
| DPDP Act | India | Primary market | Consent-first design; data localization assessment; DPO appointment at scale |
| PDPA | Singapore | Secondary market | Consent + purpose limitation; PDPC notification if breach |
| BIPA | Illinois, USA | If US expansion | On-device processing eliminates biometric data collection |
| EU AI Act | EU | If EU expansion | AI-generated content labeling; transparency obligations |
| GDPR | EU | If EU expansion | Right to erasure; data portability; DPAs with all processors |

---

## 6. Platform Architecture and Abstraction

### 6.1 The Abstraction Problem

The current architecture is a tightly coupled monolith where every AI provider integration is bespoke. The Veo-to-Hailuo video migration required rewriting the entire video generation pipeline. When the next model migration happens — and it will, given how fast this space moves — the team will pay the full integration cost again. This section defines the provider-agnostic abstraction layer that prevents this.

### 6.2 Provider-Agnostic Interface Contracts

```typescript
// Music Generation Interface
interface MusicGenerator {
  generate(input: {
    melody: NoteSequence;
    style: MusicStyle;
    duration: number;
    lyrics?: string;
  }): Promise<{ audioUrl: string; metadata: TrackMetadata }>;
}

// Video Generation Interface
interface VideoGenerator {
  generate(input: {
    prompt: string;
    referenceImage?: string;
    duration: number;
    aspectRatio: '9:16' | '16:9' | '1:1';
  }): Promise<{ videoUrl: string; metadata: VideoMetadata }>;
}

// Pitch Detection Interface
interface PitchDetector {
  detect(input: {
    audioBuffer: ArrayBuffer;
    sampleRate: number;
  }): Promise<{ notes: NoteSequence; confidence: number }>;
}
```

Each interface can be satisfied by multiple backends. Adding a new music generation provider (e.g., switching from MusicGen to a self-hosted model) requires implementing the interface — not rewriting the pipeline. This abstraction is scheduled for Phase 1.5 (pre-Phase 2) to ensure the social network features are built on a stable foundation.

### 6.3 Durable Job Store

The current in-memory video job store loses all in-flight jobs on server restart or deployment. At the Year 1 target of 50K videos/day, even a brief deployment window would lose hundreds of jobs. The migration path:

| Phase | Job Store | Durability | Trade-offs |
|---|---|---|---|
| Phase 1 (current) | In-memory Map | None (lost on restart) | Simple, fast, sufficient for hackathon scale |
| Phase 1.5 | Database-backed (TiDB) | Full persistence | Adds ~5ms latency per status check; survives restarts |
| Phase 3 | Dedicated job queue (BullMQ + Redis) | Full persistence + retry + dead letter | Production-grade; supports horizontal scaling |

### 6.4 Self-Hosted Inference Roadmap

The PM crit correctly identified that running MusicGen on Replicate (paying someone else to run an open-source model) is an integrator's approach, not a platform builder's. The self-hosting roadmap:

| Model | Current | Phase 2 | Phase 3 | Annual Savings (at scale) |
|---|---|---|---|---|
| MusicGen | Replicate ($0.02/track) | Self-hosted GPU (A100) | Auto-scaling cluster | ~60% cost reduction |
| Basic Pitch | Server-side Python | WebAssembly (client-side) | Client-side (zero server cost) | 100% cost elimination |
| Hailuo 2.3 | Replicate ($0.10/video) | Replicate (evaluate alternatives) | Self-hosted or cheapest provider | ~40% cost reduction |
| Lyria 3 | Google AI API | Google AI API (no alternative) | Google AI API | N/A (proprietary) |

Self-hosting MusicGen is the highest-ROI migration because the model is open-source, well-documented, and inference costs at scale are significantly lower than Replicate's per-call pricing.

---

## 7. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + Tailwind CSS 4 | Modern, performant UI with rapid iteration |
| Backend | Express 4 + tRPC 11 | End-to-end type safety, efficient RPC |
| Database | TiDB (MySQL-compatible) | Scalable, cloud-native relational DB |
| Auth | Manus OAuth | Seamless authentication integration |
| Music AI (1) | Google Lyria 3 Clip API | State-of-the-art music generation with lyrics |
| Music AI (2) | Meta MusicGen via Replicate | Faithful melody reproduction (self-host in Phase 2) |
| Video AI | MiniMax Hailuo 2.3 via Replicate | Reliable cinematic scene video generation |
| Image AI | Built-in Image Generation | Style-specific cover art |
| Pitch Detection | Spotify Basic Pitch | ML-based hum-to-notes (migrate to WASM in Phase 2) |
| LLM | Built-in LLM (Gemini) | Track naming, session naming, scene prompts |
| Media Processing | FFmpeg (@ffmpeg-installer) | Audio conversion, video looping, audio-video merge |
| Storage | S3-compatible object storage | Audio, video, and image asset storage |
| Hosting | Manus Platform | Managed deployment with custom domains |

---

## 8. Business Model and Unit Economics

### 8.1 Revenue Tiers

| Tier | Price | Features | Target Segment |
|---|---|---|---|
| Free | $0 | 3 generations/week, watermarked videos, standard quality | Trial users, casual creators |
| Creator | $8/mo | 30 generations/month, no watermark, HD video, all styles | Regular creators |
| Pro | $15/mo | Unlimited generations, 4K video, custom styles, priority queue, API access | Power users, content professionals |

**Key change from v2.0:** Free tier reduced from 3 generations/day to 3 generations/week, based on the unit economics stress test below.

### 8.2 Unit Economics — Detailed Model

| Cost Component | Per-Unit Cost | Free User (3/week) | Creator ($8/mo) | Pro ($15/mo) |
|---|---|---|---|---|
| Music generation (Lyria 3 + MusicGen) | $0.07/session | $0.84/mo | $2.10/mo (30 sessions) | $4.20/mo (60 sessions) |
| Video generation (Hailuo 2.3) | $0.10/video | $0.30/mo (25% video rate) | $0.75/mo | $1.50/mo |
| Image generation (cover art) | $0.01/image | $0.12/mo | $0.30/mo | $0.60/mo |
| LLM calls (naming, prompts) | $0.005/call | $0.06/mo | $0.15/mo | $0.30/mo |
| Infrastructure (compute, storage, bandwidth) | ~$0.01/session | $0.12/mo | $0.30/mo | $0.60/mo |
| **Total cost per user/month** | | **$1.44** | **$3.60** | **$7.20** |
| **Revenue per user/month** | | **$0** | **$8.00** | **$15.00** |
| **Gross margin** | | **-$1.44** | **$4.40 (55%)** | **$7.80 (52%)** |

### 8.3 Breakeven Analysis and Stress Test

The free tier is a customer acquisition channel, not a revenue source. Its cost must be funded by paid user margins. The critical question is: **what paid conversion rate makes the free tier sustainable?**

| Scenario | Paid Conversion Rate | Free Users per Paid User | Free Tier Cost Subsidy | Net Margin per Paid User | Viable? |
|---|---|---|---|---|---|
| Optimistic | 8% | 11.5 | $16.56/mo | -$12.16/mo (Creator) | No |
| Target | 5% | 19 | $27.36/mo | -$22.96/mo (Creator) | No |
| Realistic | 3% | 32.3 | $46.51/mo | -$42.11/mo (Creator) | No |

**The math is clear: at 3 generations/day, the free tier is unsustainable at any realistic conversion rate.** This is why v3.0 reduces the free tier to 3 generations/week:

| Scenario (3/week free tier) | Paid Conversion Rate | Free Tier Cost/User/Mo | Subsidy per Paid User | Net Margin | Viable? |
|---|---|---|---|---|---|
| Optimistic | 8% | $0.41 | $4.72 | -$0.32 (Creator) | Marginal |
| Target | 5% | $0.41 | $7.79 | -$3.39 (Creator) | No (but close with Pro mix) |
| Blended (40% Pro) | 5% | $0.41 | $7.79 | +$0.37 | **Yes** |

The blended model works when at least 40% of paid subscribers choose the Pro tier ($15/mo). This is achievable because power users who create frequently will quickly hit the Creator tier's 30-session limit and upgrade. The free tier at 3/week is tight but viable — and can be further optimized by reducing generation costs through self-hosted inference (Section 6.4).

### 8.4 Revenue Projections

| Metric | Month 6 | Year 1 | Year 2 |
|---|---|---|---|
| Total Users | 105K | 310K | 1.2M |
| Paid Subscribers | 5,250 (5%) | 15,500 (5%) | 72,000 (6%) |
| Creator Tier (60%) | 3,150 | 9,300 | 43,200 |
| Pro Tier (40%) | 2,100 | 6,200 | 28,800 |
| MRR | $56,700 | $167,400 | $777,600 |
| **ARR** | **$680K** | **$2.0M** | **$9.3M** |

---

## 9. Growth Framework and Experimentation

### 9.1 Retention Targets

Muse has validated nothing yet. The 8-12 sessions/user/month figure in v2.0 was borrowed from Suno's usage patterns — a company with 2+ years of market presence and massive viral moments. Muse must establish its own retention benchmarks through measurement, not assumption.

| Metric | Week 1 Target | Month 1 Target | Month 3 Target | Measurement Method |
|---|---|---|---|---|
| D1 Retention | 40% | — | — | % of new users who return within 24 hours |
| D7 Retention | 20% | — | — | % of new users who return within 7 days |
| D30 Retention | — | 10% | 15% | % of new users active at 30 days |
| Sessions/User/Month | — | 3-4 | 5-6 | Median sessions per active user |
| Creation Completion Rate | 60% | 65% | 70% | % of users who start recording and reach results |
| Share Rate | 10% | 15% | 20% | % of completed creations shared externally |

These targets are deliberately conservative. If D7 retention falls below 15%, it signals a fundamental product-market fit problem that no amount of growth spending can fix.

### 9.2 Funnel Instrumentation

Every transition in the Muse funnel is a discrete, instrumentable step. This is a genuine structural advantage for optimization.

| Funnel Step | Event Name | Key Properties | Optimization Lever |
|---|---|---|---|
| Landing page visit | `page_view` | Source, device, country | Messaging, design |
| Create button tap | `create_start` | Authenticated, returning user | CTA placement, copy |
| Recording started | `recording_start` | Input method (hum/piano) | Onboarding flow |
| Recording completed | `recording_complete` | Duration, note count | Recording UX |
| Pitch detection done | `pitch_detected` | Confidence score, note count | Model accuracy |
| Piano verification | `melody_confirmed` | Notes edited (yes/no), time spent | Auto-skip threshold |
| Style selected | `style_selected` | Styles chosen, count | Default selection |
| Generation started | `generation_start` | Style count, engine | Queue management |
| Generation completed | `generation_complete` | Duration, success/failure, engine | Retry logic, model choice |
| Track played | `track_play` | Track variant, play duration | Audio quality |
| Video generated | `video_generated` | Duration, success/failure | Video pipeline |
| Share initiated | `share_initiated` | Platform, format (link/video) | Share UX |
| Share completed | `share_completed` | Platform, referral code | Attribution |

### 9.3 Experimentation Infrastructure

Muse will implement a lightweight A/B testing framework from Phase 1.5, before any growth spending begins.

**Architecture:** Feature flags stored in the database, assigned per-user on first visit, with consistent bucketing (same user always sees the same variant). Events are tagged with the active experiment variants for analysis.

**Pre-registered experiments for Phase 1.5:**

| Experiment | Hypothesis | Variants | Primary Metric | Decision Rule |
|---|---|---|---|---|
| Piano skip | Auto-skipping piano verification for high-confidence detections increases completion rate | A: Show piano (control) / B: Auto-skip if confidence > 0.85 | Creation completion rate | Ship B if completion rate +5% with no increase in "melody wrong" reports |
| Free tier limit | 3/week vs 5/week free generations | A: 3/week / B: 5/week | Paid conversion rate | Ship whichever maximizes LTV (conversion rate x ARPU) |
| Video prompt style | Generic style prompts vs melody-aware prompts | A: Genre-based / B: Melody-tempo-energy based | Share rate | Ship B if share rate +10% |
| Loading experience | Fun facts vs progress-only vs mini-game | A: Fun facts / B: Progress bar only / C: Simple rhythm game | Completion rate (% who wait for results) | Ship variant with highest completion |

---

## 10. Success Metrics

### 10.1 North Star Metric

**Tracks shared to social platforms per day.** This single metric captures the full value chain: a user created music (engagement), generated a video (feature adoption), and shared it publicly (distribution + growth). Every shared track is both a satisfied user and a potential new user acquisition channel.

### 10.2 Key Performance Indicators

| Metric | Month 1 | Month 6 | Year 1 | How Measured |
|---|---|---|---|---|
| Registered Users | 6K | 105K | 310K | Database count |
| DAU | 900 | 15,750 | 46,500 | Unique daily active sessions |
| Creation Completion Rate | 55% | 65% | 70% | Funnel analytics |
| Share Rate | 10% | 15% | 20% | share_completed / generation_complete |
| D7 Retention | 15% | 20% | 25% | Cohort analysis |
| Paid Conversion | 2% | 4% | 5% | Subscriber / registered |
| Viral Coefficient (k) | 0.10 | 0.18 | 0.30 | Measured from referral attribution |
| Avg. Generation Latency | 75s | 60s | 45s | Server-side timing |
| NPS | 30 | 40 | 50 | In-app survey (monthly) |

These are not wishes — each has a defined measurement method and will be tracked from day one. If D7 retention is below 15% at Month 1, the team pivots to retention-focused work before any growth investment.

---

## 11. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Free tier costs exceed revenue** | High | Critical | Reduced to 3/week; stress-tested breakeven model; self-hosted inference roadmap |
| **Low retention after novelty** | Medium | Critical | D1/D7/D30 instrumentation from day one; experimentation framework; UX improvement roadmap |
| **Competitor replicates features** | High | High | Community network effects as primary moat; accelerated Phase 2 social features |
| **Privacy/regulatory action** | Medium | Critical | Raw audio never persisted; on-device processing in Phase 2; DPAs with all sub-processors |
| **API provider model deprecation** | Medium | High | Provider-agnostic abstraction layer; self-hosted inference for open-source models |
| **In-memory job store data loss** | Medium | Medium | Database-backed job store in Phase 1.5; dead letter queue in Phase 3 |
| **Music API instability** | Medium | Medium | Auto-retry with backoff; dual-engine fallback; graceful degradation |
| **Video generation quality (looped clips)** | Medium | Medium | Melody-aware prompts in Phase 2; user-uploaded reference images; A/B test share rates |
| **Copyright concerns with AI music** | Medium | High | Clear AI-generated labeling; no training on copyrighted melodies; legal review |

---

## 12. Social Platform Compatibility

Muse is designed as a **social-native creation tool**, optimized for distribution across major social and messaging platforms:

| Platform | Integration Point | User Value |
|---|---|---|
| **Instagram Reels** | One-tap export of 9:16 AI music videos | Instant social sharing with optimized format |
| **TikTok** | 9:16 portrait video with music | Native format for viral distribution |
| **YouTube Shorts** | Cross-post music videos | Extended reach on Google's platform |
| **WhatsApp** | Share creation links + audio previews | Viral distribution through messaging |
| **Threads** | Share music creation stories | Community building around music creation |

Instagram Reels is the primary distribution channel. Muse generates videos in the exact 9:16 portrait format at 1080x1920 resolution that Instagram Reels requires. Each video includes AI-generated cinematic scene visuals that match the music's mood and style. The audio reuse feature on Instagram enables a viral remix cycle: Creator A hums a melody → Muse generates a track → Creator B discovers the track on Reels → Creator B remixes it with their own hum → A new track is born. This creates a **flywheel effect** where each creation spawns new creations.

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
| AI track/session naming | Shipped | LLM-generated creative names |
| Hailuo 2.3 video generation | Shipped | 1 segment looped, ~2 min generation |
| Background job + polling | Shipped | Real-time progress, no HTTP timeout |
| FFmpeg audio-video merge | Shipped | With fallback for deployment |
| Community gallery | Shipped | Style filters, session/track views |
| Share page | Shipped | Public, no-auth video playback |
| MP3 download | Shipped | Server-side format conversion |
| MP4 video download | Shipped | Fetch-then-blob for cross-origin |
| Landing page | Shipped | "Turn your hum into music. Go viral." |
| Funnel analytics | Planned (Phase 1.5) | Event tracking for all funnel steps |
| A/B testing framework | Planned (Phase 1.5) | Feature flags + experiment bucketing |
| On-device pitch detection | Planned (Phase 2) | WebAssembly Basic Pitch |
| User profiles + followers | Planned (Phase 2) | Social graph foundation |
| Melody remix chains | Planned (Phase 2) | Fork + credit system |

---

## References

[1] Grand View Research. "Global Generative AI in Music Market Size & Outlook." 2024. https://www.grandviewresearch.com/horizon/outlook/generative-ai-in-music-market-size/global

[2] Meta Platforms. "Instagram Reels Statistics." 2025. https://about.instagram.com

[3] Goldman Sachs. "Creator Economy Market Size." 2024. https://www.goldmansachs.com/insights/articles/the-creator-economy-could-approach-half-a-trillion-dollars-by-2027

[4] TechCrunch. "Suno raises at $2.45B valuation on $200M revenue." November 2025. https://techcrunch.com/2025/11/19/legally-embattled-ai-music-startup-suno-raises-at-2-45b-valuation-on-200m-revenue/

[5] Mordor Intelligence. "Short-Form Video Platform Market." 2024. https://www.mordorintelligence.com

[6] DataReportal. "Digital 2025: Global Overview Report." 2025. https://datareportal.com

[7] Influencer Marketing Hub. "Creator Economy Statistics." 2025. https://influencermarketinghub.com

[8] Ministry of Electronics and IT, Government of India. "Digital Personal Data Protection Act, 2023." https://www.meity.gov.in/data-protection-framework

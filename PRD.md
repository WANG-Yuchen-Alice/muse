# Muse — Product Requirements Document

**Version:** 4.0
**Date:** March 30, 2026
**Authors:** Muse Team
**Hackathon:** APAC AI New Bets Hackathon

---

## Executive Summary

Muse is building the **AI music collaborator that learns with you** — a platform where anyone can create, evolve, and share original music starting from the most natural human musical expression: humming. Today, Muse converts a hum into a polished, multi-style music track with an AI-generated scene video optimized for social sharing. Tomorrow, Muse becomes your personal music intelligence — learning your melodic patterns, suggesting harmonic progressions, generating full albums, creating visual identities, and distributing to Spotify and Apple Music.

The current product is the entry point to this larger vision, not the destination. The hum-to-music-to-video pipeline is the content generation engine that bootstraps the user base, content library, and — critically — the **proprietary melody-correction dataset** that becomes Muse's durable competitive advantage. Every time a user edits their detected melody on the piano keyboard, they generate a labeled training pair (raw hum → intended melody) that no competitor possesses. This data flywheel is what transforms Muse from an API integration layer into a company with a defensible model advantage.

This document is structured as a strategic playbook, not a feature list. It addresses the hardest questions first: why Muse survives when Suno ships hum input, how the unit economics work at realistic conversion rates, what the product experience actually feels like on a budget Android phone in Mumbai, and what must be true before a single dollar is spent on acquisition.

**Tagline:** *Turn your hum into music. Go viral.*

---

## 1. The Bigger Vision: AI Music Collaborator

### 1.1 Why "Hum-to-TikTok" Is Thinking Small

The current product makes a 30-second clip and shares it on TikTok. That is a feature inside a much larger product. The real opportunity is an **AI music collaborator that grows with you** — a system that understands your musical taste, remembers your melodic patterns, and becomes a better creative partner with every session.

| Horizon | Product | User Experience | Moat Layer |
|---|---|---|---|
| **H1 (Now)** | Hum-to-music-to-video creation tool | Hum → get a track → share a video | Content library + melody correction data |
| **H2 (6-12 months)** | Personal music intelligence | "Play something like what I hummed last Tuesday, but jazzier" | Personalized style models per user |
| **H3 (18-36 months)** | Full music production platform | Generate albums, create artist visual identity, distribute to DSPs | Creator economy network effects + distribution partnerships |

The H1 product is not the vision — it is the **data collection mechanism** for the vision. Every hum, every melody correction, every style preference, every share decision is a training signal. The question is not whether the current product is defensible (it is not). The question is whether it generates enough data and retention to reach H2 before a competitor does.

### 1.2 The Suno Threat — Honest Assessment

If Suno announced hum-to-music input tomorrow, what would Muse have that they cannot replicate in 90 days?

**Today (honest answer):** Very little. The dual-engine approach, video generation, and style-matched visuals are API calls. Suno could replicate the feature bundle with their existing $200M ARR and $2.45B valuation [4].

**In 6 months (if we execute):** Three things Suno cannot easily replicate:

1. **Proprietary melody-correction dataset.** Every piano keyboard edit generates a (raw_hum, intended_melody) training pair. At 50K corrections/month, Muse accumulates a unique dataset for fine-tuning hum-to-melody models that no text-prompt-first competitor has incentive to collect. Suno's users type text — they do not correct melodies.

2. **Hum-native community graph.** A social network where the atomic unit of content is a melody (not a finished track) creates different social dynamics than Suno's prompt-sharing community. Melody remixing, harmonic collaboration, and "melody chains" are interaction patterns that do not exist in text-prompt ecosystems.

3. **Mobile-first APAC distribution.** Suno is a desktop-first, English-first product. Muse is designed for the mobile-first, multilingual APAC market (India, Southeast Asia, Japan) where the next 500M music consumers are coming online. This is a distribution advantage, not a product advantage — but distribution advantages compound.

**What must be true:** Muse must reach 100K melody corrections and 50K community interactions before Suno ships hum input. That is the race.

---

## 2. Product Experience — What It Actually Feels Like

### 2.1 The Honest UX Assessment

The tagline says "Turn your hum into music" — implying simplicity, magic, delight. The actual experience today involves 11 steps and 4-6 minutes. This section describes what the experience actually is, and what it needs to become.

**Current experience (measured on desktop, good connection):**

| Step | Action | Duration | Emotional State |
|---|---|---|---|
| 1 | Land on page, see hero | 2s | Curious |
| 2 | Tap "Create Your First Track" | 0s | Excited |
| 3 | Grant microphone permission | 3s | Slight friction |
| 4 | Hum a melody (up to 10s) | 3-10s | Creative, engaged |
| 5 | Wait for pitch detection | 3-5s | Anxious — "did it work?" |
| 6 | See notes on piano, verify/edit | 10-30s | Confused if non-musical; delighted if musical |
| 7 | Select styles (1-3 from 10) | 5-10s | Choice overload possible |
| 8 | Tap "Generate" | 0s | Anticipation |
| 9 | Wait for music generation | 60-90s | Boredom risk — fun facts help but do not solve |
| 10 | Browse results, play tracks | 30-60s | Delight (if quality is good) or disappointment |
| 11 | Optional: generate video (~120s more) | 120s | Patience tested |
| **Total** | | **4-6 min** | **Rollercoaster** |

### 2.2 The Mobile-First APAC Reality

Muse's primary market is APAC — India, Southeast Asia, Japan. The median user in this market is on a **budget Android phone (2-4GB RAM) over a 3G/4G connection with 5-15 Mbps bandwidth and 100-300ms latency** [6]. The current web app has not been tested or optimized for this environment.

**Known risks on constrained devices:**

| Component | Risk | Mitigation (Phase 1.5) |
|---|---|---|
| WebAssembly Basic Pitch (Phase 2) | Multi-MB WASM binary may not load on 3G | Progressive loading; server fallback for slow connections |
| Audio recording (Web Audio API) | Works on modern mobile browsers, but quality varies | Test on 10 most common APAC Android devices; provide recording quality indicator |
| 60-90s generation wait | User switches to another app; loses context | Push notification when ready (PWA); email notification fallback |
| Video streaming (MP4) | Buffering on slow connections | Adaptive bitrate; offer audio-only share option |
| Full page load | Heavy React SPA may be slow on 3G | Measure and optimize Core Web Vitals; target LCP < 3s on 4G |

**Pre-launch validation plan:** Before any paid acquisition, run **50 in-person user sessions** with target users in Mumbai and Jakarta on their own devices. Observe where they struggle, where they drop off, and whether they complete the creation flow. This is the single highest-ROI activity the team can do.

### 2.3 The Path to 60-Second Creation

The PM crit is right: 4-6 minutes is not "effortless magic." The target is a **60-second core creation experience** (hum to hearing your first track). Here is the concrete path:

| Improvement | Time Saved | New Total | Timeline | How |
|---|---|---|---|---|
| **Baseline (current)** | — | 4-6 min | Shipped | — |
| Auto-skip piano for high-confidence (>0.85) detections | -15s avg | 3.5-5 min | Phase 1.5 | Skip step 6 for 70% of users; show "Edit melody" as secondary |
| On-device pitch detection (WASM) | -4s | 3-4.5 min | Phase 2 | Eliminate server round-trip |
| Default single style (auto-selected by mood) | -8s | 2.5-4 min | Phase 1.5 | Pre-select best-fit style; "More styles" as secondary |
| Streaming audio preview (first 5s) | -50s perceived | **~60s to first audio** | Phase 2 | Stream partial result while full generation continues |
| Background video generation (auto-start) | -120s from flow | 60s core + video arrives later | Phase 2 | Auto-trigger video after music; notify when ready |

The "Quick Create" mode (Phase 2) compresses the flow to: **Hum → Auto-detect → Auto-generate → Hear preview in ~60 seconds.** Video generation happens in the background and the user is notified when it is ready. Advanced users can still access the full flow with piano editing and multi-style selection.

### 2.4 Community Experience Design — Not Just Feature Names

The PM crit correctly identified that "user profiles with follower graphs" and "algorithmic discovery feed" are feature names, not experiences. Here is what the community layer actually feels like:

**Discovery Feed Experience:**
You open Muse and see a feed of short music videos — not from artists you follow, but from people like you. A college student in Bangalore hummed a melody while walking to class; Muse turned it into a lo-fi track with rain-on-window visuals. You tap it, hear 15 seconds, and think "I could do that." You tap "Remix this melody" — Muse loads their original notes into your piano, and you can rearrange, extend, or transform them. Your remix credits the original creator. When you share your version, their follower count goes up too.

**Remix Chain Experience:**
A melody starts as 8 notes hummed by a teenager in Tokyo. Someone in Jakarta adds a bridge. Someone in Mumbai changes the key and adds a Bollywood-style arrangement. The "melody chain" page shows the family tree — every fork, every transformation, every creator credited. The original melody has been remixed 47 times. The teenager in Tokyo has 2,000 followers and has never played an instrument.

**Deletion and Lineage:**
When Creator A deletes their account, their original melody is **tombstoned** — the notes are retained as an anonymous seed for the remix chain, but the creator profile is removed. Derivative works are not deleted because they are transformative creations by other users. The tombstone record preserves the chain's integrity while respecting the deletion request. This is the same approach used by Git (commits persist after author account deletion) and Wikipedia (edit history persists after user account deletion).

---

## 3. Proprietary Data Flywheel

### 3.1 The Melody Correction Dataset

This is Muse's most important strategic asset — and the one the PM crit correctly identified as underspecified. Here is the concrete plan.

**What the data is:** Every time a user records a hum and then edits the detected notes on the piano keyboard, Muse captures a training pair:

| Input | Output | Metadata |
|---|---|---|
| Raw pitch detection result (note sequence + confidence scores) | User-corrected note sequence | Device type, recording quality score, user's correction history |

**Why this is valuable:** Current hum-to-melody models (including Basic Pitch) are trained on clean vocal recordings, not on the messy, noisy, off-pitch hums that real users produce. A model fine-tuned on real-world hum corrections would significantly outperform generic pitch detection — especially for non-musical users who hum imprecisely.

**Scale targets:**

| Milestone | Corrections | Training Viability | Timeline |
|---|---|---|---|
| Seed | 10K | Enough for evaluation; not for training | Month 3 |
| Minimum viable | 50K | Fine-tune Basic Pitch on correction pairs | Month 6 |
| Competitive advantage | 200K | Train custom hum-to-melody model | Month 12 |
| Defensible moat | 1M+ | Model accuracy gap too large to close without similar data | Month 24 |

**Privacy note:** The correction dataset contains only MIDI note sequences (before and after), not raw audio. No biometric data is stored. Users are informed that their melody corrections improve the AI (consent obtained at account creation).

### 3.2 Personalized Style Models (H2 Vision)

At 50+ sessions per user, Muse has enough data to build a **personal style profile**: preferred genres, typical melodic patterns (ascending vs. descending, interval preferences), tempo ranges, and instrument choices. This enables "Generate something in my style" — no hum needed, the AI knows your taste — and "Make this more like my Tuesday session" — cross-session memory. This is the transition from tool to collaborator. A tool does what you tell it. A collaborator anticipates what you want.

---

## 4. Market Sizing — Revised

### 4.1 Top-Down Context (Ceiling, Not Forecast)

| Market Segment | 2024 Size | 2030 Projected | CAGR | Source |
|---|---|---|---|---|
| AI Music Generation | $569.7M | $2,794.7M | ~30% | Grand View Research [1] |
| Creator Economy | $250B+ | $480B+ | ~15% | Goldman Sachs [3] |
| Short-Form Video Tools | $1.8B | $8.2B | ~28% | Mordor Intelligence [5] |

### 4.2 Bottoms-Up Growth Model — Revised with LTV/CAC Honesty

The v3.0 model showed a k-factor of 0.18 (sub-viral) and assumed $85K in paid acquisition. The PM crit correctly identified that the LTV/CAC ratio through paid channels is 0.18 — meaning **the business loses money on every non-virally acquired user.** This fundamentally changes the growth strategy.

**Revised strategy: Zero paid acquisition until k-factor > 0.5.**

| Phase | Growth Strategy | Spend | Rationale |
|---|---|---|---|
| Months 1-3 | Organic only (Product Hunt, Hacker News, creator seeding, SEO) | $5K | Validate retention and share rates with real users |
| Months 3-6 | Micro-influencer partnerships (barter, not paid) | $10K | Test viral loop mechanics with real content |
| Months 6-12 | Paid acquisition ONLY if k > 0.5 and LTV/CAC > 3 | $0-70K | Gate spending on proven unit economics |

**Revised bottoms-up projection (organic-first):**

| Month | Organic Users | Viral Invites (k=0.18→0.3) | Cumulative | DAU (15%) |
|---|---|---|---|---|
| 1 | 3,000 | 540 | 3,540 | 531 |
| 3 | 8,000 | 4,800 | 20,000 | 3,000 |
| 6 | 15,000 | 13,500 | 55,000 | 8,250 |
| 12 | 25,000 | 37,500 | 150,000 | 22,500 |

This is a smaller, more honest projection: 150K users at Year 1 instead of 310K. The trade-off is that every user is acquired at near-zero cost, making the unit economics viable from day one.

---

## 5. Unit Economics — Stress-Tested

### 5.1 Revised Pricing

Based on the PM crit that $8/mo is too low to create real margin, and that the price floor should be $12-15/mo:

| Tier | Price | Generations | Video | Target |
|---|---|---|---|---|
| **Free** | $0 | 3/week, audio only | No video (paid feature) | Trial users |
| **Creator** | $12/mo | 40/month | HD video, no watermark | Regular creators |
| **Pro** | $20/mo | Unlimited | 4K video, priority queue, API | Power users |

### 5.2 Revised Cost Model

| Component | Per-Unit | Free (3/wk, no video) | Creator ($12, 40/mo) | Pro ($20, 80/mo) |
|---|---|---|---|---|
| Music generation | $0.07 | $0.84/mo | $2.80/mo | $5.60/mo |
| Video generation | $0.10 | $0/mo | $1.00/mo | $2.00/mo |
| Image + LLM | $0.015 | $0.18/mo | $0.60/mo | $1.20/mo |
| Infrastructure | $0.01 | $0.12/mo | $0.40/mo | $0.80/mo |
| **Total cost** | | **$1.14/mo** | **$4.80/mo** | **$9.60/mo** |
| **Revenue** | | **$0** | **$12.00** | **$20.00** |
| **Gross margin** | | **-$1.14** | **$7.20 (60%)** | **$10.40 (52%)** |

### 5.3 Breakeven Analysis — Why Organic-First Is Non-Negotiable

At 5% conversion with a 70/30 Creator/Pro mix:

| Metric | Value |
|---|---|
| Revenue per paid user (blended) | $14.40/mo |
| Cost per paid user (blended) | $6.24/mo |
| Gross margin per paid user | $8.16/mo |
| Free users per paid user (at 5% conversion) | 19 |
| Free tier subsidy (19 × $1.14) | $21.66/mo |
| **Net margin per paid user (after free subsidy)** | **-$13.50/mo** |

**The free tier subsidy still dominates.** The path to viability:

| Lever | Impact | Timeline |
|---|---|---|
| Self-hosted MusicGen (40% music gen cost reduction) | Free tier cost drops to $0.65/mo; subsidy drops to $12.35 | Phase 2 (Month 8) |
| Higher conversion (8% vs 5%) | Free users per paid drops to 11.5; subsidy drops to $7.48 | Requires D7 > 20% |
| Self-hosted + 8% conversion | Net margin: +$0.68/mo per paid user | **Viable** |
| Self-hosted + 8% conversion + 40% Pro mix | Net margin: +$2.64/mo per paid user | **Healthy** |

**The model works at 8% conversion with self-hosted inference and 40% Pro mix.** This is aggressive but achievable — Suno's estimated conversion is 6-10% [4]. The critical dependency is D7 retention > 20%, which must be validated before any scaling.

### 5.4 LTV/CAC — Why Paid Acquisition Is Gated

| Acquisition Channel | Effective CAC per Paid User (at 5%) | LTV (12-month) | LTV/CAC | Decision |
|---|---|---|---|---|
| Organic / viral | ~$0 | $97.92 | ∞ | Always on |
| Paid ($1.21 blended CPA) | $24.20 | $97.92 | 4.0 | Only if conversion > 5% confirmed |
| Paid at 3% conversion | $40.33 | $97.92 | 2.4 | Not viable |

Paid acquisition only activates when measured conversion rate exceeds 5% and D7 retention exceeds 20%. Every dollar spent before these thresholds are confirmed is a dollar the business cannot recover.


---

## 6. Privacy Architecture — Launch-Ready

### 6.1 Data Lifecycle Map

| Stage | Data | System | Retention | Deletion | DPA Status |
|---|---|---|---|---|---|
| 1. Recording | Raw audio (WebM) | Browser (Web Audio API) | Session only | Tab close | N/A (client-side) |
| 2. Upload | Raw audio (WebM) | Muse server (memory) | ~5s processing | Discarded after pitch extraction | N/A (first-party) |
| 3. Pitch Detection | Audio → MIDI notes | Basic Pitch (server) | Processing only | Input discarded after inference | N/A (first-party library) |
| 4. Note Storage | MIDI note sequence | TiDB database | Persistent | Account deletion | N/A (first-party) |
| 5. Music Gen (Lyria) | Text prompt only | Google AI API | 30 days (Google AI Terms §4.3) | Auto-deleted per Google policy | Signed (Google AI Platform Terms) |
| 6. Music Gen (MusicGen) | Text prompt only | Replicate API | Deleted within 30 days per Replicate DPA | Auto-deleted per DPA | To be signed before paid acquisition |
| 7. Video Gen (Hailuo) | Text prompt + image URL | Replicate API | Per Replicate DPA | Auto-deleted per DPA | To be signed before paid acquisition |
| 8. Generated assets | MP3, MP4, images | S3 storage | Persistent | Account deletion | N/A (first-party storage) |

**Critical design decision:** Raw audio is never persisted to disk or database. It exists only in server memory during the ~5 seconds of Basic Pitch processing, then is discarded. Only the extracted MIDI note sequence (e.g., "C4, E4, G4, C5") is stored — this is not biometric data, as it cannot be used to identify the individual. No raw audio is sent to any third-party AI service; only text prompts and note descriptions are transmitted.

### 6.2 Compliance — Launch Requirements (Not Phase 1.5)

| Requirement | Status | Deadline |
|---|---|---|
| Replicate DPA signed | In progress | Before paid acquisition |
| Google AI Platform Terms accepted | Completed | Shipped |
| Privacy policy with sub-processor list | Draft complete | Before paid acquisition |
| Cookie/analytics consent banner | Not started | Before funnel instrumentation goes live |
| Community gallery: explicit public sharing consent | **Not shipped — critical gap** | **Immediate hotfix** |
| Right-to-deletion endpoint | Not started | Before paid acquisition |
| Melody correction consent (AI training) | Not started | Before correction data pipeline goes live |

### 6.3 Community Gallery Consent — Immediate Fix

The community gallery is already shipped, but public sharing consent is not implemented. **This is being fixed immediately.** The current behavior publishes all user creations to the gallery by default. The fix adds a toggle on the results page ("Share to Community Gallery," default OFF) and a consent dialog on first share explaining that the track will be visible to all Muse users and can be removed anytime.

### 6.4 Analytics Consent and Purpose Limitation

The funnel instrumentation plan creates a rich behavioral profile. Under DPDP purpose limitation, this data must be collected with explicit consent and used only for the stated purpose.

| Data Category | Purpose | Legal Basis (DPDP) | Consent Mechanism |
|---|---|---|---|
| Funnel events (anonymous) | Product improvement | Legitimate interest | Cookie consent banner; opt-out available |
| Funnel events (authenticated) | Personalization + improvement | Consent | Account creation consent; granular opt-out in settings |
| Melody correction pairs | AI model training | Consent | Explicit opt-in: "Help improve Muse's AI by sharing your melody corrections" |
| Device/country metadata | Analytics | Legitimate interest | Cookie consent banner |

---

## 7. Platform Architecture

### 7.1 Provider-Agnostic Abstraction Layer

The interface contracts define how Muse interacts with AI providers, ensuring that swapping a provider (as happened with the Veo-to-Hailuo migration) requires implementing an interface — not rewriting a pipeline.

```typescript
interface MusicGenerator {
  generate(input: MusicGenInput): Promise<MusicGenOutput>;
  estimateLatency(input: MusicGenInput): number;
  estimateCost(input: MusicGenInput): number;
  healthCheck(): Promise<ProviderHealth>;
}

interface VideoGenerator {
  generate(input: VideoGenInput): Promise<VideoGenOutput>;
  estimateLatency(input: VideoGenInput): number;
  estimateCost(input: VideoGenInput): number;
  healthCheck(): Promise<ProviderHealth>;
}
```

### 7.2 Self-Hosted Inference — Concrete Plan

**MusicGen Self-Hosting (Phase 2, Month 6-8):**

| Specification | Detail |
|---|---|
| Model | MusicGen-medium (1.5B params) |
| Hardware | 1x NVIDIA A10G (24GB VRAM) on AWS g5.xlarge |
| Cost | $1.006/hr on-demand; ~$0.60/hr reserved |
| Throughput | ~15 generations/minute (30s tracks) |
| Latency | ~45s per generation (vs. 60-90s on Replicate) |
| Monthly cost at 50K gen/mo | ~$1,400 (vs. $1,000 on Replicate) |
| Monthly cost at 200K gen/mo | ~$2,800 (vs. $4,000 on Replicate) |
| Break-even volume | ~120K generations/month |

Self-hosting is cost-effective only above 120K generations/month. Below that, Replicate is cheaper. The migration trigger is crossing this threshold, expected around Month 8-10.

### 7.3 Rate Limiting and Abuse Prevention — Day One

| Protection | Implementation | Timeline |
|---|---|---|
| Per-user rate limit | 3 generations/week for free; enforced server-side | Shipped |
| Per-IP rate limit | 10 requests/minute for unauthenticated endpoints | Phase 1.5 |
| Generation queue priority | Paid users prioritized; free users queued behind | Phase 1.5 |
| Prompt injection defense | LLM prompts use system-level instructions; user input parameterized | Shipped |
| Storage limits | Max 50 tracks per free account; max 10MB per upload | Phase 1.5 |
| Bot detection | CAPTCHA on account creation; behavioral analysis | Phase 2 |
| Cost circuit breaker | If daily API spend exceeds 2x budget, pause free-tier generations | Phase 1.5 |

### 7.4 Durable Job Store

| Phase | Store | Durability | Capacity |
|---|---|---|---|
| Phase 1 (current) | In-memory Map | Lost on restart | ~100 concurrent jobs |
| Phase 1.5 | TiDB table (`video_jobs`) | Full persistence | ~10K concurrent jobs |
| Phase 3 | BullMQ + Redis | Persistence + retry + dead letter | ~100K concurrent jobs |

### 7.5 Remix Chain Data Model

The remix chain tracks fork lineage, credit attribution, and handles deletion cascades through a tombstone model:

```sql
CREATE TABLE melody_chains (
  id          VARCHAR(36) PRIMARY KEY,
  melody_id   VARCHAR(36) NOT NULL,
  forked_from VARCHAR(36),           -- FK to melody_chains.id (nullable for originals)
  creator_id  VARCHAR(36),           -- FK to users.id (null when tombstoned)
  notes       JSON NOT NULL,         -- MIDI note sequence
  created_at  TIMESTAMP DEFAULT NOW(),
  tombstoned  BOOLEAN DEFAULT FALSE  -- true when creator deletes account
);

-- Deletion policy: tombstone, not cascade.
-- Creator deletion → set tombstoned=true, set creator_id=null.
-- Notes and chain relationships preserved for derivative works.
```

---

## 8. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + Tailwind CSS 4 | Modern, performant UI with rapid iteration |
| Backend | Express 4 + tRPC 11 | End-to-end type safety, efficient RPC |
| Database | TiDB (MySQL-compatible) | Scalable, cloud-native relational DB |
| Auth | Manus OAuth | Seamless authentication integration |
| Music AI (1) | Google Lyria 3 Clip API | State-of-the-art music generation with lyrics |
| Music AI (2) | Meta MusicGen via Replicate (self-host at scale) | Faithful melody reproduction |
| Video AI | MiniMax Hailuo 2.3 via Replicate | Cinematic scene video generation |
| Image AI | Built-in Image Generation | Style-specific cover art |
| Pitch Detection | Spotify Basic Pitch (migrate to WASM) | ML-based hum-to-notes conversion |
| LLM | Built-in LLM (Gemini) | Track naming, scene prompts, style analysis |
| Media Processing | FFmpeg (@ffmpeg-installer) | Audio/video processing pipeline |
| Storage | S3-compatible object storage | Media asset storage and CDN delivery |
| Hosting | Manus Platform | Managed deployment with custom domains |

---

## 9. Growth Framework — Instrumentation Before Spending

### 9.1 The Non-Negotiable Sequence

Every dollar spent before instrumentation is live is a dollar you cannot learn from. The growth sequence is gated:

| Step | Action | Gate to Next Step |
|---|---|---|
| 1 | Ship funnel instrumentation (14 events) | All events firing correctly in production |
| 2 | Ship analytics consent banner | DPDP-compliant consent flow live |
| 3 | Run 50 in-person user sessions (Mumbai, Jakarta) | Qualitative insights documented; critical UX fixes identified |
| 4 | Fix critical UX issues from user sessions | Creation completion rate > 50% on mobile |
| 5 | Ship A/B testing framework | At least one experiment running |
| 6 | Measure D1/D7 retention for 4 weeks | D7 > 15% confirmed |
| 7 | Begin organic growth (Product Hunt, creator seeding) | Organic users flowing; funnel data accumulating |
| 8 | Measure viral coefficient for 4 weeks | k-factor measured with confidence |
| 9 | Begin paid acquisition ONLY if LTV/CAC > 3 | Paid channels activated |

### 9.2 Retention Targets

| Metric | Month 1 | Month 3 | Month 6 | Red Line (pivot trigger) |
|---|---|---|---|---|
| D1 Retention | 35% | 40% | 45% | < 25% |
| D7 Retention | 15% | 20% | 25% | < 12% |
| D30 Retention | 8% | 12% | 15% | < 6% |
| Creation Completion (mobile) | 45% | 55% | 65% | < 35% |
| Share Rate | 8% | 12% | 18% | < 5% |

If D7 retention falls below 12% after Month 1, the team stops all growth work and focuses exclusively on retention. If it remains below 12% after Month 3, the team re-evaluates the core product hypothesis.

### 9.3 North Star and Counter-Metric

**North Star:** Tracks shared to social platforms per day. This captures the full value chain — creation, completion, and distribution.

**Counter-metric:** D7 retention rate. Share rate without retention is vanity — you could optimize for flashy first experiences that drive shares but have zero stickiness. The North Star and counter-metric must move together.

**Measurement note:** `share_completed` tracking is unreliable (depends on user returning after external share). The primary proxy is `share_initiated` (user tapped share and selected a platform), supplemented by UTM-tagged referral tracking on incoming traffic.

### 9.4 Pre-Registered Experiments

| Experiment | Hypothesis | Metric | Min. Sample | Weeks to Significance (at 500 DAU) |
|---|---|---|---|---|
| Piano auto-skip | Auto-skip increases completion +5% | Completion rate | 2,000/variant | ~2 weeks |
| Default single style | Reducing choice increases completion | Completion rate | 2,000/variant | ~2 weeks |
| Video prompt quality | Melody-aware prompts increase share +10% | Share rate | 5,000/variant | ~5 weeks |
| Loading experience | Mini-game vs. fun facts vs. progress bar | Wait completion | 1,500/variant | ~3 weeks |

---

## 10. Strategic Roadmap — Revised

| Phase | Timeline | Focus | Key Deliverables | Gate to Next Phase |
|---|---|---|---|---|
| **1** (Current) | Q2 2026 | Creation Engine | Hum/play input, dual-engine, 10 styles, video, share, gallery | Product live and functional |
| **1.5** | Q2-Q3 2026 | **Instrumentation + Hardening** | Funnel analytics, consent banner, gallery consent fix, rate limiting, 50 user sessions, A/B framework, durable job store, abstraction layer | D7 > 15%; funnel data flowing |
| **2** | Q3-Q4 2026 | **Community + Mobile** | User profiles, remix chains, discovery feed, PWA, on-device pitch detection, Quick Create, melody correction pipeline | 50K corrections; community DAU > 1K |
| **3** | Q1 2027 | **Network Effects + Scale** | Remix leaderboards, creator tips, trending feed, self-hosted MusicGen, public API v1 | k-factor > 0.5; self-hosted live |
| **4** | Q2-Q3 2027 | **Platform + H2 Vision** | Personal style models, album generation, DSP distribution, enterprise API | ARR > $1M |

Phase 1.5 is the explicit hardening phase. No community features or growth spending until instrumentation, consent, and abuse prevention are shipped.

---

## 11. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Suno ships hum input | High | Critical | Accelerate melody correction dataset; community in Phase 2; mobile-first APAC |
| Free tier costs unsustainable | High | Critical | No free video; self-hosted inference; 3/week cap; cost circuit breaker |
| D7 retention < 12% | Medium | Critical | 50 user sessions pre-launch; Quick Create mode; mobile optimization |
| Mobile APAC performance | Medium | High | Device testing; progressive loading; audio-only fallback |
| Privacy/regulatory (DPDP) | Medium | Critical | DPAs before acquisition; consent banner; gallery consent fix |
| API provider deprecation | Medium | High | Abstraction layer; self-hosted MusicGen |
| Bot abuse on free tier | Medium | Medium | Rate limiting; CAPTCHA; cost circuit breaker |

---

## 12. Current Implementation Status

| Feature | Status | Notes |
|---|---|---|
| Hum recording + pitch detection | Shipped | 10s max, real-time visualization |
| Interactive piano verification | Shipped | 2-octave keyboard (C4-B5) |
| Lyria 3 + MusicGen dual engine | Shipped | 30s tracks, auto-retry |
| 10 music styles | Shipped | Lo-fi through EDM |
| AI cover art + track naming | Shipped | Per-track, style-specific |
| Hailuo 2.3 video generation | Shipped | 1 segment looped, ~2 min |
| Background job + polling | Shipped | Real-time progress |
| Community gallery | Shipped | **Consent fix needed (immediate)** |
| Share page | Shipped | Public, no-auth playback |
| MP3/MP4 downloads | Shipped | Cross-origin compatible |
| Funnel analytics | **Not shipped** | Phase 1.5 priority |
| A/B testing framework | **Not shipped** | Phase 1.5 priority |
| Analytics consent banner | **Not shipped** | Phase 1.5 priority |
| Gallery sharing consent | **Not shipped** | **Immediate hotfix** |
| Rate limiting | **Not shipped** | Phase 1.5 priority |
| Right-to-deletion | **Not shipped** | Phase 1.5 priority |
| Durable job store | **Not shipped** | Phase 1.5 priority |

---

## 13. Success Metrics

| Metric | Month 1 | Month 3 | Month 6 | Year 1 | Measurement |
|---|---|---|---|---|---|
| Registered Users | 3.5K | 20K | 55K | 150K | Database |
| DAU | 530 | 3,000 | 8,250 | 22,500 | Analytics |
| D7 Retention | 15% | 20% | 25% | 28% | Cohort analysis |
| Creation Completion (mobile) | 45% | 55% | 65% | 70% | Funnel analytics |
| Share Rate | 8% | 12% | 18% | 22% | share_initiated events |
| Viral Coefficient (k) | 0.10 | 0.18 | 0.30 | 0.50 | Referral attribution |
| Paid Conversion | 3% | 5% | 7% | 8% | Subscriber / registered |
| Melody Corrections | 2K | 15K | 50K | 150K | Database |
| MRR | $1.3K | $12K | $46K | $144K | Billing |

---

## References

[1] Grand View Research. "Global Generative AI in Music Market Size & Outlook." 2024. https://www.grandviewresearch.com/horizon/outlook/generative-ai-in-music-market-size/global

[2] Meta Platforms. "Instagram Reels Statistics." 2025. https://about.instagram.com

[3] Goldman Sachs. "Creator Economy Market Size." 2024. https://www.goldmansachs.com/insights/articles/the-creator-economy-could-approach-half-a-trillion-dollars-by-2027

[4] TechCrunch. "Suno raises at $2.45B valuation on $200M revenue." November 2025. https://techcrunch.com/2025/11/19/legally-embattled-ai-music-startup-suno-raises-at-2-45b-valuation-on-200m-revenue/

[5] Mordor Intelligence. "Short-Form Video Platform Market." 2024. https://www.mordorintelligence.com

[6] GSMA. "The Mobile Economy Asia Pacific 2025." 2025. https://www.gsma.com/mobileeconomy/asiapacific/

[7] Influencer Marketing Hub. "Creator Economy Statistics." 2025. https://influencermarketinghub.com

[8] Ministry of Electronics and IT, Government of India. "Digital Personal Data Protection Act, 2023." https://www.meity.gov.in/data-protection-framework

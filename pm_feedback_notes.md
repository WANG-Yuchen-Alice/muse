# PM Crit Feedback — Round 1

## Scores
| Dimension | Recognition | Challenges |
|-----------|------------|------------|
| Craft | 3 | 4 |
| Growth | 3 | 4 |
| Business | 3 | 4 |
| Platform | 2 | 5 |
| Moonshot | 4 | 4 |
| Privacy | 2 | 5 |

## Zara Kim (Moonshot PM)
- Hum-first input is a paradigm shift, genuinely brilliant insight
- BUT: roadmap buries the only real moat (Music Social Network, Phase 4) at 24 months
- Smart glasses and VR prototypes are distractions
- "If Suno announced hum-to-music input and AI video generation tomorrow, what does Muse have that they can't replicate in 90 days?"
- The ONLY moat candidate is community and social graph — pull it forward to Phase 2
- Skip smart glasses and VR entirely
- Network effects compound — every quarter you delay building them is a quarter Suno could use

## Jordan Lee (Business PM)
- Unit economics is the existential question
- $3-6 cost per user/month against $8 ARPU = 25-60% gross margins BEFORE infrastructure/team/marketing
- Free-tier user hitting 3 generations/day costs $0.90-1.50/day — cash incinerator
- Model breakeven conversion rate explicitly and stress-test against realistic adoption curves
- Three free generations per day might need to be three per WEEK
- Regulatory compliance (biometric consent, DPAs) adds engineering cost and friction — tightens margins further
- Building social network requires critical mass of content and users — sequencing (creation tool first, then social) makes sense
- BUT: the tool must be sticky enough to retain users long enough to reach critical mass

## Alex Rivera (Growth PM)
- PRD reads like a vision document, not a growth document
- 8-12 sessions/user/month is borrowed from Suno — Muse has validated nothing yet
- Where's the D1/D7/D30 retention plan?
- Where's the experimentation infrastructure?
- Success metrics (500K users Year 1) are wishes, not KPIs — zero description of how to validate
- No A/B testing infrastructure or holdout groups mentioned
- Funnel measurability is a genuine strength (recording → pitch detection → generation → video → share = discrete steps)
- BUT: no framework for learning from that funnel
- Market sizing is top-down and unfalsifiable ($11B TAM)
- No bottoms-up growth model: no viral coefficient estimate, no cost-per-acquisition, no channel-specific strategy
- Want to see: expected share rate, click-through on shared content, signup rate from clicks, resulting viral loop coefficient

## Maya Chen (Craft PM)
- Gap between marketing promise ("Turn your hum into music") and actual UX
- Count the actual steps: land on page, tap record, hum, stop recording, wait for pitch detection, verify/edit notes on piano keyboard, select styles, hit generate, wait 60-90s for music, then wait 2 min for video
- That is NOT a "60-second core action" product
- Piano verification step is intimidating for non-musical first-time users
- "200 rotating fun facts" is a band-aid for a 3-minute loading experience
- Single 10-second video clip looped to 30s feels repetitive
- Style-to-visual mapping is generic: "Cozy room, rain on window" for every lo-fi track
- Every Muse video within a genre will look identical — "made by AI" not "made by me"
- If video doesn't feel personal and surprising, sharing rate collapses
- On-device Basic Pitch via WebAssembly would eliminate server round-trip AND solve privacy concern simultaneously — think of it as a feature, not compliance burden

## Sam Patel (Platform PM)
- "There is no platform here" — tightly coupled monolith on third-party infrastructure
- No provider-agnostic abstraction layer — Veo-to-Hailuo migration was bespoke re-integration
- No interface contract for "music generation" or "video generation" that can be satisfied by different backends
- In-memory job store means every server restart loses all in-flight video generation jobs
- At 50K videos/day, even a brief deployment window would lose hundreds of jobs
- No versioning, no rate limiting, no contract testing, no documented public interface
- "API for developers" in Q1 2027 is a fantasy without architectural foundation now
- Introduce provider-agnostic abstraction layer NOW
- Move job store to durable backend
- Define interface contracts

## Chris Wu (Privacy PM)
- ZERO mentions of privacy, data protection, consent, retention, or deletion
- Voice/hum = biometric PII under Illinois BIPA, EU AI Act, India's DPDP Act
- Audio sent server-side, processed through Spotify's Basic Pitch, flows through 6+ external services (Google, Meta via Replicate, MiniMax via Replicate, Gemini)
- No data processing agreements, sub-processor obligations, or third-party permissions documented
- Community gallery publishes user-generated content publicly with no consent for public display
- No takedown mechanisms or right-to-deletion workflows
- Remix cycle creates derivative data lineage nightmares (Creator A's melody in Creator B's remix — what happens on deletion request?)
- "Map the complete lifecycle of a user's audio recording across every system and third party it touches. Answer definitively: is the raw hum deleted after note extraction, or does it persist somewhere?"
- This is a "you can't launch without addressing it" concern, not a Phase 3 concern

## Group Conclusion
The 4 critical open questions:
1. Whether the core hum-to-share loop retains users beyond novelty (needs instrumentation, not borrowed Suno benchmarks)
2. Whether free-tier unit economics are sustainable at realistic conversion rates
3. Whether the complete absence of privacy architecture for biometric voice data creates existential regulatory risk
4. Whether the only durable moat (community network effects) should be pulled forward from Phase 4 to primary strategic focus

Recommended 4 actions before scaling:
1. Map the complete data lifecycle of voice recordings
2. Introduce provider-agnostic abstraction layers for AI services
3. Build experimentation infrastructure to measure funnel conversion and retention from day one
4. Stress-test free-tier unit economics against realistic paid conversion rates

# Muse V2 Prototype TODO

- [x] Upgrade to web-db-user for backend API proxy (need server to proxy Replicate calls)
- [x] Build Page 1: Input page with hum recording + 2-octave piano keyboard
- [x] Build Page 2: Results page showing generated music in 3-4 styles
- [x] Wire MusicGen melody API through backend
- [x] Test end-to-end flow
- [x] Save checkpoint and deliver
- [ ] Research max duration for MusicGen and alternatives
- [ ] Research Lyria 3, Suno, Stable Audio 2.5 for higher quality generation
- [ ] Test best candidate API with real melody
- [ ] Upgrade backend to use best available model
- [x] Test Lyria 3 Clip API call
- [x] Upgrade backend to use Lyria 3 Clip instead of MusicGen
- [x] Add pitch detection to convert hum to text prompt for Lyria 3
- [x] Restore MusicGen generation route alongside Lyria 3
- [x] Build side-by-side Results page (MusicGen left, Lyria 3 right)
- [x] Re-upload audio for MusicGen (needs actual audio URL, not just text description)
- [x] Update tests for dual-model generation

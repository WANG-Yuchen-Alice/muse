import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { getDb } from "./db";
import { sessions, tracks, styleImages } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

const execFileAsync = promisify(execFile);

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY ?? "";

const genai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

// ============================================================
// Track name generator — more poetic and evocative
// ============================================================
async function generateTrackName(style: string, variant: "faithful" | "reimagined"): Promise<string> {
  try {
    const vibe = variant === "faithful"
      ? "closely follows the original melody — intimate, personal, close to the heart"
      : "a bold creative reimagination — unexpected, expansive, taking the melody somewhere new";
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a creative music naming artist. Generate a single evocative, poetic track name (2-5 words, no quotes, no punctuation at the end). 
Think of names like: Last Train Home, The Night Walk, Paper Lanterns, Midnight in Kyoto, Amber Horizons, Letters Never Sent, Rooftop Serenade, Velvet Hour, Ghost of a Waltz, Neon Rainfall, Sunday Morning Light.
Be specific, atmospheric, and storytelling — each name should feel like a tiny narrative or scene. Avoid generic music terms.`,
        },
        {
          role: "user",
          content: `Generate a track name for a piece that ${vibe}, in the ${style} genre.`,
        },
      ],
    });
    const raw = response.choices?.[0]?.message?.content;
    const nameStr = typeof raw === "string" ? raw : "";
    const name = nameStr.trim().replace(/["']/g, "").replace(/\.$/, "");
    return name.length > 0 && name.length < 60 ? name : `${style} ${variant === "faithful" ? "Echo" : "Dream"}`;
  } catch {
    return `${style} ${variant === "faithful" ? "Echo" : "Dream"}`;
  }
}

// ============================================================
// Lyria 3 Clip — text prompt only, 30s, 48kHz stereo
// ============================================================
async function generateWithLyria3(prompt: string, maxRetries = 3): Promise<{ audioData: Buffer; caption: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await genai.models.generateContent({
        model: "lyria-3-clip-preview",
        contents: prompt,
        config: {
          responseModalities: ["AUDIO", "TEXT"],
        },
      });

      let audioData: Buffer | null = null;
      let caption = "";

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData) {
          audioData = Buffer.from(part.inlineData.data as string, "base64");
        } else if (part.text) {
          caption = part.text;
        }
      }

      if (!audioData) {
        if (attempt < maxRetries) {
          console.warn(`Lyria 3 attempt ${attempt}/${maxRetries}: no audio data, retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw new Error("Lyria 3 did not return audio data after multiple attempts");
      }

      return { audioData, caption };
    } catch (err: any) {
      if (attempt < maxRetries && (err?.message?.includes("audio data") || err?.status === 500 || err?.status === 503)) {
        console.warn(`Lyria 3 attempt ${attempt}/${maxRetries} failed: ${err.message}, retrying...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Lyria 3 generation failed after all retries");
}

// ============================================================
// MusicGen (Replicate) — melody-conditioned, audio input
// ============================================================
async function generateWithMusicGen(
  audioUrl: string,
  prompt: string,
  duration: number = 30
): Promise<{ audioUrl: string }> {
  const createRes = await axios.post(
    "https://api.replicate.com/v1/predictions",
    {
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      input: {
        model_version: "stereo-melody-large",
        prompt,
        input_audio: audioUrl,
        duration,
        output_format: "mp3",
        normalization_strategy: "loudness",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const predictionId = createRes.data.id;

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      { headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` } }
    );
    const status = pollRes.data.status;
    if (status === "succeeded") {
      const output = pollRes.data.output;
      return { audioUrl: typeof output === "string" ? output : output };
    }
    if (status === "failed" || status === "canceled") {
      throw new Error(`MusicGen prediction ${status}: ${pollRes.data.error ?? "unknown error"}`);
    }
  }
  throw new Error("MusicGen prediction timed out after 180s");
}

// ============================================================
// Style image generation — uses built-in image generation
// ============================================================
async function getOrGenerateStyleImage(styleId: string, styleName: string, color: string): Promise<string> {
  const db = await getDb();
  if (db) {
    // Try to get an existing image with lowest usage count
    const existing = await db
      .select()
      .from(styleImages)
      .where(eq(styleImages.styleId, styleId))
      .orderBy(styleImages.usageCount)
      .limit(1);

    if (existing.length > 0) {
      // Increment usage count
      await db.update(styleImages).set({ usageCount: sql`${styleImages.usageCount} + 1` }).where(eq(styleImages.id, existing[0].id));
      return existing[0].imageUrl;
    }
  }

  // Generate a new image
  const prompts: Record<string, string> = {
    lofi: "Dreamy lo-fi aesthetic scene: a cozy window view on a rainy night, warm amber light from a desk lamp, vinyl records scattered, steaming cup of coffee, soft bokeh city lights in background, muted warm tones, nostalgic atmosphere, cinematic photography style",
    cinematic: "Epic cinematic landscape: vast mountain range at golden hour, dramatic clouds with god rays breaking through, sweeping orchestral feeling, deep shadows and brilliant highlights, anamorphic lens flare, film grain, IMAX quality, breathtaking scale",
    jazz: "Intimate jazz club scene: warm spotlight on an empty stage with a saxophone on its stand, velvet curtains, smoky atmosphere, amber and deep burgundy tones, art deco details, vintage microphone, moody and sophisticated, film noir aesthetic",
    electronic: "Futuristic cyberpunk cityscape at night: neon-lit streets reflecting on wet pavement, holographic displays, aurora borealis in the sky above skyscrapers, deep purple and electric blue palette, synthwave aesthetic, ultra-detailed digital art",
    tiktok: "Vibrant neon-lit content creator setup: ring light glowing, colorful LED strips, smartphone on tripod, confetti and sparkles in the air, dynamic motion blur, bold pink and red palette, energetic and trendy, social media aesthetic",
    upbeat: "Bright sunny beach boardwalk scene: golden hour sunlight, palm trees swaying, colorful surfboards, ice cream stand, people dancing, warm turquoise and coral tones, summer festival vibes, joyful and carefree atmosphere",
    rock: "Dramatic rock concert stage: powerful spotlights cutting through smoke, electric guitar silhouette, Marshall amplifier stacks, leather and chrome aesthetic, deep red and black palette, raw energy, concert photography style",
    rnb: "Luxurious late-night penthouse scene: city skyline through floor-to-ceiling windows, soft purple ambient lighting, velvet furniture, candles flickering, rose petals, warm pink and purple tones, intimate and romantic atmosphere",
    classical: "Grand concert hall interior: ornate golden ceiling, crystal chandelier, Steinway grand piano center stage under a single warm spotlight, red velvet seats, baroque architecture, elegant and timeless, warm amber and cream tones",
    edm: "Massive music festival at night: laser beams cutting through fog, giant LED screens with geometric patterns, crowd silhouettes with raised hands, confetti cannons, vivid green and blue neon palette, euphoric energy, wide-angle photography",
  };

  const prompt = prompts[styleId] ?? prompts.lofi;

  try {
    const result = await generateImage({ prompt });
    const imageUrl = result.url ?? "";

    if (imageUrl && db) {
      await db.insert(styleImages).values({
        styleId,
        imageUrl,
        prompt,
        usageCount: 1,
      });
    }

    return imageUrl;
  } catch (err) {
    console.error(`Failed to generate image for style ${styleId}:`, err);
    return "";
  }
}

// ============================================================
// ffmpeg helpers for MP3/MP4 conversion
// ============================================================
async function convertToMp3(audioUrl: string): Promise<Buffer> {
  const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
  const inputPath = path.join(tmpdir(), `muse-input-${nanoid()}.tmp`);
  const outputPath = path.join(tmpdir(), `muse-output-${nanoid()}.mp3`);

  try {
    await writeFile(inputPath, Buffer.from(response.data));
    await execFileAsync("ffmpeg", [
      "-y", "-i", inputPath,
      "-codec:a", "libmp3lame", "-b:a", "192k",
      "-ar", "44100", "-ac", "2",
      outputPath,
    ], { timeout: 30000 });
    const mp3Buffer = await readFile(outputPath);
    return mp3Buffer;
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

// ============================================================
// Audio-reactive music video — 9:16 vertical, FFmpeg
// ============================================================
async function createMusicVideo(
  audioUrl: string,
  imageUrl: string,
  trackName: string,
  styleId: string,
  color: string
): Promise<Buffer> {
  const [audioResp, imageResp] = await Promise.all([
    axios.get(audioUrl, { responseType: "arraybuffer" }),
    imageUrl ? axios.get(imageUrl, { responseType: "arraybuffer" }) : null,
  ]);

  const id = nanoid();
  const audioPath = path.join(tmpdir(), `muse-va-${id}.tmp`);
  const bgImagePath = path.join(tmpdir(), `muse-vbg-${id}.png`);
  const outputPath = path.join(tmpdir(), `muse-mv-${id}.mp4`);

  // Parse hex color to RGB for FFmpeg
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };
  const rgb = hexToRgb(color || "#A78BFA");

  // Sanitize track name for FFmpeg drawtext (escape special chars)
  const safeTrackName = (trackName || "Untitled")
    .replace(/'/g, "'\\\''")
    .replace(/:/g, "\\:")
    .replace(/%/g, "%%");

  try {
    await writeFile(audioPath, Buffer.from(audioResp.data));

    const filterParts: string[] = [];
    const hasImage = !!imageResp;

    // Audio input is always index 0
    // When image exists: image is index 1 (via -loop 1 -i imagePath)
    // When no image: color source is index 1 (via -f lavfi -i color=...)
    if (hasImage) {
      await writeFile(bgImagePath, Buffer.from(imageResp.data));
      // Scale background image to 1080x1920 (9:16) with crop
      filterParts.push(
        `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg]`
      );
    } else {
      // Color source is input 1 (added as -f lavfi -i in ffmpegArgs)
      filterParts.push(
        `[1:v]scale=1080:1920,setsar=1[bg]`
      );
    }

    // Audio visualization: showwaves with custom colors, positioned at bottom
    filterParts.push(
      `[0:a]showwaves=s=1080x300:mode=cline:rate=30:colors=${color}@0.8|${color}@0.4:scale=sqrt[waves]`
    );

    // Overlay waves on background at the bottom area
    filterParts.push(
      `[bg][waves]overlay=0:1520:shortest=1[withwaves]`
    );

    // Add a semi-transparent gradient bar at the bottom for text readability
    filterParts.push(
      `[withwaves]drawbox=x=0:y=1680:w=1080:h=240:color=black@0.5:t=fill[withbar]`
    );

    // Add track name text
    filterParts.push(
      `[withbar]drawtext=text='${safeTrackName}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1740:font=Arial:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf[withname]`
    );

    // Add "Created with Muse" branding
    filterParts.push(
      `[withname]drawtext=text='Created with Muse':fontsize=28:fontcolor=white@0.5:x=(w-text_w)/2:y=1820:font=Arial:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf[final]`
    );

    // Build input args: audio first, then image or color source
    const inputArgs: string[] = ["-y", "-i", audioPath];
    if (hasImage) {
      inputArgs.push("-loop", "1", "-i", bgImagePath);
    } else {
      // Use lavfi color source as a proper input
      inputArgs.push("-f", "lavfi", "-i", `color=c=black:s=1080x1920:d=60`);
    }

    const ffmpegArgs = [
      ...inputArgs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[final]",
      "-map", "0:a",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "192k",
      "-pix_fmt", "yuv420p",
      "-shortest",
      "-movflags", "+faststart",
      "-t", "30",
      outputPath,
    ];

    await execFileAsync("ffmpeg", ffmpegArgs, { timeout: 120000 });
    const mp4Buffer = await readFile(outputPath);
    return mp4Buffer;
  } finally {
    await unlink(audioPath).catch(() => {});
    await unlink(bgImagePath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

async function createMp4WithImage(audioUrl: string, imageUrl: string): Promise<Buffer> {
  const [audioResp, imageResp] = await Promise.all([
    axios.get(audioUrl, { responseType: "arraybuffer" }),
    imageUrl ? axios.get(imageUrl, { responseType: "arraybuffer" }) : null,
  ]);

  const id = nanoid();
  const audioPath = path.join(tmpdir(), `muse-audio-${id}.tmp`);
  const imagePath = path.join(tmpdir(), `muse-image-${id}.png`);
  const outputPath = path.join(tmpdir(), `muse-video-${id}.mp4`);

  try {
    await writeFile(audioPath, Buffer.from(audioResp.data));

    if (imageResp) {
      await writeFile(imagePath, Buffer.from(imageResp.data));
      // Create MP4 with static image + audio (9:16 vertical)
      await execFileAsync("ffmpeg", [
        "-y",
        "-loop", "1", "-i", imagePath,
        "-i", audioPath,
        "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        "-movflags", "+faststart",
        outputPath,
      ], { timeout: 60000 });
    } else {
      // No image — create a simple black video with audio (9:16 vertical)
      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "lavfi", "-i", "color=c=black:s=1080x1920:d=30",
        "-i", audioPath,
        "-c:v", "libx264",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        "-movflags", "+faststart",
        outputPath,
      ], { timeout: 60000 });
    }

    const mp4Buffer = await readFile(outputPath);
    return mp4Buffer;
  } finally {
    await unlink(audioPath).catch(() => {});
    await unlink(imagePath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

const FADE_INSTRUCTION = "The piece should have a natural, gentle fade-out ending over the last 3-4 seconds rather than stopping abruptly.";

const STYLES = [
  {
    id: "lofi",
    name: "Lo-fi Chill",
    lyria_prompt: `Lo-fi chill hip hop beat with warm vinyl crackle, mellow piano chords, soft brushed drums, and a gentle bass line. Cozy rainy day atmosphere, mellow and deeply relaxing. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "lo-fi chill hip hop beat, warm vinyl crackle, mellow piano, soft brushed drums, gentle bass, cozy rainy day, relaxing, gentle fade out ending",
    color: "#FF6B9D",
    emoji: "🌧",
  },
  {
    id: "cinematic",
    name: "Cinematic Epic",
    lyria_prompt: `Epic cinematic orchestral piece with soaring strings, powerful brass, and thundering timpani. Starts quiet with a solo melody, builds to a massive crescendo with full orchestra. Dramatic and emotional film score. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "epic cinematic orchestral, soaring strings, powerful brass, thundering timpani, dramatic crescendo, emotional film score, gentle fade out ending",
    color: "#00E5FF",
    emoji: "🎬",
  },
  {
    id: "jazz",
    name: "Smooth Jazz",
    lyria_prompt: `Smooth jazz piece with a warm saxophone melody over gentle piano comping, walking bass line, and brushed drums. Relaxed swing feel, late-night jazz club atmosphere. Sophisticated and warm. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "smooth jazz, warm saxophone melody, gentle piano, walking bass, brushed drums, relaxed swing, late-night jazz club, gentle fade out ending",
    color: "#FFB800",
    emoji: "🎷",
  },
  {
    id: "electronic",
    name: "Ambient Electronic",
    lyria_prompt: `Ambient electronic piece with dreamy synthesizers, atmospheric pads, subtle arpeggios, and ethereal textures. Floating deep space vibes, meditative and immersive. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "ambient electronic, dreamy synthesizers, atmospheric pads, subtle arpeggios, ethereal textures, deep space, meditative, gentle fade out ending",
    color: "#A78BFA",
    emoji: "🌌",
  },
  {
    id: "tiktok",
    name: "TikTok Viral",
    lyria_prompt: `Catchy viral TikTok-style pop beat with punchy 808 bass, snappy hi-hats, bright synth hooks, and an infectious earworm melody. High energy, trendy, and instantly memorable. Perfect for short-form video content. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "catchy viral tiktok pop beat, punchy 808 bass, snappy hi-hats, bright synth hooks, earworm melody, high energy trendy, gentle fade out ending",
    color: "#FF3B5C",
    emoji: "🔥",
  },
  {
    id: "upbeat",
    name: "Upbeat Pop",
    lyria_prompt: `Upbeat and cheerful pop track with bright acoustic guitar strumming, lively hand claps, warm piano chords, and a bouncy bass line. Feel-good summer vibes, optimistic and energizing. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "upbeat cheerful pop, bright acoustic guitar, lively hand claps, warm piano, bouncy bass, feel-good summer vibes, optimistic, gentle fade out ending",
    color: "#22D3EE",
    emoji: "☀️",
  },
  {
    id: "rock",
    name: "Rock",
    lyria_prompt: `Powerful rock track with driving electric guitar riffs, thundering drums, deep bass grooves, and soaring lead guitar solos. Raw energy with a classic rock feel, building to an anthemic chorus. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "powerful rock, driving electric guitar riffs, thundering drums, deep bass grooves, soaring lead guitar, raw energy classic rock, gentle fade out ending",
    color: "#EF4444",
    emoji: "🎸",
  },
  {
    id: "rnb",
    name: "R&B Soul",
    lyria_prompt: `Smooth R&B soul track with silky Rhodes piano, warm bass, gentle finger snaps, lush string pads, and a sultry groove. Late-night romantic atmosphere, intimate and soulful. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "smooth R&B soul, silky Rhodes piano, warm bass, gentle finger snaps, lush strings, sultry groove, late-night romantic, intimate, gentle fade out ending",
    color: "#F472B6",
    emoji: "💜",
  },
  {
    id: "classical",
    name: "Classical Piano",
    lyria_prompt: `Elegant classical piano piece in the style of Chopin or Debussy. Flowing arpeggios, expressive dynamics, delicate ornaments, and rich harmonic progressions. Intimate recital hall atmosphere, deeply emotional and refined. Solo piano, no other instruments. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "elegant classical piano, Chopin style, flowing arpeggios, expressive dynamics, delicate ornaments, rich harmonics, intimate recital, emotional, gentle fade out ending",
    color: "#D4A574",
    emoji: "🎹",
  },
  {
    id: "edm",
    name: "EDM / Dance",
    lyria_prompt: `High-energy EDM dance track with pulsing four-on-the-floor kick, massive synth drops, euphoric build-ups, crisp claps, and shimmering risers. Festival main stage energy, powerful and uplifting. Instrumental only, no vocals. ${FADE_INSTRUCTION}`,
    musicgen_prompt: "high-energy EDM dance, pulsing four-on-the-floor kick, massive synth drops, euphoric build-ups, crisp claps, shimmering risers, festival energy, gentle fade out ending",
    color: "#10B981",
    emoji: "🪩",
  },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  music: router({
    /** Get available style options */
    getStyles: publicProcedure.query(() => {
      return STYLES.map((s) => ({ id: s.id, name: s.name, color: s.color, emoji: s.emoji }));
    }),

    /** Upload recorded audio (base64) and return a URL for MusicGen */
    uploadAudio: publicProcedure
      .input(z.object({ audioBase64: z.string(), mimeType: z.string().default("audio/webm") }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.audioBase64, "base64");
        const ext = input.mimeType.includes("wav") ? "wav" : "webm";
        const key = `melodies/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    /** Create a generation session */
    createSession: publicProcedure
      .input(z.object({
        originalAudioUrl: z.string().optional(),
        melodyDescription: z.string().optional(),
        inputMode: z.string().optional(),
        selectedStyles: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Generate a creative session name
        let sessionName = "";
        try {
          const styleNames = (input.selectedStyles ?? []).map(
            (id) => STYLES.find((s) => s.id === id)?.name ?? id
          ).join(", ");
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Generate a single creative, evocative session name (2-4 words, no quotes, no punctuation at end). Think of names like: Midnight Reverie, Sunlit Daydream, Velvet Dusk, Electric Dawn, Amber Cascade, Moonlit Passage, Crimson Tide, Whispered Echo. Be atmospheric and poetic.`,
              },
              {
                role: "user",
                content: `Create a session name for a music creation session using ${input.inputMode ?? "hum"} input${styleNames ? ` in styles: ${styleNames}` : ""}.`,
              },
            ],
          });
          const raw = response.choices?.[0]?.message?.content;
          const nameStr = typeof raw === "string" ? raw : "";
          sessionName = nameStr.trim().replace(/["']/g, "").replace(/\.$/, "");
          if (sessionName.length > 100) sessionName = sessionName.slice(0, 100);
        } catch {
          sessionName = "";
        }

        const result = await db.insert(sessions).values({
          userId: ctx.user?.id ?? null,
          originalAudioUrl: input.originalAudioUrl ?? null,
          melodyDescription: input.melodyDescription ?? null,
          inputMode: input.inputMode ?? null,
          sessionName: sessionName || null,
        });

        const sessionId = result[0].insertId;
        return { sessionId, sessionName };
      }),

    /** Generate with Lyria 3 Clip — max ~30s */
    generateLyria: publicProcedure
      .input(z.object({
        melodyDescription: z.string().optional(),
        styleId: z.string(),
        sessionId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        let fullPrompt = style.lyria_prompt;
        if (input.melodyDescription && input.melodyDescription.trim()) {
          fullPrompt = `${style.lyria_prompt} The melody should follow this pattern: ${input.melodyDescription}`;
        }

        // Generate track name, audio, and style image in parallel
        const [{ audioData, caption }, trackName, imageUrl] = await Promise.all([
          generateWithLyria3(fullPrompt),
          generateTrackName(style.name, "reimagined"),
          getOrGenerateStyleImage(style.id, style.name, style.color),
        ]);

        const key = `generated/lyria/${nanoid()}.mp3`;
        const { url: audioUrl } = await storagePut(key, audioData, "audio/mpeg");

        // Save to DB
        if (input.sessionId) {
          const db = await getDb();
          if (db) {
            await db.insert(tracks).values({
              sessionId: input.sessionId,
              styleId: style.id,
              variant: "reimagined",
              trackName,
              audioUrl,
              imageUrl: imageUrl || null,
              caption,
              duration: 30,
              status: "done",
            });
          }
        }

        return {
          model: "lyria3" as const,
          styleId: style.id,
          styleName: style.name,
          color: style.color,
          audioUrl,
          caption,
          trackName,
          imageUrl,
        };
      }),

    /** Generate with MusicGen (melody-conditioned) — max 30s */
    generateMusicGen: publicProcedure
      .input(z.object({
        audioUrl: z.string(),
        styleId: z.string(),
        duration: z.number().min(8).max(30).default(30),
        sessionId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        // Generate track name, audio, and style image in parallel
        const [result, trackName, imageUrl] = await Promise.all([
          generateWithMusicGen(input.audioUrl, style.musicgen_prompt, input.duration),
          generateTrackName(style.name, "faithful"),
          getOrGenerateStyleImage(style.id, style.name, style.color),
        ]);

        // Save to DB
        if (input.sessionId) {
          const db = await getDb();
          if (db) {
            await db.insert(tracks).values({
              sessionId: input.sessionId,
              styleId: style.id,
              variant: "faithful",
              trackName,
              audioUrl: result.audioUrl,
              imageUrl: imageUrl || null,
              caption: "",
              duration: input.duration,
              status: "done",
            });
          }
        }

        return {
          model: "musicgen" as const,
          styleId: style.id,
          styleName: style.name,
          color: style.color,
          audioUrl: result.audioUrl,
          caption: "",
          trackName,
          imageUrl,
        };
      }),

    /** Download as MP3 */
    downloadMp3: publicProcedure
      .input(z.object({ audioUrl: z.string(), trackName: z.string().optional() }))
      .mutation(async ({ input }) => {
        const mp3Buffer = await convertToMp3(input.audioUrl);
        const key = `downloads/${nanoid()}.mp3`;
        const { url } = await storagePut(key, mp3Buffer, "audio/mpeg");
        return { url, filename: `${(input.trackName ?? "muse-track").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.mp3` };
      }),

    /** Download as MP4 (image + audio) */
    downloadMp4: publicProcedure
      .input(z.object({
        audioUrl: z.string(),
        imageUrl: z.string().optional(),
        trackName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const mp4Buffer = await createMp4WithImage(input.audioUrl, input.imageUrl ?? "");
        const key = `downloads/${nanoid()}.mp4`;
        const { url } = await storagePut(key, mp4Buffer, "video/mp4");
        return { url, filename: `${(input.trackName ?? "muse-track").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.mp4` };
      }),

    /** Generate a 9:16 music video with audio-reactive visualization */
    generateVideo: publicProcedure
      .input(z.object({
        audioUrl: z.string(),
        imageUrl: z.string().optional(),
        trackName: z.string().optional(),
        styleId: z.string(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        const color = input.color || style?.color || "#A78BFA";
        const trackName = input.trackName || "Untitled";

        const mp4Buffer = await createMusicVideo(
          input.audioUrl,
          input.imageUrl ?? "",
          trackName,
          input.styleId,
          color
        );

        const key = `videos/${nanoid()}.mp4`;
        const { url } = await storagePut(key, mp4Buffer, "video/mp4");

        // Update track videoUrl in DB if we can find the track
        try {
          const db = await getDb();
          if (db && input.audioUrl) {
            await db.update(tracks)
              .set({ videoUrl: url })
              .where(eq(tracks.audioUrl, input.audioUrl));
          }
        } catch (err) {
          console.error("Failed to update track videoUrl:", err);
        }

        return {
          url,
          filename: `${trackName.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.mp4`,
        };
      }),

    /** Pre-generate style images (can be called to seed the library) */
    generateStyleImages: publicProcedure
      .input(z.object({ styleId: z.string(), count: z.number().min(1).max(5).default(3) }))
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        const results: string[] = [];
        for (let i = 0; i < input.count; i++) {
          const url = await getOrGenerateStyleImage(style.id, style.name, style.color);
          if (url) results.push(url);
        }
        return { images: results };
      }),
  }),

  gallery: router({
    /** List all generation sessions (most recent first) */
    listSessions: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { sessions: [], total: 0 };

        const limit = input?.limit ?? 20;
        const offset = input?.offset ?? 0;

        const [sessionList, countResult] = await Promise.all([
          db.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(limit).offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(sessions),
        ]);

        return {
          sessions: sessionList,
          total: countResult[0]?.count ?? 0,
        };
      }),

    /** List individual tracks (optionally filtered by style), most recent first */
    listTracks: publicProcedure
      .input(z.object({
        styleId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { tracks: [], total: 0 };

        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        const styleId = input?.styleId;

        const baseWhere = styleId ? eq(tracks.styleId, styleId) : undefined;

        const [trackList, countResult] = await Promise.all([
          baseWhere
            ? db.select().from(tracks).where(baseWhere).orderBy(desc(tracks.createdAt)).limit(limit).offset(offset)
            : db.select().from(tracks).orderBy(desc(tracks.createdAt)).limit(limit).offset(offset),
          baseWhere
            ? db.select({ count: sql<number>`count(*)` }).from(tracks).where(baseWhere)
            : db.select({ count: sql<number>`count(*)` }).from(tracks),
        ]);

        return {
          tracks: trackList,
          total: countResult[0]?.count ?? 0,
        };
      }),

    /** Get a single session with all its tracks */
    getSession: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [sessionResult, trackList] = await Promise.all([
          db.select().from(sessions).where(eq(sessions.id, input.sessionId)).limit(1),
          db.select().from(tracks).where(eq(tracks.sessionId, input.sessionId)),
        ]);

        if (sessionResult.length === 0) throw new Error("Session not found");

        return {
          session: sessionResult[0],
          tracks: trackList,
        };
      }),

    /** Get a single track by ID (for share page) */
    getTrack: publicProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.select().from(tracks).where(eq(tracks.id, input.trackId)).limit(1);
        if (result.length === 0) throw new Error("Track not found");

        const track = result[0];
        const style = STYLES.find((s) => s.id === track.styleId);

        return {
          ...track,
          styleName: style?.name ?? track.styleId,
          color: style?.color ?? "#A78BFA",
          emoji: style?.emoji ?? "",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

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
import { existsSync } from "fs";
import { createRequire } from "module";

const execFileAsync = promisify(execFile);
const _require = createRequire(import.meta.url);

// Resolve FFmpeg binary: try @ffmpeg-installer first (bundles binary reliably),
// then ffmpeg-static, then system ffmpeg as last resort.
function resolveFFmpeg(): string {
  try {
    const installer = _require("@ffmpeg-installer/ffmpeg");
    if (installer?.path && existsSync(installer.path)) return installer.path;
  } catch (e) { console.warn("[FFmpeg] @ffmpeg-installer/ffmpeg not available:", (e as Error).message); }
  try {
    const staticPath = _require("ffmpeg-static");
    if (staticPath && existsSync(staticPath)) return staticPath;
  } catch (e) { console.warn("[FFmpeg] ffmpeg-static not available:", (e as Error).message); }
  return "ffmpeg";
}
function resolveFFprobe(): string {
  try {
    const probe = _require("ffprobe-static");
    const p = probe?.path || (typeof probe === "string" ? probe : null);
    if (p && existsSync(p)) return p;
  } catch {}
  return "ffprobe";
}
const FFMPEG = resolveFFmpeg();
const FFPROBE = resolveFFprobe();
console.log(`[FFmpeg] Using: ${FFMPEG}, ffprobe: ${FFPROBE}`);

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY ?? "";

const genai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

// ============================================================
// Video Job Store — in-memory background job tracking
// ============================================================
interface VideoJob {
  id: string;
  status: "pending" | "analyzing" | "prompting" | "generating" | "downloading" | "merging" | "uploading" | "done" | "error";
  progress: number; // 0-100
  step: string; // human-readable current step
  segmentsDone: number;
  segmentsTotal: number;
  videoUrl: string | null;
  error: string | null;
  createdAt: number;
}

const videoJobs = new Map<string, VideoJob>();

// Clean up old jobs after 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  Array.from(videoJobs.entries()).forEach(([id, job]) => {
    if (job.createdAt < oneHourAgo) videoJobs.delete(id);
  });
}, 300000);

function updateJobProgress(jobId: string, updates: Partial<VideoJob>) {
  const job = videoJobs.get(jobId);
  if (job) Object.assign(job, updates);
}

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
      const replicateUrl = typeof output === "string" ? output : output;

      // Re-upload to S3 so the URL never expires (Replicate URLs expire in ~24h)
      try {
        const audioResp = await axios.get(replicateUrl, { responseType: "arraybuffer" });
        const key = `generated/musicgen/${nanoid()}.mp3`;
        const { url: s3Url } = await storagePut(key, Buffer.from(audioResp.data), "audio/mpeg");
        console.log(`[MusicGen] Re-uploaded to S3: ${s3Url}`);
        return { audioUrl: s3Url };
      } catch (uploadErr) {
        console.warn(`[MusicGen] S3 re-upload failed, using Replicate URL:`, uploadErr);
        return { audioUrl: replicateUrl };
      }
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
    await execFileAsync(FFMPEG, [
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
// AI Scene Video Generation — Gemini Veo 3.1
// Generates a real AI scene video based on music style and mood
// ============================================================

// Video scene prompts per style — open-world, cinematic scenes
const VIDEO_SCENE_PROMPTS: Record<string, string> = {
  lofi: "A cozy rainy evening seen through a rain-streaked window. Warm amber light from a desk lamp illuminates a small room with books and a steaming cup of coffee. Raindrops slowly trickle down the glass. The camera slowly pans across the scene. Soft, dreamy, nostalgic atmosphere. Lo-fi aesthetic.",
  cinematic: "A breathtaking aerial shot sweeping over vast mountain ranges at golden hour. Dramatic clouds part to reveal god rays streaming down onto a pristine lake below. The camera soars forward through the landscape. Epic, majestic, awe-inspiring. IMAX quality cinematography.",
  jazz: "A dimly lit jazz club at night. A single warm spotlight illuminates an empty stage with a saxophone on its stand. Smoke curls lazily through the amber light. The camera slowly dollies forward through velvet curtains. Intimate, sophisticated, film noir aesthetic.",
  electronic: "A futuristic neon-lit cityscape at night. Holographic displays flicker on wet streets reflecting electric blue and purple lights. The camera glides through the cyberpunk streets. Aurora borealis shimmers above the skyscrapers. Synthwave aesthetic, ultra-detailed.",
  tiktok: "A vibrant, energetic scene with colorful confetti and sparkles falling through neon-lit air. Dynamic camera movement through a kaleidoscope of bold pinks, reds, and electric blues. Fast-paced, trendy, social media aesthetic with motion blur effects.",
  upbeat: "A bright sunny beach at golden hour. Palm trees sway gently in the breeze. Crystal clear turquoise waves lap at the shore. The camera tracks along the waterline. Warm, joyful, summer festival vibes. Vivid colors, carefree atmosphere.",
  rock: "A dramatic concert stage engulfed in smoke and powerful spotlights. Red and white beams cut through the haze. The camera pushes through the fog toward the stage. Electric energy, raw power. Concert photography style with lens flares.",
  rnb: "A luxurious penthouse at night with floor-to-ceiling windows overlooking a glittering city skyline. Soft purple ambient lighting, candles flickering. The camera slowly pans across the intimate scene. Rose petals drift through the air. Romantic, sensual atmosphere.",
  classical: "A grand concert hall with ornate golden ceiling and crystal chandeliers. A Steinway grand piano sits center stage under a single warm spotlight. The camera slowly orbits the piano. Baroque architecture, elegant and timeless. Warm amber and cream tones.",
  edm: "A massive outdoor music festival at night. Hundreds of laser beams cut through fog in every direction. Giant LED screens pulse with geometric patterns. The camera flies over a sea of silhouettes with raised hands. Euphoric energy, vivid neon colors.",
};

// Generate multiple scene prompts for Kling multi-segment video
async function generateVideoPrompts(
  styleId: string,
  styleName: string,
  trackName: string,
  count: number,
  melodyDesc?: string
): Promise<string[]> {
  const basePrompt = VIDEO_SCENE_PROMPTS[styleId] ?? VIDEO_SCENE_PROMPTS.lofi;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a creative video director. Generate ${count} distinct but thematically connected scene descriptions for a music video. Each scene should be a vivid, cinematic description suitable for AI video generation (Kling 3.0). Each scene should be 1-3 sentences, under 100 words. They should flow naturally as a visual narrative. Output ONLY a JSON array of strings, nothing else. Example: ["Scene 1 description", "Scene 2 description"]`,
        },
        {
          role: "user",
          content: `Base visual theme: ${basePrompt}\n\nMusic context: Track "${trackName}" in ${styleName} style.${melodyDesc ? ` Melody: ${melodyDesc}` : ""}\n\nGenerate ${count} cinematic scene descriptions that tell a visual story matching this music.`,
        },
      ],
    });
    const raw = response.choices?.[0]?.message?.content;
    console.log(`[VideoPrompts] LLM raw response (first 500 chars): ${raw?.slice(0, 500)}`);
    if (typeof raw === "string") {
      // Try to extract JSON array from the response (may have markdown fences)
      const jsonMatch = raw.match(/\[\s*"[\s\S]*?\]/)?.[0] || raw.trim();
      try {
        const parsed = JSON.parse(jsonMatch);
        if (Array.isArray(parsed) && parsed.length >= count) {
          console.log(`[VideoPrompts] Successfully parsed ${parsed.length} prompts`);
          return parsed.slice(0, count).map(String);
        }
        console.log(`[VideoPrompts] Parsed but got ${Array.isArray(parsed) ? parsed.length : 'non-array'} items, need ${count}`);
      } catch (parseErr) {
        console.log(`[VideoPrompts] JSON parse failed: ${parseErr}`);
      }
    }
  } catch (llmErr) {
    console.error(`[VideoPrompts] LLM call failed: ${llmErr}`);
  }
  // Fallback: use the base prompt for all segments
  console.log(`[VideoPrompts] Using fallback base prompt for all ${count} segments`);
  return Array(count).fill(basePrompt);
}

// Hailuo 2.3 model on Replicate — fast, reliable video generation (~90s per clip)
const HAILUO_MODEL = "minimax/hailuo-2.3";

// Helper: run a Hailuo prediction on Replicate and poll until done
async function runHailuoPrediction(input: Record<string, any>, label: string): Promise<string> {
  console.log(`[Hailuo] Starting ${label}...`);

  // Create prediction using model name endpoint
  const createRes = await axios.post(
    `https://api.replicate.com/v1/models/${HAILUO_MODEL}/predictions`,
    { input },
    {
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const predictionId = createRes.data.id;
  console.log(`[Hailuo] ${label} prediction created: ${predictionId}`);

  // Poll for completion (Hailuo takes ~60-120 seconds per clip)
  const maxPolls = 60; // 60 * 5s = 5 minutes max
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    let pollRes;
    try {
      pollRes = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        { headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` }, timeout: 30000 }
      );
      consecutiveErrors = 0;
    } catch (pollErr: any) {
      consecutiveErrors++;
      console.warn(`[Hailuo] ${label} polling error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${pollErr?.message || pollErr}`);
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new Error(`Hailuo ${label} polling failed after ${MAX_CONSECUTIVE_ERRORS} consecutive errors: ${pollErr?.message}`);
      }
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    const status = pollRes.data.status;

    if (i % 4 === 0) {
      console.log(`[Hailuo] ${label} polling... attempt ${i + 1}/${maxPolls}, status: ${status}`);
    }

    if (status === "succeeded") {
      const output = pollRes.data.output;
      if (!output) throw new Error(`Hailuo ${label} succeeded but no output`);
      const videoUrl = typeof output === "string" ? output : (output.url ? output.url() : String(output));
      console.log(`[Hailuo] ${label} completed successfully`);
      return videoUrl;
    }
    if (status === "failed" || status === "canceled") {
      const error = pollRes.data.error || "unknown error";
      throw new Error(`Hailuo ${label} ${status}: ${error}`);
    }
  }
  throw new Error(`Hailuo ${label} timed out after ${maxPolls * 5}s`);
}

// Helper: download a video from URL to a local temp file
async function downloadVideoToFile(videoUrl: string): Promise<string> {
  const localPath = path.join(tmpdir(), `muse-hailuo-${nanoid()}.mp4`);
  const resp = await axios.get(videoUrl, { responseType: "arraybuffer", timeout: 120000 });
  await writeFile(localPath, Buffer.from(resp.data));
  return localPath;
}

// Helper: get audio duration in seconds using music-metadata (pure JS, no ffprobe needed)
async function getAudioDuration(audioPath: string): Promise<number> {
  try {
    const { parseFile } = await import("music-metadata");
    const metadata = await parseFile(audioPath);
    if (metadata.format.duration) return metadata.format.duration;
  } catch (e) {
    console.warn("[Duration] music-metadata failed, trying ffprobe:", e);
  }
  // Fallback to ffprobe-static
  const { stdout } = await execFileAsync(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ], { timeout: 15000 });
  return parseFloat(stdout.trim());
}

// Helper: get video duration in seconds
async function getVideoDuration(videoPath: string): Promise<number> {
  // Try music-metadata first (pure JS, no binary dependency)
  try {
    const { parseFile } = await import("music-metadata");
    const metadata = await parseFile(videoPath);
    if (metadata.format.duration) return metadata.format.duration;
  } catch (e) {
    console.warn("[Duration] music-metadata failed for video, trying ffprobe:", e);
  }
  // Fallback to ffprobe-static
  try {
    const { stdout } = await execFileAsync(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ], { timeout: 15000 });
    return parseFloat(stdout.trim());
  } catch (e) {
    console.warn("[Duration] ffprobe also failed, estimating from file size:", e);
    // Last resort: estimate based on typical Veo output (~8s per generation)
    return 8;
  }
}

/**
 * Generate AI scene video with real-time progress reporting to the job store.
 * This is the progress-aware version called by background jobs.
 */
async function generateAISceneVideoWithProgress(
  trackName: string,
  styleId: string,
  styleName: string,
  audioUrl: string,
  imageUrl?: string,
  melodyDesc?: string,
  jobId?: string
): Promise<string> {
  const id = nanoid();
  const tempFiles: string[] = [];

  const report = (updates: Partial<VideoJob>) => {
    if (jobId) updateJobProgress(jobId, updates);
  };

  try {
    // ── Step 1: Get audio duration ──
    report({ status: "analyzing", step: "Downloading and analyzing audio...", progress: 5 });
    const audioPath = path.join(tmpdir(), `muse-audio-${id}.tmp`);
    tempFiles.push(audioPath);
    let audioResp;
    try {
      audioResp = await axios.get(audioUrl, { responseType: "arraybuffer" });
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        throw new Error("Audio file has expired or is no longer available. Please generate a new track first.");
      }
      throw new Error(`Failed to download audio: ${err?.message || "unknown error"}`);
    }
    await writeFile(audioPath, Buffer.from(audioResp.data));
    const audioDuration = await getAudioDuration(audioPath);
    console.log(`[Hailuo] Audio duration: ${audioDuration}s`);

    // ── Step 2: Plan segments ──
    // Generate just 1 segment and loop it to match audio length.
    // This cuts generation time from ~8min (4 segments) to ~2min (1 segment).
    const SEGMENT_DURATION = 10;
    const segmentCount = 1;
    console.log(`[Hailuo] Plan: 1 segment of ${SEGMENT_DURATION}s, will loop to fill ${audioDuration}s audio`);
    report({ segmentsTotal: segmentCount, progress: 8 });

    // ── Step 3: Generate scene prompt (just 1) ──
    report({ status: "prompting", step: "Writing scene description...", progress: 10 });
    const prompts = await generateVideoPrompts(styleId, styleName, trackName, 1, melodyDesc);
    console.log(`[Hailuo] Generated prompt for "${trackName}" (${styleName})`);
    report({ progress: 15 });

    // ── Step 4: Generate video clips with Hailuo 2.3 ──
    report({ status: "generating", step: "Generating video clip...", progress: 15 });
    const segmentUrls: string[] = [];
    for (let i = 0; i < segmentCount; i++) {
      const prompt = prompts[i] || prompts[0];
      console.log(`[Hailuo] Generating segment (${SEGMENT_DURATION}s): ${prompt.slice(0, 80)}...`);
      report({
        step: "Generating video clip...",
        segmentsDone: i,
        progress: 15,
      });

      try {
        const hailuoInput: Record<string, any> = {
          prompt,
          duration: SEGMENT_DURATION,
          resolution: "768p",
          prompt_optimizer: true,
        };
        if (imageUrl && i === 0) {
          hailuoInput.first_frame_image = imageUrl;
        }
        const videoUrl = await runHailuoPrediction(
          hailuoInput,
          `segment ${i + 1}/${segmentCount}`
        );
        segmentUrls.push(videoUrl);
        report({ segmentsDone: i + 1 });
      } catch (segErr: any) {
        const errMsg = segErr?.message || String(segErr);
        console.error(`[Hailuo] Segment ${i + 1} failed: ${errMsg}`);
        if (segmentUrls.length === 0) {
          if (errMsg.includes("rate") || errMsg.includes("limit") || errMsg.includes("quota") || errMsg.includes("Queue")) {
            throw new Error("Video generation is temporarily unavailable due to high demand. Please try again in a few minutes.");
          }
          throw new Error(`Video generation failed: ${errMsg.slice(0, 200)}`);
        }
        console.warn(`[Hailuo] Continuing with ${segmentUrls.length} segments (will loop to fill)`);
        break;
      }
    }

    console.log(`[Hailuo] Generated ${segmentUrls.length}/${segmentCount} segments successfully`);

    // ── Step 5: Download all segment videos ──
    report({ status: "downloading", step: "Downloading video clips...", progress: 82 });
    const segmentPaths: string[] = [];
    for (let i = 0; i < segmentUrls.length; i++) {
      console.log(`[Hailuo] Downloading segment ${i + 1}/${segmentUrls.length}...`);
      const segPath = await downloadVideoToFile(segmentUrls[i]);
      tempFiles.push(segPath);
      segmentPaths.push(segPath);
    }

    // ── Step 6: FFmpeg merge — concat segments + add audio ──
    report({ status: "merging", step: "Merging video + audio...", progress: 87 });
    const outputPath = path.join(tmpdir(), `muse-final-${id}.mp4`);
    tempFiles.push(outputPath);
    const ffmpegTimeout = 300000;

    // Check if FFmpeg is actually available before trying to use it
    let ffmpegAvailable = false;
    try {
      await execFileAsync(FFMPEG, ["-version"], { timeout: 5000 });
      ffmpegAvailable = true;
      console.log(`[Hailuo] FFmpeg is available at: ${FFMPEG}`);
    } catch (ffmpegCheckErr: any) {
      console.warn(`[Hailuo] FFmpeg NOT available (${FFMPEG}): ${ffmpegCheckErr?.message}`);
    }

    if (ffmpegAvailable) {
      try {
        if (segmentPaths.length === 1) {
          const segDuration = await getVideoDuration(segmentPaths[0]);
          const loopCount = Math.ceil(audioDuration / segDuration);
          console.log(`[Hailuo] Single segment (${segDuration.toFixed(1)}s), looping ${loopCount}x for ${audioDuration.toFixed(1)}s audio`);

          await execFileAsync(FFMPEG, [
            "-y",
            "-stream_loop", String(loopCount - 1),
            "-i", segmentPaths[0],
            "-i", audioPath,
            "-t", String(audioDuration),
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-shortest",
            outputPath,
          ], { timeout: ffmpegTimeout });
        } else {
          const concatListPath = path.join(tmpdir(), `muse-concat-${id}.txt`);
          tempFiles.push(concatListPath);

          let totalSegDuration = 0;
          for (const sp of segmentPaths) {
            totalSegDuration += await getVideoDuration(sp);
          }

          const concatLines: string[] = [];
          for (const sp of segmentPaths) {
            concatLines.push(`file '${sp}'`);
          }
          if (totalSegDuration < audioDuration) {
            const lastSeg = segmentPaths[segmentPaths.length - 1];
            const lastSegDur = await getVideoDuration(lastSeg);
            const extraLoops = Math.ceil((audioDuration - totalSegDuration) / lastSegDur);
            for (let i = 0; i < extraLoops; i++) {
              concatLines.push(`file '${lastSeg}'`);
            }
          }
          await writeFile(concatListPath, concatLines.join("\n"));

          console.log(`[Hailuo] Concatenating ${segmentPaths.length} segments (total ~${totalSegDuration.toFixed(1)}s) + audio (${audioDuration.toFixed(1)}s)`);

          await execFileAsync(FFMPEG, [
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concatListPath,
            "-i", audioPath,
            "-t", String(audioDuration),
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-shortest",
            outputPath,
          ], { timeout: ffmpegTimeout });
        }
        console.log(`[Hailuo] FFmpeg merge completed successfully`);

        // Upload merged video
        report({ status: "uploading", step: "Uploading final video...", progress: 93 });
        const finalBuffer = await readFile(outputPath);
        const key = `videos/music-video-${id}.mp4`;
        const { url } = await storagePut(key, finalBuffer, "video/mp4");
        console.log(`[Hailuo] Final music video uploaded: ${url} (${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
        return url;
      } catch (ffmpegErr: any) {
        console.error(`[Hailuo] FFmpeg merge failed: ${ffmpegErr?.message}. Falling back to raw video upload.`);
        // Fall through to raw upload below
      }
    }

    // ── Fallback: Upload raw video segment directly (no audio merge) ──
    console.log(`[Hailuo] Fallback: uploading raw video segment without audio merge`);
    report({ status: "uploading", step: "Uploading video (without audio merge)...", progress: 93 });
    const rawBuffer = await readFile(segmentPaths[0]);
    const key = `videos/music-video-${id}.mp4`;
    const { url } = await storagePut(key, rawBuffer, "video/mp4");
    console.log(`[Hailuo] Raw video uploaded (no audio): ${url} (${(rawBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
    return url;

  } finally {
    for (const f of tempFiles) {
      await unlink(f).catch(() => {});
    }
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
      await execFileAsync(FFMPEG, [
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
      await execFileAsync(FFMPEG, [
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

    /** Analyze hummed audio using Gemini to detect musical notes */
    analyzeHum: publicProcedure
      .input(z.object({ audioBase64: z.string(), mimeType: z.string().default("audio/webm") }))
      .mutation(async ({ input }) => {
        // 1. Upload audio to S3 so Gemini can access it
        const buffer = Buffer.from(input.audioBase64, "base64");
        const ext = input.mimeType.includes("wav") ? "wav" : input.mimeType.includes("mp3") ? "mp3" : "webm";
        const key = `hum-analysis/${nanoid()}.${ext}`;
        const { url: audioUrl } = await storagePut(key, buffer, input.mimeType);

        // 2. Send to Gemini with structured output for note detection
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert music transcription AI. You will receive an audio recording of someone humming or singing a melody. Your task is to identify the musical notes being hummed and return them as a precise sequence.

Rules:
- Only detect the main melody line — ignore background noise, breathing, and harmonics
- Use standard note names with octave numbers (e.g., C4, D#5, A3)
- The typical humming range is C3 to C6
- Estimate the start time (in seconds from the beginning) and duration (in seconds) for each note
- If a note is held/sustained, give it a longer duration
- If there are pauses between notes, reflect that in the start times
- Return notes in chronological order
- Be conservative: only include notes you are confident about
- Estimate an amplitude/confidence for each note from 0.0 to 1.0`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: "Please transcribe the musical notes from this humming recording. Return the notes as a JSON array.",
                },
                {
                  type: "file_url" as const,
                  file_url: {
                    url: audioUrl,
                    mime_type: "audio/mpeg" as const,
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hum_notes",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  notes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        note: { type: "string", description: "Note name with octave, e.g. C4, D#5" },
                        startTime: { type: "number", description: "Start time in seconds from beginning" },
                        duration: { type: "number", description: "Duration in seconds" },
                        amplitude: { type: "number", description: "Confidence/amplitude 0.0-1.0" },
                      },
                      required: ["note", "startTime", "duration", "amplitude"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["notes"],
                additionalProperties: false,
              },
            },
          },
        });

        // 3. Parse the structured response
        const content = response.choices?.[0]?.message?.content;
        const contentStr = typeof content === "string" ? content : "";
        let parsedNotes: Array<{
          note: string;
          startTime: number;
          duration: number;
          amplitude: number;
        }> = [];

        try {
          const parsed = JSON.parse(contentStr);
          parsedNotes = parsed.notes ?? [];
        } catch (err) {
          console.error("Failed to parse Gemini hum analysis:", err, contentStr);
          throw new Error("Failed to analyze humming. Please try again.");
        }

        // 4. Validate and normalize notes
        const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const validNotes = parsedNotes
          .filter((n) => {
            const match = n.note.match(/^([A-G]#?)(\d+)$/);
            if (!match) return false;
            if (typeof n.startTime !== "number" || typeof n.duration !== "number") return false;
            if (n.duration <= 0) return false;
            return true;
          })
          .map((n) => {
            const match = n.note.match(/^([A-G]#?)(\d+)$/)!;
            const [, noteName, octaveStr] = match;
            const octave = parseInt(octaveStr);
            const noteIdx = NOTE_NAMES.indexOf(noteName);
            const midiNumber = (octave + 1) * 12 + noteIdx;
            const freq = 440 * Math.pow(2, (midiNumber - 69) / 12);

            // Transpose to C4-B5 range for piano visualization
            let displayMidi = midiNumber;
            while (displayMidi < 60) displayMidi += 12;
            while (displayMidi > 83) displayMidi -= 12;
            const displayOctave = Math.floor(displayMidi / 12) - 1;
            const displayNoteName = NOTE_NAMES[displayMidi % 12];

            return {
              note: `${displayNoteName}${displayOctave}`,
              freq,
              startTime: Math.max(0, n.startTime),
              duration: Math.max(0.05, n.duration),
              midiNumber: displayMidi,
              amplitude: Math.max(0, Math.min(1, n.amplitude ?? 0.8)),
            };
          })
          .sort((a, b) => a.startTime - b.startTime);

        return { notes: validNotes, audioUrl };
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

    /** Start video generation as a background job — returns jobId immediately */
    generateVideo: publicProcedure
      .input(z.object({
        audioUrl: z.string(),
        imageUrl: z.string().optional(),
        trackName: z.string().optional(),
        styleId: z.string(),
        color: z.string().optional(),
        melodyDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        const trackName = input.trackName || "Untitled";
        const styleName = style?.name || input.styleId;

        // Create a job and return immediately
        const jobId = nanoid();
        const job: VideoJob = {
          id: jobId,
          status: "pending",
          progress: 0,
          step: "Starting video generation...",
          segmentsDone: 0,
          segmentsTotal: 0,
          videoUrl: null,
          error: null,
          createdAt: Date.now(),
        };
        videoJobs.set(jobId, job);

        // Run the actual generation in the background (fire-and-forget)
        (async () => {
          try {
            updateJobProgress(jobId, { status: "analyzing", step: "Analyzing audio...", progress: 5 });

            const videoUrl = await generateAISceneVideoWithProgress(
              trackName,
              input.styleId,
              styleName,
              input.audioUrl,
              input.imageUrl,
              input.melodyDescription,
              jobId,
            );

            // Update track videoUrl in DB
            try {
              const db = await getDb();
              if (db && input.audioUrl) {
                await db.update(tracks)
                  .set({ videoUrl })
                  .where(eq(tracks.audioUrl, input.audioUrl));
              }
            } catch (err) {
              console.error("Failed to update track videoUrl:", err);
            }

            updateJobProgress(jobId, {
              status: "done",
              progress: 100,
              step: "Video ready!",
              videoUrl,
            });
          } catch (err: any) {
            console.error(`[VideoJob ${jobId}] Failed:`, err);
            updateJobProgress(jobId, {
              status: "error",
              step: "Generation failed",
              error: err?.message || "Video generation failed",
            });
          }
        })();

        return { jobId };
      }),

    /** Poll for video generation job status */
    videoJobStatus: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .query(({ input }) => {
        const job = videoJobs.get(input.jobId);
        if (!job) {
          return {
            status: "error" as const,
            progress: 0,
            step: "Job not found",
            segmentsDone: 0,
            segmentsTotal: 0,
            videoUrl: null,
            error: "Job not found or expired",
          };
        }
        return {
          status: job.status,
          progress: job.progress,
          step: job.step,
          segmentsDone: job.segmentsDone,
          segmentsTotal: job.segmentsTotal,
          videoUrl: job.videoUrl,
          error: job.error,
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

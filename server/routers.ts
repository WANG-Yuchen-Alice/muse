import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY ?? "";

const genai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

// ============================================================
// Lyria 3 Clip — text prompt only, 30s, 48kHz stereo
// ============================================================
async function generateWithLyria3(prompt: string): Promise<{ audioData: Buffer; caption: string }> {
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
    throw new Error("Lyria 3 did not return audio data");
  }

  return { audioData, caption };
}

// ============================================================
// MusicGen (Replicate) — melody-conditioned, audio input
// ============================================================
async function generateWithMusicGen(
  audioUrl: string,
  prompt: string,
  duration: number = 15
): Promise<{ audioUrl: string }> {
  // Create prediction
  const createRes = await axios.post(
    "https://api.replicate.com/v1/predictions",
    {
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043ac68f86b6588f3975a0eff4a1",
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

  // Poll for completion (max 120s)
  for (let i = 0; i < 60; i++) {
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
  throw new Error("MusicGen prediction timed out after 120s");
}

const STYLES = [
  {
    id: "lofi",
    name: "Lo-fi Chill",
    lyria_prompt:
      "Lo-fi chill hip hop beat with warm vinyl crackle, mellow piano chords, soft brushed drums, and a gentle bass line. Cozy rainy day atmosphere, mellow and deeply relaxing. Instrumental only, no vocals.",
    musicgen_prompt:
      "lo-fi chill hip hop beat, warm vinyl crackle, mellow piano, soft brushed drums, gentle bass, cozy rainy day, relaxing",
    color: "#FF6B9D",
  },
  {
    id: "cinematic",
    name: "Cinematic Epic",
    lyria_prompt:
      "Epic cinematic orchestral piece with soaring strings, powerful brass, and thundering timpani. Starts quiet with a solo melody, builds to a massive crescendo with full orchestra. Dramatic and emotional film score. Instrumental only, no vocals.",
    musicgen_prompt:
      "epic cinematic orchestral, soaring strings, powerful brass, thundering timpani, dramatic crescendo, emotional film score",
    color: "#00E5FF",
  },
  {
    id: "jazz",
    name: "Smooth Jazz",
    lyria_prompt:
      "Smooth jazz piece with a warm saxophone melody over gentle piano comping, walking bass line, and brushed drums. Relaxed swing feel, late-night jazz club atmosphere. Sophisticated and warm. Instrumental only, no vocals.",
    musicgen_prompt:
      "smooth jazz, warm saxophone melody, gentle piano, walking bass, brushed drums, relaxed swing, late-night jazz club",
    color: "#FFB800",
  },
  {
    id: "electronic",
    name: "Ambient Electronic",
    lyria_prompt:
      "Ambient electronic piece with dreamy synthesizers, atmospheric pads, subtle arpeggios, and ethereal textures. Floating deep space vibes, meditative and immersive. Instrumental only, no vocals.",
    musicgen_prompt:
      "ambient electronic, dreamy synthesizers, atmospheric pads, subtle arpeggios, ethereal textures, deep space, meditative",
    color: "#A78BFA",
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
      return STYLES.map((s) => ({ id: s.id, name: s.name, color: s.color }));
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

    /** Generate with Lyria 3 Clip (text prompt, no audio input) */
    generateLyria: publicProcedure
      .input(
        z.object({
          melodyDescription: z.string().optional(),
          styleId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        let fullPrompt = style.lyria_prompt;
        if (input.melodyDescription && input.melodyDescription.trim()) {
          fullPrompt = `${style.lyria_prompt} The melody should follow this pattern: ${input.melodyDescription}`;
        }

        const { audioData, caption } = await generateWithLyria3(fullPrompt);
        const key = `generated/lyria/${nanoid()}.mp3`;
        const { url } = await storagePut(key, audioData, "audio/mpeg");

        return {
          model: "lyria3" as const,
          styleId: style.id,
          styleName: style.name,
          color: style.color,
          audioUrl: url,
          caption,
        };
      }),

    /** Generate with MusicGen (melody-conditioned, needs audio URL) */
    generateMusicGen: publicProcedure
      .input(
        z.object({
          audioUrl: z.string(),
          styleId: z.string(),
          duration: z.number().min(8).max(30).default(15),
        })
      )
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        const result = await generateWithMusicGen(
          input.audioUrl,
          style.musicgen_prompt,
          input.duration
        );

        return {
          model: "musicgen" as const,
          styleId: style.id,
          styleName: style.name,
          color: style.color,
          audioUrl: result.audioUrl,
          caption: "",
        };
      }),

    /** Legacy generate route (kept for backward compat, uses Lyria 3) */
    generate: publicProcedure
      .input(
        z.object({
          melodyDescription: z.string().optional(),
          styleId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        let fullPrompt = style.lyria_prompt;
        if (input.melodyDescription && input.melodyDescription.trim()) {
          fullPrompt = `${style.lyria_prompt} The melody should follow this pattern: ${input.melodyDescription}`;
        }

        const { audioData, caption } = await generateWithLyria3(fullPrompt);
        const key = `generated/${nanoid()}.mp3`;
        const { url } = await storagePut(key, audioData, "audio/mpeg");

        return {
          styleId: style.id,
          styleName: style.name,
          color: style.color,
          audioUrl: url,
          caption,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

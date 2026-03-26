import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { GoogleGenAI } from "@google/genai";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

const genai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

/**
 * Generate music using Lyria 3 Clip (30s, 48kHz stereo)
 * Since Lyria 3 only accepts text prompts (no audio input),
 * we craft a detailed prompt combining the style with any melody description.
 */
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

const STYLES = [
  {
    id: "lofi",
    name: "Lo-fi Chill",
    prompt: "Lo-fi chill hip hop beat with warm vinyl crackle, mellow piano chords, soft brushed drums, and a gentle bass line. Cozy rainy day atmosphere, mellow and deeply relaxing. Instrumental only, no vocals.",
    color: "#FF6B9D",
  },
  {
    id: "cinematic",
    name: "Cinematic Epic",
    prompt: "Epic cinematic orchestral piece with soaring strings, powerful brass, and thundering timpani. Starts quiet with a solo melody, builds to a massive crescendo with full orchestra. Dramatic and emotional film score. Instrumental only, no vocals.",
    color: "#00E5FF",
  },
  {
    id: "jazz",
    name: "Smooth Jazz",
    prompt: "Smooth jazz piece with a warm saxophone melody over gentle piano comping, walking bass line, and brushed drums. Relaxed swing feel, late-night jazz club atmosphere. Sophisticated and warm. Instrumental only, no vocals.",
    color: "#FFB800",
  },
  {
    id: "electronic",
    name: "Ambient Electronic",
    prompt: "Ambient electronic piece with dreamy synthesizers, atmospheric pads, subtle arpeggios, and ethereal textures. Floating deep space vibes, meditative and immersive. Instrumental only, no vocals.",
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

    /** Upload recorded audio (base64) and return a URL */
    uploadAudio: publicProcedure
      .input(z.object({ audioBase64: z.string(), mimeType: z.string().default("audio/webm") }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.audioBase64, "base64");
        const ext = input.mimeType.includes("wav") ? "wav" : "webm";
        const key = `melodies/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    /** 
     * Generate music using Lyria 3 Clip.
     * Takes a melody description (extracted from user's hum/piano on the frontend)
     * and generates a 30-second track in the specified style.
     */
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

        // Build the prompt: combine style with melody description if provided
        let fullPrompt = style.prompt;
        if (input.melodyDescription && input.melodyDescription.trim()) {
          fullPrompt = `${style.prompt} The melody should follow this pattern: ${input.melodyDescription}`;
        }

        const { audioData, caption } = await generateWithLyria3(fullPrompt);

        // Upload the generated audio to S3
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

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY ?? "";
const MUSICGEN_VERSION = "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";

async function createReplicatePrediction(prompt: string, audioUrl: string, duration: number) {
  const resp = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: MUSICGEN_VERSION,
      input: {
        model_version: "stereo-melody-large",
        prompt,
        input_audio: audioUrl,
        duration,
        output_format: "mp3",
        classifier_free_guidance: 3,
        temperature: 1.0,
        top_k: 250,
        normalization_strategy: "loudness",
      },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Replicate create failed: ${resp.status} ${text}`);
  }
  return resp.json() as Promise<{ id: string; status: string }>;
}

async function pollPrediction(id: string, maxWaitMs = 120_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const resp = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
    });
    const data = await resp.json() as { status: string; output?: string; error?: string };
    if (data.status === "succeeded" && data.output) return data.output;
    if (data.status === "failed") throw new Error(`Generation failed: ${data.error}`);
    if (data.status === "canceled") throw new Error("Generation canceled");
  }
  throw new Error("Generation timed out");
}

const STYLES = [
  { id: "lofi", name: "Lo-fi Chill", prompt: "Lo-fi chill beats, warm piano, soft drums, vinyl crackle, cozy rainy day atmosphere, mellow and relaxing", color: "#FF6B9D" },
  { id: "cinematic", name: "Cinematic Epic", prompt: "Epic cinematic orchestral score, sweeping strings, brass fanfare, dramatic and emotional, film soundtrack quality", color: "#00E5FF" },
  { id: "jazz", name: "Smooth Jazz", prompt: "Smooth jazz, saxophone solo, upright bass, brushed drums, late night club vibes, sophisticated and warm", color: "#FFB800" },
  { id: "electronic", name: "Ambient Electronic", prompt: "Electronic ambient, dreamy synthesizers, atmospheric pads, ethereal and floating, deep space vibes", color: "#A78BFA" },
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

    /** Generate music from a melody URL in a specific style */
    generate: publicProcedure
      .input(
        z.object({
          audioUrl: z.string().url(),
          styleId: z.string(),
          duration: z.number().min(8).max(30).default(15),
        })
      )
      .mutation(async ({ input }) => {
        const style = STYLES.find((s) => s.id === input.styleId);
        if (!style) throw new Error(`Unknown style: ${input.styleId}`);

        const prediction = await createReplicatePrediction(
          style.prompt,
          input.audioUrl,
          input.duration
        );
        const outputUrl = await pollPrediction(prediction.id);
        return {
          styleId: style.id,
          styleName: style.name,
          color: style.color,
          audioUrl: outputUrl,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

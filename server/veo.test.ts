import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

describe("Veo Video Generation Prerequisites", () => {
  it("should have GOOGLE_AI_API_KEY configured", () => {
    expect(GOOGLE_AI_API_KEY).toBeTruthy();
    expect(GOOGLE_AI_API_KEY.length).toBeGreaterThan(10);
  });

  it("should be able to instantiate GoogleGenAI client", () => {
    const genai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
    expect(genai).toBeDefined();
    expect(genai.models).toBeDefined();
    expect(genai.operations).toBeDefined();
  });

  it("should have access to Veo model via API", async () => {
    // Verify the API key works by listing models and checking for veo
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_AI_API_KEY}`
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.models).toBeDefined();
    expect(Array.isArray(data.models)).toBe(true);
    // Check that at least one veo model is available
    const veoModels = data.models.filter((m: any) =>
      m.name?.toLowerCase().includes("veo")
    );
    expect(veoModels.length).toBeGreaterThan(0);
  });
});

describe("Video Scene Prompts", () => {
  const VIDEO_SCENE_PROMPTS: Record<string, string> = {
    lofi: "A cozy rainy evening seen through a rain-streaked window.",
    cinematic: "A breathtaking aerial shot sweeping over vast mountain ranges.",
    jazz: "A dimly lit jazz club at night.",
    electronic: "A futuristic neon-lit cityscape at night.",
    tiktok: "A vibrant, energetic scene with colorful confetti.",
    upbeat: "A bright sunny beach at golden hour.",
    rock: "A dramatic concert stage engulfed in smoke.",
    rnb: "A luxurious penthouse at night.",
    classical: "A grand concert hall with ornate golden ceiling.",
    edm: "A massive outdoor music festival at night.",
  };

  it("should have prompts for all 10 music styles", () => {
    const expectedStyles = [
      "lofi", "cinematic", "jazz", "electronic", "tiktok",
      "upbeat", "rock", "rnb", "classical", "edm",
    ];
    for (const style of expectedStyles) {
      expect(VIDEO_SCENE_PROMPTS[style]).toBeDefined();
      expect(VIDEO_SCENE_PROMPTS[style].length).toBeGreaterThan(20);
    }
  });

  it("each prompt should describe a visual scene (not a waveform)", () => {
    for (const [, prompt] of Object.entries(VIDEO_SCENE_PROMPTS)) {
      // Prompts should NOT mention waveforms, spectrum, or audio visualization
      expect(prompt.toLowerCase()).not.toContain("waveform");
      expect(prompt.toLowerCase()).not.toContain("spectrum");
      expect(prompt.toLowerCase()).not.toContain("visualization");
    }
  });
});

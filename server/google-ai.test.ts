import { describe, expect, it } from "vitest";

describe("Google AI API Key", () => {
  it("should have GOOGLE_AI_API_KEY set", () => {
    const key = process.env.GOOGLE_AI_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
    expect(key).toMatch(/^AIza/);
  });

  it("should be able to list models from Google AI API", async () => {
    const key = process.env.GOOGLE_AI_API_KEY;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.models).toBeDefined();
    expect(data.models.length).toBeGreaterThan(0);
    // Check that lyria model exists
    const modelIds = data.models.map((m: any) => m.name);
    const hasLyria = modelIds.some((id: string) => id.includes("lyria"));
    expect(hasLyria).toBe(true);
  });
});

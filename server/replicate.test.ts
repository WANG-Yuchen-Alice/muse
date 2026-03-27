import { describe, expect, it } from "vitest";

describe("Replicate API Key", () => {
  it("should be set in environment", () => {
    const key = process.env.REPLICATE_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it("should authenticate with Replicate API", async () => {
    const key = process.env.REPLICATE_API_KEY;
    const resp = await fetch("https://api.replicate.com/v1/account", {
      headers: { Authorization: `Bearer ${key}` },
    });
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty("username");
  }, 15000);
});

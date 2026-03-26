import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("music.getStyles", () => {
  it("returns 4 styles with id, name, and color", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const styles = await caller.music.getStyles();

    expect(styles).toHaveLength(4);
    for (const style of styles) {
      expect(style).toHaveProperty("id");
      expect(style).toHaveProperty("name");
      expect(style).toHaveProperty("color");
      expect(typeof style.id).toBe("string");
      expect(typeof style.name).toBe("string");
      expect(style.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("includes expected style IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const styles = await caller.music.getStyles();
    const ids = styles.map((s) => s.id);

    expect(ids).toContain("lofi");
    expect(ids).toContain("cinematic");
    expect(ids).toContain("jazz");
    expect(ids).toContain("electronic");
  });
});

describe("music.generateLyria", () => {
  it("rejects unknown style IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.music.generateLyria({
        styleId: "nonexistent",
        melodyDescription: "C4, D4, E4",
      })
    ).rejects.toThrow("Unknown style");
  });
});

describe("music.generateMusicGen", () => {
  it("rejects unknown style IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.music.generateMusicGen({
        audioUrl: "https://example.com/test.wav",
        styleId: "nonexistent",
        duration: 15,
      })
    ).rejects.toThrow("Unknown style");
  });

  it("validates duration range", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.music.generateMusicGen({
        audioUrl: "https://example.com/test.wav",
        styleId: "lofi",
        duration: 3, // below min of 8
      })
    ).rejects.toThrow();
  });
});

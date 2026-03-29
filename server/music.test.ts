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
  it("returns 10 styles with id, name, color, and emoji", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const styles = await caller.music.getStyles();

    expect(styles).toHaveLength(10);
    for (const style of styles) {
      expect(style).toHaveProperty("id");
      expect(style).toHaveProperty("name");
      expect(style).toHaveProperty("color");
      expect(style).toHaveProperty("emoji");
      expect(typeof style.id).toBe("string");
      expect(typeof style.name).toBe("string");
      expect(style.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof style.emoji).toBe("string");
    }
  });

  it("includes all expected style IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const styles = await caller.music.getStyles();
    const ids = styles.map((s) => s.id);

    expect(ids).toContain("lofi");
    expect(ids).toContain("cinematic");
    expect(ids).toContain("jazz");
    expect(ids).toContain("electronic");
    expect(ids).toContain("tiktok");
    expect(ids).toContain("upbeat");
    expect(ids).toContain("rock");
    expect(ids).toContain("rnb");
    expect(ids).toContain("classical");
    expect(ids).toContain("edm");
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

describe("music.generateStyleImages", () => {
  it("rejects unknown style IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.music.generateStyleImages({ styleId: "nonexistent", count: 1 })
    ).rejects.toThrow("Unknown style");
  });
});

describe("gallery.listSessions", () => {
  it("returns sessions array and total count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gallery.listSessions({ limit: 10, offset: 0 });

    expect(result).toHaveProperty("sessions");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.sessions)).toBe(true);
    expect(typeof result.total).toBe("number");
  });
});

describe("gallery.getSession", () => {
  it("rejects non-existent session", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.gallery.getSession({ sessionId: 999999 })
    ).rejects.toThrow("Session not found");
  });
});

describe("gallery.listTracks", () => {
  it("returns tracks array and total count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gallery.listTracks({ limit: 10, offset: 0 });

    expect(result).toHaveProperty("tracks");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.tracks)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("accepts optional styleId filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gallery.listTracks({ styleId: "lofi", limit: 10, offset: 0 });

    expect(result).toHaveProperty("tracks");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.tracks)).toBe(true);
  });
});

describe("music.generateVideo", () => {
  it("returns a jobId immediately (background job pattern)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // This should return immediately with a jobId (not block for minutes)
    const result = await caller.music.generateVideo({
      audioUrl: "https://example.com/nonexistent-audio.mp3",
      styleId: "lofi",
      trackName: "Test Track",
    });

    expect(result).toHaveProperty("jobId");
    expect(typeof result.jobId).toBe("string");
    expect(result.jobId.length).toBeGreaterThan(0);
  });
});

describe("music.videoJobStatus", () => {
  it("returns error status for non-existent job", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.music.videoJobStatus({ jobId: "nonexistent-job-id" });

    expect(result).toHaveProperty("status");
    expect(result.status).toBe("error");
    expect(result.error).toContain("not found");
    expect(result.videoUrl).toBeNull();
  });

  it("returns valid status for a real job", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Start a job first
    const { jobId } = await caller.music.generateVideo({
      audioUrl: "https://example.com/nonexistent-audio.mp3",
      styleId: "cinematic",
      trackName: "Status Test",
    });

    // Immediately check status — should be pending or analyzing
    const status = await caller.music.videoJobStatus({ jobId });

    expect(status).toHaveProperty("status");
    expect(status).toHaveProperty("progress");
    expect(status).toHaveProperty("step");
    expect(status).toHaveProperty("segmentsDone");
    expect(status).toHaveProperty("segmentsTotal");
    expect(typeof status.progress).toBe("number");
    expect(typeof status.step).toBe("string");
    // Job should be in an early state
    expect(["pending", "analyzing", "prompting", "generating", "error"]).toContain(status.status);
  });
});

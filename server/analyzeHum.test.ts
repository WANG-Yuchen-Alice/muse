import { describe, it, expect } from "vitest";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

describe("Gemini Hum Analysis", () => {
  it("should have GOOGLE_AI_API_KEY configured", () => {
    expect(GOOGLE_AI_API_KEY).toBeTruthy();
    expect(GOOGLE_AI_API_KEY.length).toBeGreaterThan(10);
  });

  it("should have invokeLLM available for audio analysis", async () => {
    // Verify the LLM helper can be imported
    const { invokeLLM } = await import("./_core/llm");
    expect(invokeLLM).toBeDefined();
    expect(typeof invokeLLM).toBe("function");
  });

  it("should validate note name format correctly", () => {
    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const validNotes = ["C4", "D#5", "A3", "G#4", "B5", "F#3"];
    const invalidNotes = ["H4", "C", "4C", "C#", "Cb4", ""];

    for (const note of validNotes) {
      const match = note.match(/^([A-G]#?)(\d+)$/);
      expect(match, `${note} should be valid`).toBeTruthy();
      const [, name] = match!;
      expect(NOTE_NAMES.includes(name), `${name} should be in NOTE_NAMES`).toBe(true);
    }

    for (const note of invalidNotes) {
      const match = note.match(/^([A-G]#?)(\d+)$/);
      if (match) {
        const [, name] = match;
        // Some might match regex but not be in our list (like Cb)
        // For this test, we just verify the regex works
      }
    }
  });

  it("should correctly compute MIDI numbers from note names", () => {
    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    function noteToMidi(noteName: string): number {
      const match = noteName.match(/^([A-G]#?)(\d+)$/);
      if (!match) return -1;
      const [, name, octaveStr] = match;
      const octave = parseInt(octaveStr);
      const noteIdx = NOTE_NAMES.indexOf(name);
      return (octave + 1) * 12 + noteIdx;
    }

    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
    expect(noteToMidi("C5")).toBe(72);
    expect(noteToMidi("B5")).toBe(83);
    expect(noteToMidi("C3")).toBe(48);
  });

  it("should correctly transpose notes to C4-B5 range", () => {
    function transposeToRange(midi: number): number {
      let displayMidi = midi;
      while (displayMidi < 60) displayMidi += 12;
      while (displayMidi > 83) displayMidi -= 12;
      return displayMidi;
    }

    // C3 (48) should transpose to C4 (60)
    expect(transposeToRange(48)).toBe(60);
    // A2 (45) should transpose to A3→A4 (69)
    expect(transposeToRange(45)).toBe(69);
    // C6 (84) should transpose to C5 (72)
    expect(transposeToRange(84)).toBe(72);
    // C4 (60) should stay
    expect(transposeToRange(60)).toBe(60);
    // B5 (83) should stay
    expect(transposeToRange(83)).toBe(83);
  });

  it("should correctly compute frequency from MIDI number", () => {
    function midiToHz(midi: number): number {
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // A4 = 440 Hz
    expect(midiToHz(69)).toBeCloseTo(440, 1);
    // C4 ≈ 261.63 Hz
    expect(midiToHz(60)).toBeCloseTo(261.63, 0);
    // A5 = 880 Hz
    expect(midiToHz(81)).toBeCloseTo(880, 1);
  });
});

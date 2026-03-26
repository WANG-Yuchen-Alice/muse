/**
 * Style-specific canvas animations for each music genre.
 * Each animation responds to audio playback state.
 */
import { useRef, useEffect, useCallback } from "react";

type AnimationProps = {
  isPlaying: boolean;
  color: string;
  styleId: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  width?: number;
  height?: number;
};

export default function StyleAnimation({
  isPlaying,
  color,
  styleId,
  canvasRef: externalRef,
  width = 400,
  height = 240,
}: AnimationProps) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalRef ?? internalRef;
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      switch (styleId) {
        case "lofi":
          drawLofi(ctx, w, h, t, color);
          break;
        case "cinematic":
          drawCinematic(ctx, w, h, t, color);
          break;
        case "jazz":
          drawJazz(ctx, w, h, t, color);
          break;
        case "electronic":
          drawElectronic(ctx, w, h, t, color);
          break;
        default:
          drawLofi(ctx, w, h, t, color);
      }
    },
    [styleId, color]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    let lastTime = 0;

    const animate = (timestamp: number) => {
      const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      lastTime = timestamp;

      if (isPlaying) {
        timeRef.current += dt;
      }

      draw(ctx, width, height, timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, draw, canvasRef, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ aspectRatio: `${width}/${height}` }}
    />
  );
}

// ============================================================
// Lo-fi Chill — Rain drops on a window, soft warm glow
// ============================================================
function drawLofi(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  // Dark warm background
  ctx.fillStyle = "#1a1118";
  ctx.fillRect(0, 0, w, h);

  // Warm gradient glow at bottom
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.8, 0, w * 0.5, h * 0.8, w * 0.6);
  glow.addColorStop(0, `${color}18`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Rain drops
  ctx.strokeStyle = `${color}30`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const seed = i * 137.5;
    const x = ((seed * 7.3 + t * 20 * (0.5 + (i % 3) * 0.3)) % (w + 40)) - 20;
    const y = ((seed * 3.1 + t * 80 * (0.5 + (i % 4) * 0.2)) % (h + 60)) - 30;
    const len = 8 + (i % 5) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + len);
    ctx.stroke();
  }

  // Vinyl crackle dots
  for (let i = 0; i < 8; i++) {
    const x = (Math.sin(t * 2 + i * 4.7) * 0.5 + 0.5) * w;
    const y = (Math.cos(t * 1.5 + i * 3.2) * 0.5 + 0.5) * h;
    const alpha = Math.sin(t * 8 + i * 2) * 0.3 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft horizontal waveform
  ctx.strokeStyle = `${color}60`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x += 2) {
    const y = h * 0.5 + Math.sin(x * 0.02 + t * 1.5) * 15 + Math.sin(x * 0.05 + t * 2.3) * 8;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ============================================================
// Cinematic Epic — Particle explosion with streaks
// ============================================================
function drawCinematic(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  // Deep dark background with slight blue
  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(0, 0, w, h);

  // Central bright glow
  const intensity = 0.5 + Math.sin(t * 0.5) * 0.3;
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.5);
  glow.addColorStop(0, `${color}${Math.round(intensity * 30).toString(16).padStart(2, "0")}`);
  glow.addColorStop(0.5, `${color}08`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Particle streaks radiating from center
  const cx = w * 0.5;
  const cy = h * 0.5;
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 + t * 0.1;
    const speed = 0.3 + (i % 5) * 0.15;
    const dist = ((t * speed * 60 + i * 17) % (w * 0.6));
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const alpha = Math.max(0, 1 - dist / (w * 0.6));
    const size = 1 + alpha * 2;

    ctx.fillStyle = `${color}${Math.round(alpha * 180).toString(16).padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Streak tail
    const tailLen = 8 + alpha * 12;
    ctx.strokeStyle = `${color}${Math.round(alpha * 60).toString(16).padStart(2, "0")}`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(angle) * tailLen, y - Math.sin(angle) * tailLen);
    ctx.stroke();
  }

  // Horizontal light bars (crescendo effect)
  const barAlpha = Math.sin(t * 0.3) * 0.15 + 0.1;
  ctx.fillStyle = `${color}${Math.round(barAlpha * 255).toString(16).padStart(2, "0")}`;
  for (let i = 0; i < 3; i++) {
    const barY = h * (0.3 + i * 0.2) + Math.sin(t + i) * 10;
    ctx.fillRect(0, barY, w, 1);
  }
}

// ============================================================
// Smooth Jazz — Floating circles, saxophone wave
// ============================================================
function drawJazz(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  // Dark warm brown background
  ctx.fillStyle = "#141008";
  ctx.fillRect(0, 0, w, h);

  // Warm spotlight
  const spot = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.5);
  spot.addColorStop(0, `${color}15`);
  spot.addColorStop(1, "transparent");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, w, h);

  // Floating bubbles / smoke rings
  for (let i = 0; i < 12; i++) {
    const bx = w * (0.15 + (i % 4) * 0.22) + Math.sin(t * 0.4 + i * 1.7) * 20;
    const by = h * (0.2 + Math.floor(i / 4) * 0.25) + Math.cos(t * 0.3 + i * 2.1) * 15;
    const radius = 15 + Math.sin(t * 0.6 + i) * 8;
    const alpha = 0.08 + Math.sin(t * 0.5 + i * 0.8) * 0.05;

    ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Saxophone-like smooth wave
  ctx.strokeStyle = `${color}80`;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let x = 0; x < w; x += 2) {
    const y =
      h * 0.65 +
      Math.sin(x * 0.015 + t * 1.2) * 20 +
      Math.sin(x * 0.04 + t * 2.5) * 8 +
      Math.sin(x * 0.008 + t * 0.5) * 12;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Second thinner wave
  ctx.strokeStyle = `${color}40`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < w; x += 2) {
    const y =
      h * 0.7 +
      Math.sin(x * 0.012 + t * 0.9 + 1) * 15 +
      Math.sin(x * 0.035 + t * 1.8 + 2) * 6;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ============================================================
// Ambient Electronic — Grid, floating orbs, aurora
// ============================================================
function drawElectronic(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string) {
  // Very dark background
  ctx.fillStyle = "#08060f";
  ctx.fillRect(0, 0, w, h);

  // Perspective grid
  ctx.strokeStyle = `${color}12`;
  ctx.lineWidth = 0.5;
  const gridSpacing = 30;
  const vanishY = h * 0.35;

  // Horizontal lines with perspective
  for (let i = 0; i < 12; i++) {
    const rawY = vanishY + i * gridSpacing * (1 + i * 0.1);
    if (rawY > h) break;
    ctx.beginPath();
    ctx.moveTo(0, rawY);
    ctx.lineTo(w, rawY);
    ctx.stroke();
  }

  // Vertical lines converging
  for (let i = -6; i <= 6; i++) {
    const topX = w * 0.5 + i * 8;
    const botX = w * 0.5 + i * w * 0.12;
    ctx.beginPath();
    ctx.moveTo(topX, vanishY);
    ctx.lineTo(botX, h);
    ctx.stroke();
  }

  // Aurora waves at top
  for (let wave = 0; wave < 3; wave++) {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.3, `${color}${Math.round((0.15 - wave * 0.03) * 255).toString(16).padStart(2, "0")}`);
    gradient.addColorStop(0.7, `${color}${Math.round((0.1 - wave * 0.02) * 255).toString(16).padStart(2, "0")}`);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= w; x += 3) {
      const y =
        h * (0.15 + wave * 0.06) +
        Math.sin(x * 0.008 + t * (0.4 + wave * 0.15) + wave * 2) * 25 +
        Math.sin(x * 0.015 + t * (0.7 + wave * 0.1)) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Floating orbs
  for (let i = 0; i < 8; i++) {
    const ox = (Math.sin(t * 0.2 + i * 2.5) * 0.4 + 0.5) * w;
    const oy = (Math.cos(t * 0.15 + i * 1.8) * 0.3 + 0.35) * h;
    const radius = 3 + Math.sin(t * 0.8 + i * 1.3) * 2;
    const alpha = 0.3 + Math.sin(t * 0.6 + i) * 0.2;

    const orbGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 4);
    orbGlow.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
    orbGlow.addColorStop(1, "transparent");
    ctx.fillStyle = orbGlow;
    ctx.fillRect(ox - radius * 4, oy - radius * 4, radius * 8, radius * 8);

    ctx.fillStyle = `${color}${Math.round(alpha * 1.5 * 255).toString(16).padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

import { useState, useEffect, useCallback, useRef } from "react";
import { Rocket, Plane } from "lucide-react";

type GameState = "waiting" | "running" | "crashed";

interface MultiplierDisplayProps {
  gameState: GameState;
  multiplier: number;
  crashPoint: number;
}

const MultiplierDisplay = ({ gameState, multiplier, crashPoint }: MultiplierDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jetPosRef = useRef<{ x: number; y: number; angle: number }>({ x: 0, y: 0, angle: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "hsla(220, 14%, 25%, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = h - (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 1; i < 6; i++) {
      const x = (w / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    if (gameState === "waiting") {
      jetPosRef.current = { x: 0, y: 0, angle: 0 };
      return;
    }

    // Calculate curve points
    const progress = Math.min((multiplier - 1) / 9, 1);
    const numPoints = Math.max(2, Math.floor(progress * 100));
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * w * 0.9 + w * 0.05;
      const yNorm = Math.pow(t, 1.5) * progress;
      const y = h - yNorm * h * 0.85 - h * 0.05;
      points.push({ x, y });
    }

    // Draw curve
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.strokeStyle = gameState === "crashed" ? "hsl(0, 75%, 55%)" : "hsl(25, 95%, 55%)";
      ctx.lineWidth = 3;
      ctx.shadowColor = gameState === "crashed" ? "hsl(0, 75%, 55%)" : "hsl(25, 95%, 55%)";
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill area under curve
      ctx.lineTo(points[points.length - 1].x, h);
      ctx.lineTo(points[0].x, h);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (gameState === "crashed") {
        fillGrad.addColorStop(0, "hsla(0, 75%, 55%, 0.15)");
        fillGrad.addColorStop(1, "hsla(0, 75%, 55%, 0.02)");
      } else {
        fillGrad.addColorStop(0, "hsla(25, 95%, 55%, 0.15)");
        fillGrad.addColorStop(1, "hsla(25, 95%, 55%, 0.02)");
      }
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Draw jet at the end of the curve
      const lastPt = points[points.length - 1];
      const prevPt = points[Math.max(0, points.length - 2)];
      const angle = Math.atan2(prevPt.y - lastPt.y, lastPt.x - prevPt.x);

      jetPosRef.current = { x: lastPt.x, y: lastPt.y, angle };

      // Draw jet icon
      ctx.save();
      ctx.translate(lastPt.x, lastPt.y);
      ctx.rotate(-angle);

      // Jet trail/exhaust
      if (gameState === "running") {
        const trailGrad = ctx.createLinearGradient(-30, 0, 0, 0);
        trailGrad.addColorStop(0, "hsla(25, 95%, 55%, 0)");
        trailGrad.addColorStop(1, "hsla(25, 95%, 55%, 0.6)");
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-5, 0);
        ctx.stroke();
      }

      // Jet body
      const jetColor = gameState === "crashed" ? "hsl(0, 75%, 55%)" : "hsl(25, 95%, 55%)";
      ctx.fillStyle = jetColor;
      ctx.shadowColor = jetColor;
      ctx.shadowBlur = 12;

      // Simple jet shape
      ctx.beginPath();
      ctx.moveTo(12, 0);        // nose
      ctx.lineTo(-6, -7);       // top wing
      ctx.lineTo(-3, 0);        // body indent
      ctx.lineTo(-6, 7);        // bottom wing
      ctx.closePath();
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-10, -5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Glow dot at nose
      ctx.beginPath();
      ctx.arc(12, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = gameState === "crashed" ? "hsl(0, 85%, 70%)" : "hsl(42, 90%, 65%)";
      ctx.fill();

      ctx.restore();
    }
  }, [gameState, multiplier]);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center rounded-xl bg-card border border-border overflow-hidden gradient-game">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2">
        {gameState === "waiting" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center animate-pulse-glow">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              Waiting for next round…
            </p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {gameState === "running" && (
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-5xl md:text-6xl font-black text-primary animate-count tracking-tight">
              {multiplier.toFixed(2)}x
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Current Multiplier
            </span>
          </div>
        )}

        {gameState === "crashed" && (
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-5xl md:text-6xl font-black text-gaming-red animate-count tracking-tight">
              {crashPoint.toFixed(2)}x
            </span>
            <span className="text-xs text-gaming-red font-semibold uppercase tracking-widest mt-1">
              Crashed!
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 backdrop-blur-sm border border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-gaming-green" />
        <span className="text-[9px] text-muted-foreground font-mono">SHA-256</span>
      </div>
    </div>
  );
};

export default MultiplierDisplay;

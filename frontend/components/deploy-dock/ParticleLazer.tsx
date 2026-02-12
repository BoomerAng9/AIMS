// frontend/components/deploy-dock/ParticleLazer.tsx
"use client";

import { useEffect, useRef } from "react";

interface ParticleLazerProps {
  isActive: boolean;
}

/** Animated particle beam overlay shown during agent hatching / deployment. */
export function ParticleLazer({ isActive }: ParticleLazerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const BEAM_Y = canvas.height * 0.15;

    function spawnParticle() {
      const spread = 40;
      particles.push({
        x: Math.random() * canvas!.width,
        y: BEAM_Y + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 0.5,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: Math.random() * 2.5 + 0.5,
        hue: 38 + Math.random() * 20, // gold range
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isActive) {
        // Spawn burst of particles each frame
        for (let i = 0; i < 6; i++) spawnParticle();

        // Horizontal beam glow
        const grad = ctx.createLinearGradient(0, BEAM_Y - 4, 0, BEAM_Y + 4);
        grad.addColorStop(0, "rgba(255,200,50,0)");
        grad.addColorStop(0.5, "rgba(255,200,50,0.35)");
        grad.addColorStop(1, "rgba(255,200,50,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, BEAM_Y - 4, canvas.width, 8);
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},90%,60%,${alpha})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isActive]);

  if (!isActive && !canvasRef.current) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ opacity: isActive ? 1 : 0, transition: "opacity 0.6s ease-out" }}
    />
  );
}

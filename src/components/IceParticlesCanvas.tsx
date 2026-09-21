import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  fadeSpeed: number;
  angle: number;
  spinSpeed: number;
  type: 'hex' | 'cube' | 'circle';
}

export const IceParticlesCanvas: React.FC<{ density?: number; className?: string }> = ({
  density = 35,
  className = 'pointer-events-none absolute inset-0 z-0',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate ice particles
    const particles: Particle[] = [];
    const types: ('hex' | 'cube' | 'circle')[] = ['hex', 'cube', 'circle'];

    for (let i = 0; i < density; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 1.5,
        speedY: -(Math.random() * 0.35 + 0.15), // drifting slowly upward like cold sublimation mist
        speedX: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.5 + 0.2,
        fadeSpeed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.015,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }

    const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = x + r * Math.cos(a);
        const hy = y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    };

    const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => {
      ctx.beginPath();
      ctx.rect(x - s / 2, y - s / 2, s, s);
      ctx.closePath();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.spinSpeed;

        // Oscillate opacity
        p.opacity += p.fadeSpeed;
        if (p.opacity > 0.75 || p.opacity < 0.1) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        // Wrap around
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = `rgba(182, 230, 245, ${p.opacity * 0.85})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.95})`;
        ctx.lineWidth = 0.75;

        if (p.type === 'hex') {
          drawHexagon(ctx, 0, 0, p.size);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'cube') {
          drawCube(ctx, 0, 0, p.size * 1.2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={className} />;
};

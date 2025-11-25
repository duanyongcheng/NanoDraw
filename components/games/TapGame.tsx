import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface Orb {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const TapGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const orbsRef = useRef<Orb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);

  const spawnOrb = useCallback((width: number) => {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const colors = ['#60a5fa', '#a78bfa', '#34d399', '#f472b6']; // blue, purple, green, pink
    
    orbsRef.current.push({
      id: nextIdRef.current++,
      x,
      y: -radius,
      radius,
      speed: 2 + Math.random() * 2, // Falling speed
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }, []);

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2 + Math.random() * 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color
      });
    }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Update & Draw Orbs
    orbsRef.current.forEach(orb => {
      orb.y += orb.speed;

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = orb.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Remove orbs below screen
    orbsRef.current = orbsRef.current.filter(orb => orb.y - orb.radius < height);

    // Update & Draw Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 300; // Fixed height
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      // Spawn logic
      if (time - lastSpawnTimeRef.current > 800) { // Spawn every 800ms
        spawnOrb(canvas.width);
        lastSpawnTimeRef.current = time;
      }

      draw(ctx, canvas.width, canvas.height);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [draw, spawnOrb]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let hit = false;
    
    // Check hits (reverse iteration to hit top-most first)
    for (let i = orbsRef.current.length - 1; i >= 0; i--) {
      const orb = orbsRef.current[i];
      const dist = Math.sqrt(Math.pow(x - orb.x, 2) + Math.pow(y - orb.y, 2));
      
      if (dist < orb.radius + 10) { // +10 grace area
        // Hit!
        createExplosion(orb.x, orb.y, orb.color);
        orbsRef.current.splice(i, 1);
        setScore(s => {
             const newScore = s + 10;
             setHighScore(h => Math.max(h, newScore));
             return newScore;
        });
        hit = true;
        break; // Only hit one at a time
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full">
       <div className="absolute top-2 left-4 text-xs font-mono text-blue-400 z-10 pointer-events-none">SCORE: {score}</div>
       <div className="absolute top-2 right-4 text-xs font-mono text-yellow-500 z-10 pointer-events-none">HI: {highScore}</div>

      <canvas
        ref={canvasRef}
        className="rounded-lg border border-gray-700 bg-gray-900 shadow-2xl shadow-purple-500/10 w-full touch-none cursor-crosshair"
        onMouseDown={handleTap}
        onTouchStart={handleTap}
      />
      
      <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
        Tap falling orbs to collect energy
      </div>
    </div>
  );
};

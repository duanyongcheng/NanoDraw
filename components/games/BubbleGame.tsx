import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  wobbleOffset: number;
}

export const BubbleGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const bubblesRef = useRef<Bubble[]>([]);
  const frameRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);

  const spawnBubble = useCallback((width: number, height: number) => {
    const radius = 20 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    // Pastel colors for Light Mode
    const colors = ['rgba(147, 197, 253, 0.6)', 'rgba(167, 139, 250, 0.6)', 'rgba(52, 211, 153, 0.6)', 'rgba(244, 114, 182, 0.6)'];
    
    bubblesRef.current.push({
      id: nextIdRef.current++,
      x,
      y: height + radius, // Start below screen
      radius,
      speed: 1 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      wobbleOffset: Math.random() * Math.PI * 2
    });
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Clear - Light Blue Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e0f2fe'); // sky-100
    gradient.addColorStop(1, '#f0f9ff'); // sky-50
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Bubbles
    bubblesRef.current.forEach(b => {
      // Wobble effect
      const wobble = Math.sin(time * 0.005 + b.wobbleOffset) * 20;
      b.y -= b.speed;
      const currentX = b.x + wobble;

      ctx.beginPath();
      ctx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      
      // Bubble Shine
      ctx.beginPath();
      ctx.arc(currentX - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Remove bubbles above screen
    bubblesRef.current = bubblesRef.current.filter(b => b.y + b.radius > -50);

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 300;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      if (time - lastSpawnTimeRef.current > 1000) {
        spawnBubble(canvas.width, canvas.height);
        lastSpawnTimeRef.current = time;
      }

      draw(ctx, canvas.width, canvas.height, time);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [draw, spawnBubble]);

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

    // Check hits
    // Since bubbles wobble, we need to estimate or store currentX. 
    // For simplicity, we ignore wobble in hit detection or just add margin.
    // Ideally we store rendered position, but this is a simple game.
    // Let's iterate and check distance with a slightly larger radius.
    
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      // Note: This hit detection is imperfect due to wobble being calculated in draw loop only.
      // But for small wobbles it's acceptable.
      const dist = Math.sqrt(Math.pow(x - b.x, 2) + Math.pow(y - b.y, 2));
      
      if (dist < b.radius + 20) { 
        // Pop!
        bubblesRef.current.splice(i, 1);
        setScore(s => {
             const newScore = s + 5;
             setHighScore(h => Math.max(h, newScore));
             return newScore;
        });
        // Could play a pop sound here
        break; 
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full">
       <div className="absolute top-2 left-4 text-xs font-mono text-blue-600 font-bold z-10 pointer-events-none">SCORE: {score}</div>
       <div className="absolute top-2 right-4 text-xs font-mono text-purple-600 font-bold z-10 pointer-events-none">HI: {highScore}</div>

      <canvas
        ref={canvasRef}
        className="rounded-lg border border-blue-100 bg-sky-50 shadow-sm w-full touch-none cursor-pointer"
        onMouseDown={handleTap}
        onTouchStart={handleTap}
      />
      
      <div className="mt-2 text-[10px] text-gray-500 font-mono">
        Tap bubbles to pop them!
      </div>
    </div>
  );
};

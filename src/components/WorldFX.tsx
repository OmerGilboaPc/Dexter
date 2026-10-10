import React, { useEffect, useRef } from 'react';

/** Ambient canvas effects that give each series its own "world". */
export function WorldFX({ effect, intensity = 1, style }: { effect: 'snow' | 'rain' | 'vhs' | 'heat' | 'ice' | 'embers' | string; intensity?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    let w = 0,
      h = 0,
      raf = 0,
      t = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const N = Math.round((effect === 'rain' ? 160 : effect === 'snow' || effect === 'ice' ? 140 : 60) * intensity);
    const parts = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), s: Math.random(), o: Math.random() }));
    const visible = { on: true };
    const io = new IntersectionObserver(([e]) => (visible.on = e.isIntersecting));
    io.observe(c);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible.on) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);
      if (effect === 'snow' || effect === 'ice') {
        for (const p of parts) {
          p.y += (0.0006 + p.z * 0.0016) * (effect === 'ice' ? 0.5 : 1);
          p.x += Math.sin(t * 0.01 + p.s * 10) * 0.0004;
          if (p.y > 1.02) {
            p.y = -0.02;
            p.x = Math.random();
          }
          const r = 0.6 + p.z * 2.4;
          ctx.beginPath();
          ctx.fillStyle = effect === 'ice' ? `rgba(190,230,255,${0.25 + p.z * 0.5})` : `rgba(255,255,255,${0.25 + p.z * 0.6})`;
          ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (effect === 'rain') {
        ctx.strokeStyle = 'rgba(180,200,230,0.28)';
        ctx.lineWidth = 1;
        for (const p of parts) {
          p.y += 0.012 + p.z * 0.02;
          p.x -= 0.002;
          if (p.y > 1.05) {
            p.y = -0.05;
            p.x = Math.random() * 1.1;
          }
          const len = 10 + p.z * 22;
          ctx.globalAlpha = 0.3 + p.z * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x * w, p.y * h);
          ctx.lineTo(p.x * w + len * 0.18, p.y * h - len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (effect === 'vhs') {
        // scanlines + rolling bar + neon specks
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
        const barY = ((t * 1.4) % (h + 120)) - 120;
        const g = ctx.createLinearGradient(0, barY, 0, barY + 120);
        g.addColorStop(0, 'rgba(255,45,111,0)');
        g.addColorStop(0.5, 'rgba(255,45,111,0.07)');
        g.addColorStop(1, 'rgba(33,230,193,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, barY, w, 120);
        for (const p of parts) {
          if (Math.random() < 0.02) {
            p.x = Math.random();
            p.y = Math.random();
          }
          ctx.fillStyle = p.s > 0.5 ? 'rgba(255,45,111,0.5)' : 'rgba(33,230,193,0.45)';
          ctx.fillRect(p.x * w, p.y * h, 1 + p.z * 2, 1);
        }
      } else {
        // heat / embers: slow rising warm motes
        for (const p of parts) {
          p.y -= 0.0005 + p.z * 0.0012;
          p.x += Math.sin(t * 0.008 + p.s * 20) * 0.0005;
          if (p.y < -0.02) {
            p.y = 1.02;
            p.x = Math.random();
          }
          const r = 0.8 + p.z * 2.2;
          const a = (0.15 + p.z * 0.45) * (0.6 + 0.4 * Math.sin(t * 0.03 + p.o * 6));
          ctx.beginPath();
          ctx.fillStyle = effect === 'embers' ? `rgba(255,70,60,${a})` : `rgba(255,${150 + Math.round(p.s * 60)},80,${a})`;
          ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [effect, intensity]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }} />;
}

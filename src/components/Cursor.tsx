import React, { useEffect, useRef, useState } from 'react';
import { sfx } from '../lib/sound';

const INTERACTIVE = 'a, button, [role="button"], .chip, .card.hover, input[type="range"], select, label, .slide-hit';

/** Custom cursor: a blood-red dot with a trailing ring that turns into a blade over interactive elements. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.body.classList.add('custom-cursor');
    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100,
      raf = 0;
    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      setVisible(true);
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`;
      const el = e.target as HTMLElement;
      const isHover = !!el?.closest?.(INTERACTIVE);
      setHover((h) => {
        if (isHover && !h) sfx.hover();
        return isHover;
      });
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    const leave = () => setVisible(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', dn);
    window.addEventListener('pointerup', up);
    document.addEventListener('mouseleave', leave);
    raf = requestAnimationFrame(loop);
    return () => {
      document.body.classList.remove('custom-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', dn);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" style={{ opacity: visible ? 1 : 0 }} />
      <div ref={ring} className={`cursor-ring ${hover ? 'hover' : ''} ${down ? 'down' : ''}`} style={{ opacity: visible ? 1 : 0 }}>
        <svg className="cursor-blade" viewBox="0 0 24 24" fill="none">
          <path d="M3 21 L14 10 L19 3 L21 5 L14 10" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 21 L7 17" stroke="var(--blood-bright)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}

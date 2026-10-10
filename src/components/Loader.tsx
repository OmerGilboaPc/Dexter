import React from 'react';
import { motion } from 'framer-motion';

export function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <motion.div className="loader" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg className="drop" viewBox="0 0 46 64">
          <defs>
            <clipPath id="dropclip">
              <path d="M23 2 C23 2 4 28 4 41 a19 19 0 0 0 38 0 C42 28 23 2 23 2z" />
            </clipPath>
          </defs>
          <path d="M23 2 C23 2 4 28 4 41 a19 19 0 0 0 38 0 C42 28 23 2 23 2z" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
          <g clipPath="url(#dropclip)">
            <rect x="0" width="46" height="64" fill="#d90f1e">
              <animate attributeName="y" values="64;10;64" dur="2.4s" repeatCount="indefinite" />
            </rect>
          </g>
        </svg>
        <svg className="ecg" viewBox="0 0 260 60">
          <path d="M0 30 H80 L92 30 L100 8 L110 52 L120 18 L128 30 H260" />
        </svg>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.4em', color: 'var(--muted)', marginTop: 14, textTransform: 'uppercase' }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

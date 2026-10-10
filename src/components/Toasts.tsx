import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toastStore, useStore } from '../lib/bus';

export function Toasts() {
  const toasts = useStore(toastStore);
  return (
    <div className="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast glass ${t.kind || ''}`}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.icon || t.kind === 'achievement' ? <div className="t-icon">{t.icon || '🏆'}</div> : null}
            <div style={{ flex: 1 }}>
              {t.kind === 'achievement' && <div className="kicker" style={{ fontSize: 10, marginBottom: 2 }}>Achievement Unlocked</div>}
              <b>{t.title}</b>
              {t.text && <small>{t.text}</small>}
            </div>
            {t.action && (
              <button className="btn btn-xs" onClick={t.action.run}>
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

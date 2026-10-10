import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useStore } from '../lib/bus';
import { styleTarget, stylePreview, TextStyle } from '../lib/styles';
import { cx } from '../lib/util';
import { toast } from '../lib/bus';

/** Edit Mode only: a 🎨 button that follows the hovered text, and a floating panel to style it. */
export function StyleEditor() {
  const { editMode } = useCms();
  const target = useStore(styleTarget);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!editMode) styleTarget.set(null);
  }, [editMode]);

  useEffect(() => {
    if (!target?.el || target.open) return;
    const upd = () => setRect(target.el!.getBoundingClientRect());
    upd();
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    return () => {
      window.removeEventListener('scroll', upd);
      window.removeEventListener('resize', upd);
    };
  }, [target]);

  if (!editMode || !target) return null;
  return createPortal(
    <>
      {!target.open && rect && (
        <button
          className="btn btn-xs"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => styleTarget.set({ ...target, open: true })}
          style={{ position: 'fixed', left: Math.max(6, rect.right - 70), top: Math.max(6, rect.top - 30), zIndex: 9000, background: 'var(--gold)', color: '#111', borderColor: 'var(--gold)', boxShadow: '0 8px 20px rgba(0,0,0,.5)' }}
        >
          🎨 Style
        </button>
      )}
      {target.open && <StylePanel k={target.key} label={target.label} onClose={() => styleTarget.set(null)} />}
    </>,
    document.body,
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="label" style={{ marginBottom: 4, fontSize: 10.5 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Slider({ value, min, max, step, unit, onChange }: { value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="row" style={{ flexWrap: 'nowrap', gap: 10 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <input className="input" type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} style={{ width: 76, padding: '6px 8px', fontSize: 13 }} />
      {unit && <span className="muted" style={{ fontSize: 11, width: 22 }}>{unit}</span>}
    </div>
  );
}

function StylePanel({ k, label, onClose }: { k: string; label: string; onClose: () => void }) {
  const { styles, saveStyle } = useCms();
  const drag = useDragControls();
  const [s, setS] = useState<TextStyle>(() => ({ ...(styles[k] || {}) }));
  const set = (patch: Partial<TextStyle>) => {
    const next = { ...s, ...patch };
    setS(next);
    stylePreview.set((p) => ({ ...p, [k]: next }));
  };
  const close = () => {
    stylePreview.set((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
    onClose();
  };
  const save = async () => {
    const cleaned: any = {};
    Object.entries(s).forEach(([kk, v]) => {
      if (v !== '' && v != null && v !== false && !(kk === 'size' && v === 100)) cleaned[kk] = v;
    });
    await saveStyle(k, Object.keys(cleaned).length ? cleaned : null);
    toast({ title: 'Style saved', kind: 'success' }, 1600);
    close();
  };

  return (
    <motion.div
      drag
      dragControls={drag}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass"
      style={{ position: 'fixed', top: 90, right: 20, width: 340, maxHeight: 'calc(100vh - 120px)', overflow: 'auto', zIndex: 9001, borderRadius: 16, padding: 18, boxShadow: '0 30px 80px rgba(0,0,0,.8)', borderColor: 'rgba(217,164,65,.5)' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="row" style={{ justifyContent: 'space-between', cursor: 'move', marginBottom: 10 }} onPointerDown={(e) => drag.start(e)}>
        <div>
          <div className="kicker" style={{ fontSize: 10 }}>
            🎨 Text style · drag to move
          </div>
          <div className="mono muted" style={{ fontSize: 10.5, marginTop: 4, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        </div>
        <button className="btn btn-xs btn-icon" onClick={close}>
          ✕
        </button>
      </div>

      <Row label="Size (% of original)">
        <Slider value={s.size ?? 100} min={20} max={300} step={1} unit="%" onChange={(v) => set({ size: v, fontSize: undefined })} />
      </Row>
      <Row label="Exact font size (overrides %, 0 = off)">
        <Slider value={s.fontSize ?? 0} min={0} max={300} step={1} unit="px" onChange={(v) => set({ fontSize: v || undefined })} />
      </Row>
      <Row label="Move left / right">
        <Slider value={s.x ?? 0} min={-800} max={800} step={1} unit="px" onChange={(v) => set({ x: v })} />
      </Row>
      <Row label="Move up / down">
        <Slider value={s.y ?? 0} min={-500} max={500} step={1} unit="px" onChange={(v) => set({ y: v })} />
      </Row>
      <Row label="Tilt (rotate)">
        <Slider value={s.rotate ?? 0} min={-180} max={180} step={0.5} unit="°" onChange={(v) => set({ rotate: v })} />
      </Row>
      <Row label="Slant (skew)">
        <Slider value={s.skew ?? 0} min={-45} max={45} step={0.5} unit="°" onChange={(v) => set({ skew: v })} />
      </Row>
      <Row label="Color">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input type="color" value={s.color || '#ffffff'} onChange={(e) => set({ color: e.target.value })} />
          <button className="btn btn-xs" onClick={() => set({ color: undefined })}>
            Default
          </button>
          {['#ffffff', '#ff2e3b', '#d9a441', '#9ed8ff', '#8e8a84'].map((c) => (
            <button key={c} onClick={() => set({ color: c })} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '1px solid var(--line2)', padding: 0 }} />
          ))}
        </div>
      </Row>
      <Row label="Font">
        <div className="row" style={{ gap: 4 }}>
          {[
            ['', 'Default'],
            ['display', 'Display'],
            ['body', 'Body'],
            ['serif', 'Serif'],
            ['mono', 'Mono'],
            ['type', 'Typewriter'],
          ].map(([v, l]) => (
            <button key={v} className={cx('chip', (s.font || '') === v && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => set({ font: v as any })}>
              {l}
            </button>
          ))}
        </div>
      </Row>
      <Row label="Weight">
        <div className="row" style={{ gap: 4 }}>
          {[0, 300, 400, 600, 800].map((w) => (
            <button key={w} className={cx('chip', (s.weight || 0) === w && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => set({ weight: w || undefined })}>
              {w || 'Default'}
            </button>
          ))}
        </div>
      </Row>
      <Row label="Style">
        <div className="row" style={{ gap: 4 }}>
          <button className={cx('chip', s.italic && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => set({ italic: !s.italic })}>
            <i>Italic</i>
          </button>
          {[
            ['', 'Default case'],
            ['upper', 'UPPER'],
            ['lower', 'lower'],
            ['none', 'As typed'],
          ].map(([v, l]) => (
            <button key={v} className={cx('chip', (s.uppercase || '') === v && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => set({ uppercase: v as any })}>
              {l}
            </button>
          ))}
        </div>
      </Row>
      <Row label="Alignment">
        <div className="row" style={{ gap: 4 }}>
          {[
            ['', 'Default'],
            ['left', 'Left'],
            ['center', 'Center'],
            ['right', 'Right'],
          ].map(([v, l]) => (
            <button key={v} className={cx('chip', (s.align || '') === v && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => set({ align: v as any })}>
              {l}
            </button>
          ))}
        </div>
      </Row>
      <Row label="Letter spacing">
        <Slider value={s.letterSpacing ?? 0} min={-0.2} max={1} step={0.01} unit="em" onChange={(v) => set({ letterSpacing: v })} />
      </Row>
      <Row label="Line height (0 = default)">
        <Slider value={s.lineHeight ?? 0} min={0} max={3} step={0.05} onChange={(v) => set({ lineHeight: v || undefined })} />
      </Row>
      <Row label="Opacity">
        <Slider value={s.opacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => set({ opacity: v })} />
      </Row>
      <Row label="Max width (0 = default)">
        <Slider value={s.maxWidth ?? 0} min={0} max={2000} step={10} unit="px" onChange={(v) => set({ maxWidth: v || undefined })} />
      </Row>
      <Row label="Glow">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <Slider value={s.glow ?? 0} min={0} max={80} step={1} unit="px" onChange={(v) => set({ glow: v || undefined })} />
          <input type="color" value={s.glowColor || '#ff2e3b'} onChange={(e) => set({ glowColor: e.target.value })} />
        </div>
      </Row>
      <Row label="Outline">
        <Slider value={s.stroke ?? 0} min={0} max={6} step={0.5} unit="px" onChange={(v) => set({ stroke: v || undefined })} />
      </Row>
      <label className="row" style={{ fontSize: 13, margin: '6px 0 14px', gap: 10 }}>
        <button className={cx('toggle', s.hidden && 'on')} onClick={() => set({ hidden: !s.hidden })} /> Hide this text on the site
      </label>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button
          className="btn btn-xs btn-danger"
          onClick={() => {
            setS({});
            stylePreview.set((p) => ({ ...p, [k]: null }));
          }}
        >
          Reset
        </button>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-xs" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-xs btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useStore, toast } from '../lib/bus';
import { useLocation } from 'react-router-dom';
import { styleTarget, stylePreview, TextStyle, StyleTarget, usePreview, styleToCssText, selectorFor, isElementKey, autoSelector, describeEl, EDIT_ONLY, isLegacyKey } from '../lib/styles';
import { cx } from '../lib/util';

/** Applies saved (and previewed) element styles for everyone. Always mounted. */
export function StyleInjector() {
  const { styles } = useCms();
  const preview = usePreview();
  const css = useMemo(() => {
    const all: Record<string, any> = { ...styles };
    Object.entries(preview).forEach(([k, v]) => (all[k] = v));
    return Object.entries(all)
      .filter(([k, v]) => v && isElementKey(k))
      .map(([k, v]) => {
        const body = styleToCssText(v);
        return body ? `${selectorFor(k)} { ${body} }` : '';
      })
      .join('\n');
  }, [styles, preview]);
  return <style id="dexter-element-styles">{css}</style>;
}

const IGNORE = `#style-panel, .edit-bar, .style-fab, .toasts, .modal-back, ${EDIT_ONLY}`;

// Decorative overlays (glare, gradients on cards etc.) are see-through for targeting, so the image under them gets picked.
const DECOR = '.shade, .grain, .vignette';
const isDecor = (n: Element) =>
  n.matches(DECOR) ||
  (n.childElementCount === 0 && !n.textContent?.trim() && !n.matches('img, video, canvas, svg, input, select, textarea, button, a, [data-sk]') && /absolute|fixed/.test(getComputedStyle(n).position));
function pick(e: MouseEvent): HTMLElement {
  const el = e.target as HTMLElement;
  if (!el?.matches || !isDecor(el)) return el;
  const below = document.elementsFromPoint(e.clientX, e.clientY).find((n) => !isDecor(n)) as HTMLElement | undefined;
  return below || el;
}

function resolve(el: HTMLElement, exact: boolean): StyleTarget | null {
  if (el.closest(IGNORE)) return null;
  const tagged = (exact ? (el.dataset.sk ? el : null) : el.closest('[data-sk]')) as HTMLElement | null;
  if (tagged) return fromTagged(tagged);
  const key = 'css:' + autoSelector(el);
  return { key, label: describeEl(el), el, open: false, kind: el.matches('img, video, canvas, .visual') ? 'image' : 'element' };
}

function fromTagged(el: HTMLElement): StyleTarget {
  const key = el.dataset.sk!;
  const text = /^(t|f|s):/.test(key);
  return { key, label: el.dataset.skLabel || describeEl(el), el, open: false, kind: text ? 'text' : el.matches('.visual, img, video') || key.startsWith('e:img') ? 'image' : 'element' };
}

/** Edit Mode only: hover anything to get a 🎨 button (Alt = the exact element), right-click to open the panel. */
export function StyleEditor() {
  const { editMode, styles, replaceStyles } = useCms();
  const target = useStore(styleTarget);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const loc = useLocation();

  // Repair styles saved with older selectors (they counted Edit-Mode-only buttons, so they vanished outside Edit Mode).
  useEffect(() => {
    if (!editMode) return;
    const legacy = Object.keys(styles).filter(isLegacyKey);
    if (!legacy.length) return;
    const timer = setTimeout(() => {
      const next: Record<string, any> = { ...styles };
      let fixed = 0;
      for (const k of legacy) {
        let el: HTMLElement | null = null;
        try {
          el = document.querySelector(k.slice(4));
        } catch {
          continue;
        }
        if (!el) continue;
        const nk = el.dataset.sk || 'css:' + autoSelector(el);
        if (nk === k) continue;
        next[nk] = { ...(next[nk] || {}), ...styles[k] };
        delete next[k];
        fixed++;
      }
      if (fixed)
        replaceStyles(next)
          .then(() => toast({ title: 'Styles repaired', text: `${fixed} older style${fixed > 1 ? 's' : ''} now stick outside Edit Mode too.`, kind: 'success' }, 3000))
          .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [editMode, loc.pathname, styles]);

  useEffect(() => {
    if (!editMode) {
      styleTarget.set(null);
      return;
    }
    const over = (e: MouseEvent) => {
      if (styleTarget.get()?.open) return;
      const t = resolve(pick(e), e.altKey);
      if (t) styleTarget.set(t);
    };
    const ctx = (e: MouseEvent) => {
      const t = resolve(pick(e), e.altKey);
      if (!t) return;
      e.preventDefault();
      styleTarget.set({ ...t, open: true });
    };
    window.addEventListener('mouseover', over);
    window.addEventListener('contextmenu', ctx);
    return () => {
      window.removeEventListener('mouseover', over);
      window.removeEventListener('contextmenu', ctx);
    };
  }, [editMode]);

  useEffect(() => {
    if (!target?.el) return;
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
      {rect && (
        <div className="style-fab" style={{ position: 'fixed', left: rect.left - 3, top: rect.top - 3, width: rect.width + 6, height: rect.height + 6, border: `1px solid ${target.open ? 'var(--blood-bright)' : 'rgba(217,164,65,.8)'}`, borderRadius: 6, pointerEvents: 'none', zIndex: 8999, boxShadow: '0 0 0 9999px rgba(0,0,0,0)' }} />
      )}
      {!target.open && rect && (
        <button
          className="btn btn-xs style-fab"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => styleTarget.set({ ...target, open: true })}
          style={{ position: 'fixed', left: Math.max(6, Math.min(window.innerWidth - 90, rect.right - 80)), top: Math.max(6, rect.top - 30), zIndex: 9000, background: 'var(--gold)', color: '#111', borderColor: 'var(--gold)', boxShadow: '0 8px 20px rgba(0,0,0,.5)' }}
        >
          🎨 Style
        </button>
      )}
      {target.open && <StylePanel key={target.key} t={target} onClose={() => styleTarget.set(null)} />}
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

function Chips({ value, options, onChange }: { value: any; options: [any, string][]; onChange: (v: any) => void }) {
  return (
    <div className="row" style={{ gap: 4 }}>
      {options.map(([v, l]) => (
        <button key={String(v)} className={cx('chip', (value ?? '') === v && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Group({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  const [o, setO] = useState(!!open);
  return (
    <div style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
      <button onClick={() => setO(!o)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, padding: 0, width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
        {title} <span className="muted">{o ? '−' : '+'}</span>
      </button>
      {o && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

function StylePanel({ t, onClose }: { t: StyleTarget; onClose: () => void }) {
  const { styles, saveStyle } = useCms();
  const drag = useDragControls();
  const k = t.key;
  const [s, setS] = useState<TextStyle>(() => ({ ...(styles[k] || {}) }));
  const set = (patch: Partial<TextStyle>) => {
    const next = { ...s, ...patch };
    setS(next);
    stylePreview.set((p) => ({ ...p, [k]: next }));
  };
  const clearPreview = () =>
    stylePreview.set((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  const close = () => {
    clearPreview();
    onClose();
  };
  const save = async () => {
    const cleaned: any = {};
    Object.entries(s).forEach(([kk, v]) => {
      if (v !== '' && v != null && v !== false && !((kk === 'size' || kk === 'scale' || kk === 'brightness' || kk === 'contrast' || kk === 'saturate') && v === 100)) cleaned[kk] = v;
    });
    await saveStyle(k, Object.keys(cleaned).length ? cleaned : null);
    toast({ title: 'Style saved', kind: 'success' }, 1600);
    close();
  };
  const retarget = (el: HTMLElement | null, exact: boolean) => {
    const nt = el && resolve(el, exact);
    if (!nt) return;
    clearPreview();
    styleTarget.set({ ...nt, open: true });
  };

  const text = (
    <Group key="text" title="Text" open={t.kind === 'text'}>
      <Row label="Size (% of original, changes layout)">
        <Slider value={s.size ?? 100} min={20} max={300} step={1} unit="%" onChange={(v) => set({ size: v, fontSize: undefined })} />
      </Row>
      <Row label="Exact font size (0 = off)">
        <Slider value={s.fontSize ?? 0} min={0} max={300} step={1} unit="px" onChange={(v) => set({ fontSize: v || undefined })} />
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
        <Chips value={s.font || ''} options={[['', 'Default'], ['display', 'Display'], ['body', 'Body'], ['serif', 'Serif'], ['mono', 'Mono'], ['type', 'Typewriter']]} onChange={(v) => set({ font: v })} />
      </Row>
      <Row label="Weight">
        <Chips value={s.weight || 0} options={[[0, 'Default'], [300, '300'], [400, '400'], [600, '600'], [800, '800']]} onChange={(v) => set({ weight: v || undefined })} />
      </Row>
      <Row label="Style">
        <div className="row" style={{ gap: 4 }}>
          <button className={cx('chip', s.italic && 'on')} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => set({ italic: !s.italic })}>
            <i>Italic</i>
          </button>
          <Chips value={s.uppercase || ''} options={[['', 'Default case'], ['upper', 'UPPER'], ['lower', 'lower'], ['none', 'As typed']]} onChange={(v) => set({ uppercase: v })} />
        </div>
      </Row>
      <Row label="Alignment">
        <Chips value={s.align || ''} options={[['', 'Default'], ['left', 'Left'], ['center', 'Center'], ['right', 'Right']]} onChange={(v) => set({ align: v })} />
      </Row>
      <Row label="Letter spacing">
        <Slider value={s.letterSpacing ?? 0} min={-0.2} max={1} step={0.01} unit="em" onChange={(v) => set({ letterSpacing: v })} />
      </Row>
      <Row label="Line height (0 = default)">
        <Slider value={s.lineHeight ?? 0} min={0} max={3} step={0.05} onChange={(v) => set({ lineHeight: v || undefined })} />
      </Row>
      <Row label="Glow">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <Slider value={s.glow ?? 0} min={0} max={80} step={1} unit="px" onChange={(v) => set({ glow: v || undefined })} />
          <input type="color" value={s.glowColor || '#ff2e3b'} onChange={(e) => set({ glowColor: e.target.value })} />
        </div>
      </Row>
      <Row label="Text outline">
        <Slider value={s.stroke ?? 0} min={0} max={6} step={0.5} unit="px" onChange={(v) => set({ stroke: v || undefined })} />
      </Row>
    </Group>
  );
  const position = (
    <Group key="pos" title="Position, size & rotation" open={t.kind !== 'text'}>
      <Row label="Move left / right">
        <Slider value={s.x ?? 0} min={-800} max={800} step={1} unit="px" onChange={(v) => set({ x: v })} />
      </Row>
      <Row label="Move up / down">
        <Slider value={s.y ?? 0} min={-500} max={500} step={1} unit="px" onChange={(v) => set({ y: v })} />
      </Row>
      <Row label="Scale (visual, doesn’t move other things)">
        <Slider value={s.scale ?? 100} min={10} max={300} step={1} unit="%" onChange={(v) => set({ scale: v })} />
      </Row>
      {t.kind !== 'text' && (
        <Row label="Zoom (changes layout)">
          <Slider value={s.size ?? 100} min={20} max={300} step={1} unit="%" onChange={(v) => set({ size: v })} />
        </Row>
      )}
      <Row label="Tilt (rotate)">
        <Slider value={s.rotate ?? 0} min={-180} max={180} step={0.5} unit="°" onChange={(v) => set({ rotate: v })} />
      </Row>
      <Row label="Slant (skew)">
        <Slider value={s.skew ?? 0} min={-45} max={45} step={0.5} unit="°" onChange={(v) => set({ skew: v })} />
      </Row>
      <Row label="Width (0 = auto)">
        <Slider value={s.width ?? 0} min={0} max={2000} step={5} unit="px" onChange={(v) => set({ width: v || undefined })} />
      </Row>
      <Row label="Height (0 = auto)">
        <Slider value={s.height ?? 0} min={0} max={1400} step={5} unit="px" onChange={(v) => set({ height: v || undefined })} />
      </Row>
      <Row label="Max width (0 = default)">
        <Slider value={s.maxWidth ?? 0} min={0} max={2000} step={10} unit="px" onChange={(v) => set({ maxWidth: v || undefined })} />
      </Row>
    </Group>
  );
  const box = (
    <Group key="box" title="Look (background, corners, border, shadow)" open={t.kind === 'element'}>
      <Row label="Opacity">
        <Slider value={s.opacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => set({ opacity: v })} />
      </Row>
      <Row label="Background color">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input type="color" value={s.bg || '#000000'} onChange={(e) => set({ bg: e.target.value })} />
          <button className="btn btn-xs" onClick={() => set({ bg: undefined })}>
            Default
          </button>
          <button className="btn btn-xs" onClick={() => set({ bg: 'transparent' })}>
            None
          </button>
        </div>
      </Row>
      <Row label="Rounded corners (-1 = default)">
        <Slider value={s.radius ?? -1} min={-1} max={200} step={1} unit="px" onChange={(v) => set({ radius: v < 0 ? undefined : v })} />
      </Row>
      <Row label="Border">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <Slider value={s.borderWidth ?? 0} min={0} max={12} step={1} unit="px" onChange={(v) => set({ borderWidth: v || undefined })} />
          <input type="color" value={s.borderColor || '#d90f1e'} onChange={(e) => set({ borderColor: e.target.value })} />
        </div>
      </Row>
      <Row label="Shadow">
        <Slider value={s.shadow ?? 0} min={0} max={120} step={1} unit="px" onChange={(v) => set({ shadow: v || undefined })} />
      </Row>
      <Row label="Inner spacing (padding)">
        <Slider value={s.padding ?? 0} min={0} max={120} step={1} unit="px" onChange={(v) => set({ padding: v || undefined })} />
      </Row>
    </Group>
  );
  const image = (
    <Group key="img" title="Image filters" open={t.kind === 'image'}>
      <Row label="Brightness">
        <Slider value={s.brightness ?? 100} min={0} max={250} step={1} unit="%" onChange={(v) => set({ brightness: v })} />
      </Row>
      <Row label="Contrast">
        <Slider value={s.contrast ?? 100} min={0} max={250} step={1} unit="%" onChange={(v) => set({ contrast: v })} />
      </Row>
      <Row label="Saturation">
        <Slider value={s.saturate ?? 100} min={0} max={300} step={1} unit="%" onChange={(v) => set({ saturate: v })} />
      </Row>
      <Row label="Black & white">
        <Slider value={s.grayscale ?? 0} min={0} max={100} step={1} unit="%" onChange={(v) => set({ grayscale: v || undefined })} />
      </Row>
      <Row label="Color shift">
        <Slider value={s.hue ?? 0} min={-180} max={180} step={1} unit="°" onChange={(v) => set({ hue: v || undefined })} />
      </Row>
      <Row label="Blur">
        <Slider value={s.blur ?? 0} min={0} max={30} step={0.5} unit="px" onChange={(v) => set({ blur: v || undefined })} />
      </Row>
    </Group>
  );
  const order = t.kind === 'text' ? [text, position, box, image] : t.kind === 'image' ? [position, image, box, text] : [position, box, text, image];

  return (
    <motion.div
      id="style-panel"
      drag
      dragControls={drag}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass"
      style={{ position: 'fixed', top: 90, right: 20, width: 350, maxHeight: 'calc(100vh - 120px)', overflow: 'auto', zIndex: 9001, borderRadius: 16, padding: 18, boxShadow: '0 30px 80px rgba(0,0,0,.8)', borderColor: 'rgba(217,164,65,.5)' }}
    >
      <div style={{ cursor: 'move', marginBottom: 10 }} onPointerDown={(e) => drag.start(e)}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <div className="kicker" style={{ fontSize: 10 }}>
            🎨 Style · drag here to move
          </div>
          <button className="btn btn-xs btn-icon" onClick={close}>
            ✕
          </button>
        </div>
        <div className="mono muted" style={{ fontSize: 10.5, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={k}>
          {t.label}
        </div>
      </div>
      <div className="row" style={{ gap: 6, marginBottom: 8 }}>
        <button className="btn btn-xs" title="Style the element that contains this one" onClick={() => retarget(t.el?.parentElement || null, true)}>
          ↑ Container
        </button>
        <button className="btn btn-xs" title="Style exactly this element" onClick={() => retarget(t.el, true)}>
          ◎ Exact element
        </button>
      </div>
      {order}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <label className="row" style={{ fontSize: 13, marginBottom: 14, gap: 10 }}>
          <button className={cx('toggle', s.hidden && 'on')} onClick={() => set({ hidden: !s.hidden })} /> Hide this on the site
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
      </div>
    </motion.div>
  );
}

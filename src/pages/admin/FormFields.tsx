import React, { useState } from 'react';
import { Field } from './schemas';
import { useCms } from '../../lib/cms';
import { MediaPicker, MediaThumb, MediaKind } from '../../components/MediaPicker';
import { cx } from '../../lib/util';

const nice = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export function FieldInput({ f, value, onChange }: { f: Field; value: any; onChange: (v: any) => void }) {
  const { col } = useCms();
  const [picker, setPicker] = useState<null | { kind: MediaKind; idx?: number }>(null);
  const opts = (f.options || []).map((o) => (Array.isArray(o) ? o : [o, o]));

  const mediaField = (kind: MediaKind) => (
    <div>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input className="input" value={value || ''} placeholder="https://… (R2 link)" onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn btn-sm" onClick={() => setPicker({ kind })}>
          Library
        </button>
      </div>
      {value && (
        <div style={{ marginTop: 8, maxWidth: 260 }}>
          {kind === 'audio' ? <audio src={value} controls style={{ width: '100%' }} /> : <MediaThumb url={value} h={110} />}
        </div>
      )}
      <MediaPicker open={!!picker} onClose={() => setPicker(null)} kind={kind} current={value} onPick={(u) => onChange(u)} />
    </div>
  );

  switch (f.type) {
    case 'text':
    case 'icon':
      return <input className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return <textarea className="textarea" value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={Math.min(14, Math.max(3, String(value || '').split('\n').length + 1))} />;
    case 'number':
      return <input className="input" type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
    case 'bool':
      return <button type="button" className={cx('toggle', value && 'on')} onClick={() => onChange(!value)} />;
    case 'color':
      return (
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
          <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 140 }} />
        </div>
      );
    case 'select':
      return (
        <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {opts.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      );
    case 'image':
    case 'video':
    case 'audio':
    case 'model':
    case 'font':
    case 'media':
      return mediaField(f.type === 'media' ? 'any' : (f.type as MediaKind));
    case 'list':
      return <textarea className="textarea" value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} onBlur={(e) => onChange(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} rows={Math.max(3, (value || []).length + 1)} placeholder="One per line" />;
    case 'images': {
      const arr: string[] = value || [];
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
            {arr.map((u, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <MediaThumb url={u} h={80} />
                <div className="row" style={{ position: 'absolute', top: 4, right: 4, gap: 3 }}>
                  {i > 0 && (
                    <button type="button" className="btn btn-xs" style={{ padding: '2px 6px', background: '#000' }} onClick={() => onChange(arr.map((x, j) => (j === i - 1 ? arr[i] : j === i ? arr[i - 1] : x)))}>
                      ←
                    </button>
                  )}
                  <button type="button" className="btn btn-xs btn-danger" style={{ padding: '2px 6px', background: '#000' }} onClick={() => onChange(arr.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setPicker({ kind: 'image' })}>
            + Add image
          </button>
          <MediaPicker open={!!picker} onClose={() => setPicker(null)} kind="image" onPick={(u) => u && onChange([...arr, u])} />
        </div>
      );
    }
    case 'ref': {
      const items = col(f.ref!);
      return (
        <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name || it.title || it.id}
            </option>
          ))}
        </select>
      );
    }
    case 'refs': {
      const items = col(f.ref!);
      const arr: string[] = value || [];
      return (
        <div className="row" style={{ gap: 6 }}>
          {items.map((it) => {
            const on = arr.includes(it.id);
            return (
              <button type="button" key={it.id} className={cx('chip', on && 'on')} onClick={() => onChange(on ? arr.filter((x) => x !== it.id) : [...arr, it.id])}>
                {it.name || it.title || it.id}
              </button>
            );
          })}
        </div>
      );
    }
    case 'spoiler': {
      const v = value || null;
      return (
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <select className="select" value={v?.series || ''} onChange={(e) => onChange(e.target.value ? { series: e.target.value, season: v?.season || 1, episode: v?.episode || 1 } : null)}>
            <option value="">No spoiler</option>
            {col('series').map((s) => (
              <option key={s.id} value={s.id}>
                {s.short}
              </option>
            ))}
          </select>
          {v && (
            <>
              <input className="input" type="number" min={1} value={v.season || 1} onChange={(e) => onChange({ ...v, season: Number(e.target.value) })} style={{ maxWidth: 90 }} title="Season" />
              <input className="input" type="number" min={1} value={v.episode || ''} onChange={(e) => onChange({ ...v, episode: e.target.value ? Number(e.target.value) : null })} style={{ maxWidth: 90 }} title="Episode" />
            </>
          )}
        </div>
      );
    }
    case 'object':
      return (
        <div style={{ padding: 14, borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(255,255,255,.02)' }}>
          <Fields fields={f.fields || []} value={value || {}} onChange={onChange} />
        </div>
      );
    case 'objlist': {
      const arr: any[] = Array.isArray(value) ? value : [];
      const set = (i: number, v: any) => onChange(arr.map((x, j) => (j === i ? v : x)));
      const move = (i: number, d: number) => {
        const a = [...arr];
        const [x] = a.splice(i, 1);
        a.splice(i + d, 0, x);
        onChange(a);
      };
      return (
        <div>
          {arr.map((it, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--line)', marginBottom: 10, background: 'rgba(255,255,255,.02)' }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="mono muted" style={{ fontSize: 11 }}>
                  #{i + 1}
                </span>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="btn btn-xs" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="btn btn-xs" disabled={i === arr.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  <button type="button" className="btn btn-xs" onClick={() => onChange([...arr.slice(0, i + 1), JSON.parse(JSON.stringify(it)), ...arr.slice(i + 1)])}>
                    ⧉
                  </button>
                  <button type="button" className="btn btn-xs btn-danger" onClick={() => onChange(arr.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </div>
              </div>
              <Fields fields={f.fields || []} value={it || {}} onChange={(v) => set(i, v)} />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              const blank: any = {};
              (f.fields || []).forEach((sf) => (blank[sf.key] = sf.type === 'number' ? (sf.key === 'n' ? arr.length + 1 : 0) : sf.type === 'bool' ? true : sf.type === 'list' || sf.type === 'images' || sf.type === 'refs' ? [] : sf.type === 'spoiler' ? null : ''));
              onChange([...arr, blank]);
            }}
          >
            + Add
          </button>
        </div>
      );
    }
    case 'json':
      return <JsonInput value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function JsonInput({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [txt, setTxt] = useState(() => JSON.stringify(value ?? {}, null, 0));
  const [err, setErr] = useState(false);
  return (
    <div>
      <input
        className="input mono"
        value={txt}
        style={{ borderColor: err ? 'var(--blood-bright)' : undefined, fontSize: 13 }}
        onChange={(e) => {
          setTxt(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setErr(false);
          } catch {
            setErr(true);
          }
        }}
      />
    </div>
  );
}

export function Fields({ fields, value, onChange }: { fields: Field[]; value: any; onChange: (v: any) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 18px' }}>
      {fields.map((f) => (
        <div key={f.key} className="field" style={{ gridColumn: f.wide || f.type === 'objlist' || f.type === 'object' ? '1 / -1' : undefined, marginBottom: 10 }}>
          <label className="label">{f.label || nice(f.key)}</label>
          <FieldInput f={f} value={value?.[f.key]} onChange={(v) => onChange({ ...(value || {}), [f.key]: v })} />
          {f.help && (
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {f.help}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

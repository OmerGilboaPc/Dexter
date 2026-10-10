import React, { useEffect, useRef, useState } from 'react';
import { useCms, useT } from '../lib/cms';
import { getPath, cx } from '../lib/util';
import { MediaPicker, MediaKind } from './MediaPicker';
import { toast } from '../lib/bus';
import { styleToCss, usePreview } from '../lib/styles';

/** Text that becomes contentEditable for the admin in Edit Mode, with optional per-element styling. */
export function EditableText({ value, onSave, as = 'span', className, style, multiline, placeholder, styleKey, label }: { value: string; onSave: (v: string) => Promise<any> | void; as?: any; className?: string; style?: React.CSSProperties; multiline?: boolean; placeholder?: string; styleKey?: string; label?: string }) {
  const { editMode, styles } = useCms();
  const preview = usePreview();
  const ref = useRef<HTMLElement>(null);
  const Tag = as;
  useEffect(() => {
    if (editMode && ref.current && document.activeElement !== ref.current) ref.current.innerText = value || '';
  }, [value, editMode]);
  const st = styleKey ? (styleKey in preview ? preview[styleKey] : styles[styleKey]) : null;
  const css = { ...style, ...styleToCss(st) };
  if (!editMode) {
    if (multiline && value && value.includes('\n')) {
      return (
        <Tag className={className} style={css} data-sk={styleKey} data-sk-label={label}>
          {value.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Tag>
      );
    }
    return (
      <Tag className={className} style={css} data-sk={styleKey} data-sk-label={label}>
        {value}
      </Tag>
    );
  }
  const hiddenInEdit = st?.hidden;
  return (
    <Tag
      ref={ref}
      className={cx(className, 'editable')}
      style={{ ...css, ...(hiddenInEdit ? { display: undefined, opacity: 0.25, outlineStyle: 'dotted' } : {}), whiteSpace: multiline ? 'pre-wrap' : undefined }}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      data-sk={styleKey}
      data-sk-label={label}
      onClick={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e: any) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
        if (e.key === 'Escape') {
          (e.target as HTMLElement).innerText = value || '';
          (e.target as HTMLElement).blur();
        }
      }}
      onBlur={async (e: any) => {
        const v = (e.target as HTMLElement).innerText.replace(/\u00a0/g, ' ').trimEnd();
        if (v !== (value || '')) {
          await onSave(v);
          toast({ title: 'Saved', text: 'Edit published live', kind: 'success' }, 1800);
        }
      }}
    />
  );
}

/** A UI string (settings/strings) with a default. */
export function T({ k, d, as, className, style, multiline }: { k: string; d: string; as?: any; className?: string; style?: React.CSSProperties; multiline?: boolean }) {
  const t = useT();
  const { saveString } = useCms();
  return <EditableText value={t(k, d)} onSave={(v) => saveString(k, v)} as={as} className={className} style={style} multiline={multiline} styleKey={`t:${k}`} label={k} />;
}

/** A field on a CMS item. */
export function F({ col, item, path, as, className, style, multiline }: { col: string; item: any; path: string; as?: any; className?: string; style?: React.CSSProperties; multiline?: boolean }) {
  const { patchItem } = useCms();
  const v = getPath(item, path);
  return <EditableText value={v == null ? '' : String(v)} onSave={(nv) => patchItem(col, item.id, path, nv)} as={as} className={className} style={style} multiline={multiline} styleKey={`f:${col}/${item.id}/${path}`} label={`${col} › ${item.id} › ${path}`} />;
}

/** A value inside the site settings document. */
export function SText({ path, as, className, style, multiline }: { path: string; as?: any; className?: string; style?: React.CSSProperties; multiline?: boolean }) {
  const { settings, saveSettings } = useCms();
  const v = getPath(settings, path);
  return <EditableText value={v == null ? '' : String(v)} onSave={(nv) => saveSettings(path, nv)} as={as} className={className} style={style} multiline={multiline} styleKey={`s:${path}`} label={`settings › ${path}`} />;
}

/** Floating "change media" button shown in Edit Mode. */
export function MediaEdit({ current, onPick, kind = 'image', label = 'Change', style }: { current?: string; onPick: (url: string) => void; kind?: MediaKind; label?: string; style?: React.CSSProperties }) {
  const { editMode } = useCms();
  const [open, setOpen] = useState(false);
  if (!editMode) return null;
  return (
    <>
      <button
        className="btn btn-xs btn-white edit-media"
        data-edit-only
        style={style}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        ✎ {label} {kind}
      </button>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={onPick} kind={kind} current={current} />
    </>
  );
}

export function ItemMediaEdit({ col, item, path, kind = 'image', label, style }: { col: string; item: any; path: string; kind?: MediaKind; label?: string; style?: React.CSSProperties }) {
  const { patchItem } = useCms();
  return <MediaEdit current={getPath(item, path)} onPick={(u) => patchItem(col, item.id, path, u)} kind={kind} label={label} style={style} />;
}

export function SettingsMediaEdit({ path, kind = 'image', label, style }: { path: string; kind?: MediaKind; label?: string; style?: React.CSSProperties }) {
  const { settings, saveSettings } = useCms();
  return <MediaEdit current={getPath(settings, path)} onPick={(u) => saveSettings(path, u)} kind={kind} label={label} style={style} />;
}

import React, { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useCms } from '../lib/cms';
import { isAudio, isModel, isVideo, slugify, uid } from '../lib/util';
import { Visual } from './Visual';

export type MediaKind = 'image' | 'video' | 'audio' | 'model' | 'font' | 'any';

export const kindOf = (url: string): MediaKind => (isVideo(url) ? 'video' : isAudio(url) ? 'audio' : isModel(url) ? 'model' : /\.(woff2?|ttf|otf)(\?|$)/i.test(url) ? 'font' : 'image');

export function MediaThumb({ url, h = 90 }: { url: string; h?: number }) {
  const k = kindOf(url);
  if (k === 'image' || k === 'video') return <Visual src={url} seed={url} style={{ height: h, borderRadius: 10 }} />;
  return (
    <div style={{ height: h, borderRadius: 10, background: '#101015', display: 'grid', placeItems: 'center', border: '1px solid var(--line)' }}>
      <span style={{ fontSize: 30 }}>{k === 'audio' ? '🎵' : k === 'model' ? '🧍' : k === 'font' ? 'Aa' : '📄'}</span>
    </div>
  );
}

/** Choose from the media library or paste any Cloudflare R2 link. */
export function MediaPicker({ open, onClose, onPick, kind = 'any', current }: { open: boolean; onClose: () => void; onPick: (url: string) => void; kind?: MediaKind; current?: string }) {
  const { col, saveItem } = useCms();
  const [url, setUrl] = useState(current || '');
  const [name, setName] = useState('');
  const [addToLib, setAddToLib] = useState(true);
  const [q, setQ] = useState('');
  const lib = useMemo(
    () => col('media').filter((m) => (kind === 'any' || m.type === kind || kindOf(m.url) === kind) && (!q || (m.name + ' ' + (m.tags || []).join(' ')).toLowerCase().includes(q.toLowerCase()))),
    [col, kind, q],
  );

  const submit = async () => {
    if (!url.trim()) return;
    if (addToLib && !col('media').some((m) => m.url === url.trim())) {
      const id = slugify(name || url.split('/').pop() || 'media') + '-' + uid().slice(0, 4);
      await saveItem('media', id, { id, url: url.trim(), name: name || url.split('/').pop(), type: kindOf(url.trim()), tags: [], order: Date.now() }, { silent: true });
    }
    onPick(url.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="kicker">Media Library</div>
      <h2 className="display h-sm" style={{ margin: '8px 0 20px' }}>
        Choose {kind === 'any' ? 'media' : kind}
      </h2>
      <div className="grid g2" style={{ gridTemplateColumns: '1.3fr 1fr', alignItems: 'start' }}>
        <div>
          <input className="input" placeholder="Search the library…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14 }} />
          {lib.length === 0 ? (
            <div className="empty">The library is empty. Paste a link on the right to add the first file.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 12, maxHeight: 420, overflow: 'auto', paddingRight: 6 }}>
              {lib.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onPick(m.url);
                    onClose();
                  }}
                  style={{ background: 'none', border: m.url === current ? '2px solid var(--blood)' : '1px solid var(--line)', borderRadius: 12, padding: 6, cursor: 'pointer', textAlign: 'left' }}
                >
                  <MediaThumb url={m.url} />
                  <div style={{ fontSize: 12, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card card-pad">
          <div className="field">
            <label className="label">Link (Cloudflare R2 or any URL)</label>
            <input className="input" placeholder="https://pub-xxxx.r2.dev/…" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Name</label>
            <input className="input" placeholder="Optional" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {url && (
            <div style={{ marginBottom: 14 }}>
              <MediaThumb url={url} h={150} />
            </div>
          )}
          <label className="row" style={{ marginBottom: 16, fontSize: 14 }}>
            <button className={`toggle ${addToLib ? 'on' : ''}`} onClick={() => setAddToLib(!addToLib)} type="button" /> Save to library
          </label>
          <div className="row">
            <button className="btn btn-primary" onClick={submit}>
              Use this link
            </button>
            {current && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  onPick('');
                  onClose();
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

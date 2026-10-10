import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCms } from '../../lib/cms';
import { COLLECTION_META, Field } from './schemas';
import { Fields } from './FormFields';
import { AdminTitle, adminCard } from './Admin';
import { MediaThumb } from '../../components/MediaPicker';
import { BLOCK_TYPES } from '../CustomPage';
import { cx, slugify, uid } from '../../lib/util';
import { defaults } from '../../data';

const strip = (o: any) => {
  if (!o) return o;
  const { __draft, __hasDraft, ...rest } = o;
  return rest;
};

export const viewLink = (col: string, x: any) =>
  ({
    series: `/series/${x.id}`,
    seasons: `/seasons/${x.id}`,
    characters: `/characters/${x.id}`,
    villains: `/villains/${x.id}`,
    victims: `/kill-count?v=${x.id}`,
    quotes: `/quotes#${x.id}`,
    timeline: '/timeline',
    locations: `/map?l=${x.id}`,
    code: '/code',
    bts: '/behind-the-scenes',
    trivia: '/games/trivia',
    quiz: '/games/quiz',
    cases: '/games/catch-the-killer',
    achievements: '/profile',
    eggs: '/',
    pages: `/p/${x.slug || x.id}`,
  })[col] || '/';

function blankFor(fields: Field[]) {
  const o: any = {};
  for (const f of fields) {
    o[f.key] =
      f.type === 'number' ? 0 : f.type === 'bool' ? false : ['list', 'images', 'refs', 'objlist'].includes(f.type) ? [] : f.type === 'object' ? blankFor(f.fields || []) : f.type === 'spoiler' ? null : f.type === 'json' ? {} : '';
  }
  return o;
}

export function CollectionEditor() {
  const { col: colName, id } = useParams();
  const meta = COLLECTION_META[colName!];
  const { col, raw, saveItem, deleteItem, resetItem, discardDraft, isDefault } = useCms();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  if (!meta) return <div>Unknown collection.</div>;
  const items = col(colName!);

  if (id) return <ItemEditor key={id} colName={colName!} id={id} />;

  const list = items.filter((x) => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
  const hasOrder = items.some((x) => typeof x.order === 'number') || (defaults[colName!] || []).some((x) => typeof x.order === 'number');
  const move = async (i: number, d: number) => {
    const a = list[i];
    const b = list[i + d];
    if (!a || !b) return;
    const oa = a.order ?? i;
    const ob = b.order ?? i + d;
    await saveItem(colName!, a.id, { ...strip(a), order: ob === oa ? oa + d : ob }, { silent: true });
    await saveItem(colName!, b.id, { ...strip(b), order: oa }, { silent: true });
  };

  return (
    <div>
      <AdminTitle kicker="Content" title={`${meta.icon} ${meta.label}`}>
        <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240, padding: '10px 14px' }} />
        <button className="btn btn-primary btn-sm" onClick={() => nav(`/admin/c/${colName}/__new`)}>
          + New
        </button>
      </AdminTitle>
      <div style={{ ...adminCard, padding: 0 }}>
        {list.map((x, i) => {
          const r = raw[colName!]?.[x.id];
          const custom = !isDefault(colName!, x.id);
          const img = meta.image?.(x);
          return (
            <div key={x.id} className="row" style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap', gap: 14 }}>
              {meta.image && (
                <div style={{ width: 56, flexShrink: 0 }}>
                  {img ? <MediaThumb url={img} h={44} /> : <div style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px dashed var(--line2)' }} />}
                </div>
              )}
              <Link to={`/admin/c/${colName}/${x.id}`} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.title(x) || x.id}</div>
                <div className="muted mono" style={{ fontSize: 11 }}>
                  {x.id}
                  {meta.sub ? ` · ${meta.sub(x)}` : ''}
                </div>
              </Link>
              {r?._draft && <span className="badge gold">Draft pending</span>}
              {custom ? <span className="badge red">Custom</span> : r && !r._deleted ? <span className="badge">Edited</span> : null}
              {hasOrder && (
                <>
                  <button className="btn btn-xs" disabled={i === 0 || !!q} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button className="btn btn-xs" disabled={i === list.length - 1 || !!q} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                </>
              )}
              <Link className="btn btn-xs" to={viewLink(colName!, x)} target="_blank">
                View
              </Link>
              <Link className="btn btn-xs btn-white" to={`/admin/c/${colName}/${x.id}`}>
                Edit
              </Link>
              {r?._draft && (
                <button className="btn btn-xs" onClick={() => discardDraft(colName!, x.id)}>
                  Discard draft
                </button>
              )}
              {!custom && r && (
                <button
                  className="btn btn-xs"
                  title="Remove your edits and go back to the built-in version"
                  onClick={() => confirm('Restore the built-in version of this item?') && resetItem(colName!, x.id)}
                >
                  Restore
                </button>
              )}
              <button className="btn btn-xs btn-danger" onClick={() => confirm(`Delete “${meta.title(x)}”?`) && deleteItem(colName!, x.id)}>
                Delete
              </button>
            </div>
          );
        })}
        {list.length === 0 && <div className="empty" style={{ margin: 20 }}>Nothing here yet.</div>}
      </div>
      <DeletedItems colName={colName!} />
    </div>
  );
}

function DeletedItems({ colName }: { colName: string }) {
  const { raw, resetItem } = useCms();
  const del = Object.entries(raw[colName] || {}).filter(([, v]: any) => v._deleted);
  if (!del.length) return null;
  return (
    <div style={{ ...adminCard, marginTop: 20 }}>
      <div className="kicker">Deleted items ({del.length})</div>
      {del.map(([id]) => (
        <div key={id} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
          <span className="mono">{id}</span>
          <button className="btn btn-xs" onClick={() => resetItem(colName, id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}

function ItemEditor({ colName, id }: { colName: string; id: string }) {
  const meta = COLLECTION_META[colName];
  const { col, raw, saveItem, discardDraft, deleteItem } = useCms();
  const nav = useNavigate();
  const isNew = id === '__new';
  const existing = col(colName).find((x) => x.id === id);
  const r = raw[colName]?.[id];
  const initial = useMemo(() => {
    if (isNew) return { ...blankFor(meta.fields), order: (col(colName).reduce((m, x) => Math.max(m, x.order || 0), 0) || 0) + 1 };
    return strip({ ...(existing || {}), ...(r?._draft || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const [v, setV] = useState<any>(initial);
  const [newId, setNewId] = useState('');
  useEffect(() => setV(initial), [initial]);
  if (!isNew && !existing) return <div className="muted">Item not found.</div>;

  const finalId = isNew ? slugify(newId || v[meta.idFrom] || 'item').slice(0, 60) : id;
  const save = async (draft: boolean) => {
    let theId = finalId;
    if (isNew && col(colName).some((x) => x.id === theId)) theId = `${theId}-${uid().slice(0, 4)}`;
    await saveItem(colName, theId, { ...v, id: theId }, { draft });
    if (isNew) nav(`/admin/c/${colName}/${theId}`, { replace: true });
  };

  return (
    <div>
      <AdminTitle kicker={meta.label} title={isNew ? 'New item' : meta.title(v) || id}>
        <Link className="btn btn-sm" to={`/admin/c/${colName}`}>
          ← Back
        </Link>
        {!isNew && (
          <Link className="btn btn-sm" to={viewLink(colName, v)} target="_blank">
            View on site ↗
          </Link>
        )}
      </AdminTitle>
      <div style={adminCard}>
        <div className="grid g2" style={{ marginBottom: 10 }}>
          <div className="field">
            <label className="label">ID (used in links)</label>
            {isNew ? <input className="input" placeholder={finalId} value={newId} onChange={(e) => setNewId(e.target.value)} /> : <input className="input mono" value={id} disabled />}
          </div>
          <div className="field">
            <label className="label">Order</label>
            <input className="input" type="number" value={v.order ?? ''} onChange={(e) => setV({ ...v, order: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
        </div>
        <Fields fields={meta.fields} value={v} onChange={setV} />
      </div>
      <div className="glass row" style={{ position: 'sticky', bottom: 16, marginTop: 20, padding: 14, borderRadius: 16, justifyContent: 'space-between', zIndex: 10 }}>
        <div className="row">
          {r?._draft && <span className="badge gold">A draft is pending</span>}
          {!isNew && r?._draft && (
            <button className="btn btn-sm" onClick={() => discardDraft(colName, id)}>
              Discard draft
            </button>
          )}
          {!isNew && (
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                if (!confirm('Delete this item?')) return;
                await deleteItem(colName, id);
                nav(`/admin/c/${colName}`);
              }}
            >
              Delete
            </button>
          )}
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={() => save(true)}>
            Save draft
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => save(false)}>
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================ PAGES BUILDER ================================
const toField = (key: string, type: string, label?: string): Field => {
  if (type.startsWith('select:')) return { key, label, type: 'select', options: type.slice(7).split(',') };
  if (type === 'cards') return { key, label: label || 'Cards', type: 'objlist', fields: [{ key: 'title', type: 'text' }, { key: 'link', type: 'text' }, { key: 'image', type: 'image' }, { key: 'text', type: 'textarea', wide: true }] };
  if (type === 'code') return { key, label, type: 'textarea', wide: true };
  return { key, label, type: type as any, wide: type === 'textarea' };
};

export function PagesBuilder() {
  const { id } = useParams();
  const { col, deleteItem } = useCms();
  const nav = useNavigate();
  const pages = col('pages');
  if (id) return <PageEditor key={id} id={id} />;
  return (
    <div>
      <AdminTitle kicker="Builder" title="🧱 Pages">
        <button className="btn btn-primary btn-sm" onClick={() => nav('/admin/pages/__new')}>
          + New page
        </button>
      </AdminTitle>
      <p className="muted">Build brand-new pages out of blocks (hero, text, images, video, quotes, cards, embeds, custom HTML…). Each page is available at /p/your-slug and can be added to the menu.</p>
      <div style={{ ...adminCard, padding: 0 }}>
        {pages.map((p) => (
          <div key={p.id} className="row" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <Link to={`/admin/pages/${p.id}`} style={{ flex: 1 }}>
              <b>{p.title}</b>
              <div className="mono muted" style={{ fontSize: 11 }}>
                /p/{p.slug || p.id} · {(p.blocks || []).length} blocks
              </div>
            </Link>
            {p.inNav && <span className="badge">In menu</span>}
            {p.published === false && <span className="badge gold">Hidden</span>}
            <Link className="btn btn-xs" to={`/p/${p.slug || p.id}`} target="_blank">
              View
            </Link>
            <Link className="btn btn-xs btn-white" to={`/admin/pages/${p.id}`}>
              Edit
            </Link>
            <button className="btn btn-xs btn-danger" onClick={() => confirm('Delete this page?') && deleteItem('pages', p.id)}>
              Delete
            </button>
          </div>
        ))}
        {pages.length === 0 && <div className="empty" style={{ margin: 20 }}>No pages yet. Create the first one.</div>}
      </div>
    </div>
  );
}

function PageEditor({ id }: { id: string }) {
  const { col, raw, saveItem } = useCms();
  const nav = useNavigate();
  const isNew = id === '__new';
  const existing = col('pages').find((p) => p.id === id);
  const [p, setP] = useState<any>(() => (isNew ? { title: 'New page', slug: '', inNav: false, published: true, blocks: [], order: Date.now() } : strip({ ...existing, ...(raw.pages?.[id]?._draft || {}) })));
  const [open, setOpen] = useState<number | null>(null);
  if (!isNew && !existing) return <div className="muted">Page not found.</div>;
  const blocks: any[] = p.blocks || [];
  const setBlocks = (b: any[]) => setP({ ...p, blocks: b });
  const add = (type: string) => {
    setBlocks([...blocks, { id: uid(), type, props: JSON.parse(JSON.stringify(BLOCK_TYPES[type].defaults)) }]);
    setOpen(blocks.length);
  };
  const move = (i: number, d: number) => {
    const a = [...blocks];
    const [x] = a.splice(i, 1);
    a.splice(i + d, 0, x);
    setBlocks(a);
    setOpen(i + d);
  };
  const save = async (draft: boolean) => {
    const theId = isNew ? slugify(p.slug || p.title) + '-' + uid().slice(0, 4) : id;
    await saveItem('pages', theId, { ...p, id: theId, slug: slugify(p.slug || p.title) }, { draft });
    if (isNew) nav(`/admin/pages/${theId}`, { replace: true });
  };

  return (
    <div>
      <AdminTitle kicker="Page builder" title={p.title || 'Page'}>
        <Link className="btn btn-sm" to="/admin/pages">
          ← Pages
        </Link>
        {!isNew && (
          <Link className="btn btn-sm" to={`/p/${p.slug || id}`} target="_blank">
            Preview ↗
          </Link>
        )}
      </AdminTitle>
      <div style={{ ...adminCard, marginBottom: 20 }}>
        <Fields
          fields={[
            { key: 'title', type: 'text' },
            { key: 'slug', label: 'Address (slug)', type: 'text', help: `The page will be at /p/${slugify(p.slug || p.title)}` },
            { key: 'inNav', label: 'Show in the menu', type: 'bool' },
            { key: 'published', label: 'Published (visible to users)', type: 'bool' },
          ]}
          value={p}
          onChange={setP}
        />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 240px', gap: 20, alignItems: 'start' }}>
        <div>
          {blocks.map((b, i) => {
            const def = BLOCK_TYPES[b.type];
            const isOpen = open === i;
            return (
              <div key={b.id || i} style={{ ...adminCard, padding: 0, marginBottom: 10, borderColor: isOpen ? 'var(--blood)' : undefined }}>
                <div className="row" style={{ padding: '12px 16px', cursor: 'pointer', flexWrap: 'nowrap' }} onClick={() => setOpen(isOpen ? null : i)}>
                  <span style={{ width: 28, fontSize: 18 }}>{def?.icon}</span>
                  <b style={{ flex: 1 }}>
                    {def?.label}{' '}
                    <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                      {String(b.props?.title || b.props?.text || b.props?.label || '').slice(0, 60)}
                    </span>
                  </b>
                  <button className="btn btn-xs" disabled={i === 0} onClick={(e) => (e.stopPropagation(), move(i, -1))}>
                    ↑
                  </button>
                  <button className="btn btn-xs" disabled={i === blocks.length - 1} onClick={(e) => (e.stopPropagation(), move(i, 1))}>
                    ↓
                  </button>
                  <button className="btn btn-xs" onClick={(e) => (e.stopPropagation(), setBlocks([...blocks.slice(0, i + 1), { ...JSON.parse(JSON.stringify(b)), id: uid() }, ...blocks.slice(i + 1)]))}>
                    ⧉
                  </button>
                  <button className="btn btn-xs btn-danger" onClick={(e) => (e.stopPropagation(), setBlocks(blocks.filter((_, j) => j !== i)))}>
                    ✕
                  </button>
                </div>
                {isOpen && def && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <Fields fields={def.fields.map(([k, t, l]) => toField(k, t, l))} value={b.props} onChange={(props) => setBlocks(blocks.map((x, j) => (j === i ? { ...x, props } : x)))} />
                  </div>
                )}
              </div>
            );
          })}
          {blocks.length === 0 && <div className="empty">Add your first block from the panel on the right →</div>}
        </div>
        <div style={{ ...adminCard, position: 'sticky', top: 20 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>
            Add a block
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {Object.entries(BLOCK_TYPES).map(([k, d]) => (
              <button key={k} className="btn btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => add(k)}>
                <span style={{ width: 22 }}>{d.icon}</span> {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="glass row" style={{ position: 'sticky', bottom: 16, marginTop: 20, padding: 14, borderRadius: 16, justifyContent: 'flex-end', zIndex: 10 }}>
        <button className="btn btn-sm" onClick={() => save(true)}>
          Save draft
        </button>
        <button className={cx('btn btn-primary btn-sm')} onClick={() => save(false)}>
          Publish
        </button>
      </div>
    </div>
  );
}

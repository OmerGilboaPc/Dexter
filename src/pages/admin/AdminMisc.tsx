import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { db, ADMIN_EMAIL } from '../../firebase';
import { useCms, stringRegistry } from '../../lib/cms';
import { AdminTitle, adminCard } from './Admin';
import { MediaThumb, kindOf } from '../../components/MediaPicker';
import { Modal } from '../../components/Modal';
import { cx, fmtMinutes, slugify, timeAgo, uid } from '../../lib/util';
import { toast } from '../../lib/bus';

// ================================ MEDIA ================================
export function MediaLibrary() {
  const { col, saveItem, deleteItem } = useCms();
  const media = col('media');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('all');
  const [bulk, setBulk] = useState('');
  const list = media.filter((m) => type === 'all' || (m.type || kindOf(m.url)) === type);
  const add = async (u: string, n?: string) => {
    const nm = n || decodeURIComponent(u.split('/').pop() || 'file');
    const id = slugify(nm).slice(0, 40) + '-' + uid().slice(0, 4);
    await saveItem('media', id, { id, url: u.trim(), name: nm, type: kindOf(u), tags: tags.split(',').map((t) => t.trim()).filter(Boolean), order: Date.now() }, { silent: true });
  };
  return (
    <div>
      <AdminTitle kicker="Cloudflare R2" title="🗂️ Media library" />
      <div className="grid g2" style={{ alignItems: 'start', marginBottom: 24 }}>
        <div style={adminCard}>
          <div className="kicker">Add a file</div>
          <p className="muted" style={{ fontSize: 13 }}>Upload the file to your R2 bucket, copy its public link, and paste it here. Images, videos, audio, .glb models and fonts are all supported.</p>
          <input className="input" placeholder="https://pub-xxxx.r2.dev/file.jpg" value={url} onChange={(e) => setUrl(e.target.value)} style={{ marginBottom: 10 }} />
          <div className="grid g2" style={{ gap: 10 }}>
            <input className="input" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 12 }}
            disabled={!url.trim()}
            onClick={async () => {
              await add(url, name);
              setUrl('');
              setName('');
              toast({ title: 'Added to the library', kind: 'success' });
            }}
          >
            + Add
          </button>
        </div>
        <div style={adminCard}>
          <div className="kicker">Bulk add</div>
          <textarea className="textarea" placeholder="Paste several links, one per line" value={bulk} onChange={(e) => setBulk(e.target.value)} />
          <button
            className="btn btn-sm"
            style={{ marginTop: 10 }}
            disabled={!bulk.trim()}
            onClick={async () => {
              const links = bulk.split('\n').map((x) => x.trim()).filter(Boolean);
              for (const l of links) await add(l);
              setBulk('');
              toast({ title: `${links.length} files added`, kind: 'success' });
            }}
          >
            Add all
          </button>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        {['all', 'image', 'video', 'audio', 'model', 'font'].map((t) => (
          <button key={t} className={cx('chip', type === t && 'on')} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
        <span className="muted" style={{ fontSize: 13 }}>{list.length} files</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
        {list.map((m) => (
          <div key={m.id} style={{ ...adminCard, padding: 10 }}>
            <MediaThumb url={m.url} h={120} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
            <div className="mono muted" style={{ fontSize: 10 }}>
              {m.type} {(m.tags || []).length ? '· ' + m.tags.join(', ') : ''}
            </div>
            <div className="row" style={{ gap: 4, marginTop: 8 }}>
              <button
                className="btn btn-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(m.url);
                  toast('Link copied');
                }}
              >
                Copy link
              </button>
              <a className="btn btn-xs" href={m.url} target="_blank" rel="noreferrer">
                Open
              </a>
              <button className="btn btn-xs btn-danger" onClick={() => confirm('Remove from the library? (The file stays in R2.)') && deleteItem('media', m.id)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================ TEXTS ================================
export function Texts() {
  const { strings, saveString } = useCms();
  const [q, setQ] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const keys = useMemo(() => [...new Set([...stringRegistry.keys(), ...Object.keys(strings)])].sort(), [strings]);
  const list = keys.filter((k) => !q || k.includes(q) || (strings[k] || stringRegistry.get(k) || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <AdminTitle kicker="Copy" title="🔤 Site texts">
        <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260, padding: '10px 14px' }} />
      </AdminTitle>
      <p className="muted">
        Every headline and label on the site. Texts show up here after a page has been opened once. The fastest way to edit is the <b>Edit</b> button on the site itself: click any text with a dashed outline.
      </p>
      <div style={{ ...adminCard, padding: 0 }}>
        {list.map((k) => {
          const def = stringRegistry.get(k) || '';
          const cur = edits[k] ?? strings[k] ?? def;
          const changed = strings[k] != null && strings[k] !== def;
          return (
            <div key={k} style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '240px 1fr auto', gap: 14, alignItems: 'center' }}>
              <div>
                <div className="mono" style={{ fontSize: 12 }}>{k}</div>
                {changed && <span className="badge gold" style={{ marginTop: 4 }}>Edited</span>}
              </div>
              <textarea className="textarea" style={{ minHeight: 44, padding: '10px 12px' }} rows={1} value={cur} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} />
              <div className="row" style={{ gap: 4 }}>
                <button
                  className="btn btn-xs btn-primary"
                  disabled={edits[k] == null}
                  onClick={async () => {
                    await saveString(k, edits[k]);
                    const e = { ...edits };
                    delete e[k];
                    setEdits(e);
                    toast({ title: 'Saved', kind: 'success' }, 1500);
                  }}
                >
                  Save
                </button>
                {changed && (
                  <button className="btn btn-xs" title="Restore default" onClick={() => saveString(k, '')}>
                    ↺
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="empty" style={{ margin: 20 }}>Open a few pages on the site and the texts will appear here.</div>}
      </div>
    </div>
  );
}

// ================================ USERS ================================
export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [view, setView] = useState<any>(null);
  useEffect(() => onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => {}), []);
  const list = users.filter((u) => !q || `${u.username} ${u.email}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
  return (
    <div>
      <AdminTitle kicker="Community" title="👥 Users">
        <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260, padding: '10px 14px' }} />
      </AdminTitle>
      <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Last seen</th>
              <th>Time</th>
              <th>Achievements</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.uid} style={{ opacity: u.blocked ? 0.5 : 1 }}>
                <td>
                  <div className="row" style={{ flexWrap: 'nowrap', gap: 10 }}>
                    <div className="avatar" style={{ width: 32, height: 32 }}>
                      {u.avatar ? <img src={u.avatar} alt="" /> : (u.username || '?')[0]}
                    </div>
                    <b>{u.username}</b>
                    {u.email === ADMIN_EMAIL && <span className="badge red">Admin</span>}
                    {u.blocked && <span className="badge">Blocked</span>}
                  </div>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {u.email}
                </td>
                <td>{timeAgo(u.createdAt)}</td>
                <td>{timeAgo(u.lastSeen)}</td>
                <td>{fmtMinutes(u.totalMinutes)}</td>
                <td>{Object.keys(u.achievements || {}).length}</td>
                <td>
                  <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                    <button className="btn btn-xs" onClick={() => setView(u)}>
                      Details
                    </button>
                    <Link className="btn btn-xs" to={`/profile/${u.uid}`}>
                      Profile
                    </Link>
                    {u.email !== ADMIN_EMAIL && (
                      <button
                        className={cx('btn btn-xs', !u.blocked && 'btn-danger')}
                        onClick={async () => {
                          await setDoc(doc(db, 'users', u.uid), { blocked: !u.blocked }, { merge: true });
                          toast(u.blocked ? 'User unblocked' : 'User blocked');
                        }}
                      >
                        {u.blocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} wide>
        {view && (
          <div>
            <div className="kicker">User file</div>
            <h2 className="display" style={{ fontSize: 48, margin: '6px 0 16px' }}>
              {view.username}
            </h2>
            <div className="grid g3" style={{ marginBottom: 16 }}>
              {[
                [fmtMinutes(view.totalMinutes), 'Time'],
                [Object.keys(view.pages || {}).length, 'Pages'],
                [Object.values(view.watched || {}).filter(Boolean).length, 'Episodes watched'],
              ].map(([v, k]) => (
                <div className="stat" key={k as string}>
                  <div className="v" style={{ fontSize: 38 }}>{v}</div>
                  <div className="k">{k}</div>
                </div>
              ))}
            </div>
            <div className="kicker">Most visited pages</div>
            <div className="mono" style={{ fontSize: 12, lineHeight: 1.9 }}>
              {Object.entries(view.pages || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 12)
                .map(([k, v]: any) => (
                  <div key={k}>
                    {k.replace(/\|/g, '/') || '/'} — {v}
                  </div>
                ))}
            </div>
            <div className="row" style={{ marginTop: 20 }}>
              <button
                className="btn btn-sm btn-danger"
                onClick={async () => {
                  if (!confirm('Reset this user’s progress (achievements, counters, games)?')) return;
                  await setDoc(doc(db, 'users', view.uid), { achievements: {}, counters: {}, triviaBest: {}, spatterBest: 0, cases: {}, eggs: {} }, { merge: true });
                  toast('Progress reset');
                }}
              >
                Reset progress
              </button>
              {view.email !== ADMIN_EMAIL && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={async () => {
                    if (!confirm('Delete this user’s profile? (The sign-in account itself is deleted from the Firebase console.)')) return;
                    await deleteDoc(doc(db, 'users', view.uid));
                    setView(null);
                    toast('Profile deleted');
                  }}
                >
                  Delete profile
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ================================ GALLERY ================================
export function GalleryAdmin() {
  const [photos, setPhotos] = useState<any[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'photos'), orderBy('at', 'desc')), (s) => setPhotos(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), []);
  return (
    <div>
      <AdminTitle kicker="Moderation" title="📸 Gallery" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {photos.map((p) => (
          <div key={p.id} style={{ ...adminCard, padding: 10 }}>
            <img src={p.image} alt="" style={{ width: '100%', borderRadius: 10 }} />
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 13 }}>
                {p.username} · {timeAgo(p.at)}
              </span>
              <button className="btn btn-xs btn-danger" onClick={() => confirm('Delete this photo?') && deleteDoc(doc(db, 'photos', p.id))}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {photos.length === 0 && <div className="empty">No photos yet.</div>}
      </div>
    </div>
  );
}

// ================================ HISTORY ================================
export function History() {
  const { saveItem, replaceSettings, saveString } = useCms();
  const [rows, setRows] = useState<any[]>([]);
  const [view, setView] = useState<any>(null);
  useEffect(() => onSnapshot(query(collection(db, 'history'), orderBy('at', 'desc'), limit(300)), (s) => setRows(s.docs.map((d) => ({ hid: d.id, ...d.data() }))), () => {}), []);
  const restore = async (r: any) => {
    if (!confirm('Restore the version from before this change?')) return;
    if (r.col === 'settings') await replaceSettings(r.before || {});
    else if (r.col === 'strings') await saveString(r.id, r.before ?? '');
    else if (r.before) await saveItem(r.col, r.id, r.before);
    else toast('There is no previous version (this was a new item).');
    setView(null);
  };
  return (
    <div>
      <AdminTitle kicker="Undo anything" title="🕘 Change history" />
      <div style={{ ...adminCard, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Collection</th>
              <th>Item</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hid}>
                <td>{timeAgo(r.at)}</td>
                <td>
                  <span className={cx('badge', r.action === 'delete' && 'red', r.action === 'publish' && 'gold')}>{r.action}</span>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {r.col}
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {r.id}
                </td>
                <td>
                  <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn btn-xs" onClick={() => setView(r)}>
                      Compare
                    </button>
                    <button className="btn btn-xs btn-white" onClick={() => restore(r)}>
                      Restore previous
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty" style={{ margin: 20 }}>No changes yet.</div>}
      </div>
      <Modal open={!!view} onClose={() => setView(null)} wide>
        {view && (
          <div>
            <div className="kicker">
              {view.col} / {view.id}
            </div>
            <div className="grid g2" style={{ marginTop: 14 }}>
              {(['before', 'after'] as const).map((k) => (
                <div key={k}>
                  <div className="label">{k === 'before' ? 'Before' : 'After'}</div>
                  <pre className="mono" style={{ fontSize: 11, background: '#0b0b0f', padding: 14, borderRadius: 10, maxHeight: 460, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(view[k], null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => restore(view)}>
              Restore “before”
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ================================ HELP ================================
export function Help() {
  const rules = `See firestore.rules in the repository`;
  return (
    <div style={{ maxWidth: 920 }}>
      <AdminTitle kicker="Read me first" title="🧭 Setup guide" />
      {[
        ['1. Firestore security rules', 'Firebase Console → Firestore Database → Rules. Paste in the contents of firestore.rules from the repository and click Publish. Without this, the database stays in its default mode and saving won’t work.'],
        ['2. Authorized domain', 'Firebase Console → Authentication → Settings → Authorized domains → Add domain: omergilboapc.github.io'],
        ['3. Sign-in methods', 'Authentication → Sign-in method: Email/Password and Google should both be enabled (you already did this).'],
        ['4. Cloudflare R2', 'In the R2 bucket, turn on Public access (an r2.dev subdomain or a custom domain). Upload a file, copy its public link, and paste it into the Media library or into any image/video field. For 3D models (.glb) and fonts, add a CORS rule in R2 that allows GET from https://omergilboapc.github.io.'],
        ['5. Edit everything', 'Two ways: (a) the Admin Panel: forms for every piece of content, with drafts, publishing, and a change history. (b) The “Edit” button in the site’s top bar: click any text with a dashed outline and type, or use the ✎ buttons to swap images.'],
        ['6. Pages', 'Pages (builder) lets you create brand-new pages out of blocks, at /p/name, and add them to the menu.'],
        ['7. Character models', 'Upload .glb files to R2 and paste their links under Site settings → 3D Models. A rigged model (with a skeleton) can be posed joint by joint in Photo Mode.'],
      ].map(([t, d]) => (
        <div key={t} style={{ ...adminCard, marginBottom: 12 }}>
          <h3 className="display" style={{ fontSize: 28, margin: 0 }}>
            {t}
          </h3>
          <p style={{ margin: '8px 0 0', color: '#cfcac2' }}>{d}</p>
        </div>
      ))}
      <p className="muted mono" style={{ fontSize: 12 }}>{rules}</p>
    </div>
  );
}

// ================================ TEXT STYLES ================================
export function TextStyles() {
  const { styles, saveStyle } = useCms();
  const keys = Object.keys(styles).sort();
  const nice = (k: string) => (k.startsWith('t:') ? `Text · ${k.slice(2)}` : k.startsWith('s:') ? `Settings · ${k.slice(2)}` : k.startsWith('f:') ? `Content · ${k.slice(2).replace(/\//g, ' › ')}` : k);
  return (
    <div>
      <AdminTitle kicker="Typography" title="🎨 Text styles" />
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <b>How to style any text on the site:</b>
        <ol style={{ margin: '8px 0 0', color: '#cfcac2', lineHeight: 1.9 }}>
          <li>Go to the page and press <b>✎ Edit</b> in the top bar.</li>
          <li>Hover over any text with a dashed outline and press the gold <b>🎨 Style</b> button (or right-click the text).</li>
          <li>Change size, position, tilt, slant, color, font, weight, spacing, glow, outline, or hide it. You see the result live.</li>
          <li>Press <b>Save</b>. Everyone sees it immediately.</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0 }}>
          For site-wide sizes (all headings, body text, the home hero), use <Link to="/admin/settings/typography" style={{ color: 'var(--gold)' }}>Site settings → Text sizes</Link>.
        </p>
      </div>
      <div style={{ ...adminCard, padding: 0 }}>
        {keys.length === 0 && <div className="empty" style={{ margin: 20 }}>No custom text styles yet.</div>}
        {keys.map((k) => (
          <div key={k} className="row" style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{nice(k)}</div>
              <div className="mono muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {Object.entries(styles[k] || {})
                  .map(([a, b]) => `${a}: ${b}`)
                  .join(' · ')}
              </div>
            </div>
            <button className="btn btn-xs btn-danger" onClick={() => confirm('Remove this style and restore the original look?') && saveStyle(k, null)}>
              Reset
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

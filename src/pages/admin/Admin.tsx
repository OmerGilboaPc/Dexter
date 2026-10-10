import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { useCms } from '../../lib/cms';
import { Logo } from '../../components/Logo';
import { COLLECTION_META, SETTINGS_SECTIONS } from './schemas';
import { Fields, FieldInput } from './FormFields';
import { CollectionEditor, PagesBuilder } from './AdminContent';
import { MediaLibrary, Texts, Users, History, Help, GalleryAdmin, TextStyles } from './AdminMisc';
import { defaultSettings } from '../../data/site';
import { cx, fmtMinutes, timeAgo, toDate } from '../../lib/util';
import { toast } from '../../lib/bus';

export const adminCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 24 };

export default function Admin() {
  const { isAdmin, profile } = useAuth();
  const { editMode, setEditMode } = useCms();
  const nav = useNavigate();
  if (!isAdmin) return <Navigate to="/" replace />;
  const link = (to: string, label: string, icon: string) => (
    <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => cx('admin-link', isActive && 'on')}>
      <span style={{ width: 22, display: 'inline-block' }}>{icon}</span> {label}
    </NavLink>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', minHeight: '100vh' }}>
      <style>{`
        .admin-link{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;color:#bdb8b0;font-size:14px;transition:all .2s}
        .admin-link:hover{background:rgba(255,255,255,.05);color:#fff}
        .admin-link.on{background:rgba(217,15,30,.18);color:#fff;box-shadow:inset 2px 0 0 var(--blood-bright)}
        .admin-h{font-family:var(--f-mono);font-size:10px;letter-spacing:.3em;color:var(--muted);margin:22px 12px 8px;text-transform:uppercase}
      `}</style>
      <aside style={{ borderRight: '1px solid var(--line)', background: 'var(--bg2)', padding: '22px 14px', position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px' }}>
          <Logo height={22} />
          <span className="badge red">ADMIN</span>
        </Link>
        <div className="admin-h">Overview</div>
        {link('/admin', 'Dashboard', '📊')}
        {link('/admin/help', 'Setup guide', '🧭')}
        <div className="admin-h">Site</div>
        {link('/admin/settings', 'Site settings', '⚙️')}
        {link('/admin/pages', 'Pages (builder)', '🧱')}
        {link('/admin/media', 'Media library', '🗂️')}
        {link('/admin/texts', 'Site texts', '🔤')}
        {link('/admin/styles', 'Styles', '🎨')}
        <div className="admin-h">Content</div>
        {Object.entries(COLLECTION_META)
          .filter(([k]) => k !== 'media')
          .map(([k, m]) => link(`/admin/c/${k}`, m.label, m.icon))}
        <div className="admin-h">Community</div>
        {link('/admin/users', 'Users', '👥')}
        {link('/admin/gallery', 'Gallery', '📸')}
        {link('/admin/history', 'Change history', '🕘')}
        <div style={{ marginTop: 24, padding: '0 8px', display: 'grid', gap: 8 }}>
          <button
            className={cx('btn btn-sm', editMode && 'btn-primary')}
            onClick={() => {
              setEditMode(!editMode);
              if (!editMode) nav('/');
            }}
          >
            ✎ {editMode ? 'Edit mode is on' : 'Edit on the site'}
          </button>
          <Link to="/" className="btn btn-sm">
            ← Back to site
          </Link>
          <div className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
            Signed in as {profile?.username}
          </div>
        </div>
      </aside>
      <main style={{ padding: '34px 40px 80px', minWidth: 0 }}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="help" element={<Help />} />
          <Route path="settings" element={<SiteSettings />} />
          <Route path="settings/:section" element={<SiteSettings />} />
          <Route path="pages" element={<PagesBuilder />} />
          <Route path="pages/:id" element={<PagesBuilder />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="texts" element={<Texts />} />
          <Route path="styles" element={<TextStyles />} />
          <Route path="c/:col" element={<CollectionEditor />} />
          <Route path="c/:col/:id" element={<CollectionEditor />} />
          <Route path="users" element={<Users />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function AdminTitle({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end', marginBottom: 26 }}>
      <div>
        <div className="kicker red">{kicker}</div>
        <h1 className="display" style={{ fontSize: 58, margin: '6px 0 0' }}>
          {title}
        </h1>
      </div>
      <div className="row">{children}</div>
    </div>
  );
}

// ================================ DASHBOARD ================================
function Dashboard() {
  const { raw, seedAll, settings, col } = useCms();
  const [users, setUsers] = useState<any[]>([]);
  const [photos, setPhotos] = useState(0);
  const [scores, setScores] = useState(0);
  const [seeding, setSeeding] = useState(false);
  useEffect(() => onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => {}), []);
  useEffect(() => onSnapshot(collection(db, 'photos'), (s) => setPhotos(s.size), () => {}), []);
  useEffect(() => onSnapshot(collection(db, 'scores'), (s) => setScores(s.size), () => {}), []);

  const now = Date.now();
  const active24 = users.filter((u) => toDate(u.lastSeen) && now - toDate(u.lastSeen)!.getTime() < 86400000).length;
  const activeNow = users.filter((u) => toDate(u.lastSeen) && now - toDate(u.lastSeen)!.getTime() < 3 * 60000).length;
  const minutes = users.reduce((a, u) => a + (u.totalMinutes || 0), 0);
  const pages = useMemo(() => {
    const m: Record<string, number> = {};
    users.forEach((u) => Object.entries(u.pages || {}).forEach(([k, v]) => (m[k] = (m[k] || 0) + (v as number))));
    return Object.entries(m)
      .map(([k, v]) => [k.replace(/\|/g, '/') || '/', v] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [users]);
  const signups = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * 86400000);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, n: 0, key: d.toDateString() };
    });
    users.forEach((u) => {
      const d = toDate(u.createdAt);
      if (!d) return;
      const x = days.find((x) => x.key === d.toDateString());
      if (x) x.n++;
    });
    return days;
  }, [users, now]);
  const [lastVisit] = useState(() => {
    try {
      return Number(localStorage.getItem('dexter-admin-last') || 0);
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('dexter-admin-last', String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);
  const newUsers = users.filter((u) => (toDate(u.createdAt)?.getTime() || 0) > lastVisit);
  const [notif, setNotif] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const maxPage = Math.max(1, ...pages.map((p) => p[1]));
  const maxSign = Math.max(1, ...signups.map((d) => d.n));
  const seeded = Object.keys(raw).some((k) => Object.keys(raw[k] || {}).length > 0);

  const checklist: [boolean, string, string][] = [
    [seeded, 'Seed the database (copies all content to Firestore)', ''],
    [!!settings.brand.logoUrl, 'Upload a logo', '/admin/settings/brand'],
    [!!(settings.hero.image || settings.hero.video), 'Choose a home hero image', '/admin/settings/hero'],
    [!!settings.trailer.url, 'Add the trailer', '/admin/settings/trailer'],
    [(settings.music.tracks || []).length > 0, 'Add background music', '/admin/settings/music'],
    [(settings.avatars || []).length > 0, 'Upload profile pictures', '/admin/settings/avatars'],
    [col('characters').every((c) => c.portrait || c.heroImage), 'Add character images', '/admin/c/characters'],
  ];

  return (
    <div>
      <AdminTitle kicker="Control room" title="Dashboard">
        {notif !== 'granted' && typeof Notification !== 'undefined' && (
          <button className="btn btn-sm" onClick={async () => setNotif(await Notification.requestPermission())}>
            🔔 Enable sign-up notifications
          </button>
        )}
      </AdminTitle>
      {lastVisit > 0 && newUsers.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 20, borderColor: 'rgba(217,15,30,.45)', background: 'rgba(217,15,30,.08)' }}>
          <b>🩸 {newUsers.length} new {newUsers.length === 1 ? 'user' : 'users'} since your last visit:</b>{' '}
          {newUsers.map((u) => u.username).join(', ')}
        </div>
      )}
      <div className="grid g4" style={{ marginBottom: 24 }}>
        {[
          [users.length, 'Users'],
          [activeNow, 'Online now'],
          [active24, 'Active in the last 24h'],
          [fmtMinutes(minutes), 'Total time on site'],
          [fmtMinutes(users.length ? minutes / users.length : 0), 'Average per user'],
          [photos, 'Gallery photos'],
          [scores, 'Games played'],
          [col('victims').length, 'Slides in the box'],
        ].map(([v, k]) => (
          <div key={k as string} className="stat">
            <div className="v">{v}</div>
            <div className="k">{k}</div>
          </div>
        ))}
      </div>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div style={adminCard}>
          <div className="kicker">Getting started</div>
          {checklist.map(([ok, label, to]) => (
            <div key={label} className="row" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <span>
                {ok ? '✅' : '⬜'} {label}
              </span>
              {!ok &&
                (to ? (
                  <Link className="btn btn-xs" to={to}>
                    Go
                  </Link>
                ) : (
                  <button
                    className="btn btn-xs btn-primary"
                    disabled={seeding}
                    onClick={async () => {
                      setSeeding(true);
                      await seedAll();
                      setSeeding(false);
                    }}
                  >
                    {seeding ? 'Seeding…' : 'Seed now'}
                  </button>
                ))}
            </div>
          ))}
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>
            Seeding is optional: the site already shows all built-in content, and any edit you make is saved to Firestore automatically.
          </p>
        </div>
        <div style={adminCard}>
          <div className="kicker">Sign-ups · last 14 days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, marginTop: 16 }}>
            {signups.map((d) => (
              <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: 10 }}>{d.n || ''}</span>
                <div style={{ width: '100%', height: `${(d.n / maxSign) * 120}px`, minHeight: 2, background: 'var(--blood)', borderRadius: 4 }} />
                <span className="mono muted" style={{ fontSize: 9 }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={adminCard}>
          <div className="kicker">Most visited pages</div>
          {pages.length === 0 && <p className="muted">No data yet.</p>}
          {pages.map(([p, n]) => (
            <div key={p} style={{ marginTop: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                <span className="mono">{p}</span>
                <span className="mono muted">{n}</span>
              </div>
              <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,.06)', marginTop: 4 }}>
                <div style={{ width: `${(n / maxPage) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--gold)' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={adminCard}>
          <div className="kicker">Recently active</div>
          {[...users]
            .sort((a, b) => (toDate(b.lastSeen)?.getTime() || 0) - (toDate(a.lastSeen)?.getTime() || 0))
            .slice(0, 8)
            .map((u) => (
              <div key={u.uid} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span>
                  <b>{u.username}</b> <span className="muted" style={{ fontSize: 12 }}>{u.email}</span>
                </span>
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {timeAgo(u.lastSeen)} · {fmtMinutes(u.totalMinutes)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ================================ SITE SETTINGS ================================
function SiteSettings() {
  const { settings, replaceSettings } = useCms();
  const navigate = useNavigate();
  const section = useParams().section || 'brand';
  const sec = SETTINGS_SECTIONS.find((s) => s.id === section) || SETTINGS_SECTIONS[0];
  const [draft, setDraft] = useState<any>(() => JSON.parse(JSON.stringify(settings)));
  useEffect(() => setDraft(JSON.parse(JSON.stringify(settings))), [settings]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const setSec = (v: any) => setDraft((d: any) => ({ ...d, [sec.id]: v }));

  return (
    <div>
      <AdminTitle kicker="Global" title="Site settings">
        {dirty && <span className="badge gold">Unsaved changes</span>}
        <button className="btn btn-sm" disabled={!dirty} onClick={() => setDraft(JSON.parse(JSON.stringify(settings)))}>
          Revert
        </button>
        <button className="btn btn-primary btn-sm" disabled={!dirty} onClick={() => replaceSettings(draft)}>
          Save & publish
        </button>
      </AdminTitle>
      <div className="row" style={{ gap: 6, marginBottom: 24 }}>
        {SETTINGS_SECTIONS.map((s) => (
          <button key={s.id} className={cx('chip', sec.id === s.id && 'on')} onClick={() => navigate(`/admin/settings/${s.id}`)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>
      <div style={adminCard}>
        {sec.id === 'nav' ? (
          <NavEditor value={draft.nav} onChange={(v) => setDraft((d: any) => ({ ...d, nav: v }))} />
        ) : sec.id === 'avatars' ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              These images are the profile pictures users can choose from when they sign up and in their settings.
            </p>
            <FieldInput f={{ key: 'avatars', type: 'images' }} value={draft.avatars} onChange={(v) => setDraft((d: any) => ({ ...d, avatars: v }))} />
          </>
        ) : (
          <Fields fields={sec.fields} value={draft[sec.id]} onChange={setSec} />
        )}
        <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (!confirm(`Reset “${sec.label}” to the default values?`)) return;
              setDraft((d: any) => ({ ...d, [sec.id]: JSON.parse(JSON.stringify((defaultSettings as any)[sec.id])) }));
              toast('Restored to default. Remember to save.');
            }}
          >
            Reset section to default
          </button>
          <button className="btn btn-primary" disabled={!dirty} onClick={() => replaceSettings(draft)}>
            Save & publish
          </button>
        </div>
      </div>
    </div>
  );
}

function NavEditor({ value, onChange }: { value: any[]; onChange: (v: any[]) => void }) {
  const { col } = useCms();
  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        “Main” links appear in the top bar. “Explore” and “Play” appear in the More menu. Custom pages with “show in menu” turned on are added automatically.
      </p>
      <FieldInput
        f={{
          key: 'nav',
          type: 'objlist',
          fields: [
            { key: 'label', type: 'text' },
            { key: 'to', label: 'Link', type: 'text' },
            { key: 'group', type: 'select', options: [['main', 'Main'], ['explore', 'Explore'], ['play', 'Play']] },
            { key: 'enabled', type: 'bool' },
          ],
        }}
        value={value}
        onChange={onChange}
      />
      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Available links: / · /series · /seasons · /characters · /villains · /kill-count · /kill-room · /quotes · /timeline · /map · /code · /behind-the-scenes · /trailer · /games/trivia · /games/quiz · /games/blood-spatter · /games/catch-the-killer · /gallery · /leaderboard
        {col('pages').map((p) => ` · /p/${p.slug || p.id}`)}
      </div>
    </div>
  );
}

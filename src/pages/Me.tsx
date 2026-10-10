import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, Profile as P } from '../lib/auth';
import { useCms } from '../lib/cms';
import { Visual } from '../components/Visual';
import { T } from '../components/Editable';
import { Reveal } from '../components/Chrome';
import { AvatarPicker, FavoritePicker } from './auth/Auth';
import { cx, fmtMinutes, initials, timeAgo } from '../lib/util';
import { toast } from '../lib/bus';
import { music } from '../lib/sound';

export function Avatar({ p, size = 38 }: { p: any; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {p?.avatar ? <img src={p.avatar} alt="" /> : initials(p?.username || '?')}
    </div>
  );
}

// ================================ PROFILE ================================
export function Profile() {
  const { uid } = useParams();
  const { profile: me } = useAuth();
  const { col, item } = useCms();
  const [other, setOther] = useState<P | null>(null);
  useEffect(() => {
    if (uid && uid !== me?.uid) getDoc(doc(db, 'users', uid)).then((s) => setOther(s.exists() ? ({ uid, ...(s.data() as any) } as P) : null));
  }, [uid, me?.uid]);
  const p = uid && uid !== me?.uid ? other : me;
  if (!p) return <div className="page container" style={{ paddingTop: 80 }}>Loading…</div>;
  const isMe = p.uid === me?.uid;
  const ach = col('achievements');
  const unlocked = ach.filter((a) => p.achievements?.[a.id]);
  const fav = item('characters', p.favorite);
  const quizChar = p.quizResult ? item('characters', p.quizResult) : null;
  const watchedN = Object.values(p.watched || {}).filter(Boolean).length;
  const stats: [string | number, string][] = [
    [fmtMinutes(p.totalMinutes || 0), 'Time on site'],
    [Object.keys(p.pages || {}).length, 'Pages explored'],
    [`${unlocked.length}/${ach.length}`, 'Achievements'],
    [watchedN, 'Episodes watched'],
    [p.triviaBest?.dark ?? p.triviaBest?.medium ?? p.triviaBest?.easy ?? '—', 'Best trivia score'],
    [p.spatterBest ?? '—', 'Best spatter score'],
    [Object.keys(p.cases || {}).length, 'Cases solved'],
    [Object.keys((p as any).eggs || {}).length, 'Easter eggs'],
  ];
  return (
    <div className="page">
      <section style={{ position: 'relative', padding: '80px 0 60px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <Visual src={fav?.heroImage} seed={'profile-' + p.uid} accent={fav?.color} mode="none" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,7,10,.6), var(--bg))' }} />
        <div className="container" style={{ position: 'relative', display: 'flex', gap: 34, alignItems: 'center' }}>
          <Avatar p={p} size={140} />
          <div>
            <div className="kicker red">Miami Metro ID · {p.uid.slice(0, 8).toUpperCase()}</div>
            <h1 className="display" style={{ fontSize: 'clamp(60px, 8vw, 120px)', margin: '6px 0 0' }}>
              {p.username}
            </h1>
            <div className="row">
              {fav && <span className="badge gold">♥ {fav.name}</span>}
              {quizChar && <span className="badge red">Personality: {quizChar.name}</span>}
              <span className="badge">Joined {timeAgo(p.createdAt)}</span>
            </div>
          </div>
          <div className="spacer" />
          {isMe && (
            <Link to="/settings" className="btn">
              ⚙ Edit profile
            </Link>
          )}
        </div>
      </section>
      <div className="container">
        <div className="grid g4" style={{ marginBottom: 60 }}>
          {stats.map(([v, k], i) => (
            <Reveal key={k} delay={i * 0.04}>
              <div className="stat">
                <div className="v">{v}</div>
                <div className="k">{k}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <h2 className="display h-sm">Achievements</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14, marginTop: 20 }}>
          {ach.map((a) => {
            const on = !!p.achievements?.[a.id];
            return (
              <div key={a.id} className="card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center', opacity: on ? 1 : 0.45, borderColor: on ? 'rgba(217,164,65,.4)' : undefined, background: on ? 'linear-gradient(135deg, rgba(60,40,10,.4), var(--surface))' : undefined }}>
                <div style={{ fontSize: 30, filter: on ? 'none' : 'grayscale(1)' }}>{on ? a.icon : '🔒'}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {a.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================================ SETTINGS ================================
export function Settings() {
  const { profile, updateProfile, reset, user, signOut } = useAuth();
  const { col } = useCms();
  const [username, setUsername] = useState(profile?.username || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [favorite, setFavorite] = useState(profile?.favorite || 'dexter');
  const s = profile?.settings || {};
  const mode = s.spoilerMode || 'off';
  const progress = s.progress || {};
  const series = col('series');
  const seasons = col('seasons');
  const setS = (patch: any) => updateProfile({ settings: { ...s, ...patch } });

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60, maxWidth: 1100 }}>
        <T k="settings.kicker" d="Your preferences" as="div" className="kicker red" />
        <T k="settings.title" d="Settings" as="h1" className="display h-lg" style={{ margin: '12px 0 40px' }} />

        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: 38, margin: '0 0 6px' }}>
            🚫 No-Spoiler Mode
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Choose how the site knows how far you have watched. Anything beyond that point is blurred, with a warning you can click to reveal it.
          </p>
          <div className="tabs" style={{ marginBottom: 22 }}>
            {[
              ['off', 'Off'],
              ['season', 'By season'],
              ['episode', 'By exact episode'],
              ['watched', 'By episodes I marked'],
            ].map(([k, l]) => (
              <button key={k} className={cx('tab', mode === k && 'on')} onClick={() => setS({ spoilerMode: k })}>
                {l}
              </button>
            ))}
          </div>
          {(mode === 'season' || mode === 'episode') && (
            <div className="grid g2">
              {series.map((ser) => {
                const list = seasons.filter((x) => x.series === ser.id);
                const p = progress[ser.id] || { season: 0, episode: 0 };
                const curSeason = list.find((x) => x.number === p.season);
                return (
                  <div key={ser.id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, color: ser.theme?.accent2 }}>{ser.name}</div>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <select className="select" value={p.season} onChange={(e) => setS({ progress: { ...progress, [ser.id]: { season: Number(e.target.value), episode: mode === 'episode' ? 1 : 0 } } })}>
                        <option value={0}>Haven’t started</option>
                        {list.map((x) => (
                          <option key={x.id} value={x.number}>
                            {mode === 'season' ? `Finished ${x.title}` : x.title}
                          </option>
                        ))}
                      </select>
                      {mode === 'episode' && p.season > 0 && (
                        <select className="select" value={p.episode} onChange={(e) => setS({ progress: { ...progress, [ser.id]: { season: p.season, episode: Number(e.target.value) } } })}>
                          {(curSeason?.episodes || []).map((e: any) => (
                            <option key={e.n} value={e.n}>
                              Up to episode {e.n}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {mode === 'watched' && (
            <p style={{ margin: 0 }}>
              Open any season and use <b>Mark watched</b> on each episode. The site will reveal everything up to the furthest episode you’ve marked in each series.{' '}
              <Link to="/seasons" style={{ color: 'var(--blood-bright)' }}>
                Go to seasons →
              </Link>
            </p>
          )}
        </div>

        <div className="grid g2" style={{ alignItems: 'start' }}>
          <div className="card card-pad">
            <h2 className="display" style={{ fontSize: 34, margin: '0 0 16px' }}>
              Profile
            </h2>
            <div className="field">
              <label className="label">Username</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Profile picture</label>
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>
            <div className="field">
              <label className="label">Favorite character</label>
              <FavoritePicker value={favorite} onChange={setFavorite} />
            </div>
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (username.trim().length < 2) return;
                await updateProfile({ username: username.trim().slice(0, 32), avatar, favorite });
                toast({ title: 'Profile updated', kind: 'success' });
              }}
            >
              Save
            </button>
          </div>
          <div className="card card-pad">
            <h2 className="display" style={{ fontSize: 34, margin: '0 0 16px' }}>
              Sound & account
            </h2>
            {[
              ['sfx', 'Sound effects'],
              ['music', 'Background music'],
            ].map(([k, l]) => {
              const on = (s as any)[k] !== false;
              return (
                <div key={k} className="row" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{l}</span>
                  <button
                    className={cx('toggle', on && 'on')}
                    onClick={() => {
                      setS({ [k]: !on });
                      if (k === 'music') !on ? music.play() : music.pause();
                    }}
                  />
                </div>
              );
            })}
            <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
              {user?.providerData.some((p) => p.providerId === 'password') && (
                <button
                  className="btn"
                  onClick={async () => {
                    await reset(user!.email!);
                    toast({ title: 'Email sent', text: 'Check your inbox to reset your password' });
                  }}
                >
                  Send password reset email
                </button>
              )}
              <button className="btn btn-danger" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================ LEADERBOARD ================================
export function Leaderboard() {
  const [scores, setScores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState('trivia-dark');
  useEffect(() => onSnapshot(collection(db, 'scores'), (s) => setScores(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), []);
  useEffect(() => onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => {}), []);
  const tabs = [
    ['trivia-dark', 'Trivia · Dark Passenger'],
    ['trivia-medium', 'Trivia · Medium'],
    ['trivia-easy', 'Trivia · Easy'],
    ['spatter', 'Blood Spatter'],
    ['achievements', 'Achievements'],
    ['time', 'Time on site'],
  ];
  const rows = useMemo(() => {
    if (tab === 'achievements') return users.map((u) => ({ uid: u.uid, username: u.username, avatar: u.avatar, score: Object.keys(u.achievements || {}).length })).sort((a, b) => b.score - a.score);
    if (tab === 'time') return users.map((u) => ({ uid: u.uid, username: u.username, avatar: u.avatar, score: u.totalMinutes || 0, label: fmtMinutes(u.totalMinutes || 0) })).sort((a, b) => b.score - a.score);
    const [game, level] = tab.split('-');
    const best = new Map<string, any>();
    scores.filter((s) => s.game === game && (!level || s.level === level)).forEach((s) => {
      const cur = best.get(s.uid);
      if (!cur || s.score > cur.score) best.set(s.uid, s);
    });
    return [...best.values()].sort((a, b) => b.score - a.score);
  }, [tab, scores, users]);
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60, maxWidth: 1100 }}>
        <T k="lb.kicker" d="The best analysts in the department" as="div" className="kicker red" />
        <T k="lb.title" d="Leaderboard" as="h1" className="display h-lg" style={{ margin: '12px 0 30px' }} />
        <div className="row" style={{ marginBottom: 30 }}>
          {tabs.map(([k, l]) => (
            <button key={k} className={cx('chip', tab === k && 'on')} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <div className="empty">Nobody’s here yet. Be the first.</div>
        ) : (
          <div className="card">
            {rows.slice(0, 50).map((r, i) => (
              <Link key={r.uid + i} to={`/profile/${r.uid}`} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 22px', borderBottom: '1px solid var(--line)', background: i < 3 ? `rgba(193,18,31,${0.14 - i * 0.04})` : undefined }}>
                <div className="display" style={{ fontSize: 40, width: 56, color: i === 0 ? 'var(--gold)' : i < 3 ? '#fff' : 'var(--muted)' }}>
                  {i + 1}
                </div>
                <Avatar p={r} size={44} />
                <div style={{ flex: 1, fontWeight: 600, fontSize: 17 }}>{r.username || 'Anonymous'}</div>
                <div className="display" style={{ fontSize: 36 }}>
                  {r.label ?? r.score}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================ GALLERY ================================
export function Gallery() {
  const { user, isAdmin } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [lb, setLb] = useState<any>(null);
  useEffect(() => onSnapshot(query(collection(db, 'photos'), orderBy('at', 'desc')), (s) => setPhotos(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), []);
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60 }}>
        <T k="gallery.kicker" d="Taken in Photo Mode" as="div" className="kicker red" />
        <T k="gallery.title" d="The Gallery" as="h1" className="display h-lg" style={{ margin: '12px 0 20px' }} />
        <p className="lead muted">
          Photos the community took in the Kill Room.{' '}
          <Link to="/kill-room" style={{ color: 'var(--blood-bright)' }}>
            Take your own →
          </Link>
        </p>
        {photos.length === 0 ? (
          <div className="empty" style={{ marginTop: 40 }}>
            No photos yet. Go into the Kill Room, press P, and share.
          </div>
        ) : (
          <div style={{ columns: '3 340px', gap: 16, marginTop: 40 }}>
            {photos.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ breakInside: 'avoid', marginBottom: 16, position: 'relative' }} className="card">
                <img src={p.image} alt="" onClick={() => setLb(p)} style={{ width: '100%', cursor: 'zoom-in' }} />
                <div className="row" style={{ padding: '12px 14px', justifyContent: 'space-between' }}>
                  <Link to={`/profile/${p.uid}`} className="row" style={{ gap: 10 }}>
                    <Avatar p={p} size={28} />
                    <span style={{ fontSize: 14 }}>{p.username}</span>
                  </Link>
                  <span className="mono muted" style={{ fontSize: 11 }}>
                    {p.scene} · {timeAgo(p.at)}
                  </span>
                </div>
                {(p.uid === user?.uid || isAdmin) && (
                  <button
                    className="btn btn-xs btn-danger"
                    style={{ position: 'absolute', top: 10, right: 10, background: '#000' }}
                    onClick={async () => {
                      if (!confirm('Delete this photo?')) return;
                      await deleteDoc(doc(db, 'photos', p.id));
                    }}
                  >
                    Delete
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {lb && (
          <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLb(null)}>
            <img src={lb.image} alt="" style={{ maxWidth: '94vw', maxHeight: '90vh', borderRadius: 12 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

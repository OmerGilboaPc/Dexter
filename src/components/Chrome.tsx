import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../lib/cms';
import { useAuth } from '../lib/auth';
import { Logo } from './Logo';
import { music, musicStore, sfx } from '../lib/sound';
import { useStore, eggStore } from '../lib/bus';
import { cx, initials } from '../lib/util';
import { Visual } from './Visual';
import { T } from './Editable';

// ======================= Theme injector =======================
const loadedFonts = new Set<string>();
function ensureGoogleFont(family: string) {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const builtIn = ['Bebas Neue', 'Inter', 'Cormorant Garamond', 'Special Elite', 'JetBrains Mono'];
  if (builtIn.includes(family)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(l);
}

export function ThemeInjector() {
  const { settings } = useCms();
  useEffect(() => {
    const r = document.documentElement.style;
    const t = settings.theme;
    r.setProperty('--bg', t.bg);
    r.setProperty('--bg2', t.bg2);
    r.setProperty('--surface', t.surface);
    r.setProperty('--text', t.text);
    r.setProperty('--muted', t.muted);
    r.setProperty('--blood', t.blood);
    r.setProperty('--blood-bright', t.bloodBright);
    r.setProperty('--gold', t.gold);
    const f = settings.fonts;
    [f.display, f.body, f.serif, f.mono, f.typewriter].forEach(ensureGoogleFont);
    let custom = '';
    if (f.customFontUrl && f.customFontName) {
      let el = document.getElementById('custom-font-face') as HTMLStyleElement;
      if (!el) {
        el = document.createElement('style');
        el.id = 'custom-font-face';
        document.head.appendChild(el);
      }
      el.textContent = `@font-face{font-family:'${f.customFontName}';src:url('${f.customFontUrl}');font-display:swap;}`;
      custom = `'${f.customFontName}', `;
    }
    const use = (slot: string) => (custom && f.useCustomFontFor === slot ? custom : '');
    r.setProperty('--f-display', `${use('display')}'${f.display}', Impact, sans-serif`);
    r.setProperty('--f-body', `${use('body')}'${f.body}', system-ui, sans-serif`);
    r.setProperty('--f-serif', `${use('serif')}'${f.serif}', Georgia, serif`);
    r.setProperty('--f-mono', `'${f.mono}', ui-monospace, monospace`);
    r.setProperty('--f-type', `'${f.typewriter}', 'Courier New', monospace`);
    const ty: any = (settings as any).typography || {};
    r.setProperty('--ds', String(ty.headingScale ?? 1));
    r.setProperty('--bs', String(ty.bodyScale ?? 1));
    r.setProperty('--hs', String(ty.heroScale ?? 1));
    r.setProperty('--hls', `${ty.headingLetterSpacing ?? 0.02}em`);
    document.title = settings.brand.siteName || 'DEXTER';
  }, [settings]);
  return null;
}

// ======================= Page transition =======================
export function PageTransition() {
  const { settings } = useCms();
  const loc = useLocation();
  const first = useRef(true);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!settings.features.transitions) return;
    sfx.whoosh();
    setKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);
  if (!settings.features.transitions || key === 0) return null;
  const ease = [0.76, 0, 0.24, 1] as any;
  return (
    <div className="transition-layer" key={key}>
      <motion.div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50.5%', background: '#050506' }} initial={{ y: 0 }} animate={{ y: '-101%' }} transition={{ duration: 0.85, delay: 0.32, ease }} />
      <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50.5%', background: '#050506' }} initial={{ y: 0 }} animate={{ y: '101%' }} transition={{ duration: 0.85, delay: 0.32, ease }} />
      <motion.div
        style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, marginTop: -1, background: 'var(--blood-bright)', boxShadow: '0 0 24px 4px rgba(255,42,54,.7)', transformOrigin: 'left center' }}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 0.75, times: [0, 0.45, 1], ease }}
      />
      <motion.div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -140%)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0] }} transition={{ duration: 0.6, times: [0, 0.3, 1] }}>
        <Logo height={22} />
      </motion.div>
    </div>
  );
}

// ======================= Music player =======================
export function MusicPlayer() {
  const s = useStore(musicStore);
  const [open, setOpen] = useState(false);
  if (!s.tracks.length || !s.enabled) return null;
  const track = s.tracks[s.index];
  return (
    <motion.div
      className="glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ position: 'fixed', left: 22, bottom: 22, zIndex: 950, borderRadius: 999, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 20px 50px -15px rgba(0,0,0,.9)' }}
    >
      <button className="btn btn-icon btn-sm" style={{ width: 36, height: 36, background: s.playing ? 'var(--blood)' : undefined, borderColor: s.playing ? 'var(--blood)' : undefined }} onClick={() => music.toggle()} aria-label="Play/Pause">
        {s.playing ? '❚❚' : '▶'}
      </button>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, width: 18 }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            style={{ width: 3, background: 'var(--blood-bright)', borderRadius: 2, display: 'block' }}
            animate={s.playing ? { height: [4, 14, 6, 16, 5] } : { height: 3 }}
            transition={{ duration: 1 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{ width: 150, overflow: 'hidden' }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.25em', color: 'var(--muted)' }}>
                NOW PLAYING
              </div>
              <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track?.title || 'Untitled'}</div>
            </div>
            {s.tracks.length > 1 && (
              <>
                <button className="btn btn-icon btn-xs" style={{ width: 30, height: 30 }} onClick={() => music.prev()}>
                  ⏮
                </button>
                <button className="btn btn-icon btn-xs" style={{ width: 30, height: 30 }} onClick={() => music.next()}>
                  ⏭
                </button>
              </>
            )}
            <span style={{ fontSize: 14 }}>{s.volume === 0 ? '🔇' : '🔊'}</span>
            <input type="range" min={0} max={1} step={0.01} value={s.volume} onChange={(e) => music.setVolume(Number(e.target.value))} style={{ width: 90, marginRight: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ======================= Nav =======================
export function Nav({ onSearch }: { onSearch: () => void }) {
  const { settings, col, editMode, setEditMode } = useCms();
  const { profile, isAdmin, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const logoClicks = useRef<number[]>([]);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 30);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => {
    setMega(false);
    setMenu(false);
  }, [loc.pathname]);

  const items = settings.nav.filter((n) => n.enabled);
  const main = items.filter((n) => n.group === 'main');
  const explore = items.filter((n) => n.group === 'explore');
  const play = items.filter((n) => n.group === 'play');
  const custom = col('pages').filter((p) => p.inNav && p.published !== false);

  const onLogo = () => {
    const now = Date.now();
    logoClicks.current = [...logoClicks.current.filter((t) => now - t < 2500), now];
    if (logoClicks.current.length >= 7) {
      logoClicks.current = [];
      eggStore.set({ trigger: 'logo' });
    }
  };

  return (
    <header className={cx('nav', (scrolled || mega) && 'scrolled')} onMouseLeave={() => setMega(false)}>
      <div className="container">
        <Link to="/" onClick={onLogo} style={{ display: 'flex', alignItems: 'center' }}>
          <Logo height={24} />
        </Link>
        <nav className="nav-links">
          {main.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('nav-link', isActive && 'active')} onMouseEnter={() => setMega(false)}>
              {n.label}
            </NavLink>
          ))}
          {(explore.length > 0 || play.length > 0 || custom.length > 0) && (
            <button className={cx('nav-link', mega && 'active')} onMouseEnter={() => setMega(true)} onClick={() => setMega(!mega)}>
              More ▾
            </button>
          )}
        </nav>
        <div className="spacer" />
        <button className="btn btn-sm" onClick={onSearch} style={{ gap: 14, paddingRight: 10 }}>
          ⌕ Search <span className="kbd">Ctrl K</span>
        </button>
        {isAdmin && (
          <button className={cx('btn btn-sm', editMode && 'btn-primary')} onClick={() => setEditMode(!editMode)} title="Inline Edit Mode">
            ✎ {editMode ? 'Editing' : 'Edit'}
          </button>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(!menu)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar">{profile?.avatar ? <img src={profile.avatar} alt="" /> : initials(profile?.username || '?')}</div>
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div className="dropdown glass" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
                  <b>{profile?.username}</b>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {profile?.email}
                  </div>
                </div>
                <Link to="/profile">👤 Profile</Link>
                <Link to="/settings">⚙ Settings & Spoilers</Link>
                <Link to="/leaderboard">🏆 Leaderboard</Link>
                {isAdmin && <Link to="/admin">🛠 Admin Panel</Link>}
                <button
                  onClick={async () => {
                    music.pause();
                    await signOut();
                    nav('/signin');
                  }}
                >
                  ⎋ Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {mega && (
          <motion.div className="mega glass" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <div>
              <h6>Explore</h6>
              {explore.map((n) => (
                <Link key={n.to} to={n.to}>
                  {n.label}
                </Link>
              ))}
            </div>
            <div>
              <h6>Play</h6>
              {play.map((n) => (
                <Link key={n.to} to={n.to}>
                  {n.label}
                </Link>
              ))}
            </div>
            <div>
              <h6>Files</h6>
              {custom.map((p) => (
                <Link key={p.id} to={`/p/${p.slug || p.id}`}>
                  {p.title}
                </Link>
              ))}
              <Link to="/profile">Your Profile</Link>
              <Link to="/settings">Spoiler Settings</Link>
            </div>
            <Link to="/kill-room" className="media-card" style={{ minHeight: 200 }}>
              <div className="media">
                <Visual src={settings.killRoom?.victimPhotos?.[0]} seed="killroom-mega" label="KILL ROOM" mode="name" />
              </div>
              <div className="shade" />
              <div className="meta">
                <div className="kicker red">3D · Photo Mode</div>
                <div className="display" style={{ fontSize: 34 }}>
                  Enter the Kill Room
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ======================= Footer =======================
export function Footer() {
  const { settings } = useCms();
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '70px 0 50px', marginTop: 40, position: 'relative', overflow: 'hidden' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <Logo height={34} />
          <T k="footer.line" d={settings.brand.footerText} as="p" className="serif" style={{ fontSize: 22, fontStyle: 'italic', color: '#bdb8b0', marginTop: 18 }} />
          <button
            title="?"
            onClick={() => eggStore.set({ trigger: 'hidden' })}
            className="slide-hit"
            style={{ marginTop: 18, width: 34, height: 12, borderRadius: 2, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.08))', position: 'relative', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ position: 'absolute', left: 13, top: 3, width: 6, height: 5, borderRadius: '50%', background: 'var(--blood)' }} />
          </button>
        </div>
        {[
          ['Universe', ['/series', 'Series'], ['/seasons', 'Seasons'], ['/characters', 'Characters'], ['/villains', 'Villains'], ['/timeline', 'Timeline']],
          ['Evidence', ['/kill-count', 'Kill Count'], ['/quotes', 'Quotes'], ['/map', 'Map'], ['/code', 'Harry’s Code'], ['/behind-the-scenes', 'Behind the Scenes']],
          ['Play', ['/kill-room', 'Kill Room 3D'], ['/games/trivia', 'Trivia'], ['/games/quiz', 'Which Character?'], ['/games/blood-spatter', 'Blood Spatter Lab'], ['/games/catch-the-killer', 'Catch the Killer']],
        ].map(([title, ...links]: any) => (
          <div key={title}>
            <div className="kicker" style={{ marginBottom: 16 }}>
              {title}
            </div>
            {links.map(([to, label]: any) => (
              <Link key={to} to={to} style={{ display: 'block', padding: '5px 0', color: '#bdb8b0', fontSize: 14 }}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="container" style={{ marginTop: 50, display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--f-mono)', letterSpacing: '.1em' }}>
        <span>© {new Date().getFullYear()} {settings.brand.siteName}</span>
        <span>
          Try typing a word. Any word. <span className="blood-text">↑↑↓↓</span>
        </span>
      </div>
    </footer>
  );
}

// ======================= Edit bar =======================
export function EditBar() {
  const { editMode, setEditMode, previewDrafts, setPreviewDrafts } = useCms();
  if (!editMode) return null;
  return (
    <motion.div className="edit-bar glass" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <span className="pulse-dot" style={{ background: 'var(--gold)' }} />
      <b style={{ fontSize: 13, letterSpacing: '.12em' }}>EDIT MODE</b>
      <span className="muted" style={{ fontSize: 12 }}>
        Click a dashed text to edit it · hover and press 🎨 (or right-click) to resize, move, tilt and restyle it.
      </span>
      <label className="row" style={{ fontSize: 12, gap: 8 }}>
        <button className={cx('toggle', previewDrafts && 'on')} onClick={() => setPreviewDrafts(!previewDrafts)} /> Preview drafts
      </label>
      <Link className="btn btn-xs" to="/admin">
        Admin
      </Link>
      <button className="btn btn-xs btn-white" onClick={() => setEditMode(false)}>
        Done
      </button>
    </motion.div>
  );
}

// ======================= Reveal on scroll =======================
export function Reveal({ children, delay = 0, y = 40, className, style }: { children: React.ReactNode; delay?: number; y?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div className={className} style={style} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ======================= Section heading =======================
export function SectionHead({ kicker, title, tk, children, sub }: { kicker?: string; title: string; tk: string; children?: React.ReactNode; sub?: string }) {
  return (
    <div className="section-head">
      <div>
        {kicker && <T k={`${tk}.kicker`} d={kicker} as="div" className="kicker" />}
        <T k={`${tk}.title`} d={title} as="h2" className="display h-md" style={{ margin: '10px 0 0' }} />
        {sub && <T k={`${tk}.sub`} d={sub} as="p" className="muted" style={{ maxWidth: 620, margin: '12px 0 0' }} />}
      </div>
      {children}
    </div>
  );
}


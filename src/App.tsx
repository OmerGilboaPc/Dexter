import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './lib/auth';
import { CmsProvider, useCms } from './lib/cms';
import { music, setSfxEnabled, sfx } from './lib/sound';
import { pathKey } from './lib/util';
import { Loader } from './components/Loader';
import { Toasts } from './components/Toasts';
import { Cursor } from './components/Cursor';
import { ThemeInjector, PageTransition, MusicPlayer, Nav, Footer, EditBar } from './components/Chrome';
import { SearchPalette } from './components/Search';
import { EasterEggs } from './components/EasterEggs';
import { AdminWatcher } from './components/AdminWatcher';
import { StyleEditor, StyleInjector } from './components/StyleEditor';

import { SignIn, SignUp, Forgot, Verify, Onboarding, Blocked } from './pages/auth/Auth';
import Home from './pages/Home';
import { SeriesList, SeriesDetail } from './pages/Series';
import { SeasonsList, SeasonDetail } from './pages/Seasons';
import { CharactersList, CharacterDetail } from './pages/Characters';
import { VillainsList, VillainDetail } from './pages/Villains';
import { Quotes, Timeline, Code, BehindScenes, Trailer } from './pages/Explore';
import { Profile, Settings, Leaderboard, Gallery } from './pages/Me';
import CustomPage from './pages/CustomPage';
import { Books, Daily } from './pages/More';
import NotFound from './pages/NotFound';
import Trivia from './pages/games/Trivia';
import Quiz from './pages/games/Quiz';
import BloodSpatter from './pages/games/BloodSpatter';
import CatchKiller from './pages/games/CatchKiller';

const KillRoom = lazy(() => import('./pages/killroom/KillRoom'));
const KillCount = lazy(() => import('./pages/KillCount'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Admin = lazy(() => import('./pages/admin/Admin'));

export default function App() {
  return (
    <AuthProvider>
      <CmsBridge />
    </AuthProvider>
  );
}

function CmsBridge() {
  const { user, isAdmin, needsVerification } = useAuth();
  return (
    <CmsProvider signedIn={!!user && !needsVerification} isAdmin={isAdmin} uid={user?.uid}>
      <ThemeInjector />
      <Shell />
      <Toasts />
    </CmsProvider>
  );
}

function Shell() {
  const { user, loading, profile, profileLoading, needsVerification, needsOnboarding, setAchievementDefs } = useAuth();
  const { ready, settings, col } = useCms();
  const loc = useLocation();

  // Music & SFX preferences.
  useEffect(() => {
    music.configure(settings.music.tracks || [], settings.music.volume ?? 0.35);
  }, [settings.music.tracks, settings.music.volume]);
  useEffect(() => {
    const userSfx = profile?.settings?.sfx !== false;
    setSfxEnabled(!!settings.features.sfx && userSfx);
    music.setEnabled(settings.music.enabled !== false && profile?.settings?.music !== false);
  }, [settings.features.sfx, settings.music.enabled, profile?.settings?.sfx, profile?.settings?.music]);
  useEffect(() => {
    setAchievementDefs(col('achievements'));
  }, [col, setAchievementDefs]);

  const booting = loading || !ready || (user && profileLoading && !profile && !needsVerification);
  const authRoutes = ['/signin', '/signup', '/forgot'];

  let content: React.ReactNode;
  if (booting) content = null;
  else if (!user)
    content = (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  else if (needsVerification)
    content = (
      <Routes>
        <Route path="*" element={<Verify />} />
      </Routes>
    );
  else if (needsOnboarding)
    content = (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  else if (profile?.blocked) content = <Blocked />;
  else if (authRoutes.includes(loc.pathname)) content = <Navigate to="/" replace />;
  else content = <MainLayout />;

  return (
    <>
      <StyleInjector />
      {settings.features.cursor && (settings.features as any).cursorStyle !== 'system' && <Cursor />}
      {settings.features.grain && <div className="grain" />}
      <AnimatePresence>{booting && settings.features.loader !== false && <Loader key="boot" />}</AnimatePresence>
      {content}
    </>
  );
}

function useTracking() {
  const { user, profile, track } = useAuth();
  const loc = useLocation();
  const sessionLogged = useRef(false);
  useEffect(() => {
    if (!user || !profile) return;
    if (!sessionLogged.current) {
      sessionLogged.current = true;
      track('login');
    }
    const key = pathKey(loc.pathname);
    const isNew = !profile.pages?.[key];
    updateDoc(doc(db, 'users', user.uid), { [`pages.${key}`]: increment(1) }).catch(() => {});
    if (isNew) track('page:unique');
    const p = loc.pathname;
    if (p === '/map') track('visit:map');
    if (p === '/kill-room') track('visit:kill-room');
    if (p === '/books') track('visit:books');
    const m = p.match(/^\/characters\/([^/]+)/);
    if (m) track(`visit:character:${m[1]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, user?.uid, !!profile]);
}

function MainLayout() {
  const { settings } = useCms();
  const { profile } = useAuth();
  const loc = useLocation();
  const [search, setSearch] = useState(false);
  useTracking();

  useEffect(() => {
    if (settings.music.autoplay !== false && profile?.settings?.music !== false) music.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0, behavior: 'instant' as any });
    else setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
  }, [loc.pathname, loc.hash]);

  const isAdminRoute = loc.pathname.startsWith('/admin');
  const fullBleed = loc.pathname === '/kill-room';
  const showIntro = settings.features.firstLoginIntro && profile && !profile.introSeen;

  return (
    <>
      {!isAdminRoute && <Nav onSearch={() => setSearch(true)} />}
      <motion.main key={loc.pathname} data-route={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: settings.features.transitions ? 0.35 : 0 }}>
        <Suspense fallback={<Loader label="Preparing the scene" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/series" element={<SeriesList />} />
            <Route path="/series/:id" element={<SeriesDetail />} />
            <Route path="/seasons" element={<SeasonsList />} />
            <Route path="/seasons/:id" element={<SeasonDetail />} />
            <Route path="/characters" element={<CharactersList />} />
            <Route path="/characters/:id" element={<CharacterDetail />} />
            <Route path="/villains" element={<VillainsList />} />
            <Route path="/villains/:id" element={<VillainDetail />} />
            <Route path="/kill-count" element={<KillCount />} />
            <Route path="/kill-room" element={<KillRoom />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/code" element={<Code />} />
            <Route path="/behind-the-scenes" element={<BehindScenes />} />
            <Route path="/trailer" element={<Trailer />} />
            <Route path="/books" element={<Books />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/games/trivia" element={<Trivia />} />
            <Route path="/games/quiz" element={<Quiz />} />
            <Route path="/games/blood-spatter" element={<BloodSpatter />} />
            <Route path="/games/catch-the-killer" element={<CatchKiller />} />
            <Route path="/games" element={<Navigate to="/games/trivia" replace />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:uid" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/p/:slug" element={<CustomPage />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        {!isAdminRoute && !fullBleed && <Footer />}
      </motion.main>
      <PageTransition />
      <MusicPlayer />
      <EditBar />
      <EasterEggs />
      <AdminWatcher />
      <StyleEditor />
      <SearchPalette open={search} onClose={() => setSearch(false)} />
      <AnimatePresence>{showIntro && <Intro key="intro" />}</AnimatePresence>
    </>
  );
}

/** First-login cinematic: "Tonight's the night." */
function Intro() {
  const { updateProfile } = useAuth();
  const lines = ['Tonight’s the night.', 'And it’s going to happen again and again.', 'It has to happen.'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    sfx.heartbeat();
    const iv = setInterval(() => {
      setStep((s) => {
        if (s < lines.length) sfx.heartbeat();
        return s + 1;
      });
    }, 1900);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const done = () => updateProfile({ introSeen: true });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.2 } }} style={{ position: 'fixed', inset: 0, zIndex: 9997, background: '#020203', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: 30 }}>
        {lines.map((l, i) => (
          <motion.div
            key={i}
            className="serif"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={step > i ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: i === 0 ? 'clamp(48px, 7vw, 110px)' : 'clamp(22px, 2.4vw, 38px)', fontStyle: 'italic', color: i === 0 ? '#fff' : '#bdb8b0', lineHeight: 1.15, marginBottom: 14 }}
          >
            {l}
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={step > lines.length ? { opacity: 1 } : {}} transition={{ duration: 1 }} style={{ marginTop: 40 }}>
          <button className="btn btn-primary" onClick={done}>
            Enter
          </button>
        </motion.div>
      </div>
      <button className="btn btn-xs" onClick={done} style={{ position: 'absolute', bottom: 30, right: 30 }}>
        Skip
      </button>
    </motion.div>
  );
}

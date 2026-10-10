import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAIL } from '../firebase';
import { toast } from './bus';
import { sfx } from './sound';
import { deepMerge } from './util';

export interface Profile {
  uid: string;
  email: string;
  username: string;
  avatar: string;
  favorite: string;
  createdAt?: any;
  lastSeen?: any;
  totalMinutes?: number;
  pages?: Record<string, number>;
  counters?: Record<string, number>;
  achievements?: Record<string, number>;
  settings?: {
    spoilerMode?: 'off' | 'season' | 'episode' | 'watched';
    progress?: Record<string, { season: number; episode: number }>;
    sfx?: boolean;
    music?: boolean;
  };
  watched?: Record<string, boolean>;
  quizResult?: string;
  triviaBest?: Record<string, number>;
  spatterBest?: number;
  cases?: Record<string, boolean>;
  blocked?: boolean;
  introSeen?: boolean;
  provider?: string;
}

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  needsVerification: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, pw: string) => Promise<void>;
  signUp: (email: string, pw: string, p: { username: string; avatar: string; favorite: string }) => Promise<void>;
  google: () => Promise<void>;
  reset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  reloadUser: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (p: Partial<Profile> | Record<string, any>) => Promise<void>;
  completeOnboarding: (p: { username: string; avatar: string; favorite: string }) => Promise<void>;
  track: (event: string, inc?: number) => void;
  setAchievementDefs: (defs: any[]) => void;
}

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export const friendlyAuthError = (e: any) => {
  const c = e?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/popup-closed-by-user': 'The Google window was closed.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase (Authentication → Settings → Authorized domains).',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[c] || e?.message || 'Something went wrong.';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [verifiedTick, setVerifiedTick] = useState(0);
  const defsRef = useRef<any[]>([]);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  // Local development only: `?devauth=1` simulates a signed-in admin so pages can be tested offline.
  const devAuth = import.meta.env.DEV && typeof window !== 'undefined' && (window.location.search.includes('devauth=1') || sessionStorage.getItem('devauth') === '1');

  useEffect(() => {
    if (devAuth) {
      sessionStorage.setItem('devauth', '1');
      setUser({ uid: 'dev-user', email: ADMIN_EMAIL, emailVerified: true, providerData: [{ providerId: 'google.com' }], displayName: 'Dev' } as any);
      setProfile({ uid: 'dev-user', email: ADMIN_EMAIL, username: 'DevTester', avatar: '', favorite: 'brian', introSeen: true, settings: { spoilerMode: 'off', progress: {}, sfx: false, music: false }, pages: {}, counters: {}, achievements: {}, watched: {} } as any);
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) setProfile(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || devAuth) return;
    setProfileLoading(true);
    return onSnapshot(
      doc(db, 'users', user.uid),
      (s) => {
        setProfile(s.exists() ? ({ uid: user.uid, ...(s.data() as any) } as Profile) : null);
        setProfileLoading(false);
      },
      () => setProfileLoading(false),
    );
  }, [user]);

  // Presence + time-on-site tracking (one write per active minute).
  useEffect(() => {
    if (!user || !profile) return;
    const ref = doc(db, 'users', user.uid);
    updateDoc(ref, { lastSeen: serverTimestamp() }).catch(() => {});
    const iv = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      updateDoc(ref, { totalMinutes: increment(1), lastSeen: serverTimestamp() }).catch(() => {});
      trackRef.current?.('time:min', 1);
    }, 60000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, !!profile]);

  const isPasswordUser = !!user?.providerData.some((p) => p.providerId === 'password');
  const isGoogle = !!user?.providerData.some((p) => p.providerId === 'google.com');
  const needsVerification = !!user && isPasswordUser && !isGoogle && !user.emailVerified;
  const isAdmin = !!user && user.email?.toLowerCase() === ADMIN_EMAIL && (user.emailVerified || isGoogle);
  const needsOnboarding = !!user && !profileLoading && !profile && !needsVerification;

  const writeProfile = async (u: User, p: { username: string; avatar: string; favorite: string }, provider: string) => {
    await setDoc(
      doc(db, 'users', u.uid),
      {
        uid: u.uid,
        email: u.email,
        username: p.username.trim().slice(0, 32),
        avatar: p.avatar || '',
        favorite: p.favorite || 'dexter',
        provider,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        totalMinutes: 0,
        pages: {},
        counters: {},
        achievements: {},
        settings: { spoilerMode: 'off', progress: {}, sfx: true, music: true },
        watched: {},
        triviaBest: {},
        cases: {},
        blocked: false,
        introSeen: false,
      },
      { merge: true },
    );
  };

  const signIn = async (email: string, pw: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pw);
  };

  const signUp: AuthCtx['signUp'] = async (email, pw, p) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
    await writeProfile(cred.user, p, 'password');
    await sendEmailVerification(cred.user).catch(() => {});
  };

  const google = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const reset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerification = async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setUser(auth.currentUser);
      setVerifiedTick((t) => t + 1);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const updateProfile = async (p: Record<string, any>) => {
    if (!user) return;
    if (devAuth) return setProfile((cur) => deepMerge(cur, p) as Profile);
    await setDoc(doc(db, 'users', user.uid), p, { merge: true });
  };

  const completeOnboarding: AuthCtx['completeOnboarding'] = async (p) => {
    if (!user) return;
    await writeProfile(user, p, isGoogle ? 'google' : 'password');
  };

  // ---------- Achievements ----------
  const track = (event: string, inc = 1) => {
    const prof = profileRef.current;
    if (!user || !prof) return;
    const key = event.replace(/[.\/]/g, '_');
    const nextCount = (prof.counters?.[key] || 0) + inc;
    const updates: Record<string, any> = { [`counters.${key}`]: increment(inc) };
    const unlocked: Record<string, number> = { ...(prof.achievements || {}) };
    for (const a of defsRef.current) {
      if (a.event !== event || unlocked[a.id]) continue;
      if (nextCount >= (a.count || 1)) {
        updates[`achievements.${a.id}`] = Date.now();
        unlocked[a.id] = Date.now();
        setTimeout(() => {
          sfx.unlock();
          toast({ title: a.title, text: a.desc, icon: a.icon, kind: 'achievement' }, 5500);
        }, 250);
      }
    }
    // Optimistic local update so repeated events in one tick count correctly.
    profileRef.current = { ...prof, achievements: unlocked, counters: { ...(prof.counters || {}), [key]: nextCount } };
    updateDoc(doc(db, 'users', user.uid), updates).catch(() => {});
  };
  const trackRef = useRef(track);
  trackRef.current = track;

  const value: AuthCtx = {
    user,
    profile,
    loading,
    profileLoading,
    isAdmin,
    needsVerification,
    needsOnboarding,
    signIn,
    signUp,
    google,
    reset,
    resendVerification,
    reloadUser,
    signOut,
    updateProfile,
    completeOnboarding,
    track,
    setAchievementDefs: (d) => (defsRef.current = d),
  };
  void verifiedTick;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

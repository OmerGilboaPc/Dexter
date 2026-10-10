import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, friendlyAuthError } from '../../lib/auth';
import { useCms } from '../../lib/cms';
import { Logo } from '../../components/Logo';
import { Visual } from '../../components/Visual';
import { music, sfx } from '../../lib/sound';
import { defaults } from '../../data';
import { cx, initials } from '../../lib/util';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { settings } = useCms();
  const bg = settings.auth.bgVideo || settings.auth.bgImage || settings.hero.image;
  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 1fr', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Visual src={bg} seed="auth-bg" accent="#d90f1e" mode="none" style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,5,7,.55) 0%, rgba(5,5,7,.75) 55%, rgba(5,5,7,.96) 100%), linear-gradient(0deg, rgba(5,5,7,.9), transparent 50%)' }} />
      </div>
      <div style={{ position: 'relative', padding: '60px 6vw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <Logo height={44} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2 }}>
          <div className="kicker red" style={{ marginBottom: 18 }}>
            <span className="pulse-dot" style={{ marginRight: 10 }} /> Miami Metro Police Department · Restricted access
          </div>
          <div className="serif" style={{ fontSize: 'clamp(40px, 5vw, 84px)', fontStyle: 'italic', lineHeight: 1.05, maxWidth: 700 }}>
            {settings.brand.tagline}
          </div>
        </motion.div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.25em' }}>
          EVIDENCE ROOM · AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: 40 }}>
        <motion.div className="glass" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ width: 'min(460px, 100%)', borderRadius: 24, padding: '42px 38px' }}>
          <h1 className="display" style={{ fontSize: 56, margin: 0 }}>
            {title}
          </h1>
          <p className="muted" style={{ margin: '6px 0 30px' }}>
            {subtitle}
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function GoogleButton({ onDone }: { onDone?: () => void }) {
  const { google } = useAuth();
  const [err, setErr] = useState('');
  return (
    <>
      <button
        className="btn"
        style={{ width: '100%', background: '#fff', color: '#111', borderColor: '#fff' }}
        onClick={async () => {
          setErr('');
          try {
            music.unlockAndPlay();
            await google();
            onDone?.();
          } catch (e) {
            setErr(friendlyAuthError(e));
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
      {err && <div style={{ color: '#ff6b73', fontSize: 13, marginTop: 10 }}>{err}</div>}
    </>
  );
}

const Or = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0', color: 'var(--muted)', fontSize: 12, letterSpacing: '.2em' }}>
    <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    OR
    <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
  </div>
);

export function SignIn() {
  const { signIn } = useAuth();
  const { settings } = useCms();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <AuthShell title={settings.auth.signInTitle} subtitle={settings.auth.signInSubtitle}>
      <GoogleButton />
      <Or />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          setBusy(true);
          music.unlockAndPlay();
          try {
            await signIn(email, pw);
            sfx.heartbeat();
          } catch (e2) {
            setErr(friendlyAuthError(e2));
            sfx.fail();
          }
          setBusy(false);
        }}
      >
        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Password
            <Link to="/forgot" style={{ color: 'var(--blood-bright)', letterSpacing: '.05em', textTransform: 'none' }}>
              Forgot password?
            </Link>
          </label>
          <input className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        {err && <div style={{ color: '#ff6b73', fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Verifying…' : 'Sign in'}
        </button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
        Don’t have an account?{' '}
        <Link to="/signup" style={{ color: '#fff', fontWeight: 600 }}>
          Sign up here
        </Link>
      </p>
    </AuthShell>
  );
}

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { settings } = useCms();
  const avatars = settings.avatars || [];
  if (!avatars.length) return <div className="muted" style={{ fontSize: 13 }}>No avatars have been uploaded yet. You can choose one later in Settings.</div>;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {avatars.map((a) => (
        <button key={a} type="button" onClick={() => onChange(a)} style={{ padding: 0, border: value === a ? '2px solid var(--blood-bright)' : '2px solid transparent', borderRadius: '50%', background: 'none', cursor: 'pointer', boxShadow: value === a ? '0 0 20px rgba(255,42,54,.5)' : 'none' }}>
          <div className="avatar" style={{ width: 52, height: 52 }}>
            <img src={a} alt="" />
          </div>
        </button>
      ))}
    </div>
  );
}

export function FavoritePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { col } = useCms();
  const list = col('characters').length ? col('characters') : defaults.characters;
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {list.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function ProfileFields({ username, setUsername, avatar, setAvatar, favorite, setFavorite }: any) {
  return (
    <>
      <div className="field">
        <label className="label">Username</label>
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} maxLength={32} placeholder="e.g. BayHarborFan" />
      </div>
      <div className="field">
        <label className="label">Profile picture</label>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>
      <div className="field">
        <label className="label">Favorite character</label>
        <FavoritePicker value={favorite} onChange={setFavorite} />
      </div>
    </>
  );
}

export function SignUp() {
  const { signUp } = useAuth();
  const { settings } = useCms();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(settings.avatars?.[0] || '');
  const [favorite, setFavorite] = useState('dexter');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <AuthShell title={settings.auth.signUpTitle} subtitle={settings.auth.signUpSubtitle}>
      <GoogleButton />
      <Or />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          if (pw !== pw2) return setErr('The passwords don’t match.');
          if (username.trim().length < 2) return setErr('Choose a username.');
          setBusy(true);
          music.unlockAndPlay();
          try {
            await signUp(email, pw, { username, avatar, favorite });
          } catch (e2) {
            setErr(friendlyAuthError(e2));
            sfx.fail();
          }
          setBusy(false);
        }}
      >
        <ProfileFields {...{ username, setUsername, avatar, setAvatar, favorite, setFavorite }} />
        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid g2" style={{ gap: 12 }}>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
          </div>
          <div className="field">
            <label className="label">Confirm</label>
            <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
          </div>
        </div>
        {err && <div style={{ color: '#ff6b73', fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
        Already signed up?{' '}
        <Link to="/signin" style={{ color: '#fff', fontWeight: 600 }}>
          Click here to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export function Forgot() {
  const { reset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  return (
    <AuthShell title="Forgot your password?" subtitle="It happens to the best of us. Even Dexter forgets things… almost never.">
      {sent ? (
        <div>
          <p style={{ fontSize: 16 }}>We’ve sent a password reset link to <b>{email}</b>. Check your inbox (and spam folder).</p>
          <Link to="/signin" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            try {
              await reset(email);
              setSent(true);
            } catch (e2) {
              setErr(friendlyAuthError(e2));
            }
          }}
        >
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {err && <div style={{ color: '#ff6b73', fontSize: 13, marginBottom: 14 }}>{err}</div>}
          <button className="btn btn-primary" style={{ width: '100%' }}>
            Send reset link
          </button>
          <p className="muted" style={{ textAlign: 'center', marginTop: 22, fontSize: 14 }}>
            <Link to="/signin" style={{ color: '#fff' }}>
              ← Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function Verify() {
  const { user, resendVerification, reloadUser, signOut } = useAuth();
  const [msg, setMsg] = useState('');
  return (
    <AuthShell title="Verify your email" subtitle="One last step before you’re in.">
      <p>
        We’ve sent a verification link to <b>{user?.email}</b>. Click it, then come back and press the button below.
      </p>
      <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
        <button
          className="btn btn-primary"
          onClick={async () => {
            await reloadUser();
            setMsg('If the email still isn’t verified, check your inbox again.');
          }}
        >
          I’ve verified my email
        </button>
        <button
          className="btn"
          onClick={async () => {
            try {
              await resendVerification();
              setMsg('Sent again ✓');
            } catch (e) {
              setMsg(friendlyAuthError(e));
            }
          }}
        >
          Resend verification email
        </button>
        <button className="btn btn-sm" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
      {msg && <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>{msg}</p>}
    </AuthShell>
  );
}

export function Onboarding() {
  const { completeOnboarding, user, signOut } = useAuth();
  const { settings } = useCms();
  const [username, setUsername] = useState(user?.displayName?.replace(/\s+/g, '') || '');
  const [avatar, setAvatar] = useState(settings.avatars?.[0] || '');
  const [favorite, setFavorite] = useState('dexter');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  return (
    <AuthShell title="Who are you?" subtitle="Set up your profile before you go in.">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (username.trim().length < 2) return;
          setBusy(true);
          await completeOnboarding({ username, avatar, favorite });
          setBusy(false);
          nav('/');
        }}
      >
        <ProfileFields {...{ username, setUsername, avatar, setAvatar, favorite, setFavorite }} />
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          Enter
        </button>
        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => signOut()}>
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}

export function Blocked() {
  const { signOut, profile } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 30 }}>
      <div>
        <div className="avatar" style={{ width: 80, height: 80, margin: '0 auto 20px', fontSize: 26 }}>
          {initials(profile?.username || '?')}
        </div>
        <h1 className={cx('display')} style={{ fontSize: 80, margin: 0 }}>
          Access revoked
        </h1>
        <p className="muted">Your account has been blocked by the administrator.</p>
        <button className="btn" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}

export const cx = (...a: any[]) => a.filter(Boolean).join(' ');

export const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

/** Deep merge: objects merge recursively, arrays and primitives from `over` replace. */
export function deepMerge<T>(base: T, over: any): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined ? base : over) as T;
  const out: any = { ...base };
  for (const k of Object.keys(over)) {
    out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k];
  }
  return out;
}

export const getPath = (obj: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

export function setPath(obj: any, path: string, value: any) {
  const keys = path.split('.');
  const out = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur: any = out;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
      cur = cur[k];
    }
  });
  return out;
}

export const slugify = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const dayIndex = () => Math.floor(Date.now() / 86400000);

export const pathKey = (p: string) => (p || '/').replace(/\//g, '|') || '|';

export const initials = (name: string) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const isVideo = (url: string) => /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url || '');
export const isAudio = (url: string) => /\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(url || '');
export const isModel = (url: string) => /\.(glb|gltf)(\?|$)/i.test(url || '');

export const fmtMinutes = (m: number) => {
  m = Math.round(m || 0);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const toDate = (v: any) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

export const timeAgo = (v: any) => {
  const d = toDate(v);
  if (!d) return '—';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

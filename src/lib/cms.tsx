import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { defaults, COLLECTIONS } from '../data';
import { defaultSettings } from '../data/site';
import { deepMerge, setPath } from './util';
import { toast } from './bus';

type Raw = Record<string, Record<string, any>>;

interface CmsCtx {
  ready: boolean;
  raw: Raw;
  settings: typeof defaultSettings;
  strings: Record<string, string>;
  col: (name: string) => any[];
  item: (name: string, id: string) => any;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  previewDrafts: boolean;
  setPreviewDrafts: (v: boolean) => void;
  saveItem: (col: string, id: string, data: any, opts?: { draft?: boolean; silent?: boolean }) => Promise<void>;
  patchItem: (col: string, id: string, path: string, value: any) => Promise<void>;
  deleteItem: (col: string, id: string) => Promise<void>;
  resetItem: (col: string, id: string) => Promise<void>;
  publishDraft: (col: string, id: string) => Promise<void>;
  discardDraft: (col: string, id: string) => Promise<void>;
  saveSettings: (path: string, value: any) => Promise<void>;
  replaceSettings: (value: any) => Promise<void>;
  saveString: (key: string, value: string) => Promise<void>;
  isDefault: (col: string, id: string) => boolean;
  seedAll: () => Promise<void>;
}

const Ctx = createContext<CmsCtx>(null as any);
export const useCms = () => useContext(Ctx);

const strip = (o: any) => {
  if (!o) return o;
  const { _draft, _deleted, _updatedAt, ...rest } = o;
  return rest;
};

export function CmsProvider({ signedIn, isAdmin, uid, children }: { signedIn: boolean; isAdmin: boolean; uid?: string; children: React.ReactNode }) {
  const [raw, setRaw] = useState<Raw>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [siteDoc, setSiteDoc] = useState<any>(null);
  const [siteLoaded, setSiteLoaded] = useState(false);
  const [stringsDoc, setStringsDoc] = useState<any>({});
  const [editMode, setEditMode] = useState(false);
  const [previewDrafts, setPreviewDrafts] = useState(true);

  // Settings are public (needed by the sign-in screen).
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'site'),
      (s) => {
        setSiteDoc(s.exists() ? s.data() : null);
        setSiteLoaded(true);
      },
      () => setSiteLoaded(true),
    );
    const unsub2 = onSnapshot(
      doc(db, 'settings', 'strings'),
      (s) => setStringsDoc(s.exists() ? s.data()?.map || {} : {}),
      () => {},
    );
    return () => {
      unsub();
      unsub2();
    };
  }, []);

  // Content collections require sign-in.
  useEffect(() => {
    if (!signedIn) {
      setRaw({});
      setLoaded({});
      return;
    }
    const unsubs = COLLECTIONS.map((name) =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          const m: Record<string, any> = {};
          snap.forEach((d) => (m[d.id] = d.data()));
          setRaw((r) => ({ ...r, [name]: m }));
          setLoaded((l) => ({ ...l, [name]: true }));
        },
        () => setLoaded((l) => ({ ...l, [name]: true })),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [signedIn]);

  const showDrafts = isAdmin && previewDrafts;

  const merged = useMemo(() => {
    const out: Record<string, any[]> = {};
    for (const name of COLLECTIONS) {
      const over = raw[name] || {};
      const map = new Map<string, any>();
      for (const d of defaults[name] || []) map.set(d.id, { ...d });
      for (const [id, o] of Object.entries(over)) {
        if (o._deleted) {
          map.delete(id);
          continue;
        }
        const base = map.get(id);
        const published = strip(o);
        const draftOnly = !base && Object.keys(published).filter((k) => k !== 'id').length === 0;
        if (draftOnly && !(showDrafts && o._draft)) continue;
        let v = { ...(base || {}), ...published, id };
        if (showDrafts && o._draft) v = { ...v, ...o._draft, id, __draft: true };
        else if (o._draft) v.__hasDraft = true;
        map.set(id, v);
      }
      out[name] = [...map.values()].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    }
    return out;
  }, [raw, showDrafts]);

  const settings = useMemo(() => {
    const m = deepMerge(defaultSettings, siteDoc || {}) as typeof defaultSettings;
    // New built-in menu links / home sections appear automatically even if the admin saved an older list.
    const navTo = new Set((m.nav || []).map((n: any) => n.to));
    const known = new Set(((siteDoc as any)?.navKnown || []) as string[]);
    m.nav = [...(m.nav || []), ...defaultSettings.nav.filter((n) => !navTo.has(n.to) && !known.has(n.to))];
    const secIds = new Set((m.home?.sections || []).map((x: any) => x.id));
    m.home = { ...m.home, sections: [...(m.home?.sections || []), ...defaultSettings.home.sections.filter((x) => !secIds.has(x.id))] };
    (m as any).navKnown = defaultSettings.nav.map((n) => n.to);
    return m;
  }, [siteDoc]);

  const col = useCallback((name: string) => merged[name] || [], [merged]);
  const item = useCallback((name: string, id: string) => (merged[name] || []).find((x) => x.id === id), [merged]);

  const logHistory = async (colName: string, id: string, before: any, after: any, action: string) => {
    try {
      await addDoc(collection(db, 'history'), { col: colName, id, before: before ?? null, after: after ?? null, action, by: uid || null, at: serverTimestamp() });
    } catch {
      /* history is best-effort */
    }
  };

  const fail = (e: any) => {
    console.error(e);
    toast({ title: 'Save failed', text: e?.message || String(e), kind: 'error' });
    throw e;
  };

  const clean = (o: any) => JSON.parse(JSON.stringify(o, (k, v) => (k.startsWith('__') ? undefined : v === undefined ? null : v)));

  const saveItem: CmsCtx['saveItem'] = async (colName, id, data, opts = {}) => {
    const current = (merged[colName] || []).find((x) => x.id === id);
    const payload = clean({ ...data, id });
    try {
      if (opts.draft) {
        await setDoc(doc(db, colName, id), { _draft: payload, _updatedAt: serverTimestamp() }, { merge: true });
        if (!opts.silent) toast({ title: 'Draft saved', text: 'Not visible to users yet', kind: 'success' });
      } else {
        await setDoc(doc(db, colName, id), { ...payload, _draft: null, _deleted: false, _updatedAt: serverTimestamp() });
        await logHistory(colName, id, current ? clean(current) : null, payload, 'publish');
        if (!opts.silent) toast({ title: 'Published', text: 'Changes are live', kind: 'success' });
      }
    } catch (e) {
      fail(e);
    }
  };

  const patchItem: CmsCtx['patchItem'] = async (colName, id, path, value) => {
    const current = (merged[colName] || []).find((x) => x.id === id) || { id };
    const next = setPath(strip(current), path, value);
    await saveItem(colName, id, next, { silent: true });
  };

  const deleteItem: CmsCtx['deleteItem'] = async (colName, id) => {
    const current = (merged[colName] || []).find((x) => x.id === id);
    try {
      await setDoc(doc(db, colName, id), { _deleted: true, _updatedAt: serverTimestamp() });
      await logHistory(colName, id, current ? clean(current) : null, null, 'delete');
      toast({ title: 'Deleted', kind: 'success' });
    } catch (e) {
      fail(e);
    }
  };

  const resetItem: CmsCtx['resetItem'] = async (colName, id) => {
    const current = (merged[colName] || []).find((x) => x.id === id);
    try {
      await deleteDoc(doc(db, colName, id));
      await logHistory(colName, id, current ? clean(current) : null, null, 'reset');
      toast({ title: 'Restored to default', kind: 'success' });
    } catch (e) {
      fail(e);
    }
  };

  const publishDraft: CmsCtx['publishDraft'] = async (colName, id) => {
    const o = raw[colName]?.[id];
    if (!o?._draft) return;
    await saveItem(colName, id, o._draft);
  };

  const discardDraft: CmsCtx['discardDraft'] = async (colName, id) => {
    try {
      await setDoc(doc(db, colName, id), { _draft: null }, { merge: true });
      toast({ title: 'Draft discarded' });
    } catch (e) {
      fail(e);
    }
  };

  const saveSettings: CmsCtx['saveSettings'] = async (path, value) => {
    try {
      const next = setPath(siteDoc || {}, path, value);
      await setDoc(doc(db, 'settings', 'site'), clean(next));
      await logHistory('settings', 'site', siteDoc, clean(next), 'settings');
    } catch (e) {
      fail(e);
    }
  };

  const replaceSettings: CmsCtx['replaceSettings'] = async (value) => {
    try {
      await setDoc(doc(db, 'settings', 'site'), clean(value));
      await logHistory('settings', 'site', siteDoc, clean(value), 'settings');
      toast({ title: 'Settings saved', kind: 'success' });
    } catch (e) {
      fail(e);
    }
  };

  const saveString: CmsCtx['saveString'] = async (key, value) => {
    try {
      const map = { ...(stringsDoc || {}), [key]: value };
      await setDoc(doc(db, 'settings', 'strings'), { map });
      await logHistory('strings', key, stringsDoc?.[key] ?? null, value, 'string');
    } catch (e) {
      fail(e);
    }
  };

  const isDefault = (colName: string, id: string) => !!(defaults[colName] || []).find((d) => d.id === id);

  /** Writes every built-in default into Firestore so the whole site lives in the database. */
  const seedAll = async () => {
    try {
      for (const name of COLLECTIONS) {
        const items = defaults[name] || [];
        for (let i = 0; i < items.length; i += 400) {
          const batch = writeBatch(db);
          items.slice(i, i + 400).forEach((it) => {
            if (!raw[name]?.[it.id]) batch.set(doc(db, name, it.id), clean(it));
          });
          await batch.commit();
        }
      }
      if (!siteDoc) await setDoc(doc(db, 'settings', 'site'), clean(defaultSettings));
      toast({ title: 'Database seeded', text: 'All content now lives in Firestore', kind: 'success' });
    } catch (e) {
      fail(e);
    }
  };

  const ready = siteLoaded && (!signedIn || COLLECTIONS.every((n) => loaded[n]));

  const value: CmsCtx = {
    ready,
    raw,
    settings,
    strings: stringsDoc || {},
    col,
    item,
    editMode: isAdmin && editMode,
    setEditMode,
    previewDrafts,
    setPreviewDrafts,
    saveItem,
    patchItem,
    deleteItem,
    resetItem,
    publishDraft,
    discardDraft,
    saveSettings,
    replaceSettings,
    saveString,
    isDefault,
    seedAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Registry of every UI string rendered on the site, so the admin can list and edit them.
export const stringRegistry = new Map<string, string>();

export function useT() {
  const { strings } = useCms();
  return (key: string, fallback: string) => {
    if (!stringRegistry.has(key)) stringRegistry.set(key, fallback);
    const v = strings[key];
    return v == null || v === '' ? fallback : v;
  };
}

import { useEffect, useState } from 'react';

/** Tiny observable store for global UI state outside React context. */
export function createStore<T>(initial: T) {
  let state = initial;
  const subs = new Set<(s: T) => void>();
  return {
    get: () => state,
    set(next: T | ((s: T) => T)) {
      state = typeof next === 'function' ? (next as any)(state) : next;
      subs.forEach((f) => f(state));
    },
    subscribe(f: (s: T) => void) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}

export function useStore<T>(store: ReturnType<typeof createStore<T>>) {
  const [s, setS] = useState(store.get());
  useEffect(() => {
    setS(store.get());
    return store.subscribe(setS) as any;
  }, [store]);
  return s;
}

// ---------- Toasts ----------
export type Toast = { id: number; title: string; text?: string; icon?: string; kind?: 'info' | 'achievement' | 'error' | 'success'; action?: { label: string; run: () => void } };
export const toastStore = createStore<Toast[]>([]);
let tid = 1;
export function toast(t: Omit<Toast, 'id'> | string, ms = 4200) {
  const item: Toast = typeof t === 'string' ? { id: tid++, title: t } : { id: tid++, ...t };
  toastStore.set((s) => [...s, item]);
  setTimeout(() => toastStore.set((s) => s.filter((x) => x.id !== item.id)), ms);
}

// ---------- Overlays (easter eggs, modals) ----------
export const eggStore = createStore<any>(null);

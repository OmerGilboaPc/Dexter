import { useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/auth';
import { toast } from '../lib/bus';
import { sfx } from '../lib/sound';

/** For the admin only: live alert (toast + desktop notification) whenever a new user signs up. */
export function AdminWatcher() {
  const { isAdmin } = useAuth();
  const ready = useRef(false);
  useEffect(() => {
    if (!isAdmin) return;
    ready.current = false;
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        if (!ready.current) {
          ready.current = true;
          return;
        }
        snap.docChanges().forEach((c) => {
          if (c.type !== 'added') return;
          const u = c.doc.data() as any;
          sfx.unlock();
          toast({ title: 'New user signed up', text: `${u.username || 'Someone'} · ${u.email || ''}`, icon: '🩸', kind: 'success' }, 8000);
          try {
            if ('Notification' in window && Notification.permission === 'granted') new Notification('DEXTER · new user', { body: `${u.username || 'Someone'} just signed up` });
          } catch {
            /* ignore */
          }
        });
      },
      () => {},
    );
  }, [isAdmin]);
  return null;
}

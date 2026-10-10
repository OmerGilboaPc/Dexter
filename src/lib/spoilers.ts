import { useAuth } from './auth';
import { useCms } from './cms';

export type Marker = { series: string; season: number; episode?: number } | null | undefined;

/** Returns a function telling whether a spoiler marker is past the user's viewing progress. */
export function useSpoilers() {
  const { profile } = useAuth();
  const { col } = useCms();
  const mode = profile?.settings?.spoilerMode || 'off';
  const progress = profile?.settings?.progress || {};
  const watched = profile?.watched || {};

  // Furthest watched episode per series (for "watched" mode).
  const furthest: Record<string, number> = {};
  if (mode === 'watched') {
    const seasons = col('seasons');
    for (const key of Object.keys(watched)) {
      if (!watched[key]) continue;
      const [seasonId, epStr] = key.split(':');
      const s = seasons.find((x) => x.id === seasonId);
      if (!s) continue;
      const ord = s.number * 100 + Number(epStr);
      furthest[s.series] = Math.max(furthest[s.series] || 0, ord);
    }
  }

  const position = (series: string) => {
    if (mode === 'watched') return furthest[series] || 0;
    const p = progress[series];
    if (!p) return 0;
    if (mode === 'season') return (p.season || 0) * 100 + 99;
    return (p.season || 0) * 100 + (p.episode || 0);
  };

  const isSpoiler = (m: Marker) => {
    if (mode === 'off' || !m || !m.series) return false;
    const ord = (m.season || 0) * 100 + (m.episode || 1);
    return ord > position(m.series);
  };

  const label = (m: Marker) => {
    if (!m) return '';
    const s = col('series').find((x) => x.id === m.series);
    const name = s?.short || m.series;
    return `${name} · S${m.season}${m.episode ? `E${m.episode}` : ''}`;
  };

  return { mode, isSpoiler, label };
}

export const victimMarker = (v: any): Marker => ({ series: v.series, season: v.season, episode: v.episode });

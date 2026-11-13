import { Capacitor } from '@capacitor/core';
import type { CountryRank } from './ranking';

const KEY = 'mrb-word-puzzle:country-rank-v1';
function decode(raw: string | null): CountryRank | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!/^[A-Z]{2}$/.test(value.country) || !Number.isFinite(value.betterThan) || value.betterThan < 0 || value.betterThan > 100 || !Number.isInteger(value.players) || value.players < 0) return null;
    return { country: value.country, betterThan: value.betterThan, players: value.players };
  } catch { return null; }
}
export function readCachedRank(): CountryRank | null {
  try { return decode(localStorage.getItem(KEY)); } catch { return null; }
}
export async function restoreCachedRank(): Promise<CountryRank | null> {
  const local = readCachedRank();
  if (local || !Capacitor.isNativePlatform()) return local;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const rank = decode((await Preferences.get({ key: KEY })).value);
    if (rank) { try { localStorage.setItem(KEY, JSON.stringify(rank)); } catch { /* native copy remains */ } }
    return rank;
  } catch { return null; }
}
export async function cacheRank(rank: CountryRank): Promise<void> {
  const value = JSON.stringify(rank);
  if (!decode(value)) return;
  try { localStorage.setItem(KEY, value); } catch { /* native mirror may succeed */ }
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: KEY, value });
    } catch { /* retain last readable copy; ranking never blocks play */ }
  }
}
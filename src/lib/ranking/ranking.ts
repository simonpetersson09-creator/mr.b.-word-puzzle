import { Capacitor } from '@capacitor/core';
import { countryFromLocale } from './country';

const DEVICE_KEY = 'mrb-word-puzzle:ranking-device';
export interface CountryRank { country: string; players: number; betterThan: number }

function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
  return id;
}
async function country() {
  if (Capacitor.isNativePlatform()) {
    try { const { Device } = await import('@capacitor/device'); const r = countryFromLocale((await Device.getLanguageTag()).value); if (r) return r; } catch { /* fall back */ }
  }
  for (const tag of navigator.languages ?? [navigator.language]) { const r = countryFromLocale(tag); if (r) return r; }
  return null;
}
// Anonymous: only a random device id, country and win counts leave the phone. Offline simply returns null.
export async function fetchCountryRank(wins: number, played: number): Promise<CountryRank | null> {
  try {
    const code = await country();
    if (!code || played < 1) return null;
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('submit_score', { p_device: deviceId(), p_country: code, p_wins: wins, p_played: played });
    if (error || !data) return null;
    const d = data as { players: number; better_than: number };
    return { country: code, players: d.players, betterThan: Number(d.better_than) };
  } catch { return null; }
}

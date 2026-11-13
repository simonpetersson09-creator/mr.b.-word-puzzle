import { Capacitor } from '@capacitor/core';
import { countryFromLocale } from './country';
import { rankingIdentity } from './identity';

export interface CountryRank { country: string; players: number; betterThan: number }
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
    const code = await country();
    if (!code || played < 1) return null;
    const { supabase } = await import('@/integrations/supabase/client');
    const identity=await rankingIdentity();
    const { data, error } = await supabase.rpc('submit_score', { p_device: identity.id, p_token: identity.token, p_country: code, p_wins: wins, p_played: played });
    if (error || !data) return null;
    const d = data as { players: number; better_than: number };
    return { country: code, players: d.players, betterThan: Number(d.better_than) };
  } catch { return null; }
}

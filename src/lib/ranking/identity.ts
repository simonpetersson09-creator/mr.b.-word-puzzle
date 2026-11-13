import { Capacitor } from '@capacitor/core';
const KEY='mrb-word-puzzle:ranking-capability-v1';
interface Identity { id: string; token: string }
let cached: Promise<Identity> | undefined;
export function rankingIdentity(): Promise<Identity> {
  if (cached) return cached;
  cached=(async () => {
    const native=Capacitor.isNativePlatform();
    const preferences=native ? (await import('@capacitor/preferences')).Preferences : null;
    const raw=preferences ? (await preferences.get({key:KEY})).value : localStorage.getItem(KEY);
    if(raw) {
      const parsed=JSON.parse(raw) as Identity;
      if (/^[0-9a-f-]{36}$/i.test(parsed.id) && /^[a-f0-9]{64}$/.test(parsed.token)) return parsed;
      throw new Error('Invalid ranking identity');
    }
    const identity={id:crypto.randomUUID(),token:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')};
    const value=JSON.stringify(identity);
    if(preferences) await preferences.set({key:KEY,value}); else localStorage.setItem(KEY,value);
    return identity;
  })().catch(error => {cached=undefined;throw error;});
  return cached;
}
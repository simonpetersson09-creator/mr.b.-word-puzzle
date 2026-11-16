import { Capacitor } from '@capacitor/core';
import { rankingIdentity } from './ranking/identity';
import { deliverResult } from './native/result-share';
import { handicap } from './ord/handicap';
import { isFinished, type Save } from './ord/engine';

export interface Friend { id: string; name: string; status: 'pending' | 'accepted' | 'blocked'; incoming: boolean; hcp: number | null; day: string | null; completed: number | null }
export interface FriendsState { name: string; code: string; people: Friend[] }
export type FriendAction = 'list' | 'name' | 'invite' | 'accept' | 'remove' | 'block' | 'unblock' | 'sync';
const CACHE = 'mrb-word-puzzle:friends-v1';
export function validFriendName(name: string) { return name.trim().length >= 1 && name.trim().length <= 24 && !/[\x00-\x1f\x7f]/.test(name); }
export function normalizeFriendCode(code: string) { return code.replace(/\s/g, '').toUpperCase(); }
export function friendSummary(save: Save, day: string) {
  return { hcp: handicap(save.rounds, day).value, day, completed: Object.values(save.rounds).filter(r => r.date === day && isFinished(r)).length };
}
function decode(raw: string | null): FriendsState | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    return value && typeof value.name === 'string' && /^[A-F0-9]{12}$/.test(value.code) && Array.isArray(value.people) ? value : null;
  } catch { return null; }
}
export async function cachedFriends() {
  try {
    if (Capacitor.isNativePlatform()) { const { Preferences } = await import('@capacitor/preferences'); return decode((await Preferences.get({key:CACHE})).value); }
    return decode(localStorage.getItem(CACHE));
  } catch { return null; }
}
export async function friendsAction(action: FriendAction, data: { name?: string; code?: string; target?: string; save?: Save; day?: string } = {}): Promise<FriendsState> {
  const identity = await rankingIdentity();
  const { supabase } = await import('@/integrations/supabase/client');
  const summary = data.save && data.day ? friendSummary(data.save, data.day) : null;
  const {data:result,error} = await supabase.rpc('friends_action', {p_device:identity.id,p_token:identity.token,p_action:action,p_name:data.name ?? '',p_code:normalizeFriendCode(data.code ?? ''),p_target:data.target,p_hcp:summary?.hcp ?? undefined,p_day:summary?.day,p_completed:summary?.completed ?? 0});
  if (error) throw error;
  const state = decode(JSON.stringify(result));
  if (!state) throw new Error('Invalid friends response');
  try {
    if (Capacitor.isNativePlatform()) { const {Preferences} = await import('@capacitor/preferences'); await Preferences.set({key:CACHE,value:JSON.stringify(state)}); }
    else localStorage.setItem(CACHE,JSON.stringify(state));
  } catch { /* A cache failure must not hide a successful invitation. */ }
  return state;
}
export async function shareFriendCode(text: string) {
  if (Capacitor.isNativePlatform()) {
    const {Share} = await import('@capacitor/share'); const {Clipboard} = await import('@capacitor/clipboard');
    return deliverResult(text,{share:async text => {await Share.share({title:'Mr.B. Word Puzzle',text});},copy:async text => {await Clipboard.write({string:text});}});
  }
  return deliverResult(text,{share:typeof navigator.share==='function' ? async text => {await navigator.share({title:'Mr.B. Word Puzzle',text});} : undefined,copy:text=>navigator.clipboard.writeText(text)});
}
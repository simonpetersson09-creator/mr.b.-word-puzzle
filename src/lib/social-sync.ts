import {type Save} from './ord/engine';
import {cachedFriends,friendsAction} from './friends';
import {monthlyBoard,currentMonth} from './ranking/monthly';
import {Capacitor} from '@capacitor/core';
import {appLanguage} from './i18n';
import {playerDisplayName} from './i18n/player-copy';

// Failures leave the local ledger authoritative and are retried on reconnect.
export async function syncSocialResults(save:Save,day:string) {
  const results=await Promise.allSettled([
    cachedFriends().then(cached=>cached ? friendsAction('sync',{save,day}) : undefined),
    Capacitor.isNativePlatform() ? monthlyBoard(currentMonth(day),save,day,'join',playerDisplayName(save.settings,appLanguage())) : Promise.resolve(),
  ]);
  return results.every(result=>result.status==='fulfilled');
}

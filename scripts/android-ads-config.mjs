import {readFileSync} from 'node:fs';
const production=JSON.parse(readFileSync('src/lib/native/android-admob.json','utf8'));
export const ANDROID_PACKAGE = 'com.mrb.wordpuzzle';
export const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
export function androidAdsConfig(env = process.env, release = false) {
  const appId = (env.VITE_MRB_ANDROID_ADMOB_APP_ID ?? production.appId).trim();
  const interstitialId = (env.VITE_MRB_ANDROID_ADMOB_INTERSTITIAL_ID ?? production.interstitialId).trim();
  if (appId && !/^ca-app-pub-\d{16}~\d{10}$/.test(appId)) throw new Error('Invalid Android AdMob App ID');
  if (interstitialId && !/^ca-app-pub-\d{16}\/\d{10}$/.test(interstitialId)) throw new Error('Invalid Android interstitial ID');
  if (release && (!appId || !interstitialId || appId.startsWith('ca-app-pub-3940256099942544') || interstitialId.startsWith('ca-app-pub-3940256099942544'))) throw new Error('Release needs Word Puzzle’s own Android AdMob IDs; sample IDs are not allowed');
  return { appId: release ? appId : TEST_APP_ID, interstitialId: release ? interstitialId : TEST_INTERSTITIAL_ID, configured: Boolean(appId && interstitialId), release };
}
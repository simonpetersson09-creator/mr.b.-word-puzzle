import production from './android-admob.json';
export const ANDROID_TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
export const ANDROID_ADMOB = production;
export function androidAdUnit(development: boolean, appId = production.appId, interstitialId = production.interstitialId) {
  if (development) return ANDROID_TEST_INTERSTITIAL;
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(appId) || !/^ca-app-pub-\d{16}\/\d{10}$/.test(interstitialId)) return null;
  if ([appId,interstitialId].some(id=>id.startsWith('ca-app-pub-3940256099942544'))) return null;
  return interstitialId;
}
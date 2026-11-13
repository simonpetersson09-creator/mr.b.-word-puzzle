import { Capacitor } from '@capacitor/core';
import { readAdConsentChoices, type AdConsentChoices } from './ad-consent';

// Same post-result policy as Ludo: prepared inventory only, 45-minute TTL,
// UMP before ATT/initialization, no waiting for inventory at result exit.
export const AD_TTL = 45 * 60 * 1000;
export interface AdAdapter { consent(): Promise<boolean>; prepare(): Promise<void>; show(): Promise<void> }
export function createDailyAds(adapter: AdAdapter, clock = Date.now) {
  let eligible = false, preparedAt: number | null = null, pending: Promise<void> | null = null;
  const started = new Set<string>(), consumed = new Set<string>();
  let generation = 0;
  return {
    async initialize() { try { eligible = await adapter.consent(); } catch { eligible = false; } },
    preload(roundId: string, guesses: number) {
      // Resume an unfinished word too; inventory is lost when the app restarts.
      if (!eligible || guesses < 1 || started.has(roundId) || consumed.has(roundId)) return;
      started.add(roundId);
      const owner = generation;
      pending = adapter.prepare().then(() => { if (owner === generation) preparedAt = clock(); }).catch(() => { if (owner === generation) { preparedAt = null; started.delete(roundId); } });
    },
    async afterResult(roundId: string, finished: boolean) {
      if (!finished || consumed.has(roundId)) return;
      consumed.add(roundId);
      if (!eligible || preparedAt === null || clock() - preparedAt >= AD_TTL) return;
      preparedAt = null;
      try { await adapter.show(); } catch { /* The saved result remains available. */ }
    },
    settled: () => pending ?? Promise.resolve(),
    invalidate() { generation++; eligible = false; preparedAt = null; started.clear(); },
  };
}

type AdModule = typeof import('@capacitor-community/admob');
let module: AdModule | null = null;
const testAds = import.meta.env.DEV;
// Word Puzzle's own AdMob IDs (app ID lives in Info.plist); Google test unit in development.
export const ORD_IOS_APP_ID = 'ca-app-pub-7448540924654868~2156468939';
export const ORD_IOS_INTERSTITIAL_ID = 'ca-app-pub-7448540924654868/9979118636';
const unit = testAds ? 'ca-app-pub-3940256099942544/4411468910' : ORD_IOS_INTERSTITIAL_ID;
export const nativeAdsEnabled = () => Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('AdMob') && Boolean(unit);
let privacyRequired = false;
export const needsAdPrivacyOptions = () => privacyRequired;
const adapter: AdAdapter = {
  async consent() {
    if (!nativeAdsEnabled()) return false;
    const mod = await import('@capacitor-community/admob');
    module = mod;
    let info = await mod.AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === mod.AdmobConsentStatus.REQUIRED) info = await mod.AdMob.showConsentForm();
    privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
    if (!info.canRequestAds) return false;
    const tracking = await mod.AdMob.trackingAuthorizationStatus();
    if (tracking.status === 'notDetermined') await mod.AdMob.requestTrackingAuthorization();
    await mod.AdMob.initialize({ initializeForTesting: testAds });
    return true;
  },
  async prepare() {
    if (!module || !unit) throw new Error('unavailable');
    await module.AdMob.prepareInterstitial({ adId: unit, isTesting: testAds });
  },
  async show() {
    const mod = module;
    if (!mod) return;
    const listeners: Array<{ remove(): Promise<void> }> = [];
    let finish: () => void = () => {};
    const dismissed = new Promise<void>(resolve => { finish = resolve; });
    try {
      listeners.push(await mod.AdMob.addListener(mod.InterstitialAdPluginEvents.Dismissed, finish));
      listeners.push(await mod.AdMob.addListener(mod.InterstitialAdPluginEvents.FailedToShow, finish));
      await mod.AdMob.showInterstitial();
      await Promise.race([dismissed, new Promise<void>(r => setTimeout(r, 120000))]);
    } finally { await Promise.all(listeners.map(l => l.remove().catch(() => {}))); }
  },
};
export const dailyAds = createDailyAds(adapter);
let initialization: Promise<void> | null = null;
export function initializeAds() { initialization ??= dailyAds.initialize(); return initialization; }
export async function getAdConsentChoices(): Promise<AdConsentChoices> {
  if (!module || !nativeAdsEnabled()) return readAdConsentChoices(undefined,undefined);
  try {
    const reader = module.AdMob as typeof module.AdMob & { getStoredConsentChoices(): Promise<{status:string;purposeConsents:string}> };
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const saved = await Promise.race([reader.getStoredConsentChoices(), new Promise<never>((_,reject)=>{ timer=setTimeout(()=>reject(new Error('unavailable')),5000); })]);
      return readAdConsentChoices(saved.status,saved.purposeConsents);
    } finally { if (timer) clearTimeout(timer); }
  } catch { return readAdConsentChoices(undefined,undefined); }
}
let privacyChanging = false;
export async function showAdPrivacyOptions() {
  if (!module || !privacyRequired || privacyChanging) return false;
  privacyChanging = true;
  dailyAds.invalidate();
  try { await module.AdMob.showPrivacyOptionsForm(); initialization = null; await initializeAds(); return true; }
  catch { return false; }
  finally { privacyChanging = false; }
}
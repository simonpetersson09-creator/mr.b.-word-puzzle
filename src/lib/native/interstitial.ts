import { Capacitor } from '@capacitor/core';

// Same post-result policy as Ludo: prepared inventory only, 45-minute TTL,
// UMP before ATT/initialization, no waiting for inventory at result exit.
export const AD_TTL = 45 * 60 * 1000;
export interface AdAdapter { consent(): Promise<boolean>; prepare(): Promise<void>; show(): Promise<void> }
export function createDailyAds(adapter: AdAdapter, clock = Date.now) {
  let eligible = false, preparedAt: number | null = null, pending: Promise<void> | null = null;
  const started = new Set<string>(), consumed = new Set<string>();
  return {
    async initialize() { try { eligible = await adapter.consent(); } catch { eligible = false; } },
    preload(roundId: string, guesses: number) {
      // Resume an unfinished word too; inventory is lost when the app restarts.
      if (!eligible || guesses < 1 || started.has(roundId) || consumed.has(roundId)) return;
      started.add(roundId);
      pending = adapter.prepare().then(() => { preparedAt = clock(); }).catch(() => { preparedAt = null; });
    },
    async afterResult(roundId: string, finished: boolean) {
      if (!finished || consumed.has(roundId)) return;
      consumed.add(roundId);
      if (!eligible || preparedAt === null || clock() - preparedAt >= AD_TTL) return;
      preparedAt = null;
      try { await adapter.show(); } catch { /* The saved result remains available. */ }
    },
    settled: () => pending ?? Promise.resolve(),
    invalidate() { eligible = false; preparedAt = null; },
  };
}

type AdModule = typeof import('@capacitor-community/admob');
let module: AdModule | null = null;
const testAds = import.meta.env.DEV;
// Production must supply Ord's own IDs, never IDs copied from another Mr. B app.
const unit = testAds ? 'ca-app-pub-3940256099942544/4411468910' : import.meta.env['VITE_ORD_IOS_INTERSTITIAL_ID'];
// Explicit release gate remains closed until native UMP/ATT/presentation verification.
export const nativeAdsEnabled = () => Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('AdMob') && import.meta.env['VITE_ORD_ADS_VERIFIED'] === 'true' && Boolean(unit);
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
      await dismissed;
    } finally { await Promise.all(listeners.map(l => l.remove().catch(() => {}))); }
  },
};
export const dailyAds = createDailyAds(adapter);
let initialization: Promise<void> | null = null;
export function initializeAds() { initialization ??= dailyAds.initialize(); return initialization; }
export async function showAdPrivacyOptions() {
  if (!module || !privacyRequired) return;
  dailyAds.invalidate();
  try { await module.AdMob.showPrivacyOptionsForm(); } finally { initialization = null; await initializeAds(); }
}
import { Capacitor } from '@capacitor/core';
import { readAdConsentChoices, type AdConsentChoices } from './ad-consent';
import { AD_LOAD_TIMEOUT, AD_REQUEST_TIMEOUT, presentPreparedAd, withDeadline } from './ad-presentation';

export const AD_TTL = 45 * 60 * 1000;
export interface AdAdapter { consent(): Promise<boolean>; prepare(): Promise<void>; show(): Promise<void>; discard?(): Promise<void> }
export function createDailyAds(adapter: AdAdapter, clock = Date.now) {
  let eligible=false, prepared: {roundId:string;at:number} | null=null;
  let pending: Promise<void> | null=null, pendingRound: string | null=null, generation=0;
  const consumed=new Set<string>();
  return {
    async initialize() { const owner=generation; try { const allowed=await adapter.consent();if(owner===generation) eligible=allowed;return allowed && owner===generation; } catch { if(owner===generation)eligible=false;return false; } },
    preload(roundId:string,guesses:number) {
      if(!eligible || guesses<1 || consumed.has(roundId) || pendingRound===roundId) return;
      if(prepared?.roundId===roundId && clock()-prepared.at<AD_TTL)return;
      const owner=generation;
      pendingRound=roundId;prepared=null;
      const work=(async()=>{
        if(adapter.discard) await withDeadline(adapter.discard(),AD_REQUEST_TIMEOUT);
        if(owner!==generation || consumed.has(roundId))return;
        await withDeadline(adapter.prepare(),AD_LOAD_TIMEOUT);
        if(owner===generation && pendingRound===roundId && !consumed.has(roundId))prepared={roundId,at:clock()};
      })().catch(async()=>{if(owner===generation && pendingRound===roundId){prepared=null;if(adapter.discard)await withDeadline(adapter.discard(),AD_REQUEST_TIMEOUT).catch(()=>{});}}).finally(()=>{if(owner===generation && pendingRound===roundId)pendingRound=null;});
      pending=work;
    },
    async afterResult(roundId:string,finished:boolean) {
      if(!finished || consumed.has(roundId))return;
      consumed.add(roundId);
      const inventory=prepared;prepared=null;
      if(!eligible || inventory?.roundId!==roundId || clock()-inventory.at>=AD_TTL)return;
      try { await adapter.show(); } catch { /* Ads never control saved game results. */ }
    },
    settled:()=>pending ?? Promise.resolve(),
    invalidate() { generation++;eligible=false;prepared=null;pendingRound=null; },
  };
}

type AdModule=typeof import('@capacitor-community/admob');
type NativeSafety={
  discardWordPuzzleInterstitial(): Promise<void>;
  getWordPuzzleInterstitialState(): Promise<{showing:boolean}>;
  showInterstitial(options?:{deadline:number}): Promise<void>;
  getConsentEligibility(): Promise<{canRequestAds:boolean;privacyOptionsRequirementStatus?:string}>;
};
let module: AdModule | null=null;
let fullscreenBusy=false, privacyChanging=false;
export const isAdFlowBusy=()=>fullscreenBusy || privacyChanging;
const testAds=import.meta.env.DEV;
export const ORD_IOS_APP_ID='ca-app-pub-7448540924654868~2156468939';
export const ORD_IOS_INTERSTITIAL_ID='ca-app-pub-7448540924654868/9979118636';
const unit=testAds?'ca-app-pub-3940256099942544/4411468910':ORD_IOS_INTERSTITIAL_ID;
export const nativeAdsEnabled=()=>Capacitor.getPlatform()==='ios' && Capacitor.isPluginAvailable('AdMob') && Boolean(unit);
let privacyRequired=false;
export const needsAdPrivacyOptions=()=>privacyRequired;
const safety=()=>module?.AdMob as (AdModule['AdMob'] & NativeSafety) | undefined;
async function discardInventory() { const native=safety();if(native)await withDeadline(native.discardWordPuzzleInterstitial(),AD_REQUEST_TIMEOUT); }
async function nativeDialog<T>(work:()=>Promise<T>):Promise<T> { fullscreenBusy=true;try{return await work();}finally{fullscreenBusy=false;} }
const adapter:AdAdapter={
  async consent() {
    if(!nativeAdsEnabled())return false;
    module=await import('@capacitor-community/admob');
    const mod=module;
    let canRequest=false;
    try {
      let info=await withDeadline(mod.AdMob.requestConsentInfo(),AD_REQUEST_TIMEOUT);
      if(info.isConsentFormAvailable && info.status===mod.AdmobConsentStatus.REQUIRED)info=await nativeDialog(()=>mod.AdMob.showConsentForm());
      privacyRequired=info.privacyOptionsRequirementStatus==='REQUIRED';canRequest=info.canRequestAds;
    } catch {
      // Read persisted UMP eligibility; never infer consent from a failed refresh.
      const info=await withDeadline(safety()?.getConsentEligibility() ?? Promise.reject(new Error('reader_missing')),AD_REQUEST_TIMEOUT);
      privacyRequired=info.privacyOptionsRequirementStatus==='REQUIRED';canRequest=info.canRequestAds;
    }
    if(!canRequest)return false;
    const tracking=await withDeadline(mod.AdMob.trackingAuthorizationStatus(),AD_REQUEST_TIMEOUT);
    if(tracking.status==='notDetermined')await nativeDialog(()=>mod.AdMob.requestTrackingAuthorization());
    await withDeadline(mod.AdMob.initialize({initializeForTesting:testAds}),AD_REQUEST_TIMEOUT);
    return true;
  },
  async prepare(){if(!module)throw new Error('unavailable');await module.AdMob.prepareInterstitial({adId:unit,isTesting:testAds});},
  discard:discardInventory,
  async show(){
    const mod=module,native=safety();if(!mod || !native || privacyChanging)return;
    await nativeDialog(()=>presentPreparedAd({
      listen:(event,cb)=>{
        if(event==='shown')return mod.AdMob.addListener(mod.InterstitialAdPluginEvents.Showed,cb);
        if(event==='dismissed')return mod.AdMob.addListener(mod.InterstitialAdPluginEvents.Dismissed,cb);
        return mod.AdMob.addListener(mod.InterstitialAdPluginEvents.FailedToShow,cb);
      },
      show:deadline=>native.showInterstitial({deadline}),
      isShowing:async()=>(await native.getWordPuzzleInterstitialState()).showing,
      discard:discardInventory,
    }));
  },
};
export const dailyAds=createDailyAds(adapter);
let initialization:Promise<void>|null=null;
let initialized=false;
export function initializeAds(){
  if(initialized)return Promise.resolve();
  if(!initialization)initialization=dailyAds.initialize().then(ok=>{initialized=ok;}).finally(()=>{initialization=null;});
  return initialization;
}
export async function getAdConsentChoices():Promise<AdConsentChoices>{
  if(!module || !nativeAdsEnabled())return readAdConsentChoices(undefined,undefined);
  try {
    const reader=module.AdMob as typeof module.AdMob & {getStoredConsentChoices():Promise<{status:string;purposeConsents:string}>};
    const saved=await withDeadline(reader.getStoredConsentChoices(),5000);
    return readAdConsentChoices(saved.status,saved.purposeConsents);
  }catch{return readAdConsentChoices(undefined,undefined);}
}
export async function showAdPrivacyOptions(){
  if(!module || !privacyRequired || privacyChanging || fullscreenBusy || initialization)return false;
  privacyChanging=true;dailyAds.invalidate();initialized=false;
  try {
    await discardInventory();
    await nativeDialog(()=>module ? module.AdMob.showPrivacyOptionsForm() : Promise.reject(new Error('unavailable')));
    await discardInventory();await initializeAds();return true;
  }catch{ return false; }
  finally {privacyChanging=false;}
}

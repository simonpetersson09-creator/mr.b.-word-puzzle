import {afterEach,describe,expect,it,vi} from 'vitest';

async function nativeHarness(release=false) {
  vi.resetModules();
  vi.stubEnv('VITE_MRB_ANDROID_ADS_RELEASE',release?'true':'false');
  vi.stubEnv('DEV',!release);
  vi.doMock('@capacitor/core',()=>({Capacitor:{getPlatform:()=> 'android',isPluginAvailable:()=>true}}));
  const events:string[]=[];
  const listeners=new Map<string,()=>void>();
  const record=vi.fn();
  vi.doMock('./ad-display-log',()=>({recordAdDisplay:record,startAdDisplayLog:vi.fn()}));
  const native={
    requestConsentInfo:vi.fn(async()=>{events.push('consent');return {status:'REQUIRED',isConsentFormAvailable:true,canRequestAds:false,privacyOptionsRequirementStatus:'REQUIRED'};}),
    showConsentForm:vi.fn(async()=>{events.push('form');return {status:'OBTAINED',canRequestAds:true,privacyOptionsRequirementStatus:'REQUIRED'};}),
    getConsentEligibility:vi.fn(async()=>({canRequestAds:false,privacyOptionsRequirementStatus:'REQUIRED'})),
    initialize:vi.fn(async()=>{events.push('initialize');}),
    trackingAuthorizationStatus:vi.fn(),requestTrackingAuthorization:vi.fn(),
    discardWordPuzzleInterstitial:vi.fn(async()=>{}),
    prepareInterstitial:vi.fn(async()=>{events.push('prepare');}),
    showInterstitial:vi.fn(async()=>{events.push('show');listeners.get('shown')?.();listeners.get('dismissed')?.();}),
    getWordPuzzleInterstitialState:vi.fn(async()=>({showing:false})),
    addListener:vi.fn(async(event:string,callback:()=>void)=>{listeners.set(event,callback);return {remove:async()=>{listeners.delete(event);}};}),
    getStoredConsentChoices:vi.fn(async()=>({status:'OBTAINED',purposeConsents:'1000'})),
    showPrivacyOptionsForm:vi.fn(async()=>{events.push('privacy');}),
  };
  vi.doMock('@capacitor-community/admob',()=>({AdMob:native,AdmobConsentStatus:{REQUIRED:'REQUIRED'},InterstitialAdPluginEvents:{Showed:'shown',Dismissed:'dismissed',FailedToShow:'failed'}}));
  const app=await import('./interstitial');
  return {app,native,events,record};
}
afterEach(()=>{vi.unstubAllEnvs();vi.doUnmock('@capacitor/core');vi.doUnmock('@capacitor-community/admob');vi.doUnmock('./ad-display-log');vi.resetModules();});
describe('Android native AdMob contract',()=>{
  it('requests UMP before preload and offers one ad only at each completed word’s exit',async()=>{
    const {app,native,events,record}=await nativeHarness();
    await app.initializeAds();
    expect(events).toEqual(['consent','form','initialize']);
    for(const key of ['2026-11-16','2026-11-16:2','2026-11-16:3']) {
      const loaded=native.prepareInterstitial.mock.calls.length;
      app.dailyAds.preload(key,0);expect(native.prepareInterstitial).toHaveBeenCalledTimes(loaded);
      app.dailyAds.preload(key,1);await app.dailyAds.settled();
      const prior=native.showInterstitial.mock.calls.length;
      await app.dailyAds.afterResult(key,false);expect(native.showInterstitial).toHaveBeenCalledTimes(prior);
      await Promise.all([app.dailyAds.afterResult(key,true),app.dailyAds.afterResult(key,true)]);
    }
    expect(native.prepareInterstitial).toHaveBeenCalledTimes(3);expect(native.showInterstitial).toHaveBeenCalledTimes(3);
    expect(record.mock.calls).toEqual([['2026-11-16',true],['2026-11-16:2',true],['2026-11-16:3',true]]);
    expect(native.prepareInterstitial).toHaveBeenCalledWith({adId:'ca-app-pub-3940256099942544/1033173712',isTesting:true});
    expect(native.trackingAuthorizationStatus).not.toHaveBeenCalled();expect(native.requestTrackingAuthorization).not.toHaveBeenCalled();
  });
  it('uses the supplied production unit only in an explicit non-development release',async()=>{
    const {app,native,record}=await nativeHarness(true);await app.initializeAds();
    app.dailyAds.preload('2026-11-16',1);await app.dailyAds.settled();
    expect(native.prepareInterstitial).toHaveBeenCalledWith({adId:'ca-app-pub-7448540924654868/3980826116',isTesting:false});
    expect(native.initialize).toHaveBeenCalledWith({initializeForTesting:false});
    await app.dailyAds.afterResult('2026-11-16',true);
    expect(record).toHaveBeenCalledExactlyOnceWith('2026-11-16',false);
  });
  it('never requests an ad when UMP denies eligibility, retaining required privacy access',async()=>{
    const {app,native}=await nativeHarness();
    native.requestConsentInfo.mockRejectedValue(new Error('offline'));
    await app.initializeAds();app.dailyAds.preload('2026-11-16',1);await app.dailyAds.settled();
    expect(native.initialize).not.toHaveBeenCalled();expect(native.prepareInterstitial).not.toHaveBeenCalled();expect(app.needsAdPrivacyOptions()).toBe(true);
  });
  it('reads actual purpose choices and invalidates prepared ads when privacy options change',async()=>{
    const {app,native}=await nativeHarness();await app.initializeAds();
    app.dailyAds.preload('2026-11-16',1);await app.dailyAds.settled();
    expect(await app.getAdConsentChoices()).toEqual({storage:'allowed',adProfile:'denied',useAdProfile:'denied'});
    expect(await app.showAdPrivacyOptions()).toBe(true);expect(native.showPrivacyOptionsForm).toHaveBeenCalledTimes(1);
    await app.dailyAds.afterResult('2026-11-16',true);expect(native.showInterstitial).not.toHaveBeenCalled();
    expect(native.requestConsentInfo).toHaveBeenCalledTimes(2);
  });
  it('continues from completed results if Android has no fill or presentation fails',async()=>{
    const {app,native,record}=await nativeHarness();await app.initializeAds();
    native.prepareInterstitial.mockRejectedValueOnce(new Error('no fill'));
    app.dailyAds.preload('2026-11-16',1);await app.dailyAds.settled();
    await expect(app.dailyAds.afterResult('2026-11-16',true)).resolves.toBeUndefined();expect(native.showInterstitial).not.toHaveBeenCalled();
    native.showInterstitial.mockRejectedValueOnce(new Error('failed to show'));
    app.dailyAds.preload('2026-11-16:2',1);await app.dailyAds.settled();
    await expect(app.dailyAds.afterResult('2026-11-16:2',true)).resolves.toBeUndefined();
    expect(record).not.toHaveBeenCalled();
  });
});
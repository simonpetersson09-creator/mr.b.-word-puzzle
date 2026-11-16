import {afterEach,expect,it,vi} from 'vitest';
async function harness(){
  vi.resetModules();
  vi.doMock('@capacitor/core',()=>({Capacitor:{getPlatform:()=> 'ios',isPluginAvailable:()=>true}}));
  const events:string[]=[];
  const native={
    requestConsentInfo:vi.fn(async()=>{events.push('ump');return {status:'REQUIRED',isConsentFormAvailable:true,canRequestAds:false,privacyOptionsRequirementStatus:'REQUIRED'};}),
    showConsentForm:vi.fn(async()=>{events.push('form');return {status:'OBTAINED',canRequestAds:true,privacyOptionsRequirementStatus:'REQUIRED'};}),
    getConsentEligibility:vi.fn(async()=>({canRequestAds:false,privacyOptionsRequirementStatus:'UNKNOWN'})),
    trackingAuthorizationStatus:vi.fn(async()=>({status:'notDetermined'})),
    requestTrackingAuthorization:vi.fn(async()=>{events.push('att');}),
    initialize:vi.fn(async()=>{events.push('ads');}),
    discardWordPuzzleInterstitial:vi.fn(async()=>{}),
    showPrivacyOptionsForm:vi.fn(async()=>{}),
    prepareInterstitial:vi.fn(async()=>{}),
  };
  vi.doMock('@capacitor-community/admob',()=>({AdMob:native,AdmobConsentStatus:{REQUIRED:'REQUIRED'}}));
  return {app:await import('./interstitial'),native,events};
}
afterEach(()=>{vi.doUnmock('@capacitor/core');vi.doUnmock('@capacitor-community/admob');vi.resetModules();});
it('requests iOS UMP before ATT and Mobile Ads initialization',async()=>{
  const {app,events}=await harness();await app.initializeAds();
  expect(events).toEqual(['ump','form','att','ads']);
});
it('keeps privacy access on first launch when both UMP reads fail, without requesting ads',async()=>{
  const {app,native}=await harness();
  native.requestConsentInfo.mockRejectedValue(new Error('offline'));
  native.getConsentEligibility.mockRejectedValue(new Error('offline'));
  await app.initializeAds();
  expect(app.needsAdPrivacyOptions()).toBe(true);
  expect(await app.showAdPrivacyOptions()).toBe(true);
  expect(native.showPrivacyOptionsForm).toHaveBeenCalledTimes(1);
  expect(native.initialize).not.toHaveBeenCalled();expect(native.requestTrackingAuthorization).not.toHaveBeenCalled();
});
it('does not replay an obtained UMP form or an already decided ATT prompt',async()=>{
  const {app,native}=await harness();
  native.requestConsentInfo.mockResolvedValue({status:'OBTAINED',isConsentFormAvailable:true,canRequestAds:true,privacyOptionsRequirementStatus:'REQUIRED'});
  native.trackingAuthorizationStatus.mockResolvedValue({status:'denied'});
  await app.initializeAds();
  expect(native.showConsentForm).not.toHaveBeenCalled();expect(native.requestTrackingAuthorization).not.toHaveBeenCalled();
  expect(native.initialize).toHaveBeenCalledTimes(1);
});
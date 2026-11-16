import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {androidAdUnit,ANDROID_TEST_INTERSTITIAL} from './android-config';
import {createAndroidBackHandler} from './android-back';
// @ts-expect-error Build-time scripts are JavaScript.
import {androidAdsConfig} from '../../../scripts/android-ads-config.mjs';
// @ts-expect-error Native patch scripts are JavaScript.
import {patchAndroidExecutor,patchAndroidCallback} from '../../../scripts/patch-admob-android-safety.mjs';
describe('Android release preparation',()=>{
  it('uses com.mrb.wordpuzzle without changing the default iOS identity',async()=>{
    const old=process.env['MRB_NATIVE_PLATFORM'];
    try {
      delete process.env['MRB_NATIVE_PLATFORM'];vi.resetModules();
      expect((await import('../../../capacitor.config')).default.appId).toBe('se.shiningdays.mrbwordpuzzle');
      process.env['MRB_NATIVE_PLATFORM']='android';vi.resetModules();
      expect((await import('../../../capacitor.config')).default.appId).toBe('com.mrb.wordpuzzle');
    }finally{if(old===undefined)delete process.env['MRB_NATIVE_PLATFORM'];else process.env['MRB_NATIVE_PLATFORM']=old;vi.resetModules();}
  });
  it('keeps production Android ads disabled without the owner’s values',()=>{expect(androidAdUnit(false)).toBeNull();expect(()=>androidAdsConfig({},true)).toThrow();});
  it('uses only Google’s official Android sample in development',()=>{expect(androidAdUnit(true)).toBe('ca-app-pub-3940256099942544/1033173712');});
  it('rejects sample values for a production release',()=>{expect(androidAdUnit(false,'ca-app-pub-3940256099942544~3347511713',ANDROID_TEST_INTERSTITIAL)).toBeNull();expect(()=>androidAdsConfig({VITE_MRB_ANDROID_ADMOB_APP_ID:'ca-app-pub-3940256099942544~3347511713',VITE_MRB_ANDROID_ADMOB_INTERSTITIAL_ID:ANDROID_TEST_INTERSTITIAL},true)).toThrow();});
  it('targets SDK 36 with Java 21',()=>{const vars=readFileSync('android/variables.gradle','utf8');expect(vars).toMatch(/compileSdkVersion = 36/);expect(vars).toMatch(/targetSdkVersion = 36/);expect(readFileSync('android/app/build.gradle','utf8')).toContain('JavaVersion.VERSION_21');});
  it('keeps native safety patches reproducible',()=>{
    const base='node_modules/@capacitor-community/admob/android/src/main/java/com/getcapacitor/community/admob/interstitial/';
    const executor=readFileSync(base+'AdInterstitialExecutor.java','utf8'),callback=readFileSync(base+'InterstitialAdCallbackAndListeners.kt','utf8');
    expect(patchAndroidExecutor(executor)).toBe(executor);expect(patchAndroidCallback(callback)).toBe(callback);
    expect(()=>patchAndroidExecutor('wrong version')).toThrow();
  });
});
describe('Android Back',()=>{
  it('closes the topmost view without minimizing or saving again',async()=>{const actions={busy:()=>false,dismissOverlay:()=>true,save:vi.fn(),minimize:vi.fn()};await createAndroidBackHandler(actions)();expect(actions.save).not.toHaveBeenCalled();expect(actions.minimize).not.toHaveBeenCalled();});
  it('cannot bypass a visible ad or guess reveal',async()=>{const actions={busy:()=>true,dismissOverlay:vi.fn(),save:vi.fn(),minimize:vi.fn()};await createAndroidBackHandler(actions)();expect(actions.dismissOverlay).not.toHaveBeenCalled();expect(actions.minimize).not.toHaveBeenCalled();});
  it('flushes saved progress before minimizing and ignores concurrent presses',async()=>{const order:string[]=[];let finish=()=>{};const handler=createAndroidBackHandler({busy:()=>false,dismissOverlay:()=>false,save:()=>new Promise<void>(resolve=>{finish=()=>{order.push('saved');resolve();};}),minimize:async()=>{order.push('minimized');}});const pending=handler();await handler();expect(order).toEqual([]);finish();await pending;expect(order).toEqual(['saved','minimized']);});
  it('temporary save failures cannot trap the app foreground',async()=>{const minimize=vi.fn().mockResolvedValue(undefined);await createAndroidBackHandler({busy:()=>false,dismissOverlay:()=>false,save:()=>Promise.reject(new Error('disk')),minimize})();expect(minimize).toHaveBeenCalledTimes(1);});
});
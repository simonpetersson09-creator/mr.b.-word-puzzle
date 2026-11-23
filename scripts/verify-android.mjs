import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {androidAdsConfig} from './android-ads-config.mjs';
import {verifyAndroidPackage} from './android-package.mjs';
const release=process.argv.includes('--release'),synced=process.argv.includes('--synced');
const read=p=>readFileSync(p,'utf8');
const assert=(valid,message)=>{if(!valid)throw new Error(message);};
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
try {
  for(const p of ['android/gradlew','android/gradlew.bat','android/gradle/wrapper/gradle-wrapper.jar','android/app/src/main/java/com/mrb/wordpuzzle/MainActivity.java']) assert(existsSync(p),`Missing ${p}`);
  const gradle=read('android/app/build.gradle'),vars=read('android/variables.gradle'),manifest=read('android/app/src/main/AndroidManifest.xml');
  assert(gradle.includes('applicationId "com.mrb.wordpuzzle"') && gradle.includes('namespace = "com.mrb.wordpuzzle"'),'Incorrect Android identity');
  assert(vars.includes('compileSdkVersion = 36') && vars.includes('targetSdkVersion = 36') && vars.includes('minSdkVersion = 26'),'Android SDK configuration mismatch');
  assert(gradle.includes('JavaVersion.VERSION_21'),'Java 21 missing');
  assert(!gradle.includes('signingConfigs'),'Signing must be supplied separately, not generated here');
  assert(manifest.includes('android:value="${admobAppId}"') && manifest.includes('android:windowSoftInputMode="adjustResize"') && manifest.includes('android:usesCleartextTraffic="false"'),'Android manifest configuration missing');
  const base='node_modules/@capacitor-community/admob/android/src/main/java/com/getcapacitor/community/admob/';
  assert(read(base+'AdMob.java').includes('getConsentEligibility') && read(base+'AdMob.java').includes('privacyOptionsRequirementStatus') && read(base+'AdMob.java').includes('getWordPuzzleInterstitialState'),'Android consent/safety patch missing');
  assert(read(base+'interstitial/AdInterstitialExecutor.java').includes('System.currentTimeMillis() >= deadline'),'Presentation deadline missing');
  assert(read(base+'interstitial/InterstitialAdCallbackAndListeners.kt').includes('generation != AdInterstitialExecutor.inventoryGeneration'),'Inventory protection missing');
  for(const folder of readdirSync('resources/android/res')) {
    for(const file of readdirSync(join('resources/android/res',folder))) {
      const relative=join(folder,file);
      assert(sha(join('resources/android/res',relative))===sha(join('android/app/src/main/res',relative)),`Stale Android resource ${relative}`);
    }
  }
  const ads=androidAdsConfig(process.env,release);
  if(synced || release) {
    assert(existsSync('android/sync-receipt.json'),'Android sync receipt missing; run native:sync:android first');
    const receipt=JSON.parse(read('android/sync-receipt.json'));
    assert(receipt.appId===ads.appId && receipt.interstitialId===ads.interstitialId && receipt.adsEnabled===ads.configured && receipt.release===release,'Ad configuration or release mode changed since last sync');
    verifyAndroidPackage(receipt);
    const code=readdirSync('android/app/src/main/assets/public/assets').filter(f=>f.endsWith('.js')).map(f=>read('android/app/src/main/assets/public/assets/'+f)).join('\n');
    if(release)assert(code.includes(ads.interstitialId),'Production Android ad unit absent from bundle');
  }
  console.log(`Android source checks passed (SDK 36, Java 21, own identity/resources, consent and ad safety). ${synced?'Sync receipt checked.':'Latest web package NOT checked; run native:sync:android locally.'}`);
  console.log('Not a native compilation, signed AAB or physical-device test.');
}catch(error){console.error(error.message);process.exit(1);}
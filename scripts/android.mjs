import {existsSync} from 'node:fs';
import {androidAdsConfig} from './android-ads-config.mjs';
import {androidEnvironment,checkNode,checkAndroidBuildMode,projectRoot,runNode,runGradle} from './android-tools.mjs';
const action=process.argv[2] ?? 'sync';
const release=process.argv.includes('--release') || action==='bundle';
let env={...process.env,MRB_NATIVE_PLATFORM:'android',VITE_MRB_ANDROID_ADS_RELEASE:release?'true':'false'};
try {
  process.chdir(projectRoot);
  checkNode();
  if(!['sync','open','build','bundle','doctor'].includes(action))throw new Error('Use sync, open, build, bundle or doctor');
  checkAndroidBuildMode(action,release);
  if(['build','bundle','doctor'].includes(action))env=androidEnvironment(env);
  if(action==='doctor') {console.log('Android environment ready: Node, JDK 21, SDK 36, Build Tools 36.0.0 and Platform Tools.');process.exit(0);}
  const ads=androidAdsConfig(env,release);
  env.VITE_MRB_ANDROID_ADMOB_APP_ID=ads.appId;
  env.VITE_MRB_ANDROID_ADMOB_INTERSTITIAL_ID=ads.interstitialId;
  const cap='node_modules/@capacitor/cli/bin/capacitor';
  if(!existsSync('android'))throw new Error('Committed Android project missing; restore it before building.');
  // Capacitor checks webDir before invoking sync hooks: prepare even on a clean checkout.
  if(!existsSync('dist-native/index.html'))runNode(['scripts/android-sync.mjs','before'],{...env,CAPACITOR_PLATFORM_NAME:'android'});
  runNode([cap,'sync','android'],env);
  if(action==='open')runNode([cap,'open','android'],env);
  if(action==='build')runGradle('assembleDebug',env);
  if(action==='bundle') {
    runGradle('bundleRelease',env);
    console.log('Unsigned AAB only. Sign with the owner’s upload key before uploading to Google Play.');
  }
}catch(error){console.error(error.message);process.exit(1);}
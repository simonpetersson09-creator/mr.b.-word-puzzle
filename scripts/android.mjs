import {spawnSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import {androidAdsConfig} from './android-ads-config.mjs';
import {androidPackageHashes} from './android-package.mjs';
const action=process.argv[2] ?? 'sync';
const release=process.argv.includes('--release') || action==='bundle';
const env={...process.env,MRB_NATIVE_PLATFORM:'android',VITE_MRB_ANDROID_ADS_RELEASE:release?'true':'false'};
function run(cmd,args,cwd) {
  const result=spawnSync(cmd,args,{stdio:'inherit',env,cwd,shell:process.platform==='win32'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status || 1);
}
try {
  if(!['sync','open','build','bundle'].includes(action))throw new Error('Use sync, open, build or bundle');
  const ads=androidAdsConfig(env,release);
  env.VITE_MRB_ANDROID_ADMOB_APP_ID=ads.appId;
  env.VITE_MRB_ANDROID_ADMOB_INTERSTITIAL_ID=ads.interstitialId;
  if(action==='bundle') {
    run('node',['scripts/verify-android.mjs','--synced','--release']);
    run(process.platform==='win32'?'gradlew.bat':'./gradlew',['bundleRelease'],'android');
    console.log('Unsigned AAB only. Sign with the owner’s upload key before uploading to Google Play.');
    process.exit(0);
  }
  run('node',['scripts/patch-admob-consent.mjs','android']);
  run('bun',['run','native:web']);
  if(!existsSync('android'))run('bunx',['cap','add','android']);
  run('bunx',['cap','sync','android']);
  run('node',['scripts/set-android-resources.mjs']);
  const hashes=androidPackageHashes();
  writeFileSync('android/sync-receipt.json',JSON.stringify({version:2,packageId:'com.mrb.wordpuzzle',appId:ads.appId,interstitialId:ads.interstitialId,adsEnabled:ads.configured,release,hashes},null,2));
  run('node',['scripts/verify-android.mjs','--synced',...(release?['--release']:[])]);
  if(action==='open')run('bunx',['cap','open','android']);
  if(action==='build')run(process.platform==='win32'?'gradlew.bat':'./gradlew',['assembleDebug'],'android');
}catch(error){console.error(error.message);process.exit(1);}
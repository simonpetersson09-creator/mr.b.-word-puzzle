import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {androidAdsConfig} from './android-ads-config.mjs';
const action=process.argv[2] ?? 'sync';
const release=process.argv.includes('--release');
const env={...process.env,MRB_NATIVE_PLATFORM:'android'};
function run(cmd,args,cwd) {
  const result=spawnSync(cmd,args,{stdio:'inherit',env,cwd,shell:process.platform==='win32'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status || 1);
}
function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]); }
try {
  if(!['sync','open','build','bundle'].includes(action))throw new Error('Use sync, open, build or bundle');
  const ads=androidAdsConfig(env,release || action==='bundle');
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
  const inputs=[...files('src'),...files('native-shell'),...files('scripts'),...files('resources/android'),...files('android/app/src/main/assets/public'),'android/app/src/main/assets/capacitor.config.json','android/app/build.gradle','android/variables.gradle','android/app/src/main/AndroidManifest.xml','capacitor.config.ts','vite.native.config.ts','package.json','bun.lock'];
  const hashes=Object.fromEntries(inputs.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
  writeFileSync('android/sync-receipt.json',JSON.stringify({appId:ads.appId,interstitialId:ads.interstitialId,adsEnabled:ads.configured,hashes},null,2));
  run('node',['scripts/verify-android.mjs','--synced',...(release?['--release']:[])]);
  if(action==='open')run('bunx',['cap','open','android']);
  if(action==='build')run(process.platform==='win32'?'gradlew.bat':'./gradlew',['assembleDebug'],'android');
}catch(error){console.error(error.message);process.exit(1);}
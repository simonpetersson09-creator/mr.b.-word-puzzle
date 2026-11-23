// Capacitor invokes these hooks for both npm/npx and the project wrapper; iOS is a no-op.
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { androidAdsConfig } from './android-ads-config.mjs';
import { androidPackageHashes } from './android-package.mjs';
import { checkNode, projectRoot, runNode } from './android-tools.mjs';

if (process.env.CAPACITOR_PLATFORM_NAME === 'android') {
  try {
    checkNode();
    process.chdir(projectRoot);
    const release = process.env.VITE_MRB_ANDROID_ADS_RELEASE === 'true';
    const ads = androidAdsConfig(process.env, release);
    const env = { ...process.env, MRB_NATIVE_PLATFORM: 'android', VITE_MRB_ANDROID_ADS_RELEASE: String(release), VITE_MRB_ANDROID_ADMOB_APP_ID: ads.appId, VITE_MRB_ANDROID_ADMOB_INTERSTITIAL_ID: ads.interstitialId };
    if (process.argv[2] === 'before') {
      rmSync(join(projectRoot, 'android/sync-receipt.json'), { force: true });
      runNode(['scripts/patch-admob-consent.mjs', 'android'], env);
      runNode(['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.native.config.ts'], env);
    } else if (process.argv[2] === 'after') {
      runNode(['scripts/set-android-resources.mjs'], env);
      const hashes = androidPackageHashes();
      writeFileSync('android/sync-receipt.json', JSON.stringify({ version: 2, packageId: 'com.mrb.wordpuzzle', appId: ads.appId, interstitialId: ads.interstitialId, adsEnabled: ads.configured, release, hashes }, null, 2));
      runNode(['scripts/verify-android.mjs', '--synced', ...(release ? ['--release'] : [])], env);
    } else throw new Error('Expected before or after sync hook.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
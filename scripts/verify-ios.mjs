import { readFileSync, existsSync } from 'node:fs';
import { iosSourceChecks } from './ios-source-checks.mjs';
const read = path => readFileSync(path, 'utf8');
const checks = iosSourceChecks();
for (const [label, passed] of checks) { console.log(`${passed ? 'OK' : 'FAIL'}: ${label}`); if (!passed) process.exitCode = 1; }
console.log('UNVERIFIED: installed signing certificate/profile, Xcode archive, physical-device tests and App Store Connect. AdMob uses Word Puzzle IDs; UMP/ATT and ad display must be tested on a physical iPhone.');
const packagePath='ios/App/CapApp-SPM/Package.swift';
const spm=existsSync(packagePath) ? read(packagePath) : '';
const configPath = 'ios/App/App/capacitor.config.json';
const syncedConfig = existsSync(configPath) ? JSON.parse(read(configPath)) : null;
const requireSynced = process.argv.includes('--release') || process.argv.includes('--synced');
const locales = JSON.parse(read('scripts/att-locales.json'));
const sourceBundle = 'dist-native/index.html';
const syncedBundle = 'ios/App/App/public/index.html';
const currentBundle = existsSync(sourceBundle) && existsSync(syncedBundle) && read(sourceBundle) === read(syncedBundle);
for (const [label,passed] of [
  ['current offline bundle matches generated version',currentBundle],
  ['all 40 localized ATT resources',Object.keys(locales).length === 40 && Object.keys(locales).every(code=>existsSync(`ios/App/App/PermissionLocalizations/${code === 'no' ? 'nb' : code}.lproj/InfoPlist.strings`)) && read('ios/App/App.xcodeproj/project.pbxproj').includes('InfoPlist.strings in Resources')],
  ['synced offline web bundle',existsSync('ios/App/App/public/index.html')],
  ['synced Capacitor identity',syncedConfig?.appId === 'se.shiningdays.mrbwordpuzzle' && syncedConfig?.appName === 'Mr.B. Word Puzzle' && !syncedConfig?.server],
  ['native plugins linked', ['CapacitorPreferences','CapacitorApp','CapacitorDevice','CapacitorHaptics','CapacitorCommunityAdmob','CapacitorShare','CapacitorClipboard'].every(name=>spm.includes(name))],
  ['patched iOS consent reader',existsSync('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift') && ['MRB_READ_CONSENT', 'getStoredConsentChoices', 'getConsentEligibility','information.privacyOptionsRequirementStatus'].every(marker => read('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift').includes(marker))],
  ['patched interstitial safety',existsSync('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/Interstitial/AdInterstitialExecutor.swift') && ['MRB_INTERSTITIAL_SAFETY','loadGeneration == self.inventoryGeneration','Interstitial presentation deadline expired','No active ViewController'].every(marker=>read('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/Interstitial/AdInterstitialExecutor.swift').includes(marker)) && ['discardWordPuzzleInterstitial','getWordPuzzleInterstitialState'].every(marker=>read('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift').includes(marker))],
]) {console.log(`${passed ? 'OK' : 'PENDING'}: ${label}`);if (!passed && requireSynced) process.exitCode=1;}
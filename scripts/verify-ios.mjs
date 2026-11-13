import { readFileSync, existsSync } from 'node:fs';
const read = path => readFileSync(path, 'utf8');
const project = read('ios/App/App.xcodeproj/project.pbxproj');
const plist = read('ios/App/App/Info.plist');
const privacy = read('ios/App/App/PrivacyInfo.xcprivacy');
const checks = [
  ['own bundle identity', project.includes('PRODUCT_BUNDLE_IDENTIFIER = se.shiningdays.mrbord;')],
  ['privacy manifest bundled', project.includes('PrivacyInfo.xcprivacy in Resources')],
  ['Preferences API reason', privacy.includes('CA92.1')],
  ['ATT copy', plist.includes('NSUserTrackingUsageDescription')],
  ['Google app identifier', plist.includes('GADApplicationIdentifier')],
  ['local native entry', read('native-shell/index.html').includes('viewport-fit=cover')],
  ['licensed words', existsSync('src/lib/ord/words/LGPL-3.0.txt')],
];
for (const [label, passed] of checks) { console.log(`${passed ? 'OK' : 'FAIL'}: ${label}`); if (!passed) process.exitCode = 1; }
console.log('UNVERIFIED: Xcode archive/signing, device tests, full ad-network list, store privacy declarations, icons/splash and Ord production ad IDs. Ads remain gated off.');
const packagePath='ios/App/CapApp-SPM/Package.swift';
const spm=existsSync(packagePath) ? read(packagePath) : '';
for (const [label,passed] of [
  ['synced offline web bundle',existsSync('ios/App/App/public/index.html')],
  ['synced Capacitor config',existsSync('ios/App/App/capacitor.config.json')],
  ['native plugins linked', ['CapacitorPreferences','CapacitorApp','CapacitorDevice','CapacitorHaptics','CapacitorCommunityAdmob'].every(name=>spm.includes(name))],
]) {console.log(`${passed ? 'OK' : 'PENDING'}: ${label}`);if (!passed && process.argv.includes('--release')) process.exitCode=1;}
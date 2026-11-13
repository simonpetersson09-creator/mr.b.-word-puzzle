import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function iosSourceChecks(root = '.') {
  const read = path => readFileSync(resolve(root, path), 'utf8');
  const exists = path => existsSync(resolve(root, path));
  const project = read('ios/App/App.xcodeproj/project.pbxproj');
  const config = read('capacitor.config.ts');
  const plist = read('ios/App/App/Info.plist');
  const exportOptions = read('ios/App/ExportOptions.plist');
  const targetConfig = id => project.match(new RegExp(`${id} /\\* (?:Debug|Release) \\*/ = \\{[\\s\\S]*?buildSettings = \\{([\\s\\S]*?)\\n\\t\\t\\t\\};`))?.[1] ?? '';
  const debug = targetConfig('504EC3171FED79650016851F');
  const release = targetConfig('504EC3181FED79650016851F');
  const hasSetting = (source, key, value) => source.includes(`${key} = ${value};`);
  const icon = JSON.parse(read('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json'));
  const iconPath = `ios/App/App/Assets.xcassets/AppIcon.appiconset/${icon.images?.[0]?.filename ?? ''}`;
  const iconBytes = exists(iconPath) ? readFileSync(resolve(root, iconPath)) : null;
  const scheme = read('ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme');
  return [
    ['Capacitor bundle ID', config.includes("appId: 'se.shiningdays.mrbwordpuzzle'")],
    ['Debug bundle ID', hasSetting(debug, 'PRODUCT_BUNDLE_IDENTIFIER', 'se.shiningdays.mrbwordpuzzle')],
    ['Release bundle ID', hasSetting(release, 'PRODUCT_BUNDLE_IDENTIFIER', 'se.shiningdays.mrbwordpuzzle')],
    ['no old identity in iOS project', !project.includes('se.shiningdays.mrbord')],
    ['Apple team in Debug and Release', [debug, release].every(s => hasSetting(s, 'DEVELOPMENT_TEAM', 'F43HQMHCAT'))],
    ['automatic development signing', hasSetting(debug, 'CODE_SIGN_STYLE', 'Automatic')],
    ['manual App Store signing', hasSetting(release, 'CODE_SIGN_STYLE', 'Manual') && hasSetting(release, '"CODE_SIGN_IDENTITY[sdk=iphoneos*]"', '"Apple Distribution"')],
    ['App Store provisioning profile', hasSetting(release, '"PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]"', '"Mr B Word Puzzle App Store"')],
    ['export identity/team/profile', exportOptions.includes('<key>se.shiningdays.mrbwordpuzzle</key><string>Mr B Word Puzzle App Store</string>') && exportOptions.includes('<key>teamID</key><string>F43HQMHCAT</string>') && exportOptions.includes('<string>app-store-connect</string>')],
    ['shared Release archive scheme', scheme.includes('BlueprintIdentifier="504EC3031FED79650016851F"') && scheme.includes('<ArchiveAction buildConfiguration="Release"')],
    ['display name and inherited bundle ID', plist.includes('<string>Mr.B. Word Puzzle</string>') && plist.includes('<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>')],
    ['privacy manifest bundled', project.includes('PrivacyInfo.xcprivacy in Resources')],
    ['Preferences API reason', read('ios/App/App/PrivacyInfo.xcprivacy').includes('CA92.1')],
    ['ATT copy', plist.includes('NSUserTrackingUsageDescription')],
    ['Google app identifier', plist.includes('GADApplicationIdentifier')],
    ['local native entry', read('native-shell/index.html').includes('viewport-fit=cover') && !/\bserver\s*:/.test(config)],
    ['licensed words', exists('src/lib/ord/words/LGPL-3.0.txt')],
    ['1024px app icon', Boolean(iconBytes && iconBytes.length > 24 && iconBytes.subarray(1, 4).toString() === 'PNG' && iconBytes.readUInt32BE(16) === 1024 && iconBytes.readUInt32BE(20) === 1024)],
  ];
}
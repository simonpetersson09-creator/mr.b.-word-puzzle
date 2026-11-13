# Mr.B. Word Puzzle — Xcode readiness

## Ready in source
- Own iOS project with the explicitly requested identity `se.shiningdays.mrbwordpuzzle` in Capacitor, Debug, Release and export. Team `F43HQMHCAT`; automatic development signing in Debug; manual Apple Distribution and profile `Mr B Word Puzzle App Store` in Release.
- Shared App scheme archives Release; ExportOptions.plist maps this app to its supplied distribution profile. Source verification guards identity/team/profile, scheme, manifest and 1024px icon; synced verification also checks local output/config and plugin linkage.
- Local offline web entry, bundled dictionaries/fonts/images, Preferences storage, App/Device/Haptics and AdMob dependencies.
- New 1024×1024 opaque app icon, two family headers at 3840×1646 and 3840×2560, branded local splash and favicon. Header exports are enlarged from generated artwork, not native 3840-detail renders.
- Word-win confetti before the result screen. Advertisement attempts remain on result exit, never while playing.
- Result ledger with native primary/backup and an older recovery generation; inconclusive native reads and unsupported payloads block overwrite.

## Required on the release Mac
1. Install with `bun install --frozen-lockfile` using Bun and Node.js 22+ (applies the consent-reader patch). Use an App Store-accepted Xcode/iOS SDK.
2. Run `bun run native:sync:ios`: consent patch → local web bundle → Capacitor sync → synced verification. This follows Ludo’s isolated local bundle and Yatzy’s patch-before-sync/check-after-sync workflow; unrelated push, rewarded and App Open features are not imported. Do not edit generated Package.swift by hand.
3. Run `bun run native:verify:ios -- --release`; missing synced output or plugins must fail this release check.
4. Install Apple Distribution certificate **with its private key** in the Mac keychain and the **Mr B Word Puzzle App Store** profile. It must be unexpired, match `F43HQMHCAT` / `se.shiningdays.mrbwordpuzzle` and include that certificate. The supplied profile name does not install or validate it. Debug device runs need Apple Development provisioning and a registered device.
5. Open `bun run native:open:ios`, resolve Swift packages and test on a physical iPhone. Choose **App → Any iOS Device (arm64) → Product → Archive → Validate App → Distribute App → App Store Connect**. Alternatively `bun run native:archive:ios` synchronizes/verifies then archives, and `bun run native:export:ios` exports the IPA. Output defaults outside the repo in the Mac temporary directory; override with IOS_OUTPUT_DIR.

## App Store Connect
- Create/select **Mr.B. Word Puzzle** under the owning team with registered ID `se.shiningdays.mrbwordpuzzle`. Choose SKU and primary language there; no invented SKU or credentials are committed.
- Current version/build: **1.0 (1)**. Increment CURRENT_PROJECT_VERSION in both target configurations for each subsequent upload; set MARKETING_VERSION for each release.
- Complete support/privacy URLs, screenshots, description, keywords, categories, age rating, privacy and encryption/export compliance. The unchanged target supports iPhone and iPad: test both and provide appropriate screenshots, or explicitly decide device coverage before submission.
- TestFlight must confirm offline launch, upgrades, statistics recovery, 03.00 boundary, safe areas and real UMP/ATT/ads if activated. Store privacy declarations must reflect the packaged SDKs even with ads disabled.
- App acceptance and installed certificate/profile validity cannot be established from source checks.

## GitHub
- Keep sources, lockfile, own native project, shared scheme and export settings; clone the Lovable-connected repository on the Mac. Connection/upload itself has not been performed here.
- Exclude dependencies, generated bundles, local Xcode cache/user state, archives/IPAs, private certificates/keys/provisioning files. `.gitignore` is platform-managed and could not be edited here; review exclusions in the connected repo before committing generated files locally. Team ID/profile name are identifiers, not private credentials.

## Not verified / not supplied here
- No Xcode/Mac toolchain, simulator, signed archive or physical-device test is available in this sandbox.
- Current source checkout has not been native-synced: iOS public/index.html, capacitor.config.json and plugin links still need generation.
- Real AdMob app/unit IDs, final UMP message and complete ad-network list. Ads remain disabled by the verification gate.
- ATT uses UMP → ATT → initialization, but lacks Yatzy/Ludo's full native active-presenter lifecycle/cache patch suite. The shared consent-reader patch is not full parity; do not activate ads before adapting and device-testing those protections against the installed plugin version.
- Validate ATT after UMP, accept/deny/revoke, background/foreground and result-exit ads for all three words. Match final privacy manifests/App Store declarations to actual SDK behavior and localize permission text.
- Own published privacy/support details, App Store screenshots/descriptions/age rating, reviewed locale word pools and the eight missing dictionaries.

## Statistics limitations
No automatic or annual reset is implemented (unlike Ludo's annual display). Restart, older snapshots, later-slot recovery and temporary native read failures are regression-tested. Absolute permanence cannot be promised: uninstall, user-cleared app data, device loss or simultaneous loss of all copies cannot be recovered without external backup. Storage failure is reported instead of silently overwriting known results; a blocked recovery must be retried after reopening. Save keys and frozen schedules are unchanged. IMPORTANT: the requested new ID is a separate native sandbox from the former `se.shiningdays.mrbord`; old native installations cannot automatically transfer local statistics to the new app ID. Updates after first release must retain the new ID.
# Mr.B. Word Puzzle — Xcode readiness

## Ready in source
- Own iOS project and unchanged bundle identity `se.shiningdays.mrbord`; retaining identity and storage keys protects app updates.
- Local offline web entry, bundled dictionaries/fonts/images, Preferences storage, App/Device/Haptics and AdMob dependencies.
- New 1024×1024 opaque app icon, two family headers at 3840×1646 and 3840×2560, branded local splash and favicon. Header exports are enlarged from generated artwork, not native 3840-detail renders.
- Word-win confetti before the result screen. Advertisement attempts remain on result exit, never while playing.
- Result ledger with native primary/backup and an older recovery generation; inconclusive native reads and unsupported payloads block overwrite.

## Required on the release Mac
1. Install dependencies with `bun install` (applies the consent-reader patch).
2. Run `bun run native:sync:ios` to generate `dist-native`, copy local web assets/config and link installed plugins into the Capacitor-managed Swift package. Do not edit generated Package.swift by hand.
3. Run `bun run native:verify:ios -- --release`; missing synced output or plugins must fail this release check.
4. Open `bun run native:open:ios`; choose the owning Apple development team and validate provisioning for this app. No signing identities have been copied from other apps.
5. Resolve Swift packages, build on a physical iPhone, then create and validate an App Store distribution archive.

## Not verified / not supplied here
- No Xcode/Mac toolchain, simulator, signed archive or physical-device test is available in this sandbox.
- Current source checkout has not been native-synced: iOS public/index.html, capacitor.config.json and plugin links still need generation.
- Real AdMob app/unit IDs, final UMP message and complete ad-network list. Ads remain disabled by the verification gate.
- ATT uses UMP → ATT → initialization, but lacks Yatzy/Ludo's full native active-presenter lifecycle/cache patch suite. The shared consent-reader patch is not full parity; do not activate ads before adapting and device-testing those protections against the installed plugin version.
- Validate ATT after UMP, accept/deny/revoke, background/foreground and result-exit ads for all three words. Match final privacy manifests/App Store declarations to actual SDK behavior and localize permission text.
- Own published privacy/support details, App Store screenshots/descriptions/age rating, reviewed locale word pools and the eight missing dictionaries.

## Statistics limitations
No automatic or annual reset is implemented (unlike Ludo's annual display). Restart, older snapshots, later-slot recovery and temporary native read failures are regression-tested. Absolute permanence cannot be promised: uninstall, user-cleared app data, device loss or simultaneous loss of all copies cannot be recovered without external backup. Storage failure is reported instead of silently overwriting known results; a blocked recovery must be retried after reopening. Saved results survive ordinary updates only when bundle identity is retained.
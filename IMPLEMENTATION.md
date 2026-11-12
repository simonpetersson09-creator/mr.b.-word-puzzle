# Mr. B Ord – implementation and verification

## Actually reused
- **Ludo:** original `mr-b-die.png` graphic; exact `installViewportSync` helper; SSR-safe storage pattern and isolated key namespace; Capacitor vibration patterns and native/web fallback adapted to Ord settings; local Capacitor packaging configuration and root-substitution pattern.
- **Sudoku:** Button source; Radix modal structure adapted to semantic styling and Swedish labels; Inter, Space Grotesk and Bodoni Moda font families; deep teal and gold visual roles adapted to oklch tokens. Its statistics page was not copied: Sudoku statistics differ from daily-word statistics.
- **Yatzy:** inspected advertising implementation against Ludo (UMP consent, privacy state, preload and App Open). No Yatzy advertisement code is installed or active. The shared Mr. B graphic and vibration lineage comes through Ludo. No Yatzy online/account code was imported.

## Newly built
Daily Swedish game, immutable dated answer schedule, duplicate-letter scoring, keyboard priority, licensed separate lists, saved daily rounds, derived idempotent statistics, rules/result/settings dialogs, Swedish translation dictionary following the existing directory convention, shareable spoiler-free result, and optional synthesized sound.

No account, service, tracking, or online dictionary is needed. The web preview is playable for verification; the native bundle packages all words, fonts and graphics for offline play. Save data is per-device local storage as requested.

## Native workflow
Uses the existing TanStack router and a separate Vite local bundle, following Ludo/Sudoku. Own iOS bundle/Android application identifier: `se.shiningdays.mrbord`. No other project was changed.

1. `bun run native:web` builds the local `dist-native` package.
2. `bunx cap add ios` / `bunx cap add android` generates Ord's own platform projects, then `bun run native:sync:ios` / `bun run native:sync:android`.
3. Open with `bun run native:open:ios` / `bun run native:open:android`; sign and install using Xcode / Android Studio.

Ord's own iOS platform project is generated, including a Preferences privacy manifest (UserDefaults CA92.1), ATT usage text and Google's test application identifier. Native sync could not complete in this sandbox because the native asset bundle is not generated; run the documented native sync command on the release Mac. Store signing, icons/splash and actual iOS binaries remain unverified. Do not use another Mr. B app's signing identity or production AdMob IDs. Run `bun run native:verify:ios` for source-package checks.

## Advertising status
Interstitial support is installed using Capacitor AdMob 8.3.0. The isolated Ord adapter follows Ludo's result-exit placement, UMP-before-ATT-before-initialization order, prepared-inventory-only presentation and 45-minute expiry. Each of the three dated round slots has its own preload and result-exit attempt, at most once per slot/runtime. Preload starts after the first valid guess and can be restored on resuming an unfinished word. Result exit awaits native saving and ready-ad dismissal before advancing to the next word. Missing, failed or expired inventory is skipped without waiting for a new ad. No App Open, rewarded ads or reference telemetry were imported. Browser ads are disabled. `VITE_ORD_ADS_VERIFIED` stays unset until device consent/presentation checks pass; release needs `VITE_ORD_IOS_INTERSTITIAL_ID` and Ord's own app ID in Info.plist. Simon will supply these later. Native patch scripts from older reference plugin versions were inspected but not blindly copied into 8.3.0; they require native regression review. Complete SKAdNetwork entries, SDK privacy disclosures and the AdMob UMP message must be verified before enabling ads.

## Verification
Automated tests cover 03.00 device-local day boundaries in winter, summer, both DST transitions and New York, frozen shuffled allocation from the new 2026-11-13 epoch, all answer words as allowed guesses, duplicate letters including KANAL/KANEL, ÅÄÖ, invalid/incomplete guesses, keyboard priority, sixth-attempt win, loss, saved progress, restart idempotence, backup recovery, historical dictionary revisions, missed days, streak breaks and interstitial policy. Previously saved answers remain authoritative. Native Preferences mirrors both snapshots with serialized writes; uninstall/data-clearing can still remove local history, and clock manipulation cannot be prevented without trusted online time.

Browser flow verifies incomplete/invalid words retaining their letters, valid first guess, reload/resume, win, saved result after reload, statistics and mobile layouts. Reference images mentioned in the brief were not uploaded; only the Markdown brief was available.

## Remaining physical-device checks
Cold offline launch and app updates, safe areas/notch/home indicator, force-close/reopen after final guess, native write durability under forced termination, storage persistence under OS eviction, background/resume across local 03.00, timezone/clock changes, sound/silent mode, haptic toggles, sharing sheet, accessibility text scaling, release packaging/signing, app icon/splash, full SDK ad consent/ATT accept/deny/revoke and interstitial presentation. Test on a small iPhone before store submission. No compiled/signed iPhone binary has been produced or verified here.
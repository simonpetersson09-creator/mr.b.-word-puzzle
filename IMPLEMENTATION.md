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

Platform projects, store signing, icons/splash generation and actual iOS/Android binaries are not yet generated or verified. Do not use another Mr. B app's signing identity or production AdMob IDs.

## Advertising status
The fresh app template has no ad support. Ads remain disabled rather than importing Ludo's large online-dependent telemetry and patched native SDK as an unverified integration. Gameplay is fully functional without an ad connection. Before enabling ads, port Ludo's App Open and after-result placement together with Yatzy's validated UMP/ATT consent, privacy choices, preload/expiry and native patch scripts. Use Google's test IDs in development and **new Ord production IDs** supplied by the owner. Result reading/dismissal must precede an interstitial. Never show an ad while a guess is in progress. Native SDK consent and presentation cannot be confirmed in the browser.

## Verification
Automated tests cover Stockholm winter/summer midnight, daily allocation, all answer words as allowed guesses, duplicate letters including KANAL/KANEL, ÅÄÖ, invalid/incomplete guesses, keyboard color priority, sixth-attempt win, loss, saved progress, restart idempotence, missed days and streak breaks.

Browser flow verifies incomplete/invalid words retaining their letters, valid first guess, reload/resume, win, saved result after reload, statistics and mobile layouts. Reference images mentioned in the brief were not uploaded; only the Markdown brief was available.

## Remaining physical-device checks
Cold offline launch and app updates, safe areas/notch/home indicator, OS keyboard and physical keyboard, force-close/reopen after final guess, storage persistence under OS eviction, background/resume across Stockholm midnight, sound/silent mode, haptic toggles, Android back behavior, sharing sheet, accessibility text scaling, release packaging/signing, app icon/splash, and any future advertisements/consent. Test on a small iPhone and Android handset before store submission.
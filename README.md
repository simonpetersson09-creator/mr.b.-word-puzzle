# Mr.B. Word Puzzle

Dagligt ordspel med tre ord, lokal statistik och offlinepaket för iOS. Design, spellogik och sparnycklar är oförändrade.

## GitHub och installation
Anslut projektet via Lovables GitHub-inställningar och klona det anslutna arkivet på din Mac. GitHub-anslutning, push och Apple-inställningar har inte utförts här.

Kräver Bun, Node.js 22+ och aktuell Xcode med ett iOS SDK som App Store Connect accepterar.

```sh
bun install --frozen-lockfile
bun run test
bun run native:verify:ios
bun run native:sync:ios
bun run native:verify:ios -- --release
bun run native:open:ios
```

Öppnar `ios/App/App.xcodeproj`. Välj **App → Any iOS Device (arm64) → Product → Archive**. Debug använder automatisk utvecklarsignering; Release använder **Apple Distribution** och **Mr B Word Puzzle App Store**, team **F43HQMHCAT**, Bundle ID **se.shiningdays.mrbwordpuzzle**.

Alternativt:

```sh
bun run native:archive:ios
bun run native:export:ios
```

Arkiv/IPA placeras utanför projektet i Macens temporära mapp; sätt `IOS_OUTPUT_DIR` för egen plats. Validera/ladda upp via Xcode Organizer eller IPA via Transporter. Höj build-numret före nästa uppladdning.

Behåll källkod, `bun.lock`, iOS-projekt, delat schema och `ExportOptions.plist`. Versionshantera inte dependencies, `dist-native`, genererade iOS-webbfiler, Xcode-cache/användarinställningar, arkiv/IPA eller privata `.env`, `.p12`, `.p8` och provisioning-filer. Plattformen hanterar `.gitignore`; kontrollera undantagen i det anslutna GitHub-arkivet innan lokalt genererade filer läggs till.

Se [XCODE_READINESS.md](XCODE_READINESS.md) för signering, App Store Connect och kvarstående releasekrav. Ingen signerad Xcode-build eller publicering har verifierats här.

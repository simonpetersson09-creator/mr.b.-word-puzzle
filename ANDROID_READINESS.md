# Mr.B. Word Puzzle – Android och Google Play

## Förberett
- Eget Capacitor 8 Android-projekt: `com.mrb.wordpuzzle`. iOS behåller `se.shiningdays.mrbwordpuzzle` och sina befintliga inställningar.
- Java 21, compile/target SDK 36 och min SDK 26 (Android 8.0).
- Gradle-wrapper, sju plugins, lokal spelpaketering, 40 språkuppgifter, befintlig godkänd ikon och befintlig startbild.
- Android UMP-samtycke och verkliga lagrade ändamålsval. Okänd/misslyckad uppdatering får aldrig tolkas som samtycke. Ingen ATT-begäran på Android.
- Samma annonsregel som iOS: förladdning efter första giltiga gissningen, annonsförsök vid resultatutgång, högst en per ord. Native generationsskydd och deadline hindrar sena/felrundade annonser; synlig annons måste stängas innan nästa ord.
- Androids tillbaka-knapp stänger översta dialog/lista först, går från världstoppen tillbaka till statistiken och får inte gå förbi pågående annons/ordvändning. På spelplanen sparas väntande skrivningar före minimering.
- `adjustResize`, Capacitors SystemBars med native-marginaler för systemfält och befintlig visualViewport-anpassning används för tangentbord och skärmyta, utan att ändra iOS-layouten.

## På din dator
Installera Node 22+, Bun, Java/JDK 21 och Android Studio med SDK Platform 36 och Build Tools. Välj Java 21 för Gradle och ange SDK-platsen i Android Studio eller `ANDROID_HOME`.

```sh
bun install --frozen-lockfile
bun run test
bun run native:sync:android
bun run native:verify:android -- --synced
bun run native:open:android
```

`native:sync:android` bygger den senaste lokala webbdelen, patchar Android-pluginen, synkar sju plugins och återställer Word Puzzle-bilder. Använd detta kommando, inte ett fristående `cap sync android`: kommandot väljer Androids separata paketnamn. iOS-kommandona är kvar.

För en test-APK:
```sh
bun run native:build:android
```
Utdata: `android/app/build/outputs/apk/debug/app-debug.apk`. Detta är inte en Google Play-release.

## Android-annonsvärden
Ägarens angivna Android-ID:n finns i `src/lib/native/android-admob.json`, gemensamt för klient och Gradle:
- App ID: `ca-app-pub-7448540924654868~4150161165`
- Interstitial ID: `ca-app-pub-7448540924654868/3980826116`

Följande publika miljövärden kan fortfarande användas för en uttrycklig konfigurationsändring:
- `VITE_MRB_ANDROID_ADMOB_APP_ID`: Word Puzzles egen Android-app i AdMob.
- `VITE_MRB_ANDROID_ADMOB_INTERSTITIAL_ID`: Word Puzzles egen Android-mellanannonsenhet.

Vanlig synk, öppning och debug-APK använder Googles officiella Android-test-App-ID och testenhet, även när produktions-ID:n finns. Bara `--release` aktiverar produktions-ID:n för Android; Vite-utvecklingsläge använder alltid testannonser. iOS-ID:n och iOS-testbeteendet är oförändrade. Direkt Gradle/Android Studio Release blockeras om ett verifierat aktuellt releasepaket saknas.

Förbered ett releasepaket på datorn:
```sh
bun run native:sync:android -- --release
bun run native:verify:android -- --synced --release
bun run native:bundle:android
```
Sista kommandot försöker skapa en **osignerad** AAB i `android/app/build/outputs/bundle/release/`. Det vägrar utan egna annonsvärden eller om källor/synkpaket har ändrats sedan synken. Ingen signeringsnyckel eller signeringskonfiguration har skapats.

## Återstår inför signerad AAB
1. Konfigurera och kontrollera Googles UMP-meddelande för Word Puzzles Android-app i AdMob. Egna ID:n är nu inlagda; AdMob-kontots meddelandestatus har inte verifierats här.
2. Kompilera på dator med Android SDK och Java 21; det finns inga sådana verktyg i denna granskningsmiljö.
3. Prova på fysisk Android: tillbaka/gestnavigering, skärmutskärningar, tangentbord inklusive vietnamesiska, språkbyte, små skärmar/tablet/rotation, haptik, delning, vänner/topplista, offline och tvångsavslut/uppdatering.
4. Kontrollera UMP och riktiga annonser efter var och en av dagens tre rundor, utebliven annons och återgång från bakgrunden. Testad policy är inte bevis för faktisk AdMob-leverans.
5. Kontrollera färdig AAB med Google Plays förhandsrapport, inklusive SDK-policyer och eventuell 16 KB-kompatibilitet i beroenden.
6. Använd ägarens senare godkända uppladdningsnyckel, välj Play App Signing och bygg signerad Release i Android Studio. Nyckelfil/lösenord ska hållas utanför projekt/GitHub. Signera aldrig med en annan Mr. B-apps identitet av misstag.
7. Google Play: butiksmaterial, integritetspolicy, datasäkerhet inklusive AdMob och delade vän-/rankningsdata, annonser, målgrupp/åldersklassning och erforderlig testperiod.

Ingen app har publicerats. Ingen APK/AAB-kompilering eller fysisk Android-verifiering är genomförd här. Befintliga lokala sparnycklar är oförändrade; Android har separat lagring och importerar inte iPhone-historik. Avinstallation/datarensning kan radera lokala resultat.

## Verifierat 2026-11-16
- 156 automatiska tester godkända, inklusive exakta Android-release-ID:n, test/release-separering, UMP före annonsbegäran, nekad behörighet, verkliga ändamålsval, ändrade annonsval, ingen ATT på Android, tre separata resultatutgångar, dubbeltryck och utebliven/misslyckad annons. Android-bryggan simulerades; faktisk SDK-körning på telefon är inte verifierad.
- Android-källkontroll godkänd: wrapper, egna bilder, samtyckesläsare, presentationsdeadline och inventarieskydd. Release kräver korrekta ID:n och aktuellt release-synkpaket.
- Förhandsvisningen kontrollerad på 320×568, 360×640, 412×915, 915×412 och 800×1280. Ingen horisontell överlapp; spelplan och tangentbord ryms. Gissningen KANEL återlästes efter omstart; tangenttryck fungerade efter att nätet kopplats bort. Inga sidfel observerades.
- Topplista → statistik → spelplan kontrollerat med samma Escape-hantering som Android Back använder; faktisk OS-gest och minimering kräver Android.
- iOS-källkontroller och befintliga iOS-annons-ID-tester passerar. Senaste native-webbpaket behöver fortfarande byggas/synkas på datorn; de kopierade webbfilernas initiala mallpaket är inte en release av senaste ändringarna.
- Kallstart utan nät har inte verifierats i Android. Webbförhandsvisningen kan inte laddas om utan nät; Android ska använda lokalt paketerade filer efter den dokumenterade synken.
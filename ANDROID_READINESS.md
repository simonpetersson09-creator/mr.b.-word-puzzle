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
Installera Node **22.12+**, Java/JDK **21** och Android Studio med SDK Platform **36**, Build Tools **36.0.0** och Platform Tools. Välj Java 21 även som Gradle JDK i Android Studio. Bun behövs inte för Android-kommandona. SDK-platsen läses från `android/local.properties`, `ANDROID_HOME`/`ANDROID_SDK_ROOT` eller operativsystemets standardmapp; motstridiga platser avvisas. Ingen datorberoende SDK-/Java-sökväg sparas i projektet. På Mac väljer skriptet installerad JDK 21 via `java_home` om `JAVA_HOME` inte redan är satt.

```sh
npm ci
npm test -- --maxWorkers=2
npm run native:doctor:android
npm run native:sync:android
npm run native:verify:android -- --synced
npm run native:open:android
```

`native:sync:android` fungerar även utan ett tidigare `dist-native`: det bygger den senaste lokala webbdelen före Capacitors inledande paketkontroll. Plattformsspecifika synk-hooks patchar Android-pluginen, bygger offlinepaketet, synkar plugins, återställer bilder och skapar/verifierar filkvitto. Även direkt `npx cap sync android` uppdaterar nu paket och kvitto när webDir redan finns; använd projektkommandot vid en ren utcheckning. Hooks gör ingenting för iOS. `cap sync ios` väljer alltid iOS även om Android-miljövariabeln är kvar. Plattformslösa synkkommandon avvisas. Befintliga iOS-kommandon är oförändrade.

Använd det incheckade `package-lock.json` och `npm ci`, utan `--force` eller `--legacy-peer-deps`. Låset behåller de tidigare installerade Capacitor-/iOS-/React-versionerna. Den exakt patchade AdMob-versionen är låst till 8.3.0. npm 10.9.9 är verifierat med låset; vid avsiktlig omgenerering från tomt lås används npm 11, eftersom npm 10:s peer-resolver kraschade med `edgesOut` i denna beroendegraf. Bun-låset finns kvar för befintliga arbetsflöden.

För en test-APK:
```sh
npm run native:build:android
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
npm run native:bundle:android
```
Kommandot kontrollerar SDK/JDK, bygger och synkar ett nytt releasepaket och försöker därefter skapa en **osignerad** AAB i `android/app/build/outputs/bundle/release/`. Ingen separat föregående release-synk eller kodändring behövs. Gradles egen releasekontroll är kvar och blockerar ändringar efter synk. Kontrollversion 2 verifierar paketidentitet, samtliga källfiler, npm-/Bun-lås, installerade Android-pluginfiler, Gradle-wrapper, plugin-konfiguration och offlinepaketet. Ingen signering har ändrats.

För att enbart förbereda release inför Android Studio:
```sh
npm run native:open:android -- --release
```
Vanlig öppning/debug-synk använder fortfarande testannonser. Direkt Gradle Release kräver ett aktuellt releasekvitto. Node måste finnas i Android Studios processmiljö för denna kontroll; starta Studio via projektets öppningskommando vid behov.

## Återstår inför signerad AAB
1. Konfigurera och kontrollera Googles UMP-meddelande för Word Puzzles Android-app i AdMob. Egna ID:n är nu inlagda; AdMob-kontots meddelandestatus har inte verifierats här.
2. Kompilera på dator med Android SDK och Java 21; det finns inga sådana verktyg i denna granskningsmiljö.
3. Prova på fysisk Android: tillbaka/gestnavigering, skärmutskärningar, tangentbord inklusive vietnamesiska, språkbyte, små skärmar/tablet/rotation, haptik, delning, vänner/topplista, offline och tvångsavslut/uppdatering.
4. Kontrollera UMP och riktiga annonser efter var och en av dagens tre rundor, utebliven annons och återgång från bakgrunden. Testad policy är inte bevis för faktisk AdMob-leverans.
5. Kontrollera färdig AAB med Google Plays förhandsrapport, inklusive SDK-policyer och eventuell 16 KB-kompatibilitet i beroenden.
6. Använd ägarens senare godkända uppladdningsnyckel, välj Play App Signing och bygg signerad Release i Android Studio. Nyckelfil/lösenord ska hållas utanför projekt/GitHub. Signera aldrig med en annan Mr. B-apps identitet av misstag.
7. Google Play: butiksmaterial, integritetspolicy, datasäkerhet inklusive AdMob och delade vän-/rankningsdata, annonser, målgrupp/åldersklassning och erforderlig testperiod.

Ingen app har publicerats. Ingen APK/AAB-kompilering eller fysisk Android-verifiering är genomförd här. Befintliga lokala sparnycklar är oförändrade; Android har separat lagring och importerar inte iPhone-historik. Avinstallation/datarensning kan radera lokala resultat.

## Konfigurationskontroll 2026-11-23
- Grundorsaker rättade: npm-konflikt mellan direkt Zod-deklaration och override, inkompatibel esbuild-override, hårdkodat Bun-beroende, utebliven paketering vid direkt synk, releasekommando som krävde separat tidigare synk och avsaknad av tidig SDK/JDK-kontroll. Fasta paketlås och exakt patchad pluginversion skyddar rena installationer.
- Ren `npm ci` inklusive båda befintliga pluginpatcharna passerar i en separat installation. Android-synk utan tidigare offlinepaket, test-/release-synk och direkt Capacitor release-synk passerar; Bun/Bunx ersattes med felande testprogram för att bekräfta att de inte används. **215 tester passerar**. Käll-/offlinekontroller inkluderar beroendefiler och Gradle-wrapper.
- Faktiska kopierade Android-webbfiler öppnades med alla externa nätanrop blockerade: KANEL godkändes, gissningen behölls efter omladdning och inga sidfel uppstod. Detta ersätter inte Android WebView-/telefontest.
- Android `applicationId`/namespace, versionCode **1**, versionName **1.0**, iOS-identitet, native-versioner, annonser, spelfunktioner och signering är oförändrade. iOS-källkontroller passerar; dess tidigare behov av lokal synk/arkivering kvarstår. SDK/JDK saknas i granskningsmiljön: **Gradle-kompilering, osignerad/signerad AAB och fysisk telefon är inte verifierade**. Paketstorleksvarningen för den bundlade offlineordlistan kvarstår och är inte ett byggfel.
- Rättat identiteten även för direkta Capacitor Android-kommandon; uttrycklig iOS-plattform går före ärvda miljövärden. Gradles befintliga `applicationId` och `namespace` är redan `com.mrb.wordpuzzle` och har inte ändrats.
- Offlinepaketeringen tog tidigare oavsiktligt med webbadministration och dess serverkod, vilket stoppade Android-synken. Native-paketeringen använder nu samma oförändrade spelsida via ett separat spelträd, utan adminsidan. Webbadmin och iOS-projektet ändras inte.
- Synkpaketets kvitto är lokalt genererat; det måste förnyas efter ändringar. Releasekontrollen verifierar fullständiga filuppsättningar och motsvarande kopierade resurser.
- Test- och release-synk godkända; direkt `cap sync android` utan plattformsmiljövariabel behåller korrekt identitet och klarar efterföljande releasekontroll. 206 tester passerar. Faktiska kopierade Android-webbfiler öppnades utan nätåtkomst; gissningen KANEL godkändes och fanns kvar efter omladdning utan sidfel. Detta är inte en körning i Androids WebView eller en APK/AAB-kompilering; Java 21/SDK 36 och fysisk telefon saknas här. iOS-källkontroller passerar och iOS-projektfilerna är orörda.

## Verifierat 2026-11-16
- 156 automatiska tester godkända, inklusive exakta Android-release-ID:n, test/release-separering, UMP före annonsbegäran, nekad behörighet, verkliga ändamålsval, ändrade annonsval, ingen ATT på Android, tre separata resultatutgångar, dubbeltryck och utebliven/misslyckad annons. Android-bryggan simulerades; faktisk SDK-körning på telefon är inte verifierad.
- Android-källkontroll godkänd: wrapper, egna bilder, samtyckesläsare, presentationsdeadline och inventarieskydd. Release kräver korrekta ID:n och aktuellt release-synkpaket.
- Förhandsvisningen kontrollerad på 320×568, 360×640, 412×915, 915×412 och 800×1280. Ingen horisontell överlapp; spelplan och tangentbord ryms. Gissningen KANEL återlästes efter omstart; tangenttryck fungerade efter att nätet kopplats bort. Inga sidfel observerades.
- Topplista → statistik → spelplan kontrollerat med samma Escape-hantering som Android Back använder; faktisk OS-gest och minimering kräver Android.
- iOS-källkontroller och befintliga iOS-annons-ID-tester passerar. Senaste native-webbpaket behöver fortfarande byggas/synkas på datorn; de kopierade webbfilernas initiala mallpaket är inte en release av senaste ändringarna.
- Kallstart utan nät har inte verifierats i Android. Webbförhandsvisningen kan inte laddas om utan nät; Android ska använda lokalt paketerade filer efter den dokumenterade synken.
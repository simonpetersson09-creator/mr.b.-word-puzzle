# Mr. B Ord – releasegranskning 2026-11-12

## Genomfört och verifierat
- Annonsförsök efter vart och ett av dagens tre ord med separata nycklar; nästa ord väntar på annonsens stängning. Återupptagna ofärdiga ord kan förladdas igen. Verifierat med testadapter, inte riktiga annonser.
- Tydlig gul tangentmarkering vid beröring och kort efter tryck, inklusive fysisk tangentbordsinmatning och Radera. Placering oförändrad.
- 40 automatiska tester godkända. iOS-källunderlagskontrollen godkänd med uttryckliga begränsningar.
- Telefonflöde: tre olika svenska ord lösta, omstart låser dagen, statistik 3 spelade/100 % vinster/1 dag i svit. Tom gissning förbrukar inget försök. Inga pageerrors vid kontrollen.
- Kvadratiska rutor och tangentbord inom skärmkanterna på 320×568, 393×706, 393×852 och 1280×1800.
- Alla 32 ordpaket: fem grafem och alla svar finns bland godkända gissningar. Detta intygar inte språklig korrekthet.

## Faktiska kvarvarande brister
1. **Grekiska ord kan inte alltid vinnas:** 228/240 svar misslyckar med svaret som inmatning. Grekisk versalkonvertering tar bort accenter men svaren behåller dem (`localized.ts`, `submitGuess`, `hasWon`).
2. **Native sparningsfel kan vara tysta:** returvärdet från `persistSave` gäller lokal webblagring, inte den asynkrona Preferences-spegeln. Pågående rundor får inte omedelbar varning vid native-skrivfel.
3. **Backup missas vid kastat native-läsfel:** `initializeSave` läser primär före backup i samma try-block. Misslyckad primärläsning kan hindra återställning av en intakt backup.
4. **Fel välkomsttext i ett delklart läge:** välkomsttext väljs utifrån aktuellt ords `done`, inte `dailyDone`. Då kan texten säga att alla tre är klara.
5. **Oskickade bokstäver kan följa med över 03.00:** foreground-hanteraren uppdaterar datum utan att tömma input, och timerkontrollen kan då missa återställningen.
6. **Licenser saknar synlig leveransväg:** attribution och licenser finns i källunderlaget men inte tillgängliga i appen eller uttryckligen kopierade till native-paketet. Distributionskraven behöver granskas.

## Saknas eller är ännu overifierat
- Egna AdMob app-/mellanannons-ID:n, slutligt UMP-meddelande, nätverkslista och verklig samtyckes-/annonsvisning efter alla tre ord. Annonser är fortfarande avstängda. Annonsnätverket kan neka leverans; tre faktiskt visade annonser går inte att garantera utan att blockera spel.
- Full native sync/pluginintegration, signerat Xcode-arkiv, slutlig ikon/startbild och fysisk iPhone-testning av offline, uppdatering, OS-avslut, sparning, skyddszoner, ljud/haptik, delning och tillgänglighet.
- Åtta ordlistor: thailändska, gujarati, kannada, malayalam, marathi, odia, punjabi, telugu.
- Fullständig språkgranskning av apptexter/ord. Engelska reservtexter förekommer; vissa svar är egennamn eller svordomar. Kandidatdata är inte en språkgranskad ordbok.
- Lokaliserade iOS-tillståndstexter.
- Egna publicerade support-/integritetssidor, kontaktuppgifter, App Store-skärmbilder, beskrivningar, åldersklassning och slutliga integritetsdeklarationer.

## Rekommenderad ordning
1. Rätta grekisk normalisering, native fel-/backupvägar och återöppningsfallen med konkreta regressionstester.
2. Redigera svarspoolerna språkligt, välj ett granskat releasespråkurval och leverera licensunderlaget i appen.
3. Slutför iPhone-paket och butiksmaterial; prova hela flödet på fysisk iPhone.
4. Aktivera annonser först efter egna ID:n och godkända samtyckes-/visningstester.

## Viktiga begränsningar
Historik lagras på enheten, inte i ett konto; avinstallation/datarensning kan ta bort den. Manipulerad klocka kan inte säkert hindras utan betrodd extern tid. Sparade svar skyddas mot ändringar, men framtida schemas oföränderlighet över faktiska släppta appversioner har inte verifierats mot tidigare releasepaket.

Granskningen täcker källkod, tester och webbläsarflöde. Den är inte ett godkännande av ett signerat iPhone-paket eller en juridisk licensbedömning.
# Mr.B. Word Puzzle – releasegranskning 2026-11-12

## Genomfört och verifierat
- Annonsförsök efter vart och ett av dagens tre ord med separata nycklar; nästa ord väntar på annonsens stängning. Återupptagna ofärdiga ord kan förladdas igen. Verifierat med testadapter, inte riktiga annonser.
- Tydlig gul tangentmarkering vid beröring och kort efter tryck, inklusive fysisk tangentbordsinmatning och Radera. Placering oförändrad.
- 40 automatiska tester godkända. iOS-källunderlagskontrollen godkänd med uttryckliga begränsningar.
- Telefonflöde: tre olika svenska ord lösta, omstart låser dagen, statistik 3 spelade/100 % vinster/1 dag i svit. Tom gissning förbrukar inget försök. Inga pageerrors vid kontrollen.
- Kvadratiska rutor och tangentbord inom skärmkanterna på 320×568, 393×706, 393×852 och 1280×1800.
- Alla 32 ordpaket: fem grafem och alla svar finns bland godkända gissningar. Detta intygar inte språklig korrekthet.

## Rättat efter granskningen
1. **Grekiska svar:** versalkonverteringen behåller accenter och inmatning bevarar exakt sparad stavning för Unicode-ekvivalenta svar. Alla 240 svar kan vinnas i regressionstest, och alla deras grafem finns på tangentbordet. Ett accentuerat svar löst via telefonens skärmtangenter och resultat/statistik återlästa efter omstart. Ordens språkliga kvalitet återstår att granska.
2. **Sparningsfel:** aktiva spelvyn prenumererar på fel från asynkrona native-skrivningar. Båda kopiorna försöks oberoende, och fel förblir observerbara vid flush. Återhämtade resultat behålls i minnet även när omsparning misslyckas.
3. **Backup:** native och lokal primär-/backup läses oberoende. Regressioner verifierar återhämtning av vinst och inställningar när primärläsning kastar.
4. **Välkomst:** tre avslutade ord krävs för klartexten; ett avslutat ord och en ofärdig dag ger inte längre fel besked. Ren tillståndsfunktion testad och telefonens återöppning kontrollerad.
5. **Återöppning över 03.00:** datumreferens jämförs innan välkomsten öppnas och oskickade bokstäver töms vid dagsbyte. Telefonflödet verifierat över 03.00 lokal tid.
6. **Licensleverans:** inställningarna öppnar en offline-läsbar licensdialog med attribution och fullständiga licenser. Samma klientkod används av native-skalet; orddata och licenser kan hämtas som JSON i webbläsaren. Nedladdning via iOS WebView och juridiska distributionskrav är fortfarande overifierade.

## Saknas eller är ännu overifierat
- Egna AdMob app-/mellanannons-ID:n, slutligt UMP-meddelande, nätverkslista och verklig samtyckes-/annonsvisning efter alla tre ord. Annonser är fortfarande avstängda. Annonsnätverket kan neka leverans; tre faktiskt visade annonser går inte att garantera utan att blockera spel.
- Full native sync/pluginintegration, signerat Xcode-arkiv, slutlig ikon/startbild och fysisk iPhone-testning av offline, uppdatering, OS-avslut, sparning, skyddszoner, ljud/haptik, delning och tillgänglighet.
- Åtta ordlistor: thailändska, gujarati, kannada, malayalam, marathi, odia, punjabi, telugu.
- Fullständig språkgranskning av apptexter/ord. Engelska reservtexter förekommer; vissa svar är egennamn eller svordomar. Kandidatdata är inte en språkgranskad ordbok.
- Lokaliserade iOS-tillståndstexter.
- Egna publicerade support-/integritetssidor, kontaktuppgifter, App Store-skärmbilder, beskrivningar, åldersklassning och slutliga integritetsdeklarationer.

## Rekommenderad ordning
1. De tekniska rättningarna ovan är genomförda; verifiera native felvarningar och återöppning på fysisk iPhone.
2. Redigera svarspoolerna språkligt, välj ett granskat releasespråkurval och leverera licensunderlaget i appen.
3. Slutför iPhone-paket och butiksmaterial; prova hela flödet på fysisk iPhone.
4. Aktivera annonser först efter egna ID:n och godkända samtyckes-/visningstester.

## Viktiga begränsningar
Historik lagras på enheten, inte i ett konto; avinstallation/datarensning kan ta bort den. Manipulerad klocka kan inte säkert hindras utan betrodd extern tid. Sparade svar skyddas mot ändringar, men framtida schemas oföränderlighet över faktiska släppta appversioner har inte verifierats mot tidigare releasepaket.

Granskningen täcker källkod, tester och webbläsarflöde. Den är inte ett godkännande av ett signerat iPhone-paket eller en juridisk licensbedömning.
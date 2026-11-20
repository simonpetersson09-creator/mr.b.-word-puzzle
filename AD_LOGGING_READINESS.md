# Annonsloggning och jämförelse med Yatzy

## Vad som registreras
- Endast native-bryggans bekräftade `Showed`-händelse för mellanannonser, inte förladdning, försök, utebliven annons eller intäkt.
- iPhone/Android, test/produktion, daterad ordslot och visningstid. Inga ord, gissningar eller spelarnamn.
- Admin visar antal, plattformsuppdelning och testannonser separat; visningsdagen följer svensk tid. Äldre appversioner skickar inte denna loggning.
- Lokal/native kö återförsöker vid start, online och synlig app. Upp till 90 händelser bevaras högst 30 dagar. Misslyckad native-läsning får inte ersätta kön.
- Enhetsbehörighet skyddar inskickning och samma ordslot kan inte registreras två gånger. Det är appdiagnostik, inte verifierad AdMob-fakturering eller en fullständig anti-fusk-lösning.

## Jämförelse med Yatzy
Referens: skrivskyddad Mr.B. Yatzy, version `856d49d7`. Ingen referensapp har ändrats.

| Inställning | Word Puzzle och Yatzy |
| --- | --- |
| Samtycke före annonsbegäran | Google UMP, native `canRequestAds` avgör tillåtlighet |
| Misslyckad samtyckeshämtning | Native UMP-reserv, aldrig antagande om godkännande |
| ATT | Endast iOS; fråga endast vid `notDetermined` |
| Sparade annonsval | Native UMP-purpose-bitar, okända värden visas inte som godkända |
| Ändrade annonsval | Googles integritetsruta, förberedda annonser ogiltigförklaras |
| Utveckling | Testannonser; Android produktion endast uttryckligt releasebygge |
| Produktions-ID:n | Varje app behåller sina egna, inga ID:n kopieras från Yatzy |
| Annonsfel | Får inte blockera sparat spel eller fortsättning |

Skillnader som behålls avsiktligt: Word Puzzle har bara mellanannonser vid resultatutgång, efter första giltiga gissningens förladdning. Yatzys banners, belöningsannonser och appöppningsannonser ska inte kopieras. Word Puzzle använder AdMob-plugin ^8.3.0; referensen ^8.2.1. Det är inte en identisk kopia av Yatzys större annonsmotor eller all diagnostik.

## Verifierat
- 191 tester godkända; samtycke, Android test/release-ID:n, alla tre ordslotars annonsflöde, dublettskydd, failed/no-fill utan loggning och offlineåterhämtning.
- Bekräftad testhändelse genom presentationsbryggan till verklig RPC och inloggad admin. Fel enhetsbehörighet och webbplattform avvisades. Testuppgifter borttagna efter kontrollen.
- Admininloggning, kolumner, datum, avläsning och utloggning fungerar utan observerade körfel. Senaste automatiska byggkontroll: OK.

## Återstår
- Publicera webben för adminändringen; bygg/synka och släpp nya iOS-/Android-versioner för loggningen. Inget publicerades i denna ändring.
- Fysisk telefonkontroll av verklig annonsvisning och samtyckesrutor.
- AdMob-kontots publicerade samtyckesmeddelanden, geografiska inställningar och leveransstatus kan inte verifieras från appkoden.
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n/languages';
import { golfName, handicap, wordScore } from '@/lib/ord/handicap';
import type { Round } from '@/lib/ord/engine';

const labels: Record<Language, readonly [string, string]> = {
  sv:['Ordpoäng','Senaste orden'], en:['Word score','Latest words'], no:['Ordpoeng','Siste ord'], da:['Ordpoint','Seneste ord'], fi:['Sanan pisteet','Viimeisimmät sanat'],
  es:['Puntuación','Últimas palabras'], fr:['Score du mot','Derniers mots'], it:['Punteggio','Ultime parole'], de:['Wortwertung','Letzte Wörter'], nl:['Woordscore','Laatste woorden'],
  ca:['Puntuació','Últimes paraules'], ro:['Scorul cuvântului','Ultimele cuvinte'], tr:['Kelime puanı','Son kelimeler'], pl:['Wynik słowa','Ostatnie słowa'], cs:['Skóre slova','Poslední slova'],
  sk:['Skóre slova','Posledné slová'], sl:['Točke besede','Zadnje besede'], hr:['Bodovi riječi','Posljednje riječi'], hu:['Szópontszám','Legutóbbi szavak'], pt:['Pontuação','Últimas palavras'], 'pt-BR':['Pontuação','Últimas palavras'],
  id:['Skor kata','Kata terbaru'], ms:['Skor perkataan','Perkataan terkini'], vi:['Điểm từ','Các từ gần nhất'], el:['Βαθμολογία λέξης','Τελευταίες λέξεις'], ru:['Счёт за слово','Последние слова'], uk:['Бали за слово','Останні слова'],
  ja:['単語のスコア','直近の単語'], ko:['단어 점수','최근 단어'], th:['คะแนนคำ','คำล่าสุด'], hi:['शब्द का स्कोर','हाल के शब्द'], bn:['শব্দের স্কোর','সাম্প্রতিক শব্দ'], gu:['શબ્દનો સ્કોર','તાજેતરના શબ્દો'],
  kn:['ಪದದ ಅಂಕ','ಇತ್ತೀಚಿನ ಪದಗಳು'], ml:['വാക്കിന്റെ സ്കോർ','സമീപകാല വാക്കുകൾ'], mr:['शब्दाचा स्कोअर','अलीकडील शब्द'], or:['ଶବ୍ଦର ସ୍କୋର','ସାମ୍ପ୍ରତିକ ଶବ୍ଦ'], pa:['ਸ਼ਬਦ ਦਾ ਸਕੋਰ','ਹਾਲ ਦੇ ਸ਼ਬਦ'], ta:['சொல்லின் மதிப்பெண்','சமீபத்திய சொற்கள்'], te:['పదం స్కోరు','ఇటీవలి పదాలు'],
};

export function HandicapResult({round, rounds}: {round: Round; rounds: Record<string, Round>}) {
  const {language} = useTranslation();
  const score = wordScore(round);
  const hcp = handicap(rounds, round.date);
  const format = (value: number, decimals = 0) => new Intl.NumberFormat(language === 'no' ? 'nb' : language, {minimumFractionDigits: decimals, maximumFractionDigits: decimals, signDisplay: 'exceptZero'}).format(value);
  return <div className="hcp-result" aria-live="polite">
    {score !== null && <div className="hcp-word"><span>{labels[language][0]}</span><strong>{format(score)} <small>{golfName(score)}</small></strong></div>}
    <div className="hcp-current"><span>HCP</span><strong>{hcp.value === null ? '—' : format(hcp.value, 1)}</strong><small>{labels[language][1]} · {hcp.count}/30</small></div>
  </div>;
}
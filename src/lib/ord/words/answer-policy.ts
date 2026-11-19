import type {Language} from '@/lib/i18n/languages';
import {approvedAnswers, APPROVED_ANSWERS_EPOCH} from './approved-answers';
import schedule from './schedule-v1.json';
import scheduleV2 from './schedule-v2.json';
import koreanV3 from './schedule-korean-v3.json';
// v2 appends reviewed answers from its own epoch; earlier dates keep v1 untouched.
export const SCHEDULE_V2_EPOCH = scheduleV2.epoch;
export const KOREAN_V3_EPOCH = koreanV3.epoch;

// Immutable schedule data is independent of dictionaries and future editorial additions.
export function scheduledPool(date: string, language: Language): readonly string[] {
 if (language === 'ko' && date >= KOREAN_V3_EPOCH) return koreanV3.approved;
 if (date >= SCHEDULE_V2_EPOCH) return (scheduleV2.approved as Partial<Record<Language, readonly string[]>>)[language] ?? [];
 const pools: Partial<Record<Language, readonly string[]>> = date < ANSWER_POLICY_EPOCH ? schedule.legacy : schedule.approved;
 return pools[language] ?? [];
}
// Only unsaved legacy rounds are screened. The immutable schedules and persisted
// answers remain intact; use the frozen approved pool, not a mutable dictionary.
export function unsavedAnswerPool(date: string, language: Language): readonly string[] {
 const frozen = scheduledPool(date, language);
 if (date >= ANSWER_POLICY_EPOCH) {
   const hit=safePoolCache.get(frozen);
   if(hit?.language===language && hit.length===frozen.length)return hit.pool;
   const pool=frozen.filter(word=>!isUnsafeAnswer(word,language));
   safePoolCache.set(frozen,{language,length:frozen.length,pool});
   return pool;
 }
 const allowed = new Set<string>((schedule.approved as Partial<Record<Language, string[]>>)[language] ?? []);
 const blocked = new Set(excludedAnswers[language] ?? []);
 const safe = frozen.filter(word => allowed.has(word) && !blocked.has(word) && !isUnsafeAnswer(word, language));
 return safe.length >= 3 ? safe : ((schedule.approved as Partial<Record<Language, string[]>>)[language] ?? []).filter(word => !blocked.has(word) && !isUnsafeAnswer(word, language));
}

// Exact language-specific matches avoid censoring innocent substrings (CONNU,
// HUREN). Defence in depth only: these lists do not certify editorial review.
export const unsafeAnswerWords: Partial<Record<Language, readonly string[]>> = {
 sv:['KUKEN','KUKAR','FITTA','FITTOR','HOROR','KNULA','KNULL','KNULLA','RUNKA','NEGER','PORNO','JÄVLA','JÄVEL','SKITA','SKITS','SEXIG','SPERM'],
 en:['FUCKS','SHITS','SHITE','BITCH','CUNTS','WHORE','SLUTS','FAGOT','NIGGER','NIGGA','PENIS','VAGINA','PORNO','NUDES','NAKED','SEMEN','SPERM','HORNY','RAPED','RAPES','RAPIST'],
 no:['FAEN','JÆVLA','JÆVEL','DRITT','FITTE','PIKK','HORER','PORNO'],
 da:['FISSE','PIKKE','LUDER','KNEPP','SKIDE','PORNO'],
 fi:['VITTU','VITUN','PASKA','PERSE','KYRPÄ','HUORA','PORNO'],
 es:['PUTAS','PUTOS','COÑO','MIERDA','FOLLAR','POLLA','VERGA','PORNO'],
 fr:['MERDE','PUTES','SALOPE','CONNE','PÉNIS','PENIS','SPERME','PORNO'],
 it:['CAZZO','MERDA','TROIA','PUTTANA','SESSO','PORNO'],
 de:['ARSCH','FOTZE','FICKT','FICKEN','HUREN','PENIS','PORNO'],
 nl:['KUTTE','NEUKT','LULLEN','HOER','HOEREN','PORNO'],
 ca:['MERDA','PUTES','PUTA','FOLLAR','PORNO'],
 pt:['MERDA','FODER','PUTAS','PORRA','CARALHO','BUCETA','PORNO'],
 'pt-BR':['MERDA','FODER','PUTAS','PORRA','CARALHO','BUCETA','PORNO'],
 pl:['KURWA','KURWY','GÓWNO','CHUJE','CHUJA','PIZDA','JEBAĆ','PORNO'],
 cs:['KURVA','HOVNO','PÍČA','PÍČI','ČURÁK','MRDAT','PORNO'],
 sk:['KURVA','HOVNO','PIČA','KOKOT','JEBAŤ','PORNO'],
 hr:['KURVA','KURVE','PIČKA','PIZDA','JEBAT','PORNO'],
 sl:['KURVA','KURBE','PIZDA','JEBAT','PORNO'],
 ro:['PULA','PULĂ','CURVĂ','CURVE','FUTE','PORNO'],
 hu:['KURVA','FASZ','BASZNI','PICSA','PORNO'],
 tr:['SİKİŞ','SİKTİR','OROSPU','AMCIK','PORNO'],
 id:['KONTOL','MEMEK','NGENTOT','BANGSAT','PEPEK','PORNO'],
 ms:['PUKI','LANCAU','PANTAT','PORNO'],
 vi:['ĐỊT','CẶC','LỒN','ĐỤ','HIẾP'],
 el:['ΠΟΎΤΣΑ','ΜΟΥΝΊ','ΓΑΜΏ','ΣΚΑΤΆ','ΠΌΡΝΗ'],
 ru:['ХУЙ','ХУЯ','ПИЗДА','БЛЯДЬ','ЕБАТЬ','СУКА','СУКИ','ПОРНО'],
 uk:['ХУЙ','ХУЯ','ПИЗДА','БЛЯДЬ','ЇБАТИ','СУКА','СУКИ','ПОРНО'],
 ja:['セックス','ちんこ','まんこ','ポルノ','レイプ','くそ','うんこ'],
 ko:['씨발','시발','섹스','강간','자지','보지','포르노'],
 hi:['चूत','चोद','लंड','रंडी'],bn:['চুদ','মাগী','বেশ্যা'],ta:['புண்டை','ஓத்த','வேசி'],
};
function safetyKey(word:string,language:Language):string {
 return word.normalize('NFC').toLocaleUpperCase(language === 'no' ? 'nb' : language === 'el' ? 'und' : language);
}
export function isUnsafeAnswer(word:string,language:Language):boolean {
 const key=safetyKey(word,language);
 let blocked=unsafeKeyCache.get(language);
 if(!blocked){
   blocked=new Set((unsafeAnswerWords[language] ?? []).map(candidate=>safetyKey(candidate,language)));
   unsafeKeyCache.set(language,blocked);
 }
 return blocked.has(key);
}
const unsafeKeyCache=new Map<Language,Set<string>>();
const safePoolCache=new WeakMap<readonly string[],{language:Language;length:number;pool:readonly string[]}>();

// Frozen v1 pools stay intact. Only new dates from this epoch use editorial screening.
export const ANSWER_POLICY_EPOCH='2026-11-14';
export const excludedAnswers:Partial<Record<Language,readonly string[]>>={
 en:['DAVID','JAMES','JESUS','CHINA','INDIA'],
 no:['JESUS','DAVID','PETER','JÆVLA','DRITT'],
 da:['PETER','SØREN','DAVID','FRANK','HARRY','JAMES','JESUS','OLSEN','ÅRHUS','VEJLE','PARIS','NORGE'],
 fi:['PEKKA','ANTTI','MIKKO','TURUN','TURKU','OULUN','VITTU','VITUN','PASKA'],
 es:['MARÍA','PEDRO','PABLO','JESÚS'],fr:['LOUIS','DAVID','MERDE'],
 it:['MARIA','PAOLO','CARLO','MARCO','CAZZO','MERDA'],de:['PETER','FRANK','MARIA','DAVID','FRANZ','PARIS','CHINA','ARSCH'],
 nl:['PETER','DAVID','JEZUS','CHINA','JAPAN'],ca:['JOSEP','MARIA','JORDI','DAVID','JAUME','LLUÍS','RAMON','PARÍS','MÈXIC','ÍNDIA','MERDA'],
 ro:['MIHAI','MARIA','DAVID','PETER','JAMES','HENRY','FRANK','PETRU','ELENA','IULIA','PAVEL','TUDOR','RUSIA','SIBIU','PARIS','CHINA','BACĂU'],
 tr:['AHMET','HASAN','İZMİR','RUSYA'],pl:['ROSJI','KURWA','GÓWNO'],cs:['PAVEL','TOMÁŠ','PRAZE','PRAHY','ČESKU','ČESKO','PLZEŇ','RUSKO'],
 sk:['PETER','JAMES','DAVID','YORKU'],sl:['DAVID','JAMES','PETER','JANEZ','HENRY','CELJE'],hr:['PETAR','JOVAN','MARKO','MILAN','BOSNE','BOSNI'],
 hu:['JÁNOS','PÉTER','TAMÁS','GÁBOR','LAJOS','DAVID','GYULA','JÉZUS','ZSOLT','JAMES','CSABA','KURVA'],
 pt:['PAULO','JESUS','MARIA','PEDRO','CHINA','MERDA'],'pt-BR':['PAULO','JESUS','MARIA','PEDRO','CHINA','MERDA'],
 id:['YESUS','KOREA','BOGOR'],ms:['AHMAD','DAVID','HARRY','JAMES','PETER','JEPUN','KOREA','INDIA','RUSIA'],
 vi:['JAMES','DAVID','PETER','HENRY','FRANK','HARRY','JONES','SCOTT','MARIA','SIMON','TRUMP','CHRIS','SMITH','LOUIS','PARIS','SYRIA'],
 el:['ΜΑΡΊΑ','ΝΊΚΟΣ','ΑΘΉΝΑ','ΚΎΠΡΟ','ΡΩΣΊΑ'],ru:['ПУТИН','КИЕВЕ'],uk:['ПЕТРО','ПУТІН','ПЕТРА','КИЄВІ','КИЄВА','РОСІЯ','ЛЬВІВ'],
 ja:['ドラえもん','ジェームズ','チャールズ','リチャード','エリザベス','ウィリアム','ブライアン','シンデレラ','ジョーンズ','ジャクソン','マーティン','TOKYO','ワシントン','フィリピン','イスラエル','ポーランド','マレーシア','コロンビア','ウクライナ','パキスタン'],
 ko:['JAMES','크리스토퍼','크리스티나','셰익스피어','스파이더맨','DAVID','HENRY','JESUS','아인슈타인','SMITH','SCOTT','레오나르도','프란치스코','PETER','CHRIS','크리스토프','말레이시아','JAPAN','오스트리아','SEOUL','아르헨티나','바르셀로나','스코틀랜드','팔레스타인','TOKYO','크로아티아','필라델피아','디트로이트','CHINA','나이지리아','아이슬란드','라스베가스','PARIS','인천광역시','리투아니아','암스테르담','베네수엘라','카자흐스탄','샌디에이고','광주광역시','클리블랜드','대구광역시','부산광역시'],
 hi:['मनमोहन','इलाहाबाद','हैदराबाद','गोरखपुर','DELHI','देहरादून','उदयपुर'],bn:['রহমানের','আমেরিকার','কলকাতার'],
 ta:['ஜெயலலிதா','விநாயகர்','கருணாநிதி','பழனிசாமி','அமெரிக்கா','சென்னையில்','பாகிஸ்தான்','INDIA','திருப்பூர்'],
};
export function answerPool(date:string,language:Language,frozen:readonly string[]):readonly string[]{
 if(date<ANSWER_POLICY_EPOCH)return frozen;
 const normalize=(word:string)=>word.normalize('NFC').toLocaleUpperCase(language === 'no' ? 'nb' : language === 'el' ? 'und' : language);
 const excluded=new Set((excludedAnswers[language] ?? []).map(normalize));
 const approvals=language === 'ko' && date >= KOREAN_V3_EPOCH ? koreanV3.approved : approvedAnswers[language] ?? [];
 const approved=new Set(approvals.map(normalize));
 // Fail closed: unreviewed words and languages cannot supply new daily answers.
 return frozen.filter(word=>!isUnsafeAnswer(word,language) && !excluded.has(normalize(word)) && (date<APPROVED_ANSWERS_EPOCH || approved.has(normalize(word))));
}
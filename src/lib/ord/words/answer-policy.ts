import type {Language} from '@/lib/i18n/languages';

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
 const excluded=new Set(excludedAnswers[language] ?? []);
 return frozen.filter(word=>!excluded.has(word));
}
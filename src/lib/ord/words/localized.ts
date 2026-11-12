import packs from './packs.json';
import { type Language } from '@/lib/i18n/languages';
export interface WordPack { guesses: string[]; answers: string[] }
export const wordPacks: Partial<Record<Language, WordPack>> = packs;
export const letters = (word: string) => Array.from(new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(word.normalize('NFC')), part => part.segment);
// Greek locale casing removes tonos from whole words; keep the frozen accented answers.
export const uppercase = (word: string, language: Language) => language === 'el' ? word.normalize('NFC').toUpperCase() : word.normalize('NFC').toLocaleUpperCase(language === 'no' ? 'nb' : language);
const sets = new Map<Language, Set<string>>();
export function acceptsWord(word: string, language: Language): boolean {
  let set = sets.get(language);
  if (!set) { set = new Set((wordPacks[language]?.guesses ?? []).map(word => word.normalize('NFC'))); sets.set(language,set); }
  return set.has(word.normalize('NFC'));
}
export function localizedAnswer(date: string, language: Language): string | null {
  const pool = wordPacks[language]?.answers;
  if (!pool?.length) return null;
  const day = Math.floor(Date.parse(date+'T00:00:00Z')/86400000);
  let seed = 2166136261;
  for (const c of language) seed = Math.imul(seed ^ c.charCodeAt(0),16777619);
  const cycle = Math.floor(day / pool.length);
  seed ^= cycle;
  const shuffled = [...pool];
  for (let i=shuffled.length-1;i>0;i--) {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const j=seed%(i+1), a=shuffled[i], b=shuffled[j];
    if (a && b) { shuffled[i]=b; shuffled[j]=a; }
  }
  return shuffled[((day%pool.length)+pool.length)%pool.length] ?? null;
}
export function keyboardRows(language: Language): string[][] | null {
  const layouts: Partial<Record<Language,string[]>> = {
    sv:['QWERTYUIOPÅ','ASDFGHJKLÖÄ','ZXCVBNM'], en:['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'],
    no:['QWERTYUIOPÅ','ASDFGHJKLØÆ','ZXCVBNM'], da:['QWERTYUIOPÅ','ASDFGHJKLØÆ','ZXCVBNM'], fi:['QWERTYUIOPÅ','ASDFGHJKLÖÄ','ZXCVBNM'],
    de:['QWERTZUIOPÜ','ASDFGHJKLÖÄ','YXCVBNMẞ'], fr:['AZERTYUIOP','QSDFGHJKLM','WXCVBNÉÈÊÇ'],
    es:['QWERTYUIOP','ASDFGHJKLÑ','ZXCVBNMÁÉÍÓÚÜ'], tr:['QWERTYUIOPĞÜ','ASDFGHJKLŞİ','ZXCVBNMÖÇ'],
    ru:['ЙЦУКЕНГШЩЗХ','ФЫВАПРОЛДЖЭ','ЯЧСМИТЬБЮЁЪ'], uk:['ЙЦУКЕНГШЩЗХ','ФІВАПРОЛДЖЄ','ЯЧСМИТЬБЮЇҐ'],
    el:['ΕΡΤΥΘΙΟΠ','ΑΣΔΦΓΗΞΚΛ','ΖΧΨΩΒΝΜΆΈΊΌΎΉΏ'],
  };
  if (['ja','ko','th','hi','bn','gu','kn','ml','mr','or','pa','ta','te'].includes(language)) return null;
  const base=layouts[language] ?? layouts.en ?? [];
  const used=new Set(base.flatMap(letters));
  const answerLetters = new Set((wordPacks[language]?.answers ?? []).flatMap(letters));
  const extra=[...new Set((wordPacks[language]?.guesses ?? []).flatMap(letters))].filter(c=>!used.has(c) && /\p{L}/u.test(c) && (answerLetters.has(c) || (language === 'ru' || language === 'uk' ? /\p{Script=Cyrillic}/u.test(c) : language === 'el' ? /\p{Script=Greek}/u.test(c) : /\p{Script=Latin}/u.test(c))));
  const rows=base.map(letters);
  for(let i=0;i<extra.length;i+=11) rows.push(extra.slice(i,i+11));
  return rows;
}
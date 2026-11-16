import {describe,it,expect} from 'vitest';
import {answerPool,ANSWER_POLICY_EPOCH,excludedAnswers,unsafeAnswerWords,isUnsafeAnswer,unsavedAnswerPool,scheduledPool} from './words/answer-policy';
import {wordPacks} from './words/localized';
import {newRound,submitGuess} from './engine';
import type {Language} from '@/lib/i18n/languages';
import {approvedAnswers} from './words/approved-answers';
import {answers} from './words/answers';
describe('future daily answer quality and compatibility',()=>{
 it('contains no known unsafe answers in either frozen schedule for any of the 32 languages',()=>{
   const languages=['sv',...Object.keys(wordPacks)] as Language[];
   expect(Object.keys(unsafeAnswerWords).length).toBe(32);
   for(const language of languages) for(const date of ['2026-11-14','2026-11-18']) {
     for(const word of scheduledPool(date,language)) expect(isUnsafeAnswer(word,language),`${date}:${language}:${word}`).toBe(false);
     expect(unsavedAnswerPool(date,language).length,language).toBeGreaterThanOrEqual(3);
   }
 });
 it('blocks known unsafe words even if accidentally added to positive approvals and the active schedule',()=>{
   const pool=scheduledPool('2026-11-18','en') as string[];
   const approved=approvedAnswers.en as string[];
   pool.push('BITCH');approved.push('BITCH');
   try {
     expect(unsavedAnswerPool('2026-11-18','en')).not.toContain('BITCH');
     expect(answerPool('2026-11-18','en',['BITCH','WATER'])).toEqual(['WATER']);
   } finally {pool.pop();approved.pop();}
 });
 it('matches normalized casing without blocking innocent words or another language',()=>{
   expect(isUnsafeAnswer('ja\u0308vla','sv')).toBe(true);
   expect(isUnsafeAnswer('sikiş','tr')).toBe(true);
   expect(isUnsafeAnswer('CONNU','fr')).toBe(false);
   expect(isUnsafeAnswer('HUREN','nl')).toBe(false);
   expect(isUnsafeAnswer('FODER','sv')).toBe(false);
 });
 it('screens every unsaved legacy round in all 32 languages without modifying a saved historical answer',()=>{
   for(const language of ['sv',...Object.keys(wordPacks)] as Language[]) {
     for(const date of ['2026-11-12','2026-11-13']) {
       const selected:string[]=[];
       for(let slot=0;slot<3;slot++) {
         const round=newRound(date,language,slot,selected);
         expect(approvedAnswers[language]?.includes(round.answer),`${language}:${date}:${slot}`).toBe(true);
         expect(excludedAnswers[language]?.includes(round.answer)).not.toBe(true);
         selected.push(round.answer);
       }
       expect(new Set(selected).size).toBe(3);
     }
   }
   const saved={date:'2026-11-13',answer:'ПУТІН',language:'uk' as const,guesses:[]};
   expect(submitGuess(saved,'ПУТІН').round.answer).toBe('ПУТІН');
   expect(submitGuess(saved,'ПУТІН').round.guesses).toEqual(['ПУТІН']);
 });
 it('rejects unapproved answers, even when they are absent from the exclusion list',()=>{
   expect(answerPool('2026-11-14','en',['WATER','SHITS','BITCH','TRUMP','UNREVIEWED'])).toEqual(['WATER']);
   expect(answerPool('2026-11-14','sv',['KANEL','KUKEN','HOROR'])).toEqual(['KANEL']);
   expect(answerPool('2026-11-14','it',['LIBRO','SESSO','CAZZO'])).toEqual(['LIBRO']);
   expect(answerPool('2026-11-14','ms',['MAKAN','BODOH'])).toEqual(['MAKAN']);
 });
 it('never falls back to unchecked words in languages without approval',()=>{
   expect(answerPool('2026-11-14','th',['ABCDE'])).toEqual([]);
   expect(answerPool('2026-11-14','en',['BITCH'])).toEqual([]);
 });
 it('uses only explicitly approved, dictionary-valid candidates for all 32 languages',()=>{
   for(const language of ['sv',...Object.keys(wordPacks)] as Language[]) {
     const frozen=language==='sv' ? answers : wordPacks[language]?.answers ?? [];
     const pool=answerPool('2026-11-14',language,frozen);
     expect(pool.length,language).toBeGreaterThanOrEqual(3);
     for(const answer of pool) {
       expect(approvedAnswers[language]?.includes(answer),`${language}: ${answer}`).toBe(true);
       expect(submitGuess({date:'2026-11-14',language,answer,guesses:[]},answer).error).toBeUndefined();
     }
   }
 });
 it('retains every frozen assignment before November 14 and screens identified future answers',()=>{
   expect(ANSWER_POLICY_EPOCH).toBe('2026-11-14');
   expect(answerPool('2026-11-13','fr',['MERDE','SALUT'])).toEqual(['MERDE','SALUT']);
   expect(answerPool('2026-11-14','fr',['MERDE','SALUT'])).toEqual(['SALUT']);
 });
 it('keeps saved excluded answers winnable instead of changing the assigned word',()=>{
   expect(submitGuess({date:'2026-11-14',answer:'MERDE',language:'fr',guesses:[]},'merde').round.guesses).toEqual(['MERDE']);
 });
 it('keeps an old saved answer winnable even if a later dictionary no longer includes it',()=>{
   expect(submitGuess({date:'2026-11-13',answer:'ABCDE',guesses:[]},'ABCDE').round.guesses).toEqual(['ABCDE']);
 });
 it('preserves all 32 word languages and three distinct valid future words per day',()=>{
   expect(Object.keys(wordPacks).length+1).toBe(32);
    for(const language of ['sv',...Object.keys(wordPacks)] as Language[]) {
     const excluded=new Set(excludedAnswers[language]);
     for(let day=0;day<370;day++) {
       const date=new Date(Date.UTC(2026,10,14+day)).toISOString().slice(0,10),selected:string[]=[];
       for(let slot=0;slot<3;slot++) {
         const round=newRound(date,language,slot,selected);
         expect(excluded.has(round.answer)).toBe(false);expect(approvedAnswers[language]?.includes(round.answer)).toBe(true);expect(submitGuess(round,round.answer).error).toBeUndefined();selected.push(round.answer);
       }
       expect(new Set(selected).size).toBe(3);
     }
   }
 },30000);
});
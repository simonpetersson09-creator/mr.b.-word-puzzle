import {describe,it,expect} from 'vitest';
import {answerPool,ANSWER_POLICY_EPOCH,excludedAnswers} from './words/answer-policy';
import {wordPacks} from './words/localized';
import {newRound,submitGuess} from './engine';
import type {Language} from '@/lib/i18n/languages';
describe('future daily answer quality and compatibility',()=>{
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
   for(const language of Object.keys(wordPacks) as Language[]) {
     const excluded=new Set(excludedAnswers[language]);
     for(let day=0;day<370;day++) {
       const date=new Date(Date.UTC(2026,10,14+day)).toISOString().slice(0,10),selected:string[]=[];
       for(let slot=0;slot<3;slot++) {
         const round=newRound(date,language,slot,selected);
         expect(excluded.has(round.answer)).toBe(false);expect(submitGuess(round,round.answer).error).toBeUndefined();selected.push(round.answer);
       }
       expect(new Set(selected).size).toBe(3);
     }
   }
 });
});
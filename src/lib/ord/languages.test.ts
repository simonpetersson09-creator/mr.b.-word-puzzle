import { describe,it,expect } from 'vitest';
import { languages,resolveLanguage } from '@/lib/i18n/languages';
import { emptySave,newRound,submitGuess,statistics,evaluate,welcomeState } from './engine';
import { persistSave,loadSave,mergeRound } from './storage';
import { letters,wordPacks,uppercase,keyboardRows } from './words/localized';
describe('Languages and word quality',()=>{
 it('every frozen Greek answer can be entered and won without removing its accents',()=>{
  const pack=wordPacks.el;
  if (!pack) throw new Error('Missing Greek pack');
  const keys=new Set(keyboardRows('el')?.flat());
  expect(pack.answers).toHaveLength(240);
  for (const answer of pack.answers) {
   const raw=answer.toLocaleLowerCase('el');
   expect(uppercase(raw,'el')).toBe(answer);
   for(const letter of letters(answer)) expect(keys.has(letter)).toBe(true);
   const result=submitGuess({date:'2026-11-12',language:'el',answer,guesses:[]},raw);
   expect(result.error).toBeUndefined();
   expect(evaluate(result.round.guesses[0] ?? '',answer)).toEqual(['correct','correct','correct','correct','correct']);
   expect(statistics({one:result.round},'2026-11-12').wins).toBe(1);
  }
 });
 it('only three completed words make the welcome complete',()=>{
  let save=emptySave();
  for(let slot=0;slot<3;slot++) {
   const round=newRound('2026-11-12','sv',slot,Object.values(save.rounds).map(r=>r.answer));
   const won=submitGuess(round,round.answer).round;
   save=mergeRound(save,won);
   expect(welcomeState(save,won)).toBe(slot===2 ? 'complete' : 'next');
  }
 });
 it('an empty guess consumes no attempt or daily round',()=>{
  const round=newRound('2026-11-12');
  const result=submitGuess(round,'');
  expect(result.error).toBe('short');
  expect(result.round).toBe(round);
  expect(result.round.guesses).toEqual([]);
  expect(statistics({[round.date]:result.round},round.date).played).toBe(0);
 });
 it('matches all 40 Yatzy languages and device regional tags',()=>{
  expect(Object.keys(languages)).toHaveLength(40);
  expect(resolveLanguage(['sv-SE'])).toBe('sv');
  expect(resolveLanguage(['nb-NO'])).toBe('no');
  expect(resolveLanguage(['pt-BR'])).toBe('pt-BR');
  expect(resolveLanguage(['zz','fr-CA'])).toBe('fr');
 });
 it('accepts verified Swedish inflections but not random letters',()=>{
  expect(submitGuess(newRound('2026-11-12'),'bilar').error).toBeUndefined();
  expect(submitGuess(newRound('2026-11-12'),'huset').error).toBeUndefined();
  expect(submitGuess(newRound('2026-11-12'),'ZZZZZ').error).toBe('unknown');
 });
 it('validates each localized answer and retains it on restart',()=>{
  for(const language of Object.keys(wordPacks) as (keyof typeof languages)[]){
   const round=newRound('2026-11-12',language);
   expect(letters(round.answer)).toHaveLength(5);
   expect(submitGuess(round,round.answer).error).toBeUndefined();
   expect(newRound(round.date,language).answer).toBe(round.answer);
  }
 });
 it('changing language cannot replace a completed daily result',()=>{
  localStorage.clear();
  const en=newRound('2026-11-12','en');
  const save=mergeRound(emptySave(),submitGuess(en,en.answer).round);
  persistSave(save);
  const result=mergeRound(loadSave(),newRound('2026-11-12','fr'));
  expect(result.rounds['2026-11-12']?.language).toBe('en');
  expect(statistics(result.rounds,'2026-11-12')).toMatchObject({played:1,wins:1,current:1});
 });
});
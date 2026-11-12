import { describe,it,expect } from 'vitest';
import { languages,resolveLanguage } from '@/lib/i18n/languages';
import { emptySave,newRound,submitGuess,statistics } from './engine';
import { persistSave,loadSave,mergeRound } from './storage';
import { letters,wordPacks } from './words/localized';
describe('Languages and word quality',()=>{
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
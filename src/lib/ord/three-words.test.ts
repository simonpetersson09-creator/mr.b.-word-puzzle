import {describe,it,expect,beforeEach} from 'vitest';
import {activeSlot,DAILY_WORDS,emptySave,gameDate,newRound,roundKey,statistics,submitGuess,type Round} from './engine';
import {loadSave,mergeRound,persistSave,SAVE_KEY} from './storage';
describe('Three daily words',()=>{
 it('preserves mixed results, percentage and attempt distribution through repeated restart',()=>{
  let save=emptySave();
  const first={date:'2026-11-12',answer:'KANEL',guesses:['TIGER','KANEL']};
  const second={date:'2026-11-12',slot:1,answer:'TIGER',guesses:Array(6).fill('KANEL')};
  const third={date:'2026-11-12',slot:2,answer:'ÄPPLE',guesses:['ÄPPLE']};
  for(const round of [first,second,third]) save=mergeRound(save,round);
  for(let restart=0;restart<3;restart++) {persistSave(save);save=loadSave();}
  expect(statistics(save.rounds,'2026-11-12')).toEqual({played:3,wins:2,percentage:67,current:1,longest:1,distribution:[1,1,0,0,0,0]});
 });
 beforeEach(()=>localStorage.clear());
 it('allows exactly three distinct words and persists all three wins',()=>{
  expect(DAILY_WORDS).toBe(3);
  let save=emptySave();const answers:string[]=[];
  for(let slot=0;slot<3;slot++){
   expect(activeSlot(save,'2026-11-12')).toBe(slot);
   const round=newRound('2026-11-12','sv',slot,answers);answers.push(round.answer);
   save=mergeRound(save,submitGuess(round,round.answer).round);persistSave(save);save=loadSave();
  }
  expect(new Set(answers).size).toBe(3);
  expect(Object.keys(save.rounds)).toHaveLength(3);
  expect(mergeRound(save,{...newRound('2026-11-12'),slot:3})).toEqual(save);
  expect(statistics(save.rounds,'2026-11-12')).toMatchObject({played:3,wins:3,current:1,longest:1});
 });
 it('retains the old daily answer and result as the first of three',()=>{
  const old=mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round);
  localStorage.setItem(SAVE_KEY,JSON.stringify(old));
  expect(loadSave().rounds['2026-11-12']?.answer).toBe('KANEL');
  expect(activeSlot(loadSave(),'2026-11-12')).toBe(1);
 });
 it('does not unlock later words before completion and accepts losses as completed rounds',()=>{
  let save=emptySave();
  expect(mergeRound(save,newRound('2026-11-12','sv',1))).toEqual(save);
  const lost:Round={...newRound('2026-11-12'),guesses:Array(6).fill('TIGER')};
  save=mergeRound(save,lost);
  expect(activeSlot(save,'2026-11-12')).toBe(1);
  expect(mergeRound(save,newRound('2026-11-12','sv',2))).toEqual(save);
 });
 it('provides three new slots at 03:00 local time without losing history',()=>{
  const save=mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round);
  expect(gameDate(new Date('2026-11-13T01:59:59Z'),'Europe/Stockholm')).toBe('2026-11-12');
  const date=gameDate(new Date('2026-11-13T02:00:00Z'),'Europe/Stockholm');
  expect(date).toBe('2026-11-13');expect(activeSlot(save,date)).toBe(0);
  expect(save.rounds[roundKey('2026-11-12')]?.guesses).toEqual(['KANEL']);
 });
 it('counts daily winning streaks once even with several wins or losses that day',()=>{
  const rounds={a:{date:'2026-11-12',answer:'KANEL',guesses:['KANEL']},b:{date:'2026-11-12',slot:1,answer:'TIGER',guesses:Array(6).fill('KANEL')},c:{date:'2026-11-13',answer:'KANEL',guesses:['KANEL']}};
  expect(statistics(rounds,'2026-11-13')).toMatchObject({played:3,wins:2,current:2,longest:2});
 });
});
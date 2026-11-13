import {describe,it,expect,vi} from 'vitest';
import {newRound} from './engine';
import {wordPacks,keyboardRows,letters} from './words/localized';
import {scheduledPool} from './words/answer-policy';
import type {Language} from '@/lib/i18n/languages';
describe('dictionary-independent schedules',()=>{
 it('retains all three answers even if a dictionary answer pool is replaced',()=>{
  const pack=wordPacks.en;if(!pack) throw new Error('missing pack');
  const before=Array.from({length:3},(_,slot)=>newRound('2026-11-14','en',slot).answer);
  const old=pack.answers;pack.answers=['OTHER'];
  try {expect(Array.from({length:3},(_,slot)=>newRound('2026-11-14','en',slot).answer)).toEqual(before);} finally {pack.answers=old;}
 });
 it('keeps approved schedules independent of future approval edits',async()=>{
  const {approvedAnswers}=await import('./words/approved-answers');
  const before=[...scheduledPool('2026-11-14','en')];
  const old=approvedAnswers.en;if(!old) throw new Error('missing approvals');approvedAnswers.en=['OTHER'];
  try {expect(scheduledPool('2026-11-14','en')).toEqual(before);}finally{approvedAnswers.en=old;}
 });
 it('keeps 32 playable languages, using native Vietnamese composition and covering every other scheduled alphabet',()=>{
  expect(Object.keys(wordPacks).length+1).toBe(32);expect(keyboardRows('vi')).toBeNull();
  for(const lang of ['sv',...Object.keys(wordPacks)] as Language[]) {
   const rows=keyboardRows(lang);if(!rows)continue;
   const keys=new Set(rows.flat());
   const needed=new Set(scheduledPool('2026-11-14',lang).flatMap(letters));
   for(const c of needed)expect(keys.has(c),`${lang}:${c}`).toBe(true);
  }
 });
});
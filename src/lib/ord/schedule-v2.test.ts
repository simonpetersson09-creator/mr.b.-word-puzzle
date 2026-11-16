import {describe,expect,it} from 'vitest';
import {newRound,submitGuess,DAILY_WORDS} from './engine';
import {SCHEDULE_V2_EPOCH,scheduledPool} from './words/answer-policy';
import schedule from './words/schedule-v2.json';
const days=(from:string,n:number)=>Array.from({length:n},(_,i)=>new Date(Date.parse(from+'T00:00:00Z')+i*864e5).toISOString().slice(0,10));
describe('schedule v2',()=>{
  it('starts on 2026-11-18 and extends Swedish by 200 words',()=>{
    expect(SCHEDULE_V2_EPOCH).toBe('2026-11-18');
    expect(scheduledPool('2026-11-18','sv').length-scheduledPool('2026-11-17','sv').length).toBe(200);
  });
  it('does not repeat a word within the first v2 cycle and answers are playable',()=>{
    for(const code of Object.keys(schedule.approved) as any[]){
      const pool=scheduledPool(SCHEDULE_V2_EPOCH,code); if(pool.length<3) continue;
      const seen:string[]=[];
      for(const d of days(SCHEDULE_V2_EPOCH,Math.floor(pool.length/DAILY_WORDS))) for(let s=0;s<DAILY_WORDS;s++){
        const r=newRound(d,code,s); expect(submitGuess(r,r.answer).error).toBeUndefined(); seen.push(r.answer);
      }
      expect(new Set(seen).size,code).toBe(seen.length);
    }
  });
});

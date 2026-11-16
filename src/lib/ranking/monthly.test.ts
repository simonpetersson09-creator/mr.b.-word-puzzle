import {describe,it,expect} from 'vitest';
import {MONTHLY_MINIMUM,monthlyRounds,previousMonth,currentMonth} from './monthly';
import {emptySave} from '../ord/engine';
describe('monthly ranking',()=>{
  it('qualifies after 30 words',()=>expect(MONTHLY_MINIMUM).toBe(30));
  it('selects only the current game month',()=>{expect(currentMonth('2026-11-16')).toBe('2026-11');expect(currentMonth('2026-12-01')).toBe('2026-12');});
  it('retains the previous month across year boundaries',()=>expect(previousMonth('2027-01')).toBe('2026-12'));
  it('shares only completed bounded slots, preserves failure +3 and par 0',()=>{
    const save=emptySave();
    save.rounds['2026-11-16']={date:'2026-11-16',answer:'KANEL',guesses:['TIGER','SKOPA','VATTN','KANEL']};
    save.rounds['2026-11-16:2']={date:'2026-11-16',slot:1,answer:'TIGER',guesses:Array(6).fill('KANEL')};
    save.rounds['2026-11-16:3']={date:'2026-11-16',slot:2,answer:'SKOPA',guesses:[]};
    save.rounds['duplicate']=save.rounds['2026-11-16'];
    expect(monthlyRounds(save,'2026-11-16')).toEqual([{day:'2026-11-16',slot:0,score:0},{day:'2026-11-16',slot:1,score:3}]);
    expect(JSON.stringify(monthlyRounds(save,'2026-11-16'))).not.toMatch(/KANEL|TIGER|answer|guesses/);
  });
  it('excludes future and older month results',()=>{
    const save=emptySave();for(const day of ['2026-09-30','2026-10-31','2026-11-17'])save.rounds[day]={date:day,answer:'KANEL',guesses:['KANEL']};
    expect(monthlyRounds(save,'2026-11-16')).toEqual([{day:'2026-10-31',slot:0,score:-3}]);
  });
});
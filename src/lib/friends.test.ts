import {describe,it,expect} from 'vitest';
import {friendSummary,friendToday,normalizeFriendCode,validFriendCode,validFriendName, type Friend} from './friends';
import {emptySave} from './ord/engine';
describe('friends',()=>{
  it('accepts six-character codes and retains old invitations',()=>{expect(validFriendCode('ABC 123')).toBe(true);expect(validFriendCode('ABCDEF123456')).toBe(true);expect(validFriendCode('ABCDE')).toBe(false);expect(validFriendCode('ZZZ123')).toBe(false);});
  it('shares only scores and attempts, never answers or guesses',()=>{
    const save=emptySave();save.rounds['2026-11-16']={date:'2026-11-16',answer:'KANEL',guesses:['KANEL']};save.rounds['2026-11-16:2']={date:'2026-11-16',slot:1,answer:'TIGER',guesses:[]};
    expect(friendSummary(save,'2026-11-16')).toEqual({hcp:-3,day:'2026-11-16',completed:1,results:[{won:true,attempts:1,score:-3},null,null]});
    expect(JSON.stringify(friendSummary(save,'2026-11-16'))).not.toMatch(/KANEL|TIGER|answer|guesses/);
  });
  it('reports all three completed games with par, birdie and failed +3',()=>{
    const save=emptySave();
    save.rounds['2026-11-16']={date:'2026-11-16',answer:'KANEL',guesses:['TIGER','SKOPA','VATTN','KANEL']};
    save.rounds['2026-11-16:2']={date:'2026-11-16',slot:1,answer:'TIGER',guesses:['KANEL','SKOPA','TIGER']};
    save.rounds['2026-11-16:3']={date:'2026-11-16',slot:2,answer:'SKOPA',guesses:Array(6).fill('KANEL')};
    const summary=friendSummary(save,'2026-11-16');
    expect(summary.completed).toBe(3);
    expect(summary.results).toEqual([{won:true,attempts:4,score:0},{won:true,attempts:3,score:-1},{won:false,attempts:6,score:3}]);
  });
  it('never shows previous-day results as today or invents missing old results',()=>{
    const friend:Friend={id:'friend',name:'Alex',status:'accepted',incoming:false,hcp:0,day:'2026-11-15',completed:3,results:[{won:true,attempts:4,score:0},null,null]};
    expect(friendToday(friend,'2026-11-16')).toEqual({current:false,completed:0,complete:false,results:[null,null,null]});
    expect(friendToday({...friend,day:'2026-11-16',results:null},'2026-11-16')).toEqual({current:true,completed:3,complete:true,results:[null,null,null]});
  });
  it('accepts names from 1 to 24 characters without control characters',()=>{
    expect(validFriendName('Simon')).toBe(true);expect(validFriendName(' ')).toBe(false);expect(validFriendName('a'.repeat(25))).toBe(false);expect(validFriendName('A\nB')).toBe(false);
  });
  it('normalizes friend codes for entry',()=>{expect(normalizeFriendCode('abcd ef12 3456')).toBe('ABCDEF123456');});
});
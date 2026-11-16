import {describe,it,expect} from 'vitest';
import {friendSummary,normalizeFriendCode,validFriendCode,validFriendName} from './friends';
import {emptySave} from './ord/engine';
describe('friends',()=>{
  it('accepts six-character codes and retains old invitations',()=>{expect(validFriendCode('ABC 123')).toBe(true);expect(validFriendCode('ABCDEF123456')).toBe(true);expect(validFriendCode('ABCDE')).toBe(false);expect(validFriendCode('ZZZ123')).toBe(false);});
  it('shares only HCP and completed count, never answers or guesses',()=>{
    const save=emptySave();save.rounds['a']={date:'2026-11-16',answer:'KANEL',guesses:['KANEL']};save.rounds['b']={date:'2026-11-16',slot:1,answer:'TIGER',guesses:[]};
    expect(friendSummary(save,'2026-11-16')).toEqual({hcp:-3,day:'2026-11-16',completed:1});
  });
  it('accepts names from 1 to 24 characters without control characters',()=>{
    expect(validFriendName('Simon')).toBe(true);expect(validFriendName(' ')).toBe(false);expect(validFriendName('a'.repeat(25))).toBe(false);expect(validFriendName('A\nB')).toBe(false);
  });
  it('normalizes friend codes for entry',()=>{expect(normalizeFriendCode('abcd ef12 3456')).toBe('ABCDEF123456');});
});
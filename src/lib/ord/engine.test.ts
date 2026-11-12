import { describe, it, expect, beforeEach } from 'vitest';
import { answers } from './words/answers';
import { dailyAnswer, dictionarySet, emptySave, evaluate, isFinished, hasWon, keyboardMarks, newRound, statistics, stockholmDate, submitGuess, type Round } from './engine';
import { loadSave, mergeRound, persistSave } from './storage';

describe('Mr. B Ord rules', () => {
  beforeEach(() => localStorage.clear());
  it('allocates the same five-letter answer for a Stockholm date', () => {
    expect(dailyAnswer('2026-11-12')).toBe('KANEL');
    expect(dailyAnswer('2026-11-13')).toBe('TIGER');
    for(const answer of answers) { expect(answer).toHaveLength(5); expect(dictionarySet.has(answer)).toBe(true); }
  });
  it('changes date at Stockholm midnight in winter', () => {
    expect(stockholmDate(new Date('2026-11-12T22:59:59Z'))).toBe('2026-11-12');
    expect(stockholmDate(new Date('2026-11-12T23:00:00Z'))).toBe('2026-11-13');
  });
  it('uses Stockholm summer time', () => {
    expect(stockholmDate(new Date('2026-07-12T21:59:59Z'))).toBe('2026-07-12');
    expect(stockholmDate(new Date('2026-07-12T22:00:00Z'))).toBe('2026-07-13');
  });
  it('marks duplicate letters green first, then consumes leftovers left to right', () => {
    expect(evaluate('KANAL','KANEL')).toEqual(['correct','correct','correct','absent','correct']);
    expect(evaluate('AAAAB','BANAN')).toEqual(['absent','correct','absent','correct','present']);
    expect(evaluate('AAABB','KANEL')).toEqual(['absent','correct','absent','absent','absent']);
  });
  it('treats Å Ä Ö as separate letters and accepts Swedish words', () => {
    expect(evaluate('ÅÄÖAA','ÅÄÖBB')).toEqual(['correct','correct','correct','absent','absent']);
    expect(submitGuess({date:'2026-11-12',answer:'ÄPPLE',guesses:[]},'äpple').round.guesses).toEqual(['ÄPPLE']);
    expect(submitGuess(newRound('2026-11-12'),'SNÖRE').error).toBeUndefined();
  });
  it('does not spend an attempt on incomplete or unknown words', () => {
    const round=newRound('2026-11-12');
    expect(submitGuess(round,'KAN').round).toBe(round);
    expect(submitGuess(round,'ZZZZZ')).toEqual({round,error:'unknown'});
  });
  it('keeps keyboard colors in the priority green > yellow > grey', () => {
    const marks=keyboardMarks({date:'2026-11-12',answer:'KANEL',guesses:['KANAL','LAMPA']});
    expect(marks['A']).toBe('correct'); expect(marks['L']).toBe('correct');
    expect(keyboardMarks({date:'2026-11-12',answer:'KANEL',guesses:['GLASS','SOPPA']})['A']).toBe('present');
  });
  it('wins on the sixth attempt and prevents further guesses', () => {
    const round:Round={date:'2026-11-12',answer:'KANEL',guesses:['TIGER','ÄPPLE','PÄRON','BANAN','MANGO']};
    const final=submitGuess(round,'KANEL').round;
    expect(hasWon(final)).toBe(true); expect(final.guesses).toHaveLength(6); expect(isFinished(final)).toBe(true);
    expect(submitGuess(final,'TIGER').error).toBe('finished');
  });
  it('loses after exactly six valid incorrect guesses', () => {
    let round=newRound('2026-11-12');
    for(const guess of ['TIGER','ÄPPLE','PÄRON','BANAN','MANGO','BÄVER']) round=submitGuess(round,guess).round;
    expect(isFinished(round)).toBe(true); expect(hasWon(round)).toBe(false); expect(round.answer).toBe('KANEL');
  });
  it('reopens an unfinished board and preserves its assigned answer', () => {
    const round=submitGuess(newRound('2026-11-12'),'TIGER').round;
    expect(persistSave(mergeRound(emptySave(),round))).toBe(true);
    expect(loadSave().rounds['2026-11-12']).toEqual(round);
  });
  it('counts a finished result only once after restart', () => {
    const round=submitGuess(newRound('2026-11-12'),'KANEL').round;
    let save=mergeRound(emptySave(),round); persistSave(save); save=mergeRound(loadSave(),round); persistSave(save);
    expect(statistics(loadSave().rounds,round.date)).toMatchObject({played:1,wins:1,percentage:100,current:1,longest:1,distribution:[1,0,0,0,0,0]});
  });
  it('breaks a streak on a missed day, but not an unfinished current day', () => {
    const rounds={'2026-11-12':{date:'2026-11-12',answer:'KANEL',guesses:['KANEL']},'2026-11-13':{date:'2026-11-13',answer:'TIGER',guesses:['TIGER']}};
    expect(statistics(rounds,'2026-11-14').current).toBe(2);
    expect(statistics(rounds,'2026-11-15').current).toBe(0);
    expect(statistics({...rounds,'2026-11-15':{date:'2026-11-15',answer:'PÄRON',guesses:['PÄRON']}},'2026-11-15')).toMatchObject({current:1,longest:2});
  });
  it('breaks a streak on a loss', () => {
    const rounds={'2026-11-12':{date:'2026-11-12',answer:'KANEL',guesses:['KANEL']},'2026-11-13':{date:'2026-11-13',answer:'TIGER',guesses:Array(6).fill('KANEL')}};
    expect(statistics(rounds,'2026-11-13')).toMatchObject({played:2,percentage:50,current:0,longest:1});
  });
  it('retains prior rounds when the date changes', () => {
    const save=mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round);
    const next=mergeRound(save,newRound('2026-11-13'));
    expect(next.rounds['2026-11-12']?.guesses).toEqual(['KANEL']); expect(next.rounds['2026-11-13']?.guesses).toEqual([]);
  });
});
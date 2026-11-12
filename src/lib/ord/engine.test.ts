import { describe, it, expect, beforeEach } from 'vitest';
import { answers } from './words/answers';
import { dailyAnswer, dictionarySet, emptySave, evaluate, isFinished, hasWon, keyboardMarks, newRound, statistics, gameDate, submitGuess, type Round } from './engine';
import { loadSave, mergeRound, persistSave, SAVE_KEY, BACKUP_KEY } from './storage';

describe('Mr. B Ord rules', () => {
  beforeEach(() => localStorage.clear());
  it('allocates the same five-letter answer for a Stockholm date', () => {
    expect(dailyAnswer('2026-11-12')).toBe('KANEL');
    expect(dictionarySet.has(dailyAnswer('2026-11-13'))).toBe(true);
    for(const answer of answers) { expect(answer).toHaveLength(5); expect(dictionarySet.has(answer)).toBe(true); }
  });
  it('changes the local game day at exactly 03:00 in winter', () => {
    expect(gameDate(new Date('2026-11-13T01:59:59Z'),'Europe/Stockholm')).toBe('2026-11-12');
    expect(gameDate(new Date('2026-11-13T02:00:00Z'),'Europe/Stockholm')).toBe('2026-11-13');
  });
  it('uses Stockholm summer time', () => {
    expect(gameDate(new Date('2026-07-13T00:59:59Z'),'Europe/Stockholm')).toBe('2026-07-12');
    expect(gameDate(new Date('2026-07-13T01:00:00Z'),'Europe/Stockholm')).toBe('2026-07-13');
  });
  it('uses the phone timezone rather than forcing Stockholm', () => {
    expect(gameDate(new Date('2026-11-13T07:59:59Z'),'America/New_York')).toBe('2026-11-12');
    expect(gameDate(new Date('2026-11-13T08:00:00Z'),'America/New_York')).toBe('2026-11-13');
  });
  it('handles the autumn repeated hour and spring skipped hour', () => {
    expect(gameDate(new Date('2026-10-25T01:59:59Z'),'Europe/Stockholm')).toBe('2026-10-24');
    expect(gameDate(new Date('2026-10-25T02:00:00Z'),'Europe/Stockholm')).toBe('2026-10-25');
    expect(gameDate(new Date('2026-03-29T00:59:59Z'),'Europe/Stockholm')).toBe('2026-03-28');
    expect(gameDate(new Date('2026-03-29T01:00:00Z'),'Europe/Stockholm')).toBe('2026-03-29');
  });
  it('shuffles future cycles but retains fixed historical assignments', () => {
    const next = Array.from({length:72},(_,i) => dailyAnswer(new Date(Date.UTC(2026,10,13+i)).toISOString().slice(0,10)));
    expect(new Set(next).size).toBe(72); expect(next).not.toEqual(answers);
    expect(dailyAnswer('2026-11-13')).toBe(next[0]); expect(dailyAnswer('2026-11-12')).toBe('KANEL');
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
  it('cannot restart a completed daily round even after reopening', () => {
    persistSave(mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round));
    const saved=loadSave(), next=mergeRound(saved,newRound('2026-11-12'));
    expect(next.rounds['2026-11-12']?.guesses).toEqual(['KANEL']);
    expect(submitGuess(next.rounds['2026-11-12'] ?? newRound('2026-11-12'),'TIGER').error).toBe('finished');
  });
  it('recovers all results and settings from a backup if the main save is damaged', () => {
    const save=mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round);
    save.settings.sound=false; persistSave(save); localStorage.setItem(SAVE_KEY,'broken');
    expect(loadSave()).toEqual(save); expect(localStorage.getItem(BACKUP_KEY)).not.toBeNull();
  });
  it('retains historical five-letter words after a dictionary update', () => {
    const save=mergeRound(emptySave(),{date:'2026-11-12',answer:'ABCDE',guesses:['ABCDE']});
    persistSave(save); expect(loadSave().rounds['2026-11-12']).toEqual(save.rounds['2026-11-12']);
  });
  it('does not let future results extend todays streak after clock reversal', () => {
    const rounds={'2026-11-13':{date:'2026-11-13',answer:'TIGER',guesses:['TIGER']}};
    expect(statistics(rounds,'2026-11-12')).toMatchObject({played:0,current:0});
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
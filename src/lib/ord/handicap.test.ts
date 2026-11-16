import { describe, expect, it } from 'vitest';
import { handicap, wordScore } from './handicap';
import type { Round } from './engine';

const win = (attempts: number): Round => ({ date: '2026-11-16', answer: 'KANEL', guesses: [...Array<string>(attempts - 1).fill('TIGER'), 'KANEL'] });

describe('golf handicap', () => {
  it.each([[1,-3],[2,-2],[3,-1],[4,0],[5,1],[6,2]])('%i winning attempts score %i', (attempts, score) => {
    expect(wordScore(win(attempts))).toBe(score);
  });
  it('a failed word scores +3', () => {
    expect(wordScore({...win(6), guesses: Array<string>(6).fill('TIGER')})).toBe(3);
  });
  it('unfinished words never count', () => {
    expect(wordScore({...win(4), guesses: ['TIGER']})).toBeNull();
    expect(handicap({empty: {...win(4), guesses: []}}, '2026-11-16')).toEqual({count: 0, value: null});
  });
  it('uses the mean of available completed words before 30', () => {
    expect(handicap({a:win(3), b:win(4), c:win(5)}, '2026-11-16')).toEqual({count: 3, value: 0});
  });
  it('uses only the latest 30 words ordered by day and slot, not insertion order', () => {
    const rounds: Record<string, Round> = {};
    for (let i = 32; i >= 0; i--) {
      const date = `2026-11-${String(1 + Math.floor(i / 3)).padStart(2,'0')}`;
      rounds[String(i)] = {...win(i < 3 ? 1 : 5), date, slot: i % 3};
    }
    expect(handicap(rounds, '2026-11-16')).toEqual({count: 30, value: 1});
  });
  it('ignores future dated results and stays unchanged across reload', () => {
    const rounds = {a:win(3), future:{...win(6),date:'2026-11-17'}};
    expect(handicap(JSON.parse(JSON.stringify(rounds)), '2026-11-16')).toEqual({count:1,value:-1});
  });
});
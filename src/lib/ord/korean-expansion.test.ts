import { describe, expect, it, vi } from 'vitest';
import snapshot from './words/schedule-korean-v3.json';
import { acceptsWord, letters } from './words/localized';
import { KOREAN_V3_EPOCH, isUnsafeAnswer, scheduledPool } from './words/answer-policy';
import { newRound, submitGuess, dayNumber, hasWon } from './engine';

describe('300 Korean dictionary additions', () => {
  it('adds exactly 300 unique new answers, taking 56 to 356 on the new epoch', () => {
    expect(KOREAN_V3_EPOCH).toBe('2026-11-20');
    const old = scheduledPool('2026-11-19', 'ko');
    expect(old).toHaveLength(56);
    expect(snapshot.additions).toHaveLength(300);
    expect(new Set(snapshot.approved).size).toBe(356);
    expect(scheduledPool('2026-11-20', 'ko')).toHaveLength(356);
    for (const entry of snapshot.additions) expect(old).not.toContain(entry.word);
  });
  it('accepts every real five-syllable dictionary entry, with provenance and safety screening', () => {
    for (const { word, source } of snapshot.additions) {
      expect(word).toMatch(/^[가-힣]{5}$/u);
      expect(letters(word)).toHaveLength(5);
      expect(word).toBe(word.normalize('NFC'));
      expect(source).toMatch(/^https?:\/\/(krdict|stdict|opendict)\.korean\.go\.kr\//);
      expect(isUnsafeAnswer(word, 'ko')).toBe(false);
      expect(acceptsWord(word, 'ko')).toBe(true);
      const round = { date: KOREAN_V3_EPOCH, language: 'ko' as const, answer: '아이스크림', guesses: [] };
      expect(submitGuess(round, word).error).toBeUndefined();
    }
  });
  it('preserves historical assignments, saved answers and other languages', () => {
    expect([0, 1, 2].map(slot => newRound('2026-11-19', 'ko', slot).answer)).toEqual(['하이라이트', '아이스하키', '프리스타일']);
    expect([0, 1, 2].map(slot => newRound('2026-11-18', 'ko', slot).answer)).toEqual(['프랜차이즈', '베스트셀러', '가위바위보']);
    for (const language of ['sv', 'en', 'ja'] as const) expect(scheduledPool(KOREAN_V3_EPOCH, language)).toEqual(scheduledPool('2026-11-19', language));
    const saved = { date: '2026-11-19', language: 'ko' as const, answer: '프리스타일', guesses: [] };
    const result = submitGuess(saved, saved.answer);
    expect(result.round.answer).toBe(saved.answer);
    expect(hasWon(result.round)).toBe(true);
  });
  it('avoids repeats over a full cycle, across cycles and across the epoch boundary', () => {
    const seen = new Map<string, number>();
    const words: string[] = [];
    for (let day = -2; day < 240; day++) for (let slot = 0; slot < 3; slot++) {
      const date = new Date((dayNumber(KOREAN_V3_EPOCH) + day) * 864e5).toISOString().slice(0, 10);
      const round = newRound(date, 'ko', slot);
      const index = day * 3 + slot;
      const prior = seen.get(round.answer);
      if (prior !== undefined) expect(index - prior, round.answer).toBeGreaterThan(178);
      seen.set(round.answer, index);
      if (index >= 0 && index < 356) words.push(round.answer);
      expect(hasWon(submitGuess(round, round.answer).round)).toBe(true);
    }
    expect(new Set(words).size).toBe(356);
  });
  it('keeps all three assigned answers deterministic after an offline module restart', async () => {
    const before = [0, 1, 2].map(slot => newRound('2026-11-21', 'ko', slot).answer);
    expect(new Set(before).size).toBe(3);
    vi.resetModules();
    const restarted = await import('./engine');
    expect([0, 1, 2].map(slot => restarted.newRound('2026-11-21', 'ko', slot).answer)).toEqual(before);
  });
});
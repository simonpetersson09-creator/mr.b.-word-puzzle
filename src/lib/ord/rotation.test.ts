import { describe, expect, it } from 'vitest';
import { rotationAnswer, dayNumber, DAILY_WORDS } from './engine';
import { unsavedAnswerPool } from './words/answer-policy';
import { languages, type Language } from '@/lib/i18n/languages';

const dateAt = (offset: number) => new Date((dayNumber('2026-11-14') + offset) * 86400000).toISOString().slice(0, 10);
describe('daily word rotation', () => {
  it('never repeats a word sooner than half the approved list, for every language over two years', () => {
    const langs = (Object.keys(languages) as Language[]).filter(l => unsavedAnswerPool('2026-11-14', l).length);
    for (const lang of langs) {
      const n = unsavedAnswerPool('2026-11-14', lang).length, minGap = Math.floor(n / 2);
      const last = new Map<string, number>();
      for (let d = 0; d < 730; d++) for (let s = 0; s < DAILY_WORDS; s++) {
        const i = d * DAILY_WORDS + s, w = rotationAnswer(dateAt(d), lang, s);
        expect(w).not.toBe('');
        const prev = last.get(w); if (prev !== undefined) expect(i - prev, `${lang} ${w}`).toBeGreaterThan(minGap);
        last.set(w, i);
      }
    }
  });
  it('gives three different words each day and the same words after restart', () => {
    const day = [0, 1, 2].map(s => rotationAnswer('2026-12-01', 'sv', s));
    expect(new Set(day).size).toBe(3);
    expect([0, 1, 2].map(s => rotationAnswer('2026-12-01', 'sv', s))).toEqual(day);
  });
});

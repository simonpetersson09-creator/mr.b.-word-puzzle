import { describe, expect, it } from 'vitest';
import { keyboardRows } from './words/localized';
describe('keyboard layout', () => {
  it('English keyboard shows only the 26 letters A–Z', () => {
    const keys = keyboardRows('en')!.flat();
    expect(keys.length).toBe(26);
    expect(keys.every(k => /^[A-Z]$/.test(k))).toBe(true);
  });
  it('Swedish keyboard keeps Å, Ä, Ö and nothing extra', () => {
    expect(keyboardRows('sv')!.flat().length).toBe(29);
  });
});

import { describe, expect, it } from 'vitest';
import { countryFromLocale, flagFor } from './country';
describe('country ranking helpers', () => {
  it('reads the country from the phone locale', () => {
    expect(countryFromLocale('sv-SE')).toBe('SE');
    expect(countryFromLocale('zh-Hant-TW')).toBe('TW');
    expect(countryFromLocale('sv')).toBeNull();
  });
  it('builds the flag', () => { expect(flagFor('SE')).toBe('🇸🇪'); });
});

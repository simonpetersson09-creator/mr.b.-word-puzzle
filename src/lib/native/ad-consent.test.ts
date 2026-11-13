import { describe, it, expect } from 'vitest';
import { readAdConsentChoices } from './ad-consent';
describe('Saved Google purpose choices', () => {
  it('does not interpret an answered form as accepting every purpose', () => {
    expect(readAdConsentChoices('OBTAINED','1000')).toEqual({storage:'allowed',adProfile:'denied',useAdProfile:'denied'});
  });
  it('shows no invented choices when native data is missing or consent is not obtained', () => {
    expect(readAdConsentChoices('UNKNOWN','1111')).toEqual({storage:'unknown',adProfile:'unknown',useAdProfile:'unknown'});
    expect(readAdConsentChoices('OBTAINED',undefined)).toEqual({storage:'unknown',adProfile:'unknown',useAdProfile:'unknown'});
  });
});
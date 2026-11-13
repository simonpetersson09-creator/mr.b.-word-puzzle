import { expect, it } from 'vitest';
import { privacyOptionsRequired } from './privacy-status';
// @ts-expect-error native install patch is JavaScript
import { patchConsentEligibility } from '../../../scripts/consent-eligibility.mjs';
it('retains required privacy options when a refresh returns unknown or missing status', () => {
  expect(privacyOptionsRequired('REQUIRED', false)).toBe(true);
  expect(privacyOptionsRequired(undefined, true)).toBe(true);
  expect(privacyOptionsRequired('UNKNOWN', true)).toBe(true);
  expect(privacyOptionsRequired('NOT_REQUIRED', true)).toBe(false);
});
it('repairs the installed fallback to report the real UMP privacy requirement reproducibly', () => {
  const old = 'call.resolve(["canRequestAds": ConsentInformation.shared.canRequestAds])';
  const patched = patchConsentEligibility(old);
  expect(patched).toContain('information.privacyOptionsRequirementStatus');
  expect(patched).toContain('case .required: privacyStatus = "REQUIRED"');
  expect(patched).toContain('"privacyOptionsRequirementStatus": privacyStatus');
  expect(patchConsentEligibility(patched)).toBe(patched);
});
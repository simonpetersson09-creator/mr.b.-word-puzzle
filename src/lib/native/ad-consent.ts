export type ConsentChoice = 'allowed' | 'denied' | 'unknown';
export interface AdConsentChoices { storage: ConsentChoice; adProfile: ConsentChoice; useAdProfile: ConsentChoice }
// Answering a form does not mean accepting its purposes. Never infer vendor consent.
export function readAdConsentChoices(status: unknown, purposeConsents: unknown): AdConsentChoices {
  const bits = status === 'OBTAINED' && typeof purposeConsents === 'string' && /^[01]{4,}$/.test(purposeConsents) ? purposeConsents : '';
  const choice = (purpose: number): ConsentChoice => bits[purpose-1] === '1' ? 'allowed' : bits[purpose-1] === '0' ? 'denied' : 'unknown';
  return {storage:choice(1), adProfile:choice(3), useAdProfile:choice(4)};
}
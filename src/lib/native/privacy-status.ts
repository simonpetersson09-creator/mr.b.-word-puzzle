// Unknown/failed refresh must not remove previously required privacy access.
export function privacyOptionsRequired(status: string | undefined, previous: boolean): boolean {
  if (status === 'REQUIRED') return true;
  if (status === 'NOT_REQUIRED') return false;
  return previous;
}
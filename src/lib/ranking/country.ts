// Pure helpers: country code from a locale tag and its flag emoji.
export function countryFromLocale(tag: string | undefined | null): string | null {
  if (!tag) return null;
  const parts = tag.replace('_', '-').split('-');
  const region = parts.slice(1).find(p => /^[A-Za-z]{2}$/.test(p));
  return region ? region.toUpperCase() : null;
}
export const flagFor = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));

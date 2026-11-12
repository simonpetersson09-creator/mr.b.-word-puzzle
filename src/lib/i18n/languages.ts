export const languages = {
  sv:'Svenska', en:'English', no:'Norsk', da:'Dansk', fi:'Suomi', es:'Español', fr:'Français', it:'Italiano', de:'Deutsch',
  nl:'Nederlands', ca:'Català', ro:'Română', tr:'Türkçe', pl:'Polski', cs:'Čeština', sk:'Slovenčina', sl:'Slovenščina', hr:'Hrvatski', hu:'Magyar', pt:'Português', 'pt-BR':'Português (Brasil)',
  id:'Bahasa Indonesia', ms:'Bahasa Melayu', vi:'Tiếng Việt', el:'Ελληνικά', ru:'Русский', uk:'Українська', ja:'日本語', ko:'한국어', th:'ไทย', hi:'हिन्दी', bn:'বাংলা', gu:'ગુજરાતી', kn:'ಕನ್ನಡ', ml:'മലയാളം', mr:'मराठी', or:'ଓଡ଼ିଆ', pa:'ਪੰਜਾਬੀ', ta:'தமிழ்', te:'తెలుగు',
} as const;
export type Language = keyof typeof languages;
export function resolveLanguage(preferences: readonly string[]): Language {
  for (const preference of preferences) {
    const tag = preference.replace('_','-').toLowerCase();
    if (tag === 'pt-br' || tag.startsWith('pt-br-')) return 'pt-BR';
    const base = tag.split('-')[0];
    if (base === 'nb' || base === 'nn') return 'no';
    if (base && base in languages) return base as Language;
  }
  return 'en';
}
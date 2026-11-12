export const sv = {
  short: 'Skriv fem bokstäver först', unknown: 'Ordet finns inte i ordlistan', finished: 'Dagens runda är avslutad',
  guess: 'Gissa', rules: 'Så spelar du', stats: 'Din statistik', settings: 'Inställningar',
  sound: 'Ljud', haptics: 'Vibrationer', won: 'Snyggt spelat!', lost: 'Nytt ord, nya chanser',
  share: 'Dela resultat', copied: 'Resultatet är kopierat', storage: 'Det gick inte att spara på den här enheten.',
} as const;
export type TranslationKey = keyof typeof sv;
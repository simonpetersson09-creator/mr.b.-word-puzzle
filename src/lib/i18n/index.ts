import { sv, type TranslationKey } from './translations/sv';
// Same separate translation dictionaries and parameter-formatting convention as Ludo.
export const t = (key: TranslationKey, params?: Record<string, string | number>) => sv[key].replace(/\{(\w+)\}/g, (match, name) => params?.[name] !== undefined ? String(params[name]) : match);
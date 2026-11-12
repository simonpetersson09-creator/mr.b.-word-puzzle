import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { sv, type TranslationKey } from './translations/sv';
import { en } from './translations/en';
import catalog from './translations/catalog.json';
import { resolveLanguage, type Language } from './languages';
const dictionaries: Record<string,Partial<Record<TranslationKey,string>>> = catalog;
let current: Language = 'sv';
const listeners = new Set<() => void>();
export function setAppLanguage(language: Language) {
 current=language;
 if (typeof document !== 'undefined') document.documentElement.lang=language;
 listeners.forEach(listener=>listener());
}
export async function deviceLanguage(): Promise<Language> {
 if (Capacitor.isNativePlatform()) {
  try { const {Device}=await import('@capacitor/device'); const {value}=await Device.getLanguageTag(); return resolveLanguage([value]); } catch { /* Browser preferences remain available. */ }
 }
 return resolveLanguage(typeof navigator === 'undefined' ? ['sv'] : navigator.languages);
}
export const t = (key: TranslationKey, params?: Record<string,string|number>) => {
 const text=current==='sv' ? sv[key] : dictionaries[current]?.[key] ?? en[key];
 return text.replace(/\{(\w+)\}/g,(match,name)=>params?.[name]!==undefined ? String(params[name]) : match);
};
export function useTranslation() {
 const [language,setLanguage]=useState<Language>('sv');
 useEffect(()=>{const update=()=>setLanguage(current);listeners.add(update);update();return()=>{listeners.delete(update);};},[]);
 return {t,language};
}
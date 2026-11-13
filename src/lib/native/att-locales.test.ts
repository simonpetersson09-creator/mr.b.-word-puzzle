import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { languages } from '@/lib/i18n/languages';
it('packages native tracking explanations for all 40 app languages as localized resources', () => {
  const texts = JSON.parse(readFileSync('scripts/att-locales.json', 'utf8'));
  expect(Object.keys(texts).sort()).toEqual(Object.keys(languages).sort());
  const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
  for (const language of Object.keys(languages)) {
    const code = language === 'no' ? 'nb' : language;
    const path = `PermissionLocalizations/${code}.lproj/InfoPlist.strings`;
    expect(readFileSync(`ios/App/App/${path}`, 'utf8')).toContain(JSON.stringify(texts[language]));
    expect(project).toContain(path);
  }
  expect(project).toContain('InfoPlist.strings in Resources');
});
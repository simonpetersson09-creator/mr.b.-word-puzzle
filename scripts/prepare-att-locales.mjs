import { readFile, writeFile, mkdir } from 'node:fs/promises';
const locales = JSON.parse(await readFile(new URL('./att-locales.json', import.meta.url), 'utf8'));
for (const [language, text] of Object.entries(locales)) {
  // Apple's Norwegian localization identifier is nb; the UI registry uses no.
  const code = language === 'no' ? 'nb' : language;
  const path = `ios/App/App/PermissionLocalizations/${code}.lproj`;
  await mkdir(path, { recursive: true });
  await writeFile(`${path}/InfoPlist.strings`, `"NSUserTrackingUsageDescription" = ${JSON.stringify(text)};\n`);
}
console.log(`Prepared ${Object.keys(locales).length} native ATT localizations`);
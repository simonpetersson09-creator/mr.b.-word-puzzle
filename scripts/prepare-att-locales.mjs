import { readFile, writeFile, mkdir } from 'node:fs/promises';
const locales = JSON.parse(await readFile(new URL('./att-locales.json', import.meta.url), 'utf8'));
const references = [], children = [];
for (const [index, [language, text]] of Object.entries(locales).entries()) {
  // Apple's Norwegian localization identifier is nb; the UI registry uses no.
  const code = language === 'no' ? 'nb' : language;
  const path = `ios/App/App/PermissionLocalizations/${code}.lproj`;
  await mkdir(path, { recursive: true });
  await writeFile(`${path}/InfoPlist.strings`, `"NSUserTrackingUsageDescription" = ${JSON.stringify(text)};\n`);
  const id = `B0F${String(index).padStart(21, '0')}`;
  references.push(`        ${id} /* ${code} */ = {isa = PBXFileReference; lastKnownFileType = text.plist.strings; name = "${code}"; path = "PermissionLocalizations/${code}.lproj/InfoPlist.strings"; sourceTree = "<group>"; };`);
  children.push(`                ${id} /* ${code} */,`);
}
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
let project = await readFile(projectPath, 'utf8');
project = project.replace(/\n\/\* ATT_LOCALE_REFERENCES_BEGIN \*\/[\s\S]*?\/\* ATT_LOCALE_REFERENCES_END \*\//, '');
project = project.replace('/* Begin PBXFileReference section */', `/* Begin PBXFileReference section */\n/* ATT_LOCALE_REFERENCES_BEGIN */\n${references.join('\n')}\n/* ATT_LOCALE_REFERENCES_END */`);
const group = `        B0E000000000000000000002 /* InfoPlist.strings */ = {\n            isa = PBXVariantGroup;\n            children = (\n${children.join('\n')}\n            );\n            name = InfoPlist.strings;\n            sourceTree = "<group>";\n        };`;
project = project.replace(/        B0E000000000000000000002 \/\* PermissionLocalizations \*\/ = \{[^\n]+\};\n/, '');
project = project.replace(/\n        B0E000000000000000000002 \/\* InfoPlist.strings \*\/ = \{[\s\S]*?\n        \};/, '');
project = project.replace('/* Begin PBXVariantGroup section */', `/* Begin PBXVariantGroup section */\n${group}`);
project = project.replaceAll('/* PermissionLocalizations in Resources */', '/* InfoPlist.strings in Resources */').replaceAll('/* PermissionLocalizations */', '/* InfoPlist.strings */');
await writeFile(projectPath, project);
console.log(`Prepared ${Object.keys(locales).length} native ATT localizations`);
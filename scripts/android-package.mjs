import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = 'android/app/src/main/assets/public';
const sourceDirs = ['src', 'native-shell', 'scripts', 'resources/android', 'dist-native', publicDir];
const sourceFiles = ['android/app/src/main/assets/capacitor.config.json', 'android/app/src/main/assets/capacitor.plugins.json', 'android/app/build.gradle', 'android/build.gradle', 'android/variables.gradle', 'android/capacitor.settings.gradle', 'android/app/capacitor.build.gradle', 'android/app/src/main/AndroidManifest.xml', 'android/app/src/main/java/com/mrb/wordpuzzle/MainActivity.java', 'capacitor.config.ts', 'vite.native.config.ts', 'package.json', 'bun.lock'];

export function packageFiles(root = '.', dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? packageFiles(root, path) : [path];
  }).sort();
}
const sha = (root, path) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
export function androidPackageHashes(root = '.') {
  const paths = [...sourceDirs.flatMap(dir => packageFiles(root, dir)), ...sourceFiles].sort();
  return Object.fromEntries(paths.map(path => [path, sha(root, path)]));
}
export function verifyAndroidPackage(receipt, root = '.') {
  if (receipt.packageId !== 'com.mrb.wordpuzzle' || receipt.version !== 2) throw new Error('Android sync receipt missing or outdated; repeat native:sync:android');
  const config = JSON.parse(readFileSync(join(root, 'android/app/src/main/assets/capacitor.config.json'), 'utf8'));
  if (config.appId !== 'com.mrb.wordpuzzle' || config.appName !== 'Mr.B. Word Puzzle' || config.webDir !== 'dist-native' || config.server) throw new Error('Android must use com.mrb.wordpuzzle and the local dist-native bundle');
  const current = androidPackageHashes(root);
  if (JSON.stringify(Object.keys(current).sort()) !== JSON.stringify(Object.keys(receipt.hashes ?? {}).sort())) throw new Error('Android sync file set changed; repeat native:sync:android');
  for (const [path, hash] of Object.entries(current)) {
    if (receipt.hashes[path] !== hash) throw new Error(`Native package stale: ${path}; repeat native:sync:android`);
  }
  for (const path of packageFiles(root, 'dist-native')) {
    const copied = path.replace(/^dist-native\//, `${publicDir}/`);
    if (sha(root, path) !== sha(root, copied)) throw new Error(`Offline Android bundle mismatch: ${path}`);
  }
  const sourceAssets = packageFiles(root, 'dist-native/assets').map(path => path.slice('dist-native/assets/'.length));
  const copiedAssets = packageFiles(root, `${publicDir}/assets`).map(path => path.slice(`${publicDir}/assets/`.length));
  if (JSON.stringify(sourceAssets) !== JSON.stringify(copiedAssets)) throw new Error('Offline Android assets contain stale files');
}
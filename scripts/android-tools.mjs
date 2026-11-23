import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function runNode(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Android preparation failed (${args[0]}, exit ${result.status})`);
}
export function checkNode(version = process.versions.node) {
  const [major = 0, minor = 0] = version.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error('Node 22.12+ required by Vite and Capacitor.');
}
export function checkAndroidBuildMode(action, release) {
  if (action === 'build' && release) throw new Error('native:build:android creates a test APK; use native:bundle:android for release.');
}
export function javaMajor(output) {
  return Number(output.match(/(?:openjdk|java) version "(\d+)/)?.[1] ?? 0);
}
export function localSdk(properties) {
  return properties.match(/^sdk\.dir\s*=\s*(.+)$/m)?.[1]?.trim().replace(/\\([\\: =])/g, '$1');
}
export function androidEnvironment(env = process.env, root = projectRoot, platform = process.platform, home = homedir()) {
  checkNode();
  const next = { ...env };
  const properties = join(root, 'android/local.properties');
  const local = existsSync(properties) ? localSdk(readFileSync(properties, 'utf8')) : undefined;
  const sdk = local || env.ANDROID_HOME || env.ANDROID_SDK_ROOT ||
    (platform === 'darwin' ? join(home, 'Library/Android/sdk') : platform === 'win32' ? join(env.LOCALAPPDATA || home, 'Android/Sdk') : join(home, 'Android/Sdk'));
  if (env.ANDROID_HOME && env.ANDROID_SDK_ROOT && resolve(env.ANDROID_HOME) !== resolve(env.ANDROID_SDK_ROOT)) throw new Error('ANDROID_HOME and ANDROID_SDK_ROOT disagree. Select the same SDK in both.');
  if (local && env.ANDROID_HOME && resolve(local) !== resolve(env.ANDROID_HOME)) throw new Error('android/local.properties and ANDROID_HOME disagree. Select the same SDK in Android Studio and terminal.');
  for (const path of ['platforms/android-36/android.jar', 'build-tools/36.0.0/source.properties', 'platform-tools/adb' + (platform === 'win32' ? '.exe' : '')]) {
    if (!existsSync(join(sdk, path))) throw new Error(`Android SDK incomplete: ${path}. Install Platform 36, Build Tools 36.0.0 and Platform Tools in Android Studio (SDK Manager).`);
  }
  next.ANDROID_HOME = sdk;
  next.ANDROID_SDK_ROOT = sdk;
  if (!next.JAVA_HOME && platform === 'darwin') {
    const found = spawnSync('/usr/libexec/java_home', ['-v', '21'], { encoding: 'utf8' });
    if (found.status === 0) next.JAVA_HOME = found.stdout.trim();
  }
  const java = next.JAVA_HOME ? join(next.JAVA_HOME, 'bin', platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const result = spawnSync(java, ['-version'], { encoding: 'utf8', env: next });
  if (result.error || result.status !== 0 || javaMajor(result.stderr + result.stdout) !== 21) throw new Error('Select JDK 21 with JAVA_HOME (and Gradle JDK 21 in Android Studio).');
  return next;
}
export function runGradle(task, env) {
  const command = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const result = spawnSync(command, [task], { cwd: join(projectRoot, 'android'), env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Gradle ${task} failed (exit ${result.status}).`);
}
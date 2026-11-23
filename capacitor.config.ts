import type { CapacitorConfig } from '@capacitor/cli';
// Ludo/Sudoku local-bundle pattern, with Ord's separate identity and no online dependency.
const config: CapacitorConfig = {
  appId: 'se.shiningdays.mrbwordpuzzle',
  appName: 'Mr.B. Word Puzzle',
  webDir: 'dist-native',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false },
};
// Capacitor loads one shared config: explicit CLI targets must override inherited env.
export function nativePlatform(args: string[], platform?: string): 'android' | 'ios' {
  const command = args[2];
  const executable = args[1]?.replace(/\\/g, '/').split('/').pop() ?? '';
  if (/^(cap|capacitor)(\.js)?$/.test(executable) && ['sync', 'copy', 'update', 'add', 'open', 'run', 'build'].includes(command ?? '')) {
    if (args[3] === 'android' || args[3] === 'ios') return args[3];
    throw new Error('Choose a platform explicitly: cap ' + command + ' android or ios.');
  }
  return platform === 'android' ? 'android' : 'ios';
}
if (nativePlatform(process.argv, process.env['MRB_NATIVE_PLATFORM']) === 'android') {
  config.appId = 'com.mrb.wordpuzzle';
  config.plugins = { SystemBars: { insetsHandling: 'native', style: 'DARK' } };
}
export default config;
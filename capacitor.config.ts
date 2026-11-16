import type { CapacitorConfig } from '@capacitor/cli';
// Ludo/Sudoku local-bundle pattern, with Ord's separate identity and no online dependency.
const config: CapacitorConfig = {
  appId: 'se.shiningdays.mrbwordpuzzle',
  appName: 'Mr.B. Word Puzzle',
  webDir: 'dist-native',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false },
};
// Only Android commands set this; iOS's identity and configuration stay unchanged.
if (process.env.MRB_NATIVE_PLATFORM === 'android') {
  config.appId = 'com.mrb.wordpuzzle';
  config.plugins = { SystemBars: { insetsHandling: 'css', style: 'DARK' } };
}
export default config;
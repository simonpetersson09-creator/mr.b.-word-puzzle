import type { CapacitorConfig } from '@capacitor/cli';
// Ludo/Sudoku local-bundle pattern, with Ord's separate identity and no online dependency.
const config: CapacitorConfig = {
  appId: process.env.MRB_NATIVE_PLATFORM === 'android' ? 'com.mrb.wordpuzzle' : 'se.shiningdays.mrbwordpuzzle',
  appName: 'Mr.B. Word Puzzle',
  webDir: 'dist-native',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false },
};
export default config;